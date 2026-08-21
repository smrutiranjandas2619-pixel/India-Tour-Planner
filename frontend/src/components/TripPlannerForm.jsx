import React, { useState } from 'react';

const INDIAN_CITIES_STATES = Array.from(new Set([
  // States & UTs
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry",
  
  // Major Tourism & Business Cities
  "Agra, Uttar Pradesh", "Ahmedabad, Gujarat", "Allahabad, Uttar Pradesh", "Alleppey, Kerala", 
  "Amritsar, Punjab", "Ayodhya, Uttar Pradesh", "Bengaluru, Karnataka", "Bhopal, Madhya Pradesh", 
  "Bhubaneswar, Odisha", "Chennai, Tamil Nadu", "Coorg, Karnataka", "Cuttack, Odisha", 
  "Darjeeling, West Bengal", "Dehradun, Uttarakhand", "Dharamshala, Himachal Pradesh", 
  "Gangtok, Sikkim", "Goa", "Guwahati, Assam", "Gwalior, Madhya Pradesh", "Hampi, Karnataka", 
  "Haridwar, Uttarakhand", "Hyderabad, Telangana", "Indore, Madhya Pradesh", "Jaipur, Rajasthan", 
  "Jaisalmer, Rajasthan", "Jammu, Jammu and Kashmir", "Jodhpur, Rajasthan", "Kanpur, Uttar Pradesh", 
  "Kochi, Kerala", "Kodaikanal, Tamil Nadu", "Kolkata, West Bengal", "Ladakh", "Leh, Ladakh", 
  "Lucknow, Uttar Pradesh", "Madurai, Tamil Nadu", "Manali, Himachal Pradesh", "Mathura, Uttar Pradesh", 
  "Mumbai, Maharashtra", "Munnar, Kerala", "Mussoorie, Uttarakhand", "Mysore, Karnataka", 
  "Nainital, Uttarakhand", "New Delhi, Delhi", "Ooty, Tamil Nadu", "Patna, Bihar", 
  "Pune, Maharashtra", "Puri, Odisha", "Raipur, Chhattisgarh", "Ranchi, Jharkhand", 
  "Rishikesh, Uttarakhand", "Shillong, Meghalaya", "Shimla, Himachal Pradesh", 
  "Srinagar, Jammu and Kashmir", "Tirupati, Andhra Pradesh", "Udaipur, Rajasthan", 
  "Varanasi, Uttar Pradesh", "Vrindavan, Uttar Pradesh", "Vijayawada, Andhra Pradesh", 
  "Visakhapatnam, Andhra Pradesh", "Silchar, Assam", "Tezpur, Assam", "Jorhat, Assam", 
  "Dibrugarh, Assam", "Siliguri, West Bengal", "Kalimpong, West Bengal", "Kohima, Nagaland", 
  "Dimapur, Nagaland", "Imphal, Manipur", "Aizawl, Mizoram", "Itanagar, Arunachal Pradesh", 
  "Tawang, Arunachal Pradesh", "Gurgaon, Haryana", "Noida, Uttar Pradesh", "Ghaziabad, Uttar Pradesh", 
  "Faridabad, Haryana", "Aligarh, Uttar Pradesh", "Meerut, Uttar Pradesh", "Bareilly, Uttar Pradesh", 
  "Moradabad, Uttar Pradesh", "Gorakhpur, Uttar Pradesh", "Jhansi, Uttar Pradesh", "Guntur, Andhra Pradesh", 
  "Nellore, Andhra Pradesh", "Kurnool, Andhra Pradesh", "Rajahmundry, Andhra Pradesh", "Warangal, Telangana", 
  "Kozhikode, Kerala", "Thrissur, Kerala", "Kollam, Kerala", "Mangaluru, Karnataka", 
  "Belagavi, Karnataka", "Hubballi, Karnataka", "Davanagere, Karnataka", "Coimbatore, Tamil Nadu", 
  "Salem, Tamil Nadu", "Tiruchirappalli, Tamil Nadu", "Tirunelveli, Tamil Nadu", "Erode, Tamil Nadu", 
  "Vellore, Tamil Nadu", "Vadodara, Gujarat", "Surat, Gujarat", "Rajkot, Gujarat", 
  "Bhavnagar, Gujarat", "Jamnagar, Gujarat", "Junagadh, Gujarat", "Gandhinagar, Gujarat", 
  "Bikaner, Rajasthan", "Ajmer, Rajasthan", "Alwar, Rajasthan", "Bhilwara, Rajasthan", 
  "Kota, Rajasthan", "Ludhiana, Punjab", "Patiala, Punjab", "Jalandhar, Punjab", 
  "Bathinda, Punjab", "Pathankot, Punjab", "Rohtak, Haryana", "Hisar, Haryana", 
  "Panipat, Haryana", "Karnal, Haryana", "Sonipat, Haryana", "Ambala, Haryana", 
  "Solan, Himachal Pradesh", "Mandi, Himachal Pradesh", "Kullu, Himachal Pradesh", 
  "Chamba, Himachal Pradesh", "Haldwani, Uttarakhand", "Rudrapur, Uttarakhand", "Kashipur, Uttarakhand", 
  "Pithoragarh, Uttarakhand", "Almora, Uttarakhand", "Latur, Maharashtra", "Solapur, Maharashtra", 
  "Kolhapur, Maharashtra", "Aurangabad, Maharashtra", "Nashik, Maharashtra", "Amravati, Maharashtra", 
  "Nanded, Maharashtra", "Jalgaon, Maharashtra", "Akola, Maharashtra", "Dhule, Maharashtra", 
  "Ahmednagar, Maharashtra", "Chandrapur, Maharashtra", "Ratnagiri, Maharashtra", 
  "Rourkela, Odisha", "Sambalpur, Odisha", "Berhampur, Odisha", "Balasore, Odisha", 
  "Bhagalpur, Bihar", "Muzaffarpur, Bihar", "Gaya, Bihar", "Jamshedpur, Jharkhand", 
  "Dhanbad, Jharkhand", "Bokaro, Jharkhand", "Bilaspur, Chhattisgarh", "Durg, Chhattisgarh", 
  "Bhilai, Chhattisgarh", "Korba, Chhattisgarh", "Agartala, Tripura", "Tura, Meghalaya"
]));

