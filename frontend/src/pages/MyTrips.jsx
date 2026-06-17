import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyTrips = () => {
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyTrips = async () => {
    try {
      const res = await fetch('/api/trips/list');
      if (res.ok) {
        const data = await res.json();
        setSavedTrips(data.trips || []);
      }
    } catch (err) {
      console.error("Could not sync with SQLite db:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTrips();
  }, []);

  const handleDeleteSavedTrip = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this itinerary plan from your profile?")) return;

    try {
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedTrips(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      alert("Delete failed. Server unreachable.");
    }
  };

  const handleReloadSavedTrip = (trip) => {
    // Navigate back to dashboard passing the loaded trip dossier as React Router state!
    navigate('/dashboard', { state: { loadedTrip: trip } });
  };

  return (
    <section className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full animate-fade-in p-4">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">My Saved Itineraries</h2>
          <p className="text-xs text-slate-400">Manage and reload your saved travel packages and budget logs</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-[rgba(255,255,255,0.08)] rounded-xl transition active:scale-95 flex items-center gap-1.5"
        >
          <i className="fa-solid fa-plus text-marigoldGold"></i> 
          <span>Plan New Trip</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 font-bold py-10">Fetching your itineraries...</div>
      ) : savedTrips.length === 0 ? (
        <div className="text-center text-slate-500 py-10 glass-panel border-dashed border-slate-800 bg-slate-900/10">
          <i className="fa-solid fa-folder-open text-4xl text-slate-700 mb-2"></i>
          <p className="font-bold">No saved travel dossiers found</p>
          <p className="text-xs text-slate-600 mt-1">Configure a trip plan on the dashboard and save it to review here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedTrips.map((trip) => (
            <div key={trip.id} className="glass-panel p-5 flex flex-col gap-4 bg-slate-900/25">
              <div className="flex justify-between items-start gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-route text-sunsetCoral"></i>
                    {trip.destination}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                    From {trip.start_location} • {trip.days} Days
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-royalIndigo/15 border border-royalIndigo/30 rounded-md text-[9px] text-royalIndigo font-extrabold uppercase tracking-wide">
                  {trip.budget_category}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between border-b border-[rgba(255,255,255,0.02)] pb-1.5">
                  <span className="text-slate-500"><i className="fa-solid fa-users mr-1.5"></i>Travelers:</span>
                  <span className="text-white font-bold">{trip.travelers} Persons</span>
                </div>
                <div className="flex justify-between border-b border-[rgba(255,255,255,0.02)] pb-1.5">
                  <span className="text-slate-500"><i className="fa-solid fa-wallet mr-1.5"></i>Total Estimated:</span>
                  <span className="text-white font-black text-sunsetCoral">₹{trip.total_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500"><i className="fa-solid fa-calendar-day mr-1.5"></i>Saved At:</span>
                  <span className="text-slate-400">{new Date(trip.saved_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-[rgba(255,255,255,0.05)] pt-3 mt-1">
                <button 
                  onClick={() => handleDeleteSavedTrip(trip.id)} 
                  className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition active:scale-95" 
                  title="Delete Saved Trip"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
                <button 
                  onClick={() => handleReloadSavedTrip(trip)} 
                  className="flex-grow py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold border border-[rgba(255,255,255,0.06)] rounded-xl transition active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-folder-open text-marigoldGold"></i>
                  <span>View Dossier</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyTrips;
