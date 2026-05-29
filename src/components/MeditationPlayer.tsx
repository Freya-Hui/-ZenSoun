import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, ShieldCheck, Star, Sparkles, Volume2, Music, Lock, Heart, VolumeX, Moon, Target, Zap, Search, X, ChevronRight, Bookmark, Clock, Timer, ArrowRight, Repeat, ListMusic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AudioVisualizer from './AudioVisualizer';
import { audioEngine } from '../utils/audioEngine';
import { getSupabase } from '../lib/supabase';

// PHYSICAL BINAURAL BEATS BASE AUDIO MODEL (Web Audio Stereo Architecture)
class LocalBinauralGenerator {
  private ctx: AudioContext | null = null;
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private gainL: GainNode | null = null;
  private gainR: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Final volume control
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // Soft background level

      // Connect merger directly to the destination speaker/headphones output
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize Web Audio Context for Left/Right Binaural Oscillations:', e);
    }
  }

  start(offsetFreq: number, value: number = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }

    this.stop(); // Stop any active nodes first before instantiating new ones

    // 1. Create twin independent oscillators
    this.oscL = this.ctx.createOscillator();
    this.oscR = this.ctx.createOscillator();

    // 2. Create twin left/right gain controllers
    this.gainL = this.ctx.createGain();
    this.gainR = this.ctx.createGain();

    // 3. Setup ChannelMerger to route left oscillator to left ear and right oscillator to right ear exclusively
    this.merger = this.ctx.createChannelMerger(2);

    this.oscL.type = 'sine';
    this.oscR.type = 'sine';

    const baseCarrier = 200; // Left ear base low frequency
    this.oscL.frequency.setValueAtTime(baseCarrier, this.ctx.currentTime);
    this.oscR.frequency.setValueAtTime(baseCarrier + (offsetFreq * value), this.ctx.currentTime);

    // Initial output gains
    this.gainL.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.gainR.gain.setValueAtTime(0.5, this.ctx.currentTime);

    // The brainwave tone GainNode (masterGain) scales with slider value from 0 to peak state (e.g. 0.06 max)
    const targetGain = 0.06 * value;
    this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);

    // Connecting Left ear channel
    this.oscL.connect(this.gainL);
    this.gainL.connect(this.merger, 0, 0); // Connect L gain output 0 to Merger input 0 (Left channel)

    // Connecting Right ear channel
    this.oscR.connect(this.gainR);
    this.gainR.connect(this.merger, 0, 1); // Connect R gain output 0 to Merger input 1 (Right channel)

    // Merger connects to physical final master volume gain
    this.merger.connect(this.masterGain);

    this.oscL.start();
    this.oscR.start();

    console.log(`[Binaural Wave Base Engine] Activated: Left Channel = ${baseCarrier}Hz, Right Channel = ${(baseCarrier + offsetFreq * value).toFixed(2)}Hz (Diff = ${(offsetFreq * value).toFixed(2)}Hz), Gain = ${targetGain}`);
  }

  update(offsetFreq: number, value: number) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }

    const baseCarrier = 200;
    const targetRightFreq = baseCarrier + (offsetFreq * value);
    const targetGain = 0.06 * value;

    if (this.oscL && this.oscR && this.masterGain && this.gainL && this.gainR) {
      try {
        this.oscL.frequency.setTargetAtTime(baseCarrier, this.ctx.currentTime, 0.1);
        this.oscR.frequency.setTargetAtTime(targetRightFreq, this.ctx.currentTime, 0.1);
        this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.15);
        console.log(`[Binaural Wave Base Engine] Adaptive Adjust: L=${baseCarrier}Hz, R=${targetRightFreq.toFixed(2)}Hz (Diff=${(offsetFreq*value).toFixed(2)}Hz), Gain=${targetGain.toFixed(4)}`);
      } catch (e) {
        this.start(offsetFreq, value);
      }
    } else {
      this.start(offsetFreq, value);
    }
  }

  stop() {
    if (this.oscL) {
      try { this.oscL.stop(); } catch (e) {}
      try { this.oscL.disconnect(); } catch (e) {}
      this.oscL = null;
    }
    if (this.oscR) {
      try { this.oscR.stop(); } catch (e) {}
      try { this.oscR.disconnect(); } catch (e) {}
      this.oscR = null;
    }
    if (this.gainL) {
      try { this.gainL.disconnect(); } catch (e) {}
      this.gainL = null;
    }
    if (this.gainR) {
      try { this.gainR.disconnect(); } catch (e) {}
      this.gainR = null;
    }
    if (this.merger) {
      try { this.merger.disconnect(); } catch (e) {}
      this.merger = null;
    }
  }
}

