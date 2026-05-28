import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, ShieldCheck, Star, Sparkles, Volume2, Music, Lock, Heart, VolumeX, Moon, Target, Zap, Search, X, ChevronRight, Bookmark, Clock, Timer, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AudioVisualizer from './AudioVisualizer';
import { audioEngine } from '../utils/audioEngine';

interface Track {
  id: string;
  title: string;
  desc: string;
  duration: number; // in seconds
  purpose: 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin';
  isPremium: boolean;
  intensityLabel: string;
  audioKeyword: string;
}

interface PlayerProps {
  isPremiumUser: boolean;
  onOpenSubscribeModal: () => void;
  onTrackPlayingChange: (playing: boolean, trackName: string) => void;
  onPlaybackStateChange?: (state: {
    isPlaying: boolean;
    trackTitle: string;
    duration: number;
    progress: number;
    purpose: 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin';
  } | null) => void;
  theme?: 'day' | 'night';
}

export const tracksData: Record<'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin', Track[]> = {
  sleep: [
    { id: 'sleep_1', title: '极速入梦 • 舒缓摇篮潮汐', desc: '轻柔海浪呼吸共鸣，帮助缓和肢体张力势能，引导快速进入睡眠准备。', duration: 420, purpose: 'sleep', isPremium: false, intensityLabel: '温和缓流 (1级)', audioKeyword: 'bowl' },
    { id: 'sleep_2', title: '深沉归宿 • 星海深潜磁场', desc: '虚空安神声疗，解离冗余思绪纠缠，引领深沉无梦长眠。', duration: 600, purpose: 'sleep', isPremium: false, intensityLabel: '沉浸深空 (2级)', audioKeyword: 'bowl' },
    { id: 'sleep_3', title: '无漏冥安 • 寂灭万籁清音', desc: '纯透磬音，消除深夜多虑，抚平深夜郁闷与情绪惊扰。', duration: 900, purpose: 'sleep', isPremium: true, intensityLabel: '极静万物 (3级)', audioKeyword: 'bowl' }
  ],
  focus: [
    { id: 'focus_1', title: '阳春拂林 • 晨光鸟朝凝神', desc: '春林山泉鸟语微声，舒缓思维紧缩状态，温和辅助高品质阅读。', duration: 300, purpose: 'focus', isPremium: false, intensityLabel: '浅度清脑 (1级)', audioKeyword: 'piano' },
    { id: 'focus_2', title: '安稳坚实 • 古磬贯注心流', desc: '清亮馨罄轻缓慢敲，收拢分散的白日念头，稳定工作学习聚焦度。', duration: 480, purpose: 'focus', isPremium: true, intensityLabel: '深度聚焦 (2级)', audioKeyword: 'bell' },
    { id: 'focus_3', title: '心源灵动 • 原野星辉听涛', desc: '空旷而悠长的纯音粒子，阻绝周遭环境纷杂响声，大幅拉满脑力运行效率。', duration: 600, purpose: 'focus', isPremium: true, intensityLabel: '无垢思维 (3级)', audioKeyword: 'harp' }
  ],
  rest: [
    { id: 'rest_1', title: '幽谷清溪 • 息气行随自调', desc: '潺潺山泉融汇清纯和音，深层协调每一次呼气与吸气的悠长平衡。', duration: 360, purpose: 'rest', isPremium: false, intensityLabel: '自然呼吸 (1级)', audioKeyword: 'harp' },
    { id: 'rest_2', title: '慈怀宽柔 • 抚慰释躁音轴', desc: '温厚竖琴缓缓舒拨，包容消退日常焦虑与抑郁胸闷感。', duration: 450, purpose: 'rest', isPremium: false, intensityLabel: '情绪松弛 (2级)', audioKeyword: 'piano' },
    { id: 'rest_3', title: '雨后新原 • 乾坤神安放空', desc: '空灵铜磬慢鸣，抚平日常重荷压力，使精气神完美空灵轻快。', duration: 540, purpose: 'rest', isPremium: true, intensityLabel: '虚怀气舒 (3级)', audioKeyword: 'bowl' }
  ],
  energy: [
    { id: 'energy_1', title: '阴霾撕裂 • 晨光和煦沐浴', desc: '和风煦煦搭配高音微振，拂掉肢体沉闷感，唤回肌肉原本温热。', duration: 300, purpose: 'energy', isPremium: false, intensityLabel: '微温驱沉 (1级)', audioKeyword: 'bell' },
    { id: 'energy_2', title: '竹海洗炼 • 澄澈神智充能', desc: '竹浪微拂伴随欢快星铃，荡涤疲滞困顿并清凉提神。', duration: 420, purpose: 'energy', isPremium: true, intensityLabel: '朝气拉满 (2级)', audioKeyword: 'piano' },
    { id: 'energy_3', title: '风涌云散 • 精神浩然觉新', desc: '磅礴大气共振慢鸣，重塑意志生命张力，重拾往日高光动力。', duration: 500, purpose: 'energy', isPremium: true, intensityLabel: '意志觉新 (3级)', audioKeyword: 'harp' }
  ],
  wuyin: [
    { id: 'wuyin_1', title: '黄钟宫调 • 脾土宽泰和中', desc: '古法宫声调和脾胃，大吕纯正。温和平抑胸中郁结与挂虑焦躁，归元宽泰。', duration: 320, purpose: 'wuyin', isPremium: false, intensityLabel: '尊贵宫调 (1级)', audioKeyword: 'bowl' },
    { id: 'wuyin_2', title: '太簇商调 • 肺金清气息虑', desc: '传统商音肃降健肺，钟声悠远。平定悲观低落心气，理气顺心，速入清静。', duration: 420, purpose: 'wuyin', isPremium: false, intensityLabel: '清越商调 (2级)', audioKeyword: 'bell' },
    { id: 'wuyin_3', title: '姑洗角调 • 肝木生发平肝', desc: '角律通透疏肝解郁，木秀新发。疏导郁闷焦虑之无名虚火，身姿轻松，心情晴好。', duration: 480, purpose: 'wuyin', isPremium: true, intensityLabel: '生机角调 (3级)', audioKeyword: 'harp' },
    { id: 'wuyin_4', title: '林钟徵调 • 心火宁寂清安', desc: '徵音调和心火血脉，磬振天人。平抑心率多梦惊惧，宁定安顿，恢复祥和。', duration: 540, purpose: 'wuyin', isPremium: true, intensityLabel: '神安徵调 (4级)', audioKeyword: 'piano' },
    { id: 'wuyin_5', title: '南吕羽音 • 肾水潜藏涵气', desc: '羽声深邃滋养元精，海潮安魂。消除夜半慌张恐惧、精力耗竭，重锁深睡。', duration: 600, purpose: 'wuyin', isPremium: true, intensityLabel: '归底羽调 (5级)', audioKeyword: 'bowl' }
  ]
};

