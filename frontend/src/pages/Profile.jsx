import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);
  const [tripsCount, setTripsCount] = useState(0);
  const [newName, setNewName] = useState(user ? user.name : '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Travel Preferences States
  const [budget, setBudget] = useState('Medium');
  const [transport, setTransport] = useState('Car');
  const [interests, setInterests] = useState(['Nature', 'Food']);
  const [duration, setDuration] = useState(5);
  const [prefSavedMessage, setPrefSavedMessage] = useState(false);
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);

  // Wishlist & Settings Panels States
  const [wishlist, setWishlist] = useState([]);
  const [showWishlistSection, setShowWishlistSection] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [showSettingsInline, setShowSettingsInline] = useState(false);

  const getKeySuffix = () => user?.email || user?.phone_number || 'guest';

  // Load Saved Trips & Analytics
  useEffect(() => {
    if (!user) return;
    
    fetch('/api/trips/list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSavedTrips(data.trips || []);
          setTripsCount(data.trips.length);
        }
      })
      .catch(err => console.error("Failed to load user analytics:", err));
  }, [user]);

  // Sync state with user and load preferences from localStorage
  useEffect(() => {
    if (user) {
      setNewName(user.name);

      // Load Travel Preferences
      const storedPrefs = localStorage.getItem(`travel_prefs_${getKeySuffix()}`);
      if (storedPrefs) {
        try {
          const parsed = JSON.parse(storedPrefs);
          if (parsed.budget) setBudget(parsed.budget);
          if (parsed.transport) setTransport(parsed.transport);
          if (parsed.interests) setInterests(parsed.interests);
          if (parsed.duration) {
            const durNum = parseInt(parsed.duration);
            if (!isNaN(durNum)) setDuration(durNum);
          }
        } catch (e) {
          console.error("Failed to parse stored preferences:", e);
        }
      }

      // Load Wishlist
      const storedWishlist = localStorage.getItem(`wishlist_${getKeySuffix()}`);
      if (storedWishlist) {
        try {
          setWishlist(JSON.parse(storedWishlist));
        } catch (e) {
          console.error("Failed to parse wishlist:", e);
        }
      }
    }
  }, [user]);

  // Compute tier level label based on completed trips
  const getExplorerTier = () => {
    if (tripsCount >= 10) return 'Grand Globetrotter';
    if (tripsCount >= 6) return 'Wanderlust Specialist';
    if (tripsCount >= 3) return 'Explorer Pro';
    return 'Nomad Beginner';
  };

  const getMemberSince = () => {
    if (user?.created_at) {
      try {
        const date = new Date(user.created_at);
        return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      } catch (e) {
        return 'June 2026';
      }
    }
    return 'June 2026';
  };

  // Dynamic travel statistics calculations
  const uniqueCities = new Set();
  const uniqueStates = new Set();
  savedTrips.forEach(trip => {
    if (trip.destination) {
      const parts = trip.destination.split(',').map(s => s.trim());
      if (parts[0]) uniqueCities.add(parts[0]);
      if (parts[1]) uniqueStates.add(parts[1]);
      else uniqueStates.add(parts[0]);
    }
  });

  const citiesCount = uniqueCities.size || 0;
  const statesCount = uniqueStates.size || 0;

  const handleUpdateNameSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === user.name) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/auth/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsEditingName(false);
      } else {
        const err = await res.json();
        alert(`Failed to update name: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      alert("Network error. Unable to update name.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1500000) {
      alert("Image is too large. Please select a photo smaller than 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch('/api/auth/update-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64Data })
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          const err = await res.json();
          alert(`Failed to update photo: ${err.detail || 'Server error'}`);
        }
      } catch (err) {
        alert("Network error. Unable to update profile photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    const prefs = {
      budget,
      transport,
      interests,
      duration: `${duration} Days`
    };
    localStorage.setItem(`travel_prefs_${getKeySuffix()}`, JSON.stringify(prefs));
    window.dispatchEvent(new Event('storage'));
    
    setPrefSavedMessage(true);
    setTimeout(() => setPrefSavedMessage(false), 3000);
  };

  const handleToggleInterest = (interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    window.dispatchEvent(new Event('storage'));
    alert("Gemini/Groq API Key successfully updated!");
    setShowSettingsInline(false);
  };

  const handleRemoveFromWishlist = (destName) => {
    const updated = wishlist.filter(d => d !== destName);
    localStorage.setItem(`wishlist_${getKeySuffix()}`, JSON.stringify(updated));
    setWishlist(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleExploreWishlistItem = (destName) => {
    localStorage.setItem('prefilled_dest', destName);
    navigate('/dashboard');
    window.dispatchEvent(new Event('prefill_destination'));
  };

  const handleReloadTrip = (trip) => {
    navigate('/dashboard', { state: { loadedTrip: trip } });
  };

  const getRecentActivitiesList = () => {
    const mockActivities = [
      {
        id: 'mock-1',
        destination: 'Ahmedabad ➔ Bhubaneswar',
        created_at: '2026-05-22',
        days: 2,
        relativeTime: '2 Days Ago',
        image: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=150&q=80'
      },
      {
        id: 'mock-2',
        destination: 'Bhubaneswar ➔ Gangtok',
        created_at: '2026-05-15',
        days: 7,
        relativeTime: '1 Week Ago',
        image: 'https://images.unsplash.com/photo-1578593139832-6a75f85b6727?auto=format&fit=crop&w=150&q=80'
      },
      {
        id: 'mock-3',
        destination: 'Delhi ➔ Jaipur',
        created_at: '2026-05-02',
        days: 21,
        relativeTime: '3 Weeks Ago',
        image: 'https://images.unsplash.com/photo-1477584305590-38772fc21133?auto=format&fit=crop&w=150&q=80'
      }
    ];

    if (savedTrips.length === 0) {
      return mockActivities;
    }

    return savedTrips.slice(0, 3).map((trip, idx) => {
      let relativeTime = 'Recently';
      const diffMs = Date.now() - new Date(trip.created_at || Date.now()).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) relativeTime = 'Today';
      else if (diffDays === 1) relativeTime = 'Yesterday';
      else if (diffDays < 7) relativeTime = `${diffDays} Days Ago`;
      else if (diffDays < 30) relativeTime = `${Math.floor(diffDays / 7)} Week${Math.floor(diffDays / 7) > 1 ? 's' : ''} Ago`;
      else relativeTime = `${Math.floor(diffDays / 30)} Month${Math.floor(diffDays / 30) > 1 ? 's' : ''} Ago`;

      if (idx < mockActivities.length && !trip.created_at) {
        relativeTime = mockActivities[idx].relativeTime;
      }

      let image = 'https://images.unsplash.com/photo-1506469717960-433cd8b6b99e?auto=format&fit=crop&w=150&q=80';
      const destLower = (trip.destination || '').toLowerCase();
      if (destLower.includes('munnar') || destLower.includes('kerala')) {
        image = 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=150&q=80';
      } else if (destLower.includes('agra') || destLower.includes('taj')) {
        image = 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=150&q=80';
      } else if (destLower.includes('ladakh') || destLower.includes('leh')) {
        image = 'https://images.unsplash.com/photo-1590050752117-238cb0612b1b?auto=format&fit=crop&w=150&q=80';
      } else if (destLower.includes('goa')) {
        image = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80';
      } else if (destLower.includes('rishikesh')) {
        image = 'https://images.unsplash.com/photo-1545638190-27a1b32d018d?auto=format&fit=crop&w=150&q=80';
      } else if (idx < mockActivities.length) {
        image = mockActivities[idx].image;
      }

      const destText = trip.start_location && trip.destination 
        ? `${trip.start_location} ➔ ${trip.destination}`
        : trip.destination;

      return {
        id: trip.id || `trip-${idx}`,
        destination: destText,
        created_at: trip.created_at,
        relativeTime,
        image,
        tripData: trip
      };
    });
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  const recentActivities = getRecentActivitiesList();

  return (
    <div className="w-full max-w-[1240px] mx-auto p-4 md:p-6 lg:p-8 animate-fade-in text-left">
      
      {/* Dashboard Heading Banner */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Profile</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Manage your account, preferences and travel insights
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Profile Info & Travel Preferences */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Card 1: Profile Information */}
          <div className="glass-panel p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-sunsetCoral/5 via-transparent to-royalIndigo/5 pointer-events-none" />
            
            {/* Header / Avatar Box */}
            <div className="flex items-center gap-4">
              <div 
                className="relative group cursor-pointer shrink-0" 
                onClick={() => document.getElementById('avatar-upload-input').click()}
                title="Change Profile Avatar"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-sunsetCoral flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden border border-slate-800/80">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user?.name || 'S').charAt(0).toUpperCase()
                  )}
                </div>
                {/* Camera Overlay */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-white transition duration-200">
                  <i className="fa-solid fa-camera text-[10px]"></i>
                </div>
                <input 
                  type="file" 
                  id="avatar-upload-input" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </div>

              {/* Name & Email */}
              <div className="min-w-0 flex-grow">
                {isEditingName ? (
                  <form onSubmit={handleUpdateNameSubmit} className="flex items-center gap-1.5 w-full">
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      required
                      autoFocus
                      className="glass-input px-3 py-1.5 text-xs text-white max-w-[150px] bg-slate-950/60 border border-slate-800 rounded-lg outline-none focus:border-sunsetCoral" 
                      placeholder="Display Name"
                    />
                    <button 
                      type="submit" 
                      disabled={isUpdating || !newName.trim() || newName.trim() === user?.name}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition duration-200"
                      title="Save"
                    >
                      <i className="fa-solid fa-check text-xs"></i>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setIsEditingName(false); setNewName(user?.name || ''); }}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition duration-200"
                      title="Cancel"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-wide truncate">{user?.name || 'Smruti Ranjan Das'}</h2>
                    <i 
                      className="fa-solid fa-pen text-[10px] text-slate-500 hover:text-white cursor-pointer transition"
                      onClick={() => setIsEditingName(true)}
                      title="Edit Name"
                    ></i>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <span className="truncate max-w-[170px]" title={user?.email || 'smrutiranjandas2619@gmail.com'}>
                    {user?.email || 'smrutiranjandas2619@gmail.com'}
                  </span>
                  <i 
                    className="fa-regular fa-copy cursor-pointer text-slate-500 hover:text-white transition"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.email || 'smrutiranjandas2619@gmail.com');
                      alert('Email copied to clipboard!');
                    }}
                    title="Copy Email"
                  ></i>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-[rgba(255,255,255,0.05)] my-5" />

            {/* Profile Metadata grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider block">Member Since</span>
                <span className="text-slate-300 font-bold mt-1.5 flex items-center justify-center gap-1">
                  <i className="fa-regular fa-calendar text-[10px] text-slate-500"></i>
                  {getMemberSince()}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider block">Account Status</span>
                <span className="inline-flex items-center justify-center mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1.5 tracking-wider">
                  Active
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider block">Account Type</span>
                <span className="text-amber-500 font-bold mt-1.5 flex items-center justify-center gap-1">
                  <i className="fa-solid fa-crown text-[10px] text-amber-500"></i>
                  Premium
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button 
              onClick={() => setIsEditingName(true)}
              className="w-full mt-6 py-2.5 bg-slate-950/40 hover:bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-pen text-[10px]"></i>
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Card 2: Travel Preferences */}
          <div className="glass-panel p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-3 mb-5">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-sliders text-amber-500 text-xs"></i>
                <span>Travel Preferences</span>
              </h3>
              {!isEditingPrefs && (
                <button 
                  type="button" 
                  onClick={() => setIsEditingPrefs(true)}
                  className="px-2.5 py-1 border border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400 hover:text-white text-[10px] font-bold rounded-lg transition"
                >
                  Manage
                </button>
              )}
            </div>

            {isEditingPrefs ? (
              <form 
                onSubmit={(e) => { 
                  handleSavePreferences(e); 
                  setIsEditingPrefs(false); 
                }} 
                className="flex flex-col gap-4 text-xs"
              >
                {/* Budget */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Budget Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Budget', 'Medium', 'Luxury'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setBudget(level)}
                        className={`py-2 px-3 border rounded-xl font-bold transition duration-300 text-center ${
                          budget === level 
                            ? 'bg-sunsetCoral/15 border-sunsetCoral text-white' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400'
                        }`}
                      >
                        {level === 'Medium' ? 'Mid-Range' : level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preferred Transport</label>
                  <select
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    className="glass-input p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sunsetCoral transition w-full font-bold cursor-pointer"
                  >
                    {['Flight', 'Train', 'Car', 'Bus'].map((mode) => (
                      <option key={mode} value={mode} className="bg-[#0b0e14] text-slate-300">
                        {mode === 'Car' ? 'Road Trip (Car)' : mode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interests */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Travel Interests</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Nature', 'Food', 'Adventure', 'Culture', 'Beach', 'Spiritual'].map((interest) => {
                      const active = interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleToggleInterest(interest)}
                          className={`py-1.5 px-3 border rounded-xl font-bold transition duration-200 text-xs ${
                            active
                              ? 'bg-royalIndigo/15 border-royalIndigo text-white'
                              : 'border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Duration</label>
                    <span className="text-white font-extrabold">{duration} Days</span>
                  </div>
                  <input 
                    type="range"
                    min="2"
                    max="14"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sunsetCoral"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPrefs(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-900/60 transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white text-xs font-bold rounded-xl transition hover:brightness-110 active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Budget */}
                <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-[rgba(255,255,255,0.02)] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <i className="fa-solid fa-wallet text-sm"></i>
                    </div>
                    <span className="text-slate-400 font-semibold text-xs">Budget Preference</span>
                  </div>
                  <span className="text-amber-500 font-extrabold text-xs">{budget === 'Medium' ? 'Mid-Range' : budget}</span>
                </div>

                {/* Transport */}
                <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-[rgba(255,255,255,0.02)] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                      <i className="fa-solid fa-plane text-sm"></i>
                    </div>
                    <span className="text-slate-400 font-semibold text-xs">Preferred Transport</span>
                  </div>
                  <span className="text-emerald-500 font-extrabold text-xs">
                    {transport === 'Car' ? 'Road Trip (Car)' : (transport === 'Flight' ? 'Train, Flight' : transport)}
                  </span>
                </div>

                {/* Interests */}
                <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-[rgba(255,255,255,0.02)] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                      <i className="fa-solid fa-heart text-sm"></i>
                    </div>
                    <span className="text-slate-400 font-semibold text-xs">Travel Interests</span>
                  </div>
                  <span className="text-rose-400 font-extrabold text-xs max-w-[150px] truncate text-right" title={interests.join(', ')}>
                    {interests.join(', ') || 'Food, Culture, Nature'}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-[rgba(255,255,255,0.02)] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                      <i className="fa-solid fa-clock text-sm"></i>
                    </div>
                    <span className="text-slate-400 font-semibold text-xs">Average Trip Duration</span>
                  </div>
                  <span className="text-indigo-400 font-extrabold text-xs">{duration} Days</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Lifetime Statistics & Recent Activity */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* Card 3: Lifetime Statistics */}
          <div className="glass-panel p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3 mb-5">
              <i className="fa-solid fa-chart-line text-indigo-400 text-xs"></i>
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Lifetime Statistics</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Trips Planned */}
              <div className="glass-panel p-4 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3.5 hover:border-slate-800 transition duration-300 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-md shrink-0">
                  <i className="fa-solid fa-plane-departure text-sm"></i>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-tight">{tripsCount || 18}</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Trips Planned</span>
                </div>
              </div>
              
              {/* Cities Explored */}
              <div className="glass-panel p-4 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3.5 hover:border-slate-800 transition duration-300 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-md shrink-0">
                  <i className="fa-solid fa-city text-sm"></i>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-tight">{citiesCount || 34}</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Cities Explored</span>
                </div>
              </div>
              
              {/* Hotels Viewed */}
              <div className="glass-panel p-4 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3.5 hover:border-slate-800 transition duration-300 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-md shrink-0">
                  <i className="fa-solid fa-file-invoice text-sm"></i>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-tight">127</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Hotels Viewed</span>
                </div>
              </div>
              
              {/* Attractions Saved */}
              <div className="glass-panel p-4 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3.5 hover:border-slate-800 transition duration-300 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-md shrink-0">
                  <i className="fa-solid fa-star text-sm"></i>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-tight">{wishlist.length || 89}</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Attractions Saved</span>
                </div>
              </div>

              {/* Restaurants Viewed */}
              <div className="glass-panel p-4 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3.5 hover:border-slate-800 transition duration-300 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-md shrink-0">
                  <i className="fa-solid fa-utensils text-sm"></i>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-tight">210</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Restaurants Viewed</span>
                </div>
              </div>

              {/* Total Budget Planned */}
              <div className="glass-panel p-4 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3.5 hover:border-slate-800 transition duration-300 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-400 border border-lime-500/20 shadow-md shrink-0">
                  <i className="fa-solid fa-clock text-sm"></i>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-tight">₹4.2L</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Total Budget Planned</span>
                </div>
              </div>

            </div>
          </div>

          {/* Card 4: Recent Activity */}
          <div className="glass-panel p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-regular fa-clock text-sky-400 text-xs"></i>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Recent Activity</h3>
              </div>
              <span 
                onClick={() => navigate('/my-trips')}
                className="text-[10px] text-slate-500 hover:text-white font-bold uppercase cursor-pointer flex items-center gap-0.5"
              >
                View All <i className="fa-solid fa-chevron-right text-[9px] ml-0.5"></i>
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {recentActivities.map((act) => (
                <div 
                  key={act.id} 
                  className="flex items-center justify-between gap-4 p-3.5 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl hover:border-slate-800/80 transition duration-200"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={act.image} 
                      alt={act.destination} 
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-850"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate leading-snug">{act.destination}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                        Planned on {new Date(act.created_at || '2026-05-22').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 bg-slate-950/45 border border-slate-850 text-slate-400 text-[10px] font-bold rounded-full whitespace-nowrap">
                    {act.relativeTime}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM SECTION: Quick Actions */}
      <div className="glass-panel p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl mt-6">
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3 mb-5">
          <i className="fa-solid fa-bolt text-yellow-400 text-xs"></i>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Actions</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Action 1: Plan New Trip */}
          <div 
            onClick={() => navigate('/dashboard')}
            className="p-5 bg-gradient-to-r from-amber-500/10 to-sunsetCoral/5 hover:from-amber-500/20 hover:to-sunsetCoral/10 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl flex flex-col justify-between h-[120px] transition duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div>
              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 mb-2 shrink-0">
                <i className="fa-solid fa-compass text-sm animate-pulse-slow"></i>
              </div>
              <h4 className="text-sm font-black text-white">Plan New Trip</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">Start planning your next adventure</p>
            </div>
            <div className="absolute bottom-4 right-4 text-slate-400 group-hover:text-white transition duration-200">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </div>

          {/* Action 2: My Itineraries */}
          <div 
            onClick={() => navigate('/my-trips')}
            className="p-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 hover:from-blue-500/20 hover:to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl flex flex-col justify-between h-[120px] transition duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div>
              <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 mb-2 shrink-0">
                <i className="fa-solid fa-folder text-sm"></i>
              </div>
              <h4 className="text-sm font-black text-white">My Itineraries</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">View and manage your saved itineraries</p>
            </div>
            <div className="absolute bottom-4 right-4 text-slate-400 group-hover:text-white transition duration-200">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </div>

          {/* Action 3: Favorites */}
          <div 
            onClick={() => setShowWishlistSection(!showWishlistSection)}
            className={`p-5 bg-gradient-to-r from-rose-500/10 to-pink-500/5 hover:from-rose-500/20 hover:to-pink-500/10 border rounded-2xl flex flex-col justify-between h-[120px] transition duration-300 group cursor-pointer relative overflow-hidden ${
              showWishlistSection ? 'border-rose-500/40' : 'border-rose-500/20'
            }`}
          >
            <div>
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 mb-2 shrink-0">
                <i className="fa-solid fa-heart text-sm"></i>
              </div>
              <h4 className="text-sm font-black text-white">Favorites</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">View your favorite places and attractions</p>
            </div>
            <div className="absolute bottom-4 right-4 text-slate-400 group-hover:text-white transition duration-200">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </div>

          {/* Action 4: Settings */}
          <div 
            onClick={() => setShowSettingsInline(!showSettingsInline)}
            className={`p-5 bg-gradient-to-r from-teal-500/10 to-emerald-500/5 hover:from-teal-500/20 hover:to-emerald-500/10 border rounded-2xl flex flex-col justify-between h-[120px] transition duration-300 group cursor-pointer relative overflow-hidden ${
              showSettingsInline ? 'border-teal-500/40' : 'border-teal-500/20'
            }`}
          >
            <div>
              <div className="w-9 h-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 mb-2 shrink-0">
                <i className="fa-solid fa-gear text-sm"></i>
              </div>
              <h4 className="text-sm font-black text-white">Settings</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">Manage your account and preferences</p>
            </div>
            <div className="absolute bottom-4 right-4 text-slate-400 group-hover:text-white transition duration-200">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </div>

        </div>
      </div>

      {/* Inline API Configuration Box */}
      {showSettingsInline && (
        <div className="glass-panel p-6 bg-slate-900/40 border border-indigo-500/20 rounded-2xl mt-4 animate-fade-in text-xs max-w-md">
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-3 mb-4">
            <span className="font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-lock text-xs mr-1"></i> API Configuration
            </span>
            <button onClick={() => setShowSettingsInline(false)} className="text-slate-500 hover:text-white">
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Gemini / Groq LLM Key</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              className="glass-input p-3 text-xs w-full bg-slate-950/60 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500" 
              placeholder="Paste gsk_ or AIzaSy API key"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Your token is cached locally in `localStorage` and never uploaded to our servers.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              onClick={() => setShowSettingsInline(false)} 
              className="py-2 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-900/60 transition active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveApiKey} 
              className="py-2 bg-gradient-to-r from-royalIndigo to-indigo-500 text-white text-xs font-bold rounded-xl hover:brightness-110 active:scale-95 transition"
            >
              Save Config
            </button>
          </div>
        </div>
      )}

      {/* Bookmarked Favorites Drawer */}
      {showWishlistSection && (
        <div className="glass-panel p-6 bg-slate-900/40 border border-rose-500/20 rounded-2xl mt-4 animate-fade-in text-xs max-w-md">
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-3 mb-4">
            <span className="font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-heart text-rose-400 text-xs mr-1"></i> Saved Wishlist
            </span>
            <button onClick={() => setShowWishlistSection(false)} className="text-slate-500 hover:text-white">
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
          
          {wishlist.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No favorites saved yet. Add destinations to your wishlist to manage them here.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {wishlist.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-[rgba(255,255,255,0.03)] rounded-xl text-xs hover:bg-slate-900/70 transition">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <i className="fa-solid fa-map-pin text-sunsetCoral text-xs mr-1"></i>
                    {item}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleExploreWishlistItem(item)}
                      className="px-2 py-1 bg-sunsetCoral/10 hover:bg-sunsetCoral/20 text-sunsetCoral text-[10px] font-bold rounded-lg transition"
                    >
                      Explore
                    </button>
                    <button 
                      onClick={() => handleRemoveFromWishlist(item)}
                      className="p-1 hover:bg-rose-500/10 text-rose-400 rounded-lg transition"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer copyright */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-t border-[rgba(255,255,255,0.05)] pt-4 mt-8 text-[10px] text-slate-500 font-semibold gap-2">
        <span>© 2026 India Tour Planner. Powered by FastAPI + SQLite + Gemini/Groq RAG.</span>
        <span className="flex items-center gap-1">
          <i className="fa-solid fa-shield-halved"></i>
          <span>All your data is safe and secure with us.</span>
        </span>
      </div>
    </div>
  );
};

export default Profile;
