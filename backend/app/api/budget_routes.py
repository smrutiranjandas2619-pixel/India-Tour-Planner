from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.utils.cost_estimator import calculate_trip_expenses
import json
import os

router = APIRouter(prefix="/api/budget", tags=["budget"])

# Resolve dynamic paths for data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_JSON_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data/seed_data.json"))

class EstimateRequest(BaseModel):
    destination: str
    days: int = 3
    travelers: int = 1
    budget_category: str = "medium"
    vehicle_preference: str = "auto"

@router.post("/estimate")
async def estimate_budget(body: EstimateRequest):
    """Exposes direct calculations for mathematical budget tracking."""
    if not os.path.exists(DB_JSON_PATH):
        raise HTTPException(status_code=500, detail="Database seeds missing.")
        
    with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
        db_data = json.load(f)
        
    result = calculate_trip_expenses(
        destination=body.destination,
        days=body.days,
        travelers=body.travelers,
        budget_cat=body.budget_category.lower(),
        vehicle_pref=body.vehicle_preference.lower(),
        db_data=db_data
    )
    return {"success": True, "breakdown": result}
