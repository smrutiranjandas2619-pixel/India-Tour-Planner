  import React, { useState } from 'react';

const INDIAN_CITIES_STATES = [
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
];

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

        {/* Vehicle Category & Vehicle Selection (2-Column Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Vehicle Category</label>
            <select 
              value={vehicleCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="glass-input p-2.5 text-sm bg-darkSlate"
            >
              <option value="auto">AI Recommendation (Auto)</option>
              <option value="none">No Transport / Personal Vehicle (None)</option>
              <option value="scooty_rent">Scooty Rental (Self-Drive)</option>
              <option value="bike_rent">Bike Rental (Self-Drive)</option>
              <option value="car_rent">Car Rental (Self-Drive)</option>
              <option value="chauffeur">Cab / Tourist Taxi (Driver Included)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Vehicle Model</label>
            <select 
              value={vehiclePreference}
              onChange={(e) => setVehiclePreference(e.target.value)}
              disabled={vehicleCategory === 'auto' || vehicleCategory === 'none'}
              className="glass-input p-2.5 text-sm bg-darkSlate disabled:opacity-50"
            >
              {vehicleCategory === 'auto' && (
                <option value="auto">AI Recommended Auto</option>
              )}
              {vehicleCategory === 'none' && (
                <option value="none">No Vehicle (₹0 / day)</option>
              )}
              {vehicleCategory === 'scooty_rent' && (
                <option value="scooty">Scooty (Activa / Ntorq)</option>
              )}
              {vehicleCategory === 'bike_rent' && (
                <>
                  <option value="cruiser">Cruiser Bike (RE Classic 350)</option>
                  <option value="sports_bike">Adventure Bike (KTM Duke)</option>
                </>
              )}
              {vehicleCategory === 'car_rent' && (
                <>
                  <option value="hatchback">Hatchback Car (Swift / i20)</option>
                  <option value="suv">SUV / Off-Roader (Thar / Scorpio)</option>
                  <option value="luxury">Luxury Premium Car (Mercedes C)</option>
                </>
              )}
              {vehicleCategory === 'chauffeur' && (
                <>
                  <option value="cab_sedan">Sedan Cab (Dzire / Etios)</option>
                  <option value="cab_suv">SUV Cab (Ertiga / Marazzo)</option>
                  <option value="cab_luxury">Premium Luxury Cab (Innova Crysta)</option>
                  <option value="tempo_traveler">Tempo Traveler (12-Seater + Driver)</option>
                </>
              )}
            </select>
          </div>
        </div>


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
