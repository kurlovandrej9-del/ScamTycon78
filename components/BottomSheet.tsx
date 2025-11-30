import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg h-[85vh] bg-[#f8fafc] rounded-t-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col transform transition-transform duration-300 translate-y-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 z-10 bg-white shadow-sm">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5 no-scrollbar pb-32 bg-[#f8fafc] touch-pan-y">
          {children}
        </div>
      </div>
    </div>
  );
};