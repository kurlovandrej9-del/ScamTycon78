import React, { useState, useEffect, useRef } from 'react';
import { Timer, Trophy } from 'lucide-react';
import { formatMoney } from '../utils/format';

interface MiniGameProps {
  businessId: string;
  businessLevel: number;
  baseIncome: number;
  onClose: () => void;
  onComplete: (score: number) => void;
}

// Config for different games
const GAME_CONFIG: Record<string, { title: string; icons: string[]; color: string; bgGradient: string }> = {
  'laund_shawarma': {
    title: 'Крути Шаурму',
    icons: ['🥙', '🌯', '🥬', '🍅', '🥩'],
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/5'
  },
  'laund_carwash': {
    title: 'Мойка Люкс',
    icons: ['🫧', '🧼', '🚗', '💦', '🧽'],
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-cyan-500/5'
  },
  'laund_rest': {
    title: 'Сбор Кассы',
    icons: ['🍝', '🍷', '🍕', '💵', '🧁'],
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-pink-500/5'
  },
  'laund_const': {
    title: 'Стройка Века',
    icons: ['🧱', '🏗️', '🔨', '🏠', '🚜'],
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-500/20 to-orange-500/5'
  }
};

interface Target {
  id: number;
  x: number;
  y: number;
  icon: string;
}

export const MiniGameModal: React.FC<MiniGameProps> = ({ businessId, businessLevel, baseIncome, onClose, onComplete }) => {
  const config = GAME_CONFIG[businessId] || GAME_CONFIG['laund_shawarma'];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [particles, setParticles] = useState<{id: number, x: number, y: number, text: string}[]>([]);
  
  // Use ReturnType<typeof setInterval> for cross-environment compatibility
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start Game
  useEffect(() => {
    setIsPlaying(true);
    return () => stopGame();
  }, []);

  const stopGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
  };

  // Timer Loop
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopGame();
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  // Spawner Loop
  useEffect(() => {
    if (!isPlaying) return;

    // Difficulty scales slightly with level, but mostly constant speed
    const spawnRate = 600; 

    spawnerRef.current = setInterval(() => {
      spawnTarget();
    }, spawnRate);

    return () => { if (spawnerRef.current) clearInterval(spawnerRef.current); };
  }, [isPlaying]);

  const spawnTarget = () => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10; // 10% to 90%
    const y = Math.random() * 70 + 15; // 15% to 85%
    const icon = config.icons[Math.floor(Math.random() * config.icons.length)];
    
    setTargets(prev => [...prev, { id, x, y, icon }]);

    // Auto remove after 1.5s if missed
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== id));
    }, 1500);
  };

  const handleTap = (target: Target) => {
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Add Score
    setScore(prev => prev + 1);

    // Remove Target
    setTargets(prev => prev.filter(t => t.id !== target.id));

    // Show Particle
    const pId = Date.now();
    setParticles(prev => [...prev, { id: pId, x: target.x, y: target.y, text: '+1' }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== pId)), 500);
  };

  const handleFinish = () => {
    // Reward calculation: Base Income * Level * Score * Multiplier
    const reward = Math.floor(baseIncome * businessLevel * score * 0.5); 
    onComplete(reward);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      <div className="relative w-full max-w-md bg-surface rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-surfaceHighlight z-20">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white/10 ${config.color}`}>
                   <Timer size={24} />
                </div>
                <div>
                    <h3 className="font-black text-white uppercase text-sm tracking-wider">{config.title}</h3>
                    <div className={`font-mono font-black text-xl ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        00:{timeLeft.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                 <span className="text-[10px] text-slate-400 font-bold uppercase">Счет</span>
                 <span className={`text-2xl font-black ${config.color}`}>{score}</span>
            </div>
        </div>

        {/* Game Area */}
        {timeLeft > 0 ? (
            <div className={`relative flex-1 overflow-hidden bg-gradient-to-b ${config.bgGradient}`}>
                {/* Targets */}
                {targets.map(target => (
                    <button
                        key={target.id}
                        onMouseDown={(e) => { e.stopPropagation(); handleTap(target); }}
                        onTouchStart={(e) => { e.stopPropagation(); handleTap(target); }}
                        className="absolute w-20 h-20 flex items-center justify-center text-5xl animate-pop cursor-pointer transition-transform active:scale-90 hover:scale-110 select-none touch-manipulation"
                        style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        {target.icon}
                    </button>
                ))}

                {/* Particles */}
                {particles.map(p => (
                    <div 
                        key={p.id} 
                        className="absolute text-xl font-black text-white pointer-events-none animate-float"
                        style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        {p.text}
                    </div>
                ))}
            </div>
        ) : (
            /* Results Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"/>
                <Trophy size={80} className={`${config.color} mb-6 animate-bounce`} />
                <h2 className="text-3xl font-black text-white uppercase mb-2">Игра Окончена!</h2>
                <p className="text-slate-400 font-bold mb-8">Ты натапал:</p>
                
                <div className="bg-surfaceHighlight w-full p-6 rounded-3xl mb-8 flex flex-col items-center border border-white/5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Твой Куш</span>
                    <span className="text-4xl font-mono font-black text-success">
                        +{formatMoney(Math.floor(baseIncome * businessLevel * score * 0.5))}
                    </span>
                </div>

                <button 
                    onClick={handleFinish}
                    className={`w-full py-5 rounded-2xl font-black uppercase text-white tracking-widest text-lg shadow-xl active:scale-95 transition-all ${config.color === 'text-orange-500' ? 'bg-orange-500' : config.color === 'text-blue-500' ? 'bg-blue-500' : config.color === 'text-yellow-500' ? 'bg-yellow-500' : 'bg-purple-500'}`}
                >
                    Забрать
                </button>
            </div>
        )}
      </div>
    </div>
  );
};