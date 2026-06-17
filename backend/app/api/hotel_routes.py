from fastapi import APIRouter, HTTPException
from app.services.hotel_restaurant_service import HotelRestaurantService

router = APIRouter(prefix="/api/hotels", tags=["hotels"])
hotel_service = HotelRestaurantService()

@router.get("/search")
async def search_hotels_and_restaurants(city: str):
    """
    Endpoint to fetch 6-10 hotels in each budget category (low, medium, high) 
    and recommended restaurants for a given city, using caching and live fallbacks.
    """
    if not city or not city.strip():
        raise HTTPException(status_code=400, detail="City query parameter is required.")
        
    city_name = city.strip()
    try:
        hotels, restaurants = hotel_service.search_hotels_and_restaurants(city_name)
        return {
            "success": True,
            "city": city_name,
            "hotels": hotels,
            "restaurants": restaurants
        }
    except Exception as e:
        print(f"Error in search_hotels_and_restaurants API endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query hotels and dining options: {str(e)}")
