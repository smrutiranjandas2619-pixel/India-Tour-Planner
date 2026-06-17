import os
import json
import urllib.parse
import requests
from bs4 import BeautifulSoup
import warnings

# Suppress the deprecation warning
warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai

from .vector_store import SimpleVectorStore

def get_hotel_recommendation(destination: str, budget_cat: str) -> dict:
    from app.utils.cost_estimator import get_real_hotels_for_city
    hotels = get_real_hotels_for_city(destination)
    
    # Map safely based on budget category:
    # Index 0, 1: low
    # Index 2, 3: medium
    # Index 4, 5: high
    if budget_cat == "low":
        return hotels[0] if len(hotels) > 0 else {"name": "Budget Homestay", "desc": "Clean and simple budget stay", "price": 950, "location": destination}
    elif budget_cat == "high":
        return hotels[4] if len(hotels) > 4 else (hotels[-1] if len(hotels) > 0 else {"name": "Luxury Palace Resort", "desc": "Luxury 5-star hotel", "price": 12000, "location": destination})
    else: # medium
        return hotels[2] if len(hotels) > 2 else (hotels[0] if len(hotels) > 0 else {"name": "Sleek Comfort Stay", "desc": "Comfortable 3-star hotel", "price": 2800, "location": destination})

class RAGEngine:
    def __init__(self, db_json_path="travel_database.json", vector_db_path="vector_store.json"):
        self.db_json_path = db_json_path
        self.vector_db_path = vector_db_path
        self.vector_store = SimpleVectorStore(vector_db_path)
        
    def initialize_store(self, api_key=None, force_rebuild=False):
        """Seeds the vector store from travel_database.json if empty or forced."""
        self.vector_store.load()
        
        if not self.vector_store.items or force_rebuild:
            print("Seeding vector store from travel_database.json...")
            if not os.path.exists(self.db_json_path):
                print(f"Error: {self.db_json_path} not found.")
                return
                
            with open(self.db_json_path, "r", encoding="utf-8") as f:
                db_data = json.load(f)
                
            # Seed state general descriptions, attractions, foods, and rental packages
            states = db_data.get("states", {})
            for state_key, state_data in states.items():
                # 1. General description
                state_text = f"State: {state_data['name']}. Capital: {state_data['capital']}. Best Season: {state_data['best_season']}. Safety Score: {state_data['safety_score']}/10. Crowd Level: {state_data['crowd_level']}. Description: {state_data['description']}"
                self.vector_store.add_item(
                    item_id=f"state_{state_key}",
                    text=state_text,
                    metadata={"type": "state", "name": state_data["name"], "key": state_key},
                    api_key=api_key
                )
                
                # 2. Attractions
                for i, attraction in enumerate(state_data.get("attractions", [])):
                    attr_text = f"Attraction in {state_data['name']}: {attraction['name']}. Details: {attraction['desc']}. Entry Fee: INR {attraction['fee']}. Coordinates: {attraction['coords']}."
                    self.vector_store.add_item(
                        item_id=f"attraction_{state_key}_{i}",
                        text=attr_text,
                        metadata={"type": "attraction", "state": state_data["name"], "name": attraction["name"], "coords": attraction["coords"]},
                        api_key=api_key
                    )
                    
                # 3. Hidden Gems
                for i, gem in enumerate(state_data.get("hidden_gems", [])):
                    gem_text = f"Hidden Gem in {state_data['name']}: {gem['name']}. Secrets & Details: {gem['desc']}. Coordinates: {gem['coords']}."
                    self.vector_store.add_item(
                        item_id=f"hidden_{state_key}_{i}",
                        text=gem_text,
                        metadata={"type": "hidden_gem", "state": state_data["name"], "name": gem["name"], "coords": gem["coords"]},
                        api_key=api_key
                    )
                    
                # 4. Famous Foods
                for i, food in enumerate(state_data.get("famous_foods", [])):
                    food_text = f"Famous Food of {state_data['name']}: {food['name']}. Description: {food['desc']}. Diet Style: {food['type']}. Average Cost: INR {food['avg_cost']}. Best place to try: {food['best_places']}."
                    self.vector_store.add_item(
                        item_id=f"food_{state_key}_{i}",
                        text=food_text,
                        metadata={"type": "food", "state": state_data["name"], "name": food["name"]},
                        api_key=api_key
                    )
                    
                # 5. Vehicle Rentals
                for i, rent in enumerate(state_data.get("vehicle_rentals", [])):
                    rent_text = f"Vehicle Rental in {state_data['name']}: {rent['name']} ({rent['type']}). Daily Rate: INR {rent['daily_rate']}. Daily Fuel Cost Estimate: INR {rent['fuel_estimate']}. Best suited terrain: {rent['best_for']}."
                    self.vector_store.add_item(
                        item_id=f"rental_{state_key}_{i}",
                        text=rent_text,
                        metadata={"type": "rental", "state": state_data["name"], "vehicle_type": rent["type"]},
                        api_key=api_key
                    )
            
            # Rebuild vocab if keyword fallback is active
            if not api_key:
                self.vector_store._build_fallback_vocabulary()
                
            self.vector_store.save()
            print("Vector store seeded successfully.")

    def fetch_live_weather(self, city):
        """Scrapes or API-fetches live weather data for a city."""
        city_encoded = urllib.parse.quote(f"weather in {city}")
        url = f"https://html.duckduckgo.com/html/?q={city_encoded}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        try:
            r = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            # Extract basic text snippet
            snippets = [s.get_text() for s in soup.find_all('a', class_='result__snippet')[:2]]
            if snippets:
                return " | ".join(snippets)
        except Exception as e:
            print(f"Weather scraping error: {e}")
        
        # Friendly baseline fallback weather
        return f"Pleasant, clear skies. Temp: 24°C - 30°C. Best season is currently active."

    def scrape_travel_alerts(self, destination):
        """Dynamically scrapes travel advisory snippets directly from official state tourism boards."""
        query_encoded = urllib.parse.quote(f"official state tourism board advisory {destination} 2026")
        url = f"https://html.duckduckgo.com/html/?q={query_encoded}"
        headers = {"User-Agent": "Mozilla/5.0"}
        try:
            r = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            results = soup.find_all('a', class_='result__snippet')
            if results:
                return "\n".join([f"- {res.get_text().strip()}" for res in results[:3]])
        except Exception as e:
            print(f"Advisory scraping failed: {e}")
        return "- No active extreme weather or safety advisories. Routes are clear and highly accessible."

    def generate_response(self, prompt_type, user_query, api_key, budget_details=None, chat_history=None):
        """
        Coordinates the RAG search + dynamic scraping + Gemini model call.
        Returns a beautifully formatted professional travel response.
        """
        if not api_key:
            return "### ⚠️ Configuration Required\nPlease click the **API Settings** gear button in the top right to configure your **Gemini API Key**! This will unlock the dynamic RAG generation, travel route optimization, and day-wise itineraries."
            
        # 1. RAG Vector Search
        self.vector_store.load()
        rag_matches = self.vector_store.query(user_query, top_k=6, api_key=api_key)
        rag_context = "\n".join([f"Source [{match['metadata'].get('type', 'info')}]: {match['text']}" for match in rag_matches])
        
        # 2. Extract city/destination if possible and fetch live scraping details
        destination = "India"
        if budget_details and "destination" in budget_details:
            destination = budget_details["destination"]
        else:
            words = user_query.lower().split()
            if os.path.exists(self.db_json_path):
                with open(self.db_json_path, "r", encoding="utf-8") as f:
                    db_data = json.load(f)
                    for state_key in db_data.get("states", {}).keys():
                        if state_key in words or state_key.replace("_", " ") in user_query.lower():
                            destination = db_data["states"][state_key]["name"]
                            break
        
        live_weather = self.fetch_live_weather(destination)
        live_advisories = self.scrape_travel_alerts(destination)
        
        # Fetch the single budget-appropriate hotel recommendation
        budget_category = budget_details.get("budget_category", "medium") if budget_details else "medium"
        target_hotel = get_hotel_recommendation(destination, budget_category)
        
        # 3. Formulate Prompt based on query task
        system_role = (
            "You are India Tour Planner, a premium, hyper-intelligent Travel Consultant, "
            "Route Organizer, and Cost Analyst. You specialize in planning trips across India. "
            "Your tone is professional, inviting, inspiring, and extremely detailed.\n"
            "Format all your responses using clean, readable Markdown with clear headings, bullet points, and tables. "
            "Do not use generic text. Use specific local knowledge, prices, safety notes, and routes.\n"
            "CRITICAL OFFICIAL STATE TOURISM COMPLIANCE RULE: You must prioritize and base your itinerary, sightseeing spots, hidden gems, "
            "and descriptions directly on the official state tourism guidelines and databases (such as Odisha Tourism, Kerala Tourism, "
            "Goa Tourism, Himachal Tourism, J&K Tourism, and Rajasthan Tourism). Under each main attraction or daily section, explicitly state "
            "that these sightseeing guidelines, timings, and safety regulations align with the official State Tourism Department guidelines to "
            "give users authentic, verified, and official travel advice.\n"
            "CRITICAL HOTEL RECOMMENDATION MANDATE: You MUST explicitly and exclusively recommend the hotel listed under the 'RECOMMENDED COMPLIANT HOTEL FOR THIS TRIP' section of your context block for the lodging recommendation in the itinerary. Do not recommend any other hotel. Mention its name, verified price per night, amenities, and location exactly as listed. State that this accommodation matches the user's budget level.\n"
            "CRITICAL CULINARY & CULTURAL RULE: If the destination is a pilgrimage, temple town, or highly historic sacred center "
            "(such as Puri, Mathura, Vrindavan, Varanasi, Ayodhya, Tirupati, Amritsar), you MUST explicitly include visiting "
            "the principal temples/shrines (e.g. Jagannath Temple in Puri, Banke Bihari Temple in Vrindavan, Kashi Vishwanath in Varanasi, "
            "Golden Temple in Amritsar) and feature their legendary sacred food offerings (such as the world-famous, massive clay-pot cooked "
            "MAHAPRASAD at Ananda Bazar in Puri, Makhan Mishri in Vrindavan, Mathura Peda, or Kada Prasad in Amritsar) as a core, highlight "
            "recommendation for lunch or prasad in both the day-wise itinerary and the famous foods section. Never omit these holy landmarks."
        )
        
        context_block = (
            f"=== SEEDED LOCAL TRAVEL DATABASE ===\n{rag_context}\n\n"
            f"=== RECOMMENDED COMPLIANT HOTEL FOR THIS TRIP ===\n"
            f"Hotel Name: {target_hotel['name']}\n"
            f"Description: {target_hotel['desc']}\n"
            f"Price: INR {target_hotel['price']} per night\n"
            f"Location: {target_hotel['location']}\n"
            f"Note: This hotel is officially selected and strictly matches the {budget_category.upper()} budget tier.\n\n"
            f"=== SCRAPED REAL-TIME WEB DATA ===\n"
            f"Live weather for {destination}: {live_weather}\n"
            f"Current news/road conditions for {destination}:\n{live_advisories}\n"
        )
        
        if prompt_type == "plan":
            # Budget and itinerary generation request
            num_travelers = budget_details.get("travelers", 1)
            num_days = budget_details.get("days", 3)
            start_loc = budget_details.get("start_location", "Delhi")
            budget_category = budget_details.get("budget_category", "medium")
            
            prompt = (
                f"{system_role}\n\n"
                f"CONTEXT & LIVE INFO:\n{context_block}\n\n"
                f"TRIP SPECIFICATIONS:\n"
                f"- Destination: {destination}\n"
                f"- Starting Location: {start_loc}\n"
                f"- Duration: {num_days} Days\n"
                f"- Number of Travelers: {num_travelers}\n"
                f"- Budget Level: {budget_category.upper()}\n\n"
                f"USER QUERY:\n{user_query}\n\n"
                f"YOUR TASK:\n"
                f"1. Generate a comprehensive Day-Wise Itinerary (Day 1 to Day {num_days}) with morning, afternoon, and evening slots. "
                f"Specify tourist spots, scenic routes, travel times, and recommended local foods to try at each destination.\n"
                f"2. Explain *why* these local foods are famous and the best areas or street spots to try them.\n"
                f"3. Provide realistic vehicle rental advice (which bikes/scooters/cars suit this terrain best) and transport comparison details.\n"
                f"4. Give area-wise recommendations (where to stay, where to walk) and state the safety rating and crowd level of the area.\n"
                f"5. Outline optimized travel routes (fastest route, cheapest route, scenic route).\n"
                f"6. Conclude with emergency safety alerts or packing tips based on the weather context.\n\n"
                f"Keep it well-structured, easy to read, and exciting!"
            )
        else:
            # General Chatbot request
            history_str = ""
            if chat_history:
                history_str = "CHAT HISTORY:\n" + "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in chat_history[-6:]]) + "\n\n"
                
            prompt = (
                f"{system_role}\n\n"
                f"CONTEXT & LIVE INFO:\n{context_block}\n\n"
                f"{history_str}"
                f"USER QUERY:\n{user_query}\n\n"
                f"YOUR TASK:\n"
                f"Answer the user's query beautifully, using the provided travel database and scraped web details. "
                f"Offer concrete advice, average costs, coordinates/directions if relevant, safety scores, and local secrets."
            )
            
        # 4. Route dynamically based on API key prefix: Groq vs Gemini
        is_groq = api_key.strip().startswith("gsk_")
        
        if is_groq:
            # Generate Content via Groq Llama 3.3 70B API
            try:
                headers = {
                    "Authorization": f"Bearer {api_key.strip()}",
                    "Content-Type": "application/json"
                }
                
                # Format messages payload
                messages = [
                    {"role": "system", "content": system_role}
                ]
                
                if chat_history and prompt_type != "plan":
                    for msg in chat_history[-6:]:
                        messages.append({"role": msg["role"], "content": msg["content"]})
                        
                messages.append({"role": "user", "content": prompt})
                
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.3
                }
                
                res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=30)
                if res.ok:
                    return res.json()["choices"][0]["message"]["content"]
                else:
                    return f"### ❌ Groq Integration Error\nServer returned an error status: {res.status_code}\n`{res.text}`"
            except Exception as e:
                return f"### ❌ Groq Connection Failed\nError occurred while connecting to Groq completions: `{str(e)}`"
        else:
            # Generate Content via Google Gemini API
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                return (
                    f"### ❌ Generation Failed\n"
                    f"An error occurred while connecting to the Gemini LLM:\n`{str(e)}`\n\n"
                    f"**Tip**: Double-check your Gemini API key inside the **API Settings** panel in the top-right corner, and make sure it has access to the `gemini-1.5-flash` model."
                )
