from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(prefix="/api/foods", tags=["foods"])

# Resolve dynamic paths for data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_JSON_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data/seed_data.json"))

@router.get("/{state_key}")
async def get_famous_foods(state_key: str):
    """Retrieves famous regional dishes from seed databases."""
    if not os.path.exists(DB_JSON_PATH):
        raise HTTPException(status_code=500, detail="Database seeds missing.")
        
    with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
        db_data = json.load(f)
        
    state_data = db_data.get("states", {}).get(state_key.strip().lower())
    if not state_data:
        raise HTTPException(status_code=404, detail=f"State '{state_key}' not found in database.")
        
    return {"success": True, "state": state_data["name"], "famous_foods": state_data.get("famous_foods", [])}
