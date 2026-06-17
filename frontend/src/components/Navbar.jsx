import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marked } from 'marked';

const DREAM_DESTINATIONS = [
  {
    name: "Munnar, Kerala",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80",
    tags: ["Nature", "Hills", "Food"],
    matchScore: 98,
    whyRecommended: "Based on your interest in nature, scenic tea gardens, and comfortable road trip budget.",
    budget: "₹12,500 - 18,000",
    duration: "3-4 Days",
    bestTime: "September - May",
    category: "Medium"
  },
  {
    name: "Taj Mahal, Agra",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    tags: ["Culture", "History", "Food"],
    matchScore: 95,
    whyRecommended: "Perfect fit for your historical interest, rich Indian heritage, and weekend budget travel.",
    budget: "₹8,000 - 12,000",
    duration: "2 Days",
    bestTime: "October - March",
    category: "Budget"
  },
  {
    name: "Leh Ladakh, UT",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0612b1b?auto=format&fit=crop&w=600&q=80",
    tags: ["Adventure", "Nature", "Culture"],
    matchScore: 97,
    whyRecommended: "Highly matches your interest in raw adventure, remote scenic valleys, and premium travel comfort.",
    budget: "₹30,000 - 45,000",
    duration: "6-8 Days",
    bestTime: "May - September",
    category: "Luxury"
  },
  {
    name: "Goa Beaches",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    tags: ["Beach", "Food", "Adventure"],
    matchScore: 92,
    whyRecommended: "Great recommendation for a relaxing beach stay, coastal cuisines, and medium cost travel modes.",
    budget: "₹15,000 - 22,000",
    duration: "4-5 Days",
    bestTime: "November - February",
    category: "Medium"
  },
  {
    name: "Rishikesh, Uttarakhand",
    image: "https://images.unsplash.com/photo-1545638190-27a1b32d018d?auto=format&fit=crop&w=600&q=80",
    tags: ["Spiritual", "Adventure", "Nature"],
    matchScore: 94,
    whyRecommended: "Matches your interest in spiritual growth, river rafting adventures, and budget travel.",
    budget: "₹9,000 - 13,500",
    duration: "3 Days",
    bestTime: "September - June",
    category: "Budget"
  }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [statusText, setStatusText] = useState('Budget Only (No Key)');
  const [statusClass, setStatusClass] = useState('hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-semibold');
  const [isOpen, setIsOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState(localStorage.getItem('CUSTOM_RAG_PREFERENCE') || '');
  const [showPreferences, setShowPreferences] = useState(false);

  // Theme Switching State & Lifecycle
  const [theme, setTheme] = useState(localStorage.getItem('THEME') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('THEME', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Sidebar stats & recommendations dynamic states
  const [tripsCount, setTripsCount] = useState(0);
  const [savedTrips, setSavedTrips] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(`wishlist_${user?.email || 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  });

  const [travelPrefs, setTravelPrefs] = useState({
    budget: 'Medium',
    transport: 'Car',
    interests: ['Nature', 'Food'],
    duration: '5 Days'
  });

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`travel_prefs_${user.email || 'guest'}`);
    if (stored) {
      try {
        setTravelPrefs(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/trips/list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTripsCount(data.trips.length);
          setSavedTrips(data.trips);
        }
      })
      .catch(err => console.error("Failed to load sidebar analytics:", err));
  }, [user]);

  const toggleWishlist = (destName) => {
    setWishlist(prev => {
      let updated;
      if (prev.includes(destName)) {
        updated = prev.filter(d => d !== destName);
      } else {
        updated = [...prev, destName];
      }
      localStorage.setItem(`wishlist_${user?.email || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleExploreDreamDest = (destName) => {
    localStorage.setItem('prefilled_dest', destName);
    setIsOpen(false);
    navigate('/dashboard');
    window.dispatchEvent(new Event('prefill_destination'));
  };

  const handleQuickAction = (styleType) => {
    setIsOpen(false);
    navigate('/dashboard');
    localStorage.setItem('quick_action_type', styleType);
    window.dispatchEvent(new Event('quick_action_trigger'));
  };

  const getDreamDestination = () => {
    const userInterests = travelPrefs.interests || [];
    let bestDest = DREAM_DESTINATIONS[0];
    let maxMatch = -1;

    DREAM_DESTINATIONS.forEach(dest => {
      let score = 0;
      dest.tags.forEach(tag => {
        if (userInterests.some(ui => ui.toLowerCase() === tag.toLowerCase())) {
          score += 2;
        }
      });
      if (travelPrefs.budget && dest.category.toLowerCase() === travelPrefs.budget.toLowerCase()) {
        score += 1;
      }
      if (score > maxMatch) {
        maxMatch = score;
        bestDest = dest;
      }
    });

    return bestDest;
  };

  const dreamDest = getDreamDestination();

  // Sidebar direct search states
  const [searching, setSearching] = useState(false);
  const [sidebarResponse, setSidebarResponse] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSidebarSearch = async () => {
    if (!customQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setSidebarResponse('');

    const key = localStorage.getItem('GEMINI_API_KEY') || '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: customQuery,
          history: [],
          api_key: key
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.response) {
          setSidebarResponse(data.response);
        } else {
          setSearchError('RAG Search returned an empty response.');
        }
      } else {
        const err = await res.json();
        setSearchError(err.detail || 'Failed to search AI.');
      }
    } catch (err) {
      setSearchError('Connection timed out. Server offline.');
    } finally {
      setSearching(false);
    }
  };

  // Sidebar Chatbot States & Handlers
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Greetings! I am your Travel Consultant. Ask me details, request cheap route alternatives, best times to walk through hidden gems, or customize parts of your trip plan!'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChatMessage = async () => {
    if (!chatQuery.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatQuery.trim() };
    const currentQuery = chatQuery.trim();
    setChatHistory(prev => [...prev, userMessage]);
    setChatQuery('');
    setChatLoading(true);

    const key = localStorage.getItem('GEMINI_API_KEY') || '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentQuery,
          history: chatHistory,
          api_key: key
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const err = await res.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: `### ❌ Chat Error\nCould not query LLM backend: ${err.detail || "Server error"}` }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '### ❌ Connection Error\nServer offline or request timeout.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQueryChange = (val) => {
    setCustomQuery(val);
    localStorage.setItem('CUSTOM_RAG_PREFERENCE', val);
  };

  const updateStatusBadge = (key) => {
    if (key) {
      if (key.startsWith('gsk_')) {
        setStatusText('AI Groq Cloud Active');
        setStatusClass('hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold');
      } else if (key.startsWith('AIzaSy')) {
        setStatusText('AI Gemini Cloud Active');
        setStatusClass('hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold');
      } else {
        setStatusText('AI Custom Active');
        setStatusClass('hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold');
      }
    } else {
      setStatusText('Budget Only (No Key)');
      setStatusClass('hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-semibold');
    }
  };

  useEffect(() => {
    updateStatusBadge(apiKey);
    // Listen for storage changes from other components
    const handleStorageChange = () => {
      const stored = localStorage.getItem('GEMINI_API_KEY') || '';
      setApiKey(stored);
      updateStatusBadge(stored);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [apiKey]);

  const handleSaveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    // Dispatch storage event to alert other listening components
    window.dispatchEvent(new Event('storage'));
    setShowSettingsModal(false);
    alert("API Key successfully updated! Dynamic RAG generation and follow-up consultant are now fully unlocked.");
  };
  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Top Header Navigation Bar (Global) */}
      <header className="glass-panel w-full p-4 mb-6 flex justify-between items-center gap-4 border-b border-[rgba(255,255,255,0.05)] bg-[#080b11] animate-fade-in shrink-0">
        <div className="flex items-center gap-3">
          {user && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="w-10 h-10 rounded-xl bg-slate-900 border border-[rgba(255,255,255,0.06)] hover:bg-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95 shadow-md mr-1"
              title="Toggle Navigation Menu"
            >
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sunsetCoral to-marigoldGold flex items-center justify-center shadow-lg shrink-0">
            <i className="fa-solid fa-plane-departure text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              India <span className="gradient-text-accent">Tour Planner</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Professional Travel Consultant & RAG Itinerary Architect</p>
          </div>
        </div>
      </header>

      {/* Navigation Menu Drawer */}
      {user && isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm animate-fade-in-backdrop cursor-pointer"
            onClick={() => setIsOpen(false)}
          />

          <aside 
            className="fixed left-0 top-0 h-screen z-[4050] w-[320px] max-w-[85vw] bg-[#0a0d14] border-r border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col p-5 animate-slide-in-left text-left"
            style={{
              backgroundImage: 'radial-gradient(at 0% 0%, rgba(255, 107, 107, 0.05) 0px, transparent 50%)',
            }}
          >
            {/* Header inside drawer */}
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sunsetCoral to-marigoldGold flex items-center justify-center shadow-lg shrink-0">
                  <i className="fa-solid fa-plane-departure text-white text-sm"></i>
                </div>
                <div>
                  <h2 className="text-xs font-extrabold tracking-tight text-white leading-none">
                    India <span className="gradient-text-accent">Tour Planner</span>
                  </h2>
                  <span className="text-[9px] text-slate-400 font-medium">Itinerary RAG Consultant</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-900 border border-[rgba(255,255,255,0.06)] hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90"
                title="Close Menu"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            {/* Menu Items inside Drawer */}
            <nav className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider flex-grow">
              <NavLink 
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#ff6b6b] bg-[#ff6b6b]/10 border-l-2 border-[#ff6b6b] px-3 py-2.5 rounded-r-xl transition flex items-center gap-3" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40 px-3 py-2.5 rounded-r-xl transition flex items-center gap-3"
                }
              >
                <i className="fa-solid fa-compass text-xs w-4"></i>
                <span>PLAN TRIP</span>
              </NavLink>

              <NavLink 
                to="/my-trips"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#ff6b6b] bg-[#ff6b6b]/10 border-l-2 border-[#ff6b6b] px-3 py-2.5 rounded-r-xl transition flex items-center gap-3" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40 px-3 py-2.5 rounded-r-xl transition flex items-center gap-3"
                }
              >
                <i className="fa-solid fa-briefcase text-xs w-4"></i>
                <span>MY ITINERARIES</span>
              </NavLink>

              <NavLink 
                to="/profile"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#ff6b6b] bg-[#ff6b6b]/10 border-l-2 border-[#ff6b6b] px-3 py-2.5 rounded-r-xl transition flex items-center gap-3" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40 px-3 py-2.5 rounded-r-xl transition flex items-center gap-3"
                }
              >
                <i className="fa-solid fa-user text-xs w-4"></i>
                <span>USER PROFILE</span>
              </NavLink>

              {/* Collapsible preferences */}
              <button 
                onClick={() => setShowPreferences(!showPreferences)}
                className={`px-3 py-2.5 rounded-xl transition flex items-center justify-between text-left w-full hover:text-white hover:bg-slate-900/40 ${showPreferences ? 'text-white bg-slate-900/20' : 'text-slate-400'}`}
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-sliders text-xs w-4"></i>
                  <span>AI Custom Preferences</span>
                </div>
                <i className={`fa-solid fa-chevron-down text-slate-500 text-xs transition-transform duration-300 mr-1 ${showPreferences ? 'rotate-180' : ''}`}></i>
              </button>

              {showPreferences && (
                <div className="flex flex-col gap-2 p-3 bg-slate-950/40 border border-[rgba(255,255,255,0.05)] rounded-xl mt-1 animate-fade-in text-left">
                  <textarea 
                    value={customQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    rows="3" 
                    className="glass-input p-2.5 text-xs bg-slate-950/40 border border-[rgba(255,255,255,0.05)] rounded-xl text-slate-300 outline-none focus:border-sunsetCoral transition resize-none font-medium leading-relaxed w-full" 
                    placeholder="e.g. Plan a scenic family trip, cover hidden beaches, suggest best street foods."
                  ></textarea>
                  <button 
                    onClick={handleSidebarSearch}
                    disabled={searching || !customQuery.trim()}
                    className="w-full py-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1 shadow-md shadow-sunsetCoral/10"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                  {searchError && (
                    <div className="text-[9px] text-red-400 font-bold p-2 bg-red-500/10 border border-red-500/20 rounded-lg mt-1">
                      {searchError}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Bottom Actions inside Drawer */}
            <div className="flex flex-col gap-1.5 border-t border-[rgba(255,255,255,0.06)] pt-3.5 mt-auto">
              <button 
                onClick={() => {
                  setShowChatModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-500/15 text-slate-300 hover:text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 border border-[rgba(255,255,255,0.03)]"
              >
                <i className="fa-solid fa-comments text-indigo-400 text-xs w-4 text-center"></i>
                <span>CHAT WITH US</span>
              </button>

              <button 
                onClick={() => {
                  toggleTheme();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 border border-[rgba(255,255,255,0.03)]"
              >
                <i className="fa-solid fa-lightbulb text-amber-400 text-xs w-4 text-center"></i>
                <span>NORMAL MODE</span>
              </button>

              <button 
                onClick={() => {
                  handleLogoutClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 border border-[rgba(255,255,255,0.03)]"
              >
                <i className="fa-solid fa-right-from-bracket text-red-400 text-xs w-4 text-center"></i>
                <span>SIGN OUT</span>
              </button>
            </div>
          </aside>
        </>
      )}


      {/* API KEY SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition duration-300">
          <div className="glass-panel w-full max-w-md p-6 animate-fade-in relative">
            <button 
              onClick={() => setShowSettingsModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg transition active:scale-90"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] pb-4 mb-4">
              <div className="w-9 h-9 rounded-lg bg-sunsetCoral/15 flex items-center justify-center text-sunsetCoral">
                <i className="fa-solid fa-key"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Key Settings</h3>
                <p className="text-[10px] text-slate-500">Unlock full dynamic RAG context generation</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Gemini / Groq API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="glass-input p-3 text-xs w-full" 
                  placeholder="gsk_... or AIzaSy..."
                />
                <p className="text-[10px] text-slate-500">
                  Your key remains securely in your local browser session cache (`localStorage`) and is never saved permanently on the server.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setShowSettingsModal(false)} 
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveApiKey} 
                  className="px-4 py-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white text-xs font-bold rounded-lg transition hover:brightness-110 active:scale-95 shadow-md shadow-sunsetCoral/10"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Central AI Search Advisory Modal */}
      {sidebarResponse && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition duration-300">
          <div 
            className="glass-panel w-full max-w-2xl max-h-[85vh] p-6 md:p-8 animate-fade-in relative flex flex-col gap-5 overflow-y-auto modal-panel border border-[rgba(255,255,255,0.08)] shadow-2xl rounded-2xl"
            style={{
              backgroundImage: 'radial-gradient(at 50% 0%, rgba(255, 107, 107, 0.05) 0px, transparent 50%)',
            }}
          >
            {/* Close Cross Button */}
            <button 
              onClick={() => setSidebarResponse('')} 
              className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-slate-900 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90"
              title="Close Panel"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sunsetCoral to-marigoldGold flex items-center justify-center text-white shadow-lg shadow-sunsetCoral/15">
                <i className="fa-solid fa-brain text-lg animate-pulse"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">AI Consultant Search Advisory</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dynamic RAG Knowledge Synthesis</p>
              </div>
            </div>

            {/* Original Query Reference Block */}
            <div className="p-3.5 bg-slate-950/40 border border-[rgba(255,255,255,0.03)] rounded-xl text-xs flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Your Question:</span>
              <p className="text-slate-300 font-medium italic">"{customQuery}"</p>
            </div>

            {/* AI Generated Markdown Answer (Spacious & Clean) */}
            <div 
              className="markdown-content text-xs md:text-sm text-slate-300 leading-relaxed overflow-y-auto max-h-[45vh] pr-2"
              dangerouslySetInnerHTML={{ __html: marked.parse(sidebarResponse) }}
            />

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-[rgba(255,255,255,0.06)] pt-4 mt-auto">
              <button 
                onClick={() => setSidebarResponse('')} 
                className="px-6 py-2.5 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white text-xs font-bold rounded-xl transition hover:brightness-110 active:scale-95 shadow-md shadow-sunsetCoral/10"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Central AI Chatbot Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition duration-300">
          <div 
            className="glass-panel w-full max-w-2xl max-h-[85vh] p-6 md:p-8 animate-fade-in relative flex flex-col gap-4 overflow-y-auto modal-panel border border-[rgba(255,255,255,0.08)] shadow-2xl rounded-2xl animate-fade-in"
            style={{
              backgroundImage: 'radial-gradient(at 50% 0%, rgba(129, 140, 248, 0.05) 0px, transparent 50%)',
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowChatModal(false)} 
              className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-slate-900 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90"
              title="Close Chat"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sunsetCoral to-marigoldGold flex items-center justify-center text-white shadow-lg shadow-sunsetCoral/15">
                <i className="fa-solid fa-comments text-lg animate-pulse"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Chat with us</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">get an instant reply</p>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto p-4 bg-slate-950/40 border border-[rgba(255,255,255,0.03)] rounded-xl min-h-[200px]">
              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                />
              ))}
              {chatLoading && (
                <div className="chat-bubble chat-bubble-assistant flex items-center gap-1.5 text-slate-500 font-bold py-3.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  <span>Consulting Knowledge Store...</span>
                </div>
              )}
            </div>

            {/* Input Entry Row */}
            <div className="flex gap-2 border-t border-[rgba(255,255,255,0.06)] pt-4 mt-2">
              <input 
                type="text" 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="glass-input p-3.5 text-xs flex-grow" 
                placeholder="Ask any follow up question (e.g. scenic routes, local specialties, budget checks...)"
              />
              <button 
                onClick={handleSendChatMessage}
                disabled={chatLoading || !chatQuery.trim()}
                className="px-6 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white font-bold rounded-xl text-xs hover:brightness-110 transition active:scale-95 flex items-center gap-2 shadow-md shadow-sunsetCoral/10"
              >
                <span>Send</span>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Navbar;
