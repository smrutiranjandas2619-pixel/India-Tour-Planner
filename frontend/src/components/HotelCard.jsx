import React, { useState, useEffect } from 'react';

const HotelCard = ({ destination, onViewOnMap, budgetCategory = 'medium', hotels: propHotels, favorites = [], onToggleFavorite }) => {
  // Group hotels by category
  const [groupedHotels, setGroupedHotels] = useState({ low: [], medium: [], high: [] });
  const [activeTab, setActiveTab] = useState(budgetCategory.toLowerCase());

  useEffect(() => {
    if (budgetCategory) {
      setActiveTab(budgetCategory.toLowerCase());
    }
  }, [budgetCategory]);

  useEffect(() => {
    if (!propHotels) {
      setGroupedHotels({ low: [], medium: [], high: [] });
      return;
    }

    // Check if propHotels is already structured by category
    if (propHotels && !Array.isArray(propHotels) && (propHotels.low || propHotels.medium || propHotels.high)) {
      setGroupedHotels({
        low: propHotels.low || [],
        medium: propHotels.medium || [],
        high: propHotels.high || []
      });
      return;
    }

    // Otherwise, classify a flat list dynamically
    if (Array.isArray(propHotels)) {
      const low = [];
      const medium = [];
      const high = [];
      
      propHotels.forEach(h => {
        const cat = h.category?.toLowerCase() || 'medium';
        if (cat === 'low' || h.price <= 1500) {
          low.push(h);
        } else if (cat === 'high' || h.price > 5000) {
          high.push(h);
        } else {
          medium.push(h);
        }
      });
      
      setGroupedHotels({ low, medium, high });
    }
  }, [propHotels]);

  const currentHotels = groupedHotels[activeTab] || [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.05)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-hotel text-sunsetCoral"></i>
            Stays & Accommodations
          </h3>
          <p className="text-xs text-slate-500">Explore handpicked hotels, homestays, and boutique resorts near {destination || 'your destination'}</p>
        </div>

        {/* Category switcher tabs */}
        <div className="flex bg-slate-950/45 p-1 rounded-xl border border-[rgba(255,255,255,0.05)] self-start sm:self-center">
          {['low', 'medium', 'high'].map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTab(tier)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === tier
                  ? 'bg-royalIndigo text-white shadow-md shadow-royalIndigo/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tier === 'low' && 'Low Budget'}
              {tier === 'medium' && 'Medium'}
              {tier === 'high' && 'Premium'}
            </button>
          ))}
        </div>
      </div>

      {!destination ? (
        <div className="text-center text-slate-500 py-12 text-xs font-medium">
          Select a destination in the search panel to view local accommodations
        </div>
      ) : currentHotels.length === 0 ? (
        <div className="text-center text-slate-500 py-12 text-xs font-medium">
          No accommodations found in this category. Try searching another tier or destination.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[520px] overflow-y-auto pr-1">
          {currentHotels.map((hotel, idx) => {
            const stars = hotel.rating ? Math.round(hotel.rating) : 4;
            const isFav = (favorites || []).some(fav => fav.name === hotel.name);
            const distFromCenter = hotel.distance_from_center || `${(1.2 + (idx % 3) * 1.5).toFixed(1)} km from city center`;
            const roomType = hotel.room_type || (activeTab === 'low' ? 'Shared Dorm Pod' : activeTab === 'medium' ? 'Standard Double Room' : 'Premium Luxury Suite');

            return (
              <div 
                key={idx} 
                className="glass-panel overflow-hidden bg-slate-900/30 flex flex-col hover:border-sunsetCoral/30 transition duration-300 group"
              >
                {/* Photo Area */}
                <div className="h-44 w-full overflow-hidden relative">
                  <img 
                    src={hotel.photo} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  {/* Category Tag */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/75 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-md text-[8px] font-black uppercase tracking-wider text-slate-300">
                    {hotel.category || activeTab} class
                  </div>
                  {/* Price Tag */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-lg text-xs font-black text-marigoldGold">
                    ₹{hotel.price ? hotel.price.toLocaleString('en-IN') : '800'}/n
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 flex flex-col gap-2.5 flex-grow">
                  <div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-sunsetCoral transition flex items-start justify-between gap-2">
                      <span className="line-clamp-1">{hotel.name}</span>
                      {/* Star Rating Indicator */}
                      <span className="flex text-amber-400 text-[10px] items-center shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i key={i} className={`${i < stars ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                        ))}
                        <span className="text-[10px] text-slate-400 font-bold ml-1">({hotel.rating || '4.0'})</span>
                      </span>
                    </h4>
                    
                    {/* Price Range */}
                    <div className="text-[10px] text-marigoldGold font-bold mt-0.5">
                      Est. Range: {hotel.price_range || `₹${hotel.price - 100} - ₹${hotel.price + 100}`}
                    </div>

                    {/* Address */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider flex items-center gap-1 line-clamp-1">
                      <i className="fa-solid fa-location-dot text-[9px] text-royalIndigo"></i>
                      {hotel.location || 'Local Area'}
                    </p>

                    {/* Distance & Room Type */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1.5">
                      <span><i className="fa-solid fa-map-pin text-[9px] text-sunsetCoral mr-1"></i>{distFromCenter}</span>
                      <span className="px-2 py-0.5 bg-slate-800/60 rounded text-slate-300 border border-[rgba(255,255,255,0.03)] font-bold">{roomType}</span>
                    </div>

                    {/* Quick Amenities Icons */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2 py-0.5 bg-slate-950/20 text-[9px] text-slate-400 rounded-md border border-[rgba(255,255,255,0.05)] flex items-center gap-1">
                        <i className="fa-solid fa-wifi text-emerald-400 text-[8px]"></i> Free WiFi
                      </span>
                      <span className="px-2 py-0.5 bg-slate-950/20 text-[9px] text-slate-400 rounded-md border border-[rgba(255,255,255,0.05)] flex items-center gap-1">
                        <i className="fa-solid fa-square-parking text-sky-400 text-[8px]"></i> Parking
                      </span>
                      {activeTab !== 'low' && (
                        <span className="px-2 py-0.5 bg-slate-950/20 text-[9px] text-slate-400 rounded-md border border-[rgba(255,255,255,0.05)] flex items-center gap-1">
                          <i className="fa-solid fa-mug-hot text-amber-400 text-[8px]"></i> Breakfast
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-2">
                    {hotel.desc || `Comfortable accommodation in ${destination} featuring verified amenities and active support.`}
                  </p>

                  <div className="border-t border-[rgba(255,255,255,0.04)] pt-3 mt-auto flex justify-between items-center text-[10px] text-slate-500 font-semibold gap-2 flex-wrap">
                    <span>
                      <i className="fa-solid fa-compass text-slate-600 mr-1"></i>
                      Coords: {hotel.coords || 'N/A'}
                    </span>
                    <div className="flex gap-2 items-center">
                      {onViewOnMap && hotel.coords && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewOnMap(hotel.coords, hotel.name); }}
                          className="px-2 py-0.5 bg-royalIndigo/20 hover:bg-royalIndigo/45 text-royalIndigo border border-royalIndigo/30 rounded font-bold uppercase transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-map-location-dot"></i> View
                        </button>
                      )}
                      {hotel.map_link && (
                        <a 
                          href={hotel.map_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[rgba(255,255,255,0.08)] rounded font-bold uppercase transition flex items-center gap-1"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i> Map
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2 mt-2 pt-2.5 border-t border-[rgba(255,255,255,0.04)]">
                    <button 
                      onClick={() => alert(`Redirecting to partner booking portal for ${hotel.name}...`)}
                      className="flex-grow py-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold hover:brightness-110 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-calendar-check text-[11px]"></i> Book Now
                    </button>
                    
                    <button 
                      onClick={() => onToggleFavorite && onToggleFavorite('hotels', hotel)}
                      className={`px-3 py-2 border rounded-lg transition active:scale-95 flex items-center justify-center cursor-pointer ${isFav ? 'bg-rose-500/15 border-rose-500/35 text-rose-500 shadow-md shadow-rose-500/10' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
                      title={isFav ? "Saved to Favorites" : "Save to Favorites"}
                    >
                      <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-[12px]`}></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HotelCard;
