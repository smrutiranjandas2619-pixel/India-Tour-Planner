import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const BudgetCalculator = ({ tripData, onOpenDetails }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Safely render and rebuild the Chart.js doughnut chart
  useEffect(() => {
    if (!tripData || !tripData.costs || !chartRef.current) return;

    const costs = tripData.costs;
    
    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hotels', 'Food', 'Rentals', 'Fuel & Transit', 'Emergency Buffer'],
        datasets: [{
          data: [
            costs.hotel.total,
            costs.food.total,
            costs.rental.total,
            costs.fuel.total,
            costs.emergency_buffer.total
          ],
          backgroundColor: [
            '#ff6b6b', // sunsetCoral
            '#feca57', // marigoldGold
            '#818cf8', // royalIndigo
            '#ff9f43', 
            '#48dbfb'
          ],
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '70%'
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [tripData]);

  // Display empty state if no trip data loaded yet
  if (!tripData || !tripData.costs) {
    return (
      <div className="glass-panel p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3">
          <i className="fa-solid fa-calculator text-marigoldGold"></i>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Smart Expense Estimator</h2>
        </div>
        <div className="w-full flex justify-center py-2 h-[180px] items-center text-xs text-slate-500 font-medium bg-slate-950/30 rounded-lg border border-dashed border-slate-800">
          Submit a trip profile to build charts
        </div>
      </div>
    );
  }

  const { costs } = tripData;

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calculator text-marigoldGold"></i>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Smart Expense Estimator</h2>
        </div>
        <span className="px-2 py-0.5 bg-sunsetCoral/15 text-sunsetCoral border border-sunsetCoral/20 rounded-md text-[10px] font-bold uppercase">Dynamic</span>
      </div>
      
      {/* Big Number Summary */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900/40 border border-[rgba(255,255,255,0.03)] rounded-xl text-center">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Total</p>
          <p className="text-xl md:text-2xl font-extrabold text-white">₹{costs.total_estimated.toLocaleString('en-IN')}</p>
        </div>
        <div className="border-l border-[rgba(255,255,255,0.05)]">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Average</p>
          <p className="text-xl md:text-2xl font-extrabold text-marigoldGold">₹{costs.daily_average.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full flex justify-center py-2 h-[180px] relative">
        <canvas ref={chartRef} className="max-h-full"></canvas>
      </div>

      {/* Cost Breakdown Ledger */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {/* Room/Hotel */}
        <div 
          onClick={() => onOpenDetails && onOpenDetails('hotel')}
          className="flex justify-between items-center text-xs p-2.5 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-lg cursor-pointer hover:bg-slate-900/40 hover:border-sunsetCoral/30 transition duration-300 group"
        >
          <div>
            <p className="text-white font-semibold group-hover:text-sunsetCoral transition"><i className="fa-solid fa-hotel text-slate-400 group-hover:text-sunsetCoral mr-1.5"></i>Hotels & Homestays</p>
            <p className="text-[10px] text-slate-500">{costs.hotel.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">₹{costs.hotel.total.toLocaleString('en-IN')}</p>
            <i className="fa-solid fa-chevron-right text-[9px] text-slate-600 group-hover:text-sunsetCoral transition-transform group-hover:translate-x-0.5"></i>
          </div>
        </div>
        {/* Food */}
        <div 
          onClick={() => onOpenDetails && onOpenDetails('food')}
          className="flex justify-between items-center text-xs p-2.5 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-lg cursor-pointer hover:bg-slate-900/40 hover:border-marigoldGold/30 transition duration-300 group"
        >
          <div>
            <p className="text-white font-semibold group-hover:text-marigoldGold transition"><i className="fa-solid fa-bowl-food text-slate-400 group-hover:text-marigoldGold mr-1.5"></i>Food Expenses</p>
            <p className="text-[10px] text-slate-500">{costs.food.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">₹{costs.food.total.toLocaleString('en-IN')}</p>
            <i className="fa-solid fa-chevron-right text-[9px] text-slate-600 group-hover:text-marigoldGold transition-transform group-hover:translate-x-0.5"></i>
          </div>
        </div>
        {/* Vehicle Rental */}
        <div 
          onClick={() => onOpenDetails && onOpenDetails('rental')}
          className="flex justify-between items-center text-xs p-2.5 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-lg cursor-pointer hover:bg-slate-900/40 hover:border-royalIndigo/30 transition duration-300 group"
        >
          <div>
            <p className="text-white font-semibold group-hover:text-royalIndigo transition"><i className="fa-solid fa-motorcycle text-slate-400 group-hover:text-royalIndigo mr-1.5"></i>Vehicle Rental</p>
            <p className="text-[10px] text-slate-500">{costs.rental.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">₹{costs.rental.total.toLocaleString('en-IN')}</p>
            <i className="fa-solid fa-chevron-right text-[9px] text-slate-600 group-hover:text-royalIndigo transition-transform group-hover:translate-x-0.5"></i>
          </div>
        </div>

        {/* Fuel and Local Travel */}
        <div className="flex justify-between items-center text-xs p-2 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-lg">
          <div>
            <p className="text-white font-semibold"><i className="fa-solid fa-gas-pump text-slate-400 mr-1.5"></i>Fuel & Transit</p>
            <p className="text-[10px] text-slate-500">{costs.fuel.desc}</p>
          </div>
          <p className="font-bold text-white">₹{costs.fuel.total.toLocaleString('en-IN')}</p>
        </div>

        {/* Emergency buffer */}
        <div className="flex justify-between items-center text-xs p-2 bg-slate-950/20 border border-[rgba(255,255,255,0.03)] rounded-lg">
          <div>
            <p className="text-white font-semibold"><i className="fa-solid fa-circle-exclamation text-slate-400 mr-1.5"></i>Emergency Buffer</p>
            <p className="text-[10px] text-slate-500">{costs.emergency_buffer.desc}</p>
          </div>
          <p className="font-bold text-white">₹{costs.emergency_buffer.total.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetCalculator;
