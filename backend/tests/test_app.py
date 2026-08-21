import os
import sys
import pytest
import sqlite3
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(base_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Override environment variables for test safety
os.environ["TURSO_DATABASE_URL"] = ""
os.environ["TURSO_AUTH_TOKEN"] = ""

# Mock database module before importing app
import app.core.database
TEST_DB_PATH = "test_india_tour_planner.db"

def mock_get_db_connection():
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

app.core.database.get_db_connection = mock_get_db_connection

# Initialize the test database schema
app.core.database.init_db()

from app.main import app as fastapi_app

@pytest.fixture
def client():
    # Use a fresh client for each test to avoid session/cookie pollution
    with TestClient(fastapi_app) as c:
        yield c

@pytest.fixture(autouse=True)
def clean_db():
    # Clean users and trips tables before each test to ensure isolation
    conn = mock_get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM trips")
    conn.commit()
    conn.close()
    yield

def test_user_auth_flow(client):
    # 1. Test signup
    signup_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 2. Test signup with duplicate email
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

    # 3. Test login with correct credentials
    login_data = {
        "email": "test@example.com",
        "password": "securepassword123"
    }
    res = client.post("/api/auth/login", json=login_data)
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert res.json()["user"]["email"] == "test@example.com"

    # 4. Test getting profile when authenticated (client keeps cookies automatically)
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["user"]["name"] == "Test User"

    # 5. Test login with incorrect credentials (use a separate test client or log out first if needed)
    # Actually we can just try logging in with incorrect credentials
    bad_login_data = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    res_bad = client.post("/api/auth/login", json=bad_login_data)
    assert res_bad.status_code == 401

    # 6. Test logout
    res = client.post("/api/auth/logout")
    assert res.status_code == 200

    # 7. Test getting profile after logout (should be 401)
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_trip_generation_unauthorized(client):
    # Test trip generation without being authenticated
    trip_data = {
        "start_location": "Delhi",
        "destination": "Goa",
        "days": 3,
        "travelers": 2,
        "budget_category": "medium",
        "vehicle_preference": "auto",
        "query": "",
        "api_key": ""
    }
    res = client.post("/api/plan-trip", json=trip_data)
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]


def test_trip_generation_happy_path(client, monkeypatch):
    # 1. Sign up and log in to get session cookie
    client.post("/api/auth/signup", json={
        "name": "Traveller",
        "email": "travel@example.com",
        "password": "pass"
    })
    client.post("/api/auth/login", json={
        "email": "travel@example.com",
        "password": "pass"
    })

    # 2. Mock RAGEngine.generate_response to avoid hitting external APIs
    from app.rag.rag_engine import RAGEngine
    def mock_generate_response(self, prompt_type, user_query, api_key, budget_details=None, chat_history=None):
        return "Mocked Travel Itinerary: Day 1: Visit beaches."
    
    monkeypatch.setattr(RAGEngine, "generate_response", mock_generate_response)

    # 3. Request trip planning
    trip_payload = {
        "start_location": "Delhi",
        "destination": "Goa",
        "days": 4,
        "travelers": 2,
        "budget_category": "medium",
        "vehicle_preference": "car",
        "query": "beaches",
        "api_key": "dummy_key"
    }
    res = client.post("/api/plan-trip", json=trip_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Mocked Travel Itinerary" in data["ai_response"]
    assert "costs" in data
    assert "total_estimated" in data["costs"]


def test_trip_generation_validation_failure(client):
    # Log in
    client.post("/api/auth/signup", json={
        "name": "Traveller",
        "email": "travel@example.com",
        "password": "pass"
    })
    client.post("/api/auth/login", json={
        "email": "travel@example.com",
        "password": "pass"
    })

    # Send invalid type for days parameter to trigger validation error
    bad_payload = {
        "start_location": "Delhi",
        "destination": "Goa",
        "days": "not-an-integer",
        "travelers": 2,
        "budget_category": "medium"
    }
    res = client.post("/api/plan-trip", json=bad_payload)
    assert res.status_code == 422 # Unprocessable Entity (validation error)
