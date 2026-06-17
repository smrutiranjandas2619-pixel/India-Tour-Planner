import React from 'react';

const VehicleRentalCard = ({ rentals }) => {
  if (!rentals || rentals.length === 0) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="border-b border-[rgba(255,255,255,0.05)] pb-3">
          <h3 className="text-lg font-bold text-white">Vehicle Rental & Terrain Suitability</h3>
          <p className="text-xs text-slate-500">Compare daily rental rates, estimated fuel costs, and terrain guidelines</p>
        </div>
        <div className="w-full text-center py-10 text-slate-500 text-xs">Select a destination to load vehicle rental guides</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="border-b border-[rgba(255,255,255,0.05)] pb-3">
        <h3 className="text-lg font-bold text-white">Vehicle Rental & Terrain Suitability</h3>
        <p className="text-xs text-slate-500">Compare daily rental rates, estimated fuel costs, and terrain guidelines</p>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.05)] bg-slate-900/10">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 font-bold uppercase border-b border-slate-800">
              <th className="p-3">Vehicle</th>
              <th className="p-3">Class</th>
              <th className="p-3">Daily Rent</th>
              <th className="p-3">Daily Fuel</th>
              <th className="p-3">Terrain Guidelines</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {rentals.map((rental, idx) => (
              <tr key={idx} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-slate-950/20 transition">
                <td className="p-3 font-bold text-white"><i className="fa-solid fa-car text-slate-500 mr-2"></i>{rental.name}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] text-slate-400 font-medium">{rental.type}</span></td>
                <td className="p-3 font-extrabold text-sunsetCoral">₹{rental.daily_rate}</td>
                <td className="p-3 text-marigoldGold font-extrabold">₹{rental.fuel_estimate}</td>
                <td className="p-3 text-slate-400">{rental.best_for}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleRentalCard;
