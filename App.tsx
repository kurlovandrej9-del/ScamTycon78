import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameState, INITIAL_STATE, Tab, UpgradeItem, UpgradeType, GameEvent, PropertyItem, BusinessStage } from './types';
import { MARKET_ITEMS, CAREER_LADDER, OFFICE_CAPACITY, WORKER_HIRE_COST_BASE, CREATE_TEAM_COST, SKIP_TO_OFFICE_COST, CONVERT_TO_OFFICE_COST, OPEN_NEW_BRANCH_COST, PROPERTIES, RANDOM_EVENTS } from './constants';
import { formatMoney, calculateUpgradeCost } from './utils/format';
import { ClickerCircle } from './components/ClickerCircle';
import { Navigation } from './components/Navigation';
import { BottomSheet } from './components/BottomSheet';
import { 
  Award, Users, Server, Briefcase, Building2, Zap, Smartphone, 
  Monitor, Star, Skull, TrendingUp, AlertTriangle, Shield, Bot, 
  Globe, Cpu, MousePointer, Wallet, Target, ShoppingBag, Plane, Ship, LandPlot, Trophy
} from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('scamTycoonSaveV12'); 
    return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CLICKER);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: string }[]>([]);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  
  // Local UI State
  const [marketSubTab, setMarketSubTab] = useState<'TOOLS' | 'SOFT' | 'TRAFFIC'>('TOOLS');
  const [manageSubTab, setManageSubTab] = useState<'CAREER' | 'BUSINESS'>('CAREER');

  // --- DERIVED STATE ---
  const currentJob = useMemo(() => 
    CAREER_LADDER.find(j => j.id === gameState.currentJobId) || CAREER_LADDER[0], 
    [gameState.currentJobId]
  );
  
  const nextJob = useMemo(() => {
    const idx = CAREER_LADDER.findIndex(j => j.id === gameState.currentJobId);
    return CAREER_LADDER[idx + 1] || null;
  }, [gameState.currentJobId]);

  const currentOfficeSpace = useMemo(() => 
    OFFICE_CAPACITY.find(o => o.level === gameState.officeLevel) || OFFICE_CAPACITY[0],
    [gameState.officeLevel]
  );

  // --- REVENUE LOGIC ---
  const rentalClickBuff = useMemo(() => {
    let buff = 0;
    MARKET_ITEMS.forEach(u => {
      if (u.type === UpgradeType.RENTAL) {
        const level = gameState.upgrades[u.id] || 0;
        buff += u.baseProfit * level;
      }
    });
    return buff;
  }, [gameState.upgrades]);

  const trafficMultiplier = useMemo(() => {
    let multiplier = 1.0;
    MARKET_ITEMS.forEach(t => {
      if (t.type === UpgradeType.TRAFFIC) {
        const level = gameState.upgrades[t.id] || 0;
        multiplier += t.baseProfit * level;
      }
    });
    return multiplier;
  }, [gameState.upgrades]);

  const businessRevenue = useMemo(() => {
    if (!gameState.hasBusiness) return 0;
    let basePotentialPerWorker = 0;
    MARKET_ITEMS.forEach(u => {
      if (u.type === UpgradeType.SOFTWARE) {
        const level = gameState.upgrades[u.id] || 0;
        basePotentialPerWorker += u.baseProfit * level;
      }
    });
    if (basePotentialPerWorker === 0) return 0;
    // Salary impact calculation
    const generated = basePotentialPerWorker * gameState.workers * gameState.officeBranches * (gameState.workerSalaryRate * 2.5);
    const cost = generated * gameState.workerSalaryRate;
    return generated - cost;
  }, [gameState.hasBusiness, gameState.workers, gameState.officeBranches, gameState.upgrades, gameState.workerSalaryRate]);

  const effectivePassiveIncome = useMemo(() => {
    const jobPassive = currentJob.isManager ? currentJob.passiveIncome : 0;
    return (jobPassive + businessRevenue) * trafficMultiplier;
  }, [currentJob, businessRevenue, trafficMultiplier]);

  const currentClickValue = useMemo(() => {
    const base = gameState.clickValue + rentalClickBuff;
    const salary = currentJob.salaryPerClick;
    return Math.floor((base + salary) * trafficMultiplier);
  }, [gameState.clickValue, rentalClickBuff, currentJob, trafficMultiplier]);

  const passiveReputation = useMemo(() => {
    let repPerSec = 0;
    PROPERTIES.forEach(p => {
      const count = gameState.properties?.[p.id] || 0;
      repPerSec += count * p.reputationBonus;
    });
    return repPerSec;
  }, [gameState.properties]);

  const hasSoftware = useMemo(() => {
    return MARKET_ITEMS.some(u => u.type === UpgradeType.SOFTWARE && (gameState.upgrades[u.id] || 0) > 0);
  }, [gameState.upgrades]);

  // Risk / Wanted Level Logic
  const wantedLevel = useMemo(() => {
    if (effectivePassiveIncome > 1_000_000) return 5;
    if (effectivePassiveIncome > 100_000) return 4;
    if (effectivePassiveIncome > 10_000) return 3;
    if (effectivePassiveIncome > 1_000) return 2;
    if (effectivePassiveIncome > 0) return 1;
    return 0;
  }, [effectivePassiveIncome]);

  // --- PERSISTENCE & OFFLINE LOGIC ---

  // Ref to hold current state for event listeners to avoid stale closures
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Save System
  useEffect(() => {
    const handleSave = () => {
      const stateToSave = { ...gameStateRef.current, lastSaveTime: Date.now() };
      localStorage.setItem('scamTycoonSaveV12', JSON.stringify(stateToSave));
    };

    // Auto-save interval
    const interval = setInterval(handleSave, 5000);

    // Save on visibility change (mobile app switch) and unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSave();
      }
    };

    window.addEventListener('beforeunload', handleSave);
    window.addEventListener('pagehide', handleSave); // Better for mobile iOS
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleSave);
      window.removeEventListener('pagehide', handleSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Offline Earnings Check (Run once on mount)
  useEffect(() => {
    if (gameState.lastSaveTime && gameState.profitPerSecond > 0) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - gameState.lastSaveTime) / 1000);
      if (diffSeconds > 60) {
        const earnings = Math.floor(gameState.profitPerSecond * diffSeconds);
        const offlineRep = Math.floor(passiveReputation * diffSeconds);
        if (earnings > 0 || offlineRep > 0) {
          setOfflineEarnings(earnings);
          setGameState(prev => ({
            ...prev,
            balance: prev.balance + earnings,
            lifetimeEarnings: prev.lifetimeEarnings + earnings,
            reputation: prev.reputation + offlineRep
          }));
        }
      }
    }
  }, []); 

  // Game Loop (Delta Time based for background throttling support)
  useEffect(() => {
    let lastTime = Date.now();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      // Only process if time has passed (prevents processing on 0 delta)
      // Delta time handles browser throttling (e.g. if tab sleeps 1 min, delta is 60)
      if (deltaSeconds > 0) {
        setGameState(prev => ({
          ...prev,
          balance: prev.balance + (effectivePassiveIncome * deltaSeconds),
          lifetimeEarnings: prev.lifetimeEarnings + (effectivePassiveIncome * deltaSeconds),
          reputation: prev.reputation + (passiveReputation * deltaSeconds),
          profitPerSecond: effectivePassiveIncome,
          trafficMultiplier
        }));
      }
    }, 1000); // 1 tick per second target

    return () => clearInterval(interval);
  }, [effectivePassiveIncome, trafficMultiplier, passiveReputation]);


  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.balance > 5000 && Math.random() < 0.15) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setActiveEvent(event);
        setGameState(prev => {
          let change = 0;
          if (event.type === 'BAD' && event.effectValue < 0 && event.effectValue > -1) {
            change = Math.floor(prev.balance * event.effectValue);
          } else {
             change = Math.floor(event.effectValue * trafficMultiplier);
          }
          return { ...prev, balance: Math.max(0, prev.balance + change) };
        });
        setTimeout(() => setActiveEvent(null), 5000);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [gameState.balance, trafficMultiplier]);


  // --- ACTIONS ---

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // Add jitter
    const jitterX = (Math.random() - 0.5) * 50;
    const jitterY = (Math.random() - 0.5) * 50;
    
    const id = Date.now();
    setClicks(prev => [...prev, { 
      id, 
      x: clientX + jitterX, 
      y: clientY + jitterY, 
      val: `+$${formatMoney(currentClickValue)}` 
    }]);
    
    setTimeout(() => setClicks(prev => prev.filter(c => c.id !== id)), 800);
    setGameState(prev => ({
      ...prev,
      balance: prev.balance + currentClickValue,
      lifetimeEarnings: prev.lifetimeEarnings + currentClickValue,
      reputation: prev.reputation + 1
    }));
  };

  const buyUpgrade = (upgrade: UpgradeItem) => {
    const currentLevel = gameState.upgrades[upgrade.id] || 0;
    if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) return;
    const cost = calculateUpgradeCost(upgrade.baseCost, currentLevel);
    if (gameState.balance >= cost) {
      setGameState(prev => ({
        ...prev,
        balance: prev.balance - cost,
        upgrades: { ...prev.upgrades, [upgrade.id]: currentLevel + 1 }
      }));
    }
  };

  const buyProperty = (item: PropertyItem) => {
    const currentCount = gameState.properties?.[item.id] || 0;
    const cost = calculateUpgradeCost(item.baseCost, currentCount);
    if (gameState.balance >= cost) {
      setGameState(prev => ({
        ...prev,
        balance: prev.balance - cost,
        properties: { ...prev.properties, [item.id]: currentCount + 1 }
      }));
    }
  };

  const promote = (jobId: string) => {
    const targetJob = CAREER_LADDER.find(j => j.id === jobId);
    if (!targetJob) return;
    if (gameState.balance >= targetJob.costToPromote && gameState.reputation >= targetJob.requiredReputation) {
      setGameState(prev => ({
        ...prev,
        balance: prev.balance - targetJob.costToPromote,
        currentJobId: jobId
      }));
    }
  };

  const actionWrapper = (cost: number, action: () => void) => {
     if (gameState.balance >= cost) {
       action();
     }
  };

  // --- HELPERS ---
  const getSoftTier = (u: UpgradeItem, level: number) => {
    if (!u.tierNames) return '';
    if (level === 0) return 'Не куплено';
    if (level < 10) return u.tierNames[0];
    if (level < 20) return u.tierNames[1];
    return u.tierNames[2];
  };

  const getMarketIcon = (id: string) => {
     if (id.includes('proxy')) return <Shield size={18} />;
     if (id.includes('spam')) return <Monitor size={18} />;
     if (id.includes('sms')) return <Smartphone size={18} />;
     if (id.includes('parser')) return <Bot size={18} />;
     if (id.includes('cloaka')) return <Globe size={18} />;
     
     if (id.includes('dating')) return <Users size={24} />;
     if (id.includes('escort')) return <Award size={24} />;
     if (id.includes('shop')) return <Target size={24} />;
     if (id.includes('crypto')) return <Cpu size={24} />;
     
     if (id.includes('google')) return <Globe size={18} />;
     if (id.includes('fb')) return <Users size={18} />;
     return <Zap size={18} />;
  }

  const getPropertyIcon = (id: string, img: string) => {
    switch (id) {
        case 'prop_gucci': return <ShoppingBag size={32} className="text-pink-500" />;
        case 'prop_tesla': return <Zap size={32} className="text-blue-500" />;
        case 'prop_heli': return <Plane size={32} className="text-slate-600" />;
        case 'prop_yacht': return <Ship size={32} className="text-blue-400" />;
        case 'prop_island': return <LandPlot size={32} className="text-green-500" />;
        case 'prop_club': return <Trophy size={32} className="text-yellow-500" />;
        default: return <span className="text-4xl">{img}</span>;
    }
  }

  const renderStars = (count: number) => (
    <div className="flex space-x-0.5">
      {[1,2,3,4,5].map(i => (
        <Star 
          key={i} 
          size={14} 
          fill={i <= count ? '#F59E0B' : 'none'} 
          className={i <= count ? 'text-yellow-500 animate-pulse drop-shadow-sm' : 'text-gray-300'} 
        />
      ))}
    </div>
  );

  // --- SUB-RENDERERS ---

  const renderMarket = () => (
    <div className="animate-fade-in">
      <div className="flex bg-slate-200 p-1 rounded-2xl mb-6">
        {[
          { id: 'TOOLS', label: 'ИНСТРУМЕНТЫ' },
          { id: 'SOFT', label: 'БОТЫ' },
          { id: 'TRAFFIC', label: 'ТРАФИК' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMarketSubTab(tab.id as any)}
            className={`flex-1 py-3 rounded-xl text-[11px] font-black tracking-wider transition-all ${marketSubTab === tab.id ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {marketSubTab === 'TOOLS' && MARKET_ITEMS.filter(u => u.type === UpgradeType.RENTAL).map(u => {
           const level = gameState.upgrades[u.id] || 0;
           const cost = calculateUpgradeCost(u.baseCost, level);
           const canBuy = gameState.balance >= cost;
           return (
             <div key={u.id} className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100 relative overflow-hidden group">
               {canBuy && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-ping m-3" />}
               <div className="flex items-center gap-4 flex-1 z-10">
                 <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                    {getMarketIcon(u.id)}
                 </div>
                 <div>
                    <div className="text-slate-800 font-black text-sm uppercase">{u.name}</div>
                    <div className="text-xs text-slate-500 mb-1">{u.description}</div>
                 </div>
               </div>
               <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`z-10 px-4 py-3 rounded-xl text-xs font-black font-mono transition-all transform active:scale-95 ${canBuy ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-400'}`}>
                 ${formatMoney(cost)}
               </button>
             </div>
           );
        })}

        {marketSubTab === 'SOFT' && MARKET_ITEMS.filter(u => u.type === UpgradeType.SOFTWARE).map(u => {
           const level = gameState.upgrades[u.id] || 0;
           const cost = calculateUpgradeCost(u.baseCost, level);
           const canBuy = gameState.balance >= cost;
           return (
             <div key={u.id} className="relative bg-white p-5 rounded-3xl border border-slate-100 group shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                        {getMarketIcon(u.id)}
                    </div>
                    <div>
                        <div className="text-slate-800 font-black text-sm uppercase">{u.name}</div>
                        <div className="text-xs text-slate-400 font-bold mt-0.5">{getSoftTier(u, level)} (ур.{level})</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Доход</div>
                    <div className="text-sm font-mono font-black text-green-500">+${u.baseProfit * (level || 1)}</div>
                  </div>
                </div>
                
                <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 ${canBuy ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                  Купить ${formatMoney(cost)}
                </button>
             </div>
           );
        })}

        {marketSubTab === 'TRAFFIC' && MARKET_ITEMS.filter(u => u.type === UpgradeType.TRAFFIC).map(u => {
           const level = gameState.upgrades[u.id] || 0;
           const cost = calculateUpgradeCost(u.baseCost, level);
           const canBuy = gameState.balance >= cost;
           return (
             <div key={u.id} className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100">
               <div className="flex items-center gap-4 flex-1">
                 <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
                    {getMarketIcon(u.id)}
                 </div>
                 <div>
                    <div className="text-slate-800 font-black text-sm">{u.name}</div>
                    <div className="text-xs text-purple-500 font-bold mt-1">+{u.baseProfit * 100}% К профиту</div>
                 </div>
               </div>
               <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`px-4 py-3 rounded-xl text-xs font-black font-mono transition-transform active:scale-95 ${canBuy ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-slate-200 text-slate-400'}`}>
                 ${formatMoney(cost)}
               </button>
             </div>
           );
        })}
      </div>
    </div>
  );

  const renderManagement = () => (
    <div className="animate-fade-in">
       <div className="flex bg-slate-200 p-1 rounded-2xl mb-6">
        <button onClick={() => setManageSubTab('CAREER')} className={`flex-1 py-3 rounded-xl text-[11px] font-black tracking-wider transition-all ${manageSubTab === 'CAREER' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>КАРЬЕРА</button>
        <button onClick={() => setManageSubTab('BUSINESS')} className={`flex-1 py-3 rounded-xl text-[11px] font-black tracking-wider transition-all ${manageSubTab === 'BUSINESS' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>СИНДИКАТ</button>
      </div>

      {manageSubTab === 'CAREER' && (
        <div className="space-y-4">
           {CAREER_LADDER.map((job, idx) => {
             const currentIdx = CAREER_LADDER.findIndex(j => j.id === gameState.currentJobId);
             if (idx < currentIdx) return null; 
             const isNext = idx === currentIdx + 1;
             if (!isNext && idx !== currentIdx) return null; 

             if (idx === currentIdx) {
                return (
                  <div key={job.id} className="bg-slate-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Briefcase size={80}/></div>
                    <div className="text-slate-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Текущий статус</div>
                    <div className="text-3xl font-black mb-1">{job.title}</div>
                    <div className="text-sm text-purple-400 font-bold mb-6 bg-white/10 w-fit px-3 py-1 rounded-full">{job.vertical}</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 p-3 rounded-2xl text-center backdrop-blur-sm">
                            <div className="text-[10px] text-slate-300 font-bold uppercase">За клик</div>
                            <div className="text-white font-mono font-bold text-lg">+${job.salaryPerClick}</div>
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl text-center backdrop-blur-sm">
                            <div className="text-[10px] text-slate-300 font-bold uppercase">Пассив</div>
                            <div className="text-green-400 font-mono font-bold text-lg">+${job.passiveIncome}</div>
                        </div>
                    </div>
                  </div>
                )
             }

             const hasRep = gameState.reputation >= job.requiredReputation;
             const hasMoney = gameState.balance >= job.costToPromote;
             let businessReqMet = true;
             
             if (job.reqBusinessStage === BusinessStage.REMOTE_TEAM) businessReqMet = gameState.businessStage !== BusinessStage.NONE;
             else if (job.reqBusinessStage === BusinessStage.OFFICE) businessReqMet = gameState.businessStage === BusinessStage.OFFICE || gameState.businessStage === BusinessStage.NETWORK;
             else if (job.reqBusinessStage === BusinessStage.NETWORK) businessReqMet = gameState.businessStage === BusinessStage.NETWORK;

             const canPromote = hasRep && hasMoney && businessReqMet;

             return (
               <div key={job.id} className="p-5 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-lg text-slate-700">{job.title}</span>
                    <div className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] text-slate-500 font-bold uppercase">ЗАКРЫТО 🔒</div>
                  </div>
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl">
                    <div className={`flex justify-between text-xs font-bold ${hasRep ? "text-green-600" : "text-red-500"}`}>
                        <span>Нужна репутация:</span> <span>{job.requiredReputation} 💎</span>
                    </div>
                    <div className={`flex justify-between text-xs font-bold ${hasMoney ? "text-green-600" : "text-red-500"}`}>
                        <span>Стоимость:</span> <span>${formatMoney(job.costToPromote)}</span>
                    </div>
                    {job.reqBusinessStage !== BusinessStage.NONE && (
                        <div className={`flex justify-between text-xs font-bold ${businessReqMet ? "text-green-600" : "text-red-500"}`}>
                            <span>Офис:</span> <span>Нужен</span>
                        </div>
                    )}
                  </div>
                  <button disabled={!canPromote} onClick={() => promote(job.id)} className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all transform active:scale-95 ${canPromote ? 'bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                    Повышение ⬆️
                  </button>
               </div>
             )
           })}
        </div>
      )}

      {manageSubTab === 'BUSINESS' && (
        <div className="space-y-6">
           {!gameState.hasBusiness ? (
             <div className="flex flex-col gap-4">
               {/* Option 1: Remote Team */}
               <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Удаленная Тима</h3>
                        <p className="text-xs text-slate-500 font-medium">Для новичков. Нанимай воркеров онлайн.</p>
                    </div>
                  </div>
                  <button onClick={() => {
                       setGameState(prev => ({
                          ...prev, balance: prev.balance - CREATE_TEAM_COST,
                          hasBusiness: true, businessStage: BusinessStage.REMOTE_TEAM,
                          workers: 0, officeLevel: 1, officeBranches: 1
                      }));
                  }} disabled={!hasSoftware || gameState.balance < CREATE_TEAM_COST} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transform transition-transform active:scale-95 ${!hasSoftware || gameState.balance < CREATE_TEAM_COST ? 'bg-slate-200 text-slate-400' : 'bg-blue-500 text-white shadow-lg shadow-blue-200'}`}>
                    Создать (${formatMoney(CREATE_TEAM_COST)})
                  </button>
               </div>

               {/* Option 2: Instant Office */}
               <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                  
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">Реальный Офис</h3>
                        <p className="text-xs text-slate-300 font-medium">Сразу в дамки. Пропускаем этап "мамкиного бизнесмена".</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 text-xs font-mono text-slate-400 bg-black/20 p-2 rounded-lg">
                    ⚠️ Требует x10 больше вложений, но открывает доступ к топ позициям сразу.
                  </div>

                  <button onClick={() => {
                       setGameState(prev => ({
                          ...prev, balance: prev.balance - SKIP_TO_OFFICE_COST,
                          hasBusiness: true, businessStage: BusinessStage.OFFICE,
                          workers: 0, officeLevel: 2, officeBranches: 1
                      }));
                  }} disabled={!hasSoftware || gameState.balance < SKIP_TO_OFFICE_COST} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transform transition-transform active:scale-95 border-2 border-yellow-500/50 ${!hasSoftware || gameState.balance < SKIP_TO_OFFICE_COST ? 'bg-slate-700 text-slate-500' : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400'}`}>
                    Открыть (${formatMoney(SKIP_TO_OFFICE_COST)})
                  </button>
               </div>
             </div>
           ) : (
             <>
               <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 relative overflow-hidden">
                 
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Штаб-квартира</div>
                            <div className="text-xl font-black text-slate-800">{currentOfficeSpace.name}</div>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Building2 size={24} />
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-2 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <div className="text-4xl font-black text-green-500 font-mono tracking-tighter">
                            ${formatMoney(businessRevenue)}
                         </div>
                         <div className="text-xs text-slate-400 mb-2 font-bold uppercase">/ сек чистыми</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Зарплата воркерам</span>
                            <span className="text-xs font-mono font-black text-slate-800">{(gameState.workerSalaryRate * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="0.9" step="0.1" 
                            value={gameState.workerSalaryRate} 
                            onChange={(e) => setGameState(prev => ({...prev, workerSalaryRate: parseFloat(e.target.value)}))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
                        />
                        <div className="text-[10px] text-slate-500 text-center font-medium">Выше зарплата = Выше эффективность (<span className="text-green-600 font-bold">x{(gameState.workerSalaryRate * 2.5).toFixed(1)}</span>)</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Воркеры</div>
                            <div className="text-xl text-slate-800 font-black">{gameState.workers} <span className="text-slate-400 text-xs font-medium">/ {currentOfficeSpace.maxWorkers * gameState.officeBranches}</span></div>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Филиалы</div>
                            <div className="text-xl text-slate-800 font-black">{gameState.officeBranches}</div>
                         </div>
                    </div>

                    <button onClick={() => setGameState(prev => ({ ...prev, balance: prev.balance - calculateUpgradeCost(WORKER_HIRE_COST_BASE, gameState.workers), workers: prev.workers + 1 }))} 
                        disabled={gameState.workers >= currentOfficeSpace.maxWorkers * gameState.officeBranches || gameState.balance < calculateUpgradeCost(WORKER_HIRE_COST_BASE, gameState.workers)}
                        className="w-full py-4 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-slate-300">
                        Нанять воркера 👤 (+${formatMoney(calculateUpgradeCost(WORKER_HIRE_COST_BASE, gameState.workers))})
                    </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 gap-3">
                 {gameState.businessStage === BusinessStage.REMOTE_TEAM && (
                    <button onClick={() => actionWrapper(CONVERT_TO_OFFICE_COST, () => setGameState(prev => ({...prev, balance: prev.balance - CONVERT_TO_OFFICE_COST, businessStage: BusinessStage.OFFICE, officeLevel: 2})))} disabled={gameState.balance < CONVERT_TO_OFFICE_COST} 
                        className="p-5 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-center">
                        <div className="text-xs font-black text-yellow-600 uppercase mb-1">Арендовать реальный офис</div>
                        <div className="text-lg font-mono font-bold text-yellow-800">${formatMoney(CONVERT_TO_OFFICE_COST)}</div>
                    </button>
                 )}
                 {gameState.businessStage !== BusinessStage.REMOTE_TEAM && (
                    <button onClick={() => actionWrapper(OPEN_NEW_BRANCH_COST, () => setGameState(prev => ({...prev, balance: prev.balance - OPEN_NEW_BRANCH_COST, businessStage: BusinessStage.NETWORK, officeBranches: prev.officeBranches + 1})))} disabled={gameState.balance < OPEN_NEW_BRANCH_COST} 
                        className="p-5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-center">
                        <div className="text-xs font-black text-indigo-600 uppercase mb-1">Открыть новый филиал</div>
                        <div className="text-lg font-mono font-bold text-indigo-800">${formatMoney(OPEN_NEW_BRANCH_COST)}</div>
                    </button>
                 )}
               </div>
             </>
           )}
        </div>
      )}
    </div>
  );

  const renderLifestyle = () => (
    <div className="grid grid-cols-2 gap-3 animate-fade-in">
      {PROPERTIES.map(p => {
        const count = gameState.properties?.[p.id] || 0;
        const cost = calculateUpgradeCost(p.baseCost, count);
        const canBuy = gameState.balance >= cost;
        return (
          <button key={p.id} onClick={() => buyProperty(p)} disabled={!canBuy} className={`relative overflow-hidden p-4 rounded-3xl flex flex-col items-center text-center border-2 transition-all transform active:scale-95 ${canBuy ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-100 border-transparent opacity-60'}`}>
            <div className="text-slate-800 mb-3 drop-shadow-sm transform hover:scale-110 transition-transform duration-200">
                {getPropertyIcon(p.id, p.image)}
            </div>
            <div className="text-xs font-black text-slate-800 uppercase tracking-wide leading-tight mb-1">{p.name}</div>
            <div className="text-[10px] text-yellow-600 font-bold mb-3">+{p.reputationBonus} РЕП/с</div>
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black ${canBuy ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                ${formatMoney(cost)}
            </div>
            {count > 0 && <div className="absolute top-2 right-2 text-[10px] font-black bg-purple-500 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white">{count}</div>}
          </button>
        )
      })}
    </div>
  );

  return (
    <div className="relative w-full h-screen flex flex-col items-center overflow-hidden font-sans mesh-bg">
      
      {/* EVENT POPUP */}
      {activeEvent && (
        <div className="absolute top-24 z-50 w-[90%] bg-white border-l-8 border-l-purple-500 p-5 rounded-r-2xl animate-slide-in shadow-2xl flex items-center gap-4">
             <div className="text-3xl">{activeEvent.type === 'GOOD' ? '🤑' : '👮‍♂️'}</div>
             <div>
                <div className="text-sm font-black text-slate-800 uppercase">{activeEvent.title}</div>
                <div className="text-xs text-slate-500 font-medium">{activeEvent.message}</div>
                <div className={`text-sm font-mono font-black mt-1 ${activeEvent.type === 'GOOD' ? 'text-green-500' : 'text-red-500'}`}>
                    {activeEvent.type === 'GOOD' ? '+' : ''}{activeEvent.effectValue > 0 ? formatMoney(activeEvent.effectValue) : (activeEvent.effectValue * 100).toFixed(0) + '%'}
                </div>
            </div>
        </div>
      )}

      {/* OFFLINE MODAL */}
      {offlineEarnings !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] text-center shadow-2xl border-4 border-white transform scale-100">
             <div className="text-6xl mb-6 animate-bounce">💰</div>
             <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-wide">Пока ты спал</h2>
             <p className="text-sm text-slate-500 mb-8 font-medium">Твои боты продолжали работать и принесли тебе кучу денег!</p>
             <div className="text-5xl font-black text-green-500 mb-8 font-mono tracking-tighter">+${formatMoney(offlineEarnings)}</div>
             <button onClick={() => setOfflineEarnings(null)} className="w-full py-4 bg-green-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95">Забрать кэш</button>
           </div>
        </div>
      )}

      {/* --- DASHBOARD WIDGET --- */}
      <div className="w-full px-6 pt-10 pb-2 z-20 flex flex-col gap-3">
         {/* Top Row: Status & Wanted Level */}
         <div className="flex justify-between items-end px-1">
            <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Статус</div>
                <div className="text-xl font-black text-slate-700 leading-none drop-shadow-sm">{currentJob.title}</div>
            </div>
            <div className="flex flex-col items-end gap-1 pb-1">
               {renderStars(wantedLevel)}
            </div>
         </div>

         {/* Bottom Row: Stats Pills (Split) */}
         <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/50 flex items-center gap-3 shadow-sm">
                 <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <MousePointer size={14} />
                 </div>
                 <div>
                     <div className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-0.5">За клик</div>
                     <div className="text-sm font-black text-slate-700 leading-none">+${formatMoney(currentClickValue)}</div>
                 </div>
             </div>
             
             <div className="bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/50 flex items-center gap-3 shadow-sm">
                 <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Wallet size={14} />
                 </div>
                 <div>
                     <div className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-0.5">В секунду</div>
                     <div className="text-sm font-black text-slate-700 leading-none">+${formatMoney(effectivePassiveIncome)}</div>
                 </div>
             </div>
         </div>
      </div>

      {/* MAIN BALANCE AREA */}
      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 -mt-6">
        <div className="text-center mb-4 relative">
            <div className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase mb-2">Твой Баланс</div>
            <div className="text-6xl sm:text-7xl font-black text-slate-800 drop-shadow-sm font-mono tracking-tighter flex items-center justify-center gap-2">
                {formatMoney(gameState.balance)}
            </div>
             <div className="flex justify-center gap-3 mt-4">
               <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1.5 shadow-sm border border-yellow-200">
                 <Award size={14} className="text-yellow-600"/>
                 <span className="text-[11px] font-bold">{Math.floor(gameState.reputation)} Реп</span>
               </div>
               {trafficMultiplier > 1 && (
                 <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1.5 shadow-sm border border-orange-200">
                   <TrendingUp size={14} className="text-orange-600"/>
                   <span className="text-[11px] font-bold">x{trafficMultiplier.toFixed(1)} Буст</span>
                 </div>
               )}
            </div>
        </div>

        {/* CLICKER INTERFACE */}
        <div className="w-full max-w-[400px] aspect-square relative flex items-center justify-center">
            <ClickerCircle onClick={handleClick} clickValue={currentClickValue} />
            
            {/* Click Particles */}
            {clicks.map(c => (
              <div key={c.id} className="float-text text-4xl font-black text-green-500 pointer-events-none flex items-center gap-1" style={{left: c.x, top: c.y}}>
                 {c.val}
              </div>
            ))}
        </div>
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* BOTTOM SHEETS */}
      <BottomSheet isOpen={activeTab === Tab.MARKET} onClose={() => setActiveTab(Tab.CLICKER)} title="Черный Рынок">
        {renderMarket()}
      </BottomSheet>
      
      <BottomSheet isOpen={activeTab === Tab.MANAGEMENT} onClose={() => setActiveTab(Tab.CLICKER)} title="Синдикат">
        {renderManagement()}
      </BottomSheet>

      <BottomSheet isOpen={activeTab === Tab.LIFESTYLE} onClose={() => setActiveTab(Tab.CLICKER)} title="Роскошь">
        {renderLifestyle()}
      </BottomSheet>

    </div>
  );
};

export default App;