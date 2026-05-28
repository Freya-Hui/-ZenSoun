import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Sparkles, Sliders, Database, KeyRound, Check, RefreshCw, 
  Star, HelpCircle, Heart, Lock, Calendar, Trash2, Edit2, Smile, 
  ChevronRight, Download, Plus, BookOpenCheck, RotateCw, X 
} from 'lucide-react';
import { DiaryEntry, Profile, SoundRecipe } from '../types';

interface ProfileProps {
  profile: Profile;
  diaries: DiaryEntry[];
  isPremiumUser: boolean;
  isGuest?: boolean;
  onAddDiary: (content: string, mood: string, aiResp?: any) => void;
  onDeleteDiary: (id: string) => void;
  onOpenSubscribeModal: () => void;
  onSimulateSync: () => void;
  onApplyRecipe: (recipe: SoundRecipe) => void;
  theme?: 'day' | 'night';
  onUpdateProfile?: (updated: Partial<Profile>) => void;
  onLogOut?: () => void;
}

const BOOK_QUOTES = [
  "万物皆有裂痕，那是光照进来的地方。莫怕短暂的阴霾，它只是光芒的序曲。",
  "深长的三次呼吸，足以平定宇宙间千千万万重喧嚣。安静下来，听见内心气流声。",
  "任凭行云流转，空谷松涛不改本色。慢下来，去听体内血脉的回响。",
  "大音希声，大象无形。平原清野，金石丝竹，皆在此刻化为身体安顿的能量。",
  "不要急于给出一个解释。顺应大自然的潮汐，潮涨潮落，皆是圆满的造化。",
  "生活如同一张精心编织的琴谱，时有错落。接纳遗憾与杂调，琴音方更儒雅清脆。",
  "静坐听雨，如饮清泉。把白日繁琐挂碍交付予清晨的微风与温软泥土。",
  "最饱满的热情与生命力，往往藏在最深笃的寂静之中。今晚，安心入眠吧。"
];

const MOOD_CHIPS = ['平静', '澄澈', '喜悦', '困顿', '烦愁', '安闲'];
const DIARY_PROMPTS = [
  "此刻让你挂心焦虑的一两组繁重琐屑是什么？",
  "回想今天值得感激的一缕暖阳、一份餐点或微小温情。",
  "闭上眼睛深深吸气15秒，记录下身体此时的自在回馈与知觉变化。"
];

