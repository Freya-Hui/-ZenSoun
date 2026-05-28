import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sparkles, Heart, Share2, Save, Music, AlertTriangle, ArrowRight, ShieldCheck, CloudRain, Waves, Wind, Flame, Lock } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { PurposeType, NoiseItem, SoundRecipe } from '../types';

interface SynthesizerProps {
  isPremiumUser: boolean;
  onOpenSubscribeModal: () => void;
  onSaveRecipe: (recipe: SoundRecipe) => void;
  onShareRecipeToCommunity: (recipe: SoundRecipe) => void;
  theme?: 'day' | 'night';
}

export default function CustomSynthesizer({
  isPremiumUser,
  onOpenSubscribeModal,
  onSaveRecipe,
  onShareRecipeToCommunity,
  theme = 'day'
}: SynthesizerProps) {
  const isDark = theme === 'night';
  // Purpose definitions matching silent Brainwaves
  const purposes: { val: PurposeType; label: string; meaning: string; desc: string; color: string }[] = [
    { 
      val: 'sleep', 
      label: '深睡助眠', 
      meaning: '引导身体彻底放松、进入深沉无梦长眠', 
      desc: '融合深柔的声学共鸣，安抚紧张的感官与神经，引导舒眠沉潜。',
      color: 'from-indigo-900/60 to-purple-950/60 border-indigo-500/30 text-indigo-300'
    },
    { 
      val: 'focus', 
      label: '澄澈专注', 
      meaning: '收拢散沙思绪，长时间冷静投入工作学习', 
      desc: '融合高凝聚性的静定声流，隔离纷杂的外界杂音扰动，强化专注。',
      color: 'from-teal-900/40 to-emerald-950/40 border-teal-500/30 text-emerald-300'
    },
    { 
      val: 'rest', 
      label: '正念静心', 
      meaning: '抽离焦虑心茧，放空大脑回归自在轻盈', 
      desc: '融合温润的呼吸节奏声学，抚平胸口烦燥，舒张体内紧绷心结。',
      color: 'from-sky-900/40 to-cyan-950/40 border-sky-500/30 text-sky-300'
    },
    { 
      val: 'energy', 
      label: '振奋释压', 
      meaning: '突破精神低潮困顿，重塑脑力活力状态', 
      desc: '融合清越的音浪共振，荡涤淤积的沉闷与精神低落，提神释压。',
      color: 'from-amber-950/40 to-orange-950/40 border-amber-500/30 text-amber-300'
    }
  ];

  const initialNoises: NoiseItem[] = [
    { id: 'rain', name: '寂雨森林', icon: 'rain', volume: 40, isActive: false },
    { id: 'waves', name: '涌动潮汐', icon: 'waves', volume: 30, isActive: false },
    { id: 'wind', name: '山谷松风', icon: 'wind', volume: 20, isActive: false },
    { id: 'campfire', name: '炽热篝火', icon: 'campfire', volume: 50, isActive: false }
  ];

  const [noises, setNoises] = useState<NoiseItem[]>(initialNoises);
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeType>('rest');
  const [instrument, setInstrument] = useState<'harp' | 'bell' | 'bowl' | 'piano'>('bowl');
  
  const [isMelodyActive, setIsMelodyActive] = useState(false);
  const [isBinauralActive, setIsBinauralActive] = useState(false);
  
  // Recipe Naming State
  const [recipeName, setRecipeName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPaywallAlert, setShowPaywallAlert] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');

  // Apply real-time changes to the programmatic audioEngine
  useEffect(() => {
    // Sync noise volumes
    noises.forEach(n => {
      audioEngine.setNoiseVolume(n.id, n.isActive, n.volume);
    });
  }, [noises]);

  useEffect(() => {
    // Sync Binaural beats state mapped silently to purpose
    if (isBinauralActive) {
      audioEngine.updateBrainwave(selectedPurpose);
    } else {
      audioEngine.stopBrainwave();
    }
  }, [selectedPurpose, isBinauralActive]);

  useEffect(() => {
    // Sync Melody instruments
    if (isMelodyActive) {
      audioEngine.playMelody(instrument, 2800);
    } else {
      audioEngine.stopMelody();
    }
  }, [isMelodyActive, instrument]);

  // Clean-up when synthesizer unmounts
  useEffect(() => {
    return () => {
      // Don't stop all audio context in case track player is still running on separate node
    };
  }, []);

  const handleNoiseToggle = (id: string) => {
    audioEngine.ensureContext();
    if (id !== 'rain' && !isPremiumUser) {
      triggerPaywall('解锁高级环境白噪音混合伴音（潮汐、松风、篝火）');
      return;
    }
    setNoises(prev => prev.map(n => {
      if (n.id === id) {
        const nextState = !n.isActive;
        return { ...n, isActive: nextState };
      }
      return n;
    }));
  };

  const handleVolumeChange = (id: string, vol: number) => {
    audioEngine.ensureContext();
    if (id !== 'rain' && !isPremiumUser) {
      triggerPaywall('调节高级环境白噪音伴音声场比例');
      return;
    }
    setNoises(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, volume: vol };
      }
      return n;
    }));
  };

  const triggerPaywall = (reason: string) => {
    setPaywallReason(reason);
    setShowPaywallAlert(true);
  };

  // Safe melody generation handler checking subscription
  const handleMelodyToggle = () => {
    audioEngine.ensureContext();
    if (!isPremiumUser) {
      triggerPaywall('使用「定制随机旋律生成器」定制专属大脑疗愈音轨');
      return;
    }
    const nextState = !isMelodyActive;
    setIsMelodyActive(nextState);
    if (nextState) {
      audioEngine.playMelody(instrument, 2800);
    } else {
      audioEngine.stopMelody();
    }
  };

  const handleOpenSaveDialog = () => {
    if (!isPremiumUser) {
      triggerPaywall('保存/分享自定义星空愈疗配方数据');
      return;
    }
    // Generate default poetical name if empty
    const currentMeaning = purposes.find(p => p.val === selectedPurpose)?.label || '静音';
    const noiseNames = noises.filter(n => n.isActive).map(n => n.name.slice(2)).join('');
    setRecipeName(`${currentMeaning}•${noiseNames || '空林禅语'}`);
    setShowSaveDialog(true);
  };

  const executeSave = () => {
    if (!recipeName.trim()) return;

    const newRecipe: SoundRecipe = {
      id: `custom_${Date.now()}`,
      name: recipeName.trim(),
      creator: '我 (本地客端)',
      isCustom: true,
      noises: noises.map(n => ({ ...n })),
      purpose: selectedPurpose,
      purposeLabel: purposes.find(p => p.val === selectedPurpose)?.label || '调息',
      melodyInstrument: instrument,
      tempo: isMelodyActive ? 'ambient' : 'none',
      likesCount: 0,
      isLiked: false,
      isSaved: true,
      isPremium: true,
      description: `针对「${purposes.find(p => p.val === selectedPurpose)?.label}」精配，融入了「${instrument === 'bowl' ? '西藏磬钵' : instrument === 'harp' ? '愈疗竖琴' : instrument === 'bell' ? '空灵磬铃' : '优雅钢琴'}」的随机漫游旋律。`
    };

    onSaveRecipe(newRecipe);
    setShowSaveDialog(false);
  };

  const executeShare = () => {
    if (!recipeName.trim()) return;

    const sharedRecipe: SoundRecipe = {
      id: `custom_${Date.now()}`,
      name: recipeName.trim(),
      creator: '疗愈旅人',
      isCustom: true,
      noises: noises.map(n => ({ ...n })),
      purpose: selectedPurpose,
      purposeLabel: purposes.find(p => p.val === selectedPurpose)?.label || '调息',
      melodyInstrument: instrument,
      tempo: isMelodyActive ? 'ambient' : 'none',
      likesCount: 1,
      isLiked: false,
      isSaved: false,
      isPremium: true,
      description: `由用户自行调试的深度声波配方。主奏 ${instrument === 'bowl' ? '颂钵' : instrument === 'harp' ? '竖琴' : instrument === 'bell' ? '星铃' : '钢琴'} 配合森林噪音。`
    };

    onShareRecipeToCommunity(sharedRecipe);
    setShowSaveDialog(false);
  };

  const activePurposeObj = purposes.find(p => p.val === selectedPurpose);

  return (
    <div className={`flex flex-col gap-5 pt-3 pb-8 px-4 transition-colors duration-300 ${isDark ? 'bg-[#0a0f1d] text-gray-200' : 'bg-[#faf9f6] text-stone-850'}`} id="synth_container">
      {/* 1. PURPOSE MEANING CHOOSE */}
      <div>
        <p className={`text-xs font-semibold tracking-wider mb-2.5 flex items-center gap-1.5 uppercase ${isDark ? 'text-sky-400' : 'text-sky-700 font-bold'}`}>
          <Sparkles className="w-3.5 h-3.5" /> 第一步：赋予音乐宁静意义
        </p>
        <div className="grid grid-cols-2 gap-2" id="synth_purposes_grid">
          {purposes.map(p => {
            const isSelected = selectedPurpose === p.val;
            return (
              <button
                key={p.val}
                onClick={() => {
                  setSelectedPurpose(p.val);
                  // Ensure binaural updates instantly if active
                  if (isBinauralActive) audioEngine.updateBrainwave(p.val);
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 flex flex-col justify-between h-[100px] ${
                  isSelected
                    ? isDark
                      ? 'bg-gradient-to-br from-sky-950/60 to-purple-950/60 border-sky-400/80 shadow-[0_4px_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/30'
                      : 'bg-sky-50 border-sky-400 text-sky-900 shadow-sm'
                    : isDark
                      ? 'bg-slate-900/50 border-slate-800/80 text-gray-300 hover:border-slate-700/60 hover:bg-slate-900/80'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs font-bold font-sans ${isSelected ? (isDark ? 'text-sky-300' : 'text-sky-850 font-extrabold') : (isDark ? 'text-gray-300' : 'text-stone-700')}`}>
                    {p.label}
                  </span>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />}
                </div>
                <div className="mt-1 flex flex-col">
                  <span className={`text-[10px] font-sans leading-tight line-clamp-2 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                    {p.meaning}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explain silent brainwave physics */}
        {activePurposeObj && (
          <div className={`mt-2.5 p-3 rounded-xl border flex flex-col ${isDark ? 'bg-slate-950/60 border-slate-900' : 'bg-[#e2e8f0]/40 border-stone-200'}`}>
            <span className={`text-[11px] font-medium font-sans mb-1 flex items-center gap-1 ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              今日定心声能引导：
            </span>
            <span className={`text-[10.5px] font-sans leading-relaxed ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
              {activePurposeObj.desc} 已和您下方的合成音频自适应。
            </span>
          </div>
        )}
      </div>

      {/* 2. THE WHITE NOISE LIBRARY */}
      <div>
        <p className={`text-xs font-semibold tracking-wider mb-2.5 flex items-center gap-1.5 uppercase ${isDark ? 'text-sky-400' : 'text-sky-700 font-bold'}`}>
          <Volume2 className="w-3.5 h-3.5" /> 第二步：激活环境白噪音库
        </p>
        <div className="space-y-2.5" id="noise_library_list">
          {noises.map(n => (
            <div 
              key={n.id}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                n.isActive 
                  ? isDark
                    ? 'border-sky-5050/30 bg-gradient-to-r from-slate-900/70 to-sky-950/20' 
                    : 'border-sky-3050 bg-sky-50/50 shadow-sm text-sky-950 font-bold'
                  : isDark
                    ? 'border-slate-800/60 bg-slate-9050/50'
                    : 'border-stone-200 bg-white'
              }`}
            >
              {/* Checkbox trigger button */}
              <button
                onClick={() => handleNoiseToggle(n.id)}
                className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  n.isActive
                    ? isDark
                      ? 'bg-sky-500/15 border border-sky-400/40 text-sky-400'
                      : 'bg-sky-100 border border-sky-300 text-sky-700 font-extrabold shadow-sm'
                    : isDark
                      ? 'bg-slate-800/40 border border-transparent hover:bg-slate-800/70 text-slate-500'
                      : 'bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-400'
                }`}
              >
                {n.id === 'rain' && <CloudRain className="w-5 h-5" />}
                {n.id === 'waves' && <Waves className="w-5 h-5" />}
                {n.id === 'wind' && <Wind className="w-5 h-5" />}
                {n.id === 'campfire' && <Flame className="w-5 h-5" />}
              </button>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold font-sans flex items-center gap-1.5 ${n.isActive ? (isDark ? 'text-white' : 'text-stone-850') : (isDark ? 'text-gray-400' : 'text-stone-500')}`}>
                    {n.name}
                    {!isPremiumUser && <Lock className="w-2.5 h-2.5 text-amber-500 inline" />}
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-stone-500'}`}>
                    {n.isActive ? `${n.volume}%` : !isPremiumUser ? 'PRO 专享' : '未加载'}
                  </span>
                </div>
                
                {/* Volume slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={n.volume}
                  disabled={!n.isActive}
                  onChange={(e) => handleVolumeChange(n.id, Number(e.target.value))}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800/80 transition-opacity ${
                    n.isActive 
                      ? 'accent-sky-400 opacity-100' 
                      : 'accent-slate-600 opacity-30 cursor-not-allowed'
                  }`}
                  style={{ background: !n.isActive ? '' : isDark ? '' : '#e2e8f0' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. RANDOM MELODY SYNTHESIZER SEQUENCER */}
      <div className={`p-4 rounded-xl border relative overflow-hidden ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-stone-200 bg-white shadow-sm'}`} id="melody_box">
        {/* Ornate absolute grid blur */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/5 rounded-full filter blur-xl pointer-events-none" />

        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5">
            <Music className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
            <span className={`text-xs font-bold font-sans ${isDark ? 'text-gray-200' : 'text-stone-850'}`}>第三步：随机生成旋律音节</span>
          </div>

          {/* Premium tag for music generator as stipulated in lock rules */}
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-widest">
            PRO 专享
          </span>
        </div>

        <p className={`text-[10.5px] leading-normal font-sans mb-3.5 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
          融合五声音高模型。开启后声能芯片将在后台基于黄金谐音，随机漫游拨奏天籁，每一秒的旋律皆为当下的唯一。
        </p>

        {/* Melody Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Instrument select */}
          <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-stone-100 border-stone-200'}`} id="synth_instruments_row">
            {(['bowl', 'harp', 'bell', 'piano'] as const).map(inst => {
              const labelMap = { bowl: '磬钵', harp: '竖琴', bell: '星铃', piano: '钢琴' };
              const isSelected = instrument === inst;
              return (
                <button
                  key={inst}
                  onClick={() => {
                    setInstrument(inst);
                    // play demo note
                    audioEngine.playInstrumentNote(inst, inst === 'piano' ? 261.63 : 329.63);
                  }}
                  className={`px-3 py-1 text-[10.5px] font-medium font-sans rounded transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-slate-800 text-sky-300 font-semibold'
                        : 'bg-white text-sky-700 shadow border border-stone-300 font-extrabold'
                      : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-stone-550 hover:text-stone-800'
                  }`}
                >
                  {labelMap[inst]}
                </button>
              );
            })}
          </div>

          {/* Toggle Button */}
          <button
            onClick={handleMelodyToggle}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
              isMelodyActive
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : isDark
                  ? 'bg-indigo-650/30 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold'
            }`}
          >
            {isMelodyActive ? '● 关闭旋律' : '▶ 开启生成'}
          </button>
        </div>

        {/* Slower Solfeggio sound option */}
        <div className={`mt-3.5 pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800/80' : 'border-stone-100'}`}>
          <span className={`text-[10.5px] font-sans ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
            深潜声学调和模式 (律动拍)
          </span>
          <button
            onClick={() => {
              audioEngine.ensureContext();
              setIsBinauralActive(!isBinauralActive);
            }}
            className={`w-10 h-5 rounded-full transition-all relative ${
              isBinauralActive ? 'bg-sky-500' : isDark ? 'bg-slate-800' : 'bg-stone-200'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${
              isBinauralActive ? 'left-[23px]' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* 4. ACTIONS: SAVE & SHARE OVERLAYS */}
      <div className="grid grid-cols-2 gap-2.5 mt-2" id="synth_bottom_actions">
        <button
          onClick={handleOpenSaveDialog}
          className={`py-3 border rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-gray-300 hover:border-slate-7050 hover:text-white' 
              : 'bg-white border-stone-300 text-stone-750 hover:bg-stone-50 shadow-sm'
          }`}
        >
          <Save className="w-3.5 h-3.5" /> 保存配方
        </button>
        <button
          onClick={handleOpenSaveDialog}
          className="py-3 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
        >
          <Share2 className="w-3.5 h-3.5" /> 一键分享
        </button>
      </div>

      {/* --- SAVE / SHARE RECIPE FORM OVERLAY DIALOG --- */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm border rounded-2xl overflow-hidden p-5 shadow-2xl ${isDark ? 'bg-[#0e1629] border-slate-800 text-white' : 'bg-white border-stone-250 text-stone-800'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className={`text-sm font-bold font-sans ${isDark ? 'text-white' : 'text-stone-850'}`}>
                  为今天调制的疗愈配方起名
                </h3>
              </div>

              <input
                type="text"
                placeholder="取一个优雅有诗意的配方名..."
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                maxLength={20}
                className={`w-full border rounded-xl px-4 py-3 text-xs font-sans focus:outline-none mb-4 ${
                  isDark 
                    ? 'bg-[#070b13] border-slate-800 text-white focus:border-sky-500/80 placeholder-gray-600' 
                    : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-sky-550 placeholder-stone-400'
                }`}
              />

              <div className={`p-3 rounded-xl border mb-4 flex flex-col text-[10.5px] gap-1 font-sans ${isDark ? 'bg-slate-950/60 border-slate-900/80 text-gray-400' : 'bg-stone-50 border-stone-200/50 text-stone-600'}`}>
                <span>功效导度: {purposes.find(p => p.val === selectedPurpose)?.label}</span>
                <span>奏乐器: {instrument === 'bowl' ? '西藏颂钵' : instrument === 'harp' ? '愈疗竖琴' : instrument === 'bell' ? '星铃' : '古典钢琴'}</span>
                <span>所含环境音: {noises.filter(n => n.isActive).map(n => n.name.slice(2)).join('、') || '无伴音'}</span>
              </div>

              <div className="flex gap-2 font-sans">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs cursor-pointer transition-all ${isDark ? 'border-slate-800 text-gray-400 hover:text-white' : 'border-stone-250 text-stone-500 hover:bg-stone-50'}`}
                >
                  取消
                </button>
                <button
                  onClick={executeSave}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                      : 'bg-stone-100 border-stone-250 text-amber-800 hover:bg-stone-200'
                  }`}
                >
                  本地存盘
                </button>
                <button
                  onClick={executeShare}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-5050 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  一键分享社区
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PAYWALL WARNING OVERLAY DIALOG --- */}
      <AnimatePresence>
        {showPaywallAlert && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative border ${isDark ? 'bg-gradient-to-b from-[#111827] to-[#040814] border-slate-850' : 'bg-white border-stone-300'}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className={`text-sm font-bold font-sans ${isDark ? 'text-gray-100' : 'text-stone-850'}`}>
                  专业愈疗版 PRO 专业专享
                </h3>
              </div>

              <p className={`text-xs leading-relaxed font-sans mb-5 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                您正尝试解锁 <strong>{paywallReason}</strong>。此功能为高级付费订阅用户专属开放。
              </p>

              <div className={`p-4 rounded-xl border mb-6 font-sans ${isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50/50 border-amber-200'}`}>
                <p className="text-[10px] text-amber-500 font-medium tracking-wide">极具声学能量的 PRO 高级尊享</p>
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-stone-600'}`}>月度连续订阅</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">¥ 19.9 <span className="text-xs text-gray-500">/ 月</span></span>
                </div>
                <div className={`text-[10px] mt-2 space-y-1 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                  <p>✓ 尊享高品质无损音质无缝串流</p>
                  <p>✓ 包含完整大脑心理旋律合成工具</p>
                  <p>✓ 完整冥想引导，支持配方云端一键转存</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-sans">
                <button
                  onClick={() => {
                    setShowPaywallAlert(false);
                    onOpenSubscribeModal();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 font-semibold text-xs text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  立即订阅专业版 <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowPaywallAlert(false)}
                  className={`w-full py-2.5 rounded-xl text-xs transition-all cursor-pointer ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-[#888] hover:text-[#555]'}`}
                >
                  稍后再说，继续体验基础服务
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
