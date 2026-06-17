from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.core.database import get_db_connection
import json

router = APIRouter(prefix="/api/trips", tags=["trips"])

class TripSaveRequest(BaseModel):
    start_location: str
    destination: str
    days: int
    travelers: int
    budget_category: str
    total_cost: int
    cost_breakdown: dict
    ai_response: str

@router.post("/save")
async def save_trip(request: Request, body: TripSaveRequest):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please login.")
        
    start_loc = body.start_location.strip()
    dest = body.destination.strip()
    days = int(body.days)
    travelers = int(body.travelers)
    budget_cat = body.budget_category
    total_cost = int(body.total_cost)
    cost_breakdown = json.dumps(body.cost_breakdown)
    ai_response = body.ai_response
    
    if not start_loc or not dest or not ai_response:
        raise HTTPException(status_code=400, detail="Missing itinerary specifications.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO trips (user_id, start_location, destination, days, travelers, budget_category, total_cost, cost_breakdown, ai_response)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, start_loc, dest, days, travelers, budget_cat, total_cost, cost_breakdown, ai_response))
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Trip itinerary saved successfully!"}

@router.get("/list")
async def list_trips(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please login.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, start_location, destination, days, travelers, budget_category, total_cost, cost_breakdown, ai_response, saved_at 
        FROM trips WHERE user_id = ? ORDER BY saved_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    trips = []
    for r in rows:
        trips.append({
            "id": r["id"],
            "start_location": r["start_location"],
            "destination": r["destination"],
            "days": r["days"],
            "travelers": r["travelers"],
            "budget_category": r["budget_category"],
            "total_cost": r["total_cost"],
            "cost_breakdown": json.loads(r["cost_breakdown"]),
            "ai_response": r["ai_response"],
            "saved_at": r["saved_at"]
        })
    return {"success": True, "trips": trips}

@router.delete("/{trip_id}")
async def delete_trip(request: Request, trip_id: int):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please login.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trips WHERE id = ? AND user_id = ?", (trip_id, user_id))
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Trip successfully deleted!"}

from app.services.travel_api import TravelAPIClient
travel_client = TravelAPIClient()

@router.get("/live-hotels")
async def get_live_hotels(destination: str, budget_category: str):
    """
    Endpoint to dynamically fetch real-time hotels in any city globally using the Travel API client.
    """
    try:
        hotels = travel_client.fetch_live_hotels(destination, budget_category)
        return {"success": True, "hotels": hotels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/autocomplete")
async def autocomplete_cities(q: str):
    """
    Provides dynamic autocomplete suggestions for all states, UTs, and cities/districts in India.
    Matches locally seeded lists first, then queries Nominatim with SQLite caching.
    """
    if not q or len(q.strip()) < 2:
        return {"success": True, "suggestions": []}
        
    query_clean = q.strip().lower()
    
    # 1. Initialize cache table dynamically if not exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS autocomplete_cache (
            query TEXT PRIMARY KEY,
            results TEXT, -- JSON string array
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    # 2. Check local database cache
    cursor.execute("SELECT results FROM autocomplete_cache WHERE query = ?", (query_clean,))
    row = cursor.fetchone()
    if row:
        conn.close()
        return {"success": True, "suggestions": json.loads(row["results"])}
        
    # 3. Pre-seeded list of all Indian states, Union Territories, and major cities/towns
    local_cities_states = [
        # States
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
        "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
        "Uttarakhand", "West Bengal",
        # Union Territories
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
        # Major Cities/Districts/Tourism Hubs
        "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai", "Ahmedabad", "Hyderabad", "Pune", 
        "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", 
        "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", 
        "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", 
        "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", 
        "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", 
        "Madurai", "Raipur", "Kota", "Guwahati", "Solapur", "Hubli-Dharwad", 
        "Bareilly", "Moradabad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli", 
        "Bhubaneswar", "Salem", "Mira-Bhayandar", "Warangal", "Guntur", "Bhiwandi", "Saharanpur", 
        "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", 
        "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded", 
        "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Jhansi", 
        "Ulhasnagar", "Jammu", "Mangalore", "Belgaum", "Gaya", "Tirunelveli", 
        "Malegaon", "Jalgaon", "Udaipur", "Maheshtala", "Davanagere", "Kozhikode", 
        "Kurnool", "Rajahmundry", "Bokaro Steel City", "South Dumdum", 
        "Bellary", "Patiala", "Gopalpur", "Agartala", "Bhagalpur", "Muzaffarnagar", "Bhatpara", 
        "Panihati", "Latur", "Dhule", "Rohtak", "Sagar", "Korba", "Bhilwara", "Baharampur", 
        "Muzaffarpur", "Ahmednagar", "Kollam", "Avadi", "Kadapa", "Kamarhati", "Bilaspur", 
        "Shahjahanpur", "Bijapur", "Rampur", "Shivamogga", "Shimoga", "Chandrapur", "Junagadh", 
        "Thrissur", "Alwar", "Bardhaman", "Kulti", "Kakinada", "Nizampet", "Eluru", "Ghazipur",
        "Silchar", "Tezpur", "Jorhat", "Dibrugarh", "Nagaon", "Tinsukia", "Bongaigaon",
        "Darjeeling", "Kalimpong", "Kurseong", "Siliguri", "Gangtok", "Namchi", "Gyalshing",
        "Mangan", "Shillong", "Tura", "Jowai", "Kohima", "Dimapur", "Mokokchung", "Imphal",
        "Thoubal", "Ukhrul", "Aizawl", "Lunglei", "Champhai", "Itanagar", "Tawang", "Ziro",
        "Pasighat", "Bomdila", "Ayodhya", "Mathura", "Vrindavan", "Haridwar", "Rishikesh",
        "Dharamshala", "Manali", "Shimla", "Kullu", "Dalhousie", "Chamba", "Spiti", "Lahaul",
        "Ooty", "Kodaikanal", "Coorg", "Madikeri", "Chikmagalur", "Hampi", "Hospet", "Badami"
    ]
    
    suggestions = []
    
    # 4. Search local list for prefix matches
    for item in local_cities_states:
        if item.lower().startswith(query_clean):
            suggestions.append(item)
            
    # 5. Search local list for substring matches
    for item in local_cities_states:
        if query_clean in item.lower() and item not in suggestions:
            suggestions.append(item)
            
    # If we have plenty of matches locally, return them to avoid hitting Nominatim API
    if len(suggestions) >= 8:
        suggestions = suggestions[:10]
        cursor.execute("INSERT OR REPLACE INTO autocomplete_cache (query, results) VALUES (?, ?)", (query_clean, json.dumps(suggestions)))
        conn.commit()
        conn.close()
        return {"success": True, "suggestions": suggestions}
        
    # 6. Fallback: Query Nominatim for live suggestions in India
    import requests
    import urllib.parse
    headers = {"User-Agent": "IndiaTourPlannerAI/2.0.0 (contact: google.traveler@gmail.com)"}
    encoded = urllib.parse.quote(q)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&countrycodes=in&limit=10&addressdetails=1"
    
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            results = res.json()
            for item in results:
                addr = item.get("address", {})
                place_name = (
                    addr.get("city") or 
                    addr.get("town") or 
                    addr.get("village") or 
                    addr.get("suburb") or 
                    addr.get("municipality") or 
                    addr.get("county") or
                    item.get("display_name").split(",")[0]
                )
                state = addr.get("state")
                if place_name and state:
                    full_suggestion = f"{place_name}, {state}"
                    if full_suggestion not in suggestions:
                        suggestions.append(full_suggestion)
                elif place_name:
                    full_suggestion = place_name
                    if full_suggestion not in suggestions:
                        suggestions.append(full_suggestion)
    except Exception as e:
        print(f"Error calling Nominatim suggestions for {q}: {e}")
        
    # Limit to top 10 and save to database cache
    suggestions = suggestions[:10]
    cursor.execute("INSERT OR REPLACE INTO autocomplete_cache (query, results) VALUES (?, ?)", (query_clean, json.dumps(suggestions)))
    conn.commit()
    conn.close()
    return {"success": True, "suggestions": suggestions}


