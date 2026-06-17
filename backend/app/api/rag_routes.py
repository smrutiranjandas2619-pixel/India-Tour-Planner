import os
import json
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.rag.rag_engine import RAGEngine
from app.utils.cost_estimator import calculate_trip_expenses

router = APIRouter(tags=["rag"])

# Resolve dynamic paths for travel database and vector store
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_JSON_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data/seed_data.json"))
VECTOR_DB_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data/vector_store.json"))

rag_engine = RAGEngine(
    db_json_path=DB_JSON_PATH,
    vector_db_path=VECTOR_DB_PATH
)

# Seed vector database on startup
try:
    rag_engine.initialize_store(api_key=None, force_rebuild=False)
except Exception as e:
    print(f"Failed to seed vector store on startup: {e}")

class PlanTripRequest(BaseModel):
    start_location: str = "Delhi"
    destination: str = "Goa"
    days: int = 5
    travelers: int = 2
    budget_category: str = "medium"
    vehicle_preference: str = "auto"
    query: str = ""
    api_key: str = None

class ChatRequest(BaseModel):
    query: str
    history: list = []
    api_key: str = None
    trip_context: dict = None

@router.post("/api/plan-trip")
async def plan_trip(request: Request, body: PlanTripRequest):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Please sign up or log in first.")
        
    start_location = body.start_location
    destination = body.destination
    days = int(body.days)
    travelers = int(body.travelers)
    budget_category = body.budget_category
    vehicle_preference = body.vehicle_preference
    query = body.query
    api_key = body.api_key
    
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GROQ_API_KEY") or ""
        
    if not os.path.exists(DB_JSON_PATH):
        raise HTTPException(status_code=500, detail="Database file seed_data.json missing.")
        
    with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
        db_data = json.load(f)
        
    planning_result = calculate_trip_expenses(
        destination=destination,
        days=days,
        travelers=travelers,
        budget_cat=budget_category.lower(),
        vehicle_pref=vehicle_preference.lower(),
        db_data=db_data
    )
    
    # Overwrite static hotels and restaurants with cached/live suggestions
    try:
        from app.services.hotel_restaurant_service import HotelRestaurantService
        hotel_service = HotelRestaurantService()
        hotels, restaurants = hotel_service.search_hotels_and_restaurants(destination)
        if hotels:
            # Active budget category hotels for backward compatibility
            planning_result["hotels"] = hotels.get(budget_category.lower(), [])
            planning_result["hotels_by_category"] = hotels
            planning_result["restaurants"] = restaurants
    except Exception as e:
        print(f"Error fetching live hotels and restaurants in plan_trip: {e}")


    
    ai_prompt_query = (
        f"Create a detailed travel route and {days}-day itinerary from {start_location} to {destination}. "
        f"Budget category is {budget_category} with {travelers} travelers. "
        f"Specific user preferences: {query}"
    )
    
    ai_response_markdown = ""
    if api_key:
        try:
            rag_engine.initialize_store(api_key=api_key)
            budget_details = {
                "travelers": travelers,
                "days": days,
                "start_location": start_location,
                "destination": destination,
                "budget_category": budget_category
            }
            ai_response_markdown = rag_engine.generate_response(
                prompt_type="plan",
                user_query=ai_prompt_query,
                api_key=api_key,
                budget_details=budget_details
            )
        except Exception as e:
            ai_response_markdown = f"### ⚠️ RAG Synthesis Error\nCould not trigger AI pipeline: {str(e)}"
    else:
        ai_response_markdown = (
            "### 🗺️ AI Travel Consultant Recommendations\n"
            "To generate your full customized day-by-day optimized travel routes, local hidden tips, "
            "and food recommendations via our real-time **Gemini AI RAG pipeline**, please configure "
            "your **Gemini API Key** in the Settings panel (gear icon) in the top-right corner.\n\n"
            "**However, your Smart Budget Calculator is fully operational!** See the interactive charts "
            "and itemized table below for your complete estimated expenses."
        )
        
    planning_result["success"] = True
    planning_result["ai_response"] = ai_response_markdown
    return planning_result

@router.post("/api/chat")
async def chat_consultant(request: Request, body: ChatRequest):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    query = body.query
    history = body.history
    api_key = body.api_key
    trip_context = body.trip_context
    
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GROQ_API_KEY") or ""
        
    try:
        history_list = []
        for msg in history:
            history_list.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            
        response_text = rag_engine.generate_response(
            prompt_type="chat",
            user_query=query,
            api_key=api_key,
            budget_details=trip_context,
            chat_history=history_list
        )
        return {"success": True, "response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/weather")
async def get_weather(city: str):
    if not city:
        raise HTTPException(status_code=400, detail="City query parameter missing.")
    weather_info = rag_engine.fetch_live_weather(city)
    return {"city": city, "weather": weather_info}
