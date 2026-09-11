import React, { useState, useRef, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef(null);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 600);
  };

  useEffect(() => {
    // Failsafe timer: ensures transition after 5.2s even if video stalled
    const timer = setTimeout(() => {
      handleFinish();
    }, 5200);

    // Attempt video playback
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.log("Autoplay note:", e);
      });
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-4 sm:p-6 bg-[#080b11] select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(254, 202, 87, 0.08) 0%, rgba(255, 107, 107, 0.05) 50%, transparent 80%)',
      }}
    >
      {/* Top Bar with Skip button */}
      <div className="w-full flex justify-end pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={handleFinish}
          className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.04] backdrop-blur-md transition active:scale-95 z-10"
        >
          Skip ➔
        </button>
      </div>

      {/* Center 5-Second Canva Animation Video */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-xs sm:max-w-sm px-2">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-sunsetCoral/25 border border-amber-500/20 bg-[#fbf7f4] flex items-center justify-center">
          <video
            ref={videoRef}
            src="/intro-video.mp4"
            autoPlay
            muted
            playsInline
            onEnded={handleFinish}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom Subtitle / Ticker */}
      <div className="w-full flex flex-col items-center gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-[11px] text-slate-400 font-semibold tracking-widest uppercase animate-pulse">
          India Tour Planner &bull; Launching Your Journey
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
