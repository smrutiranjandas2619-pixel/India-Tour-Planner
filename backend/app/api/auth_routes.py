from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db_connection
from app.core.security import hash_password
import sqlite3
import os
import requests

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(request: SignupRequest):
    name = request.name.strip()
    email = request.email.strip().lower()
    password = request.password
    
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="All fields are required.")
        
    hashed = hash_password(password)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, hashed))
        conn.commit()
        conn.close()
        return {"success": True, "message": "User registered successfully!"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(req_body: LoginRequest, request: Request):
    import traceback
    import os
    try:
        email = req_body.email.strip().lower()
        password = req_body.password
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required.")
            
        hashed = hash_password(password)
        
        # Auto-provision simulated Google OAuth account on first-time click
        if email == "google.traveler@gmail.com" and password == "oauth_google_verified_simulated":
          try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if not user:
              cursor.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                ("Google Traveler", email, hashed)
              )
              conn.commit()
            conn.close()
          except Exception as e:
            print(f"Simulated OAuth provisioning failed: {e}")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, phone_number, avatar FROM users WHERE email = ? AND password = ?", (email, hashed))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            request.session["user_id"] = user["id"]
            request.session["user_name"] = user["name"]
            request.session["user_email"] = user["email"]
            request.session["user_phone"] = user["phone_number"]
            request.session["user_avatar"] = user["avatar"]
            return {
                "success": True,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "phone_number": user["phone_number"],
                    "avatar": user["avatar"]
                }
            }
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    except Exception as e:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        log_dir = os.path.abspath(os.path.join(base_dir, "../../logs"))
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "error_log.txt")
        with open(log_path, "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)
        raise e


class UpdateNameRequest(BaseModel):
    name: str

@router.post("/update-name")
async def update_name(req_body: UpdateNameRequest, request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please login.")
    
    new_name = req_body.name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (new_name, user_id))
        conn.commit()
        conn.close()
        
        request.session["user_name"] = new_name
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": new_name,
                "email": request.session.get("user_email"),
                "phone_number": request.session.get("user_phone"),
                "avatar": request.session.get("user_avatar")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateAvatarRequest(BaseModel):
    avatar: str

@router.post("/update-avatar")
async def update_avatar(req_body: UpdateAvatarRequest, request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please login.")
    
    avatar_data = req_body.avatar.strip()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET avatar = ? WHERE id = ?", (avatar_data, user_id))
        conn.commit()
        conn.close()
        
        request.session["user_avatar"] = avatar_data
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": request.session.get("user_name"),
                "email": request.session.get("user_email"),
                "phone_number": request.session.get("user_phone"),
                "avatar": avatar_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"success": True, "message": "Logged out successfully!"}

@router.get("/me")
async def get_me(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please login.")
    return {
        "success": True,
        "user": {
            "id": user_id,
            "name": request.session.get("user_name"),
            "email": request.session.get("user_email"),
            "phone_number": request.session.get("user_phone"),
            "avatar": request.session.get("user_avatar")
        }
    }

class PhoneSignupRequest(BaseModel):
    name: str
    idToken: str

class PhoneLoginRequest(BaseModel):
    idToken: str

def verify_firebase_id_token(id_token: str) -> str:
    """
    Verifies the Firebase ID token by calling Google's Identity Toolkit REST API.
    Returns the verified phone number on success, or raises an HTTPException on failure.
    """
    # Dynamic developer fallback to support demo workflow testing
    if id_token.startswith("simulated_dummy_token"):
        parts = id_token.split(":")
        return parts[1] if len(parts) > 1 else "+919999999999"

    firebase_key = os.environ.get("FIREBASE_API_KEY")
    if not firebase_key:
        firebase_key = os.environ.get("VITE_FIREBASE_API_KEY")
        
    if not firebase_key or "your_firebase" in firebase_key:
        raise HTTPException(
            status_code=400,
            detail="Firebase API Key is not configured on the backend server. Please update backend/.env or use the Phone tab's inline demo mode."
        )
        
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={firebase_key}"
    headers = {"Content-Type": "application/json"}
    body = {"idToken": id_token}
    
    try:
        res = requests.post(url, headers=headers, json=body, timeout=8)
        if res.status_code != 200:
            err_detail = "Invalid or expired verification code."
            try:
                err_detail = res.json().get("error", {}).get("message", err_detail)
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=f"Firebase verification failed: {err_detail}")
            
        data = res.json()
        users = data.get("users", [])
        if not users:
            raise HTTPException(status_code=400, detail="Verification token did not match any user profile.")
            
        phone_number = users[0].get("phoneNumber")
        if not phone_number:
            raise HTTPException(status_code=400, detail="Token verified successfully, but no phone number was found associated with it.")
            
        return phone_number
    except requests.RequestException as req_err:
        raise HTTPException(status_code=500, detail=f"Network error verifying verification code: {str(req_err)}")

@router.post("/phone-signup")
async def phone_signup(body: PhoneSignupRequest, request: Request):
    name = body.name.strip()
    id_token = body.idToken.strip()
    
    if not name or not id_token:
        raise HTTPException(status_code=400, detail="Name and verification code token are required.")
        
    phone_number = verify_firebase_id_token(id_token)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM users WHERE phone_number = ?", (phone_number,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="An account with this phone number already exists. Please log in instead."
            )
            
        cursor.execute(
            "INSERT INTO users (name, phone_number, auth_provider, is_phone_verified) VALUES (?, ?, ?, 1)",
            (name, phone_number, "phone")
        )
        conn.commit()
        
        cursor.execute("SELECT id, name, phone_number, avatar FROM users WHERE phone_number = ?", (phone_number,))
        user = cursor.fetchone()
        conn.close()
        
        request.session["user_id"] = user["id"]
        request.session["user_name"] = user["name"]
        request.session["user_email"] = None
        request.session["user_phone"] = user["phone_number"]
        request.session["user_avatar"] = user["avatar"]
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": None,
                "phone_number": user["phone_number"],
                "avatar": user["avatar"]
            }
        }
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this phone number already exists.")
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/phone-login")
async def phone_login(body: PhoneLoginRequest, request: Request):
    id_token = body.idToken.strip()
    if not id_token:
        raise HTTPException(status_code=400, detail="Verification code token is required.")
        
    phone_number = verify_firebase_id_token(id_token)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, name, phone_number, avatar FROM users WHERE phone_number = ?", (phone_number,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(
                status_code=400,
                detail="No account found with this phone number. Please sign up first to create an account."
            )
            
        request.session["user_id"] = user["id"]
        request.session["user_name"] = user["name"]
        request.session["user_email"] = None
        request.session["user_phone"] = user["phone_number"]
        request.session["user_avatar"] = user["avatar"]
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": None,
                "phone_number": user["phone_number"],
                "avatar": user["avatar"]
            }
        }
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))


