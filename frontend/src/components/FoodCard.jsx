import React, { useState } from 'react';
import { getDynamicRestaurants } from '../utils/seededAccommodations';

const getFoodImage = (foodName) => {
  const name = foodName.toLowerCase();
  if (name.includes('biryani') || name.includes('rice') || name.includes('pulao')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
  if (name.includes('dosa') || name.includes('idli') || name.includes('uttapam') || name.includes('south')) return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80';
  if (name.includes('thali') || name.includes('meal') || name.includes('roti') || name.includes('naan')) return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80';
  if (name.includes('fish') || name.includes('seafood') || name.includes('crab') || name.includes('prawn')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80';
  if (name.includes('sweet') || name.includes('rasgulla') || name.includes('peda') || name.includes('halwa') || name.includes('sandesh') || name.includes('kheer')) return 'https://images.unsplash.com/photo-1589302168068-9646c2e929f1?auto=format&fit=crop&w=600&q=80';
  if (name.includes('chaat') || name.includes('puchka') || name.includes('samosa') || name.includes('kachori') || name.includes('panipuri')) return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80';
  // generic fallback
  return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80';
};

const FoodCard = ({ foods, restaurants: propRestaurants, destination, onViewOnMap, favorites = [], onToggleFavorite }) => {
  const [filter, setFilter] = useState('all');
  const restaurants = propRestaurants || getDynamicRestaurants(destination);

  if (!foods || foods.length === 0) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="border-b border-[rgba(255,255,255,0.05)] pb-3">
          <h3 className="text-lg font-bold text-white">Food Recommendation Engine</h3>
          <p className="text-xs text-slate-500">Discover regional foods, local street corners, and dining costs</p>
        </div>
        <p className="text-xs text-slate-500 text-center py-10">Select a destination to view regional culinary delights</p>
      </div>
    );
  }

  // Filter foods by type
  const filteredFoods = foods.filter(food => {
    if (filter === 'veg') return food.type === 'veg';
    if (filter === 'non-veg') return food.type === 'non-veg';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Food Recommendation Engine Section */}
      <div className="flex flex-col gap-4">
        <div className="border-b border-[rgba(255,255,255,0.05)] pb-3 flex justify-between items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Local Famous Delicacies</h3>
            <p className="text-[11px] text-slate-500">Traditional recipes and typical average costs per dish</p>
          </div>
          <div className="flex gap-2">
            {['all', 'veg', 'non-veg'].map((type) => (
              <button 
                key={type}
                onClick={() => setFilter(type)} 
                className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${filter === type ? 'bg-slate-800 border-[rgba(255,255,255,0.1)] text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                {type === 'all' ? 'All' : type === 'veg' ? 'Veg' : 'Non-Veg'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1">
          {filteredFoods.map((food, idx) => {
            const isFav = (favorites || []).some(fav => fav.name === food.name);
            const tryScore = (9.0 + (idx % 5) * 0.2).toFixed(1);
            const priceRange = `₹${Math.ceil(food.avg_cost * 0.8)} - ₹${Math.ceil(food.avg_cost * 1.25)}`;
            const foodImg = getFoodImage(food.name);

            return (
              <div key={idx} className="glass-panel overflow-hidden bg-slate-900/30 flex flex-col hover:border-sunsetCoral/30 transition duration-300 group">
                {/* Food Delicacy Image */}
                <div className="h-28 w-full overflow-hidden relative">
                  <img 
                    src={foodImg} 
                    alt={food.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded text-[8px] font-bold text-slate-300 uppercase flex items-center">
                    Must-Try: {tryScore}/10
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-black/75 backdrop-blur-md border border-[rgba(255,255,255,0.08)] flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${food.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className={food.type === 'veg' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{food.type}</span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col gap-2 flex-grow">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-sunsetCoral transition">
                      {food.name}
                    </h4>
                    <span className="text-[10px] text-marigoldGold font-extrabold shrink-0">{priceRange}</span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{food.desc}</p>
                  
                  <div className="flex justify-between items-center gap-2 border-t border-[rgba(255,255,255,0.04)] pt-2 mt-auto text-[9px] text-slate-500">
                    <span className="line-clamp-1 flex items-center gap-1">
                      <i className="fa-solid fa-location-dot text-[8px] text-royalIndigo"></i>
                      Best: {food.best_places}
                    </span>
                    <button 
                      onClick={() => onToggleFavorite && onToggleFavorite('restaurants', { name: food.name, type: 'Delicacy', cuisine: food.type, location: food.best_places, photo: foodImg })}
                      className={`p-1.5 border rounded-md transition active:scale-95 flex items-center justify-center cursor-pointer shrink-0 ${isFav ? 'bg-rose-500/15 border-rose-500/30 text-rose-500' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
                      title={isFav ? "Saved to Favorites" : "Save to Favorites"}
                    >
                      <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-[9px]`}></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFoods.length === 0 && (
            <div className="col-span-2 text-center text-slate-500 py-10 text-xs font-medium">No dishes matching filter.</div>
          )}
        </div>
      </div>

      {/* 2. Curated Famous Restaurants Section */}
      {destination && (
        <div className="flex flex-col gap-4 border-t border-[rgba(255,255,255,0.05)] pt-6 mt-2">
          <div className="border-b border-[rgba(255,255,255,0.05)] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Rated Local Restaurants</h3>
            <p className="text-[11px] text-slate-500">Famous dining spots, addresses, and physical locations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
            {restaurants.map((rest, idx) => {
              const isFav = (favorites || []).some(fav => fav.name === rest.name);
              return (
                <div 
                  key={idx} 
                  className="glass-panel overflow-hidden bg-slate-900/30 flex flex-col hover:border-sunsetCoral/30 transition duration-300 group"
                >
                  {/* Restaurant Image */}
                  <div className="h-32 w-full overflow-hidden relative">
                    <img 
                      src={rest.photo} 
                      alt={rest.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/65 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded text-[9px] font-bold text-marigoldGold uppercase flex items-center gap-0.5">
                      <i className="fa-solid fa-star"></i> {rest.rating || '4.5'}
                    </div>
                  </div>

                  {/* Restaurant Details */}
                  <div className="p-3.5 flex flex-col gap-2 flex-grow">
                    <div>
                      <h4 className="text-xs font-extrabold text-white group-hover:text-sunsetCoral transition">
                        <i className="fa-solid fa-utensils text-sunsetCoral mr-1.5 text-[10px]"></i>
                        {rest.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider line-clamp-1">
                        <i className="fa-solid fa-location-dot text-[8px] text-royalIndigo mr-1"></i>
                        {rest.location}
                      </p>
                      {rest.price_range && (
                        <p className="text-[9px] text-marigoldGold font-bold mt-0.5">
                          <i className="fa-solid fa-indian-rupee-sign mr-1"></i> Cost: {rest.price_range}
                        </p>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                      {rest.desc || `Popular local dining spot in ${destination || 'the area'} offering delicious authentic meals.`}
                    </p>

                    <div className="border-t border-[rgba(255,255,255,0.04)] pt-2 mt-auto text-[8px] text-slate-500 flex justify-between items-center font-bold gap-2 flex-wrap">
                      <span>
                        <i className="fa-solid fa-fire text-sunsetCoral mr-1"></i>
                        Specialty: {rest.cuisine}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        {onViewOnMap && rest.coords && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onViewOnMap(rest.coords, rest.name); }}
                            className="px-1.5 py-0.5 bg-sunsetCoral/20 hover:bg-sunsetCoral/45 text-sunsetCoral border border-sunsetCoral/30 rounded font-bold uppercase transition active:scale-95 flex items-center gap-0.5 cursor-pointer"
                          >
                            <i className="fa-solid fa-map-location-dot"></i> View
                          </button>
                        )}
                        {rest.map_link && (
                          <a 
                            href={rest.map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[rgba(255,255,255,0.08)] rounded font-bold uppercase transition flex items-center gap-0.5"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i> Map
                          </a>
                        )}
                        <button 
                          onClick={() => onToggleFavorite && onToggleFavorite('restaurants', rest)}
                          className={`p-1 border rounded transition active:scale-95 flex items-center justify-center cursor-pointer ${isFav ? 'bg-rose-500/15 border-rose-500/30 text-rose-500' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
                          title={isFav ? "Saved to Favorites" : "Save to Favorites"}
                        >
                          <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-[10px]`}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};

export default FoodCard;