export default function MeditationPlayer({
  isPremiumUser,
  onOpenSubscribeModal,
  onTrackPlayingChange,
  onPlaybackStateChange,
  theme = 'night'
}: PlayerProps) {
  const [selectedCategory, setSelectedCategory] = useState<'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin'>('sleep');
  const [sliderLevel, setSliderLevel] = useState<number>(2); // Level 1, 2, 3 slider
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLossless, setIsLossless] = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // in seconds
  const [showFullLibraryModal, setShowFullLibraryModal] = useState(false);
  const [libraryFilterText, setLibraryFilterText] = useState('');
  
  // Elegant fading symbol overlay state on top of player panel
  const [fadingSymbol, setFadingSymbol] = useState<{ type: 'play' | 'pause'; id: number } | null>(null);
  const fadeCountRef = useRef(0);
  
  // Timer state for Free Users countdown (60s Limit)
  const [freeTimerLeft, setFreeTimerLeft] = useState(60);
  const [showTimedOutModal, setShowTimedOutModal] = useState(false);
  const [playMode, setPlayMode] = useState<'loop' | 'single' | 'random'>('loop');
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(false);

  // Auto-shutdown sleep timer states
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number>(0);
  const sleepTimerRef = useRef<any>(null);

  // Sync Web Audio High Fidelity (lossless EQ effect) on switch
  useEffect(() => {
    audioEngine.setHighFidelity(isLossless);
  }, [isLossless]);

  // Handle auto-shutdown timer
  useEffect(() => {
    if (isPlaying && sleepTimerSeconds > 0) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimerSeconds(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            audioEngine.stopAll();
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
            alert("⏰ 定时静修已圆满。愿您身心清澈！");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    }
    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [isPlaying, sleepTimerSeconds]);

  const formatSleepTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}分${secs < 10 ? '0' : ''}${secs}秒`;
  };

  // Compute active track based on category and level slider
  const categoryTracks = tracksData[selectedCategory];
  const activeTrack = categoryTracks[sliderLevel - 1] || categoryTracks[0];

  const progressTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Keep references to callbacks to prevent dependency-triggered infinite rendering
  const onTrackPlayingChangeRef = useRef(onTrackPlayingChange);
  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);

  useEffect(() => {
    onTrackPlayingChangeRef.current = onTrackPlayingChange;
  }, [onTrackPlayingChange]);

  useEffect(() => {
    onPlaybackStateChangeRef.current = onPlaybackStateChange;
  }, [onPlaybackStateChange]);

  // Sync state upward to main App tracking context
  useEffect(() => {
    onTrackPlayingChangeRef.current(isPlaying, isPlaying ? activeTrack.title : '');
  }, [isPlaying, activeTrack.title]);

  // Sync full playback status up to App for persistent floating widget
  useEffect(() => {
    if (onPlaybackStateChangeRef.current) {
      onPlaybackStateChangeRef.current({
        isPlaying,
        trackTitle: activeTrack.title,
        duration: activeTrack.duration,
        progress: playProgress,
        purpose: activeTrack.purpose,
        playMode: playMode
      });
    }
  }, [isPlaying, activeTrack.title, activeTrack.duration, activeTrack.purpose, playProgress, playMode]);

  // Global Event Listener for floating player actions
  useEffect(() => {
    const handleToggle = () => {
      handlePlayPause();
    };
    const handleNext = () => {
      handleNextTrack();
    };
    const handlePrev = () => {
      handlePrevTrack();
    };
    const handleRemotePlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        audioEngine.ensureContext();
        const { category, level } = customEvent.detail;
        if (category) {
          setSelectedCategory(category);
        }
        if (level !== undefined) {
          setSliderLevel(level);
        }
        setIsPlaying(true);
      }
    };
    const handleRemoteMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.mode) {
        setPlayMode(customEvent.detail.mode);
      }
    };

    window.addEventListener('zensound-toggle-play', handleToggle);
    window.addEventListener('zensound-next-track', handleNext);
    window.addEventListener('zensound-prev-track', handlePrev);
    window.addEventListener('zensound-remote-play', handleRemotePlay);
    window.addEventListener('zensound-remote-mode', handleRemoteMode);

    return () => {
      window.removeEventListener('zensound-toggle-play', handleToggle);
      window.removeEventListener('zensound-next-track', handleNext);
      window.removeEventListener('zensound-prev-track', handlePrev);
      window.removeEventListener('zensound-remote-play', handleRemotePlay);
      window.removeEventListener('zensound-remote-mode', handleRemoteMode);
    };
  }, [isPlaying, activeTrack, sliderLevel, selectedCategory, isPremiumUser, playMode]);

  // Reset progress when active track changes
  useEffect(() => {
    setPlayProgress(0);
    setFreeTimerLeft(60);
    // If playing, restart audioEngine and update
    if (isPlaying) {
      audioEngine.updateBrainwave(activeTrack.purpose, 0.4);
      audioEngine.playMelody(activeTrack.audioKeyword, 2400);
    }
  }, [activeTrack]);

  // Handle Playback triggers
  useEffect(() => {
    if (isPlaying) {
      // 1. Play central solfeggio healing beat in background programmatically
      audioEngine.updateBrainwave(activeTrack.purpose, 0.4);
      audioEngine.playMelody(activeTrack.audioKeyword, 2400);

      // 2. Playback progress bar simulation
      progressTimerRef.current = setInterval(() => {
        setPlayProgress(prev => {
          if (prev >= activeTrack.duration) {
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      // 3. Free Users 60 Sec Countdown Restriction rule implementation!
      if (!isPremiumUser) {
        countdownTimerRef.current = setInterval(() => {
          setFreeTimerLeft(prev => {
            if (prev <= 1) {
              // Pause immediately
              setIsPlaying(false);
              audioEngine.stopAll();
              setShowTimedOutModal(true);
              clearInterval(countdownTimerRef.current);
              return 60;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      audioEngine.stopAll();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isPlaying, activeTrack, isPremiumUser]);

  // Trigger ambient background noises automatically on music play based on target purpose and user subscription tier
  useEffect(() => {
    if (isPlaying) {
      if (activeTrack.purpose === 'sleep') {
        if (isPremiumUser) {
          audioEngine.setNoiseVolume('waves', true, 55);
          audioEngine.setNoiseVolume('rain', true, 25);
        } else {
          audioEngine.setNoiseVolume('rain', true, 25);
        }
      } else if (activeTrack.purpose === 'focus') {
        if (isPremiumUser) {
          audioEngine.setNoiseVolume('wind', true, 40);
        } else {
          audioEngine.setNoiseVolume('rain', true, 15);
        }
      } else if (activeTrack.purpose === 'rest') {
        if (isPremiumUser) {
          audioEngine.setNoiseVolume('wind', true, 35);
          audioEngine.setNoiseVolume('rain', true, 30);
        } else {
          audioEngine.setNoiseVolume('rain', true, 30);
        }
      } else if (activeTrack.purpose === 'energy') {
        if (isPremiumUser) {
          audioEngine.setNoiseVolume('campfire', true, 20);
          audioEngine.setNoiseVolume('wind', true, 15);
        } else {
          audioEngine.setNoiseVolume('rain', true, 20);
        }
      } else if (activeTrack.purpose === 'wuyin') {
        if (isPremiumUser) {
          audioEngine.setNoiseVolume('waves', true, 30);
        } else {
          audioEngine.setNoiseVolume('rain', true, 15);
        }
      }
    }
  }, [isPlaying, activeTrack, isPremiumUser]);

  const handlePlayPause = () => {
    audioEngine.ensureContext();
    // Premium tracks check
    if (activeTrack.isPremium && !isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);
    
    // Set custom fading symbol state
    fadeCountRef.current += 1;
    setFadingSymbol({ type: nextIsPlaying ? 'play' : 'pause', id: fadeCountRef.current });
  };

  const handleNextTrack = () => {
    audioEngine.ensureContext();
    const maxL = selectedCategory === 'wuyin' ? 5 : 3;
    if (playMode === 'single') {
      setPlayProgress(0);
      setFreeTimerLeft(60);
      setIsPlaying(true);
      return;
    }
    if (playMode === 'random') {
      const randLevel = Math.floor(Math.random() * maxL) + 1;
      setSliderLevel(randLevel);
      setPlayProgress(0);
      setFreeTimerLeft(60);
      setIsPlaying(true);
      return;
    }

    if (sliderLevel < maxL) {
      const nextLevel = sliderLevel + 1;
      if (categoryTracks[nextLevel - 1]?.isPremium && !isPremiumUser) {
        onOpenSubscribeModal();
        return;
      }
      setSliderLevel(nextLevel);
    } else {
      // Loop back to Level 1
      setSliderLevel(1);
    }
    setPlayProgress(0);
    setFreeTimerLeft(60);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    audioEngine.ensureContext();
    const maxL = selectedCategory === 'wuyin' ? 5 : 3;
    if (playMode === 'random') {
      const randLevel = Math.floor(Math.random() * maxL) + 1;
      setSliderLevel(randLevel);
      setPlayProgress(0);
      setFreeTimerLeft(60);
      setIsPlaying(true);
      return;
    }
    if (sliderLevel > 1) {
      setSliderLevel(sliderLevel - 1);
    } else {
      setSliderLevel(maxL);
    }
    setPlayProgress(0);
    setFreeTimerLeft(60);
    setIsPlaying(true);
  };

  const handleLosslessToggle = () => {
    if (!isPremiumUser) {
      // Prompt modal
      onOpenSubscribeModal();
      return;
    }
    setIsLossless(!isLossless);
  };

  // Human clean format for seconds -> MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isDark = theme === 'night';

  const categoryLabels = {
    sleep: { label: '加深睡眠', icon: 'Moon', desc: '安眠曲库：适合舒缓紧张，解绑白日挂碍，渐引入梦' },
    focus: { label: '心无旁骛', icon: 'Target', desc: '专注曲库：集聚灵敏注意力，屏蔽外界零星杂质干扰' },
    rest: { label: '空灵静心', icon: 'Heart', desc: '静心曲库：重塑绵密呼吸，抽离重荷杂思，恢复身体自在' },
    energy: { label: '活力苏醒', icon: 'Zap', desc: '提神曲库：粉碎午后犯困困倦，拉升正向精力和原动力' },
    wuyin: { label: '古法疗愈', icon: 'Music', desc: '古法疗愈曲库：传统古法五音共鸣，调和脾肺肝心肾五脏能量' }
  };

  return (
    <div className={`flex flex-col gap-4 pt-3 pb-8 px-4 transition-colors duration-300 ${
      isDark ? 'bg-[#0a0f1d]' : 'bg-[#faf9f6]'
    }`} id="player_tab_container">
      
      {/* CATEGORY BUTTON TABS SWITCHER */}
      <div className={`grid grid-cols-5 gap-0.5 p-1 rounded-xl shrink-0 ${
        isDark ? 'bg-slate-950/80 border border-slate-900' : 'bg-stone-200/50 border border-stone-200'
      }`}>
        {(Object.keys(categoryLabels) as Array<'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin'>).map(cat => {
          const isSelected = selectedCategory === cat;
          const details = categoryLabels[cat];
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSliderLevel(1);
                setIsPlaying(false);
              }}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? isDark 
                    ? 'bg-slate-900 border border-slate-800 text-amber-400 font-bold shadow-md' 
                    : 'bg-[#a67c52]/10 border border-[#a67c52]/20 text-[#a67c52] font-semibold shadow-xs'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span className="mb-0.5">
                {cat === 'sleep' && <Moon className="w-3.5 h-3.5" />}
                {cat === 'focus' && <Target className="w-3.5 h-3.5" />}
                {cat === 'rest' && <Heart className="w-3.5 h-3.5" />}
                {cat === 'energy' && <Zap className="w-3.5 h-3.5" />}
                {cat === 'wuyin' && <Music className="w-3.5 h-3.5" />}
              </span>
              <span className="text-[9.5px] font-sans truncate">{details.label}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE CATEGORY EXPLANATORY MESSAGE */}
      <div className={`py-2 px-3.5 rounded-xl border text-[10.5px] font-sans transition-all duration-350 flex flex-col sm:flex-row items-center justify-between gap-2 ${
        isDark ? 'bg-slate-950/45 border-slate-900/65 text-amber-500/85' : 'bg-[#faf6ed]/70 border-[#ecdcb9]/50 text-stone-600'
      }`}>
        <span className="text-left leading-relaxed">{categoryLabels[selectedCategory].desc}</span>
        <button
          onClick={() => {
            setLibraryFilterText('');
            setShowFullLibraryModal(true);
          }}
          className={`shrink-0 flex items-center gap-0.5 text-[9.5px] font-extrabold px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
            isDark 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
              : 'bg-[#a67c52]/10 border-[#a67c52]/20 text-[#a67c52] hover:bg-[#a67c52]/15'
          }`}
        >
          发现更多 <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* 1. VISUALIZER PANEL FRAME */}
      <div 
        onClick={() => handlePlayPause()}
        className={`relative w-full h-[175px] rounded-2xl overflow-hidden border transition-all shadow-xl flex flex-col justify-between p-4 flex-none cursor-pointer ${
          isDark 
            ? 'bg-gradient-to-b from-[#0c1629] to-[#040710] border-slate-900' 
            : 'bg-gradient-to-b from-stone-100 to-white border-stone-200'
        }`} id="player_panel">
        
        {/* Abs background starfield layout */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent bg-cover" />

        {/* Dynamic canvas visual nodes rendering */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AudioVisualizer 
            isPlaying={isPlaying} 
            color={isDark ? "rgba(217, 119, 6, 0.35)" : "rgba(166, 124, 82, 0.3)"} 
            waveCount={3} 
            speedMultiplier={sliderLevel * 0.7} 
          />
        </div>

        {/* Play/Pause Fading Symbol Overlay */}
        <AnimatePresence>
          {fadingSymbol && (
            <motion.div
              key={fadingSymbol.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.15, 1.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, times: [0, 0.25, 0.65, 1], ease: "easeOut" }}
              onAnimationComplete={() => {
                if (fadingSymbol?.id === fadeCountRef.current) {
                  setFadingSymbol(null);
                }
              }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <div className="p-4 rounded-full bg-black/40 backdrop-blur-xs border border-white/20 text-white shadow-2xl">
                {fadingSymbol.type === 'play' ? (
                  <Play className="w-10 h-10 fill-current text-white translate-x-0.5" />
                ) : (
                  <Pause className="w-10 h-10 text-white" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header tags inside frame */}
        <div className="relative flex justify-between items-center z-10 w-full font-sans" onClick={(e) => e.stopPropagation()}>
          <span className={`px-2.5 py-0.5 rounded-full border text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            isDark 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-[#a67c52]/10 text-[#a67c52] border-[#a67c52]/20'
          }`}>
            <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> {categoryLabels[selectedCategory].label} • {activeTrack.intensityLabel}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLosslessToggle();
            }}
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase font-sans tracking-wide transition-all flex items-center gap-1 cursor-pointer ${
              isLossless
                ? isDark
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow shadow-amber-500/10'
                  : 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm'
                : isDark ? 'bg-slate-9050 text-gray-500 border border-slate-800' : 'bg-stone-100 text-stone-400 border border-stone-200'
            }`}
          >
            FLAC 高拟真
          </button>
        </div>

        {/* Current title info */}
        <div className="relative text-center z-10 select-none pb-1">
          <h2 className={`text-sm font-black tracking-wide font-sans truncate px-3 ${
            isDark ? 'text-gray-100' : 'text-stone-850'
          }`}>
            {activeTrack.title}
          </h2>
          <p className={`text-[10.5px] font-sans mt-1 leading-relaxed px-5 line-clamp-1 ${
            isDark ? 'text-gray-400' : 'text-stone-500'
          }`}>
            {activeTrack.desc}
          </p>
        </div>

        {/* Timelines and progress bar */}
        <div className="relative z-10 w-full flex flex-col" id="player_timeline" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 mb-1">
            <span>{formatTime(playProgress)}</span>
            <span>{formatTime(activeTrack.duration)}</span>
          </div>

          <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800/85' : 'bg-stone-200'}`}>
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-[#a67c52] rounded-full transition-all duration-300" 
              style={{ width: `${(playProgress / activeTrack.duration) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* STANDARD FREE ACCORDANCE COUNTDOWN BANNER */}
      {!isPremiumUser && isPlaying && (
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-between text-[10.5px] text-orange-500 font-sans">
          <span>⚠️ 您的限免听本限流模式已开启</span>
          <span className="font-mono font-bold bg-orange-500/15 px-1.5 py-0.5 rounded border border-orange-500/20">
            限时 {freeTimerLeft} 秒
          </span>
        </div>
      )}

      {/* 2. THE HIGH-CRAFT TACTILE EFFICACY STRENGTH SLIDER */}
      <div className={`p-4 rounded-xl border transition-all ${
        isDark ? 'bg-slate-950/60 border-slate-900 shadow-inner' : 'bg-white border-stone-200/80 shadow-sm'
      }`} id="efficacy_intensity_slider_box">
        <div className="flex justify-between items-center mb-1.5 font-sans">
          <span className={`text-[11px] font-bold flex items-center gap-1 ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}>
            <Volume2 className="w-3.5 h-3.5" /> 调节此功效的声音沉浸感 (强度)
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-slate-900 text-amber-400' : 'bg-[#a67c52]/10 text-[#a67c52]'
          }`}>
            {activeTrack?.intensityLabel || '1级'}
          </span>
        </div>
        
        <p className={`text-[10px] font-sans mb-3 line-clamp-1 leading-normal ${
          isDark ? 'text-gray-500' : 'text-stone-450'
        }`}>
          滑动拉升或降低声场，音疗将为您自适应调节配乐结构
        </p>

        {/* Tactile Range Slider Input representing different items */}
        <div className="relative py-2 px-1">
          <input
            type="range"
            min="1"
            max={selectedCategory === 'wuyin' ? "5" : "3"}
            step="1"
            value={sliderLevel}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (categoryTracks[val - 1]?.isPremium && !isPremiumUser) {
                onOpenSubscribeModal();
                return;
              }
              setSliderLevel(val);
            }}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-amber-500/10 accent-amber-500 hover:accent-amber-400 focus:outline-none"
            id="intensity_slider"
          />
          
          <div className="flex justify-between text-[9px] font-sans text-gray-500 px-1 mt-1.5 selection:bg-transparent">
            {Array.from({ length: selectedCategory === 'wuyin' ? 5 : 3 }).map((_, idx) => {
              const lvl = idx + 1;
              const isSelected = sliderLevel === lvl;
              let label = `${lvl}级`;
              if (selectedCategory === 'wuyin') {
                if (lvl === 1) label = '宫脾';
                else if (lvl === 2) label = '商肺';
                else if (lvl === 3) label = '角肝';
                else if (lvl === 4) label = '徵心';
                else if (lvl === 5) label = '羽肾';
              } else {
                if (lvl === 1) label = '1级 缓流';
                else if (lvl === 2) label = '2级 沉浸';
                else if (lvl === 3) label = '3级 极致';
              }
              return (
                <span
                  key={lvl}
                  onClick={() => {
                    if (categoryTracks[idx]?.isPremium && !isPremiumUser) {
                      onOpenSubscribeModal();
                      return;
                    }
                    setSliderLevel(lvl);
                  }}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'text-amber-500 font-extrabold scale-105' : 'text-gray-400 font-normal hover:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. PROFESSIONAL SLEEP TIMER WIDGET */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-950/60 border-slate-900 shadow-inner' : 'bg-white border-stone-200/80 shadow-sm'
      }`} id="sleep_timer_box">
        <div className="flex justify-between items-center mb-1.5 font-sans">
          <span className={`text-[11px] font-extrabold flex items-center gap-1.5 ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}>
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 定时关闭
          </span>
          {sleepTimerSeconds > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
              倒计时: {formatSleepTimer(sleepTimerSeconds)}
            </span>
          )}
        </div>
        
        {/* Shortcut Quick options grid */}
        <div className="grid grid-cols-5 gap-1 text-[10.5px] font-sans">
          {[
            { label: '关闭', value: 0 },
            { label: '10分', value: 10 },
            { label: '20分', value: 20 },
            { label: '30分', value: 30 },
            { label: '60分', value: 60 }
          ].map(opt => {
            const isSelected = (opt.value === 0 && sleepTimerSeconds === 0) || 
                              (opt.value !== 0 && Math.abs(sleepTimerSeconds - opt.value * 60) < 10);
            return (
              <button
                key={opt.label}
                onClick={() => {
                  if (opt.value === 0) {
                    setSleepTimerSeconds(0);
                  } else {
                    setSleepTimerSeconds(opt.value * 60);
                  }
                }}
                className={`py-1 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                  isSelected
                    ? isDark
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-extrabold'
                      : 'bg-[#a67c52]/10 border-[#a67c52]/40 text-[#a67c52] font-extrabold'
                    : isDark
                      ? 'bg-slate-900/30 border-slate-800 text-gray-400 hover:text-gray-200'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* COUNTDOWN TIMED OUT UPGRADE DIALOG MODAL */}
      <AnimatePresence>
        {showTimedOutModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 selection:bg-transparent">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0d1629] border border-orange-500/30 rounded-2xl p-6 shadow-2xl text-center font-sans"
            >
              <div className="w-14 h-14 rounded-full bg-orange-500/10 mx-auto flex items-center justify-center mb-4 border border-orange-500/20">
                <Volume2 className="w-6 h-6 text-orange-400" />
              </div>

              <h3 className="text-sm font-black text-gray-100 font-sans">今日体验时限已到</h3>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed font-sans font-normal font-sans">
                普通免费用户每日享有舒心声场试听 60 秒限流，无法解锁全能神贯注特辑、以及多功能多档无限制配比。
              </p>

              <div className="my-5 p-3.5 bg-[#070b13] border border-slate-900 rounded-xl text-left flex flex-col gap-1 text-[11px] text-gray-400 justify-center font-sans">
                <p className="text-amber-500 font-bold mb-1.5">高级专属专享终身，只需一月 ¥ 19.9：</p>
                <p>✓ 100% 畅顺极致无限播放，无流限干扰</p>
                <p>✓ 解锁 PRO 付费尊贵版 5级 古法疗愈和中乐</p>
                <p>✓ 支持多地云数据库安全自动同步加密</p>
              </div>

              <div className="flex flex-col gap-2 font-sans">
                <button
                  onClick={() => {
                    setShowTimedOutModal(false);
                    onOpenSubscribeModal();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 font-semibold text-xs text-white shadow-xl cursor-pointer hover:from-orange-400"
                >
                  一键升级，解除限制
                </button>
                <button
                  onClick={() => setShowTimedOutModal(false)}
                  className="w-full py-2 rounded-xl text-xs text-gray-500 hover:text-gray-400 cursor-pointer"
                >
                  继续随便体验
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECOND-LEVEL DETAILED COHERENT MUSIC LIBRARY OVERLAY MODAL */}
      <AnimatePresence>
        {showFullLibraryModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-55 flex items-center justify-center p-4 selection:bg-transparent">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl relative border flex flex-col max-h-[80vh] ${
                isDark 
                  ? 'bg-[#0f172a] border-slate-800 text-gray-100' 
                  : 'bg-white border-stone-250 text-stone-900'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-sky-500 animate-pulse" />
                  <h3 className="text-sm font-extrabold font-sans">
                    {selectedCategory === 'sleep' ? '安眠曲库' : selectedCategory === 'focus' ? '专注曲库' : selectedCategory === 'rest' ? '静心曲库' : selectedCategory === 'energy' ? '提神曲库' : '五音健康曲库'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowFullLibraryModal(false);
                    setLibraryFilterText('');
                  }}
                  className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-stone-100 text-stone-550'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* FILTER SEARCH INPUT BOX */}
              <div className="relative mb-3 flex-none font-sans">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索想听的声音或曲名..."
                  value={libraryFilterText}
                  onChange={(e) => setLibraryFilterText(e.target.value)}
                  className={`w-full text-[11px] pl-8.5 pr-8 py-2 rounded-xl focus:outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-900/80 border border-slate-800 focus:border-amber-500/50 text-gray-200' 
                      : 'bg-[#faf6ed] border border-[#ecdcb9] focus:border-[#a67c52] text-[#4e3629]'
                  }`}
                />
                {libraryFilterText && (
                  <button
                    onClick={() => setLibraryFilterText('')}
                    className="absolute right-3 top-2.5 text-gray-450 hover:text-gray-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* TRACKS LIST CONTENT BODY */}
              <div className="overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin flex-1 font-sans font-normal">
                {categoryTracks
                  .filter(t => 
                    t.title.toLowerCase().includes(libraryFilterText.toLowerCase()) || 
                    t.desc.toLowerCase().includes(libraryFilterText.toLowerCase())
                  )
                  .map((track, subIdx) => {
                    const isSelectedAndPlaying = selectedCategory === track.purpose && sliderLevel === (subIdx + 1) && isPlaying;
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          if (track.isPremium && !isPremiumUser) {
                            onOpenSubscribeModal();
                            return;
                          }
                          setSliderLevel(subIdx + 1);
                          setIsPlaying(true);
                          setShowFullLibraryModal(false);
                          setLibraryFilterText('');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          selectedCategory === track.purpose && sliderLevel === (subIdx + 1)
                            ? isDark 
                              ? 'border-amber-500 bg-amber-950/20 text-white' 
                              : 'border-[#a67c52] bg-[#a67c52]/10 text-[#a67c52] font-bold'
                            : isDark 
                              ? 'border-slate-800 bg-slate-900/30 hover:bg-slate-900/70 text-gray-300' 
                              : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/50 text-stone-850'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[11.5px] font-extrabold truncate ${
                            selectedCategory === track.purpose && sliderLevel === (subIdx + 1)
                              ? 'text-amber-500' 
                              : isDark ? 'text-gray-200' : 'text-stone-850'
                          }`}>
                            {track.title}
                          </span>
                          <div className="flex items-center gap-1">
                            {track.isPremium && (
                              <span className="text-[7px] border border-amber-500/40 text-amber-500 px-1 rounded font-black scale-90">
                                PRO
                              </span>
                            )}
                            {isSelectedAndPlaying && (
                              <span className="flex gap-0.5 h-2 items-end">
                                <span className="w-0.5 bg-amber-500 animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                                <span className="w-0.5 bg-amber-500 animate-bounce h-1.5" style={{ animationDelay: '0.3s' }} />
                                <span className="w-0.5 bg-amber-500 animate-bounce h-2" style={{ animationDelay: '0.5s' }} />
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-[10px] leading-relaxed line-clamp-2 ${
                          isDark ? 'text-gray-500' : 'text-stone-500'
                        }`}>
                          {track.desc}
                        </p>
                        <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-slate-900/10 text-[9px] text-gray-400 font-mono">
                          <span className="flex items-center gap-0.5">
                            <Bookmark className="w-2.5 h-2.5 text-gray-500" />
                            {track.intensityLabel}
                          </span>
                          <span>{formatTime(track.duration)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* PREMIUM UPSALE BUTTON IN MODAL */}
              {!isPremiumUser && (
                <div 
                  onClick={() => {
                    setShowFullLibraryModal(false);
                    onOpenSubscribeModal();
                  }}
                  className="mt-3.5 p-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-500/15"
                >
                  <div className="text-[10.5px] font-sans text-left">
                    <p className="font-bold text-amber-600">加入高级无损舱</p>
                    <p className="opacity-75 text-[9px] mt-0.5">畅享包括五音、高阶辅学在内全部音轨</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
