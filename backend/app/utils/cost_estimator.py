import math

NEAREST_STATE_MAP = {
    # Odisha / Eastern India -> West Bengal
    "odisha": "west_bengal",
    "bhubaneswar": "west_bengal",
    "puri": "west_bengal",
    "cuttack": "west_bengal",
    
    # Karnataka -> Telangana
    "karnataka": "telangana",
    "bengaluru": "telangana",
    "bangalore": "telangana",
    "mysore": "telangana",
    "hampi": "telangana",
    "coorg": "kerala",
    
    # Tamil Nadu / Andhra Pradesh -> Kerala / Telangana
    "tamil_nadu": "kerala",
    "chennai": "telangana",
    "ooty": "kerala",
    "kodaikanal": "kerala",
    "andhra_pradesh": "telangana",
    "tirupati": "telangana",
    "visakhapatnam": "telangana",
    
    # Gujarat -> Rajasthan
    "gujarat": "rajasthan",
    "ahmedabad": "rajasthan",
    "gandhinagar": "rajasthan",
    
    # Madhya Pradesh -> Delhi
    "madhya_pradesh": "delhi",
    "bhopal": "delhi",
    "indore": "delhi",
    
    # Uttar Pradesh / Uttarakhand -> Delhi / Himachal
    "uttar_pradesh": "delhi",
    "agra": "delhi",
    "varanasi": "delhi",
    "lucknow": "delhi",
    "ayodhya": "delhi",
    "mathura": "delhi",
    "vrindavan": "delhi",
    "uttarakhand": "himachal",
    "dehradun": "himachal",
    "haridwar": "himachal",
    "rishikesh": "himachal",
    "nainital": "himachal",
    "mussoorie": "himachal",
    
    # Punjab / Haryana -> Delhi
    "punjab": "delhi",
    "amritsar": "delhi",
    "haryana": "delhi",
    
    # Sikkim / Northeast -> West Bengal
    "sikkim": "west_bengal",
    "gangtok": "west_bengal",
    "assam": "west_bengal",
    "guwahati": "west_bengal",
    "shillong": "west_bengal",

    # Remaining Indian States & UTs mapping to nearest seeded states
    "bihar": "west_bengal",
    "jharkhand": "west_bengal",
    "chhattisgarh": "west_bengal",
    "arunachal_pradesh": "west_bengal",
    "manipur": "west_bengal",
    "meghalaya": "west_bengal",
    "mizoram": "west_bengal",
    "nagaland": "west_bengal",
    "tripura": "west_bengal",
    "jammu_and_kashmir": "kashmir",
    "jammu_&_kashmir": "kashmir",
    "lakshadweep": "kerala",
    "puducherry": "kerala",
    "andaman_and_nicobar_islands": "west_bengal",
    "andaman_&_nicobar_islands": "west_bengal",
    "chandigarh": "delhi",
    "dadra_and_nagar_haveli": "goa",
    "daman_and_diu": "goa",
    "dadra_&_nagar_haveli_and_daman_&_diu": "goa"
}

