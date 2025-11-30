import React from 'react';
import { ShoppingCart, Briefcase, Gem } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: Tab.MARKET, icon: ShoppingCart, label: 'МАГАЗИН' },
    { id: Tab.MANAGEMENT, icon: Briefcase, label: 'БИЗНЕС' },
    { id: Tab.LIFESTYLE, icon: Gem, label: 'ЛАКШЕРИ' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-[2rem] h-[80px] flex items-center justify-between px-4 pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.1)] min-w-[320px]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(isActive ? Tab.CLICKER : item.id)}
              className="relative w-24 h-full flex flex-col items-center justify-center group"
            >
              {isActive && (
                <div className="absolute top-2 w-12 h-1 bg-purple-500 rounded-full" />
              )}
              
              <div className={`
                p-3 rounded-2xl transition-all duration-300 transform
                ${isActive ? 'bg-purple-100 text-purple-600 translate-y-[-5px]' : 'text-slate-400 hover:text-slate-600'}
              `}>
                <Icon size={28} strokeWidth={isActive ? 3 : 2.5} />
              </div>
              
              <span className={`text-[10px] font-black tracking-widest mt-1 transition-colors ${isActive ? 'text-purple-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};