import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameState, INITIAL_STATE, Tab, UpgradeItem, UpgradeType, GameEvent, PropertyItem, BusinessStage, LaunderingItem, TeamStrategy, AssetItem, VerticalType, SchemeItem, ActiveScheme, SchemeCategory } from './types';
import { MARKET_ITEMS, CAREER_LADDER, OFFICE_CAPACITY, WORKER_HIRE_COST_BASE, CREATE_TEAM_COST, SKIP_TO_OFFICE_COST, CONVERT_TO_OFFICE_COST, OPEN_NEW_BRANCH_COST, PROPERTIES, RANDOM_EVENTS, LAUNDERING_ITEMS, TEAM_STRATEGIES, BASE_BANK_LIMIT, ASSETS, CHARACTER_STAGES, SCHEMES_LIST } from './constants';
import { formatMoney, calculateUpgradeCost } from './utils/format';
import { ClickerCircle } from './components/ClickerCircle';
import { Navigation } from './components/Navigation';
import { BottomSheet } from './components/BottomSheet';
import { MiniGameModal } from './components/MiniGameModal';
import { 
  Award, Users, Briefcase, Building2, Zap, Smartphone, 
  Monitor, Globe, Cpu, MousePointer, Target, Lock, RefreshCw, BriefcaseBusiness, Info, AlertTriangle, Activity, Settings, User, Battery, Wallet, BarChart2, Gamepad2, Skull, FlaskConical, Flame, Hammer, Crosshair, Timer, HelpCircle, ArrowUpRight, Landmark, ShoppingBag
} from 'lucide-react';

// --- CENTRALIZED GAME LOGIC ---
const calculateDerivedStats = (state: GameState) => {
    // 1. Current Job
    const currentJob = CAREER_LADDER.find(j => j.id === state.currentJobId) || CAREER_LADDER[0];

    // 2. Bank Limit
    let bankLimit = BASE_BANK_LIMIT;
    LAUNDERING_ITEMS.forEach(item => {
        const level = state.launderingUpgrades[item.id] || 0;
        bankLimit += level * item.baseLimit;
    });

    // 3. Multipliers (Traffic & Tools)
    let trafficMultiplier = 1.0;
    let clickRentalBuff = 0;
    let basePotentialPerWorker = 0;
    let hasSoftware = false;
    let blackMarketPassive = 0;

    MARKET_ITEMS.forEach(u => {
        const level = state.upgrades[u.id] || 0;
        if (level > 0) {
            if (u.type === UpgradeType.TRAFFIC) trafficMultiplier += u.baseProfit * level;
            if (u.type === UpgradeType.RENTAL) clickRentalBuff += u.baseProfit * level;
            if (u.type === UpgradeType.SOFTWARE) {
                basePotentialPerWorker += u.baseProfit * level;
                hasSoftware = true;
            }
            if (u.type === UpgradeType.BLACK_MARKET) {
                blackMarketPassive += u.baseProfit * level;
            }
        }
    });

    // 4. Scam Income (Business)
    let scamIncome = 0;
    if (state.hasBusiness) {
        const strategyMult = TEAM_STRATEGIES[state.teamStrategy]?.multiplier || 1;
        const totalWorkers = state.workers * state.officeBranches;
        
        // Critical Logic: Workers need Software to produce anything
        if (hasSoftware) {
            const rawYield = basePotentialPerWorker * totalWorkers;
            const efficiency = state.workerSalaryRate * 2.5; 
            const gross = rawYield * efficiency * strategyMult;
            const salaryCost = rawYield * state.workerSalaryRate;
            // Traffic multiplier applies to business income
            scamIncome = Math.max(0, (gross - salaryCost) * trafficMultiplier);
        }
    }

    // 5. Clean Income (Laundering)
    let cleanIncome = 0;
    LAUNDERING_ITEMS.forEach(item => {
        const level = state.launderingUpgrades[item.id] || 0;
        cleanIncome += level * item.baseIncome;
    });

    // 6. Total Passive Income
    const jobPassive = currentJob.isManager ? currentJob.passiveIncome : 0;
    
    // Black market adds to total, usually separate from traffic multipliers unless specified
    const totalPassiveIncome = scamIncome + cleanIncome + jobPassive + (blackMarketPassive * trafficMultiplier);

    // 7. Click Value
    const baseClick = state.clickValue + clickRentalBuff;
    const salaryClick = currentJob.salaryPerClick;
    const currentClickValue = Math.floor((baseClick + salaryClick) * trafficMultiplier);

    // 8. Reputation & Risk
    let passiveReputation = 0;
    PROPERTIES.forEach(p => {
        const count = state.properties?.[p.id] || 0;
        passiveReputation += count * p.reputationBonus;
    });

    const strategyRisk = TEAM_STRATEGIES[state.teamStrategy]?.risk || 0;
    let riskScore = (scamIncome / 1000) + strategyRisk;
    if (blackMarketPassive > 0) riskScore += 50;
    
    const launderingPower = cleanIncome / 500;
    riskScore = Math.max(0, riskScore - launderingPower);
    
    // 9. Portfolio Value
    let portfolioValue = 0;
    ASSETS.forEach(a => {
        const amount = state.ownedAssets[a.id] || 0;
        const price = state.assetPrices[a.id] || a.basePrice;
        portfolioValue += amount * price;
    });

    return {
        currentJob,
        bankLimit,
        trafficMultiplier,
        basePotentialPerWorker,
        hasSoftware,
        scamIncome,
        cleanIncome,
        blackMarketPassive,
        totalPassiveIncome,
        currentClickValue,
        passiveReputation,
        isBankFull: state.balance >= bankLimit,
        portfolioValue
    };
};

// Helper for character image
const getCharacterImageIndex = (jobId: string, balance: number): number => {
  const jobIndex = CAREER_LADDER.findIndex(j => j.id === jobId);
  let stageIndex = jobIndex >= 0 ? jobIndex : 0;

  if (stageIndex === CAREER_LADDER.length - 1) { // CEO
     if (balance > 100_000_000) return 10; // Ultra Rich
     if (balance > 10_000_000) return 9; // Very Rich
     if (balance > 1_000_000) return 8; // Rich
  }
  
  return Math.min(stageIndex, CHARACTER_STAGES.length - 1);
};