const VEHICLE_CATEGORIES = [
  {
    id: 'auto',
    icon: '🤖',
    name: 'AI Auto',
    desc: 'Smart Pick'
  },
  {
    id: 'none',
    icon: '🚫',
    name: 'No Transport',
    desc: 'Personal'
  },
  {
    id: 'scooty_rent',
    icon: '🛵',
    name: 'Scooty',
    desc: 'Self-Drive'
  },
  {
    id: 'bike_rent',
    icon: '🏍️',
    name: 'Bike',
    desc: 'Self-Drive'
  },
  {
    id: 'car_rent',
    icon: '🚗',
    name: 'Car',
    desc: 'Self-Drive'
  },
  {
    id: 'chauffeur',
    icon: '🚕',
    name: 'Cab / Taxi',
    desc: 'With Driver'
  }
];

const VEHICLE_MODELS = {
  auto: [
    { value: 'auto', label: 'AI Recommended Auto', tag: 'Smart Choice' }
  ],
  none: [
    { value: 'none', label: 'Personal / No Vehicle (₹0)', tag: 'Own Vehicle' }
  ],
  scooty_rent: [
    { value: 'scooty', label: 'Scooty (Activa / Ntorq)', tag: '₹350/day' }
  ],
  bike_rent: [
    { value: 'cruiser', label: 'Cruiser Bike (RE Classic 350)', tag: '₹950/day' },
    { value: 'sports_bike', label: 'Adventure Bike (KTM Duke / Adv)', tag: '₹1400/day' }
  ],
  car_rent: [
    { value: 'hatchback', label: 'Hatchback (Swift / i20)', tag: '₹1400/day' },
    { value: 'suv', label: 'SUV / Off-Roader (Thar / Scorpio)', tag: '₹2600/day' },
    { value: 'luxury', label: 'Luxury Premium (Mercedes C-Class)', tag: '₹6500/day' }
  ],
  chauffeur: [
    { value: 'cab_sedan', label: 'Sedan Cab (Dzire / Etios)', tag: 'Driver Included' },
    { value: 'cab_suv', label: 'SUV Cab (Ertiga / Marazzo)', tag: 'Driver Included' },
    { value: 'cab_luxury', label: 'Premium Cab (Innova Crysta)', tag: 'VIP Comfort' },
    { value: 'tempo_traveler', label: 'Tempo Traveler (12-Seater)', tag: 'Group Fleet' }
  ]
};

