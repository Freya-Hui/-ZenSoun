import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, CloudRain, Waves, Wind, Flame, Sun, Moon, Sparkles, Lock, Play, Pause } from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';

export interface NoiseItem {
  id: string;
  name: string;
  icon: 'rain' | 'waves' | 'wind' | 'campfire' | 'birds' | 'cicadas';
  volume: number;
  isActive: boolean;
}

interface WhiteNoiseSliderProps {
  isPremiumUser: boolean;
  onOpenSubscribeModal: () => void;
  theme: 'day' | 'night';
  noises: NoiseItem[];
  onNoisesChange: (newNoises: NoiseItem[]) => void;
}

export default function WhiteNoiseSlider({
  isPremiumUser,
  onOpenSubscribeModal,
  theme,
  noises,
  onNoisesChange
}: WhiteNoiseSliderProps) {
  const isDark = theme === 'night';
  
  // Keep track of which noise is being actively previewed
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Individual pre-preview play toggle
  const handleTogglePreview = (n: NoiseItem) => {
    audioEngine.ensureContext();
    window.dispatchEvent(new CustomEvent('zensound-pause'));
    
    // Premium locking for premium noises
    if (n.id !== 'rain' && n.id !== 'wind' && !isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }

    if (previewingId === n.id) {
      // Turn off preview
      setPreviewingId(null);
      audioEngine.setNoiseVolume(n.id, false, 0);
    } else {
      // Turn off prior preview if any
      if (previewingId) {
        audioEngine.setNoiseVolume(previewingId, false, 0);
      }
      // Turn on this preview
      setPreviewingId(n.id);
      audioEngine.setNoiseVolume(n.id, true, Math.max(n.volume, 40));
      
      // Auto-turn off preview after 5 seconds to match "快速试听预览"
      setTimeout(() => {
        setPreviewingId(curr => {
          if (curr === n.id) {
            audioEngine.setNoiseVolume(n.id, n.isActive, n.volume);
            return null;
          }
          return curr;
        });
      }, 5000);
    }
  };

  const handleNoiseCheckboxToggle = (id: string) => {
    audioEngine.ensureContext();
    window.dispatchEvent(new CustomEvent('zensound-pause'));
    const target = noises.find(n => n.id === id);
    if (!target) return;

    if (id !== 'rain' && id !== 'wind' && !isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }

    const updated = noises.map(n => {
      if (n.id === id) {
        const nextActive = !n.isActive;
        audioEngine.setNoiseVolume(n.id, nextActive, n.volume);
        return { ...n, isActive: nextActive };
      }
      return n;
    });

    onNoisesChange(updated);
    if (previewingId === id) setPreviewingId(null);
  };

  const handleSliderVolumeChange = (id: string, vol: number) => {
    audioEngine.ensureContext();
    window.dispatchEvent(new CustomEvent('zensound-pause'));
    const target = noises.find(n => n.id === id);
    if (!target) return;

    if (id !== 'rain' && id !== 'wind' && !isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }

    const updated = noises.map(n => {
      if (n.id === id) {
        // Automatically make active if user drags volume above 0
        const nextActive = vol > 0 ? true : n.isActive;
        audioEngine.setNoiseVolume(n.id, nextActive, vol);
        return { ...n, volume: vol, isActive: nextActive };
      }
      return n;
    });

    onNoisesChange(updated);
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex flex-col mb-3 select-none text-left">
        <p className={`text-xs font-semibold tracking-wider mb-2 flex items-center gap-1.5 uppercase ${
          isDark ? 'text-sky-400' : 'text-amber-800'
        }`}>
          <Volume2 className="w-3.5 h-3.5" /> 调谐自然声能
        </p>
        
        <p className={`text-[10px] leading-relaxed font-sans ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
          精选高保真自然白噪音混响，营造温柔包容的声学环境。底层声疗物理机制：点选方框开启对应背景声音，通过微调右侧滑块控制自定灌注声量，阻断外界杂音，构建宁静包容的安全耳室。
        </p>
      </div>

      {/* 
        SUPABASE INTEGRATION ENTRYPOINT:
        In the future, we can load dynamic white noises stored in Supabase Storage.
        For example:
        const { data } = await supabase.storage.from('white-noises').list();
        const audioUrl = supabase.storage.from('white-noises').getPublicUrl(item.path);
        Then feed these URLs to our Web Audio API context channels dynamically.
      */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5" id="modular_white_noise_grid">
        {noises.map((n) => {
          const isFree = n.id === 'rain' || n.id === 'wind';
          const isLocked = !isFree && !isPremiumUser;
          
          return (
            <div 
              key={n.id}
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${
                n.isActive && !isLocked
                  ? isDark
                    ? 'border-sky-500/30 bg-gradient-to-r from-[#0a1120] to-[#111c34]/40 shadow-md ring-1 ring-sky-500/10' 
                    : 'border-[#c4b295] bg-[#fdfaf5] shadow-sm'
                  : isDark
                    ? 'border-slate-850 bg-slate-900/30 text-gray-400'
                    : 'border-[#dacdb9] bg-[#f4ebd9]/30 text-[#826e5e]'
              }`}
            >
              {/* Premium Lock overlay badge if locked */}
              {isLocked && (
                <div className="absolute inset-0 bg-[#000]/5 backdrop-blur-[0.5px] flex items-center justify-end pr-3 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-amber-500/15 text-amber-600 border border-amber-500/35 uppercase flex items-center gap-0.5 pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenSubscribeModal(); }}>
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                </div>
              )}

              {/* Box Checkbox Trigger & Sound Icon - CLICKABLE TO TOGGLE SOUND */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoiseCheckboxToggle(n.id);
                }}
                disabled={isLocked}
                className={`w-11 h-11 shrink-0 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative border ${
                  n.isActive && !isLocked
                    ? isDark
                      ? 'bg-sky-500/15 border-sky-400/30 text-sky-400 font-extrabold shadow-sm'
                      : 'bg-[#a67c52]/10 border-[#a67c52]/40 text-[#a67c52] font-black shadow-sm'
                    : isDark
                      ? 'bg-slate-800/40 border-slate-705 text-slate-500 hover:bg-slate-800/60'
                      : 'bg-[#ebdcb9]/45 border-[#dacdb9]/50 text-[#8e7968] hover:bg-[#ebdcb9]/80'
                }`}
                title="点击加载/卸载此音源"
              >
                {n.icon === 'rain' && <CloudRain className="w-5 h-5" />}
                {n.icon === 'waves' && <Waves className="w-5 h-5" />}
                {n.icon === 'wind' && <Wind className="w-5 h-5" />}
                {n.icon === 'campfire' && <Flame className="w-5 h-5" />}
                {n.icon === 'birds' && <Sun className="w-5 h-5" />}
                {n.icon === 'cicadas' && <Moon className="w-5 h-5" />}

                {/* Light pulse dot if active */}
                {n.isActive && !isLocked && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className="text-[7.5px] font-bold mt-0.5 opacity-80 scale-90">
                  {n.isActive && !isLocked ? '已开' : '点击'}
                </span>
              </button>

              {/* Slider Controller Body */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1 select-none">
                  <span className={`text-[11.5px] font-extrabold font-sans ${
                    n.isActive ? (isDark ? 'text-white' : 'text-[#4e3629]') : (isDark ? 'text-gray-400' : 'text-[#826e5e]')
                  }`}>
                    {n.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 select-none">
                  {/* Slider - works perfectly without parent-level event clash */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={n.volume}
                    disabled={isLocked}
                    onChange={(e) => handleSliderVolumeChange(n.id, Number(e.target.value))}
                    className={`flex-1 h-1 rounded-full appearance-none cursor-pointer transition-all ${
                      !isLocked
                        ? isDark 
                          ? 'bg-slate-850 accent-sky-400' 
                          : 'bg-[#ebdcb9] accent-[#a67c52]'
                        : 'bg-slate-800/10 opacity-30 cursor-not-allowed'
                    }`}
                  />
                  <span className="text-[9.5px] hover:scale-105 transition-transform font-mono w-7 text-right shrink-0">
                    {n.isActive && !isLocked ? `${n.volume}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
