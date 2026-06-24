import requests
import json

def test_key():
    api_key = "AIzaSyDL3UjG4TNfiat3NOEL4qmbVd1Xmwvf3KQ"
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = {"email": "test@example.com", "password": "password123", "returnSecureToken": True}
    
    print("Sending request to Google Identity Toolkit...")
    try:
        res = requests.post(url, headers=headers, json=body, timeout=10)
        print(f"Status Code: {res.status_code}")
        print("Response headers:")
        for k, v in res.headers.items():
            print(f"  {k}: {v}")
        print("\nResponse body:")
        print(res.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_key()