const TripPlannerForm = ({ onSubmitPlan, loading }) => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(5);
  const [travelers, setTravelers] = useState(2);
  const [budgetCategory, setBudgetCategory] = useState('medium');
  const [vehicleCategory, setVehicleCategory] = useState('auto');
  const [vehiclePreference, setVehiclePreference] = useState('auto');
  const [query, setQuery] = useState('');

  const handleCategoryChange = (cat) => {
    setVehicleCategory(cat);
    if (cat === 'auto') {
      setVehiclePreference('auto');
    } else if (cat === 'none') {
      setVehiclePreference('none');
    } else if (cat === 'scooty_rent') {
      setVehiclePreference('scooty');
    } else if (cat === 'bike_rent') {
      setVehiclePreference('cruiser');
    } else if (cat === 'car_rent') {
      setVehiclePreference('hatchback');
    } else if (cat === 'chauffeur') {
      setVehiclePreference('cab_sedan');
    }
  };

  // Autosuggest dropdown states
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const handleStartChange = (value) => {
    setStartLocation(value);
    const filtered = INDIAN_CITIES_STATES.filter(c =>
      c.toLowerCase().includes(value.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const aStart = a.toLowerCase().startsWith(value.toLowerCase());
      const bStart = b.toLowerCase().startsWith(value.toLowerCase());
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return a.localeCompare(b);
    });
    setStartSuggestions(sorted.slice(0, 10));
    setShowStartDropdown(true);
  };

  const handleStartFocus = () => {
    setShowStartDropdown(true);
    const filtered = INDIAN_CITIES_STATES.filter(c =>
      c.toLowerCase().includes(startLocation.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const aStart = a.toLowerCase().startsWith(startLocation.toLowerCase());
      const bStart = b.toLowerCase().startsWith(startLocation.toLowerCase());
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return a.localeCompare(b);
    });
    setStartSuggestions(sorted.slice(0, 10));
  };

  const handleSelectStart = (city) => {
    setStartLocation(city);
    setShowStartDropdown(false);
  };

  const handleDestChange = (value) => {
    setDestination(value);
    const filtered = INDIAN_CITIES_STATES.filter(c =>
      c.toLowerCase().includes(value.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const aStart = a.toLowerCase().startsWith(value.toLowerCase());
      const bStart = b.toLowerCase().startsWith(value.toLowerCase());
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return a.localeCompare(b);
    });
    setDestSuggestions(sorted.slice(0, 10));
    setShowDestDropdown(true);
  };

  const handleDestFocus = () => {
    setShowDestDropdown(true);
    const filtered = INDIAN_CITIES_STATES.filter(c =>
      c.toLowerCase().includes(destination.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const aStart = a.toLowerCase().startsWith(destination.toLowerCase());
      const bStart = b.toLowerCase().startsWith(destination.toLowerCase());
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return a.localeCompare(b);
    });
    setDestSuggestions(sorted.slice(0, 10));
  };

  const handleSelectDest = (city) => {
    setDestination(city);
    setShowDestDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitPlan({
      start_location: startLocation,
      destination,
      days: parseInt(days),
      travelers: parseInt(travelers),
      budget_category: budgetCategory,
      vehicle_preference: vehiclePreference,
      query
    });
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3">
        <i className="fa-solid fa-sliders text-sunsetCoral"></i>
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Configure Trip Profile</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Starting Point */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs text-slate-400 font-semibold uppercase">From</label>
            <input 
              type="text" 
              value={startLocation}
              onChange={(e) => handleStartChange(e.target.value)}
              onFocus={handleStartFocus}
              onBlur={() => setTimeout(() => setShowStartDropdown(false), 200)}
              required 
              className="glass-input p-2.5 text-sm" 
              placeholder="e.g. Delhi"
              id="start-location"
              autoComplete="off"
            />
            {showStartDropdown && startSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 dropdown-panel rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 backdrop-blur-md">
                {startSuggestions.map((city, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSelectStart(city)}
                    className="px-3.5 py-2.5 hover:bg-sunsetCoral/20 hover:text-sunsetCoral cursor-pointer text-slate-200 text-xs font-semibold transition border-b border-[rgba(255,255,255,0.03)] last:border-b-0 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-location-dot text-[10px] text-marigoldGold"></i>
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Destination */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs text-slate-400 font-semibold uppercase">Destination</label>
            <input 
              type="text" 
              value={destination}
              onChange={(e) => handleDestChange(e.target.value)}
              onFocus={handleDestFocus}
              onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
              required 
              className="glass-input p-2.5 text-sm" 
              placeholder="e.g. Goa, Ladakh, Manali..."
              id="destination"
              autoComplete="off"
            />
            {showDestDropdown && destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 dropdown-panel rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 backdrop-blur-md">
                {destSuggestions.map((city, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSelectDest(city)}
                    className="px-3.5 py-2.5 hover:bg-sunsetCoral/20 hover:text-sunsetCoral cursor-pointer text-slate-200 text-xs font-semibold transition border-b border-[rgba(255,255,255,0.03)] last:border-b-0 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-location-dot text-[10px] text-marigoldGold"></i>
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Days count */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Days</label>
            <input 
              type="number" 
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="1" 
              max="30" 
              required 
              className="glass-input p-2.5 text-sm text-center"
            />
          </div>
          {/* Travelers count */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Travelers</label>
            <input 
              type="number" 
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              min="1" 
              max="20" 
              required 
              className="glass-input p-2.5 text-sm text-center"
            />
          </div>
          {/* Budget Selection */}
          <div className="flex flex-col gap-1 col-span-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Budget Level</label>
            <select 
              value={budgetCategory}
              onChange={(e) => setBudgetCategory(e.target.value)}
              className="glass-input p-2.5 text-sm bg-darkSlate text-center"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Modern Vehicle Category Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <span>🚘</span> VEHICLE CATEGORY
            </label>
            <span className="text-[10px] text-amber-400/90 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {VEHICLE_CATEGORIES.find(c => c.id === vehicleCategory)?.name || 'Selected'}
            </span>
          </div>

          {/* Horizontal scrollable row of icon cards */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10">
            {VEHICLE_CATEGORIES.map((cat) => {
              const isSelected = vehicleCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`group relative flex-shrink-0 w-24 flex flex-col items-center justify-center p-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer text-center ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/15 text-white shadow-lg shadow-amber-400/30 scale-105 ring-1 ring-amber-400/50'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  <span className="text-2xl mb-1 filter drop-shadow transition-transform duration-200 group-hover:scale-110">
                    {cat.icon}
                  </span>
                  <span className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                    {cat.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium leading-none mt-1">
                    {cat.desc}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm shadow-amber-400/50 animate-fade-in">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Model Selection (Slide-in Pill Buttons) */}
        {vehicleCategory && VEHICLE_MODELS[vehicleCategory] && (
          <div className="flex flex-col gap-2 pt-1 animate-fade-in transition-all duration-300">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <span>🔑</span> VEHICLE MODEL
              </label>
              <span className="text-[10px] text-slate-500 font-normal">
                {VEHICLE_MODELS[vehicleCategory]?.length} option(s)
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {VEHICLE_MODELS[vehicleCategory].map((model) => {
                const isSelected = vehiclePreference === model.value;
                return (
                  <button
                    key={model.value}
                    type="button"
                    onClick={() => setVehiclePreference(model.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300 shadow-md shadow-amber-400/20 scale-102 ring-1 ring-amber-400/40'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      isSelected ? 'bg-amber-400 text-slate-950 scale-110' : 'border border-slate-600 text-transparent'
                    }`}>
                      ✓
                    </span>
                    <span>{model.label}</span>
                    {model.tag && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isSelected ? 'bg-amber-400/20 text-amber-200' : 'bg-white/5 text-slate-500'
                      }`}>
                        {model.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}


        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 mt-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white hover:brightness-110 active:scale-[0.98] font-bold rounded-xl transition duration-300 shadow-md shadow-sunsetCoral/10 flex items-center justify-center gap-2 disabled:brightness-75"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>{loading ? "Searching..." : "Search"}</span>
        </button>
      </form>
    </div>
  );
};

export default TripPlannerForm;
