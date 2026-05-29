import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Music, ListMusic, Wand2, Compass, Award, User, Sparkles, Moon, Sun, ShieldAlert, BadgeInfo, Check, Heart, HelpCircle, X, Wallet, SkipBack, SkipForward, Play, Pause, Lock, ShieldCheck, CornerDownLeft, Send, ListCollapse, Inbox, Shuffle, Repeat, BookOpen, ChevronDown, HeartHandshake } from 'lucide-react';
import MeditationPlayer, { tracksData } from './components/MeditationPlayer';
import CustomSynthesizer from './components/CustomSynthesizer';
import PracticeTools from './components/PracticeTools';
import CommunityCenter from './components/CommunityCenter';
import PersonalProfile from './components/PersonalProfile';
import { SoundRecipe, DiaryEntry, Profile, CommunityPost, UserCreation } from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('zensound_logged_in') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'player' | 'synth' | 'practice' | 'community' | 'profile'>('player');
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    return (localStorage.getItem('zensound_theme') as 'day' | 'night') || 'day';
  });
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(() => {
    return localStorage.getItem('is_premium_v3') === 'true';
  });
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [isPaying, setIsPaying] = useState(false);

  // Active sub-states for login screen and verification code
  const [activeAuthTab, setActiveAuthTab] = useState<'login' | 'register' | 'guest'>('login');
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('zensound_is_guest') === 'true';
  });
  const [phoneInput, setPhoneInput] = useState('');
  const [authSName, setAuthSName] = useState('行静');
  const [authVerifyCode, setAuthVerifyCode] = useState('');
  const [authCodeSent, setAuthCodeSent] = useState(false);
  const [authExpectedCode, setAuthExpectedCode] = useState('');
  const [authSelAvatarIndex, setAuthSelAvatarIndex] = useState(0);

  // Secondary dialogue consultation state and simple player modal state
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showSimplePlayerModal, setShowSimplePlayerModal] = useState(false);
  const [showFloatingPlaylist, setShowFloatingPlaylist] = useState(false);
  const [isLikedTrack, setIsLikedTrack] = useState<boolean>(false);
  const [consultationHistory, setConsultationHistory] = useState<{ sender: 'user' | 'clinician'; text: string }[]>([
    { sender: 'clinician', text: '行者，此间心乱，感应气和五音自适开药。请问行者体内有何受阻邪气积滞，或是精气神有何不适纠缠？' }
  ]);

  // Quick notifier floating pill
  const [notifText, setNotifText] = useState<string | null>(null);

  // App Profile statistics (with local persistence)
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('zensound_user_profile_v2');
    if (saved) return JSON.parse(saved);
    return {
      name: '疗愈旅人',
      avatar: 'PL',
      isPremium: false,
      joinDate: '2026-05-27',
      listeningTime: 124,
      streak: 3
    };
  });

  useEffect(() => {
    // Keep profile premium status in sync with global state
    setProfile(p => ({ ...p, isPremium: isPremiumUser }));
  }, [isPremiumUser]);

  useEffect(() => {
    localStorage.setItem('zensound_user_profile_v2', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!showSimplePlayerModal) {
      setShowFloatingPlaylist(false);
    }
  }, [showSimplePlayerModal]);

  // Track playing status for global mini audio bar
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<string | null>(null);

  // Synchronized playback context for the persistent global floating dynamic island
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    trackTitle: string;
    duration: number;
    progress: number;
    purpose: 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin';
    playMode?: 'loop' | 'single' | 'random';
  } | null>(null);

  // Saved Custom Recipes
  const [savedRecipes, setSavedRecipes] = useState<SoundRecipe[]>(() => {
    const raw = localStorage.getItem('saved_recipes_v3');
    if (raw) return JSON.parse(raw);
    
    // Default system preset recipes
    return [
      {
        id: 'p_1',
        name: '空山晨祷松涛',
        creator: '系统推荐',
        isCustom: false,
        noises: [
          { id: 'rain', name: '寂雨森林', icon: '雨', volume: 40, isActive: true },
          { id: 'wind', name: '山谷松风', icon: '风', volume: 55, isActive: true }
        ],
        purpose: 'rest',
        purposeLabel: '正念静心',
        melodyInstrument: 'bowl',
        tempo: 'ambient',
        likesCount: 152,
        isLiked: false,
        isSaved: true,
        isPremium: false,
        description: '让天然风过山谷、伴随着纯透松涛，深层舒解一天的身心疲累。'
      },
      {
        id: 'p_2',
        name: '海潮夜漫繁星',
        creator: '系统推荐',
        isCustom: false,
        noises: [
          { id: 'waves', name: '涌动潮汐', icon: '海', volume: 60, isActive: true }
        ],
        purpose: 'sleep',
        purposeLabel: '极速助眠',
        melodyInstrument: 'harp',
        tempo: 'ambient',
        likesCount: 219,
        isLiked: false,
        isSaved: true,
        isPremium: false,
        description: '慢升起落海浪潮汐配合柔和竖琴长拨，适合快速平息焦灼，深度放松入睡。'
      }
    ];
  });

  // User custom music compositions (我的创作中心)
  const [userCreations, setUserCreations] = useState<UserCreation[]>(() => {
    const raw = localStorage.getItem('healing_user_creations_v3');
    if (raw) return JSON.parse(raw);
    return [];
  });

  const [activeCreationToLoad, setActiveCreationToLoad] = useState<UserCreation | null>(null);

  // Healing Diary input log database
  const [diaries, setDiaries] = useState<DiaryEntry[]>(() => {
    const raw = localStorage.getItem('healing_diaries_v3');
    if (raw) return JSON.parse(raw);
    return [];
  });

  // Preset community posts (discussion forum) with premium formula attachments
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const raw = localStorage.getItem('community_posts_v3');
    if (raw) return JSON.parse(raw);

    return [
      {
        id: 'post_1',
        userName: '静听松波',
        userAvatar: '松',
        userIsPremium: true,
        content: '最近一到深夜心跳就会莫名变快，浑身浮躁。用了自配的这个「风入松林」定速调息。配合 4s / 4s / 4s 呼吸引导，不到 5 轮呼吸心绪就慢慢降下去了，分享给大家。',
        createdAt: '今天 09:20',
        likes: 42,
        isLiked: false,
        recipe: {
          id: 'sr_post_1',
          name: '风入松林 • 息虑拍',
          creator: '静听松波',
          isCustom: false,
          noises: [
            { id: 'wind', name: '山谷松风', icon: '风', volume: 50, isActive: true },
            { id: 'rain', name: '寂雨森林', icon: '雨', volume: 25, isActive: true }
          ],
          purpose: 'rest',
          purposeLabel: '正念静心',
          melodyInstrument: 'bowl',
          tempo: 'ambient',
          likesCount: 42,
          isLiked: false,
          isSaved: false,
          isPremium: true,
          description: '以 55% 幽谷微风为核心搭配清磬清音。'
        },
        comments: [
          { id: 'com_1_1', userName: '月夜行者', content: '颂磬的声音一敲出来真的鸡皮疙瘩都起来了，太享受了！', date: '5分钟前' }
        ]
      },
      {
        id: 'post_2',
        userName: '星空冥想者',
        userAvatar: '星',
        userIsPremium: false,
        content: '昨晚听着深睡助眠音流听了很久，真的很舒服啊！特别是在戴了降噪耳机后开着温和的木鱼敲动，仿佛能将一整天工作的尾气排放洗刷干净。电子木鱼设计的真是功德无量！',
        createdAt: '昨天 23:14',
        likes: 18,
        isLiked: false,
        comments: []
      },
      {
        id: 'post_3',
        userName: '妙法导师',
        userAvatar: '法',
        userIsPremium: true,
        content: '这里分享一套失眠急救配方，在「自配」调成：海潮40% + 寂雨30%，乐器换成：竖琴，功效调成：深睡助眠。一般听到 10 分钟就会不知不觉困住了。',
        createdAt: '3天前',
        likes: 83,
        isLiked: false,
        recipe: {
          id: 'sr_post_3',
          name: '失眠急救星海配方',
          creator: '妙法导师',
          isCustom: false,
          noises: [
            { id: 'waves', name: '涌动潮汐', icon: '海', volume: 40, isActive: true },
            { id: 'rain', name: '寂雨森林', icon: '雨', volume: 30, isActive: true }
          ],
          purpose: 'sleep',
          purposeLabel: '极速助眠',
          melodyInstrument: 'harp',
          tempo: 'ambient',
          likesCount: 83,
          isLiked: false,
          isSaved: false,
          isPremium: true,
          description: '海潮结合雨水，最古老经典的安享解压。'
        },
        comments: [
          { id: 'com_3_1', userName: '小熊软糖', content: '试了一下，配合呼吸引导一觉睡到大天亮！吹爆！', date: '1天前' }
        ]
      }
    ];
  });

  // Track premium status state syncing
  useEffect(() => {
    localStorage.setItem('is_premium_v3', isPremiumUser.toString());
    setProfile(p => ({ ...p, isPremium: isPremiumUser }));
  }, [isPremiumUser]);

  useEffect(() => {
    localStorage.setItem('zensound_theme', theme);
  }, [theme]);

  // Persists local structures
  useEffect(() => {
    localStorage.setItem('saved_recipes_v3', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    localStorage.setItem('healing_diaries_v3', JSON.stringify(diaries));
  }, [diaries]);

  useEffect(() => {
    localStorage.setItem('community_posts_v3', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('healing_user_creations_v3', JSON.stringify(userCreations));
  }, [userCreations]);

  // Global Notifier Helper
  const triggerNotification = (text: string) => {
    setNotifText(text);
    setTimeout(() => {
      setNotifText(null);
    }, 2800);
  };

  // 1. Handlers for diaries
  const handleAddDiary = (content: string, mood: string, aiResp?: any) => {
    const freshEntry: DiaryEntry = {
      id: `diary_${Date.now()}`,
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      content,
      mood,
      aiResponse: aiResp
    };
    setDiaries(prev => [freshEntry, ...prev]);
    // Increase listening time count dynamically
    setProfile(p => ({ ...p, listeningTime: p.listeningTime + 5 }));
    triggerNotification('[心疗日记] 今日心里日志已在前台加密封存');
  };

  const handleDeleteDiary = (id: string) => {
    setDiaries(prev => prev.filter(d => d.id !== id));
    triggerNotification('[记录擦除] 记录已妥善销毁');
  };

  const handleLogOut = () => {
    localStorage.removeItem('zensound_logged_in');
    setIsLoggedIn(false);
    triggerNotification('[安全登出] 修静状态已保存，您已安全登出');
  };

  // 2. Handlers for custom recipes (Save & Share)
  const handleSaveRecipe = (recipe: SoundRecipe) => {
    setSavedRecipes(prev => [recipe, ...prev]);
    triggerNotification(`[配方保存] 配方: ${recipe.name} 已妥善保存至我的收藏库`);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    triggerNotification(`[配方移除] 配方已从我的配方库中移除`);
  };

  const handleSaveUserCreation = (
    name: string,
    barsData: boolean[][][],
    instrument: 'harp' | 'bell' | 'bowl' | 'piano',
    bpm: number
  ) => {
    const labelMap = { bowl: '磬钵禅鸣', harp: '至灵竖琴', bell: '空灵编钟', piano: '和韵钢琴' };
    const noteCount = barsData.flat(2).filter(Boolean).length;
    
    const newCreation: UserCreation = {
      id: `creation_${Date.now()}`,
      name: name,
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      instrument: instrument,
      instrumentLabel: labelMap[instrument],
      barCount: barsData.length,
      totalNotes: noteCount,
      bpm: bpm,
      barsData: barsData
    };
    
    setUserCreations(prev => [newCreation, ...prev]);
    triggerNotification(`[音轨入库] 乐曲《${name}》已载入「我的创作中心」！`);
  };

  const handleDeleteUserCreation = (id: string) => {
    setUserCreations(prev => prev.filter(c => c.id !== id));
    triggerNotification(`[音轨删除] 该创作曲谱已从我的创作中心移除`);
  };

  const handleShareRecipeToCommunity = (recipe: SoundRecipe) => {
    // Add to saved recipes too
    setSavedRecipes(prev => [recipe, ...prev]);

    // Construct a beautiful community post post
    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      userName: profile.name,
      userAvatar: profile.avatar,
      userIsPremium: isPremiumUser,
      content: `最新调制的心灵声能配方，取名为「${recipe.name}」，对治我的今日心境。欢迎收藏收听。`,
      createdAt: '今天 刚发布',
      likes: 0,
      isLiked: false,
      recipe: recipe,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    triggerNotification(`[配方发布] 配方已成功分析整理并分享至讨论广场`);
  };

  // 3. One-key Import / Load recipes from community
  const handleImportRecipe = (recipe: SoundRecipe) => {
    // Verify duplicates
    const exist = savedRecipes.some(r => r.name === recipe.name);
    if (exist) {
      triggerNotification('[提示] 您的收藏夹中已包含此声波理疗配比');
      return;
    }

    const imported: SoundRecipe = {
      ...recipe,
      id: `import_${Date.now()}`,
      creator: `${recipe.creator} (转存)`,
      isSaved: true
    };

    setSavedRecipes(prev => [imported, ...prev]);
    triggerNotification(`[配方同步] 成功同步: ${recipe.name} 的声波配比到收藏列表`);
  };

  // Apply recipe configurations directly to generator
  const handleApplyRecipeDirectly = (recipe: SoundRecipe) => {
    triggerNotification(`[配方装配] 正在载入并装配: ${recipe.name} 的声波心流...`);
    // Will show notification and switch active tabs to Generator to play
    setActiveTab('synth');
  };

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLikedState = !p.isLiked;
        return {
          ...p,
          isLiked: nextLikedState,
          likes: nextLikedState ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    }));
  };

  // 4. Create premium post message
  const handleAddCommunityMessage = (text: string) => {
    const newP: CommunityPost = {
      id: `post_${Date.now()}`,
      userName: profile.name,
      userAvatar: profile.avatar,
      userIsPremium: isPremiumUser,
      content: text,
      createdAt: '刚刚',
      likes: 0,
      isLiked: false,
      comments: []
    };
    setPosts(prev => [newP, ...prev]);
    triggerNotification('[交流发布] 讨论帖子已分享至疗愈中心');
  };

  // 5. Checkout payment simulation
  const handleSubscribePayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      setIsPremiumUser(true);
      triggerNotification('[订阅开通] 恭喜您，已成功订阅开通尊享版全功能！');
    }, 1800);
  };

  const resetSubscribeModal = () => {
    setShowSubscribeModal(false);
    setPaymentSuccess(false);
  };

  return (
    <div className={`h-[100dvh] sm:min-h-screen flex flex-col justify-start sm:justify-center items-center py-0 sm:py-4 md:py-8 font-sans antialiased overflow-hidden relative transition-colors duration-300 ${
      theme === 'night' ? 'bg-[#060a13] text-gray-200 selection:bg-sky-500/25' : 'bg-[#f4ebd9] text-[#4e3629] selection:bg-[#a67c52]/20'
    }`}>
      {/* Dynamic ambient star cloud background */}
      {theme === 'night' ? (
        <>
          <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-sky-200/20 rounded-full filter blur-3xl pointer-events-none" />
        </>
      )}

      {/* Dynamic helper floating popups */}
      <AnimatePresence>
        {notifText && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 z-[9999] px-4 py-2.5 border text-xs font-sans font-bold rounded-xl shadow-2xl flex items-center gap-1.5 backdrop-blur-md ${
              theme === 'night' 
                ? 'bg-[#0e1629] border-cyan-500/35 text-sky-300' 
                : 'bg-white border-stone-200 text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>{notifText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full sm:max-w-sm md:max-w-md h-[100dvh] sm:h-[680px] shrink-0 relative z-10 flex flex-col justify-start overflow-hidden" id="main_viewport">
        {/* TOP STATUS LOGO */}
        <div className="flex items-center justify-between px-5 py-2.5 text-center mb-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-sm shadow select-none ${
              theme === 'night' ? 'bg-gradient-to-tr from-sky-500 to-indigo-650' : 'bg-gradient-to-tr from-sky-450 to-amber-550'
            }`}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`text-sm font-black tracking-wide font-sans ${theme === 'night' ? 'text-gray-100' : 'text-stone-850'}`}>
                深愈静音 <span className="text-[10px] text-sky-500 font-bold">ZenSound</span>
              </h1>
              <span className={`text-[8px] block text-left uppercase tracking-wider font-sans font-medium ${
                theme === 'night' ? 'text-gray-500' : 'text-stone-500'
              }`}>
                至纯纯正功效调息声疗
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-sans">
            {/* ELEGANT DAY NIGHT THEME BUTTON */}
            <button
              onClick={() => setTheme(prev => prev === 'day' ? 'night' : 'day')}
              className={`p-1.5 rounded-full border cursor-pointer active:scale-95 transition-all outline-none ${
                theme === 'night'
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300'
                  : 'bg-white border-stone-300 text-sky-600 hover:text-sky-800 shadow-sm'
              }`}
              title={theme === 'night' ? '开启日光晨治' : '开启极夜静修'}
              id="theme_switcher_btn"
            >
              {theme === 'night' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {isPremiumUser ? (
              <span className="bg-amber-500 text-slate-950 font-sans text-[10px] font-black px-2 py-0.5 rounded shadow select-none uppercase">
                PRO
              </span>
            ) : (
              <button 
                onClick={() => setShowSubscribeModal(true)}
                className={`text-[9.5px] border hover:text-white transition-all px-2.5 py-0.5 rounded-full font-sans cursor-pointer flex items-center gap-1 ${
                  theme === 'night' 
                    ? 'bg-[#0c1629] border-slate-800 text-gray-400' 
                    : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Lock className="w-2.5 h-2.5 text-amber-500" />
                <span>订阅特权 ¥19.9/月</span>
              </button>
            )}
          </div>
        </div>

        {/* --- PREMIUM PHONE ENCLOSING WRAPPER FRAME (BEZEL DESIGN FEEL) --- */}
        <div className={`w-full flex-1 rounded-none sm:rounded-[36px] overflow-hidden flex flex-col justify-between relative transition-all duration-300 ${
          theme === 'night'
            ? 'bg-[#090e1a] border-0 sm:border-4 border-[#121c33] shadow-none sm:shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
            : 'bg-[#fdfaf3] border-0 sm:border-4 border-[#dacdb9] shadow-none sm:shadow-[0_20px_50px_rgba(100,70,40,0.1)] text-[#4e3629]'
        }`} id="phone_wrapper_frame">
          
          {!isLoggedIn ? (
            /* BRAND ZEN GATE_PORTAL FORM WITH VERIFICATION DUAL-TAB */
            <div className="w-full h-full flex flex-col p-5 items-center justify-center relative font-sans select-none overflow-y-auto">
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full filter blur-2xl ${
                  theme === 'night' ? 'bg-indigo-500/10' : 'bg-amber-400/15'
                }`} />
                <div className={`absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full filter blur-2xl ${
                  theme === 'night' ? 'bg-sky-500/10' : 'bg-rose-200/20'
                }`} />
              </div>

              <div className="z-10 text-center flex flex-col items-center w-full max-w-[290px]">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl mb-3 border ${
                    theme === 'night' 
                      ? 'bg-slate-900 border-slate-800 text-sky-400' 
                      : 'bg-white border-stone-250 text-indigo-700 shadow-sm'
                  }`}
                >
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>

                <h2 className={`text-sm font-extrabold tracking-widest ${
                  theme === 'night' ? 'text-white' : 'text-stone-900'
                }`}>
                  深愈静音 • 驻守净土
                </h2>
                <p className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 opacity-50 ${
                  theme === 'night' ? 'text-gray-400' : 'text-stone-550'
                }`}>
                  Spiritual Zen Sanctuary
                </p>

                {/* AUTH SELECT TABS */}
                <div className={`flex w-full rounded-lg p-0.5 mt-4 border ${
                  theme === 'night' ? 'bg-slate-950 border-slate-900' : 'bg-stone-100 border-stone-250'
                }`}>
                  <button
                    onClick={() => {
                      setActiveAuthTab('guest');
                      setAuthCodeSent(false);
                      setAuthVerifyCode('');
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      activeAuthTab === 'guest'
                        ? theme === 'night'
                          ? 'bg-slate-800 text-sky-400 shadow-inner'
                          : 'bg-white text-indigo-700 shadow border border-stone-200'
                        : theme === 'night' ? 'text-gray-500' : 'text-stone-500'
                    }`}
                  >
                    游客登录
                  </button>
                  <button
                    onClick={() => {
                      setActiveAuthTab('login');
                      setAuthCodeSent(false);
                      setAuthVerifyCode('');
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      activeAuthTab === 'login'
                        ? theme === 'night'
                          ? 'bg-slate-800 text-sky-400 shadow-inner'
                          : 'bg-white text-indigo-700 shadow border border-stone-200'
                        : theme === 'night' ? 'text-gray-500' : 'text-stone-500'
                    }`}
                  >
                    行者登录
                  </button>
                  <button
                    onClick={() => {
                      setActiveAuthTab('register');
                      setAuthCodeSent(false);
                      setAuthVerifyCode('');
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      activeAuthTab === 'register'
                        ? theme === 'night'
                          ? 'bg-slate-800 text-sky-400 shadow-inner'
                          : 'bg-white text-indigo-700 shadow border border-stone-200'
                        : theme === 'night' ? 'text-gray-500' : 'text-stone-500'
                    }`}
                  >
                    修心注册
                  </button>
                </div>

                {/* FORM FIELDS & GUEST DESCRIPTION */}
                {activeAuthTab === 'guest' ? (
                  <div className={`p-4 rounded-xl border mt-5 text-center flex flex-col items-center gap-3 transition-colors ${
                    theme === 'night' 
                      ? 'bg-slate-950/60 border-slate-900 text-gray-400' 
                      : 'bg-stone-50 border-stone-250 text-stone-600'
                  }`} id="visitor_info_card">
                    <Compass className="w-8 h-8 text-sky-500 animate-pulse mt-1" />
                    <div className="space-y-1 text-center">
                      <h4 className={`text-xs font-bold ${theme === 'night' ? 'text-white' : 'text-stone-850'}`}>游方旅客静修通道</h4>
                      <p className="text-[10.5px] leading-relaxed opacity-80 font-sans">
                        无需绑定任何手机号。您将以「游客」身份直接进入本境，免费修持呼吸调节、自配白噪音能量、古典木鱼、静心钵，以及收听全部精选 FLAC 无损愈疗音轨，数据将安全隔离存储在本设备本地。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-left mt-4 space-y-3" id="standard_auth_fields">
                    <div>
                      <label className={`text-[9.5px] font-bold tracking-wider mb-1 block opacity-60 ${
                        theme === 'night' ? 'text-gray-400' : 'text-stone-650'
                      }`}>
                        手机号 / 电子邮箱：
                      </label>
                      <input
                        type="text"
                        placeholder="请输入11位手机号或邮箱"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold font-sans tracking-wide outline-none focus:ring-1 transition-all ${
                          theme === 'night'
                            ? 'bg-slate-950 border border-slate-800 text-white placeholder-gray-600 focus:ring-sky-500/50'
                            : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:ring-indigo-500 shadow-inner'
                        }`}
                      />
                    </div>

                    {activeAuthTab === 'register' && (
                      <div>
                        <label className={`text-[9.5px] font-bold tracking-wider mb-1 block opacity-60 ${
                          theme === 'night' ? 'text-gray-400' : 'text-stone-650'
                        }`}>
                          自拟法号 (灵性名字)：
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="自拟法号 (如: 行静 / 观心)"
                          value={authSName}
                          onChange={(e) => setAuthSName(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold font-sans tracking-wide outline-none focus:ring-1 transition-all ${
                            theme === 'night'
                              ? 'bg-slate-950 border border-slate-800 text-white placeholder-gray-600 focus:ring-sky-500/50'
                              : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:ring-indigo-500 shadow-inner'
                          }`}
                        />
                      </div>
                    )}

                    {/* VERIFICATION CODE BOX */}
                    <div>
                      <label className={`text-[9.5px] font-bold tracking-wider mb-1 block opacity-60 ${
                        theme === 'night' ? 'text-gray-400' : 'text-stone-650'
                      }`}>
                        验证码 (短信或邮件)：
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="输入验证码"
                          value={authVerifyCode}
                          onChange={(e) => setAuthVerifyCode(e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold font-sans tracking-wide outline-none focus:ring-1 transition-all ${
                            theme === 'night'
                              ? 'bg-slate-950 border border-slate-800 text-white placeholder-gray-600 focus:ring-sky-500/50'
                              : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:ring-indigo-500 shadow-inner'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!phoneInput.trim()) {
                              triggerNotification('[核验失败] 请先输入手机号或邮箱');
                              return;
                            }
                            setAuthCodeSent(true);
                            setAuthExpectedCode('8888');
                            triggerNotification('[短信派发] 验证凭证已下发至您的终端: 8888');
                          }}
                          className={`px-3 py-2 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                            theme === 'night'
                              ? 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800'
                              : 'bg-stone-200 hover:bg-stone-300 text-indigo-700'
                          }`}
                        >
                          {authCodeSent ? '重发 (8888)' : '获取验证码'}
                        </button>
                      </div>
                    </div>

                    {/* AVATAR CHIP CHOOSER */}
                    {activeAuthTab === 'register' && (
                      <div>
                        <label className={`text-[9.5px] font-bold tracking-wider mb-1 block opacity-60 ${
                          theme === 'night' ? 'text-gray-400' : 'text-stone-650'
                        }`}>
                          选择修法字符法相：
                        </label>
                        <div className="grid grid-cols-5 gap-1.5" id="login_avatar_choice_grid">
                          {['静', '定', '宽', '明', '和', '清', '虚', '空', '觉', '释'].map((av, avIdx) => {
                            const isSelected = authSelAvatarIndex === avIdx;
                            return (
                              <button
                                key={av}
                                type="button"
                                onClick={() => setAuthSelAvatarIndex(avIdx)}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black hover:bg-stone-500/5 cursor-pointer border transition-all ${
                                  isSelected 
                                    ? theme === 'night' ? 'border-sky-500 bg-sky-500/10 text-sky-450' : 'border-indigo-500 bg-indigo-50/20 text-indigo-750'
                                    : 'border-transparent text-gray-400'
                                }`}
                              >
                                {av}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (activeAuthTab === 'guest') {
                      localStorage.setItem('zensound_logged_in', 'true');
                      localStorage.setItem('zensound_is_guest', 'true');
                      localStorage.setItem('zensound_user_name', '游客');
                      
                      setProfile(prev => ({
                        ...prev,
                        name: '游客',
                        avatar: '旅'
                      }));

                      setIsLoggedIn(true);
                      setIsGuest(true);
                      triggerNotification(`[游方体验] 已作为游客行者进入静思此境！随时可以在“我的”页面注册登录。`);
                      return;
                    }

                    if (!phoneInput.trim()) {
                      triggerNotification('[校验失败] 请填写您的手机号或电子邮箱');
                      return;
                    }
                    if (authVerifyCode !== '8888') {
                      triggerNotification('[校验失败] 验证凭据错误，请输入「8888」快捷进入');
                      return;
                    }

                    const spiritualName = activeAuthTab === 'register' ? authSName.trim() : '观心行者';
                    const avsList = ['静', '定', '宽', '明', '和', '清', '虚', '空', '觉', '释'];
                    const chosenAv = avsList[authSelAvatarIndex] || '静';

                    localStorage.setItem('zensound_logged_in', 'true');
                    localStorage.setItem('zensound_user_name', spiritualName);
                    localStorage.removeItem('zensound_is_guest');
                    
                    setProfile(prev => ({
                      ...prev,
                      name: spiritualName,
                      avatar: chosenAv
                    }));

                    setIsLoggedIn(true);
                    setIsGuest(false);
                    // Automatically prompt subscription comparisons on login/register!
                    setShowSubscribeModal(true);
                    triggerNotification(`[静心开启] 调息就位！欢迎归位，${spiritualName}行者。已为您开启会员增值校验`);
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs mt-5 select-none shadow-lg tracking-wider transform active:scale-98 transition-all cursor-pointer ${
                    theme === 'night'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-650 hover:from-sky-450 text-white shadow-sky-500/10'
                      : 'bg-stone-900 text-white hover:bg-stone-850 shadow'
                  }`}
                >
                  {activeAuthTab === 'guest' ? '以游客身份轻启修行' : activeAuthTab === 'login' ? '立即验证登录' : '创建修心账户'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SCREEN PANEL MAIN SCROLLER AREA */}
              <div className="flex-1 overflow-y-auto flex flex-col" id="screen_core_panel">
                <div className={activeTab === 'player' ? 'block' : 'hidden'}>
                  <MeditationPlayer
                    isPremiumUser={isPremiumUser}
                    onOpenSubscribeModal={() => setShowSubscribeModal(true)}
                    onTrackPlayingChange={(playing, title) => {
                      setCurrentPlayingTrack(playing ? title : null);
                    }}
                    onPlaybackStateChange={(state) => {
                      setPlaybackState(state);
                    }}
                    theme={theme}
                  />
                </div>

                {activeTab === 'synth' && (
                  <CustomSynthesizer
                    isPremiumUser={isPremiumUser}
                    onOpenSubscribeModal={() => setShowSubscribeModal(true)}
                    onSaveRecipe={handleSaveRecipe}
                    onShareRecipeToCommunity={handleShareRecipeToCommunity}
                    onSaveCreation={handleSaveUserCreation}
                    activeCreationToLoad={activeCreationToLoad}
                    onClearActiveCreationToLoad={() => setActiveCreationToLoad(null)}
                    userCreations={userCreations}
                    theme={theme}
                  />
                )}

                {activeTab === 'practice' && (
                  <PracticeTools 
                    theme={theme}
                    isPremiumUser={isPremiumUser}
                    onOpenSubscribeModal={() => setShowSubscribeModal(true)}
                  />
                )}

                {activeTab === 'community' && (
                  <CommunityCenter
                    isPremiumUser={isPremiumUser}
                    onOpenSubscribeModal={() => setShowSubscribeModal(true)}
                    savedRecipesList={savedRecipes}
                    onAddMessage={handleAddCommunityMessage}
                    posts={posts}
                    onLikePost={handleLikePost}
                    onImportRecipe={handleImportRecipe}
                  />
                )}

                {activeTab === 'profile' && (
                  <PersonalProfile
                    profile={profile}
                    diaries={diaries}
                    isPremiumUser={isPremiumUser}
                    isGuest={isGuest}
                    onAddDiary={handleAddDiary}
                    onDeleteDiary={handleDeleteDiary}
                    onOpenSubscribeModal={() => setShowSubscribeModal(true)}
                    onSimulateSync={() => triggerNotification('🔄 正在安全加密打包数据同步至 Supabase 云数据库...')}
                    onApplyRecipe={handleApplyRecipeDirectly}
                    theme={theme}
                    onUpdateProfile={(updated) => {
                      setProfile(p => ({ ...p, ...updated }));
                    }}
                    onLogOut={handleLogOut}
                    savedRecipes={savedRecipes}
                    onDeleteRecipe={handleDeleteRecipe}
                    userCreations={userCreations}
                    onDeleteCreation={handleDeleteUserCreation}
                    onLoadCreation={(creation) => {
                      setActiveCreationToLoad(creation);
                      setActiveTab('synth');
                      triggerNotification(`[琴谱载入] 正在重新载入您的自主创作《${creation.name}》琴章并开启矩阵面板...`);
                    }}
                  />
                )}
              </div>

              {/* PERSISTENT FLOATING PLAYER ISLAND */}
              {playbackState && activeTab !== 'synth' && (
                <div className={`mx-3 mb-2 px-3 py-2 rounded-xl border flex items-center justify-between select-none shadow-lg z-40 relative backdrop-blur-md transition-all duration-300 ${
                  theme === 'night'
                    ? 'bg-slate-900/95 border-slate-800 text-gray-200'
                    : 'bg-white/95 border-stone-200 text-stone-950 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                }`} id="global_floating_player">
                  <div 
                    onClick={() => setShowSimplePlayerModal(true)}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow shrink-0 ${
                      playbackState.isPlaying ? 'animate-spin' : ''
                    } ${
                      theme === 'night' ? 'bg-slate-800 border border-slate-700' : 'bg-stone-100 border border-stone-200'
                    }`} style={{ animationDuration: '6s' }}>
                      {playbackState.purpose === 'sleep' && <Moon className="w-3.5 h-3.5 text-sky-400" />}
                      {playbackState.purpose === 'focus' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      {playbackState.purpose === 'rest' && <Heart className="w-3.5 h-3.5 text-rose-400" />}
                      {playbackState.purpose === 'energy' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      {playbackState.purpose === 'wuyin' && <Music className="w-3.5 h-3.5 text-purple-450" />}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[9px] font-bold tracking-wider uppercase opacity-50">
                        {playbackState.purpose === 'sleep' && '加深睡眠'}
                        {playbackState.purpose === 'focus' && '专注心流'}
                        {playbackState.purpose === 'rest' && '空灵静心'}
                        {playbackState.purpose === 'energy' && '活力苏醒'}
                        {playbackState.purpose === 'wuyin' && '古法疗愈'}
                      </p>
                      <p className="text-[11px] font-extrabold truncate text-sky-500 font-sans mt-0.5">
                        {playbackState.trackTitle.split(' • ')[1] || playbackState.trackTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('zensound-prev-track'));
                      }}
                      className={`p-1 rounded-full cursor-pointer hover:text-sky-500 transition-colors ${
                        theme === 'night' ? 'text-gray-400' : 'text-stone-500'
                      }`}
                      title="上一曲"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('zensound-toggle-play'));
                      }}
                      className="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center cursor-pointer shadow active:scale-95 transition-all"
                      title={playbackState.isPlaying ? '暂停' : '播放'}
                    >
                      {playbackState.isPlaying ? (
                        <Pause className="w-3 h-3 fill-white" />
                      ) : (
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('zensound-next-track'));
                      }}
                      className={`p-1 rounded-full cursor-pointer hover:text-sky-500 transition-colors ${
                        theme === 'night' ? 'text-gray-400' : 'text-stone-500'
                      }`}
                      title="下一曲"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-500/15 overflow-hidden rounded-b-xl">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300" 
                      style={{ width: `${(playbackState.progress / playbackState.duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* BOTTOM MAIN NAV TABS BAR */}
              <div className={`h-16 flex items-center justify-around px-2 relative z-30 shrink-0 select-none transition-colors duration-300 ${
                theme === 'night' 
                  ? 'bg-[#0c1326] border-t border-slate-900' 
                  : 'bg-[#f4ebd5] border-t border-[#dacdb9]'
              }`} id="phone_bottom_bar">
                {/* Player Tab */}
                <button
                  onClick={() => setActiveTab('player')}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                    activeTab === 'player' 
                      ? theme === 'night' ? 'text-sky-500 scale-102 font-bold' : 'text-[#a67c52] scale-102 font-black' 
                      : theme === 'night' 
                        ? 'text-gray-500 hover:text-gray-400' 
                        : 'text-[#826e5e] hover:text-[#4e3629]'
                  }`}
                >
                  <Music className="w-5 h-5" />
                  <span className="text-[9.5px] mt-1 font-sans">音疗</span>
                </button>

                {/* Synthesizer Tab */}
                <button
                  onClick={() => setActiveTab('synth')}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                    activeTab === 'synth' 
                      ? theme === 'night' ? 'text-sky-500 scale-102 font-bold' : 'text-[#a67c52] scale-102 font-black' 
                      : theme === 'night' 
                        ? 'text-gray-500 hover:text-gray-400' 
                        : 'text-[#826e5e] hover:text-[#4e3629]'
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span className="text-[9.5px] mt-1 font-sans">自配</span>
                </button>

                {/* Zen Practices Tab */}
                <button
                  onClick={() => setActiveTab('practice')}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                    activeTab === 'practice' 
                      ? theme === 'night' ? 'text-sky-500 scale-102 font-bold' : 'text-[#a67c52] scale-102 font-black' 
                      : theme === 'night' 
                        ? 'text-gray-500 hover:text-gray-400' 
                        : 'text-[#826e5e] hover:text-[#4e3629]'
                  }`}
                >
                  <Radio className="w-5 h-5" />
                  <span className="text-[9.5px] mt-1 font-sans">修心</span>
                </button>

                {/* Community/Disc Tab */}
                <button
                  onClick={() => setActiveTab('community')}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                    activeTab === 'community' 
                      ? theme === 'night' ? 'text-sky-500 scale-102 font-bold' : 'text-[#a67c52] scale-102 font-black' 
                      : theme === 'night' 
                        ? 'text-gray-500 hover:text-gray-400' 
                        : 'text-[#826e5e] hover:text-[#4e3629]'
                  }`}
                >
                  <Compass className="w-5 h-5" />
                  <span className="text-[9.5px] mt-1 font-sans">讨论</span>
                </button>

                {/* Profile Tab */}
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                    activeTab === 'profile' 
                      ? theme === 'night' ? 'text-sky-500 scale-102 font-bold' : 'text-[#a67c52] scale-102 font-black' 
                      : theme === 'night' 
                        ? 'text-gray-500 hover:text-gray-400' 
                        : 'text-[#826e5e] hover:text-[#4e3629]'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[9.5px] mt-1 font-sans">我的</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop guide help footnotes */}
        <div className={`text-center mt-3 text-[10.5px] selection:bg-transparent ${
          theme === 'night' ? 'text-gray-500' : 'text-stone-500'
        }`}>
          双模式自适应优化良好 • 心海澄澈 气顺神安
        </div>
      </div>

      {/* --- PRICING SUBSCRIPTION MOCK PAYMENT DIALOG GATE MODAL --- */}
      <AnimatePresence>
        {showSubscribeModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#111827] to-[#040814] border border-amber-500/25 rounded-[24px] overflow-hidden shadow-2xl relative p-5"
              id="subscribe_modal"
            >
              {/* Close Button */}
              <button 
                onClick={resetSubscribeModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 border border-slate-800 text-gray-500 hover:text-white cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {!paymentSuccess ? (
                <>
                  <div className="text-center pb-2 select-none">
                    <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Award className="w-5 h-5 text-amber-500 animate-bounce" />
                    </div>
                    <h3 className="text-xs font-black text-gray-100 font-sans">订阅深愈静音 PRO 专业版</h3>
                    <p className="text-[10.5px] text-amber-500/90 font-medium font-sans mt-0.5">
                      一份小小的支持，解锁终身无限心灵调息
                    </p>
                  </div>

                  {/* COMPARISON TIER DETAILS GRID */}
                  <div className="my-3 border border-slate-800/80 rounded-xl overflow-hidden text-[9px] font-sans">
                    <div className="grid grid-cols-3 bg-slate-900/90 border-b border-slate-800/70 p-2 font-bold text-gray-300">
                      <div>专属权益</div>
                      <div className="text-center text-gray-400">非会员/体验</div>
                      <div className="text-center text-amber-400">尊享 PRO 会员</div>
                    </div>
                    <div className="divide-y divide-slate-900/60 font-sans text-gray-400">
                      <div className="grid grid-cols-3 p-1.5">
                        <div className="font-semibold text-gray-200">环境白噪音</div>
                        <div className="text-center">仅限 寂雨</div>
                        <div className="text-center text-amber-400 font-semibold font-mono">全部开通自调</div>
                      </div>
                      <div className="grid grid-cols-3 p-1.5">
                        <div className="font-semibold text-gray-200">主题词库</div>
                        <div className="text-center">经典4大预设</div>
                        <div className="text-center text-amber-400 font-semibold font-mono">自定义专属词库</div>
                      </div>
                      <div className="grid grid-cols-3 p-1.5">
                        <div className="font-semibold text-gray-200">守护流播放</div>
                        <div className="text-center">60秒自动暂停</div>
                        <div className="text-center text-amber-400 font-semibold font-mono">终身无限时长</div>
                      </div>
                      <div className="grid grid-cols-3 p-1.5">
                        <div className="font-semibold text-gray-200">无损音疗</div>
                        <div className="text-center">标清音轨</div>
                        <div className="text-center text-amber-400 font-semibold font-mono">24-bit 无损 FLAC</div>
                      </div>
                    </div>
                  </div>

                  {/* Core Plans Display */}
                  <div className="space-y-3 my-2 shadow-inner">
                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 relative">
                      <div className="absolute top-2 right-2.5 bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[7px] px-1 py-0.5 rounded font-black tracking-widest font-sans">
                        终身畅听
                      </div>
                      <p className="text-xs font-bold text-gray-100 font-sans">连续畅听不中断专业版本</p>
                      <div className="flex justify-between items-baseline mt-1">
                        <span className="text-[9px] text-gray-500 font-sans">终身一次自愈</span>
                        <span className="text-lg font-bold text-amber-400 font-mono">¥ 19.9 <span className="text-[10px] text-gray-500 font-normal">/ 终身</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods simulation choice */}
                  <div className="bg-[#070b13] p-3 rounded-xl border border-slate-900 mb-3" id="checkout_methods">
                    <p className="text-[9.5px] text-sky-450 font-black mb-2 flex items-center gap-1 font-sans">
                      <Wallet className="w-3.5 h-3.5" /> 请选择安全加密支付通道
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-sans text-[10px]">
                      <button
                        onClick={() => setPayMethod('alipay')}
                        className={`py-2 rounded-lg font-semibold cursor-pointer border flex justify-center items-center gap-1.5 transition-all ${
                          payMethod === 'alipay'
                            ? 'bg-sky-500/15 border-sky-400/50 text-sky-400'
                            : 'bg-slate-900 border-transparent text-gray-500 hover:bg-slate-800'
                        }`}
                      >
                        支付宝安全付款
                      </button>
                      <button
                        onClick={() => setPayMethod('wechat')}
                        className={`py-2 rounded-lg font-semibold cursor-pointer border flex justify-center items-center gap-1.5 transition-all ${
                          payMethod === 'wechat'
                            ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-400'
                            : 'bg-slate-900 border-transparent text-gray-500 hover:bg-slate-800'
                        }`}
                      >
                        微信快捷钱包
                      </button>
                    </div>
                  </div>

                  {/* Core action */}
                  <button
                    onClick={handleSubscribePayment}
                    disabled={isPaying}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 font-sans"
                  >
                    {isPaying ? '正在向安全银行服务器验证款项...' : `立即开通 PRO 终身服务 (一次性 19.9 元)`}
                  </button>
                </>
              ) : (
                <div className="text-center py-6 select-none font-sans flex flex-col items-center">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100">订阅付款开通成功！</h3>
                  <p className="text-xs text-gray-400 mt-2.5 px-3 leading-relaxed">
                    感谢您支持独立愈疗声波事业！您的账户已成功和本地端物理沙盒与 Supabase 加密链同步。全部环境白噪音调制组合、自定义主题词库、无损 FLAC 音疗轨道及无限播放时长均已解锁重置！
                  </p>

                  <button
                    onClick={resetSubscribeModal}
                    className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-all font-semibold"
                  >
                    开启声波冥想旅程
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONSULTATION INTEGRATED PAGE (问诊二级页面 + 播放列表/模式) --- */}
      <AnimatePresence>
        {showConsultationModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[888] flex items-center justify-center p-3 select-none">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-md h-[95dvh] rounded-[24px] overflow-hidden flex flex-col shadow-2xl relative border border-slate-800/80 bg-[#0c101d]"
              id="consultation_modal_window"
            >
              {/* Header block with close panel */}
              <div className="p-4 border-b border-slate-900 flex items-center justify-between shrink-0 bg-[#080b14]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/20">
                    <BookOpen className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-left font-sans">
                    <h3 className="text-xs font-bold text-gray-100">神阙气能问诊殿堂</h3>
                    <p className="text-[10px] text-gray-400">融情志之理，调和五脏能量声波</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConsultationModal(false)}
                  className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-gray-500 hover:text-white cursor-pointer transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Core interactive scroll body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
                {/* 1. Quick diagnostic interactive consultation row */}
                <div className="bg-slate-900/60 border border-slate-800/50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-sky-400 mb-2 uppercase tracking-wide">
                    请选择您当下的情志或生理困扰：
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'fire', text: '【心火亢盛】烦躁郁闷、难以安坐、注意力溃散', cat: 'focus', lv: 2, diag: '诊断：白日挂碍扰脑，气阻郁积。建议采用古磬梵音震鸣，安顿烦乱。已为您载入排播。' },
                      { key: 'insomnia', text: '【宿夜不寐】思绪纷呈、惊醒辗转、难以熟睡', cat: 'sleep', lv: 3, diag: '诊断：肾气不降，阳不入阴。建议采用海潮余韵和寂灭钵敲清音，安魂凝神。五秒后排播入梦。' },
                      { key: 'exhaust', text: '【精神不振】午后昏沉、脑能停滞、精气枯竭', cat: 'energy', lv: 2, diag: '诊断：脉气下陷，脾气不调。建议借竹拂风涛、清凉高音拨片以苏醒原本精气。已为您排播。' },
                      { key: 'tight', text: '【郁闷不舒】胸口发满、呼吸短促、无名焦虑', cat: 'rest', lv: 3, diag: '诊断：肝气失宣，行随气喘。建议引入空谷清泉与温厚竖琴缓缓抚平情志。已为您排播。' },
                      { key: 'wuyin', text: '【五脏不调】气血滞阻、想听古法音律共鸣保养', cat: 'wuyin', lv: 1, diag: '诊断：脏腑滞郁，中气未谐。建议使用华夏经典宫律与黄钟调和脾土，神泰安中。已自动为您排播。' }
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => {
                          const recommendedTrackName = item.cat === 'sleep' ? '深沉归宿 • 星海深潜磁场' : item.cat === 'focus' ? '安稳坚实 • 古磬贯注心流' : item.cat === 'energy' ? '竹海洗炼 • 澄澈神智充能' : item.cat === 'rest' ? '雨后新原 • 乾坤神安放空' : '黄钟宫调 • 脾土宽泰和中';
                          // Add mock log to consultationHistory state
                          setConsultationHistory(prev => [
                            ...prev,
                            { type: 'question', content: item.text },
                            { type: 'answer', content: `${item.diag}【推荐药方：${recommendedTrackName}】` }
                          ]);
                          // Dispatch custom remote play event
                          window.dispatchEvent(new CustomEvent('zensound-remote-play', {
                            detail: { category: item.cat, level: item.lv }
                          }));
                        }}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-800 bg-[#0d1222] hover:bg-slate-800 text-gray-300 font-sans hover:text-white transition-all text-[11px]"
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated consultation logs dialogue output */}
                <div className="bg-slate-900/30 border border-slate-900/60 p-3 rounded-xl rounded-b-none space-y-3">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wrap border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
                    仙风心疗诊断单及处方记录：
                  </p>
                  
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {consultationHistory.length === 0 ? (
                      <p className="text-gray-500 italic text-[10px] text-center py-4">
                        点击上方症状即可出具调和诊断，并由核心音疗播放器自动载入排播该药方音轨。
                      </p>
                    ) : (
                      consultationHistory.map((log, i) => (
                        <div key={i} className={`p-2 rounded-lg leading-relaxed text-[11px] ${
                          log.type === 'question' 
                            ? 'bg-[#1e1a14] border border-amber-500/10 text-amber-300 ml-4' 
                            : 'bg-sky-500/5 text-sky-300 mr-4'
                        }`}>
                          <p className="font-sans font-medium">{log.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Controls and active track panel in diagnosis window */}
                {playbackState && (
                  <div className="bg-[#111625] border border-slate-800/80 p-3 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-sky-400">
                      <span className="font-bold flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-sky-400" />
                        当前排播音轨
                      </span>
                      <span className="font-mono text-gray-500">
                        {Math.floor(playbackState.progress / 60)}:{(playbackState.progress % 60) < 10 ? '0' : ''}{playbackState.progress % 60} / {Math.floor(playbackState.duration / 60)}:{playbackState.duration % 60}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-black text-gray-100 font-sans truncate">
                        {playbackState.trackTitle}
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${(playbackState.progress / playbackState.duration) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Integrated play mode switcher row inside secondary page */}
                    <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[10.5px]">
                      <span className="text-gray-400 font-medium">播放模式转换</span>
                      <div className="flex items-center gap-1">
                        {[
                          { key: 'loop', label: '列表循环', icon: Repeat },
                          { key: 'single', label: '单曲循环', icon: Repeat },
                          { key: 'random', label: '随机播放', icon: Shuffle }
                        ].map(mode => {
                          const isActive = (playbackState.playMode || 'loop') === mode.key;
                          return (
                            <button
                              key={mode.key}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('zensound-remote-mode', {
                                  detail: { mode: mode.key }
                                }));
                                triggerNotification(`[播放模式] 已顺利设定为: ${mode.label}`);
                              }}
                              className={`px-2 py-1 rounded border flex items-center gap-1 text-[9px] font-sans font-bold cursor-pointer transition-all ${
                                isActive 
                                  ? 'bg-[#1d1b11] border-amber-500/40 text-amber-300 shadow shadow-amber-500/10' 
                                  : 'bg-slate-900 border-transparent text-gray-500 hover:text-gray-400'
                              }`}
                            >
                              <mode.icon className="w-2.5 h-2.5" />
                              <span>{mode.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simple controls */}
                    <div className="flex justify-center items-center gap-4 border-t border-slate-900 pt-1.5">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('zensound-prev-track'))}
                        className="p-1 px-3 bg-slate-900 hover:bg-slate-800 text-gray-400 rounded-lg cursor-pointer text-[10px] font-sans flex items-center gap-1 font-bold"
                      >
                        <SkipBack className="w-3 h-3" />
                        <span>前曲</span>
                      </button>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('zensound-toggle-play'))}
                        className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center cursor-pointer shadow active:scale-95"
                      >
                        {playbackState.isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white ml-0.5" />}
                      </button>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('zensound-next-track'))}
                        className="p-1 px-3 bg-slate-900 hover:bg-slate-800 text-gray-400 rounded-lg cursor-pointer text-[10px] font-sans flex items-center gap-1 font-bold"
                      >
                        <span>后曲</span>
                        <SkipForward className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Full catalog track playlist for immediate remote playback and subscription triggers */}
                <div className="bg-[#0b0e15] border border-slate-900 p-3 rounded-xl space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex justify-between items-center">
                    <span>系统五大主题医用配方总库：</span>
                    <span className="text-gray-500 font-medium">共 15 首</span>
                  </p>
                  
                  <div className="divide-y divide-slate-900 text-xs text-stone-250 space-y-1 max-h-[150px] overflow-y-auto pr-1">
                    {[
                      { pid: 'sleep_1', name: '极速入梦 • 舒缓摇篮潮汐', cat: 'sleep', lv: 1, premium: false },
                      { pid: 'sleep_2', name: '深沉归宿 • 星海深潜磁场', cat: 'sleep', lv: 2, premium: false },
                      { pid: 'sleep_3', name: '无漏冥安 • 寂灭万籁清音', cat: 'sleep', lv: 3, premium: true },
                      { pid: 'focus_1', name: '阳春拂林 • 晨光鸟朝凝神', cat: 'focus', lv: 1, premium: false },
                      { pid: 'focus_2', name: '安稳坚实 • 古磬贯注心流', cat: 'focus', lv: 2, premium: true },
                      { pid: 'focus_3', name: '心源灵动 • 原野星辉听涛', cat: 'focus', lv: 3, premium: true },
                      { pid: 'rest_1', name: '幽谷清溪 • 息气行随自调', cat: 'rest', lv: 1, premium: false },
                      { pid: 'rest_2', name: '慈怀宽柔 • 抚慰释躁音轴', cat: 'rest', lv: 2, premium: false },
                      { pid: 'rest_3', name: '雨后新原 • 乾坤神安放空', cat: 'rest', lv: 3, premium: true },
                      { pid: 'energy_1', name: '阴霾撕裂 • 晨光和煦沐浴', cat: 'energy', lv: 1, premium: false },
                      { pid: 'energy_2', name: '竹海洗炼 • 澄澈神智充能', cat: 'energy', lv: 2, premium: true },
                      { pid: 'energy_3', name: '风涌云散 • 精神浩然觉新', cat: 'energy', lv: 3, premium: true },
                      { pid: 'wuyin_1', name: '黄钟宫调 • 脾土宽泰和中', cat: 'wuyin', lv: 1, premium: false },
                      { pid: 'wuyin_2', name: '太簇商调 • 肺金清气息虑', cat: 'wuyin', lv: 2, premium: false },
                      { pid: 'wuyin_3', name: '姑洗角调 • 肝木生发平肝', cat: 'wuyin', lv: 3, premium: true },
                      { pid: 'wuyin_4', name: '林钟徵调 • 心火宁寂清安', cat: 'wuyin', lv: 4, premium: true },
                      { pid: 'wuyin_5', name: '南吕羽音 • 肾水潜藏涵气', cat: 'wuyin', lv: 5, premium: true }
                    ].map(tr => {
                      const isLockAndNotPre = tr.premium && !isPremiumUser;
                      return (
                        <div 
                          key={tr.pid}
                          onClick={() => {
                            if (isLockAndNotPre) {
                              setShowSubscribeModal(true);
                              return;
                            }
                            window.dispatchEvent(new CustomEvent('zensound-remote-play', {
                              detail: { category: tr.cat, level: tr.lv }
                            }));
                            triggerNotification(`[排播转换] 已为您顺畅载入音轨: ${tr.name}`);
                          }}
                          className="flex justify-between items-center p-2 rounded-lg cursor-pointer hover:bg-slate-9050/60 transition-all text-[11px]"
                        >
                          <div className="flex-1 truncate pr-2 text-left font-sans font-medium text-gray-300 hover:text-white">
                            {tr.name}
                          </div>
                          <div className="shrink-0 flex items-center">
                            {isLockAndNotPre ? (
                              <span className="p-1 px-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8.5px] uppercase font-bold flex items-center gap-0.5 font-sans">
                                <Lock className="w-2.5 h-2.5" /> 会员
                              </span>
                            ) : (
                              <span className="text-[9.5px] text-sky-400 font-medium font-sans">
                                点击播放
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSimplePlayerModal && playbackState && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[900] flex items-center justify-center p-3 select-none">
            <div 
              className={`w-full max-w-md h-[95dvh] rounded-[28px] overflow-hidden flex flex-col shadow-2xl relative border transition-all duration-300 ${
                theme === 'night' 
                  ? 'border-slate-900 bg-[#070b13] text-gray-200' 
                  : 'border-[#dacdb9]/80 bg-[#fdfaf3] text-[#4e3629]'
              }`}
              id="qq_style_simple_player"
            >
              {/* Dynamic Blurred Glow Base */}
              <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[90px] opacity-35 pointer-events-none -z-10 transition-colors duration-1000 ${
                playbackState.purpose === 'sleep' ? 'bg-sky-500' :
                playbackState.purpose === 'focus' ? 'bg-emerald-500' :
                playbackState.purpose === 'rest' ? 'bg-rose-500' :
                playbackState.purpose === 'energy' ? 'bg-amber-500' : 'bg-indigo-500'
              }`} />

              {/* Dynamic Watermark Background Grids */}
              <div className={`absolute inset-0 pointer-events-none -z-10 transition-opacity duration-300 ${
                theme === 'night' 
                  ? 'bg-[radial-gradient(circle_at_bottom_left,#030712_20%,transparent_100%)] opacity-70' 
                  : 'bg-[radial-gradient(circle_at_bottom_left,#f4ebd5_30%,transparent_100%)] opacity-85'
              }`} />

              {/* Top Action Header */}
              <div className={`p-4 flex items-center justify-between shrink-0 border-b transition-colors ${
                theme === 'night' 
                  ? 'border-slate-950 bg-[#05080f]/74' 
                  : 'border-[#dacdb9]/45 bg-[#fbf5e7]/85'
              } backdrop-blur`}>
                <button 
                  onClick={() => setShowSimplePlayerModal(false)}
                  className={`p-1.5 rounded-full cursor-pointer transition-all active:scale-95 ${
                    theme === 'night' 
                      ? 'bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white' 
                      : 'bg-[#ebdcb9] hover:bg-[#ebdfc8]/80 text-[#5c4033] hover:text-[#2d1e18]'
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className={`text-[10px] font-black tracking-widest uppercase block mb-0.5 ${
                    theme === 'night' ? 'text-sky-450' : 'text-[#a67c52]'
                  }`}>
                    神弦妙音 • 专效修持
                  </span>
                  <span className={`text-[11px] font-black ${theme === 'night' ? 'text-gray-300' : 'text-[#4e3629]'}`}>
                    {playbackState.purpose === 'sleep' && '加深睡眠中'}
                    {playbackState.purpose === 'focus' && '专注心流中'}
                    {playbackState.purpose === 'rest' && '灵台空明中'}
                    {playbackState.purpose === 'energy' && '活力苏醒中'}
                    {playbackState.purpose === 'wuyin' && '五脏谐振中'}
                  </span>
                </div>
                <div className="w-10 h-10" />
              </div>

              {/* Core interactive Body */}
              <div className="flex-1 flex flex-col justify-around p-6 overflow-y-auto relative">
                
                {/* Turntable Section */}
                <div className="relative flex flex-col items-center justify-center my-4">
                  {/* Tone arm stylus needle */}
                  <div 
                    className="absolute -top-6 right-[24%] w-16 h-28 z-50 origin-top transition-transform duration-700 ease-in-out pointer-events-none"
                    style={{
                      transform: playbackState.isPlaying ? 'rotate(10deg)' : 'rotate(-20deg)',
                    }}
                  >
                    <svg width="45" height="100" viewBox="0 0 45 100" fill="none" className="drop-shadow-lg">
                      <path d="M5 5h10l8 45h4l2 15h-4l-3-8h-5l1-7h-4L5 5z" fill={theme === 'night' ? '#94a3b8' : '#8e6b46'} />
                      <circle cx="10" cy="5" r="4" fill={theme === 'night' ? '#64748b' : '#5c4033'} />
                      <circle cx="10" cy="5" r="2" fill="#fff" />
                      <circle cx="21" cy="58" r="2.5" fill="#ef4444" />
                    </svg>
                  </div>

                  {/* Outer record ring */}
                  <div className={`w-60 h-60 rounded-full flex items-center justify-center border-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative p-1.5 overflow-hidden ${
                    theme === 'night' ? 'bg-slate-950 border-slate-900' : 'bg-[#1b120c] border-[#8e6b46]/50'
                  }`}>
                    <div className={`w-full h-full rounded-full border border-gray-100/10 flex items-center justify-center relative ${
                      playbackState.isPlaying ? 'animate-spin' : ''
                    }`} style={{ animationDuration: '24s', animationTimingFunction: 'linear' }}>
                      
                      {/* Vinyl micro grooves lines */}
                      <div className="absolute inset-2 border border-zinc-900/40 rounded-full" />
                      <div className="absolute inset-4 border border-zinc-900/45 rounded-full" />
                      <div className="absolute inset-6 border border-zinc-800/20 rounded-full" />
                      <div className="absolute inset-10 border border-zinc-900/50 rounded-full" />
                      <div className="absolute inset-14 border border-zinc-900/55 rounded-full" />
                      <div className="absolute inset-18 border border-zinc-800/30 rounded-full" />

                      {/* Record Label sticker with gloss effect */}
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-tr flex items-center justify-center border-2 border-slate-950 overflow-hidden relative shadow-inner ${
                        theme === 'night' ? 'from-slate-900 via-sky-950 to-slate-900' : 'from-[#a67c52] via-[#8f663c] to-[#a67c52]'
                      }`}>
                        {playbackState.purpose === 'sleep' && <Moon className="w-10 h-10 text-sky-300 drop-shadow-md" />}
                        {playbackState.purpose === 'focus' && <ShieldCheck className="w-10 h-10 text-emerald-300 drop-shadow-md" />}
                        {playbackState.purpose === 'rest' && <Heart className="w-10 h-10 text-rose-300 drop-shadow-md" />}
                        {playbackState.purpose === 'energy' && <Sparkles className="w-10 h-10 text-amber-300 drop-shadow-md" />}
                        {playbackState.purpose === 'wuyin' && <Music className="w-10 h-10 text-purple-300 drop-shadow-md" />}

                        {/* Gloss overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track titles text details */}
                <div className="text-center space-y-1 mt-2">
                  <h2 className={`text-base font-extrabold tracking-wide font-sans leading-tight ${
                    theme === 'night' ? 'text-white' : 'text-[#4e3629]'
                  }`}>
                    {playbackState.trackTitle.split(' • ')[1] || playbackState.trackTitle}
                  </h2>
                  <p className={`text-[10.5px] font-sans tracking-widest opacity-85 ${
                    theme === 'night' ? 'text-gray-400' : 'text-[#826e5e]'
                  }`}>
                    {playbackState.purpose === 'sleep' && '深沉助眠磁场 • 慢波谐振 睡眠药方'}
                    {playbackState.purpose === 'focus' && '专注记忆提升 • 脑重塑 坚实心流'}
                    {playbackState.purpose === 'rest' && '负能排空释放 • 情怀息气 行随自调'}
                    {playbackState.purpose === 'energy' && '神智唤醒激活 • 阳光撕裂 驱寒生发'}
                    {playbackState.purpose === 'wuyin' && '古法声频谐振 • 脾胃调和 舒心理肺'}
                  </p>
                  
                  <div className="pt-1.5 flex justify-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-bold border font-sans ${
                      theme === 'night' 
                        ? 'bg-[#0d1527] text-sky-450 border-sky-500/25' 
                        : 'bg-[#f4ebd5] text-[#a67c52] border-[#dacdb9]'
                    }`}>
                      FLAC 24-bit 无损保真级
                    </span>
                  </div>
                </div>

                {/* Timeline display slider */}
                <div className="w-full space-y-2 mt-6">
                  <div className={`flex justify-between text-[9px] font-mono tracking-wider px-1 ${
                    theme === 'night' ? 'text-gray-500' : 'text-[#826e5e]'
                  }`}>
                    <span>{Math.floor(playbackState.progress / 60)}:{playbackState.progress % 60 < 10 ? '0' : ''}{playbackState.progress % 60}</span>
                    <span>{Math.floor(playbackState.duration / 60)}:{playbackState.duration % 60 < 10 ? '0' : ''}{playbackState.duration % 60}</span>
                  </div>
                  <div 
                    className={`w-full h-1 rounded-full relative cursor-pointer transition-all duration-250 ${
                      theme === 'night' ? 'bg-slate-900' : 'bg-[#ebdcb9]'
                    }`}
                    onClick={() => {
                      triggerNotification('[大音希声] 守护中！播放进度正随愈疗节律循序调推');
                    }}
                  >
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        theme === 'night' ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-[#a67c52]'
                      }`}
                      style={{ width: `${(playbackState.progress / Math.max(1, playbackState.duration)) * 100}%` }}
                    />
                    <div 
                      className={`absolute w-2 h-2 rounded-full shadow-md -mt-0.5 ${
                        theme === 'night' ? 'bg-white border border-sky-500' : 'bg-white border border-[#a67c52]'
                      }`}
                      style={{ left: `calc(${(playbackState.progress / Math.max(1, playbackState.duration)) * 100}% - 4px)` }}
                    />
                  </div>
                </div>

                {/* Controls Bar Row */}
                <div className="flex items-center justify-between mt-6 px-1 bg-transparent">
                  
                  {/* Mode switcher cycle */}
                  <button 
                    onClick={() => {
                      let nextMode: 'loop' | 'random' | 'single' = 'loop';
                      if (playbackState.playMode === 'loop') nextMode = 'random';
                      else if (playbackState.playMode === 'random') nextMode = 'single';
                      else nextMode = 'loop';
                      
                      window.dispatchEvent(new CustomEvent('zensound-remote-mode', {
                        detail: { mode: nextMode }
                      }));
                      triggerNotification(`[播放循环] 已切换至: ${
                        nextMode === 'loop' ? '顺序循环' : nextMode === 'random' ? '随机播律' : '单曲守护'
                      }`);
                    }}
                    className={`p-2 rounded-full cursor-pointer transition-all active:scale-90 ${
                      theme === 'night' ? 'hover:bg-slate-900 text-gray-400 hover:text-white' : 'hover:bg-[#ebdcb9]/40 text-[#5c4033] hover:text-[#2d1e18]'
                    }`}
                    title="切换播放模式"
                  >
                    {playbackState.playMode === 'loop' && <Repeat className={`w-4 h-4 ${theme === 'night' ? 'text-sky-450' : 'text-[#a67c52]'}`} />}
                    {playbackState.playMode === 'random' && <Shuffle className={`w-4 h-4 ${theme === 'night' ? 'text-emerald-450' : 'text-emerald-700'}`} />}
                    {playbackState.playMode === 'single' && (
                      <div className="relative">
                        <Repeat className="w-4 h-4 text-amber-600" />
                        <span className="absolute -top-1.5 -right-1 text-[6.5px] font-black font-mono text-amber-600 bg-white dark:bg-slate-950 px-0.5 rounded">1</span>
                      </div>
                    )}
                  </button>

                  {/* Skip track backward */}
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('zensound-prev-track'));
                      triggerNotification('[神律变换] 正在为您平缓过渡至上一首音轨');
                    }}
                    className={`p-2.5 rounded-full cursor-pointer transition-all active:scale-95 ${
                      theme === 'night' ? 'hover:bg-slate-900 text-gray-300 hover:text-white' : 'hover:bg-[#ebdcb9]/40 text-[#5c4033] hover:text-[#2d1e18]'
                    }`}
                    title="上一曲"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* BIG CENTRAL PLAY TOGGLE */}
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('zensound-toggle-play'));
                    }}
                    className={`w-12 h-12 rounded-full text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-all text-center relative ${
                      theme === 'night' 
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-650 shadow-sky-500/20 hover:from-sky-400' 
                        : 'bg-[#a67c52] hover:bg-[#8e6b46] shadow-amber-900/10'
                    }`}
                    title="播放 / 暂停"
                  >
                    {playbackState.isPlaying ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Skip track forward */}
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('zensound-next-track'));
                      triggerNotification('[神律变换] 正在为您平缓过渡至下一首音轨');
                    }}
                    className={`p-2.5 rounded-full cursor-pointer transition-all active:scale-95 ${
                      theme === 'night' ? 'hover:bg-slate-900 text-gray-300 hover:text-white' : 'hover:bg-[#ebdcb9]/40 text-[#5c4033] hover:text-[#2d1e18]'
                    }`}
                    title="下一曲"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Interactive Red Heart Like Button */}
                  <button 
                    onClick={() => {
                      setIsLikedTrack(!isLikedTrack);
                      triggerNotification(!isLikedTrack ? '[情志反馈] 已加入我心神向收藏金匮' : '[情志反馈] 已移出常驻标记');
                    }}
                    className={`p-2 rounded-full cursor-pointer transition-all active:scale-95 ${
                      theme === 'night' ? 'hover:bg-slate-900' : 'hover:bg-[#ebdcb9]/40'
                    }`}
                    title="心领赞叹"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${
                      isLikedTrack ? 'text-rose-500 fill-rose-500' : theme === 'night' ? 'text-gray-400 hover:text-white' : 'text-[#5c4033] hover:text-[#2d1e18]'
                    }`} />
                  </button>

                  {/* QQ Music Single List Icon Selector */}
                  <button 
                    onClick={() => setShowFloatingPlaylist(!showFloatingPlaylist)}
                    className={`p-2 rounded-full cursor-pointer transition-all active:scale-95 ${
                      showFloatingPlaylist 
                        ? theme === 'night' ? 'bg-sky-500/10 text-sky-400' : 'bg-[#a67c52]/10 text-[#a67c52]'
                        : theme === 'night' ? 'hover:bg-slate-900 text-gray-450 hover:text-white' : 'hover:bg-[#ebdcb9]/40 text-[#4e3629] hover:text-[#2d1e18]'
                    }`}
                    title="播放列表"
                  >
                    <ListMusic className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Professional bottom text warning guard */}
                <div className={`text-center opacity-40 text-[8px] font-sans tracking-wide mt-2 ${
                  theme === 'night' ? 'text-gray-500' : 'text-[#826e5e]'
                }`}>
                  神弦自适系统依据脑波科学与物理谐振原理设计 • 音量调节在 30%-50% 最宜
                </div>

                {/* INTERACTIVE PLAYLIST DRAWER COMPONENT WITHIN THE FLOATING PLAYER */}
                <AnimatePresence>
                  {showFloatingPlaylist && (
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className={`absolute inset-x-0 bottom-0 rounded-t-[24px] border-t p-4 z-[950] font-sans flex flex-col h-[55%] ${
                        theme === 'night' 
                          ? 'bg-[#0b101d] border-slate-850 text-gray-100' 
                          : 'bg-[#faf6ed] border-[#dacdb9] text-[#4e3629]'
                      }`}
                    >
                      {/* Drawer grab line */}
                      <div className="w-8 h-1 bg-gray-550/20 rounded-full mx-auto mb-3 shrink-0" />

                      <div className="flex justify-between items-center mb-3 shrink-0 select-none">
                        <div className="flex items-center gap-1.5">
                          <ListMusic className={`w-4 h-4 ${theme === 'night' ? 'text-sky-400' : 'text-[#a67c52]'}`} />
                          <span className="text-xs font-black">收纳修持播放列表</span>
                          <span className="text-[9px] opacity-40">({(tracksData[playbackState.purpose] || []).length}首)</span>
                        </div>
                        <button 
                          onClick={() => setShowFloatingPlaylist(false)}
                          className="p-1 rounded-full hover:bg-gray-500/10 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Display tracks */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 pb-1 scrollbar-none">
                        {(tracksData[playbackState.purpose] || []).map((tr, trIdx) => {
                          const isCurrentItem = tr.title === playbackState.trackTitle;
                          return (
                            <div
                              key={tr.id}
                              onClick={() => {
                                if (tr.isPremium && !isPremiumUser) {
                                  setShowSimplePlayerModal(false);
                                  setShowSubscribeModal(true);
                                  return;
                                }
                                window.dispatchEvent(new CustomEvent('zensound-remote-play', {
                                  detail: { category: playbackState.purpose, level: trIdx + 1 }
                                }));
                                triggerNotification(`[神律变换] 正在为您跳转：${tr.title.split(' • ')[1] || tr.title}`);
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isCurrentItem
                                  ? theme === 'night' 
                                    ? 'border-sky-500 bg-sky-950/20 text-sky-450 font-extrabold' 
                                    : 'border-[#a67c52] bg-[#fdfbf6] text-[#a67c52] font-black'
                                  : theme === 'night' 
                                    ? 'border-slate-900 bg-slate-900/35 hover:bg-slate-900/60' 
                                    : 'border-[#dacdb9]/30 bg-[#f4ebd5]/50 hover:bg-[#ebdcb9]/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isCurrentItem && playbackState.isPlaying ? (
                                  <div className="flex gap-0.5 items-end h-3 shrink-0 mb-0.5">
                                    <span className={`w-0.5 h-2 animate-bounce ${theme === 'night' ? 'bg-sky-500' : 'bg-[#a67c52]'}`} style={{ animationDelay: '0.1s' }} />
                                    <span className={`w-0.5 h-3 animate-bounce ${theme === 'night' ? 'bg-sky-500' : 'bg-[#a67c52]'}`} style={{ animationDelay: '0.3s' }} />
                                    <span className={`w-0.5 h-1.5 animate-bounce ${theme === 'night' ? 'bg-sky-500' : 'bg-[#a67c52]'}`} style={{ animationDelay: '0.5s' }} />
                                  </div>
                                ) : (
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrentItem ? theme === 'night' ? 'bg-sky-500' : 'bg-[#a67c52]' : 'bg-gray-500/35'}`} />
                                )}

                                <div className="text-left truncate min-w-0">
                                  <p className="text-xs font-bold truncate leading-normal">{tr.title.split(' • ')[1] || tr.title}</p>
                                  <p className="text-[9.5px] opacity-45 truncate mt-0.5 leading-normal font-sans font-normal">{tr.desc}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-400 shrink-0">
                                {tr.isPremium && (
                                  <span className="text-[7.5px] border border-amber-500/40 text-amber-500 px-1 rounded uppercase font-black shrink-0 scale-90">
                                    PRO
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
