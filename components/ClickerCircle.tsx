import React, { useRef, useState } from 'react';

interface ClickerCircleProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  clickValue: number;
}

export const ClickerCircle: React.FC<ClickerCircleProps> = ({ onClick, clickValue }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(true);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTimeout(() => setIsPressed(false), 100);
    onClick(e);
  };

  return (
    <div className="relative flex items-center justify-center py-6 w-full h-full">
      {/* Decorative Background Rays */}
      <div className="absolute w-[360px] h-[360px] bg-yellow-400/20 rounded-full animate-pulse blur-3xl" />

      <div className="relative w-64 h-64 sm:w-72 sm:h-72 select-none touch-manipulation flex items-center justify-center">
        
        {/* The Core Button */}
        <div
          onMouseDown={handleInteraction}
          onTouchStart={handleInteraction}
          className={`
            relative w-56 h-56 rounded-full 
            flex items-center justify-center
            transition-transform duration-100 cubic-bezier(0.34, 1.56, 0.64, 1)
            cursor-pointer group
            ${isPressed ? 'scale-90' : 'scale-100 hover:scale-105'}
          `}
        >
          {/* Shadow/Depth Layer */}
          <div className="absolute inset-0 bg-green-700 rounded-full translate-y-3" />
          
          {/* Main Button Surface */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-400 to-green-600 rounded-full border-4 border-white shadow-[inset_0_5px_20px_rgba(255,255,255,0.4)] flex items-center justify-center overflow-hidden">
             
             {/* Shine Effect */}
             <div className="absolute top-0 left-10 w-20 h-32 bg-white/20 -skew-x-12 blur-md rounded-full" />
             
             {/* Icon */}
             <div className="relative z-10 flex flex-col items-center justify-center drop-shadow-md">
                <span className="text-8xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.1)]">$</span>
                <span className="text-xs font-black text-green-900 bg-white/30 px-3 py-1 rounded-full mt-2 uppercase tracking-wider">
                  КЛИК!
                </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};