const App: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
        const saved = localStorage.getItem('scamTycoonSaveV21_Refactor'); 
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...INITIAL_STATE,
                ...parsed,
                // Fallbacks for array/object structures to prevent crashes on version update
                ownedAssets: parsed.ownedAssets || {},
                assetPrices: parsed.assetPrices || {},
                launderingUpgrades: parsed.launderingUpgrades || {},
                upgrades: parsed.upgrades || {},
                properties: parsed.properties || {},
                activeSchemes: parsed.activeSchemes || []
            };
        }
    } catch (e) {
        console.error("Save file corrupted, resetting", e);
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CLICKER);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: string }[]>([]);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  
  // Mini Game State
  const [activeMiniGame, setActiveMiniGame] = useState<string | null>(null);

  // Local UI State - Redefined for new Structure
  const [businessTab, setBusinessTab] = useState<'TEAM' | 'SOFT' | 'TRAFFIC'>('TEAM');
  const [financeTab, setFinanceTab] = useState<'LAUNDERING' | 'EXCHANGE' | 'TOOLS'>('LAUNDERING');
  const [schemesTab, setSchemesTab] = useState<'ACTIVE' | 'BLACK_MARKET'>('ACTIVE');

  // --- DERIVED STATE ---
  const stats = calculateDerivedStats(gameState);
  const limitPercent = Math.min(100, (gameState.balance / stats.bankLimit) * 100);
  const characterStageIndex = getCharacterImageIndex(gameState.currentJobId, gameState.balance);
  const characterImage = CHARACTER_STAGES[characterStageIndex];

  // --- PERSISTENCE ---
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const handleSave = () => {
      const stateToSave = { ...gameStateRef.current, lastSaveTime: Date.now() };
      localStorage.setItem('scamTycoonSaveV21_Refactor', JSON.stringify(stateToSave));
    };

    const interval = setInterval(handleSave, 5000);
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') handleSave(); };
    window.addEventListener('beforeunload', handleSave);
    window.addEventListener('pagehide', handleSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleSave);
      window.removeEventListener('pagehide', handleSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // --- TRADING LOOP ---
  useEffect(() => {
     setGameState(prev => {
         const newPrices = { ...prev.assetPrices };
         let changed = false;
         ASSETS.forEach(a => {
             if (newPrices[a.id] === undefined) {
                 newPrices[a.id] = a.basePrice;
                 changed = true;
             }
         });
         return changed ? { ...prev, assetPrices: newPrices } : prev;
     });

     const tradeInterval = setInterval(() => {
         setGameState(prev => {
             const newPrices = { ...prev.assetPrices };
             ASSETS.forEach(a => {
                 const current = newPrices[a.id] || a.basePrice;
                 const changePercent = (Math.random() - 0.5) * 2 * a.volatility;
                 let trend = 1;
                 if (Math.random() < 0.05) trend = 1.15; // Pump
                 if (Math.random() < 0.05) trend = 0.85; // Dump
                 let nextPrice = current * (1 + changePercent) * trend;
                 if (nextPrice < 0.01) nextPrice = 0.01;
                 newPrices[a.id] = parseFloat(nextPrice.toFixed(4));
             });
             return { ...prev, assetPrices: newPrices };
         });
     }, 3000); 
     return () => clearInterval(tradeInterval);
  }, []);

  // --- OFFLINE EARNINGS ---
  useEffect(() => {
    if (gameState.lastSaveTime && gameState.profitPerSecond > 0) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - gameState.lastSaveTime) / 1000);
      if (diffSeconds > 60) {
        const s = calculateDerivedStats(gameState);
        const potentialEarnings = Math.floor(s.totalPassiveIncome * diffSeconds);
        const availableSpace = s.bankLimit - gameState.balance;
        const actualEarnings = Math.min(potentialEarnings, availableSpace);
        const offlineRep = Math.floor(s.passiveReputation * diffSeconds);
        if (actualEarnings > 0 || offlineRep > 0) {
          setOfflineEarnings(actualEarnings);
          setGameState(prev => ({
            ...prev,
            balance: prev.balance + actualEarnings,
            lifetimeEarnings: prev.lifetimeEarnings + actualEarnings,
            reputation: prev.reputation + offlineRep
          }));
        }
      }
    }
  }, []); 

  // --- SCHEMES TIMER LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
       setGameState(prev => {
           let changed = false;
           const now = Date.now();
           const updatedSchemes = prev.activeSchemes.map(s => {
               if (!s.isReady && now >= s.endTime) {
                   changed = true;
                   return { ...s, isReady: true };
               }
               return s;
           });
           
           if (!changed) return prev;
           return { ...prev, activeSchemes: updatedSchemes };
       });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- GAME LOOP ---
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      if (deltaSeconds > 0) {
        setGameState(prev => {
          const s = calculateDerivedStats(prev);
          const income = s.totalPassiveIncome * deltaSeconds;
          const potentialBalance = prev.balance + income;
          const actualBalance = Math.min(potentialBalance, s.bankLimit);
          return {
            ...prev,
            balance: actualBalance,
            lifetimeEarnings: prev.lifetimeEarnings + income,
            reputation: prev.reputation + (s.passiveReputation * deltaSeconds),
            profitPerSecond: s.totalPassiveIncome, 
          };
        });
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (stats.isBankFull && navigator.vibrate) navigator.vibrate([50, 50, 50]);
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } 
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    const jitterX = (Math.random() - 0.5) * 80;
    const jitterY = (Math.random() - 0.5) * 80;
    const id = Date.now();
    setClicks(prev => [...prev, { id, x: clientX + jitterX, y: clientY + jitterY, val: stats.isBankFull ? 'ПОЛНО' : `+${formatMoney(stats.currentClickValue)}` }]);
    setTimeout(() => setClicks(prev => prev.filter(c => c.id !== id)), 800);
    
    if (!stats.isBankFull) {
        setGameState(prev => {
            const s = calculateDerivedStats(prev);
            const potential = prev.balance + s.currentClickValue;
            return {
                ...prev,
                balance: Math.min(potential, s.bankLimit),
                lifetimeEarnings: prev.lifetimeEarnings + s.currentClickValue,
                reputation: prev.reputation + 0.1 
            }
        });
    }
  };

  const buyUpgrade = (upgrade: UpgradeItem) => {
    const currentLevel = gameState.upgrades[upgrade.id] || 0;
    if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) return;
    const cost = calculateUpgradeCost(upgrade.baseCost, currentLevel);
    if (gameState.balance >= cost) {
      setGameState(prev => ({ ...prev, balance: prev.balance - cost, upgrades: { ...prev.upgrades, [upgrade.id]: currentLevel + 1 } }));
    }
  };

  const buyProperty = (item: PropertyItem) => {
    const currentCount = gameState.properties?.[item.id] || 0;
    const cost = calculateUpgradeCost(item.baseCost, currentCount);
    if (gameState.balance >= cost) {
      setGameState(prev => ({ ...prev, balance: prev.balance - cost, properties: { ...prev.properties, [item.id]: currentCount + 1 } }));
    }
  };

  const promote = (jobId: string) => {
    const targetJob = CAREER_LADDER.find(j => j.id === jobId);
    if (!targetJob) return;
    if (gameState.balance >= targetJob.costToPromote && gameState.reputation >= targetJob.requiredReputation) {
      setGameState(prev => ({ ...prev, balance: prev.balance - targetJob.costToPromote, currentJobId: jobId }));
    }
  };

  const upgradeLaunderingItem = (item: LaunderingItem) => {
      const currentLevel = gameState.launderingUpgrades[item.id] || 0;
      const cost = calculateUpgradeCost(item.baseCost, currentLevel);
      if (gameState.balance >= cost) {
          setGameState(prev => ({ ...prev, balance: prev.balance - cost, launderingUpgrades: { ...prev.launderingUpgrades, [item.id]: currentLevel + 1 } }));
      }
  }

  const buyAsset = (asset: AssetItem) => {
      const price = gameState.assetPrices[asset.id] || asset.basePrice;
      if (gameState.balance >= price) {
          setGameState(prev => ({
              ...prev,
              balance: prev.balance - price,
              ownedAssets: { ...prev.ownedAssets, [asset.id]: (prev.ownedAssets[asset.id] || 0) + 1 }
          }));
      }
  };

  const sellAsset = (asset: AssetItem) => {
      const owned = gameState.ownedAssets[asset.id] || 0;
      const price = gameState.assetPrices[asset.id] || asset.basePrice;
      if (owned >= 1) {
          setGameState(prev => {
              const s = calculateDerivedStats(prev);
              const potential = prev.balance + price;
              const actual = Math.min(potential, s.bankLimit);
              return {
                  ...prev,
                  balance: actual,
                  ownedAssets: { ...prev.ownedAssets, [asset.id]: prev.ownedAssets[asset.id] - 1 }
              };
          });
      }
  };
  
  const handleMiniGameComplete = (reward: number) => {
      if (reward > 0) {
        setGameState(prev => {
             const s = calculateDerivedStats(prev);
             return {
                 ...prev,
                 balance: Math.min(prev.balance + reward, s.bankLimit * 1.5), 
                 lifetimeEarnings: prev.lifetimeEarnings + reward
             }
        });
      }
      setActiveMiniGame(null);
  };

  // --- SCHEME LOGIC ---
  const startScheme = (scheme: SchemeItem) => {
      if (gameState.balance >= scheme.cost) {
          const newScheme: ActiveScheme = {
              id: Date.now().toString() + Math.random(),
              schemeId: scheme.id,
              startTime: Date.now(),
              endTime: Date.now() + (scheme.durationSeconds * 1000),
              isReady: false
          };
          
          setGameState(prev => ({
              ...prev,
              balance: prev.balance - scheme.cost,
              activeSchemes: [...prev.activeSchemes, newScheme]
          }));
      }
  };

  const claimScheme = (activeScheme: ActiveScheme) => {
      const schemeDef = SCHEMES_LIST.find(s => s.id === activeScheme.schemeId);
      if (!schemeDef) return;

      const isSuccess = Math.random() * 100 > schemeDef.riskPercentage;
      
      if (isSuccess) {
          const profit = Math.floor(Math.random() * (schemeDef.maxProfit - schemeDef.minProfit + 1)) + schemeDef.minProfit;
          
          setGameState(prev => {
               const s = calculateDerivedStats(prev);
               return {
                  ...prev,
                  balance: Math.min(prev.balance + profit, s.bankLimit),
                  lifetimeEarnings: prev.lifetimeEarnings + profit,
                  reputation: prev.reputation + 5,
                  activeSchemes: prev.activeSchemes.filter(s => s.id !== activeScheme.id)
               }
          });
          
          setActiveEvent({ id: 'scheme_win', title: 'Темка Зашла!', message: `Вы подняли кэш на ${schemeDef.name}`, type: 'GOOD', effectValue: profit });
          setTimeout(() => setActiveEvent(null), 3000);

      } else {
          setGameState(prev => ({
              ...prev,
              activeSchemes: prev.activeSchemes.filter(s => s.id !== activeScheme.id)
          }));
           setActiveEvent({ id: 'scheme_loss', title: 'Мамонт Сорвался', message: `Вас кинули на теме ${schemeDef.name}`, type: 'BAD', effectValue: 0 });
           setTimeout(() => setActiveEvent(null), 3000);
      }
  };


  // --- UI COMPONENTS HELPER ---
  const getSoftTier = (u: UpgradeItem, level: number) => {
    if (!u.tierNames) return '';
    if (level === 0) return 'Не куплено';
    if (level < 10) return u.tierNames[0];
    if (level < 20) return u.tierNames[1];
    return u.tierNames[2];
  };

  const getMarketIcon = (id: string, vertical: VerticalType) => {
     if (vertical === VerticalType.DARK) {
         if (id.includes('courier') || id.includes('grow')) return <FlaskConical size={18} />;
         if (id.includes('guns')) return <Crosshair size={18} />;
         if (id.includes('hitman')) return <Skull size={18} />;
         if (id.includes('thugs')) return <Hammer size={18} />;
         return <Flame size={18} />;
     }

     if (id.includes('proxy') || id.includes('vpn')) return <Globe size={18} />;
     if (id.includes('spam')) return <Monitor size={18} />;
     if (id.includes('sms')) return <Smartphone size={18} />;
     if (id.includes('parser') || id.includes('checker')) return <Cpu size={18} />;
     if (id.includes('cloaka')) return <Lock size={18} />;
     if (id.includes('dating')) return <Users size={24} />;
     if (id.includes('escort')) return <Award size={24} />;
     if (id.includes('shop')) return <Target size={24} />;
     if (id.includes('crypto')) return <Cpu size={24} />;
     return <Zap size={18} />;
  }

  // --- TAB RENDERERS ---

  // 1. BUSINESS TAB (Workers, Soft, Traffic)
  const renderBusiness = () => {
    const currentOfficeSpace = OFFICE_CAPACITY.find(o => o.level === gameState.officeLevel) || OFFICE_CAPACITY[0];

    return (
      <div className="animate-fade-in pb-24">
        {/* SUB TABS */}
        <div className="flex bg-surfaceHighlight p-1.5 rounded-2xl mb-6">
            <button onClick={() => setBusinessTab('TEAM')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${businessTab === 'TEAM' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                КОМАНДА
            </button>
            <button onClick={() => setBusinessTab('SOFT')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${businessTab === 'SOFT' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                СОФТ
                {!stats.hasSoftware && gameState.workers > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
            </button>
            <button onClick={() => setBusinessTab('TRAFFIC')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${businessTab === 'TRAFFIC' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                ТРАФИК
            </button>
        </div>

        {/* TEAM SECTION */}
        {businessTab === 'TEAM' && (
            <div className="space-y-6">
                {!gameState.hasBusiness ? (
                    <div className="bg-surface p-6 rounded-3xl text-center border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-surfaceHighlight rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">👨‍💻</div>
                        <h3 className="text-xl font-black text-white mb-2">Старт Бизнеса</h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">Воркеры - это основа пассивного дохода. Создай команду, чтобы начать путь к миллионам. Тебе потребуется софт и трафик для них.</p>
                        
                        <div className="bg-surfaceHighlight p-4 rounded-xl mb-6 text-left">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Требования:</div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                <span className={stats.hasSoftware ? 'text-success' : 'text-red-400'}>{stats.hasSoftware ? '✅' : '❌'} Куплен любой Софт</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                <span className={gameState.balance >= CREATE_TEAM_COST ? 'text-success' : 'text-red-400'}>{gameState.balance >= CREATE_TEAM_COST ? '✅' : '❌'} {formatMoney(CREATE_TEAM_COST)} на счету</span>
                            </div>
                        </div>

                        <button onClick={() => {
                            setGameState(prev => ({
                                ...prev, balance: prev.balance - CREATE_TEAM_COST,
                                hasBusiness: true, businessStage: BusinessStage.REMOTE_TEAM,
                                workers: 0, officeLevel: 1, officeBranches: 1
                            }));
                        }} disabled={!stats.hasSoftware || gameState.balance < CREATE_TEAM_COST} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform ${!stats.hasSoftware || gameState.balance < CREATE_TEAM_COST ? 'bg-surfaceHighlight text-slate-500 cursor-not-allowed' : 'bg-accent text-white shadow-lg shadow-accent/20'}`}>
                            Создать Команду
                        </button>
                    </div>
                ) : (
                    <div className="bg-surface p-6 rounded-3xl relative overflow-hidden">
                        {/* Warnings */}
                        {!stats.hasSoftware && gameState.workers > 0 && (
                            <div className="mb-4 bg-red-500/10 p-3 rounded-2xl flex items-center gap-3 border border-red-500/20">
                                <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                                <div className="text-[10px] font-bold text-red-500 uppercase leading-tight">Воркеры не приносят прибыль без софта! Купите софт во вкладке.</div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Уровень Офиса</div>
                                <div className="text-xl font-black text-white">{currentOfficeSpace.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Профит Команды</div>
                                <div className="text-xl font-mono font-black text-success">+{formatMoney(stats.scamIncome)}/сек</div>
                            </div>
                        </div>

                        {/* Workers Bar */}
                        <div className="bg-surfaceHighlight p-4 rounded-2xl mb-4">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                                <span>Штат Сотрудников</span>
                                <span>{gameState.workers} / {currentOfficeSpace.maxWorkers * gameState.officeBranches}</span>
                            </div>
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-accent h-full rounded-full transition-all duration-500" style={{width: `${(gameState.workers / (currentOfficeSpace.maxWorkers * gameState.officeBranches)) * 100}%`}}></div>
                            </div>
                        </div>

                        {/* Strategy Selector */}
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 ml-1">Стратегия Работы</div>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {Object.values(TeamStrategy).map((strat) => (
                                <button key={strat} onClick={() => setGameState(prev => ({...prev, teamStrategy: strat as TeamStrategy}))} className={`p-2 rounded-xl border transition-all ${gameState.teamStrategy === strat ? 'border-transparent bg-white text-black' : 'border-transparent bg-surfaceHighlight text-slate-500'}`}>
                                    <div className="text-[9px] font-black uppercase text-center">{TEAM_STRATEGIES[strat].name}</div>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setGameState(prev => ({ ...prev, balance: prev.balance - calculateUpgradeCost(WORKER_HIRE_COST_BASE, gameState.workers), workers: prev.workers + 1 }))} 
                            disabled={gameState.workers >= currentOfficeSpace.maxWorkers * gameState.officeBranches || gameState.balance < calculateUpgradeCost(WORKER_HIRE_COST_BASE, gameState.workers)}
                            className="w-full py-4 bg-accent text-white font-black rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:bg-surfaceHighlight disabled:text-slate-500 transition-all active:scale-95 shadow-lg shadow-accent/20 flex flex-col items-center leading-none gap-1">
                            <span>НАНЯТЬ ВОРКЕРА</span>
                            <span className="text-[10px] opacity-80 font-mono font-medium">{formatMoney(calculateUpgradeCost(WORKER_HIRE_COST_BASE, gameState.workers))}</span>
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* SOFT SECTION */}
        {businessTab === 'SOFT' && (
             <div className="space-y-4">
                 <div className="p-4 bg-primary/10 rounded-2xl text-xs text-primary font-bold border border-primary/20 mb-2">
                     💡 Софт необходим, чтобы воркеры приносили доход. Чем лучше софт, тем больше приносит каждый воркер.
                 </div>
                 {MARKET_ITEMS.filter(u => u.type === UpgradeType.SOFTWARE).map(u => {
                    const level = gameState.upgrades[u.id] || 0;
                    const cost = calculateUpgradeCost(u.baseCost, level);
                    const canBuy = gameState.balance >= cost;
                    return (
                        <div key={u.id} className="bg-surface p-5 rounded-3xl">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-surfaceHighlight text-secondary rounded-2xl">{getMarketIcon(u.id, u.vertical)}</div>
                                    <div>
                                        <div className="text-white font-black text-sm uppercase">{u.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold bg-surfaceHighlight px-2 py-0.5 rounded w-fit mt-1">{getSoftTier(u, level)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 mb-3 font-medium">{u.description}</div>
                            <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform ${canBuy ? 'bg-secondary text-white' : 'bg-surfaceHighlight text-slate-500'}`}>
                            {level === 0 ? 'КУПИТЬ' : 'УЛУЧШИТЬ'} {formatMoney(cost)}
                            </button>
                        </div>
                    );
                })}
             </div>
        )}

        {/* TRAFFIC SECTION */}
        {businessTab === 'TRAFFIC' && (
             <div className="space-y-4">
                 <div className="p-4 bg-primary/10 rounded-2xl text-xs text-primary font-bold border border-primary/20 mb-2">
                     📈 Трафик работает как множитель дохода. +10% Трафика = +10% к доходу всей команды.
                 </div>
                 {MARKET_ITEMS.filter(u => u.type === UpgradeType.TRAFFIC).map(u => {
                    const level = gameState.upgrades[u.id] || 0;
                    const cost = calculateUpgradeCost(u.baseCost, level);
                    const canBuy = gameState.balance >= cost;
                    return (
                        <div key={u.id} className="bg-surface p-4 rounded-3xl flex justify-between items-center">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-surfaceHighlight text-primary rounded-2xl">{getMarketIcon(u.id, u.vertical)}</div>
                            <div>
                                <div className="text-white font-black text-sm">{u.name}</div>
                                <div className="text-xs text-primary font-bold mt-1">+{Math.round(u.baseProfit * 100)}% ДОХОД</div>
                            </div>
                        </div>
                        <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`px-4 py-3 rounded-2xl text-xs font-black font-mono transition-transform active:scale-95 ${canBuy ? 'bg-primary text-white' : 'bg-surfaceHighlight text-slate-500'}`}>
                            {formatMoney(cost)}
                        </button>
                        </div>
                    );
                })}
             </div>
        )}
      </div>
    );
  };

  // 2. TEMKI TAB (Schemes, Dark Market)
  const renderSchemesTab = () => {
    const activeList = gameState.activeSchemes;
    const now = Date.now();

    return (
        <div className="animate-fade-in pb-24">
             {/* SUB TABS */}
            <div className="flex bg-surfaceHighlight p-1.5 rounded-2xl mb-6">
                <button onClick={() => setSchemesTab('ACTIVE')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${schemesTab === 'ACTIVE' ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    СХЕМЫ
                    {activeList.some(s => s.isReady) && <span className="absolute top-1 right-2 w-2 h-2 bg-success rounded-full animate-pulse"/>}
                </button>
                <button onClick={() => setSchemesTab('BLACK_MARKET')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${schemesTab === 'BLACK_MARKET' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    ЧЕРНУХА
                </button>
            </div>

            {schemesTab === 'ACTIVE' && (
                <div className="space-y-6">
                    {/* Active Status */}
                    {activeList.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-2">В Процессе</h4>
                            {activeList.map(scheme => {
                                const def = SCHEMES_LIST.find(s => s.id === scheme.schemeId);
                                if (!def) return null;
                                const timeLeft = Math.max(0, Math.ceil((scheme.endTime - now) / 1000));
                                const progress = Math.min(100, ((now - scheme.startTime) / (scheme.endTime - scheme.startTime)) * 100);
                                const isBlack = def.category === SchemeCategory.BLACK;

                                return (
                                    <div key={scheme.id} className={`p-4 rounded-3xl border ${isBlack ? 'bg-red-950/10 border-red-500/30' : 'bg-surface border-white/5'} relative overflow-hidden`}>
                                        <div className="flex justify-between items-center mb-2 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="text-xl">{def.icon}</div>
                                                <span className="font-bold text-sm text-white">{def.name}</span>
                                            </div>
                                            {scheme.isReady ? (
                                                <button onClick={() => claimScheme(scheme)} className="bg-success text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider animate-pulse">Забрать</button>
                                            ) : (
                                                <span className="font-mono text-xs text-slate-400">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                            )}
                                        </div>
                                        {!scheme.isReady && (
                                            <div className="h-1.5 w-full bg-surfaceHighlight rounded-full overflow-hidden relative z-10">
                                                <div className={`h-full transition-all duration-1000 linear ${isBlack ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}/>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Grey Schemes List */}
                    <div className="space-y-4">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-2">Доступные Темы</h4>
                        {SCHEMES_LIST.filter(s => s.category === SchemeCategory.GREY).map(scheme => {
                             const canAfford = gameState.balance >= scheme.cost;
                             return (
                                 <div key={scheme.id} className="p-5 rounded-3xl relative overflow-hidden group bg-surface">
                                     <div className="flex justify-between items-start mb-4 relative z-10">
                                          <div className="flex items-center gap-4">
                                              <div className="text-3xl p-3 rounded-2xl bg-surfaceHighlight">{scheme.icon}</div>
                                              <div>
                                                  <h4 className="text-white font-black text-sm uppercase">{scheme.name}</h4>
                                                  <p className="text-[10px] text-slate-400 font-bold mt-1">{scheme.description}</p>
                                              </div>
                                          </div>
                                          <div className={`px-2 py-1 rounded text-[10px] font-black bg-yellow-500 text-black`}>
                                              RISK {scheme.riskPercentage}%
                                          </div>
                                     </div>

                                     <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl mb-4 relative z-10">
                                         <div className="text-center">
                                             <div className="text-[9px] text-slate-500 font-bold uppercase">Время</div>
                                             <div className="text-xs text-white font-mono">{scheme.durationSeconds / 60} мин</div>
                                         </div>
                                         <div className="text-center">
                                             <div className="text-[9px] text-slate-500 font-bold uppercase">Вложения</div>
                                             <div className="text-xs text-white font-mono">{formatMoney(scheme.cost)}</div>
                                         </div>
                                         <div className="text-center">
                                             <div className="text-[9px] text-slate-500 font-bold uppercase">Выхлоп</div>
                                             <div className="text-xs text-success font-mono">~{formatMoney(scheme.maxProfit)}</div>
                                         </div>
                                     </div>

                                     <button onClick={() => startScheme(scheme)} disabled={!canAfford} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 ${canAfford ? 'bg-white text-black' : 'bg-surfaceHighlight text-slate-500'}`}>
                                         НАЧАТЬ ТЕМУ
                                     </button>
                                 </div>
                             )
                        })}
                    </div>
                </div>
            )}

            {schemesTab === 'BLACK_MARKET' && (
                <div className="space-y-6">
                     <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl text-center">
                         <Skull className="mx-auto text-red-500 mb-2" size={32} />
                         <h4 className="text-red-500 font-black uppercase text-sm tracking-widest">Черный Рынок</h4>
                         <p className="text-[10px] text-red-400/70 font-bold mt-1">Здесь покупают товар для перепродажи и запрещенный софт.</p>
                    </div>

                    {/* Black Schemes (Trade) */}
                    <h4 className="text-xs text-red-500/70 font-bold uppercase tracking-widest pl-2">Товарка (Опасно)</h4>
                    <div className="space-y-4">
                        {SCHEMES_LIST.filter(s => s.category === SchemeCategory.BLACK).map(scheme => {
                             const canAfford = gameState.balance >= scheme.cost;
                             return (
                                 <div key={scheme.id} className="p-5 rounded-3xl relative overflow-hidden group bg-gradient-to-br from-surface to-red-950/20 border border-red-900/10">
                                     <div className="flex justify-between items-start mb-4 relative z-10">
                                          <div className="flex items-center gap-4">
                                              <div className="text-3xl p-3 rounded-2xl bg-red-900/20">{scheme.icon}</div>
                                              <div>
                                                  <h4 className="text-white font-black text-sm uppercase">{scheme.name}</h4>
                                                  <p className="text-[10px] text-slate-400 font-bold mt-1">{scheme.description}</p>
                                              </div>
                                          </div>
                                          <div className="px-2 py-1 rounded text-[10px] font-black bg-red-500 text-white">
                                              RISK {scheme.riskPercentage}%
                                          </div>
                                     </div>

                                     <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl mb-4 relative z-10">
                                         <div className="text-center">
                                             <div className="text-[9px] text-slate-500 font-bold uppercase">Ждать</div>
                                             <div className="text-xs text-white font-mono">{scheme.durationSeconds / 60} мин</div>
                                         </div>
                                         <div className="text-center">
                                             <div className="text-[9px] text-slate-500 font-bold uppercase">Закуп</div>
                                             <div className="text-xs text-white font-mono">{formatMoney(scheme.cost)}</div>
                                         </div>
                                         <div className="text-center">
                                             <div className="text-[9px] text-slate-500 font-bold uppercase">Навар</div>
                                             <div className="text-xs text-success font-mono">~{formatMoney(scheme.maxProfit)}</div>
                                         </div>
                                     </div>

                                     <button onClick={() => startScheme(scheme)} disabled={!canAfford} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 ${canAfford ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-surfaceHighlight text-slate-500'}`}>
                                         ЗАКУПИТЬ ТОВАР
                                     </button>
                                 </div>
                             )
                        })}
                    </div>

                    {/* Black Market Upgrades (Passive) */}
                    <h4 className="text-xs text-red-500/70 font-bold uppercase tracking-widest pl-2 mt-8">Инфраструктура ОПГ</h4>
                    {MARKET_ITEMS.filter(u => u.type === UpgradeType.BLACK_MARKET).map(u => {
                        const level = gameState.upgrades[u.id] || 0;
                        const cost = calculateUpgradeCost(u.baseCost, level);
                        const canBuy = gameState.balance >= cost;
                        return (
                            <div key={u.id} className="bg-surface border border-red-900/20 p-5 rounded-3xl relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-red-950/50 text-red-500 rounded-2xl border border-red-500/20">{getMarketIcon(u.id, u.vertical)}</div>
                                        <div>
                                            <div className="text-white font-black text-sm uppercase tracking-wide">{u.name}</div>
                                            <div className="text-[10px] text-red-400/80 font-bold px-2 py-0.5 rounded w-fit mt-1 bg-red-950/40 border border-red-900/20">{getSoftTier(u, level)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                            <div className="text-xs font-bold text-red-500">+{formatMoney(u.baseProfit)} / сек</div>
                                    </div>
                                </div>
                                    <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] active:scale-95 transition-transform ${canBuy ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-surfaceHighlight text-slate-500'}`}>
                                    КУПИТЬ {formatMoney(cost)}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
  };

  // 3. FINANCE TAB (Laundering, Exchange, Tools)
  const renderFinanceTab = () => {
    return (
        <div className="animate-fade-in pb-24">
             {/* SUB TABS */}
            <div className="flex bg-surfaceHighlight p-1.5 rounded-2xl mb-6">
                <button onClick={() => setFinanceTab('LAUNDERING')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${financeTab === 'LAUNDERING' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    ОБМЫВ
                    {stats.isBankFull && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
                </button>
                <button onClick={() => setFinanceTab('EXCHANGE')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${financeTab === 'EXCHANGE' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    БИРЖА
                </button>
                <button onClick={() => setFinanceTab('TOOLS')} className={`relative flex-1 py-3 rounded-xl text-[10px] font-black tracking-wider transition-all ${financeTab === 'TOOLS' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    ИНСТРУМЕНТЫ
                </button>
            </div>

            {financeTab === 'LAUNDERING' && (
                <div className="space-y-4">
                    {stats.isBankFull && <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 font-bold text-xs uppercase text-center animate-pulse border border-red-500/20">Банк переполнен! Деньги сгорают!</div>}
                    <div className="p-4 bg-surfaceHighlight rounded-2xl text-[10px] text-slate-400 font-medium mb-4">
                        Ваш доход ограничен лимитами банка. Покупайте бизнесы для отмыва, чтобы хранить больше денег.
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {LAUNDERING_ITEMS.map((item, index) => {
                            const currentLevel = gameState.launderingUpgrades[item.id] || 0;
                            const cost = calculateUpgradeCost(item.baseCost, currentLevel);
                            const canBuy = gameState.balance >= cost;
                            const canPlay = ['laund_shawarma', 'laund_carwash', 'laund_rest', 'laund_const'].includes(item.id) && currentLevel > 0;

                            return (
                                <div key={item.id} className="p-5 rounded-3xl bg-surface relative overflow-hidden">
                                    <div className="flex items-center gap-4 mb-3 relative z-10">
                                        <div className="text-3xl p-3 bg-surfaceHighlight rounded-2xl">{item.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                            <h4 className="font-black text-white text-sm">{item.name}</h4>
                                            <span className="text-[10px] font-bold bg-surfaceHighlight px-2 py-0.5 rounded text-slate-400">Lvl {currentLevel}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-1">+{formatMoney(item.baseLimit)} Лимит</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-5 gap-2 relative z-10">
                                        <button onClick={() => upgradeLaunderingItem(item)} disabled={!canBuy} className={`col-span-3 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${canBuy ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surfaceHighlight text-slate-500'}`}>{`UP ${formatMoney(cost)}`}</button>
                                        
                                        {canPlay ? (
                                            <button onClick={() => setActiveMiniGame(item.id)} className="col-span-2 py-3 bg-accent text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-accent/20 animate-pop">
                                                <Gamepad2 size={20} />
                                            </button>
                                        ) : (
                                        <div className="col-span-2 bg-surfaceHighlight rounded-2xl flex items-center justify-center opacity-30 cursor-not-allowed">
                                            <Lock size={16} />
                                        </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {financeTab === 'EXCHANGE' && (
                <div className="space-y-3">
                     <div className="bg-surfaceHighlight p-5 rounded-3xl">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Мой Портфель</div>
                        <div className="text-3xl font-mono font-black mt-1 flex items-center gap-2 text-white">
                            {formatMoney(stats.portfolioValue)}
                            <Activity size={20} className="text-primary" />
                        </div>
                    </div>
                    {ASSETS.map(asset => {
                        const price = gameState.assetPrices[asset.id] || asset.basePrice;
                        const owned = gameState.ownedAssets[asset.id] || 0;
                        const canBuy = gameState.balance >= price;
                        const canSell = owned > 0;
                        return (
                            <div key={asset.id} className="bg-surface p-5 rounded-3xl relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl bg-surfaceHighlight w-12 h-12 flex items-center justify-center rounded-2xl">{asset.icon}</div>
                                        <div>
                                            <div className="font-black text-white">{asset.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 bg-surfaceHighlight px-2 py-0.5 rounded w-fit mt-1">{asset.symbol}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-black text-lg text-white">{formatMoney(price)}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => buyAsset(asset)} disabled={!canBuy} className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-transform active:scale-95 ${canBuy ? 'bg-success text-white' : 'bg-surfaceHighlight text-slate-500'}`}>Купить</button>
                                    <button onClick={() => sellAsset(asset)} disabled={!canSell} className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-transform active:scale-95 ${canSell ? 'bg-secondary text-white' : 'bg-surfaceHighlight text-slate-500'}`}>Продать</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {financeTab === 'TOOLS' && (
                <div className="space-y-3">
                    <div className="p-4 bg-surfaceHighlight rounded-2xl text-[10px] text-slate-400 font-medium mb-2">
                        Инструменты увеличивают доход с одного клика по кнопке. Полезно для активного старта.
                    </div>
                    {MARKET_ITEMS.filter(u => u.type === UpgradeType.RENTAL).map(u => {
                        const level = gameState.upgrades[u.id] || 0;
                        const cost = calculateUpgradeCost(u.baseCost, level);
                        const canBuy = gameState.balance >= cost;
                        return (
                            <div key={u.id} className="bg-surface p-4 rounded-3xl flex justify-between items-center relative overflow-hidden group">
                            <div className="flex items-center gap-4 flex-1 z-10">
                                <div className="p-3 rounded-2xl bg-surfaceHighlight text-accent">{getMarketIcon(u.id, u.vertical)}</div>
                                <div>
                                    <div className="text-white font-black text-sm uppercase">{u.name}</div>
                                    <div className="text-xs text-slate-400 font-bold mt-1">Lvl {level} • +{u.baseProfit} TAP</div>
                                </div>
                            </div>
                            <button onClick={() => buyUpgrade(u)} disabled={!canBuy} className={`z-10 px-5 py-3 rounded-2xl text-xs font-black font-mono transition-all active:scale-95 ${canBuy ? 'bg-white text-black' : 'bg-surfaceHighlight text-slate-500'}`}>
                                {formatMoney(cost)}
                            </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
  };

  // 4. LIFESTYLE (Same as before)
  const renderLifestyle = () => (
    <div className="grid grid-cols-2 gap-3 animate-fade-in pb-24">
      {PROPERTIES.map(p => {
        const count = gameState.properties?.[p.id] || 0;
        const cost = calculateUpgradeCost(p.baseCost, count);
        const canBuy = gameState.balance >= cost;
        return (
          <button key={p.id} onClick={() => buyProperty(p)} disabled={!canBuy} className={`relative overflow-hidden p-4 rounded-3xl flex flex-col items-center text-center transition-all active:scale-95 ${canBuy ? 'bg-surface hover:bg-surfaceHighlight' : 'bg-surface/50 opacity-60'}`}>
            <div className="text-white mb-2 text-3xl drop-shadow-md">{p.image.includes('http') ? <img src={p.image} className="w-8 h-8"/> : p.image}</div>
            <div className="text-xs font-black text-white uppercase tracking-wide leading-tight mb-1">{p.name}</div>
            <div className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold mt-2 ${canBuy ? 'bg-success text-white' : 'bg-surfaceHighlight text-slate-500'}`}>{formatMoney(cost)}</div>
            {count > 0 && <div className="absolute top-3 right-3 text-[9px] font-black bg-white text-black w-5 h-5 flex items-center justify-center rounded-full shadow-md">{count}</div>}
          </button>
        )
      })}
    </div>
  );

  // 5. PROFILE (Career + Manual Link)
  const renderProfile = () => (
      <div className="animate-fade-in space-y-6 pb-32">
          <div className="bg-surface text-white p-8 rounded-[3rem] text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
             <div className="relative z-10">
                <div className="w-24 h-24 bg-surfaceHighlight rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-surface shadow-xl">
                    <img src={characterImage} alt="Character" className="w-full h-full object-cover rounded-full" />
                </div>
                <h2 className="text-2xl font-black uppercase mb-1">{stats.currentJob.title}</h2>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Всего заработано: {formatMoney(gameState.lifetimeEarnings)}</div>
                
                <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setIsManualOpen(true)} className="py-3 bg-surfaceHighlight rounded-2xl text-xs font-black uppercase text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                         <HelpCircle size={16} /> Гайд
                     </button>
                     <div className="py-3 bg-surfaceHighlight rounded-2xl text-xs font-black uppercase text-slate-300 flex items-center justify-center gap-2">
                         <BriefcaseBusiness size={16} /> Тима: {(gameState.workerSalaryRate * 100).toFixed(0)}%
                     </div>
                </div>
             </div>
           </div>

          <div className="space-y-4">
             <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest ml-4">Карьерная Лестница</h3>
             {CAREER_LADDER.map((job, idx) => {
                const currentIdx = CAREER_LADDER.findIndex(j => j.id === gameState.currentJobId);
                // Only show active and next 2 jobs
                if (idx > currentIdx + 2) return null; 
                // Hide past jobs except previous one
                if (idx < currentIdx - 1) return null;

                const isCurrent = idx === currentIdx;
                const isPassed = idx < currentIdx;
                
                const hasRep = gameState.reputation >= job.requiredReputation;
                const hasMoney = gameState.balance >= job.costToPromote;
                const canPromote = hasRep && hasMoney && idx === currentIdx + 1;

                return (
                <div key={job.id} className={`p-6 rounded-3xl border-2 ${isCurrent ? 'bg-surface border-primary' : 'bg-surface border-transparent'} ${isPassed ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-lg text-white">{job.title}</span>
                        {isCurrent && <div className="bg-primary px-3 py-1 rounded-lg text-[10px] text-white font-bold uppercase">TEКУЩАЯ</div>}
                        {isPassed && <div className="text-success"><Award size={20} /></div>}
                        {!isCurrent && !isPassed && <div className="bg-surfaceHighlight px-3 py-1 rounded-lg text-[10px] text-slate-400 font-bold uppercase">LOCKED</div>}
                    </div>
                    {!isPassed && !isCurrent && (
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Цена:</span>
                                <span className={hasMoney ? 'text-white' : 'text-red-400'}>{formatMoney(job.costToPromote)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Репутация:</span>
                                <span className={hasRep ? 'text-white' : 'text-red-400'}>{job.requiredReputation}</span>
                            </div>
                        </div>
                    )}
                    {!isPassed && !isCurrent && (
                        <button disabled={!canPromote} onClick={() => promote(job.id)} className={`w-full py-3 rounded-2xl font-black text-xs tracking-widest uppercase transition-all active:scale-95 ${canPromote ? 'bg-white text-black' : 'bg-surfaceHighlight text-slate-600'}`}>
                            Повышение
                        </button>
                    )}
                </div>
                )
            })}
          </div>
      </div>
  );

  const renderInfoContent = () => (
    <div className="space-y-8 animate-fade-in pb-24 text-slate-300">
        <div className="bg-surfaceHighlight p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-black text-white mb-2">🚀 Быстрый Старт</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm marker:text-primary marker:font-bold">
                <li><strong className="text-white">Кликай:</strong> Накопи стартовый капитал тапами.</li>
                <li><strong className="text-white">Купи Инструменты:</strong> Зайди в "Финансы" -> "Инструменты" и купи VPN/Proxy. Это увеличит доход за клик.</li>
                <li><strong className="text-white">Найми Команду:</strong> Вкладка "Бизнес" -> "Команда". Найми первого воркера.</li>
                <li><strong className="text-white">Купи Софт:</strong> Вкладка "Бизнес" -> "Софт". <span className="text-red-400">Без софта воркеры не работают!</span></li>
            </ol>
        </div>

        <div className="grid grid-cols-1 gap-4">
             <div className="bg-surfaceHighlight p-5 rounded-3xl">
                 <div className="flex items-center gap-3 mb-2">
                     <Briefcase className="text-primary" size={20}/>
                     <h4 className="font-black text-white">Бизнес (Пассив)</h4>
                 </div>
                 <p className="text-xs leading-relaxed">
                     Твоя главная машина по добыче денег.
                     <br/>1. Нанимай людей.
                     <br/>2. Покупай им Софт.
                     <br/>3. Лей Трафик (Бизнес -> Трафик), чтобы умножать их доход.
                 </p>
             </div>

             <div className="bg-surfaceHighlight p-5 rounded-3xl">
                 <div className="flex items-center gap-3 mb-2">
                     <Zap className="text-yellow-500" size={20}/>
                     <h4 className="font-black text-white">Темки (Риск)</h4>
                 </div>
                 <p className="text-xs leading-relaxed">
                     Временные задачи. Вкладываешь деньги -> Ждешь -> Есть шанс потерять всё или получить х2-х5.
                 </p>
             </div>

             <div className="bg-surfaceHighlight p-5 rounded-3xl">
                 <div className="flex items-center gap-3 mb-2">
                     <Landmark className="text-success" size={20}/>
                     <h4 className="font-black text-white">Лимиты Банка</h4>
                 </div>
                 <p className="text-xs leading-relaxed">
                     В начале банк вмещает мало денег. Если банк полон, деньги сгорают.
                     Заходи в <span className="text-white font-bold">Финансы -> Обмыв</span> и покупай бизнесы (Шаурма, Мойка), чтобы расширить банк.
                 </p>
             </div>
        </div>
    </div>
  );

  // Active Mini Game Data
  const currentMiniGameItem = activeMiniGame ? LAUNDERING_ITEMS.find(i => i.id === activeMiniGame) : null;
  const currentMiniGameLevel = activeMiniGame ? gameState.launderingUpgrades[activeMiniGame] || 1 : 1;

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden font-sans bg-background text-white selection:bg-primary/30">
      
      {/* BACKGROUND PARTICLES */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[20%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-secondary/10 rounded-full blur-[80px]"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
      </div>

      {/* TOP FLOATING WIDGET */}
      <div className="relative z-50 w-full pt-8 px-4">
           <div className="bg-surface/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between gap-4 mb-3">
                   {/* Rank Info */}
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg">
                           <User size={18} />
                       </div>
                       <div className="flex flex-col">
                           <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Должность</span>
                           <span className="text-xs font-bold text-white">{stats.currentJob.title}</span>
                       </div>
                   </div>
                   
                   {/* Bank Info */}
                   <div className="text-right">
                       <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Лимит Банка</div>
                       <div className={`text-xs font-mono font-black ${stats.isBankFull ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                           {formatMoney(stats.bankLimit)}
                       </div>
                   </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
                   <div 
                        className={`h-full rounded-full transition-all duration-500 ease-out ${stats.isBankFull ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-accent'}`} 
                        style={{width: `${limitPercent}%`}}
                   />
              </div>
           </div>
      </div>

      {/* CENTER STAGE: BALANCE & CHARACTER */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
           
           {/* Character Background Image */}
           <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none translate-y-10">
              <div className="relative w-full max-w-sm aspect-square">
                 <img 
                    src={characterImage} 
                    alt="Character" 
                    className="w-full h-full object-contain drop-shadow-2xl filter grayscale-[0.2]" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              </div>
           </div>

           <div className="relative z-10 flex flex-col items-center animate-bounce-soft">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 bg-surfaceHighlight/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">БАЛАНС</span>
               <h1 className={`text-6xl sm:text-7xl font-mono font-black tracking-tight transition-all duration-300 drop-shadow-2xl ${stats.isBankFull ? 'text-red-500' : 'text-white'}`}>
                  {formatMoney(gameState.balance)}
               </h1>
               <div className="mt-3 text-sm font-bold text-success bg-surfaceHighlight/80 backdrop-blur-sm border border-white/5 px-4 py-1.5 rounded-xl flex items-center gap-2">
                   <Battery size={14} className="animate-pulse"/>
                   +{formatMoney(stats.totalPassiveIncome)} / сек
               </div>
           </div>
           
           {/* Floating Particles Area */}
           <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {clicks.map(c => (
                  <div key={c.id} className="float-text text-4xl font-black text-white drop-shadow-lg" style={{left: c.x, top: c.y}}>
                     {c.val}
                  </div>
                ))}
           </div>
      </div>

      {/* BOTTOM ACTION: CLICKER */}
      <div className="relative z-20 pb-28 w-full flex justify-center">
          <ClickerCircle onClick={handleClick} clickValue={stats.currentClickValue} />
      </div>

      {/* MODALS AND NAV */}
      {activeEvent && (
        <div className="fixed top-24 left-4 right-4 z-[70] bg-surface p-6 rounded-3xl animate-pop shadow-2xl flex items-center gap-4">
             <div className="text-4xl">{activeEvent.type === 'GOOD' ? '🎉' : '👮'}</div>
             <div>
                <div className="text-sm font-black text-white uppercase mb-1">{activeEvent.title}</div>
                <div className="text-xs text-slate-400 font-medium leading-tight">{activeEvent.message}</div>
                <div className={`text-sm font-mono font-black mt-2 ${activeEvent.type === 'GOOD' ? 'text-success' : 'text-red-400'}`}>
                    {activeEvent.type === 'GOOD' ? '+' : ''}{activeEvent.effectValue > 0 ? formatMoney(activeEvent.effectValue) : (activeEvent.effectValue * 100).toFixed(0) + '%'}
                </div>
            </div>
        </div>
      )}

      {offlineEarnings !== null && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md">
           <div className="bg-surface w-full max-w-sm p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden animate-pop">
             <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none"></div>
             <div className="relative z-10">
                 <div className="text-6xl mb-6 animate-bounce">💰</div>
                 <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">С Возвращением!</h2>
                 <p className="text-xs text-slate-400 mb-8 font-bold">Пока тебя не было, тима заработала:</p>
                 <div className="text-5xl font-black text-white mb-8 font-mono tracking-tighter">+{formatMoney(offlineEarnings)}</div>
                 <button onClick={() => setOfflineEarnings(null)} className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/30">ЗАБРАТЬ КЭШ</button>
             </div>
           </div>
        </div>
      )}

      {activeMiniGame && currentMiniGameItem && (
          <MiniGameModal 
            businessId={activeMiniGame}
            businessLevel={currentMiniGameLevel}
            baseIncome={currentMiniGameItem.baseIncome}
            onClose={() => setActiveMiniGame(null)}
            onComplete={handleMiniGameComplete}
          />
      )}

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* --- CONTENT BOTTOM SHEETS --- */}
      
      {/* 1. BUSINESS (Team, Soft, Traffic) */}
      <BottomSheet isOpen={activeTab === Tab.MANAGEMENT} onClose={() => setActiveTab(Tab.CLICKER)} title="Бизнес">
        {renderBusiness()}
      </BottomSheet>

      {/* 2. SCHEMES (Active, Dark Market) */}
      <BottomSheet isOpen={activeTab === Tab.SCHEMES} onClose={() => setActiveTab(Tab.CLICKER)} title="Темки">
        {renderSchemesTab()}
      </BottomSheet>

      {/* 3. FINANCE (Laundering, Exchange, Tools) */}
      <BottomSheet isOpen={activeTab === Tab.MARKET} onClose={() => setActiveTab(Tab.CLICKER)} title="Финансы">
        {renderFinanceTab()}
      </BottomSheet>

      {/* 4. LIFESTYLE (Properties) */}
      <BottomSheet isOpen={activeTab === Tab.LIFESTYLE} onClose={() => setActiveTab(Tab.CLICKER)} title="Лакшери">
        {renderLifestyle()}
      </BottomSheet>

      {/* 5. PROFILE (Stats, Manual) */}
      <BottomSheet isOpen={activeTab === Tab.PROFILE} onClose={() => setActiveTab(Tab.CLICKER)} title="Профиль">
        {renderProfile()}
      </BottomSheet>

      {/* MANUAL OVERLAY */}
      <BottomSheet isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} title="Как играть?">
         {renderInfoContent()}
      </BottomSheet>

    </div>
  );
};

export default App;