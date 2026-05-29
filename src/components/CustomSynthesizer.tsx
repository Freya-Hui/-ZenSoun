import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sparkles, Heart, Share2, Save, Music, AlertTriangle, ArrowRight, ShieldCheck, HeartHandshake, Layers } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { SoundRecipe, UserCreation } from '../types';

// Importing modular elements for custom synthesizer page
import { brainwaveSpecs, BrainwavePurpose } from './self_custom/AmbientBrainwaves';
import WhiteNoiseSlider, { NoiseItem } from './self_custom/WhiteNoiseSlider';
import MelodySeqCreator from './self_custom/MelodySeqCreator';

interface SynthesizerProps {
  isPremiumUser: boolean;
  onOpenSubscribeModal: () => void;
  onSaveRecipe: (recipe: SoundRecipe) => void;
  onShareRecipeToCommunity: (recipe: SoundRecipe) => void;
  theme?: 'day' | 'night';
  onSaveCreation?: (name: string, barsData: boolean[][][], instrument: 'harp' | 'bell' | 'bowl' | 'piano', bpm: number) => void;
  activeCreationToLoad?: UserCreation | null;
  onClearActiveCreationToLoad?: () => void;
  userCreations?: UserCreation[]; // Added this prop
}

export default function CustomSynthesizer({
  isPremiumUser,
  onOpenSubscribeModal,
  onSaveRecipe,
  onShareRecipeToCommunity,
  theme = 'day',
  onSaveCreation,
  activeCreationToLoad,
  onClearActiveCreationToLoad,
  userCreations = [] // Added fallback
}: SynthesizerProps) {
  const isDark = theme === 'night';

  // 6 Selected natural noises (2 free, 4 pro)
  const initialNoises: NoiseItem[] = [
    { id: 'rain', name: '寂雨森林', icon: 'rain', volume: 40, isActive: false },
    { id: 'wind', name: '山谷松风', icon: 'wind', volume: 20, isActive: false },
    { id: 'waves', name: '涌动潮汐', icon: 'waves', volume: 30, isActive: false },
    { id: 'campfire', name: '炽热篝火', icon: 'campfire', volume: 50, isActive: false },
    { id: 'birds', name: '晨雀啼晓', icon: 'birds', volume: 45, isActive: false },
    { id: 'cicadas', name: '夏落鸣蝉', icon: 'cicadas', volume: 35, isActive: false }
  ];

  const [noises, setNoises] = useState<NoiseItem[]>(initialNoises);
  const [selectedPurpose, setSelectedPurpose] = useState<BrainwavePurpose>('rest');
  const [isBinauralActive, setIsBinauralActive] = useState(false);
  const [binauralVolume, setBinauralVolume] = useState(30);
  
  // Recipe Form states
  const [recipeName, setRecipeName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPaywallAlert, setShowPaywallAlert] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');

  // 1. Sync noise channels volumes with audioEngine programmatically
  useEffect(() => {
    noises.forEach(n => {
      audioEngine.setNoiseVolume(n.id, n.isActive, n.volume);
    });
  }, [noises]);

  // 2. Sync Binaural brainwave parameters programmatically
  useEffect(() => {
    if (isBinauralActive && binauralVolume > 0) {
      audioEngine.updateBrainwave(selectedPurpose, binauralVolume / 100);
    } else {
      audioEngine.stopBrainwave();
    }
  }, [selectedPurpose, isBinauralActive, binauralVolume]);

  const triggerPaywall = (reason: string) => {
    setPaywallReason(reason);
    setShowPaywallAlert(true);
  };

  const handleOpenSaveDialog = () => {
    if (!isPremiumUser) {
      triggerPaywall('保存/分享自定义星空愈疗配方数据');
      return;
    }
    const currentLabel = brainwaveSpecs[selectedPurpose].label;
    const activeNoiseNames = noises.filter(n => n.isActive).map(n => n.name.slice(2)).join('');
    setRecipeName(`${currentLabel}•${activeNoiseNames || '空林禅语'}`);
    setShowSaveDialog(true);
  };

  const executeSave = () => {
    if (!recipeName.trim()) return;

    const newRecipe: SoundRecipe = {
      id: `custom_${Date.now()}`,
      name: recipeName.trim(),
      creator: '我 (本地客端)',
      isCustom: true,
      noises: noises.map(n => ({ id: n.id, name: n.name, icon: n.icon as any, volume: n.volume, isActive: n.isActive })),
      purpose: selectedPurpose as any,
      purposeLabel: brainwaveSpecs[selectedPurpose].label,
      melodyInstrument: 'bowl', // default placeholder
      tempo: 'ambient',
      likesCount: 0,
      isLiked: false,
      isSaved: true,
      isPremium: true,
      description: `古法声疗特配：针对「${brainwaveSpecs[selectedPurpose].label}」专门调制，采用脑波学差频声频及自选高品质自然底噪，谐振心神。`
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
      noises: noises.map(n => ({ id: n.id, name: n.name, icon: n.icon as any, volume: n.volume, isActive: n.isActive })),
      purpose: selectedPurpose as any,
      purposeLabel: brainwaveSpecs[selectedPurpose].label,
      melodyInstrument: 'bowl',
      tempo: 'ambient',
      likesCount: 1,
      isLiked: false,
      isSaved: false,
      isPremium: true,
      description: `旅人自创疗法：主声频 ${brainwaveSpecs[selectedPurpose].label} + 环境混合底播：${noises.filter(n => n.isActive).map(n => n.name).join('、') || '自然清净'}。`
    };

    onShareRecipeToCommunity(sharedRecipe);
    setShowSaveDialog(false);
  };

  const activeSpec = brainwaveSpecs[selectedPurpose];

  return (
    <div className={`flex flex-col gap-5 pt-3 pb-8 px-4 transition-colors duration-300 ${
      isDark ? 'bg-[#0a0f1d] text-gray-200' : 'bg-[#faf9f6] text-stone-800'
    }`} id="synth_container">

      {/* STEP 1: BRAINWAVE ANNOTATED PRESETS */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-[#dacdb9]/80 bg-[#fdfbf6]/60 shadow-sm'
      }`}>
        <p className={`text-xs font-semibold tracking-wider mb-2 flex items-center gap-1.5 uppercase ${
          isDark ? 'text-sky-400' : 'text-amber-800'
        }`}>
          <Sparkles className="w-3.5 h-3.5" /> 调谐能量导度
        </p>
        
        <p className={`text-[10px] leading-relaxed font-sans mb-3.5 ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
          根据生物医学声振原理深度疏通脑荷负担、修复紧绷精神面。底层诱导物理机制：提升海马皮质对特定任务的信息编码，平复周遭微杂干扰。
        </p>

        {/* 5 columns of purpose map selectors */}
        <div className="grid grid-cols-5 gap-1 mb-3.5" id="synth_purposes_grid">
          {(Object.keys(brainwaveSpecs) as BrainwavePurpose[]).map(pKey => {
            const isSelected = selectedPurpose === pKey;
            const item = brainwaveSpecs[pKey];
            const isActive = isSelected && isBinauralActive;
            return (
              <button
                key={pKey}
                onClick={() => {
                  audioEngine.ensureContext();
                  window.dispatchEvent(new CustomEvent('zensound-pause'));
                  if (selectedPurpose === pKey) {
                    setIsBinauralActive(!isBinauralActive);
                  } else {
                    setSelectedPurpose(pKey);
                    setIsBinauralActive(true);
                  }
                }}
                className={`py-2 px-0.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1e293b] border-[#38bdf8] text-sky-300 font-extrabold shadow-sm'
                      : 'bg-[#a67c52] border-[#a67c52] text-white font-black shadow-sm'
                    : isDark
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                      : 'bg-[#ebdcb9]/40 border-[#dacdb9]/50 text-[#5c4033] hover:text-[#2d1e18] hover:bg-[#ebdcb9]/70'
                }`}
              >
                {isActive && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className="text-[10px] font-sans font-black truncate w-full px-0.5">{item.label}</span>
                <span className="text-[7.5px] font-mono opacity-50 block scale-[0.9] mt-0.5">
                  {isActive ? '已开启' : '未开启'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slider for sound vibration size */}
        <div className={`pt-3.5 border-t border-dashed flex flex-col gap-2.5 ${
          isDark ? 'border-slate-800/80' : 'border-[#dacdb9]'
        }`}>
          <div className="flex justify-between items-center select-none">
            <span className={`text-[10.5px] font-extrabold block ${isDark ? 'text-gray-300' : 'text-[#4e3629]'}`}>
              调节注入能量大小
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-600">
              {isBinauralActive ? `${binauralVolume}%` : '已关闭'} ({!isBinauralActive || binauralVolume === 0 ? '完全静音' : '共振调谐中'})
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-gray-400 shrink-0 font-sans">虚无</span>
            <input
              type="range"
              min="0"
              max="100"
              value={binauralVolume}
              onChange={(e) => {
                audioEngine.ensureContext();
                window.dispatchEvent(new CustomEvent('zensound-pause'));
                setBinauralVolume(Number(e.target.value));
                if (!isBinauralActive) {
                  setIsBinauralActive(true);
                }
              }}
              className={`flex-1 h-1 rounded-full appearance-none cursor-pointer transition-all ${
                isDark ? 'bg-slate-800 accent-sky-450' : 'bg-[#ebdcb9] accent-[#a67c52]'
              }`}
            />
            <span className="text-[9px] text-[#a67c52] shrink-0 font-sans">深度声振</span>
          </div>
        </div>
      </div>

      {/* STEP 2: NATURAL ENVIRONMENT MIXERS */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-[#dacdb9]/80 bg-[#fdfbf6]/60 shadow-sm'
      }`}>
        <WhiteNoiseSlider
          isPremiumUser={isPremiumUser}
          onOpenSubscribeModal={onOpenSubscribeModal}
          theme={theme}
          noises={noises}
          onNoisesChange={setNoises}
        />
      </div>

      {/* STEP 3: MODULAR SYNTH MELODIES & SEQ MATRIX GRID */}
      <MelodySeqCreator
        isPremiumUser={isPremiumUser}
        onOpenSubscribeModal={onOpenSubscribeModal}
        theme={theme}
        onSaveCreation={onSaveCreation}
        activeCreationToLoad={activeCreationToLoad}
        onClearActiveCreationToLoad={onClearActiveCreationToLoad}
        userCreations={userCreations}
      />

      {/* BOTTOM ACTION BAR BUTTONS */}
      <div className="grid grid-cols-2 gap-2.5 mt-2 font-sans select-none" id="synth_bottom_actions">
        <button
          onClick={handleOpenSaveDialog}
          className={`py-3 border rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-gray-300 hover:border-slate-700 hover:text-white' 
              : 'bg-[#fcfbf9] border-[#dacdb9] text-[#5c4033] hover:bg-[#ebdfc8] shadow-sm font-black'
          }`}
        >
          <Save className="w-3.5 h-3.5" /> 保存配方
        </button>
        <button
          onClick={handleOpenSaveDialog}
          className={`py-3 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md ${
            isDark
              ? 'bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600'
              : 'bg-[#a67c52] hover:bg-[#8e6b46] border border-[#8e6b46]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> 一键分享
        </button>
      </div>

      {/* --- SAVE / SHARE FORM MODAL --- */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm border rounded-2xl overflow-hidden p-5 shadow-2xl relative ${
                isDark ? 'bg-[#0e1629] border-slate-800 text-white' : 'bg-[#fdfbf7] border-[#dacdb9] text-[#4e3629]'
              }`}
            >
              <div className="flex items-center gap-2 mb-3 select-none">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className={`text-sm font-extrabold font-sans`}>
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
                    ? 'bg-[#070b13] border-slate-800 text-white focus:border-sky-500' 
                    : 'bg-[#f5ead5] border-[#dacdb9] text-[#4e3629] focus:border-[#a67c52] placeholder-stone-400'
                }`}
              />

              <div className={`p-3 rounded-xl border mb-4 flex flex-col text-[10px] gap-1 font-sans select-none ${
                isDark ? 'bg-slate-950/60 border-slate-900/80 text-gray-400' : 'bg-[#f2e7d0]/40 border-[#dacdb9]/45 text-[#826e5e]'
              }`}>
                <span>双耳心率: {brainwaveSpecs[selectedPurpose].label} / {brainwaveSpecs[selectedPurpose].underlyingLogic}</span>
                <span>环境混音: {noises.filter(n => n.isActive).map(n => n.name).join('、') || '空林禅语底噪'}</span>
              </div>

              <div className="flex gap-2 font-sans text-center">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isDark ? 'border-slate-800 text-gray-400 hover:text-white' : 'border-[#dacdb9] text-stone-500 hover:bg-[#eae0cb]'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={executeSave}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                      : 'bg-[#eae0cb] border-[#dacdb9] text-amber-800 hover:bg-[#dfd3bd] font-black'
                  }`}
                >
                  本地存盘
                </button>
                <button
                  onClick={executeShare}
                  className={`flex-1 py-2.5 text-white text-xs font-semibold cursor-pointer transition-all rounded-xl ${
                    isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-[#a67c52] hover:bg-[#8e6b46]'
                  }`}
                >
                  一键分享
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PAYWALL WARNING OVERLAY --- */}
      <AnimatePresence>
        {showPaywallAlert && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative border ${
                isDark ? 'bg-gradient-to-b from-[#111827] to-[#040814] border-slate-850' : 'bg-[#fffcf9] border-[#dacdb9]'
              }`}
            >
              <div className="flex items-center gap-2 mb-4 select-none">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
                <h3 className={`text-sm font-black font-sans ${isDark ? 'text-gray-100' : 'text-[#4e3629]'}`}>
                  专业愈疗版 PRO 尊享开放
                </h3>
              </div>

              <p className={`text-xs leading-relaxed font-sans mb-5 ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
                本草神弦将伴您前行。您当前正在尝试解锁 <strong>{paywallReason}</strong>，此定制化配乐组合为 PRO 有损尊享会员特配功能。
              </p>

              <div className={`p-4 rounded-xl border mb-6 font-sans ${
                isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-[#f4ebd9]/80 border-amber-200/50'
              }`}>
                <p className="text-[9.5px] text-amber-600 font-extrabold tracking-wide">极具声学能量的 终身至臻高配</p>
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-[#8e7968]'}`}>连续订阅特享</span>
                  <span className="text-xl font-bold text-amber-600 font-mono">¥ 19.9 <span className="text-xs text-stone-500">/ 月</span></span>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-sans select-none text-center">
                <button
                  onClick={() => {
                    setShowPaywallAlert(false);
                    onOpenSubscribeModal();
                  }}
                  className={`w-full py-3 rounded-xl font-semibold text-xs text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-gradient-to-r from-amber-500 to-yellow-600' : 'bg-[#a67c52] hover:bg-[#8e6b46] border border-[#8e6b46]'
                  }`}
                >
                  立即开通专业版 <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowPaywallAlert(false)}
                  className={`w-full py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isDark ? 'text-gray-500 hover:text-gray-300' : 'text-stone-500 hover:text-stone-750'
                  }`}
                >
                  稍后再说，继续普通试听
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
