import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Sparkles, Sliders, Trash, Play, Pause, RefreshCw, 
  Hourglass, AlertCircle, X, HelpCircle, Check, CheckSquare
} from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';
import { UserCreation } from '../../types';

interface SequencerProps {
  isPremiumUser: boolean;
  onOpenSubscribeModal: () => void;
  theme: 'day' | 'night';
  onSaveCreation?: (name: string, barsData: boolean[][][], instrument: 'harp' | 'bell' | 'bowl' | 'piano', bpm: number) => void;
  activeCreationToLoad?: UserCreation | null;
  onClearActiveCreationToLoad?: () => void;
  userCreations?: UserCreation[];
}

const scaleNotes = [
  { name: '疗律波 A', freq: 440.00 },
  { name: '安神波 B', freq: 392.00 },
  { name: '清心波 C', freq: 329.63 },
  { name: '调气波 D', freq: 293.66 },
  { name: '和中波 E', freq: 261.63 }
];

// Complete Pitch notation to frequency mapping
const noteToFreqMap: Record<string, number> = {
  '1': 261.63, '2': 293.66, '3': 329.63, '4': 349.23, '5': 392.00, '6': 440.00, '7': 493.88,
  '宫': 261.63, '商': 293.66, '角': 329.63, '徵': 392.00, '羽': 440.00,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50
};

const parsePitchInput = (inputStr: string): number[] => {
  // Normalize commas/spaces/Chinese commas
  const normalized = inputStr.replace(/[,，、]/g, ' ');
  const rawTokens = normalized.trim().split(/\s+/);
  const frequencies: number[] = [];

  rawTokens.forEach(tok => {
    if (!tok) return;
    const uppercaseTok = tok.toUpperCase();
    if (noteToFreqMap[uppercaseTok] !== undefined) {
      frequencies.push(noteToFreqMap[uppercaseTok]);
    } else if (noteToFreqMap[tok] !== undefined) {
      frequencies.push(noteToFreqMap[tok]);
    } else {
      const parsedNum = parseFloat(tok);
      if (!isNaN(parsedNum) && parsedNum > 20 && parsedNum < 5000) {
        frequencies.push(parsedNum);
      }
    }
  });

  return frequencies;
};

