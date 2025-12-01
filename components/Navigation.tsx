
import React from 'react';
import { Landmark, Briefcase, Gem, User, Zap } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: Tab.MANAGEMENT, icon: Briefcase, label: 'Бизнес' }, // Team, Soft, Traffic
    { id: Tab.SCHEMES, icon: Zap, label: 'Темки' }, // Schemes, Dark Market
    { id: Tab.MARKET, icon: Landmark, label: 'Финансы' }, // Laundering, Exchange, Tools
    { id: Tab.LIFESTYLE, icon: Gem, label: 'Лакшери' }, // Properties
    { id: Tab.PROFILE, icon: User, label: 'Профиль' }, // Career, Manual
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center px-4">
      <div className="glass-panel rounded-[2rem] h-[76px] flex items-center justify-between px-2 pointer-events-auto w-full max-w-[380px] shadow-xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(isActive ? Tab.CLICKER : item.id)}
              className="relative flex-1 h-full flex flex-col items-center justify-center group"
            >
              <div className={`
                relative p-3 rounded-2xl transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)
                ${isActive 
                    ? 'bg-surfaceHighlight text-primary translate-y-[-10px] shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300 active:scale-95'
                }
              `}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Active Indicator */}
                {isActive && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_currentColor]" />
                )}
              </div>
              {!isActive && <span className="text-[10px] font-bold mt-1 text-slate-600 group-hover:text-slate-400 transition-colors">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
