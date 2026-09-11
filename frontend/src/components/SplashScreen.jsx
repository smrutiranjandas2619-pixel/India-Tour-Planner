import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 600);
  };

  useEffect(() => {
    // 5 seconds intro animation
    const timer = setTimeout(() => {
      handleFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#9bb4dc',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Top Bar with Minimalist Skip Button */}
      <div className="w-full flex justify-end p-4 sm:p-6 pt-4 z-20">
        <button
          onClick={handleFinish}
          className="text-[11px] font-bold uppercase tracking-widest text-slate-800/80 hover:text-slate-900 px-4 py-1.5 rounded-full border border-white/60 hover:border-white bg-white/40 hover:bg-white/70 backdrop-blur-md transition-all active:scale-95 shadow-sm"
        >
          Skip ➔
        </button>
      </div>

      {/* Full-Screen Pure Animation (Zero video player artifacts, zero controls) */}
      <div className="flex-1 w-full flex items-center justify-center relative px-4 pb-6">
        <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
          <img
            src="/intro-animation.webp"
            alt="India Tour Planner"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable="false"
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