export default function MelodySeqCreator({
  isPremiumUser,
  onOpenSubscribeModal,
  theme,
  onSaveCreation,
  activeCreationToLoad,
  onClearActiveCreationToLoad,
  userCreations = []
}: SequencerProps) {
  const isDark = theme === 'night';
  
  // Melody Selection state (random or custom_pitch or creations)
  const [activeSourceType, setActiveSourceType] = useState<'random' | 'custom_pitch' | 'creations'>('random');

  // Custom pitch sequencer looper states
  const [customPitchText, setCustomPitchText] = useState('宫 商 角 徵 羽 A4 C5');
  const [customPitchSpeed, setCustomPitchSpeed] = useState(450); // ms per step
  const [isCustomPitchLoopPlaying, setIsCustomPitchLoopPlaying] = useState(false);
  
  // Track selected creation id
  const [selectedCreationId, setSelectedCreationId] = useState<string | null>(null);
  
  // Notice banner at the top of Step 3
  const [creationBanner, setCreationBanner] = useState<string | null>(null);

  const [instrument, setInstrument] = useState<'harp' | 'bell' | 'bowl' | 'piano'>('bowl');
  const [isMelodyActive, setIsMelodyActive] = useState(false);
  
  // High-end composition step sequencer overlay state
  const [showComposePanel, setShowComposePanel] = useState(false);
  const [creationTitle, setCreationTitle] = useState('');
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [speedMs, setSpeedMs] = useState(400); // 150bpm defaults

  // DAW Music System: multi-bar selects
  const [activeBar, setActiveBar] = useState<number>(0); 
  const [currentPlayBar, setCurrentPlayBar] = useState<number>(0); 
  
  // Drag selection multi rows
  const [selectedBarsList, setSelectedBarsList] = useState<number[]>([]);

  // 4 patterns x 5 rows x 8 columns matrix layout
  const [bars, setBars] = useState<boolean[][][]>(() => 
    Array.from({ length: 4 }, () => 
      Array.from({ length: 5 }, () => Array(8).fill(false))
    )
  );

  // Time & credit limits
  const [timelineSeconds, setTimelineSeconds] = useState(0);
  const [remainingMins, setRemainingMins] = useState(12.5);
  const [userCredits, setUserCredits] = useState(150);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeStepRef = useRef(0);
  const barsRef = useRef<boolean[][][]>(bars);
  const activeBarRef = useRef(activeBar);
  const currentPlayBarRef = useRef(currentPlayBar);
  const isPlayingSeqRef = useRef(isPlayingSeq);
  const speedRef = useRef(speedMs);
  const selectedBarsListRef = useRef<number[]>([]);

  // Synchronize dynamic references
  useEffect(() => {
    barsRef.current = bars;
  }, [bars]);

  useEffect(() => {
    activeBarRef.current = activeBar;
  }, [activeBar]);

  useEffect(() => {
    currentPlayBarRef.current = currentPlayBar;
  }, [currentPlayBar]);

  useEffect(() => {
    isPlayingSeqRef.current = isPlayingSeq;
  }, [isPlayingSeq]);

  useEffect(() => {
    speedRef.current = speedMs;
  }, [speedMs]);

  useEffect(() => {
    selectedBarsListRef.current = selectedBarsList;
  }, [selectedBarsList]);

  // Track userCreations to auto-select newest composition automatically
  const prevUserCreationsCount = useRef(userCreations.length);
  useEffect(() => {
    if (userCreations.length > prevUserCreationsCount.current) {
      const newest = userCreations[userCreations.length - 1];
      setActiveSourceType('creations');
      setSelectedCreationId(newest.id);
      
      // Auto load the track
      if (newest.barsData) setBars(newest.barsData);
      if (newest.instrument) setInstrument(newest.instrument);
      if (newest.bpm) setSpeedMs(Math.round(30000 / newest.bpm));
      
      // Stop random wandering and play sequence loop
      setIsMelodyActive(false);
      audioEngine.stopMelody();
      setIsPlayingSeq(true);

      setCreationBanner(`已自动为您载入最新创作：《${newest.name}》琴篇！弦波振动播放已启动。`);
      triggerToast(`已为您自动载入最新创作乐章！`);
    }
    prevUserCreationsCount.current = userCreations.length;
  }, [userCreations]);

  useEffect(() => {
    if (showComposePanel && !creationTitle) {
      setCreationTitle(`太素琴章 #${Math.floor(Math.random() * 899 + 100)}`);
    }
  }, [showComposePanel]);

  useEffect(() => {
    if (activeCreationToLoad) {
      if (activeCreationToLoad.instrument) {
        setInstrument(activeCreationToLoad.instrument);
      }
      if (activeCreationToLoad.barsData) {
        setBars(activeCreationToLoad.barsData);
      }
      if (activeCreationToLoad.name) {
        setCreationTitle(activeCreationToLoad.name);
      }
      
      setActiveSourceType('creations');
      setSelectedCreationId(activeCreationToLoad.id);
      setIsMelodyActive(false);
      audioEngine.stopMelody();
      
      // Instantly pop open the interactive DAW composer screen
      setShowComposePanel(true);
      
      // Let parent know load state has been successfully processed
      if (onClearActiveCreationToLoad) {
        onClearActiveCreationToLoad();
      }
    }
  }, [activeCreationToLoad, onClearActiveCreationToLoad]);

  // Sync random melody generator
  useEffect(() => {
    if (isMelodyActive) {
      audioEngine.playMelody(instrument, 2800);
    } else {
      audioEngine.stopMelody();
    }
    return () => audioEngine.stopMelody();
  }, [isMelodyActive, instrument]);

  // Sync custom pitch loops and stop when switching away or unmounting
  useEffect(() => {
    if (activeSourceType !== 'custom_pitch') {
      audioEngine.stopCustomPitchLoop();
      setIsCustomPitchLoopPlaying(false);
    }
  }, [activeSourceType]);

  useEffect(() => {
    return () => {
      audioEngine.stopCustomPitchLoop();
    };
  }, []);

  // DAW Musical step player tick
  useEffect(() => {
    let timerId: any = null;

    const playStepTick = () => {
      if (!isPlayingSeqRef.current) return;

      const currentStep = activeStepRef.current;
      const currentGridBars = barsRef.current;
      const activeSelectedList = selectedBarsListRef.current;

      // Decide target bar index to play notes
      let barIdxToPlay = activeBarRef.current;
      
      if (activeSelectedList.length > 0) {
        // Play only selected bars
        const currentIdxInSelected = activeSelectedList.indexOf(currentPlayBarRef.current);
        if (currentIdxInSelected === -1) {
          barIdxToPlay = activeSelectedList[0];
          currentPlayBarRef.current = barIdxToPlay;
          setCurrentPlayBar(barIdxToPlay);
        } else {
          barIdxToPlay = currentPlayBarRef.current;
        }
      } else {
        barIdxToPlay = currentPlayBarRef.current;
      }

      if (barIdxToPlay >= currentGridBars.length) {
        barIdxToPlay = 0;
        currentPlayBarRef.current = 0;
        setCurrentPlayBar(0);
      }

      const activeBarGrid = currentGridBars[barIdxToPlay];

      // Play notes triggered on this column
      if (activeBarGrid) {
        activeBarGrid.forEach((row, rowIdx) => {
          if (row[currentStep]) {
            const targetNote = scaleNotes[rowIdx];
            audioEngine.playInstrumentNote(instrument, targetNote.freq);
          }
        });
      }

      // Update active beat indicator
      setActiveStep(currentStep);

      // Increment step
      let nextStep = currentStep + 1;
      if (nextStep >= 8) {
        nextStep = 0;
        
        // Advance to next bar index in sequence
        if (activeSelectedList.length > 0) {
          const currentIdxInSelected = activeSelectedList.indexOf(barIdxToPlay);
          const nextIdxInSelected = (currentIdxInSelected + 1) % activeSelectedList.length;
          const nextBar = activeSelectedList[nextIdxInSelected];
          currentPlayBarRef.current = nextBar;
          setCurrentPlayBar(nextBar);
          setActiveBar(nextBar); // autofocus
        } else {
          const nextBar = (barIdxToPlay + 1) % currentGridBars.length;
          currentPlayBarRef.current = nextBar;
          setCurrentPlayBar(nextBar);
          setActiveBar(nextBar); // autofocus
        }
      }
      activeStepRef.current = nextStep;

      // Loop tick time
      timerId = setTimeout(playStepTick, speedRef.current);
    };

    if (isPlayingSeq) {
      activeStepRef.current = 0;
      const activeSelList = selectedBarsListRef.current;
      if (activeSelList.length > 0) {
        currentPlayBarRef.current = activeSelList[0];
        setCurrentPlayBar(activeSelList[0]);
        setActiveBar(activeSelList[0]);
      } else {
        currentPlayBarRef.current = 0;
        setCurrentPlayBar(0);
        setActiveBar(0);
      }
      playStepTick();
    } else {
      if (timerId) clearTimeout(timerId);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isPlayingSeq, instrument]);

  // Playback timer (Limits custom audio rendering to 5 minutes safety threshold)
  useEffect(() => {
    let tickId: any = null;
    if (isPlayingSeq || isMelodyActive) {
      tickId = setInterval(() => {
        setTimelineSeconds(prev => {
          if (prev >= 300) {
            setIsPlayingSeq(false);
            setIsMelodyActive(false);
            triggerToast("提示：已触发单次5分钟安全播放时长上限。可注入龙音币随时重置时轴。");
            return 300;
          }
          setRemainingMins(rem => Math.max(0, rem - 1 / 60));
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(tickId);
  }, [isPlayingSeq, isMelodyActive]);

  const handleInstrumentChange = (inst: 'harp' | 'bell' | 'bowl' | 'piano') => {
    setInstrument(inst);
    audioEngine.ensureContext();
    audioEngine.playInstrumentNote(inst, inst === 'piano' ? 261.63 : 329.63);
  };

  const toggleGridCell = (rowIdx: number, colIdx: number) => {
    audioEngine.ensureContext();
    if (!isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }

    // Play instant sound feedback
    audioEngine.playInstrumentNote(instrument, scaleNotes[rowIdx].freq);

    const nextBars = bars.map((bar, barIdx) => {
      if (barIdx === activeBar) {
        return bar.map((row, r) =>
          row.map((val, c) => (r === rowIdx && c === colIdx ? !val : val))
        );
      }
      return bar;
    });

    setBars(nextBars);
  };

  // Trigger manual start/stop inside Random Generator
  const handleToggleRandomGen = () => {
    audioEngine.ensureContext();
    if (!isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }
    setCreationBanner(null);
    const nextState = !isMelodyActive;
    setIsMelodyActive(nextState);
    if (nextState) {
      setIsPlayingSeq(false);
      setSelectedCreationId(null);
    }
  };

  const handleToggleCustomPitchLoop = () => {
    audioEngine.ensureContext();
    if (!isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }

    if (isCustomPitchLoopPlaying) {
      audioEngine.stopCustomPitchLoop();
      setIsCustomPitchLoopPlaying(false);
    } else {
      const parsed = parsePitchInput(customPitchText);
      if (parsed.length === 0) {
        triggerToast("⚠️ 未能解析出任何有效音高，请使用类似 '宫 商 角 1 2 5 G4 C5' 以空格分隔的形式！");
        return;
      }
      // Silencing other generators
      setIsMelodyActive(false);
      audioEngine.stopMelody();
      setIsPlayingSeq(false);
      setSelectedCreationId(null);

      // Trigger looper
      audioEngine.playCustomPitchLoop(parsed, instrument, customPitchSpeed);
      setIsCustomPitchLoopPlaying(true);
      triggerToast(`🍀 智能和弦循环开启：已解析出 ${parsed.length} 个基频节点`);
    }
  };

  const handleToggleSequencer = () => {
    audioEngine.ensureContext();
    if (!isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }
    const nextSeqState = !isPlayingSeq;
    setIsPlayingSeq(nextSeqState);
    if (nextSeqState) setIsMelodyActive(false);
  };

  // Reorder bars with index checks
  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx >= bars.length || toIdx < 0 || toIdx >= bars.length || fromIdx === toIdx) return;
    const nextBars = [...bars];
    const [moved] = nextBars.splice(fromIdx, 1);
    nextBars.splice(toIdx, 0, moved);
    setBars(nextBars);
    setActiveBar(toIdx);
    triggerToast("已拖动调换小节顺序");
  };

  // Move bar left/right via arrow clicks
  const moveBar = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= bars.length) return;
    handleReorder(idx, targetIdx);
  };

  const clearCurrentBar = () => {
    const nextBars = bars.map((bar, barIdx) => {
      if (barIdx === activeBar) {
        return Array.from({ length: 5 }, () => Array(8).fill(false));
      }
      return bar;
    });
    setBars(nextBars);
    setIsPlayingSeq(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtendPlaytime = () => {
    if (userCredits < 10) {
      triggerToast("抱歉，龙音币余额不足 10！请点击充值。");
      return;
    }
    setUserCredits(prev => prev - 10);
    setRemainingMins(prev => prev + 10);
    setTimelineSeconds(0);
    triggerToast("扣续10龙音币成功！精雕播放额度补充 10.0MINS 完毕，时序重设！");
  };

  const handleRefillCredits = () => {
    setUserCredits(prev => prev + 100);
    triggerToast("模拟微信充注成功！+100 龙音币已到位！");
  };

  // Select on creation -> Clicking toggles play, first-click loads
  const handleSelectUserCreation = (creation: UserCreation) => {
    audioEngine.ensureContext();
    
    // Stop random wandering
    setIsMelodyActive(false);
    audioEngine.stopMelody();

    if (selectedCreationId === creation.id) {
      // Toggle play/pause for existing selected track
      const targetSeqState = !isPlayingSeq;
      setIsPlayingSeq(targetSeqState);
      if (targetSeqState) {
        triggerToast(`正在播放：《${creation.name}》`);
      } else {
        triggerToast(`已暂停：《${creation.name}》`);
      }
    } else {
      // Load different track and select it first, do NOT autoplay immediately unless they click again
      setSelectedCreationId(creation.id);
      setCreationBanner(null);
      
      if (creation.barsData) setBars(creation.barsData);
      if (creation.instrument) setInstrument(creation.instrument);
      if (creation.bpm) setSpeedMs(Math.round(30000 / creation.bpm));

      setIsPlayingSeq(false);
      triggerToast(`已载入：《${creation.name}》，再次点击该琴谱即可开启播放`);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all relative ${
      isDark ? 'border-slate-800 bg-[#080d19]/40' : 'border-[#dacdb9]/80 bg-[#fdfbf6]/60 shadow-sm'
    }`} id="modular_melody_seq_panel">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-2 right-2 bg-amber-500/95 text-stone-950 font-sans text-[10px] font-black p-2.5 rounded-xl text-center z-[250] flex items-center justify-center gap-1 shadow-lg"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col mb-3 select-none text-left">
        <p className={`text-xs font-semibold tracking-wider mb-2 flex items-center gap-1.5 uppercase ${
          isDark ? 'text-sky-400' : 'text-amber-800'
        }`}>
          <Music className="w-3.5 h-3.5" /> 调谐清心弦音
        </p>
        
        <p className={`text-[10px] leading-relaxed font-sans ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
          自主编排正念音波，让纯净旋律在指尖流淌。底层声疗物理机制：选择下方弦能运作源，可开启慢速随机演奏，或是加载我本地保存的创作琴调，激活深层大脑舒缓。
        </p>
      </div>

      {/* Saving Melody Autoload Notification Banner */}
      <AnimatePresence>
        {creationBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3.5 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[10px] text-emerald-800 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              {creationBanner}
            </span>
            <button 
              onClick={() => setCreationBanner(null)}
              className="text-stone-400 hover:text-emerald-800 text-[10px] cursor-pointer"
            >
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3.5">
        
        {/* TAB NAVIGATION FOR MELODY SOURCE (随机、创作) */}
        <div>
          <span className={`text-[10px] block mb-2 font-black ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
            1. 选择 弦能演奏运作源：
          </span>
          <div className="grid grid-cols-3 gap-1" id="melody_source_segments">
            <button
              onClick={() => {
                setActiveSourceType('random');
                setIsMelodyActive(false); // Do not start playing immediately
                setIsPlayingSeq(false);
                setSelectedCreationId(null);
              }}
              className={`py-1.5 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer truncate ${
                activeSourceType === 'random'
                  ? isDark
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-black'
                    : 'bg-[#a67c52] border-[#a67c52] text-white shadow-sm font-black'
                  : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-[#ebdcb9]/30 border-[#dacdb9]/40 text-[#5c4033] hover:bg-[#ebdcb9]/55'
              }`}
            >
              随机生成
            </button>
            <button
              onClick={() => {
                setActiveSourceType('custom_pitch');
                setIsMelodyActive(false);
                setIsPlayingSeq(false);
                setSelectedCreationId(null);
                audioEngine.stopMelody();
              }}
              className={`py-1.5 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer truncate ${
                activeSourceType === 'custom_pitch'
                  ? isDark
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-black'
                    : 'bg-[#a67c52] border-[#a67c52] text-white shadow-sm font-black'
                  : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-[#ebdcb9]/30 border-[#dacdb9]/40 text-[#5c4033] hover:bg-[#ebdcb9]/55'
              }`}
            >
              自写音高循环
            </button>
            <button
              onClick={() => {
                setActiveSourceType('creations');
                setIsMelodyActive(false);
                audioEngine.stopMelody();
                setIsPlayingSeq(false);
              }}
              className={`py-1.5 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer truncate ${
                activeSourceType === 'creations'
                  ? isDark
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-black'
                    : 'bg-[#a67c52] border-[#a67c52] text-white shadow-sm font-black'
                  : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-[#ebdcb9]/30 border-[#dacdb9]/40 text-[#5c4033] hover:bg-[#ebdcb9]/55'
              }`}
            >
              我的琴谱 ({userCreations.length})
            </button>
          </div>
        </div>

        {/* SUB-SECTION BASED ON SELECTED MELODY SOURCE TAB */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-900/50 border-slate-850' : 'bg-[#fcfaf4] border-[#dacdb9]/40 shadow-inner'
        }`}>
          {/* TAB 1: RANDOM ADAPTIVE */}
          {activeSourceType === 'random' && (
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-stone-500 font-medium">系统生成自然和谐和弦波动</span>
                <span className="flex items-center gap-1 text-[8.5px] bg-[#a67c52]/10 text-[#a67c52] px-2 py-0.5 rounded-full font-bold">
                  舒解脑重
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleToggleRandomGen}
                  className={`py-2 px-4 rounded-xl text-[10.5px] font-black transition-all cursor-pointer flex-1 flex items-center justify-center gap-1.5 ${
                    isMelodyActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : isDark
                        ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20'
                        : 'bg-[#ebdcb9] text-[#5c4033] hover:bg-[#dfd3bd] border border-[#dacdb9]/70'
                  }`}
                >
                  {isMelodyActive ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>已开启：随机自适应频率运作中，点击可停止</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>点击开启随机生成</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM PITCH SEQUENCER LOOPER */}
          {activeSourceType === 'custom_pitch' && (
            <div className="space-y-3.5 text-left font-sans select-none">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-stone-500 font-extrabold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 音高序列智能自适应
                </span>
                <span className="flex items-center gap-1 text-[8.5px] bg-[#a67c52]/10 text-[#a67c52] px-2 py-0.5 rounded-full font-bold">
                  千人千调
                </span>
              </div>
              
              <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
                简明自写：支持我国傳統<b>五音 宫 商 角 徵 羽</b>、简谱数字<b>1-7</b>、或英文音名<b>C4 E4 G4 A4</b>，通过<strong>空格</strong>隔开。系统会自动分析物理和弦并在后台无限自动优质循环。
              </p>

              <div className="space-y-2">
                <label className="text-[9.5px] font-bold block opacity-75">请输入自定义音高谱串：</label>
                <input
                  type="text"
                  value={customPitchText}
                  onChange={(e) => {
                    setCustomPitchText(e.target.value);
                    if (isCustomPitchLoopPlaying) {
                      const parsed = parsePitchInput(e.target.value);
                      if (parsed.length > 0) {
                        audioEngine.playCustomPitchLoop(parsed, instrument, customPitchSpeed);
                      }
                    }
                  }}
                  placeholder="e.g. 宫 商 角 徵 羽 1 2 A4 G4"
                  className={`w-full text-xs font-mono p-2.5 rounded-xl border focus:outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-amber-400 focus:border-amber-500/50' 
                      : 'bg-white border-[#dacdb9]/70 text-[#4e3629] focus:border-[#a67c52] shadow-xs'
                  }`}
                />
              </div>

              {/* Controls speed & live instruments */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <label className="text-[9px] font-semibold block opacity-75 mb-1">乐器音色：</label>
                  <select
                    value={instrument}
                    onChange={(e) => {
                      const inst = e.target.value as any;
                      setInstrument(inst);
                      if (isCustomPitchLoopPlaying) {
                        const parsed = parsePitchInput(customPitchText);
                        audioEngine.playCustomPitchLoop(parsed, inst, customPitchSpeed);
                      }
                    }}
                    className={`w-full text-[10.5px] p-2 rounded-lg focus:outline-none focus:ring-1 ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 focus:ring-amber-500 text-gray-300' 
                        : 'bg-white border-stone-200 focus:ring-[#a67c52] text-stone-700'
                    }`}
                  >
                    <option value="bowl">磬钵 resonance</option>
                    <option value="harp">古竖琴 warm harp</option>
                    <option value="bell">天外音 bell</option>
                    <option value="piano">柔雅钢琴 piano</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8.5px] font-semibold block opacity-75 mb-1">间鸣速度 (间距): {customPitchSpeed}ms</label>
                  <input
                    type="range"
                    min="180"
                    max="1000"
                    step="20"
                    value={customPitchSpeed}
                    onChange={(e) => {
                      const speed = Number(e.target.value);
                      setCustomPitchSpeed(speed);
                      if (isCustomPitchLoopPlaying) {
                        const parsed = parsePitchInput(customPitchText);
                        audioEngine.playCustomPitchLoop(parsed, instrument, speed);
                      }
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-amber-500/15 accent-amber-500"
                  />
                </div>
              </div>

              {/* Action play button */}
              <button
                onClick={handleToggleCustomPitchLoop}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isCustomPitchLoopPlaying
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : isDark
                      ? 'bg-amber-500/20 text-text-amber-300 hover:bg-amber-500/30 border border-amber-500/20'
                      : 'bg-[#ebdcb9] text-[#5c4033] hover:bg-[#dfd3bd] border border-[#dacdb9]/70'
                }`}
              >
                {isCustomPitchLoopPlaying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>自定义琴歌循环中 • 点击暂停</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-current" />
                    <span>智能识别音高并开启循环</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: USER SAVE CREATIONS WITH SCROLL CONTAINER FOR LAZY CLUTTER */}
          {activeSourceType === 'creations' && (
            <div className="space-y-2.5 text-left">
              {userCreations.length === 0 ? (
                <div className="text-center py-4 space-y-2 select-none">
                  <p className="text-[10.5px] text-stone-400">目前本地无保存的创作琴谱</p>
                  <button
                    onClick={() => {
                      audioEngine.ensureContext();
                      setIsMelodyActive(false);
                      setBars(Array.from({ length: 4 }, () => 
                        Array.from({ length: 5 }, () => Array(8).fill(false))
                      ));
                      setActiveBar(0);
                      setCurrentPlayBar(0);
                      setSelectedBarsList([]);
                      setIsPlayingSeq(false);
                      setCreationTitle('');
                      setShowComposePanel(true);
                    }}
                    className="py-1 px-3 bg-[#a67c52]/15 text-[#a67c52] hover:bg-[#a67c52]/25 font-bold text-[9px] rounded-lg border border-[#a67c52]/20 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>开启步进拼轨谱曲板 (首作开曲)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[9.5px] text-stone-500">点选载入琴调，再次点选即可播放或暂停：</p>
                  {/* Neat Scrollable Window containing creations to prevent page clutter */}
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto scrollbar-thin pr-1 border border-stone-200/40 rounded-xl p-1 bg-stone-50/50">
                    {userCreations.map(creation => {
                      const isSelected = selectedCreationId === creation.id;
                      const isPlayThis = isSelected && isPlayingSeq;
                      return (
                        <div
                          key={creation.id}
                          onClick={() => handleSelectUserCreation(creation)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? isPlayThis
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 font-black'
                                : 'bg-amber-500/15 border-amber-500 text-amber-800 font-extrabold'
                              : isDark
                                ? 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
                                : 'bg-white border-stone-200 text-[#4e3629] hover:bg-stone-50/80 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isPlayThis ? (
                              <Pause className="w-3.5 h-3.5 text-emerald-600 animate-pulse font-bold" />
                            ) : (
                              <Play className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-stone-400'}`} />
                            )}
                            <span className="text-[10px] truncate max-w-[120px] sm:max-w-xs">{creation.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[7.5px] font-mono opacity-80 bg-stone-200/50 px-1.5 py-0.5 rounded text-stone-750">
                              {creation.instrumentLabel}
                            </span>
                            <span className="text-[7.5px] font-mono opacity-80 bg-stone-250/50 px-1.5 py-0.5 rounded text-stone-750">
                              {creation.bpm}bpm
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instrumental Selector Panel */}
        <div className="text-left">
          <span className={`text-[10px] block mb-2 font-black ${isDark ? 'text-gray-400' : 'text-[#826e5e]'}`}>
            2. 正念演奏乐器 (点选即可即时鸣响切换音源)：
          </span>
          <div className="grid grid-cols-4 gap-1.5" id="modular_instruments_wrapper">
            {(['bowl', 'harp', 'bell', 'piano'] as const).map(inst => {
              const labelMap = { bowl: '磬钵禅鸣', harp: '至灵竖琴', bell: '空灵编钟', piano: '和韵钢琴' };
              const isSelected = instrument === inst;
              return (
                <button
                  key={inst}
                  onClick={() => handleInstrumentChange(inst)}
                  className={`py-2 text-[10px] font-bold font-sans rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-sky-520/20 border-sky-400 text-sky-300 font-extrabold shadow-sm'
                        : 'bg-[#a67c52] border-[#a67c52] text-white font-black shadow-sm'
                      : isDark 
                        ? 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white hover:bg-slate-850' 
                        : 'bg-[#ebdcb9]/40 border-[#dacdb9]/50 text-[#5c4033] hover:text-[#2d1e18] hover:bg-[#ebdcb9]/70'
                  }`}
                >
                  {labelMap[inst]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Control center trigger button */}
        <div className="pt-1 select-none flex justify-end">
          <button
            onClick={() => {
              audioEngine.ensureContext();
              if (isMelodyActive) {
                triggerToast("提示：随机生成模式处于激活状态。开启谱曲板会将随机生成自动关闭。");
                setIsMelodyActive(false);
              }
              // ALWAYS reset elements to default cold state when user clicks on create a new track
              setBars(Array.from({ length: 4 }, () => 
                Array.from({ length: 5 }, () => Array(8).fill(false))
              ));
              setActiveBar(0);
              setCurrentPlayBar(0);
              setSelectedBarsList([]);
              setIsPlayingSeq(false);
              setCreationTitle(''); // Clean name initialization to prevent old carried state !
              setShowComposePanel(true);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-[11px] font-black tracking-wide transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              isDark
                ? 'bg-slate-900 border border-slate-800 text-sky-450 hover:bg-slate-800/80 hover:border-slate-700'
                : 'bg-[#f4ebd9] text-[#a67c52] border border-[#dacdb9] hover:bg-[#ede0ca]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 animate-pulse" />
            <span>自谱新调：开启步进拼轨谱曲板</span>
          </button>
        </div>
      </div>

      {/* --- LEVEL-2 FULL SCREEN DAW COMPOSER POPUP OVERLAY (高保真二级页面弹窗) --- */}
      <AnimatePresence>
        {showComposePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <div
              className={`w-full max-w-4xl rounded-3xl p-6 shadow-2xl relative overflow-y-auto max-h-[95vh] border text-left ${
                isDark 
                  ? 'bg-[#0b101c]/95 border-slate-800 text-gray-200' 
                  : 'bg-[#faf6ed] border-[#c0af94] text-[#4e3629]'
              }`}
            >
              
              {/* Internal Modal Toast */}
              <AnimatePresence>
                {toastMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-4 left-4 right-4 bg-amber-600 text-white font-sans text-xs font-black py-2 rounded-xl text-center z-50 shadow-md"
                  >
                    {toastMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Row Title & Playback controller (PROPORTIONAL SIZE) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b pb-4 border-dashed border-stone-250">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15">
                    <Music className="w-5 h-5 text-[#a67c52]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-wider uppercase font-sans flex items-center gap-1.5">
                      正念旋律创作
                    </h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      点选乐声谱格，自主规划疗愈琴谱（支持小节拖动、多选及批量控制）
                    </p>
                  </div>
                </div>

                {/* Main transport play controller (Play buttons moved higher up as requested) */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleToggleSequencer}
                    className={`flex-1 sm:flex-none py-2 px-5 rounded-2xl text-[11px] font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isPlayingSeq
                        ? 'bg-emerald-500 text-white shadow-md'
                        : isDark
                          ? 'bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800'
                          : 'bg-[#a67c52] text-white hover:bg-[#8e6b46] border border-[#8e6b46] shadow-sm'
                    }`}
                  >
                    {isPlayingSeq ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>暂停演奏</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>开始演奏</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlayingSeq(false);
                      setShowComposePanel(false);
                    }}
                    className="p-2 rounded-full hover:bg-stone-200/45 transition-colors cursor-pointer text-stone-500 flex items-center justify-center"
                    title="返回主界面"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* REORGANIZED IN EXACT USER ORDER:
                  1。 首先是选择乐器
                  2。 选择节拍
                  3。 之后是小节的框
                  剩下的不变 */}

              {/* BLOCK 1: 选择乐器 */}
              <div className="mb-5">
                <span className={`text-[10px] block mb-2 font-black ${isDark ? 'text-gray-400' : 'text-[#826e5e]'} uppercase tracking-wider`}>
                  1. 选择乐器 (直接切换琴音共振材质):
                </span>
                <div className="grid grid-cols-4 gap-1.5" id="compose_panel_instruments">
                  {(['bowl', 'harp', 'bell', 'piano'] as const).map(inst => {
                    const labelMap = { bowl: '磬钵禅鸣', harp: '至灵竖琴', bell: '空灵编钟', piano: '和韵钢琴' };
                    const isSelected = instrument === inst;
                    return (
                      <button
                        key={inst}
                        onClick={() => handleInstrumentChange(inst)}
                        className={`py-2 text-[10px] font-bold font-sans rounded-xl border transition-all cursor-pointer text-center ${
                          isSelected
                            ? isDark
                              ? 'bg-sky-520/20 border-sky-400 text-sky-300 font-extrabold shadow-sm'
                              : 'bg-[#a67c52] border-[#a67c52] text-white font-black shadow-sm'
                            : isDark 
                              ? 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white' 
                              : 'bg-white border-[#dacdb9]/80 text-[#5c4033] hover:bg-stone-50'
                        }`}
                      >
                        {labelMap[inst]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BLOCK 2: 选择节拍 */}
              <div className="mb-5">
                <span className={`text-[10px] block mb-2 font-black ${isDark ? 'text-gray-400' : 'text-[#826e5e]'} uppercase tracking-wider`}>
                  2. 选择节拍与时长平衡折算:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#111928] border-slate-800' : 'bg-white border-stone-200'
                  }`}>
                    <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                      <span className="text-stone-500">调整节拍速度系数:</span>
                      <span className="text-amber-600 font-mono text-[11px] font-black">
                        {Math.round(30000 / speedMs)} BPM ({speedMs}毫秒/单节步)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-stone-400">慢速</span>
                      <input 
                        type="range"
                        min="150"
                        max="700" 
                        step="50"
                        value={speedMs}
                        onChange={(e) => setSpeedMs(Number(e.target.value))}
                        className="flex-1 h-1.5 cursor-pointer accent-[#a67c52]"
                      />
                      <span className="text-[9px] text-stone-400">快骤</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex flex-col justify-center gap-1.5 text-left ${
                    isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-500/10 border-amber-200/50'
                  }`}>
                    <p className="text-[10px] font-black text-amber-700 flex items-center gap-1">
                      <Hourglass className="w-3.5 h-3.5 animate-pulse" /> 创作时长折算配比
                    </p>
                    <p className="text-[9px] text-stone-600 leading-normal">
                      小节演奏时长约合 {((8 * speedMs) / 1000).toFixed(2)} 秒。当前共 {bars.length} 个小节，累积演奏通长为 {((bars.length * 8 * speedMs) / 1000).toFixed(1)} 秒。
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOCK 3: 小节的框 */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] block font-black ${isDark ? 'text-gray-400' : 'text-[#826e5e]'} uppercase tracking-wider`}>
                    3. 编辑小节框架 (支持横向拖动进行换序, 点击选中合并循环):
                  </span>
                  
                  {selectedBarsList.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#a67c52]/10 border border-[#a67c52]/20 px-2 py-1 rounded-lg text-[9px] font-sans">
                      <span className="font-extrabold text-[#5c4033]">已选 {selectedBarsList.length} 个小节: </span>
                      <button
                        onClick={() => {
                          setIsPlayingSeq(true);
                          triggerToast("已启动循环演奏选中的若干小节");
                        }}
                        className="px-1.5 py-0.5 bg-[#a67c52] hover:bg-[#8e6b46] text-white rounded text-[8px] font-bold cursor-pointer"
                      >
                        循环所选
                      </button>
                      <button
                        onClick={() => {
                          if (bars.length - selectedBarsList.length < 1) {
                            triggerToast("不能删除全部，至少保留 1 个小节。");
                            return;
                          }
                          const nextBars = bars.filter((_, idx) => !selectedBarsList.includes(idx));
                          setBars(nextBars);
                          setSelectedBarsList([]);
                          setActiveBar(0);
                          triggerToast(`删除了刚才选中的 ${selectedBarsList.length} 个小节`);
                        }}
                        className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-bold cursor-pointer"
                      >
                        批量删除
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5" id="compact_bars_wrapper">
                  {bars.map((_, barIdx) => {
                    const isEditing = activeBar === barIdx;
                    const isCurrentlyPlayingThisBar = isPlayingSeq && currentPlayBar === barIdx;
                    const isMultiSelected = selectedBarsList.includes(barIdx);
                    const noteCount = bars[barIdx].flat().filter(Boolean).length;

                    return (
                      <div
                        key={barIdx}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(barIdx));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                          handleReorder(fromIdx, barIdx);
                        }}
                        onClick={() => setActiveBar(barIdx)}
                        className={`p-1.5 rounded-xl border transition-all cursor-move relative overflow-hidden flex flex-col justify-between aspect-square select-none group ${
                          isEditing
                            ? 'bg-[#a67c52] text-white border-[#a67c52] ring-1 ring-offset-1 ring-amber-500 shadow-md'
                            : isCurrentlyPlayingThisBar
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800'
                              : isMultiSelected
                                ? 'bg-amber-600/10 border-amber-500 text-amber-800'
                                : isDark
                                  ? 'bg-[#121a2d]/90 border-slate-800 text-gray-400 hover:bg-[#18233c]'
                                  : 'bg-[#fff] border-[#dacdb9]/80 text-[#5c4033] hover:bg-[#faf4e6]'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[12px] font-black font-mono">
                            {barIdx + 1}
                          </span>
                          
                          <div className="hidden group-hover:flex items-center gap-0.5 pointer-events-auto">
                            {barIdx > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveBar(barIdx, 'left');
                                }}
                                className="w-3 h-3 flex items-center justify-center rounded bg-stone-250/60 hover:bg-[#a67c52] hover:text-white text-[8px] cursor-pointer"
                              >
                                &lt;
                              </button>
                            )}
                            {barIdx < bars.length - 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveBar(barIdx, 'right');
                                }}
                                className="w-3 h-3 flex items-center justify-center rounded bg-stone-250/60 hover:bg-[#a67c52] hover:text-white text-[8px] cursor-pointer"
                              >
                                &gt;
                              </button>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (bars.length <= 1) {
                                triggerToast("至少需要保留 1 个小节进行演奏");
                                return;
                              }
                              const nextBars = bars.filter((_, idx) => idx !== barIdx);
                              setBars(nextBars);
                              setSelectedBarsList(prev => prev.filter(i => i !== barIdx));
                              if (activeBar >= nextBars.length) setActiveBar(nextBars.length - 1);
                              triggerToast(`已删除第 ${barIdx + 1} 小节`);
                            }}
                            className="w-4 h-4 rounded-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all text-[8px] shrink-0 cursor-pointer font-bold"
                          >
                            x
                          </button>
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[7.5px] opacity-75">
                            <span>{noteCount > 0 ? `${noteCount}音` : '空白'}</span>
                          </div>
                        </div>

                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBarsList(prev => 
                              prev.includes(barIdx) ? prev.filter(i => i !== barIdx) : [...prev, barIdx]
                            );
                          }}
                          className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                            isMultiSelected
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-stone-100/50 border-stone-300 hover:border-emerald-500'
                          }`}
                        >
                          {isMultiSelected && <Check className="w-2 h-2" />}
                        </div>

                        {isCurrentlyPlayingThisBar && (
                          <div className="absolute bottom-0 left-0 h-[3px] bg-emerald-500 transition-all rounded-full" style={{ width: `${(activeStep + 1)*12.5}%` }} />
                        )}
                      </div>
                    );
                  })}

                  <div
                    onClick={() => {
                      if (bars.length >= 16) {
                        triggerToast("已达到最大小节数量限制 16 个");
                        return;
                      }
                      setBars([...bars, Array.from({ length: 5 }, () => Array(8).fill(false))]);
                      triggerToast(`已新增第 ${bars.length + 1} 个小节进行创作`);
                    }}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center aspect-square select-none cursor-pointer border-dashed ${
                      isDark 
                        ? 'border-slate-800 text-sky-450 bg-slate-900/40 hover:bg-slate-850' 
                        : 'border-[#dacdb9] text-[#a67c52] bg-[#fdfbf6]/20 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-[14px] font-bold">+</span>
                    <span className="text-[7.5px] scale-90 opacity-80 mt-0.5">加小节</span>
                  </div>
                </div>
              </div>

              {/* BLOCK 4: DAW Grid Stage */}
              <div className={`p-4 rounded-2xl border mb-5 ${
                isDark ? 'bg-[#0f1624] border-slate-800' : 'bg-[#fff] border-[#dacdb9]/60 shadow-sm'
              }`}>
                
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b pb-3 border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-xs text-[#a67c52] uppercase bg-amber-500/10 px-2.5 py-1 rounded-lg">
                      第 {activeBar + 1} 小节
                    </span>
                    <span className="text-[10px] text-stone-400">直接点按下方谱格，注入主奏声符</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearCurrentBar}
                      className="px-2.5 py-1 text-red-500 hover:bg-red-500/10 rounded-lg border border-red-200 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-bold"
                    >
                      <Trash className="w-3 h-3" />
                      <span>清空此节</span>
                    </button>
                  </div>
                </div>

                {/* Piano roll matrix columns */}
                <div className="flex flex-col gap-2 relative z-10" id="step_sequencer_matrix">
                  {scaleNotes.map((note, rowIdx) => (
                    <div key={note.name} className="flex gap-2 items-center">
                      
                      <div className="w-11 shrink-0 select-none">
                        <span className={`w-9 h-9 rounded-xl font-bold font-sans text-xs flex items-center justify-center border shadow-xs ${
                          isDark 
                            ? 'bg-[#182235] border-slate-800 text-amber-400' 
                            : 'bg-[#f8f1e5] border-[#dacdb9] text-[#a67c52]'
                        }`}>
                          {note.name.slice(-1)}
                        </span>
                      </div>

                      <div className="flex-1 grid grid-cols-8 gap-1.5">
                        {Array.from({ length: 8 }).map((_, colIdx) => {
                          const isCellSelected = bars[activeBar] && bars[activeBar][rowIdx] && bars[activeBar][rowIdx][colIdx];
                          const isStepActive = activeStep === colIdx && isPlayingSeq && currentPlayBar === activeBar;
                          
                          return (
                            <div
                              key={colIdx}
                              onClick={() => toggleGridCell(rowIdx, colIdx)}
                              className={`h-11 rounded-xl border cursor-pointer select-none transition-all flex flex-col items-center justify-center relative active:scale-95 ${
                                isCellSelected
                                  ? isDark
                                    ? 'bg-gradient-to-br from-indigo-500/50 to-sky-500/20 border-sky-400 font-bold'
                                    : 'bg-[#a67c52] border-[#a67c52] text-white shadow-inner scale-[1.02]'
                                  : isDark
                                    ? 'bg-[#141b2a] border-slate-900 hover:bg-slate-800/50'
                                    : 'bg-[#faf7f0] border-[#ecdcb9]/55 hover:bg-[#ebdcb9]/40'
                              } ${isStepActive ? 'ring-2 ring-emerald-500 border-emerald-500 scale-95' : ''}`}
                            >
                              {isStepActive && (
                                <span className="absolute top-[3px] right-[3px] w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              )}
                              <span className={`text-[8px] font-mono leading-none ${isCellSelected ? 'opacity-80' : 'opacity-25'}`}>
                                拍{colIdx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ))}
                </div>

                {/* Legend helper */}
                <div className="mt-4 pt-3 border-t border-dashed border-stone-100 flex justify-between items-center text-[9px] text-[#8e7b6d] select-none">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-stone-400" />
                    <span>提示：横轴是拍子顺序，纵轴从上往下依次为低中高琴键音阶</span>
                  </span>
                  <span className="font-semibold text-stone-500 font-sans">
                    当前演奏乐器：{instrument === 'bowl' ? '磬钵' : instrument === 'harp' ? '至灵竖琴' : instrument === 'bell' ? '仙铃' : '钢琴'}
                  </span>
                </div>

              </div>

              {/* BLOCK 5: Limits information panel */}
              <div className="w-full">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#0f1624] border-slate-800' : 'bg-white border-[#ecdcb9]'
                }`}>
                  <div className="flex justify-between items-center mb-2.5 text-[10px] font-bold text-[#8e6b46] select-none">
                    <span>剩余精雕限额: {remainingMins.toFixed(1)} 分钟</span>
                    <span>正念硬币: {userCredits}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleExtendPlaytime}
                      className="flex-1 py-2 px-3 bg-[#a67c52] hover:bg-[#8e6b46] text-white text-[10px] font-extrabold rounded-xl transition-colors cursor-pointer text-center shadow-xs"
                    >
                      使用 10 硬币续期 5 分钟
                    </button>
                    <button
                      onClick={handleRefillCredits}
                      className="py-2 px-4 border border-[#dacdb9] hover:bg-stone-50 text-[10px] font-extrabold text-[#a67c52] rounded-xl transition-colors cursor-pointer text-center shadow-xs"
                    >
                      模拟充值
                    </button>
                  </div>
                </div>
              </div>

              {/* BLOCK 6: Bottom save trigger bar */}
              <div className="mt-6 pt-4 border-t border-dashed border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10.5px] font-black text-[#a67c52] uppercase shrink-0">乐曲命名:</span>
                  <input
                    type="text"
                    value={creationTitle}
                    onChange={(e) => setCreationTitle(e.target.value)}
                    placeholder="为本段疗愈琴篇命名..."
                    maxLength={20}
                    className={`px-3 py-2 rounded-xl text-xs w-full sm:w-56 border font-sans focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-sky-500' : 'bg-stone-50 border-[#dacdb9] text-[#5c4033] focus:border-[#a67c52]'
                    }`}
                  />
                </div>
                
                <button
                  onClick={() => {
                    setIsPlayingSeq(false);
                    setShowComposePanel(false);
                    const cTitle = creationTitle.trim() || `素问琴章 #${Math.floor(Math.random() * 899 + 100)}`;
                    if (onSaveCreation) {
                      onSaveCreation(cTitle, bars, instrument, Math.round(30000 / speedMs));
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#a67c52] hover:bg-[#8e6b46] border border-[#8e6b46] text-white text-[11.5px] font-black rounded-xl cursor-pointer hover:shadow-md transition-all active:scale-98 text-center"
                >
                  保存谱曲并返回首页面
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
