import React from 'react';
import { marked } from 'marked';

const ItineraryCard = ({ 
  tripData, 
  onSaveTrip, 
  isSaving 
}) => {
  
  const handleExportPdf = () => {
    if (!tripData || !tripData.ai_response) return;

    const printWindow = window.open('', '_blank');
    const stateName = tripData.state_intelligence?.name || "India";
    const costs = tripData.costs;
    
    let costsHtml = '';
    if (costs) {
      costsHtml = `
        <div class="ledger-box">
          <h3>Smart Estimated Budget Breakdown</h3>
          <p><b>Estimated Total Cost:</b> INR ${costs.total_estimated.toLocaleString('en-IN')}</p>
          <p><b>Daily Average Spend:</b> INR ${costs.daily_average.toLocaleString('en-IN')}</p>
          <ul>
            <li><b>Hotel Accommodation:</b> ${costs.hotel.desc} - ₹${costs.hotel.total.toLocaleString('en-IN')}</li>
            <li><b>Food Allowance:</b> ${costs.food.desc} - ₹${costs.food.total.toLocaleString('en-IN')}</li>
            <li><b>Vehicle Hire Charges:</b> ${costs.rental.desc} - ₹${costs.rental.total.toLocaleString('en-IN')}</li>
            <li><b>Fuel Allowances:</b> ${costs.fuel.desc} - ₹${costs.fuel.total.toLocaleString('en-IN')}</li>
            <li><b>Emergency Contingencies:</b> ${costs.emergency_buffer.desc} - ₹${costs.emergency_buffer.total.toLocaleString('en-IN')}</li>
          </ul>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>India Tour Planner - Travel Dossier</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            h1 { color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 8px; margin-bottom: 5px; font-size: 2.2rem; }
            h2 { color: #818cf8; margin-top: 30px; font-size: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            h3 { color: #feca57; font-size: 1.2rem; margin-top: 20px; }
            p, li { color: #475569; font-size: 1rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 0.95rem; }
            th { background: #f8fafc; color: #1e293b; }
            .meta { font-size: 0.9rem; color: #94a3b8; margin-bottom: 30px; }
            .ledger-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
            .ledger-box h3 { color: #ff6b6b; margin-top: 0; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>India Tour Planner</h1>
          <p class="meta">Custom RAG Travel Dossier & Budget Report • Generated dynamically in 2026</p>
          
          ${costsHtml}
          
          <div class="itinerary-box">
            ${marked.parse(tripData.ai_response)}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!tripData || !tripData.ai_response) {
    return (
      <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center gap-3">
        <i className="fa-solid fa-wand-magic-sparkles text-4xl text-slate-700 animate-pulse"></i>
        <div>
          <p className="font-bold">Consultant is ready to compile travel routes</p>
          <p className="text-xs text-slate-500">Configure your parameters and click "Search" to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-3">
        <div>
          <h3 className="text-lg font-bold text-white font-title flex items-center gap-2">
            <i className="fa-solid fa-compass text-royalIndigo animate-spin-slow"></i> 
            Travel Consultant Itinerary
          </h3>
          <p className="text-xs text-slate-500">Live RAG-synthesized day-wise recommendations</p>
        </div>
        
        <div className="flex gap-2">
          {onSaveTrip && (
            <button 
              onClick={onSaveTrip} 
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-royalIndigo/25 hover:bg-royalIndigo/40 text-xs font-bold text-royalIndigo border border-royalIndigo/45 rounded-lg transition active:scale-95 disabled:opacity-50 cursor-pointer text-white"
            >
              <i className="fa-solid fa-bookmark text-royalIndigo"></i> 
              <span>{isSaving ? "Saving..." : "Save Itinerary"}</span>
            </button>
          )}
          <button 
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-[rgba(255,255,255,0.08)] rounded-lg transition active:scale-95 cursor-pointer"
          >
            <i className="fa-solid fa-file-pdf text-sunsetCoral"></i> Export PDF
          </button>
        </div>
      </div>

      <div 
        className="markdown-content text-sm p-5 bg-slate-950/25 border border-[rgba(255,255,255,0.02)] rounded-2xl min-h-[150px] leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: marked.parse(tripData.ai_response) }}
      />
    </div>
  );
};

export default ItineraryCard;
