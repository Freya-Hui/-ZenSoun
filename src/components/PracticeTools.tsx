import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Pause, RotateCcw, Heart, Info, CircleHelp, Settings, Check, Lock } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface PracticeToolsProps {
  theme?: 'day' | 'night';
  isPremiumUser?: boolean;
  onOpenSubscribeModal?: () => void;
}

export default function PracticeTools({ 
  theme = 'night',
  isPremiumUser = false,
  onOpenSubscribeModal
}: PracticeToolsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'muyu' | 'bowl' | 'breath'>('muyu');
  const isDark = theme === 'night';

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-[#0a0f1d] text-gray-200' : 'bg-[#faf9f6] text-stone-800'}`}>
      {/* Visual Subtabs */}
      <div className={`flex p-1.5 rounded-xl mx-4 mt-3 mb-2 border gap-1 ${
        isDark ? 'bg-[#0f172a] border-slate-800/80' : 'bg-stone-200/50 border-stone-200'
      }`} id="practice_sub_tabs">
        <button
          onClick={() => setActiveSubTab('muyu')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
            activeSubTab === 'muyu'
              ? isDark
                ? 'bg-[#1e293b] text-sky-400 shadow-md border-b-[2px] border-sky-400/80'
                : 'bg-white text-sky-700 shadow border border-stone-300 font-bold'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-stone-500 hover:text-stone-700'
          }`}
          id="tab_muyu"
        >
          电子木鱼
        </button>
        <button
          onClick={() => setActiveSubTab('bowl')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
            activeSubTab === 'bowl'
              ? isDark
                ? 'bg-[#1e293b] text-sky-400 shadow-md border-b-[2px] border-sky-400/80'
                : 'bg-white text-sky-700 shadow border border-stone-300 font-bold'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-stone-500 hover:text-stone-700'
          }`}
          id="tab_bowl"
        >
          颂磬静心钵
        </button>
        <button
          onClick={() => setActiveSubTab('breath')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
            activeSubTab === 'breath'
              ? isDark
                ? 'bg-[#1e293b] text-sky-400 shadow-md border-b-[2px] border-sky-400/80'
                : 'bg-white text-sky-700 shadow border border-stone-300 font-bold'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-stone-500 hover:text-stone-700'
          }`}
          id="tab_breath"
        >
          呼吸吐纳
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6" id="practice_content">
        {activeSubTab === 'muyu' && (
          <WoodenFishView 
            isDark={isDark} 
            isPremiumUser={isPremiumUser}
            onOpenSubscribeModal={onOpenSubscribeModal}
          />
        )}
        {activeSubTab === 'bowl' && <SingingBowlView isDark={isDark} />}
        {activeSubTab === 'breath' && <BreathingView isDark={isDark} />}
      </div>
    </div>
  );
}

// ========================
// 1. ELECTRONIC WOODEN FISH THEME LIBRARIES
// ========================================
const presetThemeLibraries: Record<string, { baseWord: string; floatings: string[] }> = {
  '祈福安康': {
    baseWord: '喜乐安宁',
    floatings: ['平安顺遂', '福运滋长', '身体安康', '消灾解厄', '喜乐无忧', '功德无量']
  },
  '学业功名': {
    baseWord: '金榜题名',
    floatings: ['心神专注', '智慧开朗', '思路清爽', '金榜飘香', '一举夺魁', '心想事成']
  },
  '平和去噪': {
    baseWord: '心无挂碍',
    floatings: ['平心静气', '烦恼消退', '浮躁全消', '松弛安顿', '息心凝神', '心境明澈']
  },
  '事业财富': {
    baseWord: '诸事顺遂',
    floatings: ['财源广进', '遇难呈祥', '生意兴隆', '大展宏图', '贵人相助', '步步高升']
  },
  '舒眠宁神': {
    baseWord: '安然入梦',
    floatings: ['肢体放松', '杂念退避', '梦境甘甜', '平稳安眠', '万籁寂静', '神怡气爽']
  }
};

function WoodenFishView({ 
  isDark, 
  isPremiumUser, 
  onOpenSubscribeModal 
}: { 
  isDark: boolean;
  isPremiumUser: boolean;
  onOpenSubscribeModal?: () => void;
}) {
  const [totalCount, setTotalCount] = useState(() => {
    return Number(localStorage.getItem('muyu_count') || '108');
  });
  const [activeTheme, setActiveTheme] = useState('祈福安康');
  const [mantraText, setMantraText] = useState('喜乐安宁');
  const [floatTexts, setFloatTexts] = useState<FloatingText[]>([]);
  const [isStriking, setIsStriking] = useState(false);
  const floatIdRef = useRef(0);

  const [positiveFloatings, setPositiveFloatings] = useState([
    '平安顺遂', '福运滋长', '身体安康', '消灾解厄', '喜乐无忧', '功德无量'
  ]);

  const [themeInput, setThemeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('muyu_count', totalCount.toString());
  }, [totalCount]);

  const handleSelectTheme = (themeName: string) => {
    setActiveTheme(themeName);
    const lib = presetThemeLibraries[themeName];
    if (lib) {
      setMantraText(lib.baseWord);
      setPositiveFloatings(lib.floatings);
    }
  };

  const handleThemeCustom = async () => {
    if (!themeInput.trim()) return;
    if (!isPremiumUser) {
      if (onOpenSubscribeModal) onOpenSubscribeModal();
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/prayer-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.words && data.words.length === 5) {
          setActiveTheme('custom');
          setMantraText(data.words[0]);
          setPositiveFloatings([
            ...data.words,
            '安神专注',
            '浮躁消退'
          ]);
          setThemeInput('');
        }
      } else {
        alert('定制词库调试中，请重试');
      }
    } catch (e) {
      console.error(e);
      alert('定制词库调试中，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStrike = (e: React.MouseEvent<HTMLDivElement>) => {
    audioEngine.strikeWoodenFish();
    setTotalCount(prev => prev + 1);
    setIsStriking(true);

    const randomWord = positiveFloatings[Math.floor(Math.random() * positiveFloatings.length)];
    const floatingWord = randomWord === mantraText ? `${randomWord} +1` : randomWord;

    // Spawning coordinates randomized across different non-overlapping positions of the screen to prevent blockage
    const x = Math.floor(Math.random() * 220) + 40; // 40px to 260px wide
    const y = Math.floor(Math.random() * 150) + 45; // 45px to 195px high

    const newFloat: FloatingText = {
      id: floatIdRef.current++,
      text: floatingWord,
      x: x,
      y: y
    };

    setFloatTexts(prev => [...prev, newFloat]);

    setTimeout(() => {
      setIsStriking(false);
    }, 150);

    // Remove text after animation completes (1.2 sec)
    setTimeout(() => {
      setFloatTexts(prev => prev.filter(item => item.id !== newFloat.id));
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] pb-4 relative overflow-hidden" id="wooden_fish_container">
      {/* Total Merits Counter */}
      <div className="text-center mb-6 z-10 select-none">
        <p className="text-xs text-gray-500 tracking-wider font-sans">今日修养累计</p>
        <motion.p 
          key={totalCount}
          initial={{ scale: 0.82, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-mono font-bold text-amber-400 mt-1"
        >
          {totalCount}
        </motion.p>
      </div>

      {/* Floating texts listed on parent relative container for random positioning without clipping */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <AnimatePresence>
          {floatTexts.map(text => (
            <motion.div
              key={text.id}
              initial={{ opacity: 0, y: text.y + 40, x: text.x, scale: 0.85 }}
              animate={{ opacity: 1, y: text.y - 45, scale: 1.1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="absolute text-[12.5px] font-bold text-amber-300 font-sans pointer-events-none drop-shadow-[0_2px_10px_rgba(245,158,11,0.65)] flex items-center gap-1 bg-slate-950/45 px-2.5 py-1 rounded-full border border-amber-500/10"
            >
              <span>{text.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Interactive Muyu Frame - Premium Dark Wood Micro-glow Tactile Bezel */}
      <div 
        onClick={handleStrike}
        className="relative w-64 h-64 flex items-center justify-center cursor-pointer bg-gradient-to-tr from-[#120807] via-[#1f0f0c] to-[#2c1814] rounded-[48px] border border-[#3e1b13]/60 backdrop-blur-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95),inset_0_2px_6px_rgba(255,255,255,0.04),0_0_25px_rgba(217,119,6,0.08)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95),inset_0_2px_6px_rgba(255,255,255,0.08),0_0_35px_rgba(217,119,6,0.15)] active:scale-95 transition-all duration-150 z-10"
        id="muyu_tapper"
      >
        {/* Outer Golden merit ripple circle */}
        {isStriking && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0.8 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-[48px] border-2 border-amber-500/40 pointer-events-none z-0"
          />
        )}

        {/* Wooden Fish Visual Graphic representing iOS premium feeling */}
        <motion.div
          animate={{ scale: isStriking ? 0.90 : 1 }}
          transition={{ type: 'spring', stiffness: 450, damping: 14 }}
          className="w-44 h-44 rounded-full bg-gradient-to-br from-[#4c221b] via-[#25100c] to-[#120604] shadow-[inset_0_4px_16px_rgba(255,255,255,0.08),0_15px_35px_rgba(0,0,0,0.9)] border border-[#6f3328]/40 flex items-center justify-center relative origin-center z-10"
        >
          {/* Ornate Zen Carving lines on standard wood block */}
          <div className="absolute w-24 h-6 rounded-full border-t-2 border-[#5c2a21]/55 top-10 left-10 transform -rotate-45" />
          <div className="absolute w-24 h-6 rounded-full border-b-2 border-[#5c2a21]/55 bottom-10 right-10 transform -rotate-45" />
          
          <div className="w-16 h-16 bg-gradient-to-r from-[#1c0604] to-[#0a0201] rounded-full shadow-inner flex items-center justify-center border border-[#3e1b12]">
            {/* Animated Golden Core representing physical hollow sound */}
            <div className={`w-8 h-8 rounded-full border-2 border-amber-500/25 flex items-center justify-center transition-all ${isStriking ? 'scale-115 bg-amber-500/15' : 'bg-[#eab308]/5'}`}>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            </div>
          </div>
          
          {/* Hollow resonance opening gap */}
          <div className="absolute w-14 h-4 bg-black/95 rounded-full bottom-12 left-1/2 transform -translate-x-1/2 border border-amber-950/40 shadow-inner" />
        </motion.div>
      </div>

      <p className="text-gray-400 text-xs mt-6 mb-4 font-sans flex items-center gap-1.5 opacity-80 select-none">
        指尖轻触或点击木鱼 • 息心解郁
      </p>

      {/* Preset theme select layout representing traditional culture style */}
      <div className="w-full max-w-sm mt-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <p className="text-xs text-amber-500/90 font-medium mb-2.5 flex items-center gap-1 font-sans select-none">
          <Sparkles className="w-3.5 h-3.5" /> 预设默念主题词库
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4" id="muyu_mantra_list">
          {Object.keys(presetThemeLibraries).map(themeName => (
            <button
              key={themeName}
              onClick={() => handleSelectTheme(themeName)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                activeTheme === themeName
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800/40 text-gray-400 border border-transparent hover:bg-slate-800/70'
              }`}
            >
              {themeName}
            </button>
          ))}
          {activeTheme === 'custom' && (
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-sans bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 cursor-default"
            >
              定制主题
            </button>
          )}
        </div>

        {/* Custom topic wording customization board */}
        <div className="pt-3.5 border-t border-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-sans select-none">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> 定制主题词库
            </span>
            {!isPremiumUser && (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 select-none">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder={isPremiumUser ? "输入您需要定制的愿景主题 (如: 考研上岸)" : "🔒 订阅解锁定制主题词库"}
              value={themeInput}
              disabled={!isPremiumUser && !isGenerating}
              onChange={(e) => setThemeInput(e.target.value)}
              className="flex-1 text-[11px] px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleThemeCustom}
              disabled={isGenerating || !themeInput.trim()}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer disabled:opacity-40 transition-all font-sans shrink-0"
            >
              {isGenerating ? "生成中..." : "生成词库"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// 2. TIBETAN SINGING BOWL (颂磬静心钵)
// ========================
function SingingBowlView({ isDark }: { isDark: boolean }) {
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate liquid water droplet ripples in singing bowl
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 240;
    canvas.height = 100;

    let animId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.05;

      const ripplePower = resonanceLevel / 100;
      if (ripplePower > 0.01) {
        // Draw concentric rippling rings representing vibration frequency
        const count = 4;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.strokeStyle = `rgba(234, 179, 8, ${0.4 * ripplePower})`;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < count; i++) {
          const radius = (20 + i * 22 + (time * 15) % 22);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();

          // draw splash sprinkles
          if (idxRandom % 2 === 0) {
            ctx.fillStyle = `rgba(234, 179, 8, ${0.3 * ripplePower})`;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
              const x = centerX + Math.cos(angle + time) * (radius + 2);
              const y = centerY + Math.sin(angle + time) * (radius + 2);
              ctx.fillRect(x, y, 2, 2);
            }
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const idxRandom = Math.random() > 0.5 ? 2 : 1;
    draw();

    return () => cancelAnimationFrame(animId);
  }, [resonanceLevel]);

  // Handle striking
  const handleStrike = () => {
    audioEngine.strikeSingingBowl();
    setResonanceLevel(100);
    setIsPlaying(true);

    // Slowly fade energy representation
    const timer = setInterval(() => {
      setResonanceLevel(old => {
        if (old <= 2) {
          clearInterval(timer);
          setIsPlaying(false);
          return 0;
        }
        return old - 3; // Fade over 4-5 seconds
      });
    }, 120);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] pb-4">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 tracking-wider">喜马拉雅鎏金颂钵</p>
        <p className="text-sm font-sans text-yellow-500/90 mt-1">
          {isPlaying ? '磬音绕梁，尘虑渐消...' : '点击铜磬敲击 • 共振静心'}
        </p>
      </div>

      {/* Ripple canvas above the bowl */}
      <div className="w-60 h-20 mb-[-12px] relative z-10 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
      </div>

      {/* The Bowl container */}
      <div className="relative group flex items-center justify-center">
        {/* Glowing resonance halo */}
        <AnimatePresence>
          {resonanceLevel > 0 && (
            <motion.div
              initial={{ opacity: 0.1, scale: 0.9 }}
              animate={{ 
                opacity: (resonanceLevel / 100) * 0.45, 
                scale: 1 + (resonanceLevel / 100) * 0.35 
              }}
              exit={{ opacity: 0 }}
              className="absolute w-52 h-52 bg-yellow-500/10 rounded-full blur-2xl filter pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Beautiful highly polished premium brass bowl layout */}
        <div 
          onClick={handleStrike}
          className="relative w-56 h-36 bg-gradient-to-b from-[#eab308] via-[#a16207] to-[#451a03] rounded-b-full border-t-4 border-[#fef08a] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_-8px_20px_rgba(0,0,0,0.5),inset_0_4px_10px_rgba(255,255,255,0.3)] cursor-pointer flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          id="singing_bowl_striker"
        >
          {/* Inner dark water level representation */}
          <div className="absolute top-0 w-[96%] h-6 bg-[#271004]/70 rounded-b-xl border-t border-[#78350f]" />

          {/* Golden engravings */}
          <div className="text-amber-500/25 select-none font-serif text-lg tracking-widest pointer-events-none">
            禅 • 静
          </div>

          {/* Reflection lighting line */}
          <div className="absolute left-1/4 bottom-4 w-1/2 h-10 bg-gradient-to-t from-yellow-300/20 to-transparent rounded-full filter blur-md transform skew-x-12 opacity-80" />
        </div>
      </div>

      {/* Hammer visual guide */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={handleStrike}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-medium text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          执槌击磬
        </button>
      </div>

      {/* Science explanation details */}
      <div className="w-full max-w-sm mt-8 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
          <div className="text-xs text-gray-400 leading-relaxed font-sans">
            <span className="text-gray-200 font-semibold block mb-1">愈疗共振科学</span>
            西藏颂钵敲击后能产生悠长空鸣的微调泛音音圈，在身心深处引发“温和共鸣”，促使精神由焦虑紧绷瞬间向舒缓放松状态转化。常用于减压释扰、助眠理气、安抚焦躁心绪。
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// 3. BREATHING GUIDED (呼吸吐纳)
// ========================
interface BreathingStep {
  text: string;
  duration: number; // in seconds
  action: 'inhale' | 'hold' | 'exhale' | 'ready';
  color: string;
}

function BreathingView({ isDark }: { isDark: boolean }) {
  const steps: BreathingStep[] = [
    { text: '吸气... (收小腹)', duration: 4, action: 'inhale', color: 'border-emerald-500/80 text-emerald-400 bg-emerald-500/5' },
    { text: '屏息常静... (稳住状态)', duration: 4, action: 'hold', color: 'border-sky-500/80 text-sky-400 bg-sky-500/5' },
    { text: '缓慢呼气... (完全放松)', duration: 4, action: 'exhale', color: 'border-indigo-500/80 text-indigo-400 bg-indigo-500/5' }
  ];

  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const timerRef = useRef<any>(null);

  const activeStep = steps[currentStepIdx];

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // switch to next step
            setCurrentStepIdx(oldIdx => {
              const nextIdx = (oldIdx + 1) % steps.length;
              if (nextIdx === 0) {
                setCompletedCycles(c => c + 1);
              }
              const nextStep = steps[nextIdx];
              
              // Play a light ticking guide wave or sound
              if (nextStep.action === 'inhale') {
                audioEngine.playInstrumentNote('harp', 196.00); // Sol note
              } else if (nextStep.action === 'hold') {
                audioEngine.playInstrumentNote('bell', 329.63); // Mi note
              } else {
                audioEngine.playInstrumentNote('bowl', 220.00); // La note
              }

              setTimeLeft(nextStep.duration);
              return nextIdx;
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentStepIdx]);

  const toggleBreath = () => {
    if (!isRunning) {
      audioEngine.playInstrumentNote('harp', 220); // Gong strike
      setIsRunning(true);
      setCurrentStepIdx(0);
      setTimeLeft(4);
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStepIdx(0);
    setTimeLeft(4);
    setCompletedCycles(0);
  };

  // Compute ring animation details
  let ringScale = 1.0;
  if (isRunning) {
    if (activeStep.action === 'inhale') {
      // Scale from 1.0 up to 1.7
      ringScale = 1.0 + ((4 - timeLeft) / 4) * 0.7;
    } else if (activeStep.action === 'hold') {
      ringScale = 1.7;
    } else if (activeStep.action === 'exhale') {
      // Scale from 1.7 down to 1.0
      ringScale = 1.7 - ((4 - timeLeft) / 4) * 0.7;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] pb-4">
      {/* Tracker completed */}
      <div className="text-center mb-6">
        <p className="text-xs text-gray-500 tracking-wider">今日专注呼吸</p>
        <p className="text-lg font-sans font-bold text-emerald-400 mt-1">
          已呼吸 {completedCycles} 轮周期
        </p>
      </div>

      {/* Massive Glowing Breathing Circle */}
      <div className="w-64 h-64 flex items-center justify-center relative bg-slate-900/30 rounded-full border border-slate-800/40">
        {/* Animated fluid circle representing lungs */}
        <motion.div
          animate={{ scale: ringScale }}
          transition={{ ease: 'easeInOut', duration: 1.0 }}
          className={`absolute w-32 h-32 rounded-full border-[3px] shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center ${
            isRunning ? activeStep.color : 'border-gray-600 bg-slate-800/10'
          }`}
        />

        {/* Counter display in absolute center */}
        <div className="relative flex flex-col items-center z-10 select-none">
          {isRunning ? (
            <>
              <p className="text-xs text-gray-500 tracking-wider font-sans">当前状态</p>
              <p className="text-lg font-medium text-white/95 mt-1 text-center font-sans h-8 px-2 max-w-[130px]">
                {activeStep.text.split(' ')[0]}
              </p>
              <div className="text-4xl font-bold font-mono mt-2 text-sky-400">
                {timeLeft}s
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold tracking-wide text-gray-300 font-sans">准备就绪</p>
              <p className="text-[10px] text-gray-500 mt-1 text-center font-sans tracking-wide">
                1:1:1 平衡调息法
              </p>
            </>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={toggleBreath}
          className={`px-8 py-3 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/50 hover:bg-amber-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isRunning ? <><Pause className="w-4 h-4" /> 暂停调息</> : <><Play className="w-4 h-4" /> 开始引导</>}
        </button>

        {completedCycles > 0 || isRunning ? (
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Guidance box */}
      <div className="w-full max-w-sm mt-8 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <p className="text-xs text-emerald-500/90 font-medium mb-1.5 flex items-center gap-1 font-sans">
          等比调息法则
        </p>
        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
          应用古老经典的等比调息法：<span className="text-emerald-400 font-medium">吸气4秒</span>（收腹吸纳能量）、<span className="text-sky-400 font-medium">闭气4秒</span>（将氧分锁入丹田细胞）、<span className="text-indigo-400 font-medium">呼气4秒</span>（排出负面浊气和深层压力）。长期吐纳有助于迅速激活副交感神经，极速缓释焦躁。
        </p>
      </div>
    </div>
  );
}