interface Track {
  id: string;
  title: string;
  desc: string;
  duration: number; // in seconds
  purpose: 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin';
  isPremium: boolean;
  intensityLabel: string;
  audioKeyword: string;
  audioUrl?: string;
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
    { id: 'sleep_1', title: '极速入梦 • 舒缓摇篮潮汐', desc: '轻柔海浪呼吸共鸣，帮助缓和肢体张力势能，引导快速进入睡眠准备。', duration: 420, purpose: 'sleep', isPremium: false, intensityLabel: '温和缓流 (1级)', audioKeyword: 'bowl', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'sleep_2', title: '深沉归宿 • 星海深潜磁场', desc: '虚空安神声疗，解离冗余思绪纠缠，引领深沉无梦长眠。', duration: 600, purpose: 'sleep', isPremium: false, intensityLabel: '沉浸深空 (2级)', audioKeyword: 'bowl', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'sleep_3', title: '无漏冥安 • 寂灭万籁清音', desc: '纯透磬音，消除深夜多虑，抚平深夜郁闷与情绪惊扰。', duration: 900, purpose: 'sleep', isPremium: true, intensityLabel: '极静万物 (3级)', audioKeyword: 'bowl', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
  ],
  focus: [
    { id: 'focus_1', title: '阳春拂林 • 晨光鸟朝凝神', desc: '春林山泉鸟语微声，舒缓思维紧缩状态，温和辅助高品质阅读。', duration: 300, purpose: 'focus', isPremium: false, intensityLabel: '浅度清脑 (1级)', audioKeyword: 'piano', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'focus_2', title: '安稳坚实 • 古磬贯注心流', desc: '清亮馨罄轻缓慢敲，收拢分散的白日念头，稳定工作学习聚焦度。', duration: 480, purpose: 'focus', isPremium: true, intensityLabel: '深度聚焦 (2级)', audioKeyword: 'bell', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 'focus_3', title: '心源灵动 • 原野星辉听涛', desc: '空旷而悠长的纯音粒子，阻绝周遭环境纷杂响声，大幅拉满脑力运行效率。', duration: 600, purpose: 'focus', isPremium: true, intensityLabel: '无垢思维 (3级)', audioKeyword: 'harp', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
  ],
  rest: [
    { id: 'rest_1', title: '幽谷清溪 • 息气行随自调', desc: '潺潺山泉融汇清纯和音，深层协调每一次呼气与吸气的悠长平衡。', duration: 360, purpose: 'rest', isPremium: false, intensityLabel: '自然呼吸 (1级)', audioKeyword: 'harp', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 'rest_2', title: '慈怀宽柔 • 抚慰释躁音轴', desc: '温厚竖琴缓缓舒拨，包容消退日常焦虑与抑郁胸闷感。', duration: 450, purpose: 'rest', isPremium: false, intensityLabel: '情绪松弛 (2级)', audioKeyword: 'piano', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { id: 'rest_3', title: '雨后新原 • 乾坤神安放空', desc: '空灵铜磬慢鸣，抚平日常重荷压力，使精气神完美空灵轻快。', duration: 540, purpose: 'rest', isPremium: true, intensityLabel: '虚怀气舒 (3级)', audioKeyword: 'bowl', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
  ],
  energy: [
    { id: 'energy_1', title: '阴霾撕裂 • 晨光和煦沐浴', desc: '和风煦煦搭配高音微振，拂掉肢体沉闷感，唤回肌肉原本温热。', duration: 300, purpose: 'energy', isPremium: false, intensityLabel: '微温驱沉 (1级)', audioKeyword: 'bell', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    { id: 'energy_2', title: '竹海洗炼 • 澄澈神智充能', desc: '竹浪微拂伴随欢快星铃，荡涤疲滞困顿并清凉提神。', duration: 420, purpose: 'energy', isPremium: true, intensityLabel: '朝气拉满 (2级)', audioKeyword: 'piano', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
    { id: 'energy_3', title: '风涌云散 • 精神浩然觉新', desc: '磅礴大气共振慢鸣，重塑意志生命张力，重拾往日高光动力。', duration: 500, purpose: 'energy', isPremium: true, intensityLabel: '意志觉新 (3级)', audioKeyword: 'harp', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
  ],
  wuyin: [
    { id: 'wuyin_1', title: '黄钟宫调 • 脾土宽泰和中', desc: '古法宫声调和脾胃，大吕纯正。温和平抑胸中郁结与挂虑焦躁，归元宽泰。', duration: 320, purpose: 'wuyin', isPremium: false, intensityLabel: '尊贵宫调 (1级)', audioKeyword: 'bowl', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
    { id: 'wuyin_2', title: '太簇商调 • 肺金清气息虑', desc: '传统商音肃降健肺，钟声悠远。平定悲观低落心气，理气顺心，速入清静。', duration: 420, purpose: 'wuyin', isPremium: false, intensityLabel: '清越商调 (2级)', audioKeyword: 'bell', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
    { id: 'wuyin_3', title: '姑洗角调 • 肝木生发平肝', desc: '角律通透疏肝解郁，木秀新发。疏导郁闷焦虑之无名虚火，身姿轻松，心情晴好。', duration: 480, purpose: 'wuyin', isPremium: true, intensityLabel: '生机角调 (3级)', audioKeyword: 'harp', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
    { id: 'wuyin_4', title: '林钟徵调 • 心火宁寂清安', desc: '徵音调和心火血脉，磬振天人。平抑心率多梦惊惧，宁定安顿，恢复祥和。', duration: 540, purpose: 'wuyin', isPremium: true, intensityLabel: '神安徵调 (4级)', audioKeyword: 'piano', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'wuyin_5', title: '南吕羽音 • 肾水潜藏涵气', desc: '羽声深邃滋养元精，海潮安魂。消除夜半慌张恐惧、精力耗竭，重锁深睡。', duration: 600, purpose: 'wuyin', isPremium: true, intensityLabel: '归底羽调 (5级)', audioKeyword: 'bowl', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
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
  
  // Dynamic reactive tracks storage
  const [tracks, setTracks] = useState<Record<'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin', Track[]>>(tracksData);
  
  // Advanced Acoustic controls to solve background line noise (hum and static hiss)
  const [enableBrainwave, setEnableBrainwave] = useState<boolean>(true);
  const [enableAmbientMix, setEnableAmbientMix] = useState<boolean>(true);

  // Elegant fading symbol overlay state on top of player panel
  const [fadingSymbol, setFadingSymbol] = useState<{ type: 'play' | 'pause'; id: number } | null>(null);
  const fadeCountRef = useRef(0);
  
  // Timer state for Free Users countdown (60s Limit)
  const [freeTimerLeft, setFreeTimerLeft] = useState(60);
  const [showTimedOutModal, setShowTimedOutModal] = useState(false);
  const [playMode, setPlayMode] = useState<'loop' | 'single' | 'random'>('single');
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(false);

  // Auto-shutdown sleep timer states
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number>(0);
  const sleepTimerRef = useRef<any>(null);

  // Dynamic playlist versioning & HTML5 Audio element reference
  const [playlistVersion, setPlaylistVersion] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Native components-level binaural beats generator reference
  const binauralGeneratorRef = useRef<LocalBinauralGenerator | null>(null);

  // Helper mappings between frontend category UI key and DB slug format
  const getQuerySlug = (cat: string): string => {
    const map: Record<string, string> = {
      sleep: 'sleep',
      focus: 'focus',
      rest: 'zen',
      energy: 'wake',
      wuyin: 'ancient'
    };
    return map[cat] || cat;
  };

  const getFrontendPurpose = (slug: string): 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin' => {
    const map: Record<string, 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin'> = {
      sleep: 'sleep',
      focus: 'focus',
      zen: 'rest',
      wake: 'energy',
      ancient: 'wuyin',
      rest: 'rest',
      energy: 'energy',
      wuyin: 'wuyin'
    };
    return map[slug] || 'sleep';
  };

  const mapDbTrackToTrack = (dbTrack: any): Track => {
    // purpose 字段严格读取 dbTrack.category_slug
    const dbSlug = dbTrack.category_slug || dbTrack.categorySlug || getQuerySlug(selectedCategory);
    const mappedPurpose = getFrontendPurpose(dbSlug);

    // desc 字段严格读取 dbTrack.subtitle（如果不存在再读 description），彻底消灭“暂无描述”
    let descriptionText = dbTrack.subtitle || dbTrack.description || dbTrack.desc;
    if (!descriptionText || descriptionText === '暂无描述') {
      const fallbacks: Record<string, string> = {
        sleep: '自适应舒缓双耳搏动脑波，温和协调深夜张力，引领安详寂静长眠。',
        focus: '纯正恒定高能声波流，滤除环境纷杂波动，拉升多感官专注心流。',
        rest: '传统乐磬微振鸣响，深层放空心气压力，自流导回虚怀澄澈境界。',
        energy: '高能上行气机律动，激活肢体朝气机能，重塑精妙生命动力。',
        wuyin: '经典五音古方疗法，深度调和脏腑能量运行，静心安神安魂。'
      };
      descriptionText = fallbacks[mappedPurpose] || '多声道立体共振，自适应调节声能，引导情绪归于和谐宁静。';
    }

    return {
      id: dbTrack.id?.toString() || Math.random().toString(),
      title: dbTrack.title || '无标题音轨',
      desc: descriptionText,
      duration: dbTrack.duration ? Number(dbTrack.duration) : 300,
      purpose: mappedPurpose,
      isPremium: dbTrack.is_premium ?? dbTrack.isPremium ?? false,
      intensityLabel: dbTrack.intensity_label || dbTrack.intensityLabel || '缓流 (1级)',
      audioKeyword: dbTrack.audio_keyword || dbTrack.audioKeyword || 'bowl',
      audioUrl: dbTrack.audio_url || dbTrack.audioUrl || ''
    };
  };

  // 2. 编写一个 useEffect 监听当前选中的分类导航 (category_slug) 并执行最强壮的单表精准查询
  useEffect(() => {
    let active = true;
    const fetchTracksFromSupabase = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        console.warn('Supabase client unavailable, using local synthesized custom tracks.');
        return;
      }
      try {
        const currentSlug = getQuerySlug(selectedCategory);
        console.log(`[Supabase Precision Fetch] Querying 'music' table directly for category_slug '${currentSlug}'`);

        // We query the music table directly and filter by category_slug, per user specification
        let { data, error } = await supabase
          .from('music')
          .select('*')
          .eq('category_slug', currentSlug);

        // Fallback for development/preview db cache if 'music' table does not exist
        if (error && (error.message?.includes('schema cache') || error.message?.includes('Could not find') || error.message?.includes('relation "music" does not exist'))) {
          console.log('[Supabase Development Fallback] "music" table not available in current environment cache, trying "music_tracks"...');
          const fallbackResult = await supabase
            .from('music_tracks')
            .select('*')
            .eq('category_slug', currentSlug)
            .order('sort_order', { ascending: true });
          
          if (!fallbackResult.error) {
            data = fallbackResult.data;
            error = null;
          } else {
            console.error('[Supabase Precision Fetch] Fallback failed:', fallbackResult.error.message);
          }
        }

        if (error) {
          console.error('[Supabase Precision Fetch] Failed to fetch tracks:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map(mapDbTrackToTrack);
          if (active) {
            setTracks(prev => ({
              ...prev,
              [selectedCategory]: mapped
            }));
            setPlaylistVersion(v => v + 1); // Triggers component state update safely
            console.log(`[Supabase Precision Fetch] Saved ${mapped.length} remote tracks into State for category '${selectedCategory}'.`);
          }
        } else {
          console.warn(`[Supabase Precision Fetch] No database records returned for category_slug '${currentSlug}'. Retaining preloaded tracks.`);
        }
      } catch (err) {
        console.error('Failed to pull custom playlist from Supabase:', err);
      }
    };

    fetchTracksFromSupabase();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

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
  const categoryTracks = tracks[selectedCategory];
  const activeTrack = categoryTracks[sliderLevel - 1] || categoryTracks[0];

  // Dynamically start, update and stop component-level binaural beats on state change (Step 4 Slider Golden Formula Binding)
  useEffect(() => {
    if (!binauralGeneratorRef.current) {
      binauralGeneratorRef.current = new LocalBinauralGenerator();
    }
    const generator = binauralGeneratorRef.current;

    if (isPlaying && enableBrainwave) {
      // 1. Determine target base freq offset based on database category slug
      const slug = getQuerySlug(selectedCategory);
      let targetOffset = 6.0; // default theta
      if (slug === 'sleep') targetOffset = 2.5;       // Delta wave (2.5 Hz)
      else if (slug === 'focus') targetOffset = 10.0;  // Alpha wave (10.0 Hz)
      else if (slug === 'zen') targetOffset = 6.0;     // Theta wave (6.0 Hz)
      else if (slug === 'wake') targetOffset = 15.0;   // Beta wave (15.0 Hz)
      else if (slug === 'ancient') targetOffset = 8.0; // Schumann Resonance (8.0 Hz)

      // 2. Compute slider relative value (value parameter from 0.0 to 1.0)
      const maxL = categoryTracks.length > 0 ? categoryTracks.length : (selectedCategory === 'wuyin' ? 5 : 3);
      const value = maxL > 1 ? (sliderLevel - 1) / (maxL - 1) : 1.0;

      // 3. Update the left and right Web Audio oscillators automatically
      generator.update(targetOffset, value);
    } else {
      generator.stop();
    }

    return () => {
      generator.stop();
    };
  }, [isPlaying, enableBrainwave, selectedCategory, sliderLevel, categoryTracks]);

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
          setSelectedCategory(getFrontendPurpose(category));
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
        const nextM = customEvent.detail.mode;
        setPlayMode(nextM);
        setIsLooping(nextM === 'single');
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
  }, [isPlaying, activeTrack, sliderLevel, selectedCategory, isPremiumUser, playMode, isLooping]);

  // Reset progress when active track changes
  useEffect(() => {
    setPlayProgress(0);
    setFreeTimerLeft(60);
    // If playing, restart audioEngine and update
    if (isPlaying) {
      audioEngine.updateBrainwave(activeTrack.purpose, 0.4);
      if (!activeTrack.audioUrl) {
        audioEngine.playMelody(activeTrack.audioKeyword, 2400);
      } else {
        audioEngine.stopMelody();
      }
    }
  }, [activeTrack]);

  // Synchronize HTML5 Audio element src & playback state safely
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // Apply loop status directly to HTML5 Audio element for gapless playback
    audio.loop = isLooping;

    if (isPlaying) {
      if (activeTrack && activeTrack.audioUrl) {
        // Stop background synthesized melodies when we have a full streaming track
        audioEngine.stopMelody();

        if (audio.src !== activeTrack.audioUrl) {
          audio.src = activeTrack.audioUrl;
          audio.load();
        }
        audio.play().catch(err => {
          console.warn('HTML5 Audio playback interrupted or failed:', err);
        });
      } else {
        audio.pause();
        audioEngine.playMelody(activeTrack.audioKeyword, 2400);
      }
    } else {
      audio.pause();
      // Keep background ambient noises if mixed, but stop active main synthesizer loop
      audioEngine.stopMelody();
    }
  }, [isPlaying, activeTrack?.id, activeTrack?.audioUrl, activeTrack?.audioKeyword, isLooping]);

  // Handle native "ended" event when we are NOT looping (i.e. playlist advancement)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEndedEvent = () => {
      if (!isLooping) {
        handleNextTrack();
      } else {
        audio.currentTime = 0;
        audio.play().catch(err => console.warn('HTML5 Audio loop transition failed:', err));
        setPlayProgress(0);
      }
    };

    audio.addEventListener('ended', handleEndedEvent);
    return () => {
      audio.removeEventListener('ended', handleEndedEvent);
    };
  }, [isLooping, activeTrack, sliderLevel, categoryTracks]);

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle Playback triggers
  useEffect(() => {
    if (isPlaying) {
      // 1. Play central solfeggio healing beat in background programmatically
      if (enableBrainwave) {
        audioEngine.updateBrainwave(activeTrack.purpose, 0.4);
      } else {
        audioEngine.stopBrainwave();
      }
      
      if (!activeTrack.audioUrl) {
        audioEngine.playMelody(activeTrack.audioKeyword, 2400);
      }

      // 2. Playback progress bar simulation
      progressTimerRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && activeTrack?.audioUrl && audio.duration) {
          const current = Math.floor(audio.currentTime);
          setPlayProgress(current);
          if (audio.ended || current >= Math.floor(audio.duration)) {
            if (isLooping) {
              setPlayProgress(0);
            } else {
              handleNextTrack();
            }
          }
        } else {
          setPlayProgress(prev => {
            if (prev >= activeTrack.duration) {
              if (isLooping) {
                return 0;
              }
              handleNextTrack();
              return 0;
            }
            return prev + 1;
          });
        }
      }, 1000);

      // 3. Free Users 60 Sec Countdown Restriction rule implementation!
      if (!isPremiumUser) {
        countdownTimerRef.current = setInterval(() => {
          setFreeTimerLeft(prev => {
            if (prev <= 1) {
              // Pause immediately
              setIsPlaying(false);
              audioEngine.stopAll();
              if (audioRef.current) audioRef.current.pause();
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
      if (audioRef.current) audioRef.current.pause();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isPlaying, activeTrack, isPremiumUser, enableBrainwave, isLooping]);

  // Trigger ambient background noises automatically on music play based on target purpose and user subscription tier
  useEffect(() => {
    if (isPlaying && enableAmbientMix) {
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
    } else {
      // Direct physical muting of synthetic weather channels if ambient mix option is unchecked
      audioEngine.setNoiseVolume('waves', false, 0);
      audioEngine.setNoiseVolume('rain', false, 0);
      audioEngine.setNoiseVolume('wind', false, 0);
      audioEngine.setNoiseVolume('campfire', false, 0);
    }
  }, [isPlaying, activeTrack, isPremiumUser, enableAmbientMix]);

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
    const maxL = categoryTracks.length;
    if (maxL === 0) return;

    if (playMode === 'single') {
      const audio = audioRef.current;
      if (audio && activeTrack.audioUrl) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn(e));
      }
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
    const maxL = categoryTracks.length;
    if (maxL === 0) return;

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

      {/* PROFESSIONAL CHAMPAGNE GOLD CONTROLS BAR */}
      <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-950/50 border-slate-900 shadow-inner' : 'bg-white border-stone-200/80 shadow-xs'
      }`} id="tactile_core_playback_controls">
        
        {/* Toggle IsLooping (单曲/列表循环) */}
        <button
          onClick={() => {
            const nextLoop = !isLooping;
            setIsLooping(nextLoop);
            setPlayMode(nextLoop ? 'single' : 'loop');
            
            // Sync up to App or play mode dispatch natively
            window.dispatchEvent(new CustomEvent('zensound-remote-mode', {
              detail: { mode: nextLoop ? 'single' : 'loop' }
            }));
          }}
          className={`p-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-bold ${
            isLooping 
              ? 'bg-[#a67c52]/15 text-amber-500 border border-amber-500/30' 
              : isDark ? 'bg-slate-900/40 text-gray-400 border border-slate-800/60' : 'bg-stone-50 text-stone-600 border border-stone-200/65'
          }`}
          title={isLooping ? "当前：单曲守护无缝循环" : "当前：列表顺序徐徐流转"}
        >
          {isLooping ? (
            <>
              <Repeat className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-amber-500 font-extrabold">单曲循环</span>
            </>
          ) : (
            <>
              <Repeat className="w-3.5 h-3.5 opacity-50" />
              <span>顺序播放</span>
            </>
          )}
        </button>

        {/* Previous, Play/Pause, Next controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handlePrevTrack()}
            className={`p-2.5 rounded-full cursor-pointer transition-all active:scale-95 ${
              isDark ? 'hover:bg-slate-900 text-gray-300' : 'hover:bg-[#a67c52]/10 text-[#5c4033]'
            }`}
            title="上一首"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => handlePlayPause()}
            className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-md ${
              isDark 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 text-white shadow-amber-900/30' 
                : 'bg-[#a67c52] hover:bg-[#8e6b46] text-white shadow-[#a67c52]/20'
            }`}
            title={isPlaying ? "暂停" : "激活声频"}
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 fill-white text-white" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-white text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleNextTrack()}
            className={`p-2.5 rounded-full cursor-pointer transition-all active:scale-95 ${
              isDark ? 'hover:bg-slate-900 text-gray-300' : 'hover:bg-[#a67c52]/10 text-[#5c4033]'
            }`}
            title="下一首"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* View Playlist / Library button */}
        <button
          onClick={() => {
            setLibraryFilterText('');
            setShowFullLibraryModal(true);
          }}
          className={`p-2 rounded-xl cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold ${
            isDark ? 'bg-slate-900/40 text-gray-400 hover:text-gray-300 hover:bg-slate-900' : 'bg-[#a67c52]/10 text-[#a67c52] hover:bg-[#a67c52]/15'
          }`}
          title="打开曲目全库"
        >
          <ListMusic className="w-3.5 h-3.5 text-amber-500" />
          <span className={isDark ? "text-gray-400 font-bold" : "text-[#a67c52] font-bold"}>静心雅集</span>
        </button>
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
            max={categoryTracks.length > 0 ? categoryTracks.length.toString() : (selectedCategory === 'wuyin' ? "5" : "3")}
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
            {Array.from({ length: categoryTracks.length > 0 ? categoryTracks.length : (selectedCategory === 'wuyin' ? 5 : 3) }).map((_, idx) => {
              const lvl = idx + 1;
              const isSelected = sliderLevel === lvl;
              const trackItem = categoryTracks[idx];
              let label = `${lvl}级`;
              if (trackItem) {
                const parts = trackItem.title.split(' • ');
                label = parts[1] || parts[0];
                if (label.length > 7) {
                  label = label.slice(0, 6) + '..';
                }
              } else {
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

      {/* 4. ADVANCED ACOUSTIC MIX CONTROLLER SCREEN */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-950/60 border-slate-900 shadow-inner' : 'bg-white border-stone-200/80 shadow-sm'
      }`} id="acoustic_environment_toggles_panel">
        <div className="flex justify-between items-center mb-2.5 font-sans">
          <span className={`text-[11px] font-extrabold flex items-center gap-1.5 ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> 耳腔低噪与声学深度调节 (释疑)
          </span>
        </div>

        <div className="flex flex-col gap-2.5 text-sans">
          {/* Toggle Brainwave beats drone hum */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/10 border border-transparent hover:border-slate-850 transition-all select-none">
            <div className="flex flex-col text-left gap-0.5 max-w-[240px]">
              <span className={`text-[10.5px] font-extrabold ${isDark ? 'text-gray-250' : 'text-stone-800'}`}>
                左右声道脑波共鸣 (Binaural Beats)
              </span>
              <span className="text-[9px] text-gray-500 font-sans leading-tight">
                低频双耳脉冲物理共鸣，感觉像深沉的耳鸣或微风长鸣气流音 (Binaural Hum)
              </span>
            </div>
            
            <button
              onClick={() => setEnableBrainwave(!enableBrainwave)}
              className={`w-9 h-5 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer duration-300 ${
                enableBrainwave ? 'bg-amber-500' : 'bg-slate-300/35'
              }`}
            >
              <div className={`h-4 w-4 rounded-full bg-white transition-all shadow-sm transform duration-300 ${
                enableBrainwave ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Toggle Automatic Ambient Nature Noises */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/10 border border-transparent hover:border-slate-850 transition-all select-none">
            <div className="flex flex-col text-left gap-0.5 max-w-[240px]">
              <span className={`text-[10.5px] font-extrabold ${isDark ? 'text-gray-250' : 'text-stone-800'}`}>
                智能天气环境背景音混入 (Auto Ambient Mix)
              </span>
              <span className="text-[9px] text-gray-500 font-sans leading-tight">
                播放时伴随叠加海浪、春雨微风等粉红/白噪音天气层，类似沙沙的背景底噪
              </span>
            </div>
            
            <button
              onClick={() => setEnableAmbientMix(!enableAmbientMix)}
              className={`w-9 h-5 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer duration-300 ${
                enableAmbientMix ? 'bg-amber-500' : 'bg-slate-300/35'
              }`}
            >
              <div className={`h-4 w-4 rounded-full bg-white transition-all shadow-sm transform duration-350 ${
                enableAmbientMix ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
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