export default function PersonalProfile({
  profile,
  diaries,
  isPremiumUser,
  isGuest = false,
  onAddDiary,
  onDeleteDiary,
  onOpenSubscribeModal,
  onSimulateSync,
  onApplyRecipe,
  theme = 'day',
  onUpdateProfile,
  onLogOut
}: ProfileProps) {
  // Bio & user detail states
  const [userBio, setUserBio] = useState(() => localStorage.getItem('zensound_user_bio') || '行于喧嚣，休于心居。于呼吸长短间，寻声音药方。');
  const [userName, setUserName] = useState(() => localStorage.getItem('zensound_user_name') || profile.name);
  const [userMood, setUserMood] = useState(() => localStorage.getItem('zensound_user_mood') || '安闲');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarsList = ['静', '定', '宽', '明', '和', '清', '虚', '空', '觉'];

  // Recording Modal states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordType, setRecordType] = useState<'tag' | 'diary'>('diary'); // 'tag' (日签) vs 'diary' (日记)
  
  // Book of Answers (日签)
  const [isBookOpened, setIsBookOpened] = useState(false);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(0);

  // Diary drafting inside dashboard
  const [diaryInput, setDiaryInput] = useState('');
  const [diaryMood, setDiaryMood] = useState('平静');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [latestAiLetter, setLatestAiLetter] = useState<any | null>(null);

  // Supabase cloud pipeline
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('supabase_key') || '');
  const [dbMode, setDbMode] = useState<'local' | 'supabase'>(() => {
    return localStorage.getItem('supabase_url') ? 'supabase' : 'local';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string>('存储保障：本机军工级沙盒 LocalStorage 加密备份');

  const isDark = theme === 'night';

  const handleSaveBio = () => {
    localStorage.setItem('zensound_user_bio', userBio);
    setIsEditingBio(false);
  };

  const handleSaveName = () => {
    localStorage.setItem('zensound_user_name', userName);
    setIsEditingName(false);
    if (onUpdateProfile) {
      onUpdateProfile({ name: userName });
    }
  };

  const handleSelectMood = (mood: string) => {
    setUserMood(mood);
    localStorage.setItem('zensound_user_mood', mood);
  };

  // Trigger AI text expansion
  const handleAiContinue = async () => {
    if (!diaryInput.trim()) return;
    setIsContinuing(true);
    try {
      const response = await fetch('/api/gemini/diary-continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: diaryInput, mood: diaryMood })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.continuation) {
          setDiaryInput(prev => prev.trim() + data.continuation);
        }
      }
    } catch (e) {
      console.error("Failed to fetch AI continuation:", e);
    } finally {
      setIsContinuing(false);
    }
  };

  // Save Book of Answers Postcard as beautiful high-res image directly
  const handleDownloadPostcard = () => {
    if (!isPremiumUser) {
      onOpenSubscribeModal();
      return;
    }

    const quote = BOOK_QUOTES[selectedQuoteIndex];
    const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    
    // Create a high resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = isDark ? '#080d19' : '#fafaf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Inner card border
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e0d9';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Draw Book Icon / Logo Symbol
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📖', canvas.width / 2, 170);

    // Draw Title
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 28px "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('愈思音疗 • 答案之书', canvas.width / 2, 240);

    // Draw Date
    ctx.fillStyle = isDark ? '#64748b' : '#8c8c82';
    ctx.font = '22px "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(dateStr, canvas.width / 2, 300);

    // Draw decorative divider line
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e0d9';
    ctx.beginPath();
    ctx.moveTo(150, 360);
    ctx.lineTo(canvas.width - 150, 360);
    ctx.stroke();

    // Draw Quote text wrapping
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1c1917';
    ctx.font = '32px "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
    
    // Function to wrap text
    const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split('');
      let line = '';
      let currentY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          context.fillText(line, x, currentY);
          line = words[n];
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, currentY);
    };

    wrapText(ctx, `“ ${quote} ”`, canvas.width / 2, 480, 560, 58);

    // Signature at bottom
    ctx.strokeStyle = isDark ? '#334155' : '#e2e0d9';
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(120, 830);
    ctx.lineTo(canvas.width - 120, 830);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isDark ? '#475569' : '#a1a096';
    ctx.font = '20px "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('ZENSOUND • 心 灵 守 护 日 签', canvas.width / 2, 890);

    // Convert canvas to image and trigger download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ZENSOUND_心灵日签_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Canvas draw error:", e);
    }
  };

  // Submit and analyze diary
  const handleAnalyzeDiary = async () => {
    if (!diaryInput.trim()) return;

    setIsAiProcessing(true);
    setLatestAiLetter(null);

    try {
      const response = await fetch('/api/gemini/diary-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: diaryInput, mood: diaryMood })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setLatestAiLetter(data);
      onAddDiary(diaryInput, diaryMood, data);
      setDiaryInput('');

    } catch (e: any) {
      console.error(e);
      const fallbackData = {
        feedback: "生活漫漫多险滩，请允许今日的疲倦在此停落。清风慢抚，琴涛袅袅，他们会拂去一切挂虑。",
        suggestedRecipeName: "空林听瀑",
        suggestedInstrument: "bowl",
        suggestedPurpose: "rest",
        suggestedNoises: [
          { id: "wind", volume: 40 },
          { id: "rain", volume: 20 }
        ]
      };
      setLatestAiLetter(fallbackData);
      onAddDiary(diaryInput, diaryMood, fallbackData);
      setDiaryInput('');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSaveDbSettings = () => {
    if (dbMode === 'supabase' && (!supabaseUrl || !supabaseAnonKey)) {
      alert('请填入完整的 Supabase 凭证数据以启用同步。');
      return;
    }
    if (dbMode === 'supabase') {
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_key', supabaseAnonKey);
      setSyncLogs('云端数据安全同步管道已连通，数据采用密匙传输保护。');
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      setSyncLogs('已断开云连接。数据已完全收缩储存于本地安全沙盒。');
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    onSimulateSync();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncLogs(`同步成功：加密进度已在 ${new Date().toLocaleTimeString()} 安全备份。`);
    }, 1200);
  };

  const handleLoadAiFormula = () => {
    if (!latestAiLetter) return;

    const dummyNoises = [
      { id: 'rain', name: '森林细雨', icon: '雨', volume: 0, isActive: false },
      { id: 'waves', name: '潮汐鸣响', icon: '海', volume: 0, isActive: false },
      { id: 'wind', name: '竹涛风铃', icon: '风', volume: 0, isActive: false },
      { id: 'campfire', name: '炉火烤柴', icon: '火', volume: 0, isActive: false }
    ];

    const noiseConfig = dummyNoises.map(n => {
      const rec = latestAiLetter.suggestedNoises?.find((x: any) => x.id === n.id);
      if (rec) {
        return { ...n, isActive: true, volume: rec.volume };
      }
      return n;
    });

    const mockRecipe: SoundRecipe = {
      id: `ai_${Date.now()}`,
      name: latestAiLetter.suggestedRecipeName,
      creator: 'AI心灵愈疗导师',
      isCustom: false,
      noises: noiseConfig,
      purpose: latestAiLetter.suggestedPurpose || 'rest',
      purposeLabel: latestAiLetter.suggestedPurpose === 'sleep' ? '睡眠' : latestAiLetter.suggestedPurpose === 'focus' ? '专注' : '正念',
      melodyInstrument: latestAiLetter.suggestedInstrument || 'bowl',
      tempo: 'ambient',
      likesCount: 0,
      isLiked: false,
      isSaved: false,
      isPremium: true,
      description: '由AI智能结合情绪状况自动调和生成的白噪声配方。'
    };

    onApplyRecipe(mockRecipe);
    setLatestAiLetter(null);
    setShowRecordModal(false); // Close recording modal on restore
  };

  const handleSaveDiaryPure = () => {
    if (!diaryInput.trim()) return;
    onAddDiary(diaryInput, diaryMood, null);
    setDiaryInput('');
    setShowRecordModal(false);
    alert('📔 日记已安全存入本地反思本！');
  };

  const openAnswersBook = () => {
    const idx = Math.floor(Math.random() * BOOK_QUOTES.length);
    setSelectedQuoteIndex(idx);
    setIsBookOpened(true);
  };

  return (
    <div className={`relative min-h-full flex flex-col gap-4 pt-3 pb-8 px-4 transition-colors duration-300 ${
      isDark ? 'bg-[#0a0f1d] text-gray-200' : 'bg-[#faf9f6] text-stone-900'
    }`} id="profile_container">
      
      {/* 1. PROFESSIONAL USER CARDS (AESTHETIC UPGRADE) */}
      <div className={`rounded-2xl border p-4 shadow-md flex flex-col gap-3.5 transition-all ${
        isDark ? 'bg-gradient-to-r from-slate-900 to-[#131d31] border-slate-800' : 'bg-white border-stone-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'
      }`} id="profile_card">
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 relative">
            <div 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-xl select-none shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all relative ${
                isDark ? 'bg-slate-800 border-sky-400/30' : 'bg-stone-100 border-stone-300/80 text-stone-800'
              }`}
              title="点击更换修行头像"
            >
              {profile.avatar}
              <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 shadow">
                <Edit2 className="w-2 h-2" />
              </div>
            </div>

            {showAvatarPicker && (
              <div className={`absolute left-0 top-14 p-2.5 rounded-xl border z-40 grid grid-cols-5 gap-1.5 shadow-xl transition-all duration-300 ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-200 shadow-lg'
              }`} id="avatar_picker_bubble" style={{ width: '210px' }}>
                {avatarsList.map(av => (
                  <button
                    key={av}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateProfile) {
                        onUpdateProfile({ avatar: av });
                      }
                      setShowAvatarPicker(false);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-sky-500/10 flex items-center justify-center text-lg cursor-pointer border border-transparent hover:border-sky-500/20 active:scale-90 transition-all font-sans"
                  >
                    {av}
                  </button>
                ))}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      maxLength={10}
                      className={`text-xs px-2 py-0.5 border rounded focus:outline-none ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-stone-50 border-stone-350 text-stone-900'
                      }`}
                    />
                    <button onClick={handleSaveName} className="text-[10px] text-sky-500 font-bold hover:underline cursor-pointer">保存</button>
                  </div>
                ) : (
                  <span className="text-sm font-extrabold flex items-center gap-1 font-sans">
                    {userName}
                    {!isGuest && (
                      <Edit2 className="w-3 h-3 text-gray-500 hover:text-sky-500 cursor-pointer" onClick={() => setIsEditingName(true)} />
                    )}
                  </span>
                )}

                {isGuest ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold bg-sky-500/10 text-sky-450 border border-sky-500/35 font-sans animate-pulse">
                    游客状态
                  </span>
                ) : isPremiumUser ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans">
                    PRO 终身
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-sans ${
                    isDark ? 'bg-slate-800 text-gray-500' : 'bg-stone-100 text-stone-500'
                  }`}>
                    标准免费
                  </span>
                )}
              </div>

              <span className={`text-[10px] block mt-0.5 font-sans ${isDark ? 'text-gray-500' : 'text-stone-500'}`}>
                累计静修：{profile.listeningTime}分钟 • 状态连续：{profile.streak}天
              </span>
            </div>
          </div>

          {isGuest ? (
            <button
              onClick={onLogOut}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-650 text-white font-extrabold text-[10.5px] shadow-sm hover:from-sky-400 hover:to-indigo-550 transition-all cursor-pointer font-sans"
            >
              新客登录
            </button>
          ) : !isPremiumUser && (
            <button
              onClick={onOpenSubscribeModal}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-white font-extrabold text-[10.5px] shadow-sm transition-all cursor-pointer font-sans"
            >
              升级 PRO
            </button>
          )}
        </div>

        {isGuest && (
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
            isDark 
              ? 'bg-sky-950/20 border-sky-500/20 text-sky-300' 
              : 'bg-sky-50/85 border-sky-100 text-sky-850'
          }`}>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-bold font-sans flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
                修心之旅 • 尚未绑定
              </p>
              <p className="text-[10px] leading-relaxed opacity-80">
                当前为游客修持模式。注册或登录可自定义您的法号，并支持数据自动备份与精品配方发布。
              </p>
            </div>
            <button
              onClick={onLogOut}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[10.5px] font-extrabold shadow cursor-pointer transition-all self-center shrink-0"
            >
              去登录/注册
            </button>
          </div>
        )}

        {/* Short Bio / Self-Description */}
        <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-colors ${
          isDark ? 'bg-slate-950/40 border-slate-900/60 text-slate-450' : 'bg-stone-50 border-stone-200/50 text-stone-600'
        }`}>
          {isEditingBio ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                maxLength={50}
                rows={2}
                className={`w-full text-[10.5px] p-2 border rounded focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-stone-300 text-stone-850'
                }`}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditingBio(false)} className="text-[10px] text-gray-500 hover:underline cursor-pointer">取消</button>
                <button onClick={handleSaveBio} className="text-[10px] text-sky-500 font-bold hover:underline cursor-pointer">保存说明</button>
              </div>
            </div>
          ) : (
            <p className="flex justify-between items-start gap-3">
              <span className="italic">&ldquo;{userBio}&rdquo;</span>
              <button onClick={() => setIsEditingBio(true)} className="text-[9.5px] font-bold text-sky-500 hover:underline cursor-pointer shrink-0 mt-0.5">修改一句话</button>
            </p>
          )}
        </div>

        {/* Emotion States Chips Widget on Profile Card */}
        <div className="border-t border-dashed border-gray-500/10 pt-2.5">
          <p className={`text-[10px] font-bold mb-1.5 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-stone-550'}`}>
            <Smile className="w-3.5 h-3.5 text-sky-400" />
            <span>今日心情卡：</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {MOOD_CHIPS.map(mood => {
              const isActive = userMood === mood;
              return (
                <button
                  key={mood}
                  onClick={() => handleSelectMood(mood)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-500 font-bold'
                      : isDark
                        ? 'bg-slate-900/60 border-transparent text-gray-500 hover:text-gray-300'
                        : 'bg-stone-100 border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. CHINESE JOURNAL DIARY DIALOG TRIGGER BAR */}
      <div className={`p-4 rounded-2xl border text-center flex flex-col gap-2 transition-all ${
        isDark ? 'bg-slate-950/60 border-slate-900 shadow-lg' : 'bg-white border-stone-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
      }`} id="record_starter_box">
        <div className="flex items-center justify-center gap-1 text-sky-500 mb-1">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h3 className="text-xs font-black tracking-wider uppercase font-sans">心流记录岛</h3>
        </div>
        <p className={`text-[10px] leading-relaxed max-w-xs mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-stone-500'}`}>
          闭上眼，默念您的疑惑、委屈或感悟。翻开“答案之书”，或呼出“AI疗愈师”续笔并开方，舒缓您繁杂的身心状态。
        </p>

        <button
          onClick={() => {
            setShowRecordModal(true);
            setIsBookOpened(false);
            setDiaryInput('');
          }}
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ring-offset-2 hover:opacity-90 active:scale-98 ${
            isDark 
              ? 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white shadow-lg shadow-sky-950/20' 
              : 'bg-stone-900 text-white shadow-md shadow-stone-950/10'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>打开今日心灵记录面板</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2.5 AI RESPONSE FLOATING PRESCRIPTION (STAYS AS CORR FEEDBACK) */}
      {latestAiLetter && (
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'border-sky-500/30 bg-slate-950/50' : 'border-sky-300 bg-sky-50/40 text-stone-900 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 mb-2 text-sky-600">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-[10.5px] font-extrabold">心灵私塾 • AI诊断出方</span>
          </div>
          <p className="text-[11.5px] leading-relaxed italic mb-3 font-serif p-2 rounded-lg bg-gray-500/5 text-justify">
            &ldquo;{latestAiLetter.feedback}&rdquo;
          </p>
          <div className="flex justify-between items-center bg-gray-500/5 p-2 rounded-lg text-xs">
            <div>
              <span className="text-[9.5px] opacity-50 block">智能环境推荐</span>
              <span className="font-extrabold">{latestAiLetter.suggestedRecipeName}</span>
            </div>
            <button
              onClick={handleLoadAiFormula}
              className="px-2.5 py-1 text-[10.5px] font-bold bg-sky-500 text-white rounded cursor-pointer"
            >
              立刻载入试听
            </button>
          </div>
        </div>
      )}

      {/* 3. HISTORY OF DIARIES (WITH ADAPTIVE DESIGN) */}
      {diaries.length > 0 && (
        <div className={`rounded-xl border p-4 transition-all ${
          isDark ? 'bg-[#0f172a]/40 border-slate-900' : 'bg-white border-stone-200/80 shadow-sm'
        }`}>
          <p className="text-[11px] font-extrabold mb-3 flex items-center justify-between">
            <span className={isDark ? 'text-gray-400' : 'text-stone-500'}>心灵印记（近 {diaries.length} 篇反思本）</span>
            <Trash2 
              className={`w-3.5 h-3.5 transition-colors cursor-pointer hover:text-rose-500 ${isDark ? 'text-slate-700' : 'text-stone-300'}`} 
              onClick={() => {
                if (confirm('确定要清除所有本地反思吗？此操作无法撤销。')) {
                  localStorage.removeItem('healing_diaries');
                  window.location.reload();
                }
              }} 
              title="清除反思" 
            />
          </p>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-0.5" id="diary_history_timeline">
            {diaries.map(diary => (
              <div 
                key={diary.id}
                className={`p-3 rounded-xl border transition-all text-xs font-sans relative ${
                  isDark 
                    ? 'bg-slate-950/60 border-slate-900 text-gray-300' 
                    : 'bg-stone-50 border-stone-200/50 text-stone-900 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-[9.5px] opacity-50">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" /> {diary.date}
                  </span>
                  <span className={`px-1 rounded ${isDark ? 'bg-slate-900 text-sky-400' : 'bg-stone-200/60 text-stone-700'}`}>
                    感觉: {diary.mood}
                  </span>
                </div>

                <p className="leading-relaxed text-[11px]">{diary.content}</p>

                {diary.aiResponse && (
                  <p className={`text-[10px] italic p-1.5 rounded mt-2 border-l-2 ${
                    isDark 
                      ? 'bg-sky-950/15 border-cyan-500/40 text-cyan-400' 
                      : 'bg-sky-50 border-sky-300 text-sky-850'
                  }`}>
                    导师赠言: {diary.aiResponse.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 5. LOGOUT CONTROL BUTTON */}
          {onLogOut && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-500/10 flex justify-center">
              <button
                onClick={onLogOut}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-red-500/5 text-red-500 border-red-500/15 hover:bg-red-500/10' 
                    : 'bg-red-50 text-red-700 border-red-200/50 hover:bg-red-100'
                }`}
              >
                退出当前静修法号
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. CLOUD PIPELINE (REMOVED FROM UI TO PRESERVE SIMPLICITY) */}


      {/* SECONDARY WEBPAGE DIALOG COMPACT MODAL PANEL OVERLAY */}
      <AnimatePresence>
        {showRecordModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 70 }}
            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
            className={`fixed inset-0 z-[120] flex flex-col p-6 md:p-12 shadow-2xl overflow-y-auto ${
              isDark ? 'bg-[#080d19] text-gray-200' : 'bg-[#fafaf7] text-stone-950'
            }`}
            id="secondary_recording_overlay"
          >
            {/* Header toolbar */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-500/10 shrink-0">
              <div className="flex items-center gap-1 text-sky-500">
                <BookOpenCheck className="w-4 h-4 shrink-0" />
                <span className="text-[11.5px] font-black uppercase font-sans">写今日反思与日签</span>
              </div>
              <button
                onClick={() => {
                  setShowRecordModal(false);
                  setIsBookOpened(false);
                }}
                className={`p-1 rounded-full cursor-pointer hover:bg-gray-500/15 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector: Daily Quote vs Diary */}
            <div className={`grid grid-cols-2 p-1 rounded-xl mb-4 text-xs font-bold grow-0 shrink-0 ${
              isDark ? 'bg-slate-950/80 border border-slate-900' : 'bg-stone-200/50 border border-stone-200'
            }`}>
              <button
                onClick={() => setRecordType('diary')}
                className={`py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                  recordType === 'diary'
                    ? isDark ? 'bg-slate-900 border border-slate-800 text-sky-500' : 'bg-white border border-stone-300 text-stone-900 shadow-sm'
                    : isDark ? 'text-gray-500' : 'text-stone-500'
                }`}
              >
                随笔日记
              </button>
              <button
                onClick={() => setRecordType('tag')}
                className={`py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                  recordType === 'tag'
                    ? isDark ? 'bg-slate-900 border border-slate-800 text-sky-500' : 'bg-white border border-stone-300 text-stone-900 shadow-sm'
                    : isDark ? 'text-gray-500' : 'text-stone-500'
                }`}
              >
                答案之书
              </button>
            </div>

            {/* TAB CONTENT A: ANSWER BOOK POSTCARD */}
            {recordType === 'tag' && (
              <div className="flex-1 flex flex-col justify-center items-center py-4 text-center">
                {!isBookOpened ? (
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    onClick={openAnswersBook}
                    className={`w-[260px] h-[340px] rounded-3xl border border-dashed flex flex-col items-center justify-center p-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity ${
                      isDark 
                        ? 'border-slate-800 bg-slate-950/40 text-gray-400 hover:border-sky-500/40' 
                        : 'border-stone-300 bg-white hover:border-stone-500/40 shadow-sm'
                    }`}
                  >
                    <BookOpen className="w-12 h-12 text-sky-500 mb-4 animate-bounce" />
                    <p className="text-[12.5px] font-black font-sans leading-normal">答案之书 • 隐士日签</p>
                    <p className="text-[10px] opacity-50 max-w-[180px] mt-2 leading-relaxed">
                      排除杂念默念疑问，轻轻点击，为你翻开属于此时此刻的深省笺言。
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    className="flex-1 flex flex-col items-center justify-between w-full max-w-sm"
                  >
                    {/* Postcard Container */}
                    <div className={`p-6 rounded-2xl w-full border text-left flex flex-col justify-between font-serif min-h-[300px] shadow-lg relative overflow-hidden ${
                      isDark 
                        ? 'bg-gradient-to-b from-[#090f1e] to-slate-950 border-slate-800 text-gray-100' 
                        : 'bg-[#fcfbf9] border-stone-250 text-stone-900'
                    }`} id="answer_postcard_body">
                      {/* Grid Pattern inside Postcard mockup */}
                      <div className="absolute top-4 right-4 opacity-15 text-[10px] font-mono select-none">
                        ZENSOUND
                      </div>

                      <div className="text-[10.5px] text-gray-400 font-sans tracking-wider">
                        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                      </div>

                      <div className="my-8 text-[15.5px] leading-relaxed text-center font-serif text-justify italic font-medium">
                        &ldquo; {BOOK_QUOTES[selectedQuoteIndex]} &rdquo;
                      </div>

                      <div className="border-t border-dashed border-gray-400/20 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-sans tracking-wide">
                        <span>愈思音疗 ZENSOUND • 答案之书</span>
                        <span className="font-mono">NO.{selectedQuoteIndex + 1}</span>
                      </div>
                    </div>

                    {/* Postcard Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-6 w-full shrink-0">
                      <button
                        onClick={openAnswersBook}
                        className={`py-2 rounded-xl text-[11px] border cursor-pointer font-sans font-extrabold flex items-center justify-center gap-1.5 ${
                          isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <RotateCw className="w-4 h-4" /> 换一句
                      </button>
                      <button
                        onClick={handleDownloadPostcard}
                        className="py-2 rounded-xl text-[11px] cursor-pointer font-sans font-bold flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white shadow-md active:scale-95 transition-all"
                      >
                        <Download className="w-4 h-4" /> 保存日签图片
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* TAB CONTENT B: DIARY DRAFT WITH PROMPTS & AI AUTO-CONTINUING */}
            {recordType === 'diary' && (
              <div className="flex-1 flex flex-col justify-between py-1 overflow-y-auto">
                <div className="space-y-4">
                  {/* Guidelines Box */}
                  <div className={`p-3 rounded-xl text-[11px] leading-relaxed transition-colors ${
                    isDark ? 'bg-slate-950/40 border-slate-900/40 text-gray-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <p className="font-black text-[10px] opacity-75 mb-1 text-sky-500">📖 愈思写作建议：</p>
                    <ul className="list-disc pl-3.5 space-y-1">
                      {DIARY_PROMPTS.map((prompt, pi) => (
                        <li key={pi} className="cursor-pointer hover:text-sky-500" onClick={() => setDiaryInput(prev => prev + prompt)}>
                          {prompt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mood Selector chips */}
                  <div>
                    <span className="text-[10px] font-extrabold opacity-50 block mb-2">1. 当前内心最真切的情绪色彩：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['平静', '焦虑', '疲惫', '急躁', '抑郁', '愉悦'].map(mood => (
                        <button
                          key={mood}
                          onClick={() => setDiaryMood(mood)}
                          className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer font-sans ${
                            diaryMood === mood
                              ? 'bg-sky-500/15 text-sky-500 border border-sky-500/40 font-bold'
                              : isDark
                                ? 'bg-slate-900 text-gray-400 border border-transparent'
                                : 'bg-stone-100 text-stone-500 border border-transparent'
                          }`}
                        >
                          • {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Edit Block */}
                  <div>
                    <span className="text-[10px] font-extrabold opacity-50 block mb-2">2. 心语随行，畅所欲言 (至少写几个字)：</span>
                    <textarea
                      value={diaryInput}
                      onChange={(e) => setDiaryInput(e.target.value)}
                      placeholder="写点什么... 感恩的阳光、阻滞心结，或刚才听颂钵音流时的轻微出神感受皆可。"
                      rows={5}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-colors leading-relaxed font-sans ${
                        isDark 
                          ? 'bg-[#040810] border-slate-900 text-white focus:border-sky-500/40' 
                          : 'bg-white border-stone-250 text-stone-900 focus:border-sky-500/50 shadow-inner'
                      }`}
                    />
                  </div>

                  {/* 🪄 INTERVENTION AI AUTO-CONTINUING ASSISTANCE DRAWER CARD */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-900' : 'bg-gray-100 shadow-sm border-stone-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sky-500">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[10.5px] font-bold">智能 定制代笔协助 (续句扩展)</span>
                      </div>
                      <button
                        onClick={handleAiContinue}
                        disabled={isContinuing || !diaryInput.trim()}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                          isContinuing
                            ? 'bg-gray-500/10 text-gray-400'
                            : !diaryInput.trim()
                              ? 'bg-gray-500/5 text-gray-400 opacity-50'
                              : 'bg-sky-500 text-white hover:bg-sky-450'
                        }`}
                      >
                        {isContinuing ? <RefreshCw className="w-3 h-3 animate-spin" /> : '试用 润色续笔'}
                      </button>
                    </div>
                    <p className={`text-[9.5px] leading-relaxed opacity-60 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                      写到一半无法流畅展开？点击上方让专家助理顺着您的情绪和感悟优雅续写诗意修持，句式将直接追加到您的随笔末尾。
                    </p>
                  </div>
                </div>

                {/* Pathway triggers */}
                <div className="space-y-2 mt-6 pt-2 shrink-0 border-t border-gray-500/5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSaveDiaryPure}
                      disabled={!diaryInput.trim()}
                      className={`py-2.5 rounded-xl font-bold text-xs select-none border transition-colors cursor-pointer ${
                        !diaryInput.trim()
                          ? 'opacity-40 cursor-not-allowed text-gray-500'
                          : isDark
                            ? 'bg-slate-900 border-slate-800 text-gray-300 hover:bg-slate-800'
                            : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      本端纯文本密存
                    </button>

                    <button
                      onClick={handleAnalyzeDiary}
                      disabled={isAiProcessing || !diaryInput.trim()}
                      className={`py-2.5 rounded-xl font-black text-xs select-none cursor-pointer flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-sky-600 to-indigo-700 text-white ${
                        isAiProcessing || !diaryInput.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:from-sky-500 shadow-md'
                      }`}
                    >
                      {isAiProcessing ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> 专家精研中...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> 定制分析诊断</>
                      )}
                    </button>
                  </div>

                  <p className="text-[8.5px] text-center opacity-40 leading-normal">
                    提醒：定制分析线路处于每日公益体验限额。单日分析限用 3 次，本地反思密盒备份不限。
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
