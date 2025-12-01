import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';

interface ClickerCircleProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  clickValue: number;
}

export const ClickerCircle: React.FC<ClickerCircleProps> = ({ onClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    setIsPressed(true);
    if (navigator.vibrate) navigator.vibrate(10); 
    setTimeout(() => setIsPressed(false), 80);
    onClick(e);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      
      <button
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
        className={`
          relative w-64 h-64 rounded-full
          flex flex-col items-center justify-center
          transition-all duration-200 ease-out
          cursor-pointer group outline-none
          ${isPressed ? 'scale-95 opacity-80' : 'scale-100 opacity-60'}
        `}
      >
        {/* Soft gradient background instead of border */}
        <div className={`
            absolute inset-0 rounded-full 
            bg-gradient-to-t from-primary/10 to-transparent
            transition-all duration-300
            ${isPressed ? 'opacity-30' : 'opacity-10'}
        `}/>

        {/* Inner Icon */}
        <div className={`transition-all duration-300 ${isPressed ? 'scale-110 text-primary' : 'text-slate-600'}`}>
           <Fingerprint size={96} strokeWidth={0.5} />
        </div>
        
        <div className={`absolute bottom-8 text-[10px] uppercase font-black tracking-[0.3em] transition-all duration-300 ${isPressed ? 'text-primary/70' : 'text-slate-700'}`}>
            ЖМИ СЮДА
        </div>

      </button>
    </div>
  );
};