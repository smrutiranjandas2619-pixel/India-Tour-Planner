import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { marked } from 'marked';

import TripPlannerForm from '../components/TripPlannerForm';
import BudgetCalculator from '../components/BudgetCalculator';
import MapView from '../components/MapView';
import ItineraryCard from '../components/ItineraryCard';
import Chatbot from '../components/Chatbot';
import FoodCard from '../components/FoodCard';
import VehicleRentalCard from '../components/VehicleRentalCard';
import HotelCard from '../components/HotelCard';
import { getDynamicHotels, getDynamicRestaurants } from '../utils/seededAccommodations';


const Dashboard = () => {
  const location = useLocation();
  
  // Dashboard Master State
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('itinerary-tab');
  const [isSaving, setIsSaving] = useState(false);
  const [weatherText, setWeatherText] = useState('Clear Skies Active');
  const [travelMode, setTravelMode] = useState('car');

  // Interactive slide-out detail drawer & Leaflet sync hooks
  const [detailDrawer, setDetailDrawer] = useState({ open: false, type: null });
  const [mapFocus, setMapFocus] = useState(null);

  // Geocoded Road Distance State
  const [calculatedDistance, setCalculatedDistance] = useState(0);

  // Favorites System State
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('india_tour_favorites');
      return stored ? JSON.parse(stored) : { hotels: [], restaurants: [], attractions: [] };
    } catch (e) {
      return { hotels: [], restaurants: [], attractions: [] };
    }
  });

  // Floating AI Assistant States
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantHistory, setAssistantHistory] = useState([
    {
      role: 'assistant',
      content: 'Greetings! I am your Travel Assistant. Ask me details, cheapest route alternatives, places open at night, or customize your trip!'
    }
  ]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const assistantEndRef = useRef(null);

  // Auto-scroll assistant
  useEffect(() => {
    assistantEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantHistory, assistantLoading]);

  // Save favorites helper
  const handleToggleFavorite = (type, item) => {
    setFavorites(prev => {
      const list = prev[type] || [];
      const exists = list.some(i => i.name === item.name);
      let updatedList;
      if (exists) {
        updatedList = list.filter(i => i.name !== item.name);
      } else {
        updatedList = [...list, item];
      }
      const updated = { ...prev, [type]: updatedList };
      localStorage.setItem('india_tour_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Distance calculation based on geocoding
  useEffect(() => {
    if (!tripData) return;
    const start = tripData.start_location || 'Delhi';
    const dest = tripData.destination || tripData.state_intelligence?.name || 'Goa';
    
    const getDist = async () => {
      try {
        const startRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(start + ", India")}`);
        const startData = await startRes.json();
        const startCoords = startData.length > 0 ? [parseFloat(startData[0].lat), parseFloat(startData[0].lon)] : [28.6139, 77.2090];

        const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest + ", India")}`);
        const destData = await destRes.json();
        const destCoords = destData.length > 0 ? [parseFloat(destData[0].lat), parseFloat(destData[0].lon)] : [15.2993, 74.1240];

        const dLat = (destCoords[0] - startCoords[0]) * Math.PI / 180;
        const dLon = (destCoords[1] - startCoords[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(startCoords[0]*Math.PI/180) * Math.cos(destCoords[0]*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const straightDist = 6371 * c;
        const roadDist = Math.max(50, Math.round(straightDist * 1.25)); // min 50km
        setCalculatedDistance(roadDist);
      } catch (e) {
        console.error("Distance geocode failed:", e);
        setCalculatedDistance(680); // baseline fallback
      }
    };
    getDist();
  }, [tripData]);

  // Floating AI send function
  const handleSendAssistant = async (customText = '') => {
    const textToSend = (customText || assistantQuery).trim();
    if (!textToSend || assistantLoading) return;

    const userMessage = { role: 'user', content: textToSend };
    setAssistantHistory(prev => [...prev, userMessage]);
    setAssistantQuery('');
    setAssistantLoading(true);

    try {
      const key = localStorage.getItem('GEMINI_API_KEY') || '';
      const context = {
        start_location: tripData?.start_location,
        destination: tripData?.destination || tripData?.state_intelligence?.name,
        days: tripData?.days,
        travelers: tripData?.travelers,
        budget_category: tripData?.budget_category,
        hotels: (tripData?.hotels || []).map(h => h.name).slice(0, 3),
        restaurants: (tripData?.restaurants || []).map(r => r.name).slice(0, 3),
        attractions: (tripData?.attractions || []).map(a => a.name).slice(0, 3)
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          history: assistantHistory.slice(-5),
          api_key: key,
          trip_context: context
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAssistantHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const err = await res.json();
        setAssistantHistory(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.detail || "Server communication issue"}` }]);
      }
    } catch (e) {
      setAssistantHistory(prev => [...prev, { role: 'assistant', content: '**Connection error:** Verify server connectivity.' }]);
    } finally {
      setAssistantLoading(false);
    }
  };

  // PDF Export logic
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const destName = tripData.destination || tripData.state_intelligence?.name || 'India';
    const startName = tripData.start_location || 'Delhi';
    const hotelsList = tripData.hotels_by_category?.[tripData.budget_category?.toLowerCase()] || tripData.hotels || [];
    const markedHTML = tripData.ai_response ? marked.parse(tripData.ai_response) : 'No itinerary details loaded.';

    printWindow.document.write(`
      <html>
        <head>
          <title>India Tour Planner - Itinerary for ${destName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            h1 { font-size: 26px; color: #0f172a; border-bottom: 2px solid #818cf8; padding-bottom: 10px; margin-bottom: 5px; }
            h2 { font-size: 16px; color: #1e3a8a; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .meta-item { font-size: 12px; }
            .meta-label { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 9px; }
            .meta-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; color: #334155; font-weight: bold; }
            .itinerary-content { font-size: 13px; color: #334155; }
            .btn-print { background: #818cf8; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 5px; cursor: pointer; display: block; margin: 20px auto; }
            @media print {
              .btn-print { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
          <h1>TRIP ITINERARY SUMMARY: ${startName} to ${destName}</h1>
          <div class="meta-grid">
            <div class="meta-item"><div class="meta-label">Trip Duration</div><div class="meta-val">${tripData.days || 5} Days</div></div>
            <div class="meta-item"><div class="meta-label">Total Travelers</div><div class="meta-val">${tripData.travelers || 1} Person(s)</div></div>
            <div class="meta-item"><div class="meta-label">Budget Tier</div><div class="meta-val" style="text-transform: capitalize;">${tripData.budget_category || 'Medium'}</div></div>
            <div class="meta-item"><div class="meta-label">Estimated Budget</div><div class="meta-val">₹${tripData.costs?.total_estimated?.toLocaleString('en-IN') || '0'}</div></div>
          </div>
          
          <h2>Day-by-Day Route & Recommendations</h2>
          <div class="itinerary-content">${markedHTML}</div>
          
          <h2>Budget Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Expense Type</th>
                <th>Itemized Detail</th>
                <th>Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hotels & Accommodations</td>
                <td>${tripData.costs?.hotel?.desc || ''}</td>
                <td>₹${tripData.costs?.hotel?.total?.toLocaleString('en-IN') || '0'}</td>
              </tr>
              <tr>
                <td>Food & Dining</td>
                <td>${tripData.costs?.food?.desc || ''}</td>
                <td>₹${tripData.costs?.food?.total?.toLocaleString('en-IN') || '0'}</td>
              </tr>
              <tr>
                <td>Vehicle Rental Specs</td>
                <td>${tripData.costs?.rental?.desc || ''}</td>
                <td>₹${tripData.costs?.rental?.total?.toLocaleString('en-IN') || '0'}</td>
              </tr>
              <tr>
                <td>Fuel and Local Transit</td>
                <td>${tripData.costs?.fuel?.desc || ''}</td>
                <td>₹${tripData.costs?.fuel?.total?.toLocaleString('en-IN') || '0'}</td>
              </tr>
              <tr>
                <td>Sightseeing Entry Fees</td>
                <td>${tripData.costs?.entry_fees?.desc || ''}</td>
                <td>₹${tripData.costs?.entry_fees?.total?.toLocaleString('en-IN') || '0'}</td>
              </tr>
              <tr>
                <td>Emergency Reserve (5%)</td>
                <td>${tripData.costs?.emergency_buffer?.desc || ''}</td>
                <td>₹${tripData.costs?.emergency_buffer?.total?.toLocaleString('en-IN') || '0'}</td>
              </tr>
              <tr style="font-weight: bold; background: #f8fafc;">
                <td>Total Cost</td>
                <td>Average Daily: ₹${tripData.costs?.daily_average?.toLocaleString('en-IN') || '0'}</td>
                <td>₹${tripData.costs?.total_estimated?.toLocaleString('en-IN') || '0'}</td>
              </tr>
            </tbody>
          </table>
          
          <h2>Recommended Lodging</h2>
          <ul>
            ${hotelsList.map(h => `<li><strong>${h.name}</strong> - ${h.location} (Rate: ₹${h.price}/night) - ${h.desc}</li>`).join('')}
          </ul>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadBudget = () => {
    const destName = tripData.destination || tripData.state_intelligence?.name || 'India';
    const costs = tripData.costs;
    const content = `TRIP BUDGET REPORT: ${destName.toUpperCase()}
Duration: ${tripData.days || 5} Days | Travelers: ${tripData.travelers || 1}

ITEMIZED BUDGET ESTIMATES:
-----------------------------------------
1. Hotels & Stays: ₹${costs.hotel.total.toLocaleString('en-IN')}
   Details: ${costs.hotel.desc}
2. Food & Dining: ₹${costs.food.total.toLocaleString('en-IN')}
   Details: ${costs.food.desc}
3. Vehicle Rental: ₹${costs.rental.total.toLocaleString('en-IN')}
   Details: ${costs.rental.desc}
4. Transit Fuel: ₹${costs.fuel.total.toLocaleString('en-IN')}
   Details: ${costs.fuel.desc}
5. Entry Fees: ₹${costs.entry_fees.total.toLocaleString('en-IN')}
   Details: ${costs.entry_fees.desc}
6. Emergency Buffer (5%): ₹${costs.emergency_buffer.total.toLocaleString('en-IN')}
   Details: ${costs.emergency_buffer.desc}
-----------------------------------------
TOTAL ESTIMATED BUDGET: ₹${costs.total_estimated.toLocaleString('en-IN')}
Daily Average Expense: ₹${costs.daily_average.toLocaleString('en-IN')}

Generated via India Tour Planner Dashboard.
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Budget_Report_${destName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareItinerary = () => {
    const destName = tripData.destination || tripData.state_intelligence?.name || 'India';
    const shareText = `Check out my India Trip Itinerary to ${destName}! Planned with India Tour Planner:
- Duration: ${tripData.days || 5} Days
- Travelers: ${tripData.travelers || 1}
- Estimated Total: ₹${tripData.costs?.total_estimated?.toLocaleString('en-IN') || '0'}
- Recommended Ride: ${tripData.recommended_rental?.name || 'Standard Ride'}
Join the tour or design yours!`;
    navigator.clipboard.writeText(shareText);
    alert("Itinerary summary copied to clipboard! Share it with your friends.");
  };

  // Auto reset focus when tripData changes
  useEffect(() => {
    setMapFocus(null);
    setDetailDrawer({ open: false, type: null });
  }, [tripData]);


  // Group Spends Ledger States
  const [members, setMembers] = useState(['You', 'Traveler B']);
  const [newMember, setNewMember] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [expenseItem, setExpenseItem] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [splitResult, setSplitResult] = useState('');

  // 1. Detect Router location states to reload saved trip dossiers dynamically
  useEffect(() => {
    if (location.state && location.state.loadedTrip) {
      const loaded = location.state.loadedTrip;
      
      // Formulate a synthetic tripData structure
      const reconstructed = {
        state_intelligence: {
          name: loaded.destination,
          description: `Seeded itinerary loaded for ${loaded.destination}.`
        },
        costs: loaded.cost_breakdown,
        ai_response: loaded.ai_response,
        // Optional fallbacks
        attractions: [],
        hidden_gems: [],
        famous_foods: [],
        vehicle_rentals: [],
        start_location: loaded.start_location,
        destination: loaded.destination,
        days: loaded.days,
        travelers: loaded.travelers,
        budget_category: loaded.budget_category
      };
      
      setTripData(reconstructed);
      
      // Re-fetch seed options for tabs
      fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_location: loaded.start_location,
          destination: loaded.destination,
          days: loaded.days,
          travelers: loaded.travelers,
          budget_category: loaded.budget_category,
          vehicle_preference: "auto",
          api_key: null
        })
      })
      .then(res => res.json())
      .then(data => {
        // Overlay seed data (foods, rental guide tables, sightseeing spots)
        reconstructed.attractions = data.attractions || [];
        reconstructed.hidden_gems = data.hidden_gems || [];
        reconstructed.famous_foods = data.famous_foods || [];
        reconstructed.vehicle_rentals = data.vehicle_rentals || [];
        reconstructed.state_intelligence = data.state_intelligence || reconstructed.state_intelligence;
        reconstructed.start_location = loaded.start_location;
        reconstructed.destination = loaded.destination;
        
        // Include newly cached hotels and restaurants
        reconstructed.hotels = data.hotels || [];
        reconstructed.hotels_by_category = data.hotels_by_category || null;
        reconstructed.restaurants = data.restaurants || [];
        
        setTripData({ ...reconstructed });
      })
      .catch(err => console.error("Failed to re-fetch dossier context:", err));
    }
  }, [location.state]);

  // 1b. Fetch dynamic weather for destination
  useEffect(() => {
    if (tripData && (tripData.destination || tripData.state_intelligence?.name)) {
      const city = tripData.destination || tripData.state_intelligence?.name;
      fetch(`/api/weather?city=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.weather) {
            let cleanWeather = data.weather;
            if (cleanWeather.includes('|')) {
              cleanWeather = cleanWeather.split('|')[0].trim();
            }
            if (cleanWeather.length > 25) {
              cleanWeather = cleanWeather.substring(0, 25) + '...';
            }
            setWeatherText(cleanWeather);
          }
        })
        .catch(err => console.error("Failed to fetch dynamic weather:", err));
    } else {
      setWeatherText('Clear Skies Active');
    }
  }, [tripData]);


  // 2. Planning Submit Trigger API Call
  const handlePlanTrip = async (formData) => {
    setLoading(true);
    const key = localStorage.getItem('GEMINI_API_KEY') || '';
    const customPref = localStorage.getItem('CUSTOM_RAG_PREFERENCE') || '';
    
    try {
      const res = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          query: customPref,
          api_key: key
        })
      });

      if (res.ok) {
        const data = await res.json();
        data.start_location = formData.start_location;
        data.destination = formData.destination;
        data.days = formData.days;
        data.travelers = formData.travelers;
        data.budget_category = formData.budget_category;
        setTripData(data);
      } else {
        const err = await res.json();
        alert(`Planning failed: ${err.detail || "Server error"}`);
      }
    } catch (err) {
      alert("Connection timeout. Backend server offline.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Save Trip Dossier to SQLite database
  const handleSaveTrip = async () => {
    if (!tripData || isSaving) return;
    
    const startLoc = tripData.start_location || 'Delhi';
    const dest = tripData.destination || tripData.state_intelligence?.name || 'Goa';
    const days = parseInt(tripData.days || 5);
    const travelers = parseInt(tripData.travelers || 2);
    const budgetCat = tripData.budget_category || 'medium';

    setIsSaving(true);
    try {
      const res = await fetch('/api/trips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_location: startLoc,
          destination: dest,
          days: days,
          travelers: travelers,
          budget_category: budgetCat,
          total_cost: tripData.costs.total_estimated,
          cost_breakdown: tripData.costs,
          ai_response: tripData.ai_response
        })
      });

      if (res.ok) {
        alert(`Dossier successfully saved to SQLite! Reload it anytime inside "My Itineraries".`);
      } else {
        const err = await res.json();
        alert(`Failed to save trip: ${err.detail}`);
      }
    } catch (err) {
      alert("Error reaching SQL server.");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= GROUP SPLITTER METHODS =================
  const addMember = () => {
    if (!newMember.trim()) return;
    if (members.includes(newMember.trim())) {
      alert("Traveler already exists in ledger.");
      return;
    }
    setMembers(prev => [...prev, newMember.trim()]);
    setNewMember('');
  };

  const removeMember = (name) => {
    if (name === 'You') return;
    setMembers(prev => prev.filter(m => m !== name));
  };

  const addExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!expenseItem.trim() || isNaN(amount) || amount <= 0 || !expensePayer) {
      alert("Please provide valid description, amount, and payer.");
      return;
    }

    const newExp = {
      payer: expensePayer,
      item: expenseItem.trim(),
      amount
    };

    const updated = [...expenses, newExp];
    setExpenses(updated);
    setExpenseItem('');
    setExpenseAmount('');
    setExpensePayer('');
    
    calculateDebts(updated);
  };

  const calculateDebts = (ledgerExpenses) => {
    if (members.length < 2 || ledgerExpenses.length === 0) {
      setSplitResult('');
      return;
    }

    // 1. Calculate net balance for each traveler
    const balances = {};
    members.forEach(m => balances[m] = 0);

    ledgerExpenses.forEach(exp => {
      const share = exp.amount / members.length;
      members.forEach(m => {
        if (m === exp.payer) {
          balances[m] += (exp.amount - share);
        } else {
          balances[m] -= share;
        }
      });
    });

    // 2. Separate debtors and creditors
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(m => {
      const bal = balances[m];
      if (bal < -0.01) {
        debtors.push({ name: m, amount: Math.abs(bal) });
      } else if (bal > 0.01) {
        creditors.push({ name: m, amount: bal });
      }
    });

    // Sort descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // 3. Settle debts dynamically by pairing largest debtor & largest creditor
    const settlements = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const minAmt = Math.min(debtor.amount, creditor.amount);
      settlements.push(`💸 <b>${debtor.name}</b> pays <b>₹${Math.ceil(minAmt)}</b> to <b>${creditor.name}</b>`);

      debtor.amount -= minAmt;
      creditor.amount -= minAmt;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    if (settlements.length === 0) {
      setSplitResult('Ledger balances are perfectly equal! No payments required.');
    } else {
      setSplitResult(settlements.join('<br>'));
    }
  };

  // Custom UI Constants matching values inside database
  const safetyScore = tripData?.state_intelligence?.safety_score || 'N/A';
  const crowdLevel = tripData?.state_intelligence?.crowd_level || 'N/A';
  const rentalType = tripData?.recommended_rental?.type || 'N/A';
  const displayDays = Math.max(1, Math.min(5, parseInt(tripData?.days) || 5));
  const cardPadding = displayDays <= 3 ? 'p-4 md:p-6 gap-3' : 'p-2 md:p-3 gap-1';
  const dayTextSize = displayDays <= 3 ? 'text-[10px] md:text-xs font-bold' : 'text-[8px] md:text-[10px] font-bold';
  const iconSize = displayDays <= 3 ? 'text-lg md:text-3xl my-1.5' : 'text-xs md:text-base my-0.5';
  const tempTextSize = displayDays <= 3 ? 'text-xs md:text-xl font-extrabold' : 'text-[9px] md:text-xs font-black';
  const infoTextSize = displayDays <= 3 ? 'text-[9px] md:text-xs font-bold' : 'text-[7px] md:text-[9px] font-bold';
  const descTextSize = displayDays <= 3 ? 'text-[9px] md:text-xs leading-tight font-medium' : 'text-[7px] md:text-[9px] leading-tight font-medium';
  const gridGap = displayDays <= 3 ? 'gap-3 mt-2' : 'gap-1.5 mt-1';

  // Calculate Route Analytics values based on travelMode
  let travelTimeStr = 'N/A';
  let travelCostEst = '₹0';
  let travelCostLabel = 'Fuel Cost Est.';
  let travelCostIcon = 'fa-solid fa-gas-pump text-sunsetCoral mb-1.5 text-xs';
  let tollsEstVal = '₹0';
  let tollsLabel = 'Tolls Est.';
  let tollsIcon = 'fa-solid fa-receipt text-amber-500 mb-1.5 text-xs';
  let routeDifficultyStr = 'Easy';
  let difficultyIcon = 'fa-solid fa-mountain text-pink-400 mb-1.5 text-xs';
  
  if (calculatedDistance) {
    // 1. Travel Time
    if (travelMode === 'plane') {
      const hours = (calculatedDistance / 650) + 2; // 2 hours overhead (check-in, boarding)
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      travelTimeStr = `${h}h ${m}m (incl. check-in)`;
    } else {
      let speed = 65; // car
      if (travelMode === 'bus') speed = 45;
      else if (travelMode === 'train') speed = 75;
      else if (travelMode === 'bike') speed = 40;
      
      const hours = calculatedDistance / speed;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      travelTimeStr = `${h}h ${m}m`;
    }

    // 2. Travel Cost & Labels
    const numTravelers = tripData?.travelers || 1;
    const tripDays = tripData?.days || 5;
    
    // Total distance is calculated as a Round Trip + 30km per day for local sightseeing
    const totalEstTripDistance = (calculatedDistance * 2) + (30 * tripDays);

    if (travelMode === 'car') {
      // Determine the specific car category (SUV, Sedan, Hatchback, etc.)
      const rentalName = tripData?.recommended_rental?.name?.toLowerCase() || '';
      const rentalType = tripData?.recommended_rental?.type?.toLowerCase() || '';
      
      let mileage = 16; // default sedan
      let fuelType = 'Petrol';
      let fuelPrice = 96; // average base Petrol price in INR
      
      if (rentalType.includes('suv') || rentalName.includes('thar') || rentalName.includes('scorpio')) {
        mileage = 13; // SUV mileage
        fuelType = 'Diesel';
        fuelPrice = 87; // average base Diesel price in INR
        travelCostLabel = 'Diesel Cost (SUV)';
      } else if (rentalType.includes('hatchback') || rentalName.includes('swift')) {
        mileage = 18; // Hatchback mileage
        fuelType = 'Petrol';
        fuelPrice = 96;
        travelCostLabel = 'Petrol Cost (Hatch)';
      } else {
        travelCostLabel = 'Fuel Cost (Sedan)';
      }
      
      const liters = totalEstTripDistance / mileage;
      const cost = liters * fuelPrice;
      
      travelCostIcon = 'fa-solid fa-gas-pump text-sunsetCoral mb-1.5 text-xs';
      travelCostEst = `₹${Math.round(cost).toLocaleString('en-IN')} (${Math.round(liters)}L ${fuelType})`;
      
      tollsLabel = 'Tolls Est.';
      tollsIcon = 'fa-solid fa-receipt text-amber-500 mb-1.5 text-xs';
      tollsEstVal = `₹${Math.round(calculatedDistance * 2 * 0.80).toLocaleString('en-IN')} (R-Trip)`;
      
      routeDifficultyStr = totalEstTripDistance > 1200 ? 'High Endurance' : totalEstTripDistance > 600 ? 'Moderate' : 'Easy';
      difficultyIcon = 'fa-solid fa-mountain text-pink-400 mb-1.5 text-xs';
      
    } else if (travelMode === 'bike') {
      const rentalName = tripData?.recommended_rental?.name?.toLowerCase() || '';
      const rentalType = tripData?.recommended_rental?.type?.toLowerCase() || '';
      
      let mileage = 40; // cruiser
      let vehicleLabel = 'Cruiser';
      if (rentalType.includes('scooty') || rentalName.includes('activa') || rentalName.includes('jupiter')) {
        mileage = 50; // Scooter mileage
        vehicleLabel = 'Scooter';
      }
      
      const liters = totalEstTripDistance / mileage;
      const cost = liters * 96; // petrol
      
      travelCostLabel = `Petrol Cost (${vehicleLabel})`;
      travelCostIcon = 'fa-solid fa-gas-pump text-sunsetCoral mb-1.5 text-xs';
      travelCostEst = `₹${Math.round(cost).toLocaleString('en-IN')} (${Math.round(liters)}L Petrol)`;
      
      tollsLabel = 'Tolls Est.';
      tollsIcon = 'fa-solid fa-receipt text-amber-500 mb-1.5 text-xs';
      tollsEstVal = '₹0 (Free)';
      
      routeDifficultyStr = totalEstTripDistance > 800 ? 'Strenuous' : totalEstTripDistance > 400 ? 'Challenging' : 'Moderate';
      difficultyIcon = 'fa-solid fa-motorcycle text-pink-400 mb-1.5 text-xs';
      
    } else if (travelMode === 'bus') {
      // Round-trip bus tickets
      const ticketCost = calculatedDistance * 2 * 1.8 * numTravelers;
      travelCostLabel = 'Bus Fares (Round-Trip)';
      travelCostIcon = 'fa-solid fa-ticket text-sunsetCoral mb-1.5 text-xs';
      travelCostEst = `₹${Math.round(ticketCost).toLocaleString('en-IN')} (${numTravelers} Pax)`;
      
      tollsLabel = 'Tolls Est.';
      tollsIcon = 'fa-solid fa-receipt text-amber-500 mb-1.5 text-xs';
      tollsEstVal = `₹${Math.round(calculatedDistance * 2 * 1.2).toLocaleString('en-IN')} (Incl.)`;
      
      routeDifficultyStr = calculatedDistance > 500 ? 'Long / Tiring' : 'Standard';
      difficultyIcon = 'fa-solid fa-bus text-pink-400 mb-1.5 text-xs';
      
    } else if (travelMode === 'train') {
      // Round-trip train tickets (AC 3-Tier typical standard fare ~2.2 INR per km)
      const ticketCost = calculatedDistance * 2 * 2.2 * numTravelers;
      travelCostLabel = 'Train Fares (Round-Trip)';
      travelCostIcon = 'fa-solid fa-train text-sunsetCoral mb-1.5 text-xs';
      travelCostEst = `₹${Math.round(ticketCost).toLocaleString('en-IN')} (${numTravelers} Pax)`;
      
      tollsLabel = 'IRCTC Charges';
      tollsIcon = 'fa-solid fa-receipt text-amber-500 mb-1.5 text-xs';
      tollsEstVal = `₹${Math.round(numTravelers * 60 * 2).toLocaleString('en-IN')}`;
      
      routeDifficultyStr = 'Highly Relaxed';
      difficultyIcon = 'fa-solid fa-train text-pink-400 mb-1.5 text-xs';
      
    } else if (travelMode === 'plane') {
      // Round-trip flight tickets
      const oneWayFare = Math.max(2800, 2000 + calculatedDistance * 3.5);
      const ticketCost = oneWayFare * 2 * numTravelers;
      travelCostLabel = 'Flight Fares (Round-Trip)';
      travelCostIcon = 'fa-solid fa-plane-departure text-sunsetCoral mb-1.5 text-xs';
      travelCostEst = `₹${Math.round(ticketCost).toLocaleString('en-IN')} (${numTravelers} Pax)`;
      
      tollsLabel = 'Airport Taxes';
      tollsIcon = 'fa-solid fa-receipt text-amber-500 mb-1.5 text-xs';
      tollsEstVal = `₹${Math.round(numTravelers * 650 * 2).toLocaleString('en-IN')}`;
      
      routeDifficultyStr = 'Comfortable / Fast';
      difficultyIcon = 'fa-solid fa-plane text-pink-400 mb-1.5 text-xs';
    }
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto p-4">
      {/* LEFT COLUMN: Inputs, Calculator, Group Spends */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <TripPlannerForm onSubmitPlan={handlePlanTrip} loading={loading} />
        
        <BudgetCalculator tripData={tripData} onOpenDetails={(type) => setDetailDrawer({ open: true, type })} />

        {/* Group Spends Splitter Widget */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3">
            <i className="fa-solid fa-people-arrows text-royalIndigo"></i>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Group Expense Splitter</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {/* Add Member Inputs */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMember()}
                className="glass-input p-2 flex-grow text-xs" 
                placeholder="Add traveler name..."
              />
              <button 
                onClick={addMember}
                className="px-3 bg-royalIndigo hover:bg-indigo-600 rounded-lg text-xs font-semibold text-white transition active:scale-95"
              >
                Add
              </button>
            </div>
            
            {/* Members chips rendering */}
            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
              {members.map((m, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-slate-900 border border-[rgba(255,255,255,0.05)] rounded-full text-[10px] text-slate-300 font-bold flex items-center gap-1.5"
                >
                  <span>{m}</span>
                  {m !== 'You' && (
                    <button onClick={() => removeMember(m)} className="text-rose-400 hover:text-rose-500 font-black"><i className="fa-solid fa-xmark"></i></button>
                  )}
                </span>
              ))}
            </div>

            {/* Add Spend Inputs */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input 
                type="text" 
                value={expenseItem}
                onChange={(e) => setExpenseItem(e.target.value)}
                className="glass-input p-2 text-[11px]" 
                placeholder="Item (e.g. Dinner)"
              />
              <input 
                type="number" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="glass-input p-2 text-[11px]" 
                placeholder="Amount (₹)"
              />
            </div>
            
            {/* Log Spend Action Button */}
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={expensePayer}
                onChange={(e) => setExpensePayer(e.target.value)}
                className="glass-input p-2 text-[11px] bg-darkSlate"
              >
                <option value="">Paid By...</option>
                {members.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
              <button 
                onClick={addExpense}
                className="py-2 bg-slate-800 hover:bg-slate-700 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs font-semibold text-white transition duration-300"
              >
                <i className="fa-solid fa-plus text-royalIndigo mr-1"></i> Log Spend
              </button>
            </div>

            {/* Spends Ledger Spends List */}
            <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto mt-1">
              {expenses.map((exp, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] p-2 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-lg ledger-spend-item">
                  <span className="text-slate-400"><b>{exp.payer}</b> spent <b>₹{exp.amount}</b> on <i>{exp.item}</i></span>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-[10px] text-slate-500 text-center py-2">No spends logged yet. Ledger is clear!</div>
              )}
            </div>
            
            {/* Settling calculations output container */}
            {splitResult && (
              <div 
                className="p-3 bg-royalIndigo/10 border border-royalIndigo/20 rounded-xl mt-1 text-[11px] text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: splitResult }}
              />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Map & Interactive Tab Content */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 w-full">
          {/* Header Live Information Banners */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Live Weather */}
            <div className="glass-panel p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <i className="fa-solid fa-cloud-sun text-lg"></i>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Live Weather</p>
                <p className="text-xs text-white font-bold leading-tight">{weatherText}</p>
              </div>
            </div>
            {/* Recommended Vehicle */}
            <div className="glass-panel p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <i className="fa-solid fa-motorcycle text-lg"></i>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Rental Preference</p>
                <p className="text-xs text-white font-bold leading-tight uppercase">{rentalType}</p>
              </div>
            </div>
            {/* Safety Index */}
            <div className="glass-panel p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <i className="fa-solid fa-shield-halved text-lg"></i>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Safety Index</p>
                <p className="text-xs text-white font-bold leading-tight">{safetyScore} / 10</p>
              </div>
            </div>
            {/* Crowd density */}
            <div className="glass-panel p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <i className="fa-solid fa-users-rays text-lg"></i>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Crowd Density</p>
                <p className="text-xs text-white font-bold leading-tight">{crowdLevel}</p>
              </div>
            </div>
          </div>

          <MapView tripData={tripData} mapFocus={mapFocus} />

          {/* ================= NEW PANELS SECTION ================= */}
          {tripData && (
            <div className="flex flex-col gap-4 mt-4 animate-fade-in">
              {/* Route Analytics Panel */}
              <div className="glass-panel p-5 flex flex-col gap-4 bg-[#0e1420]/45">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-3">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-route text-royalIndigo"></i>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-title">Route Analytics Panel</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">Travel Mode:</span>
                    <select
                      value={travelMode}
                      onChange={(e) => setTravelMode(e.target.value)}
                      className="px-2.5 py-1 bg-royalIndigo/10 hover:bg-royalIndigo/20 text-royalIndigo border border-royalIndigo/25 rounded-lg text-[10px] font-bold uppercase cursor-pointer outline-none transition duration-200 focus:ring-1 focus:ring-royalIndigo/50"
                    >
                      <option value="car" className="bg-[#0e1420] text-slate-300">🚗 Car</option>
                      <option value="bus" className="bg-[#0e1420] text-slate-300">🚌 Bus</option>
                      <option value="train" className="bg-[#0e1420] text-slate-300">🚆 Train</option>
                      <option value="bike" className="bg-[#0e1420] text-slate-300">🏍️ Bike</option>
                      <option value="plane" className="bg-[#0e1420] text-slate-300">✈️ Plane</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {/* Distance */}
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl text-center transition duration-300 hover:border-royalIndigo/30">
                    <i className="fa-solid fa-road text-royalIndigo mb-1.5 text-xs"></i>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Distance</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{calculatedDistance || 'N/A'} km</p>
                  </div>
                  {/* Travel Time */}
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl text-center transition duration-300 hover:border-royalIndigo/30">
                    <i className={`fa-solid ${travelMode === 'car' ? 'fa-car text-marigoldGold' : travelMode === 'bus' ? 'fa-bus text-sky-400' : travelMode === 'train' ? 'fa-train text-emerald-400' : travelMode === 'bike' ? 'fa-motorcycle text-orange-400' : 'fa-plane text-indigo-400'} mb-1.5 text-xs`}></i>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      {travelMode === 'car' ? 'Driving Time' : travelMode === 'bus' ? 'Bus Time' : travelMode === 'train' ? 'Train Time' : travelMode === 'bike' ? 'Riding Time' : 'Flight Time'}
                    </p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{travelTimeStr}</p>
                  </div>
                  {/* Cost */}
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl text-center transition duration-300 hover:border-royalIndigo/30">
                    <i className={travelCostIcon}></i>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{travelCostLabel}</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{travelCostEst}</p>
                  </div>
                  {/* Tolls & Fees */}
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl text-center transition duration-300 hover:border-royalIndigo/30">
                    <i className={tollsIcon}></i>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{tollsLabel}</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{tollsEstVal}</p>
                  </div>
                  {/* Route Comfort / Difficulty */}
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl text-center transition duration-300 hover:border-royalIndigo/30">
                    <i className={difficultyIcon}></i>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Journey Comfort</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{routeDifficultyStr}</p>
                  </div>
                </div>
              </div>

              {/* Weather Forecast & travel alerts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 5-Day Weather Forecast */}
                <div className="glass-panel p-5 flex flex-col gap-3 bg-[#0e1420]/45">
                  <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
                    <i className="fa-solid fa-cloud-sun text-sky-400"></i>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-title">
                      {displayDays}-Day Weather Forecast
                    </h4>
                  </div>
                  <div className={`grid ${gridGap} ${
                    displayDays === 1 ? 'grid-cols-1' :
                    displayDays === 2 ? 'grid-cols-2' :
                    displayDays === 3 ? 'grid-cols-3' :
                    displayDays === 4 ? 'grid-cols-4' :
                    'grid-cols-5'
                  }`}>
                    {Array.from({ length: displayDays }, (_, i) => i + 1).map((day) => {
                      const rainPercent = (10 + (day % 3) * 25);
                      const isRainy = rainPercent > 50;
                      return (
                        <div key={day} className={`${cardPadding} bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl text-center flex flex-col items-center justify-center transition duration-300 hover:border-sky-400/30`}>
                          <p className={`${dayTextSize} text-slate-500 uppercase`}>Day {day}</p>
                          <i className={`fa-solid ${isRainy ? 'fa-cloud-showers-heavy text-sky-400' : 'fa-sun text-amber-400'} ${iconSize}`}></i>
                          <p className={`${tempTextSize} text-white`}>{isRainy ? '24°C' : '29°C'}</p>
                          <p className={`${infoTextSize} text-sky-400`}>{rainPercent}% Rain</p>
                          <p className={`${descTextSize} text-slate-500 mt-0.5`}>
                            {isRainy ? 'Carry Umbrella' : 'Good for Walk'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Travel Alerts */}
                <div className="glass-panel p-5 flex flex-col gap-3 bg-[#0e1420]/45">
                  <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
                    <i className="fa-solid fa-triangle-exclamation text-sunsetCoral"></i>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-title">AI Travel Alerts</h4>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                    <div className="flex items-start gap-2.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <i className="fa-solid fa-cloud-showers-heavy text-rose-400 text-xs mt-0.5"></i>
                      <div>
                        <p className="text-[10px] text-white font-bold">Heavy Rain Warning (Day 3)</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">High probability of rain on Day 3. Restricted trail visibility expected.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <i className="fa-solid fa-users-rays text-amber-400 text-xs mt-0.5"></i>
                      <div>
                        <p className="text-[10px] text-white font-bold">Peak Season Crowd Density Notice</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">High tourist density reported. Advance bookings recommended.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Budget Optimizer */}
              <div className="glass-panel p-5 flex flex-col gap-3 bg-[#0e1420]/45">
                <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
                  <i className="fa-solid fa-piggy-bank text-emerald-400"></i>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-title">Smart Budget Optimizer</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs shrink-0"><i className="fa-solid fa-train"></i></div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Travel Savings</p>
                      <p className="text-xs text-slate-300 font-bold mt-0.5">Save ₹{(2300 * (tripData.travelers || 1)).toLocaleString('en-IN')} by choosing train travel.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs shrink-0"><i className="fa-solid fa-hotel"></i></div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Lodging Hack</p>
                      <p className="text-xs text-slate-300 font-bold mt-0.5">Save ₹{(1200 * (tripData.days || 5)).toLocaleString('en-IN')} by staying 3 km outside city center.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 text-xs shrink-0"><i className="fa-solid fa-gas-pump"></i></div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Transit Savings</p>
                      <p className="text-xs text-slate-300 font-bold mt-0.5">Save 15% fuel cost by utilizing regional carpools/group bikes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= AI TRIP SUMMARY & PLANNING PROGRESS ================= */}
          {tripData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 animate-fade-in">
              {/* Summary Card */}
              <div className="md:col-span-2 glass-panel p-5 flex flex-col gap-4 bg-gradient-to-br from-slate-900/40 to-indigo-950/20">
                <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-3">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-compass text-sunsetCoral"></i>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-title">AI Trip Summary Card</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-sunsetCoral/15 text-sunsetCoral border border-sunsetCoral/25 rounded-md text-[9px] font-black uppercase">
                    Trip Score: {(parseFloat(tripData.state_intelligence?.safety_score || 8.5) * 0.7 + (activeTab === 'high' ? 2.5 : activeTab === 'medium' ? 2.0 : 1.5)).toFixed(1)}/10
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">From Location</span>
                    <p className="text-xs font-extrabold text-white truncate">{tripData.start_location || 'Delhi'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Destination</span>
                    <p className="text-xs font-extrabold text-white truncate">{tripData.destination || tripData.state_intelligence?.name || 'Goa'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Total Distance</span>
                    <p className="text-xs font-extrabold text-white">{calculatedDistance || 'N/A'} km</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Travelers</span>
                    <p className="text-xs font-extrabold text-white">{tripData.travelers || 1} Person(s)</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-title">Trip Duration</span>
                    <p className="text-xs font-extrabold text-white">{tripData.days || 5} Days</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Recommended Vehicle</span>
                    <p className="text-xs font-extrabold text-white truncate">{tripData.recommended_rental?.name || 'Standard Vehicle'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Total Budget</span>
                    <p className="text-xs font-extrabold text-marigoldGold">₹{tripData.costs?.total_estimated?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Comfort Level</span>
                    <p className="text-xs font-extrabold text-indigo-400 capitalize">{tripData.budget_category || 'medium'}</p>
                  </div>
                </div>

                {/* PDF and Share System Row */}
                <div className="flex gap-2 border-t border-[rgba(255,255,255,0.05)] pt-4 mt-1">
                  <button 
                    onClick={handleExportPDF}
                    className="flex-grow py-2 bg-royalIndigo/20 hover:bg-royalIndigo/45 text-royalIndigo border border-royalIndigo/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-white"
                  >
                    <i className="fa-solid fa-file-pdf"></i> Export Full Trip PDF
                  </button>
                  <button 
                    onClick={handleDownloadBudget}
                    className="flex-grow py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[rgba(255,255,255,0.08)] rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-download"></i> Download Budget Report
                  </button>
                  <button 
                    onClick={handleShareItinerary}
                    className="flex-grow py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[rgba(255,255,255,0.08)] rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-share-nodes"></i> Share Itinerary
                  </button>
                </div>
              </div>

              {/* Trip Completion Status Card */}
              <div className="glass-panel p-5 flex flex-col gap-3.5 bg-gradient-to-br from-slate-900/30 to-indigo-950/10 justify-between">
                <div className="border-b border-[rgba(255,255,255,0.05)] pb-2 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-title">
                    <i className="fa-solid fa-clipboard-list text-oceanTeal"></i> Trip Planning Progress
                  </h4>
                  <span className="text-xs font-black text-oceanTeal font-title">
                    {(() => {
                      let done = 0;
                      if (tripData) {
                        done += 20;
                        if (tripData.hotels && tripData.hotels.length > 0) done += 20;
                        if (tripData.attractions && tripData.attractions.length > 0) done += 20;
                        if (tripData.costs) done += 20;
                        if (tripData.famous_foods && tripData.famous_foods.length > 0) done += 20;
                      }
                      return `${done}%`;
                    })()}
                  </span>
                </div>
                
                {/* Progress bar line */}
                <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden border border-slate-900 relative my-1">
                  <div 
                    className="h-full bg-gradient-to-r from-oceanTeal to-sky-400 transition-all duration-700 rounded-full"
                    style={{
                      width: (() => {
                        let done = 0;
                        if (tripData) {
                          done += 20;
                          if (tripData.hotels && tripData.hotels.length > 0) done += 20;
                          if (tripData.attractions && tripData.attractions.length > 0) done += 20;
                          if (tripData.costs) done += 20;
                          if (tripData.famous_foods && tripData.famous_foods.length > 0) done += 20;
                        }
                        return `${done}%`;
                      })()
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${tripData ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'}`}></i>
                      Route Generated
                    </span>
                    <i className="fa-solid fa-check text-[9px] text-slate-600"></i>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${tripData?.hotels?.length > 0 ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'}`}></i>
                      Hotels Found
                    </span>
                    <i className="fa-solid fa-check text-[9px] text-slate-600"></i>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${tripData?.attractions?.length > 0 ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'}`}></i>
                      Attractions Loaded
                    </span>
                    <i className="fa-solid fa-check text-[9px] text-slate-600"></i>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${tripData?.costs ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'}`}></i>
                      Budget Calculated
                    </span>
                    <i className="fa-solid fa-check text-[9px] text-slate-600"></i>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${tripData?.famous_foods?.length > 0 ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'}`}></i>
                      Food Recommendations
                    </span>
                    <i className="fa-solid fa-check text-[9px] text-slate-600"></i>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs Bar */}
        <div className="glass-panel p-3 flex gap-1 overflow-x-auto mt-4">
          <button 
            onClick={() => setActiveTab('itinerary-tab')} 
            className={`tab-btn text-sm whitespace-nowrap ${activeTab === 'itinerary-tab' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-route mr-1.5"></i> AI Route & Itinerary
          </button>
          <button 
            onClick={() => setActiveTab('attractions-tab')} 
            className={`tab-btn text-sm whitespace-nowrap ${activeTab === 'attractions-tab' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-monument mr-1.5"></i> Attractions & Hidden Gems
          </button>
          <button 
            onClick={() => setActiveTab('hotels-tab')} 
            className={`tab-btn text-sm whitespace-nowrap ${activeTab === 'hotels-tab' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-hotel mr-1.5"></i> Hotels & Stays
          </button>
          <button 
            onClick={() => setActiveTab('food-tab')} 
            className={`tab-btn text-sm whitespace-nowrap ${activeTab === 'food-tab' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-utensils mr-1.5"></i> Culinary Guide
          </button>
          <button 
            onClick={() => setActiveTab('rentals-tab')} 
            className={`tab-btn text-sm whitespace-nowrap ${activeTab === 'rentals-tab' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-car-side mr-1.5"></i> Rent & Vehicle Specs
          </button>
          <button 
            onClick={() => setActiveTab('favorites-tab')} 
            className={`tab-btn text-sm whitespace-nowrap ${activeTab === 'favorites-tab' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-heart mr-1.5 text-rose-500"></i> Saved Favorites
          </button>
        </div>

        {/* Active Tab Panel Content */}
        <div className="glass-panel p-6 min-h-[480px]">
          {activeTab === 'itinerary-tab' && (
            <div className="flex flex-col gap-6">
              <ItineraryCard 
                tripData={tripData} 
                onSaveTrip={handleSaveTrip} 
                isSaving={isSaving} 
              />
              <Chatbot />
            </div>
          )}

          {activeTab === 'attractions-tab' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-[rgba(255,255,255,0.05)] pb-3">
                <h3 className="text-lg font-bold text-white">Famous Attractions & Local Secrets</h3>
                <p className="text-xs text-slate-500">Popular tourist stops and curated local hidden gems</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-marigoldGold uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1">
                    <i className="fa-solid fa-star"></i> Famous Sightseeing Spots
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {tripData?.attractions?.map((attr, idx) => {
                      const isFav = (favorites.attractions || []).some(fav => fav.name === attr.name);
                      return (
                        <div key={idx} className="glass-panel p-3.5 bg-slate-900/30">
                          <div className="flex justify-between items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{attr.name}</h5>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-marigoldGold font-extrabold">Fee: ₹{attr.fee}</span>
                              <button 
                                onClick={() => handleToggleFavorite('attractions', attr)}
                                className={`text-[10px] transition cursor-pointer p-1 ${isFav ? 'text-rose-500' : 'text-slate-500 hover:text-white'}`}
                                title={isFav ? "Saved to Favorites" : "Save to Favorites"}
                              >
                                <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{attr.desc}</p>
                        </div>
                      );
                    })}
                    {(!tripData || !tripData.attractions || tripData.attractions.length === 0) && (
                      <p className="text-xs text-slate-500 text-center py-8">Select a destination to view attractions list</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-oceanTeal uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1">
                    <i className="fa-solid fa-circle-nodes"></i> Curated Hidden Gems
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {tripData?.hidden_gems?.map((gem, idx) => {
                      const isFav = (favorites.attractions || []).some(fav => fav.name === gem.name);
                      return (
                        <div key={idx} className="glass-panel p-3.5 bg-slate-900/30">
                          <div className="flex justify-between items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{gem.name}</h5>
                            <button 
                              onClick={() => handleToggleFavorite('attractions', { name: gem.name, desc: gem.desc, fee: 0, coords: gem.coords })}
                              className={`text-[10px] transition cursor-pointer p-1 ${isFav ? 'text-rose-500' : 'text-slate-500 hover:text-white'}`}
                              title={isFav ? "Saved to Favorites" : "Save to Favorites"}
                            >
                              <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{gem.desc}</p>
                        </div>
                      );
                    })}
                    {(!tripData || !tripData.hidden_gems || tripData.hidden_gems.length === 0) && (
                      <p className="text-xs text-slate-500 text-center py-8">Select a destination to view local secret gems</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hotels-tab' && (
            <HotelCard 
              destination={tripData?.destination || tripData?.state_intelligence?.name} 
              budgetCategory={tripData?.budget_category || 'medium'}
              hotels={tripData?.hotels_by_category || tripData?.hotels}
              onViewOnMap={(coords, name) => setMapFocus({ coords, name })}
              favorites={favorites.hotels}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'food-tab' && (
            <FoodCard 
              foods={tripData?.famous_foods} 
              restaurants={tripData?.restaurants}
              destination={tripData?.destination || tripData?.state_intelligence?.name} 
              onViewOnMap={(coords, name) => setMapFocus({ coords, name })}
              favorites={favorites.restaurants}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'rentals-tab' && (
            <VehicleRentalCard rentals={tripData?.vehicle_rentals} />
          )}

          {activeTab === 'favorites-tab' && (
            <div className="flex flex-col gap-6">
              <div className="border-b border-[rgba(255,255,255,0.05)] pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-title">
                  <i className="fa-solid fa-heart text-rose-500"></i> My Saved Favorites
                </h3>
                <p className="text-xs text-slate-500">View and manage your saved hotels, dining spots, and sightseeing attractions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saved Hotels */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-sunsetCoral uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5 font-title">
                    <i className="fa-solid fa-hotel text-[10px]"></i> Saved Lodgings
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {favorites.hotels.length > 0 ? (
                      favorites.hotels.map((hotel, idx) => (
                        <div key={idx} className="glass-panel p-3 bg-slate-900/30 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="text-xs font-bold text-white line-clamp-1">{hotel.name}</h5>
                            <button 
                              onClick={() => handleToggleFavorite('hotels', hotel)}
                              className="text-rose-500 hover:text-rose-600 text-[10px] shrink-0 cursor-pointer p-0.5"
                            >
                              <i className="fa-solid fa-heart-crack"></i>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1"><i className="fa-solid fa-location-dot text-[8px] mr-1 text-royalIndigo"></i>{hotel.location}</p>
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-800/40 pt-1.5 mt-0.5">
                            <span className="text-marigoldGold font-extrabold">₹{hotel.price}/n</span>
                            {hotel.coords && (
                              <button 
                                onClick={() => setMapFocus({ coords: hotel.coords, name: hotel.name })}
                                className="text-[9px] bg-royalIndigo/20 hover:bg-royalIndigo/45 text-royalIndigo font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <i className="fa-solid fa-location-crosshairs text-[8px]"></i> Pin
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-8">No lodgings saved yet.</p>
                    )}
                  </div>
                </div>

                {/* Saved Dining & Delicacies */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-marigoldGold uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5 font-title">
                    <i className="fa-solid fa-utensils text-[10px]"></i> Saved Dining & Foods
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {favorites.restaurants.length > 0 ? (
                      favorites.restaurants.map((rest, idx) => (
                        <div key={idx} className="glass-panel p-3 bg-slate-900/30 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="text-xs font-bold text-white line-clamp-1">{rest.name}</h5>
                            <button 
                              onClick={() => handleToggleFavorite('restaurants', rest)}
                              className="text-rose-500 hover:text-rose-600 text-[10px] shrink-0 cursor-pointer p-0.5"
                            >
                              <i className="fa-solid fa-heart-crack"></i>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1"><i className="fa-solid fa-location-dot text-[8px] mr-1 text-royalIndigo"></i>{rest.location}</p>
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-800/40 pt-1.5 mt-0.5">
                            <span className="text-sunsetCoral font-bold line-clamp-1 max-w-[120px]">{rest.cuisine || rest.type || 'Eatery'}</span>
                            {rest.coords && (
                              <button 
                                onClick={() => setMapFocus({ coords: rest.coords, name: rest.name })}
                                className="text-[9px] bg-royalIndigo/20 hover:bg-royalIndigo/45 text-royalIndigo font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <i className="fa-solid fa-location-crosshairs text-[8px]"></i> Pin
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-8">No food items saved yet.</p>
                    )}
                  </div>
                </div>

                {/* Saved Attractions */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-oceanTeal uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5 font-title">
                    <i className="fa-solid fa-monument text-[10px]"></i> Saved Attractions
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {favorites.attractions && favorites.attractions.length > 0 ? (
                      favorites.attractions.map((attr, idx) => (
                        <div key={idx} className="glass-panel p-3 bg-slate-900/30 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="text-xs font-bold text-white line-clamp-1">{attr.name}</h5>
                            <button 
                              onClick={() => handleToggleFavorite('attractions', attr)}
                              className="text-rose-500 hover:text-rose-600 text-[10px] shrink-0 cursor-pointer p-0.5"
                            >
                              <i className="fa-solid fa-heart-crack"></i>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">{attr.desc}</p>
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-800/40 pt-1.5 mt-0.5">
                            <span className="text-marigoldGold font-extrabold">Fee: ₹{attr.fee || 'Free'}</span>
                            {attr.coords && (
                              <button 
                                onClick={() => setMapFocus({ coords: attr.coords, name: attr.name })}
                                className="text-[9px] bg-royalIndigo/20 hover:bg-royalIndigo/45 text-royalIndigo font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <i className="fa-solid fa-location-crosshairs text-[8px]"></i> Pin
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-8">No attractions saved yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Slide-out Detail Drawer */}
      {detailDrawer.open && (() => {
        const destKey = tripData?.destination || tripData?.state_intelligence?.name
          ? (tripData.destination || tripData.state_intelligence.name)
          : "";
        const budgetCat = tripData?.budget_category || 'medium';
        let drawerHotels = [];
        if (tripData?.hotels_by_category) {
          drawerHotels = tripData.hotels_by_category[budgetCat.toLowerCase()] || [];
        } else {
          drawerHotels = tripData?.hotels || getDynamicHotels(destKey);
          const isDynamic = drawerHotels.length > 0 && drawerHotels[0].source;
          if (!isDynamic) {
            const cleanBudget = budgetCat.toLowerCase();
            if (cleanBudget === 'low') {
              drawerHotels = [drawerHotels[0], drawerHotels[1]].filter(Boolean);
            } else if (cleanBudget === 'medium') {
              drawerHotels = [drawerHotels[2], drawerHotels[3]].filter(Boolean);
            } else if (cleanBudget === 'high') {
              drawerHotels = [drawerHotels[4], drawerHotels[5]].filter(Boolean);
            }
          }
        }
        console.log("DEBUG: detailDrawer.type", detailDrawer.type);
        console.log("DEBUG: tripData", tripData);
        console.log("DEBUG: drawerHotels", drawerHotels);
        const drawerRestaurants = tripData?.restaurants || getDynamicRestaurants(destKey);
        const drawerRentals = tripData?.vehicle_rentals || [];

        return (
          <>
            {/* Backdrop Blur Overlay */}
            <div 
              onClick={() => setDetailDrawer({ open: false, type: null })}
              className="fixed inset-0 z-[1999] bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Slide-out Panel */}
            <div 
              className="fixed top-0 right-0 z-[2000] w-[420px] max-w-[90vw] h-screen bg-[#080b11]/95 backdrop-filter backdrop-blur-2xl border-l border-[rgba(255,255,255,0.08)] shadow-2xl animate-slide-in-right"
              style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '420px', maxWidth: '90vw' }}
            >
              {/* Header */}
              <div 
                className="p-5 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center bg-[#0f1622]/40"
                style={{ flexShrink: 0 }}
              >
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    {detailDrawer.type === 'hotel' && <><i className="fa-solid fa-hotel text-sunsetCoral mr-2"></i>Selected Accommodations</>}
                    {detailDrawer.type === 'food' && <><i className="fa-solid fa-utensils text-marigoldGold mr-2"></i>Dining & Culinary</>}
                    {detailDrawer.type === 'rental' && <><i className="fa-solid fa-car-side text-royalIndigo"></i> Vehicle Fleet Details</>}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {detailDrawer.type === 'hotel' && "Premium hotels & verified homestays"}
                    {detailDrawer.type === 'food' && "Top-rated local cuisine & famous dining spots"}
                    {detailDrawer.type === 'rental' && "Available transport rental models & charges"}
                  </p>
                </div>
                <button 
                  onClick={() => setDetailDrawer({ open: false, type: null })}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-[rgba(255,255,255,0.05)] hover:border-sunsetCoral/50 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <div 
                className="overflow-y-auto"
                style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', flexGrow: 1, overflowY: 'auto' }}
              >
                {detailDrawer.type === 'hotel' && (
                  drawerHotels.map((hotel, idx) => {
                    const stars = hotel.rating ? Math.round(hotel.rating) : 4;
                    return (
                      <div 
                        key={idx} 
                        className="glass-panel overflow-hidden bg-slate-900/30 hover:border-sunsetCoral/30 transition duration-300 group shadow-lg"
                        style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
                      >
                        {/* Photo Area */}
                        <div style={{ height: '176px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src={hotel.photo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'} 
                            alt={hotel.name || 'Stay'} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            className="group-hover:scale-105 transition duration-500" 
                          />
                          {/* Category Tag */}
                          <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/75 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-md text-[8px] font-black uppercase tracking-wider text-slate-300">
                            {hotel.category || 'Medium'} class
                          </div>
                          {/* Price Tag */}
                          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-lg text-xs font-black text-marigoldGold">
                            ₹{hotel.price ? hotel.price.toLocaleString('en-IN') : '1,200'}/n
                          </div>
                        </div>

                        {/* Card Details */}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                          <div>
                            <h4 className="text-xs font-extrabold text-white group-hover:text-sunsetCoral transition flex items-start justify-between gap-2">
                              <span className="line-clamp-1">{hotel.name || 'Cozy Stay'}</span>
                              {/* Star Rating Indicator */}
                              <span className="flex text-amber-400 text-[9px] items-center shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <i key={i} className={`${i < stars ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                                ))}
                                <span className="text-[9px] text-slate-400 font-bold ml-1">({hotel.rating || '4.0'})</span>
                              </span>
                            </h4>
                            
                            {/* Price Range */}
                            <div className="text-[9px] text-marigoldGold font-bold mt-0.5">
                              Est. Range: {hotel.price_range || `₹${(hotel.price || 1200) - 150} - ₹${(hotel.price || 1200) + 150}`}
                            </div>

                            {/* Address */}
                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-wider flex items-center gap-1 line-clamp-1">
                              <i className="fa-solid fa-location-dot text-[8px] text-royalIndigo"></i>
                              {hotel.location || 'Local Area'}
                            </p>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-2">
                            {hotel.desc || 'Comfortable accommodation featuring verified amenities and active support.'}
                          </p>

                          <div className="border-t border-[rgba(255,255,255,0.04)] pt-3 mt-auto flex justify-between items-center text-[9px] text-slate-500 font-semibold gap-2 flex-wrap">
                            <span>
                              <i className="fa-solid fa-compass text-slate-600 mr-1"></i>
                              Coords: {hotel.coords || 'N/A'}
                            </span>
                            <div className="flex gap-2 items-center">
                              {hotel.coords && (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setMapFocus({ coords: hotel.coords, name: hotel.name || 'Stay' }); 
                                    setDetailDrawer({ open: false, type: null }); 
                                  }}
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
                        </div>
                      </div>
                    );
                  })
                )}

                {detailDrawer.type === 'food' && (
                  drawerRestaurants.map((rest, idx) => (
                    <div 
                      key={idx} 
                      className="glass-panel overflow-hidden bg-slate-900/30 hover:border-sunsetCoral/30 transition duration-300 group shadow-lg"
                      style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
                    >
                      {/* Restaurant Image */}
                      <div style={{ height: '128px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                        <img 
                          src={rest.photo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'} 
                          alt={rest.name || 'Dining'} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          className="group-hover:scale-105 transition duration-500" 
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/65 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded text-[9px] font-bold text-marigoldGold uppercase flex items-center gap-0.5">
                          <i className="fa-solid fa-star text-[8px]"></i> {rest.rating || '4.5'}
                        </div>
                      </div>

                      {/* Restaurant Details */}
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                        <div>
                          <h4 className="text-xs font-extrabold text-white group-hover:text-sunsetCoral transition flex items-center">
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
                          {rest.desc || `Popular local dining spot offering delicious authentic meals.`}
                        </p>

                        <div className="border-t border-[rgba(255,255,255,0.04)] pt-2 mt-auto text-[8px] text-slate-500 flex justify-between items-center font-bold gap-2 flex-wrap">
                          <span>
                            <i className="fa-solid fa-fire text-sunsetCoral mr-1"></i>
                            Specialty: {rest.cuisine}
                          </span>
                          <div className="flex gap-2 items-center">
                            {rest.coords && (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setMapFocus({ coords: rest.coords, name: rest.name || 'Eatery' }); 
                                  setDetailDrawer({ open: false, type: null }); 
                                }}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {detailDrawer.type === 'rental' && (
                  drawerRentals.length > 0 ? (
                    drawerRentals.map((rental, idx) => (
                      <div 
                        key={idx} 
                        className="glass-panel bg-slate-900/30 border border-[rgba(255,255,255,0.05)] hover:border-royalIndigo/30 transition duration-300"
                        style={{ minHeight: '140px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <i className="fa-solid fa-car-side text-royalIndigo"></i>
                              {rental.name}
                            </h4>
                            <span className="text-[9px] px-2 py-0.5 bg-royalIndigo/15 text-royalIndigo border border-royalIndigo/30 rounded font-bold uppercase mt-1 inline-block">
                              {rental.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-white block">₹{rental.daily_rate} / day</span>
                            <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Est. Fuel: ₹{rental.fuel_estimate}/d</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-[rgba(255,255,255,0.03)] pt-2.5 font-medium">{rental.best_for}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-10 text-xs font-semibold">
                      Please generate a trip itinerary to view available rental fleet recommendations.
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* FLOATING AI TRAVEL ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3 font-body">
        {assistantOpen ? (
          <div className="w-[360px] max-w-[90vw] h-[450px] glass-panel bg-[#090d16]/95 border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            {/* Header */}
            <div className="p-3.5 border-b border-[rgba(255,255,255,0.06)] bg-[#0f1623] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-title">AI Travel Assistant</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Active Context Mode</p>
                </div>
              </div>
              <button 
                onClick={() => setAssistantOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-900 border border-[rgba(255,255,255,0.05)] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95 animate-pulse"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 min-h-0 bg-[#06080d]/40">
              {assistantHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-royalIndigo text-white rounded-br-none self-end text-left' 
                      : 'bg-slate-900/60 border border-[rgba(255,255,255,0.03)] text-slate-300 rounded-bl-none self-start text-left'
                  }`}
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                />
              ))}
              {assistantLoading && (
                <div className="bg-slate-900/60 border border-[rgba(255,255,255,0.03)] text-slate-500 font-bold rounded-2xl rounded-bl-none p-3 text-xs self-start flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              )}
              <div ref={assistantEndRef} />
            </div>

            {/* Quick Prompts Row */}
            <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.05)] bg-[#070b12] flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              {['Cheapest route?', 'Best hotels?', 'Local foods?', 'Night spots?'].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAssistant(q)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-[rgba(255,255,255,0.05)] text-[9px] font-bold text-slate-400 hover:text-white rounded-full whitespace-nowrap transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Strip */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.05)] bg-[#090d16] flex gap-2 shrink-0">
              <input 
                type="text"
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAssistant()}
                className="glass-input p-2.5 text-xs flex-grow"
                placeholder="Ask tour guide..."
              />
              <button 
                onClick={() => handleSendAssistant()}
                className="px-4 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white rounded-xl text-xs hover:brightness-110 active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setAssistantOpen(true)}
            className="w-14 h-14 bg-gradient-to-tr from-sunsetCoral to-marigoldGold text-white rounded-full shadow-2xl flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer glow-active flex items-center justify-center"
            title="Chat with AI Agent"
          >
            <i className="fa-solid fa-comments"></i>
          </button>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
