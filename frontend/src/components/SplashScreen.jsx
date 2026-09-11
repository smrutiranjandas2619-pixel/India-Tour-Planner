import React, { useState, useEffect } from 'react';

const STATUS_MESSAGES = [
  "Mapping heritage routes & scenic wonders...",
  "Curating hotels, transport & local cuisines...",
  "Synchronizing AI Travel Consultant...",
  "Ready for takeoff! Welcome aboard..."
];

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 5-second total duration (5000ms)
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      // Rotate status messages every 1.25s
      const msgIdx = Math.min(
        STATUS_MESSAGES.length - 1,
        Math.floor((elapsed / duration) * STATUS_MESSAGES.length)
      );
      setStatusIndex(msgIdx);

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 600); // Wait for fade-out transition
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-8 bg-[#080b11] select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 35%, rgba(254, 202, 87, 0.08) 0%, rgba(255, 107, 107, 0.05) 45%, transparent 70%)',
      }}
    >
      {/* Top Bar with Skip */}
      <div className="w-full flex justify-end pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          onClick={handleSkip}
          className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-white px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 bg-white/[0.02] transition active:scale-95"
        >
          Skip ➔
        </button>
      </div>

      {/* Center Animated Logo & Branding */}
      <div className="flex flex-col items-center text-center gap-6 my-auto">
        {/* Floating Hot Air Balloon Canvas */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow Aura */}
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-sunsetCoral/20 via-marigoldGold/20 to-oceanTeal/20 blur-2xl animate-pulse"></div>

          {/* Balloon Container with Floating Keyframe Animation */}
          <div 
            className="relative w-36 h-36 sm:w-44 sm:h-44 p-3 rounded-3xl bg-[#fbf7f4] shadow-2xl shadow-sunsetCoral/20 border border-amber-500/20 flex items-center justify-center"
            style={{
              animation: 'balloonFloat 3.2s ease-in-out infinite',
            }}
          >
            <img 
              src="/logo-full.png" 
              alt="India Tour Planner" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="flex flex-col gap-1.5 mt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            India <span className="bg-gradient-to-r from-sunsetCoral via-marigoldGold to-oceanTeal bg-clip-text text-transparent">Tour Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            AI-Powered Personalized Travel Architect
          </p>
        </div>
      </div>

      {/* Bottom Progress & Travel Ticker */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 relative">
          <div 
            className="h-full bg-gradient-to-r from-sunsetCoral via-marigoldGold to-oceanTeal rounded-full transition-all duration-100 ease-linear shadow-lg shadow-sunsetCoral/30"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Status Text */}
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide animate-fade-in text-center h-4">
          {STATUS_MESSAGES[statusIndex]}
        </p>
      </div>

      {/* Embedded Keyframe CSS */}
      <style>{`
        @keyframes balloonFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(1.2deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