class GoogleLoginRequest(BaseModel):
    idToken: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None

@router.post("/google-login")
async def google_login(body: GoogleLoginRequest, request: Request):
    id_token = body.idToken.strip()
    
    # Check if we are in simulated/demo mode
    is_simulated = id_token.startswith("simulated_dummy_token") or not id_token
    
    if is_simulated:
        email = body.email.strip().lower() if body.email else "google.traveler@gmail.com"
        name = body.name.strip() if body.name else "Google Traveler"
        avatar = body.avatar.strip() if body.avatar else None
    else:
        # Verify the actual Firebase ID token
        firebase_key = os.environ.get("FIREBASE_API_KEY")
        if not firebase_key:
            firebase_key = os.environ.get("VITE_FIREBASE_API_KEY")
            
        if not firebase_key or "your_firebase" in firebase_key:
            raise HTTPException(
                status_code=400,
                detail="Firebase API Key is not configured on the backend server. Google authentication token lookup is disabled."
            )
            
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={firebase_key}"
        headers = {"Content-Type": "application/json"}
        json_body = {"idToken": id_token}
        
        try:
            res = requests.post(url, headers=headers, json=json_body, timeout=8)
            if res.status_code != 200:
                err_detail = "Invalid or expired Google Auth token."
                try:
                    err_detail = res.json().get("error", {}).get("message", err_detail)
                except Exception:
                    pass
                raise HTTPException(status_code=400, detail=f"Firebase verification failed: {err_detail}")
                
            data = res.json()
            users = data.get("users", [])
            if not users:
                raise HTTPException(status_code=400, detail="Verification token did not match any user profile.")
                
            user_data = users[0]
            email = user_data.get("email").strip().lower()
            name = user_data.get("displayName", "").strip() or email.split('@')[0]
            avatar = user_data.get("photoUrl")
        except requests.RequestException as req_err:
            raise HTTPException(status_code=500, detail=f"Network error verifying token: {str(req_err)}")

    if not email:
        raise HTTPException(status_code=400, detail="Email is required for Google account provisioning.")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if the user already exists by email
        cursor.execute("SELECT id, name, email, phone_number, avatar FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            # Provision new Google authenticated user
            cursor.execute(
                "INSERT INTO users (name, email, password, avatar, auth_provider) VALUES (?, ?, ?, ?, ?)",
                (name, email, "oauth_google_verified_simulated", avatar, "google")
            )
            conn.commit()
            
            # Fetch the newly created user
            cursor.execute("SELECT id, name, email, phone_number, avatar FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            
        conn.close()
        
        # Start the session
        request.session["user_id"] = user["id"]
        request.session["user_name"] = user["name"]
        request.session["user_email"] = user["email"]
        request.session["user_phone"] = user["phone_number"]
        request.session["user_avatar"] = user["avatar"]
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "phone_number": user["phone_number"],
                "avatar": user["avatar"]
            }
        }
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))

