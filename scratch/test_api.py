import requests
import json

session = requests.Session()

# 1. Login to get session cookie
login_url = "http://127.0.0.1:8000/api/auth/login"
login_payload = {
    "email": "google.traveler@gmail.com",
    "password": "oauth_google_verified_simulated"
}
login_res = session.post(login_url, json=login_payload)
print("Login status:", login_res.status_code)
if login_res.status_code == 200:
    print("Logged in successfully.")
else:
    print("Login response:", login_res.text)

# 2. Call plan-trip API
plan_url = "http://127.0.0.1:8000/api/plan-trip"
plan_payload = {
    "start_location": "Bhubaneswar",
    "destination": "Bhubaneswar",
    "days": 5,
    "travelers": 2,
    "budget_category": "medium",
    "vehicle_preference": "auto",
    "api_key": None
}
plan_res = session.post(plan_url, json=plan_payload)
print("Plan-trip status:", plan_res.status_code)
if plan_res.status_code == 200:
    data = plan_res.json()
    print("Keys in response:", data.keys())
    print("\nhotels type:", type(data.get("hotels")))
    print("hotels count:", len(data.get("hotels", [])))
    if data.get("hotels"):
        print("First hotel sample:", data["hotels"][0])
    
    print("\nhotels_by_category keys:", data.get("hotels_by_category", {}).keys())
    for cat in data.get("hotels_by_category", {}):
        print(f" - {cat} count:", len(data["hotels_by_category"][cat]))
        if data["hotels_by_category"][cat]:
            print(f"   Sample {cat} hotel:", data["hotels_by_category"][cat][0])
else:
    print("Plan-trip response:", plan_res.text)