REAL_HOTELS_DB = {
    "goa": [
        # Low Budget (Index 0, 1)
        {
            "name": "Zostel Goa (Morjim)",
            "desc": "Vibrant beachfront backpacker hostel featuring cozy private rooms, shared dorms, social cafes, and beach games. Perfect for low budgets.",
            "price": 950,
            "location": "Morjim Beach, North Goa",
            "coords": "15.6322, 73.7145",
            "photo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Morjim Beachwood Cabins",
            "desc": "Affordable beachfront wooden cabins offering beautiful views of the sea, clean beds, and home-style local seafood snacks.",
            "price": 1200,
            "location": "Morjim Beach, North Goa",
            "coords": "15.6340, 73.7150",
            "photo": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        # Medium Budget (Index 2, 3)
        {
            "name": "Fontainhas Heritage Inn",
            "desc": "A premium boutique heritage stay set inside the colorful historic Latin Quarter of Panaji. Enjoy Portuguese balconies and food tours.",
            "price": 3500,
            "location": "Fontainhas, Panaji, Goa",
            "coords": "15.4989, 73.8478",
            "photo": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Casa Anjuna Boutique Stay",
            "desc": "Cozy heritage stay housed in an old Portuguese mansion. Features a lush swimming pool, green gardens, and organic breakfasts.",
            "price": 4200,
            "location": "Anjuna Beach Road, Goa",
            "coords": "15.5828, 73.7421",
            "photo": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
        },
        # High Budget (Index 4, 5)
        {
            "name": "The Leela Goa Resort",
            "desc": "Super-luxury 5-star beachfront paradise bordered by the River Sal and the Arabian Sea. Features a private golf course, lagoons, and spa.",
            "price": 18500,
            "location": "Mobor Beach, Cavelossim, Goa",
            "coords": "15.1582, 73.9452",
            "photo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "W Goa Luxury Hotel",
            "desc": "Ultra-modern 5-star luxury cliffside hotel overlooking Vagator Beach. Features legendary pools, dynamic lounges, and clifftop dining.",
            "price": 22000,
            "location": "Vagator Beach, North Goa",
            "coords": "15.6012, 73.7345",
            "photo": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80"
        }
    ],
    "puri": [
        # Low Budget (Index 0, 1)
        {
            "name": "Zostel Puri",
            "desc": "Sleek beachfront backpacker hostel featuring lively rooftop cafes, cozy common rooms, and direct walking access to Golden Beach.",
            "price": 850,
            "location": "Chakra Tirtha Road, Puri",
            "coords": "19.8105, 85.8436",
            "photo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Puri Beachside Homestay",
            "desc": "A cozy, highly affordable local family-run homestay steps from the sand. Experience home-style Odia seafood dining and terrace views.",
            "price": 1100,
            "location": "Marine Drive Road, Puri",
            "coords": "19.7982, 85.8219",
            "photo": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        # Medium Budget (Index 2, 3)
        {
            "name": "Toshali Sands Nature Resort",
            "desc": "A beautiful 4-star ethnic village resort spread over 30 acres of lush gardens near Balighai Beach. Features regional shopping and spas.",
            "price": 3800,
            "location": "Konark Marine Drive, Puri",
            "coords": "19.8456, 85.8912",
            "photo": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Swosti Palm Resort",
            "desc": "Comfortable, premium mid-range beach resort offering modern clean rooms, multi-cuisine seafood restaurants, and quick beach access.",
            "price": 4500,
            "location": "Chakra Tirtha Road, Puri",
            "coords": "19.8115, 85.8440",
            "photo": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
        },
        # High Budget (Index 4, 5)
        {
            "name": "Mayfair Waves Puri",
            "desc": "Ultra-luxury 5-star beachfront boutique resort. Features infinite sea views, a private beach entrance, heated pools, and fine dining.",
            "price": 14500,
            "location": "Chakra Tirtha Road, Puri",
            "coords": "19.8122, 85.8452",
            "photo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "The Chariot Resort & Spa",
            "desc": "Premium 4-star luxury seaside resort nestled in a tranquil beach stretch. Features spacious ocean-view suites and massive pools.",
            "price": 9500,
            "location": "Marine Drive, Puri",
            "coords": "19.7915, 85.8080",
            "photo": "https://images.unsplash.com/photo-1610641818989-c2022486346e?auto=format&fit=crop&w=600&q=80"
        }
    ],
    "bhubaneswar": [
        # Low Budget (Index 0, 1)
        {
            "name": "Zostel Bhubaneswar",
            "desc": "Modern, sleek and highly affordable backpacker hostel. Famed for clean dorm beds, lively common spaces, and travel alerts.",
            "price": 900,
            "location": "Khandagiri, Bhubaneswar",
            "coords": "20.2582, 85.7891",
            "photo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Odisha Heritage Guest House",
            "desc": "Cozy, simple local lodging near the ancient temples. Offers clean rooms, warm local hospitality, and basic amenities.",
            "price": 1300,
            "location": "Old Town, Bhubaneswar",
            "coords": "20.2412, 85.8322",
            "photo": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        # Medium Budget (Index 2, 3)
        {
            "name": "Ginger Bhubaneswar",
            "desc": "Clean, sleek smart-space business hotel. Famed for modern workspace desks, quick business Wi-Fi, and convenient city center access.",
            "price": 2800,
            "location": "Jayadev Vihar, Bhubaneswar",
            "coords": "20.2982, 85.8191",
            "photo": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Lemon Tree Premier Bhubaneswar",
            "desc": "Premium mid-range hotel featuring dynamic interior decors, multi-cuisine dining, swimming pools, and excellent professional service.",
            "price": 4800,
            "location": "Cuttack-Puri Road, Bhubaneswar",
            "coords": "20.2752, 85.8398",
            "photo": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
        },
        # High Budget (Index 4, 5)
        {
            "name": "Mayfair Lagoon Bhubaneswar",
            "desc": "Spectacular 5-star super-luxury resort set around a peaceful lagoon. Features premium villas, spa services, and club lounges.",
            "price": 12500,
            "location": "Jayadev Vihar, Bhubaneswar",
            "coords": "20.3012, 85.8172",
            "photo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Welcomhotel by ITC Bhubaneswar",
            "desc": "Palatial luxury 5-star hotel showcasing dynamic Odisha stone-carved heritage architecture, massive pools, and fine dining suites.",
            "price": 9800,
            "location": "Dumuduma, Bhubaneswar",
            "coords": "20.2512, 85.7798",
            "photo": "https://images.unsplash.com/photo-1610641818989-c2022486346e?auto=format&fit=crop&w=600&q=80"
        }
    ],
    "delhi": [
        # Low Budget (Index 0, 1)
        {
            "name": "Zostel Delhi (Paharganj)",
            "desc": "Top-rated backpacker hostel located in central Delhi. Features a vibrant rooftop cafe, game zones, and guided spice-market tours.",
            "price": 950,
            "location": "Pahar Ganj, New Delhi",
            "coords": "28.6425, 77.2185",
            "photo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Joey's Hostel Delhi",
            "desc": "Lively, highly social backpacker lodging featuring cozy dorm pods, self-cooking kitchens, and walking tours of Old Delhi.",
            "price": 850,
            "location": "Laxmi Nagar, Delhi",
            "coords": "28.6312, 77.2798",
            "photo": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        # Medium Budget (Index 2, 3)
        {
            "name": "Bloomrooms @ Janpath",
            "desc": "A vibrant yellow-and-white themed mid-range boutique hotel. Features clean minimalist rooms, an open lounge, and premium location.",
            "price": 3800,
            "location": "Janpath, New Delhi",
            "coords": "28.6212, 77.2215",
            "photo": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Connaught Royale Delhi",
            "desc": "Premium mid-range business hotel located in Connaught Place. Offers clean comfortable executive rooms and dynamic city transit paths.",
            "price": 4600,
            "location": "Connaught Place, New Delhi",
            "coords": "28.6315, 77.2242",
            "photo": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
        },
        # High Budget (Index 4, 5)
        {
            "name": "The Taj Mahal Hotel New Delhi",
            "desc": "Grand 5-star luxury heritage hotel in Lutyens' Delhi. Famed for Mughal-themed architecture, iconic fine dining, and private butler suites.",
            "price": 19500,
            "location": "Mansingh Road, New Delhi",
            "coords": "28.6052, 77.2252",
            "photo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "The Leela Palace New Delhi",
            "desc": "Ultra-luxury palatial 5-star hotel featuring spectacular crystal chandeliers, rooftop infinity pools, and legendary presidential suites.",
            "price": 24000,
            "location": "Chanakyapuri, New Delhi",
            "coords": "28.5798, 77.1952",
            "photo": "https://images.unsplash.com/photo-1610641818989-c2022486346e?auto=format&fit=crop&w=600&q=80"
        }
    ],
    "mumbai": [
        # Low Budget (Index 0, 1)
        {
            "name": "Zostel Mumbai",
            "desc": "Lively backpacker hostel featuring capsule pods, cozy social common zones, and regular street food and market walking crawls.",
            "price": 1100,
            "location": "Andheri East, Mumbai",
            "coords": "19.1152, 72.8752",
            "photo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Hostel Mantra Mumbai",
            "desc": "A charming and peaceful backpacker hostel nestled inside a quiet residential street in Andheri. Features beach campfires.",
            "price": 950,
            "location": "Juhu Scheme, Mumbai",
            "coords": "19.1112, 72.8252",
            "photo": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        # Medium Budget (Index 2, 3)
        {
            "name": "Hotel Suba International",
            "desc": "Clean and highly convenient 3-star business hotel near the airport. Features smart modern rooms and multi-cuisine restaurant suites.",
            "price": 4500,
            "location": "Andheri East, Mumbai",
            "coords": "19.1182, 72.8698",
            "photo": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Fariyas Hotel Colaba",
            "desc": "Vibrant 4-star hotel located steps from Gateway of India. Features spectacular harbor views and fine dining restaurants.",
            "price": 5800,
            "location": "Colaba, South Mumbai",
            "coords": "18.9212, 72.8295",
            "photo": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
        },
        # High Budget (Index 4, 5)
        {
            "name": "The Taj Mahal Palace Mumbai",
            "desc": "The pride of India—a magnificent 5-star flagship luxury hotel overlooking the Gateway of India. Offers legendary heritage hospitality.",
            "price": 26000,
            "location": "Apollo Bunder, Colaba, Mumbai",
            "coords": "18.9217, 72.8331",
            "photo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "The Oberoi Mumbai",
            "desc": "Ultra-luxury 5-star hotel situated on Marine Drive. Features sweeping views of the Arabian Sea, private spa rooms, and butler aids.",
            "price": 22000,
            "location": "Marine Drive, Nariman Point, Mumbai",
            "coords": "18.9272, 72.8205",
            "photo": "https://images.unsplash.com/photo-1610641818989-c2022486346e?auto=format&fit=crop&w=600&q=80"
        }
    ]
}

def get_real_hotels_for_city(city_name: str) -> list:
    clean_city = city_name.strip().lower().replace(" ", "_")
    
    # 1. Match database
    for key, hotels in REAL_HOTELS_DB.items():
        if key in clean_city or clean_city in key:
            return hotels
            
    # 2. Dynamic high-fidelity generator using real famous brands!
    cap = city_name.strip().title()
    return [
        # Low (Index 0, 1)
        {
            "name": f"Zostel {cap} (Hostel)",
            "desc": f"Experience lively social backpacker vibes in the heart of {cap}. Features cheap cozy dorm beds, social rooftop lounges, and local explorer maps.",
            "price": 950,
            "location": f"Near Sightseeing Hub, {cap}",
            "photo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": f"{cap} Tourist Homestay",
            "desc": f"Simple, highly affordable family-run homestay in {cap}. Famed for clean rooms, organic home breakfasts, and friendly local travel advice.",
            "price": 1200,
            "location": f"Near City Center, {cap}",
            "photo": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        # Medium (Index 2, 3)
        {
            "name": f"Ginger Hotel {cap} (Smart Stay)",
            "desc": f"Clean, sleek and highly practical mid-range smart hotel in {cap}. Features modern workspace desks, complimentary high-speed Wi-Fi, and fitness rooms.",
            "price": 2800,
            "location": f"Commercial Central District, {cap}",
            "photo": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": f"Lemon Tree Hotel {cap} (Comfort Stay)",
            "desc": f"Vibrant, premium mid-range hotel in {cap} featuring modern cozy rooms, swimming pool access, and friendly professional hospitality.",
            "price": 4200,
            "location": f"Business Hub Road, {cap}",
            "photo": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
        },
        # High (Index 4, 5)
        {
            "name": f"Taj Grand Palace {cap} (Luxury Resort)",
            "desc": f"Ultra-premium 5-star luxury retreat featuring palatial Indian architecture, royal spas, private swimming pools, and signature fine dining.",
            "price": 12000,
            "location": f"Scenic Outskirts Highway, {cap}",
            "photo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": f"Mayfair Scenic Resort {cap}",
            "desc": f"Super-premium 5-star clifftop resort set in majestic landscape borders. Offers spectacular valley views, heated pools, and fine organic dining.",
            "price": 15000,
            "location": f"Vibrant Hilltop Point, {cap}",
            "photo": "https://images.unsplash.com/photo-1610641818989-c2022486346e?auto=format&fit=crop&w=600&q=80"
        }
    ]

def calculate_trip_expenses(destination: str, days: int, travelers: int, budget_cat: str, db_data: dict, vehicle_pref: str = "auto") -> dict:
    """
    Applies double-room sharing formulas, vehicle fleets rates, fuel estimations, 
    and 5% emergency buffers to calculate itemized travel expenses dynamically.
    """
    dest_key = destination.strip().lower().replace(" ", "_").replace(",", "_")
    states = db_data.get("states", {})
    
    # Try to extract state name if the destination is in "City, State" format
    state_key_to_check = dest_key
    if "," in destination:
        parts = destination.split(",")
        state_key_to_check = parts[-1].strip().lower().replace(" ", "_")
        
    state_info = None
    # 1. Match directly against states keys using state_key_to_check or dest_key
    for k in [state_key_to_check, dest_key]:
        if k in states:
            state_info = states[k]
            break
            
    # 2. Substring matching fallback
    if not state_info:
        for k, s_data in states.items():
            s_name = s_data["name"].lower()
            if k in dest_key or dest_key in k or s_name in dest_key or s_name in state_key_to_check:
                state_info = s_data
                break
            
    if not state_info:
        # Check if the destination matches or contains any key in our geographical proximity map
        nearby_key = None
        for key, target_state in NEAREST_STATE_MAP.items():
            if key == state_key_to_check or key in dest_key or dest_key in key:
                nearby_key = target_state
                break
        
        nearby_state_info = states.get(nearby_key) if nearby_key else None
        
        # Borrow localized vehicle, season, food, and safety parameters from nearest pre-seeded state
        state_info = {
            "name": destination.title(),
            "best_season": nearby_state_info["best_season"] if nearby_state_info else "October to March",
            "safety_score": nearby_state_info["safety_score"] if nearby_state_info else 8.5,
            "crowd_level": nearby_state_info["crowd_level"] if nearby_state_info else "Medium",
            "description": f"Explore the scenic attractions, vibrant streets, and famous landmarks of {destination}.",
            "base_costs": nearby_state_info["base_costs"] if nearby_state_info else {
                "low": { "hotel": 700, "food": 350, "transport": 250 },
                "medium": { "hotel": 2500, "food": 950, "transport": 1000 },
                "high": { "hotel": 10000, "food": 3000, "transport": 3500 }
            },
            "attractions": [
                { "name": "Local City Center", "fee": 50, "desc": "Famous commercial center and sightseeing core." },
                { "name": "Historical Landmark", "fee": 100, "desc": "Popular ancient heritage temple or site." }
            ],
            "hidden_gems": [
                { "name": "Secret Valley Viewpoint", "desc": "A spectacular scenic hill spot away from tourists." }
            ],
            "famous_foods": nearby_state_info["famous_foods"] if nearby_state_info else [
                { "name": "Traditional Regional Thali", "desc": "An assortment of local grain recipes, spiced curries, and sweets.", "type": "veg", "avg_cost": 150, "best_places": "Local city heritage dhabas" }
            ],
            "vehicle_rentals": nearby_state_info["vehicle_rentals"] if nearby_state_info else [
                { "type": "Scooty", "name": "Honda Activa", "daily_rate": 350, "fuel_estimate": 150, "best_for": "Beating city traffic easily." },
                { "type": "Hatchback", "name": "Maruti Swift", "daily_rate": 1400, "fuel_estimate": 500, "best_for": "Family exploration and sightseeing." },
                { "type": "SUV", "name": "Mahindra Scorpio", "daily_rate": 2600, "fuel_estimate": 900, "best_for": "Excellent for long highways and terrain." }
            ]
        }
    
    costs_meta = state_info["base_costs"].get(budget_cat, state_info["base_costs"]["medium"])
    rooms = math.ceil(travelers / 2)
    daily_hotel = costs_meta["hotel"]
    total_hotel = daily_hotel * days * rooms
    
    daily_food = costs_meta["food"]
    total_food = daily_food * days * travelers
    
    daily_local_transport = costs_meta["transport"]
    total_local_transport = daily_local_transport * days
    
    rental_options = state_info.get("vehicle_rentals", [])
    selected_rental = None
    if rental_options:
        if vehicle_pref != "auto":
            if vehicle_pref == "none":
                selected_rental = {
                    "type": "None",
                    "name": "No Rental / Own Transport",
                    "daily_rate": 0,
                    "fuel_estimate": 0,
                    "best_for": "Zero vehicle and fuel expenses logged."
                }
            elif "cab" in vehicle_pref or "driver" in vehicle_pref or "traveler" in vehicle_pref:
                # Chauffeur/Driver-driven professional options
                if "suv" in vehicle_pref:
                    selected_rental = {
                        "type": "SUV",
                        "name": "Ertiga / Marazzo Cab (Driver Included)",
                        "daily_rate": 3200,
                        "fuel_estimate": 1000,
                        "best_for": "Chauffeur-driven comfort with driver allowance included."
                    }
                elif "luxury" in vehicle_pref:
                    selected_rental = {
                        "type": "Luxury",
                        "name": "Innova Crysta Premium Cab (Driver Included)",
                        "daily_rate": 4800,
                        "fuel_estimate": 1200,
                        "best_for": "Premium professional chauffeur ride for ultimate relaxation."
                    }
                elif "traveler" in vehicle_pref:
                    selected_rental = {
                        "type": "SUV",
                        "name": "Force Tempo Traveler (12-Seater with Driver)",
                        "daily_rate": 5800,
                        "fuel_estimate": 1600,
                        "best_for": "Perfect for large groups. Driver handles all route navigation."
                    }
                else: # sedan
                    selected_rental = {
                        "type": "Hatchback",
                        "name": "Dzire / Etios Sedan Cab (Driver Included)",
                        "daily_rate": 2400,
                        "fuel_estimate": 800,
                        "best_for": "Affordable outstation transit. Driver handles traffic."
                    }
            else:
                type_map = {
                    "scooty": "Scooty",
                    "cruiser": "Cruiser",
                    "sports_bike": "Sports bike",
                    "hatchback": "Hatchback",
                    "suv": "SUV",
                    "luxury": "Luxury"
                }
                target_type = type_map.get(vehicle_pref, "Scooty")
                selected_rental = next((v for v in rental_options if v["type"] == target_type), None)
            
        if not selected_rental:
            if budget_cat == "low":
                selected_rental = next((v for v in rental_options if v["type"] in ["Scooty", "Cruiser"]), rental_options[0])
            elif budget_cat == "high":
                selected_rental = next((v for v in rental_options if v["type"] in ["SUV", "Luxury"]), rental_options[-1])
            else:
                selected_rental = next((v for v in rental_options if v["type"] in ["Hatchback", "Cruiser"]), rental_options[0])
            
    rental_rate = selected_rental["daily_rate"] if selected_rental else 0
    rental_fuel = selected_rental["fuel_estimate"] if selected_rental else 0
    
    total_rental_cost = rental_rate * days
    total_fuel_cost = rental_fuel * days
    
    total_entry_fees = 0
    for attr in state_info.get("attractions", []):
        total_entry_fees += attr.get("fee", 0)
    total_entry_fees = total_entry_fees * travelers
    
    subtotal = total_hotel + total_food + total_local_transport + total_rental_cost + total_fuel_cost + total_entry_fees
    emergency_buffer = math.ceil(subtotal * 0.05)
    total_budget = subtotal + emergency_buffer
    
    cost_breakdown = {
        "hotel": { "daily": daily_hotel * rooms, "total": total_hotel, "desc": f"{rooms} Rooms for {days} Days (Double Sharing)" },
        "food": { "daily": daily_food * travelers, "total": total_food, "desc": f"INR {daily_food}/day per person for {travelers} travelers" },
        "local_transport": { "daily": daily_local_transport, "total": total_local_transport, "desc": "Standard local auto, metro, and local transits" },
        "rental": { "daily": rental_rate, "total": total_rental_cost, "desc": f"Rental: {selected_rental['name'] if selected_rental else 'None'} ({selected_rental['type'] if selected_rental else 'N/A'})" },
        "fuel": { "daily": rental_fuel, "total": total_fuel_cost, "desc": "Estimated fuel based on typical terrain distance" },
        "entry_fees": { "daily": 0, "total": total_entry_fees, "desc": "Sightseeing entry charges for tourist spots" },
        "emergency_buffer": { "daily": 0, "total": emergency_buffer, "desc": "5% Emergency medical & route deviation allowance" },
        "total_estimated": total_budget,
        "daily_average": math.ceil(total_budget / days)
    }
    
    return {
        "state_intelligence": {
            "name": state_info["name"],
            "capital": state_info.get("capital", "N/A"),
            "best_season": state_info["best_season"],
            "safety_score": state_info["safety_score"],
            "crowd_level": state_info["crowd_level"],
            "description": state_info["description"]
        },
        "costs": cost_breakdown,
        "attractions": state_info.get("attractions", []),
        "hidden_gems": state_info.get("hidden_gems", []),
        "famous_foods": state_info.get("famous_foods", []),
        "vehicle_rentals": state_info.get("vehicle_rentals", []),
        "recommended_rental": selected_rental,
        "hotels": get_real_hotels_for_city(destination)
    }
