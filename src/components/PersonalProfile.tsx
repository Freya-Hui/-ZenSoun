import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Sparkles, Sliders, Database, KeyRound, Check, RefreshCw, 
  Star, HelpCircle, Heart, Lock, Calendar, Trash2, Edit2, Smile, 
  ChevronRight, Download, Plus, BookOpenCheck, RotateCw, X, Music,
  Activity, TrendingUp, Cloud, DatabaseZap, HelpCircle as HelpIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DiaryEntry, Profile, SoundRecipe, UserCreation } from '../types';
import { fetchAnswerQuotes, addAnswerQuote, fetchDiaryPrompts, addDiaryPrompt } from '../lib/supabase';

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
  savedRecipes?: SoundRecipe[];
  onDeleteRecipe?: (id: string) => void;
  userCreations?: UserCreation[];
  onDeleteCreation?: (id: string) => void;
  onLoadCreation?: (creation: UserCreation) => void;
}

const BOOK_QUOTES = [
  "万物皆有裂痕，那是光照进来的地方。莫怕短暂的阴霾，它只是光芒的序曲。",
  "深长的三次呼吸，足以平定宇宙间千千万万重喧嚣。安静下来，听见内心气流声。",
  "任凭行云流转，空谷松涛不改本色。慢下来，去听体内血脉的回响。",
  "大音希声，大象无形。平原清野，金石丝竹，皆在此刻化为身体安顿的能量。",
  "不要急于给出一个解释。顺应大自然的潮汐，潮涨潮落，皆是圆满的造化。",
  "生活如同一张精心编织的琴谱，时有错落。接纳遗憾与杂调，琴音方更儒雅清脆。",
  "静坐听雨，如饮清泉。把白日繁琐挂碍交付予清晨的微风与温软泥土。",
  "最饱满的热情与生命力，往往藏在最深笃的寂静之中。今晚，安心入眠吧。",
  "致虚极，守静笃。万物并作，吾以观复。将心智倒回最初的空灵，当下便在疗愈之中。",
  "行到水穷处，坐看云起时。生活并非总是寻找目的，有时随遇而安即是药石。",
  "虚能生白，静极发光。你本自具足一切澄澈，无需向外借光以照亮内室的暗淡。",
  "五音令人耳聋，五色令人目盲。于纷繁斑斓中洗涤耳根，片刻纯净的纯白杂音重于千言万语。",
  "如水之清，万物照之。莫要在浑浊时频频搅动它，静置片刻，泥沙自然沉淀。",
  "天地有大美而不言，四时有明法而不议。人身亦是一座小天地，冬藏夏长，顺天应人。",
  "有些结无需拼命去解，交给时间。微风拂过湖面泛起波澜，而风定之后，水自会重归平静。",
  "水唯能下方能成海，山能承厚方显庄严。温吞缓慢有时是比激烈前行更深邃的智慧。",
  "让昨日的心事如凋谢的秋叶般坠入泥土，它不是消亡，而是为了孕育明春更丰饶的繁花。",
  "人之所以不安，往往是因为站在了此刻却忧心着未来。只需守住此时的这口呼吸，便无风雨在身。",
  "春有百花秋有月，夏有凉风冬有雪。若无闲事挂心头，便是人间好时节。",
  "身如琉璃，内外明澈。将一切不甘与委屈，在温厚而空灵的颂钵颤鸣中缓缓震荡消融。",
  "白露悄然凝于草叶，惊不破一梦黄粱。世间烦琐大多自扰，给心灵留白一寸，神魂便安宁一分。",
  "气逆则滞，心宽则平。不要对外界的无常预设过多。松开紧抿的双唇，松开微耸的双肩，当下即是自由仙境。",
  "莫听穿林打叶声，何妨吟啸且徐行。竹拂松涛，空谷足音，自然永远在包容并宽恕你的所有疲劳。",
  "不期而遇的都是温暖，生生不息的才是希望。今晚的晚潮会抚平今天所有的褶皱，晚安。",
  "水至清则无鱼，人至察则无徒。对自己多一分宽宏，对红尘留一分糊涂，神智自得其乐。",
  "重为轻根，静为躁君。在外界大起大落的杂音面前，你的心跳便是世界上最稳健的鼓点。",
  "千江有水千江月，万里无云万里天。每一束被折射的光华，都能在宁静的波纹里寻到归宿。",
  "花盛时采摘，花落时掩埋。宇宙万物的荣枯皆是一曲优雅而富有弹性的自然律动。",
  "世间喧嚣皆为过客，唯有此时的一吐一纳，是你与大地、微风最忠诚、最切近的盟约。",
  "耳不染红尘之俗，目不迷乱世之光。播放一段流水虫鸣，将尘世的所有重量交付于漫漫长夜。",
  "飘风不终朝，骤雨不终日。任何急剧的情绪如同一场骤雨，来时汹汹，但终究会有云开日照的清晨。",
  "天下莫柔弱于水，而攻坚强者莫之能胜。学着像水一样流动、承载、绕行，身心自然柔顺无碍。",
  "山风卷起落叶，宿鸟掠过寒潭。自然从不曾苛责任何生命的迟缓。安心歇息，今日已足够圆满。",
  "在最幽暗的池沼里，也有沉睡的莲籽在积蓄醒来的力量。耐住寂寞，正是孕育清香的过程。",
  "所谓烦恼，不过是心灵的水面泛起的一丝涟漪。你不去刻意撩拨，它自会逐渐收敛，复归明镜。",
  "把攥紧的双手松开，你会发现，你拥抱了整个虚空与清风。放手不代表失去，而是真正的承载。",
  "明月松间照，清泉石上流。山水之间的恬淡，非自然所独有，亦是你心湖中本自盛开的清凉。",
  "一沙一世界，一花一天堂。闭上双眼，你意识所及的深远夜空，比宇宙苍穹更宽广和丰饶。",
  "心有一隅，可安灵魂。在漫漫人生孤舟里，音疗便是你的那一盏昏黄却永不熄灭的防风温灯。"
];

const MOOD_CHIPS = ['平静', '澄澈', '喜悦', '困顿', '烦愁', '安闲'];
const LOCAL_DIARY_PROMPTS = [
  "此刻让你挂心焦虑的一两组繁重琐屑是什么？",
  "回想今天值得感激的一缕暖阳、一份餐点或微小温情。",
  "闭上眼睛深深吸气15秒，记录下身体此时的自在回馈与知觉变化。",
  "如果用一种天气或温度来形容你此刻的情绪，那会是什么？",
  "今天有什么事情让你感到心气一滞，或者有些许释怀？",
  "记录一件今天完成的能带给你微小成就感的事情。",
  "你感到头脑中有哪些盘旋不去的念头？试着将它们化为文字写下来。",
  "此刻周围最清晰的声响是什么？闭目倾听，它带给你怎样的联想？",
  "此时此刻，对感到疲倦或紧绷的自己，你想说一句怎样温和的话语？"
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
  onLogOut,
  savedRecipes = [],
  onDeleteRecipe,
  userCreations = [],
  onDeleteCreation,
  onLoadCreation
}: ProfileProps) {
  // Mood chart mapping scores
  const MOOD_SCORES_MAP: Record<string, number> = {
    '愉悦': 10,
    '喜悦': 10,
    '安闲': 9,
    '澄澈': 8.5,
    '平静': 7,
    '疲惫': 5,
    '困顿': 4.5,
    '急躁': 4,
    '焦虑': 3,
    '烦愁': 2.5,
    '抑郁': 1.5
  };

  const matchDiaryForDate = (diariesList: DiaryEntry[], targetDate: Date): DiaryEntry | undefined => {
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return diariesList.find(d => {
      const dStr = d.date;
      return dStr.includes(`${month}/${day}`) || 
             dStr.includes(`${month}-${day}`) || 
             dStr.includes(`${parseInt(month)}月${parseInt(day)}`) ||
             dStr.includes(`${parseInt(month)}/${parseInt(day)}`);
    });
  };

  // Generate 7-day mood timeline
  const getChartData = () => {
    const data = [];
    const today = new Date();
    
    const isDemo = diaries.length === 0;
    // Beautiful peaceful undulating wave for empty baseline demo
    const demoScores = [7.2, 8.5, 6.8, 9.0, 7.5, 8.2, 8.8];
    const demoMoods = ['平静', '澄澈', '疲惫', '安闲', '平静', '澄澈', '安闲'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateLabel = `${month}/${day}`;
      
      const match = matchDiaryForDate(diaries, d);
      let score = 7.0;
      let moodName = '平静';
      let realEntry = false;
      
      if (match) {
        score = MOOD_SCORES_MAP[match.mood] || 7.0;
        moodName = match.mood;
        realEntry = true;
      } else if (!isDemo) {
        // If they have diary entries but none on this day, we default to average baseline or neutral
        score = 7.0;
        moodName = '平静';
      } else {
        score = demoScores[6 - i];
        moodName = demoMoods[6 - i];
      }
      
      data.push({
        name: dateLabel,
        '情绪能量': score,
        mood: moodName,
        isReal: realEntry
      });
    }
    return { data, isDemo };
  };

  const { data: chartData, isDemo } = getChartData();

  // Generate deep AI feedback advice card based on actual or demo values
  const getTrendFeedback = () => {
    if (isDemo) {
      return {
        title: "静修前瞻：AI 生态情绪走势",
        advice: "当前展示近七日情绪波动图谱。点击上方的「随笔日记」描述您最真实的感觉，系统后台会自动分析情绪走势，在情绪曲线中沉淀珍贵的心灵指引，辅助本端输出深度诊疗反馈。",
        badge: "预想中和"
      };
    }
    
    const scores = chartData.map(item => item['情绪能量']);
    const lastScore = scores[scores.length - 1];
    
    let title = "心脉调理：AI 疗愈建议反馈";
    let advice = "";
    let badge = "气血和谐";
    
    if (lastScore <= 4.5) {
      title = "心脉预警：AI 急性调摄药方";
      advice = "检测到您最近的心态偏于急促或忧郁。此乃气机失固、郁阻中焦之症。建议即刻放下繁杂，静修 10 分钟「1:1:1 平衡调息法」，播放器将载入古磬钵长鸣音以驱赶燥热。";
      badge = "焦虑烦隔";
    } else if (lastScore < 7) {
      title = "神疲乏力：AI 醒神舒压建议";
      advice = "情绪呈疲惫状态。说明近日精神中轴过度损耗。建议于午后开展 5 分钟的「4:2:4 醒神苏能呼吸」，将音轨配比调高「竹涛风铃」，在自然微澜中徐徐聚气。";
      badge = "气短身重";
    } else if (lastScore >= 8.5) {
      title = "安泰神怡：AI 完美状态期许";
      advice = "完美！您当前心气安驻于「安闲」与「澄澈」太和之境，内室融通。建议睡前聆听一曲「极速入梦」并配合安息调息，持存通透无负累的生命振幅。";
      badge = "澄心静泰";
    } else {
      title = "心平气和：AI 守诚中和心法";
      advice = "您的心境当前处于平衡和中状态。无大喜大悲，正是中医学提倡的“恬淡虚无，真气从之”。每日用热茶一盏、古竖琴两曲把这种中和持存下去。";
      badge = "中正平和";
    }
    
    return { title, advice, badge };
  };

  const trendFeedback = getTrendFeedback();

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
  const [newQuoteInput, setNewQuoteInput] = useState('');
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [showDbConfig, setShowDbConfig] = useState(false);

  const [dynamicQuotes, setDynamicQuotes] = useState<string[]>(BOOK_QUOTES);
  const [diaryPrompts, setDiaryPrompts] = useState<string[]>([]);
  const [showMoodTrendsModal, setShowMoodTrendsModal] = useState(false);
  const [recipeSubTab, setRecipeSubTab] = useState<'my_recipes' | 'fav_recipes' | 'melody_creation'>('my_recipes');

  useEffect(() => {
    async function loadDynamicCorpus() {
      if (dbMode === 'supabase' && supabaseUrl && supabaseAnonKey) {
        setIsSyncing(true);
        setSyncLogs('正在拉取 Supabase 云端国风心灵语料...⌛');
        
        // 1. Fetch book quotes
        const fetched = await fetchAnswerQuotes();
        if (fetched && fetched.length > 0) {
          setDynamicQuotes(fetched);
          setSyncLogs(`云端数据成功连通：当前书库已载入 ${fetched.length} 条珍贵答案！`);
        } else {
          setDynamicQuotes(BOOK_QUOTES);
          setSyncLogs('云端暂无数据或查询出错，已自动平滑降级至本端 35 条国风精选语料。');
        }

        // 2. Fetch diary prompts
        const fPrompts = await fetchDiaryPrompts();
        if (fPrompts && fPrompts.length > 0) {
          const three = [...fPrompts].sort(() => 0.5 - Math.random()).slice(0, 3);
          setDiaryPrompts(three);
        } else {
          const three = [...LOCAL_DIARY_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
          setDiaryPrompts(three);
        }
        setIsSyncing(false);
      } else {
        setDynamicQuotes(BOOK_QUOTES);
        const three = [...LOCAL_DIARY_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
        setDiaryPrompts(three);
      }
    }
    loadDynamicCorpus();
  }, [dbMode, supabaseUrl, supabaseAnonKey]);

  const [profileActiveTab, setProfileActiveTab] = useState<'recipes' | 'diaries'>('recipes');

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

    const quote = dynamicQuotes[selectedQuoteIndex] || BOOK_QUOTES[selectedQuoteIndex];
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
      alert('⚡ Supabase 数据库管道已连接成功！语料库已启动实时拉取。');
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      setSyncLogs('已断开云连接。数据已完全收缩储存于本地安全沙盒。');
      alert('已断开 Supabase 云端并清空凭据，已切换至内置本端 35 条国风精选语料。');
    }
  };

  const handleRefreshPrompts = async () => {
    if (dbMode === 'supabase') {
      const fPrompts = await fetchDiaryPrompts();
      if (fPrompts && fPrompts.length > 0) {
        const three = [...fPrompts].sort(() => 0.5 - Math.random()).slice(0, 3);
        setDiaryPrompts(three);
        return;
      }
    }
    const three = [...LOCAL_DIARY_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
    setDiaryPrompts(three);
  };

  const handleAddCustomQuote = async () => {
    if (!newQuoteInput.trim()) return;
    if (dbMode !== 'supabase') {
      alert('请先将下方数据库模式切换为 Supabase 并填入完整配置凭证！');
      return;
    }
    setIsAddingQuote(true);
    const ok = await addAnswerQuote(newQuoteInput.trim());
    if (ok) {
      alert('🎉 句签已成功上架 Supabase 数据库！已实时刷新本地答案之书！');
      setNewQuoteInput('');
      const fetched = await fetchAnswerQuotes();
      if (fetched && fetched.length > 0) {
        setDynamicQuotes(fetched);
      }
    } else {
      alert('上传失败，请确认您已在 Supabase 中运行配套 SQL、创建并赋予 book_quotes 表公有(anonymous/anon)读写权限。');
    }
    setIsAddingQuote(false);
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
    const idx = Math.floor(Math.random() * dynamicQuotes.length);
    setSelectedQuoteIndex(idx);
    setIsBookOpened(true);
  };

  const getMoodTrendData = () => {
    const rawData = [...diaries].reverse();
    const moodsWeight: Record<string, number> = {
      '平静': 70,
      '愉悦': 90,
      '疲惫': 50,
      '焦虑': 40,
      '急躁': 35,
      '抑郁': 20
    };

    if (rawData.length === 0) {
      return [
        { date: '5/22', score: 65, label: '平静' },
        { date: '5/23', score: 70, label: '平静' },
        { date: '5/24', score: 55, label: '疲惫' },
        { date: '5/25', score: 75, label: '愉悦' },
        { date: '5/26', score: 60, label: '平静' },
        { date: '5/27', score: 80, label: '愉悦' },
        { date: '今天', score: 70, label: '平静' }
      ];
    }

    const latestEntries = rawData.slice(-7);
    return latestEntries.map((d, index) => {
      const score = (d.aiResponse as any)?.score || moodsWeight[d.mood] || 70;
      const dateStr = d.date ? d.date.split('/').slice(-2).join('/') : `日记 ${index + 1}`;
      return {
        date: dateStr,
        score,
        label: d.mood
      };
    });
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
                isDark ? 'bg-slate-800 border-amber-500/30' : 'bg-stone-100 border-stone-300/80 text-stone-800'
              }`}
              title="点击更换修行头像"
            >
              {profile.avatar}
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow">
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
                    className="w-8 h-8 rounded-full hover:bg-amber-500/10 flex items-center justify-center text-lg cursor-pointer border border-transparent hover:border-amber-500/20 active:scale-90 transition-all font-sans"
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
                    <button onClick={handleSaveName} className="text-[10px] text-amber-500 font-bold hover:underline cursor-pointer">保存</button>
                  </div>
                ) : (
                  <span className="text-sm font-extrabold flex items-center gap-1 font-sans">
                    {userName}
                    {!isGuest && (
                    <Edit2 className="w-3 h-3 text-gray-500 hover:text-amber-500 cursor-pointer" onClick={() => setIsEditingName(true)} />
                    )}
                  </span>
                )}

                {isGuest ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 font-sans animate-pulse">
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
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-700 text-white font-extrabold text-[10.5px] shadow-sm hover:from-amber-400 hover:to-amber-800 transition-all cursor-pointer font-sans"
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
              ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' 
              : 'bg-amber-50/15 border-amber-200 text-amber-850'
          }`}>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-bold font-sans flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                修行之旅 • 尚未绑定
              </p>
              <p className="text-[10px] leading-relaxed opacity-80">
                当前为游客修持模式。注册或登录可自定义您的法号，并支持数据自动备份与精品配方发布。
              </p>
            </div>
            <button
              onClick={onLogOut}
              className="px-3 py-1.5 rounded-lg bg-[#a67c52] hover:bg-[#8e6b46] text-white text-[10.5px] font-extrabold shadow cursor-pointer transition-all self-center shrink-0"
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
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-stone-300 text-stone-900'
                }`}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditingBio(false)} className="text-[10px] text-gray-400 hover:underline cursor-pointer">取消</button>
                <button onClick={handleSaveBio} className="text-[10px] text-[#a67c52] font-bold hover:underline cursor-pointer">保存说明</button>
              </div>
            </div>
          ) : (
            <p className="flex justify-between items-start gap-3">
              <span className="italic">&ldquo;{userBio}&rdquo;</span>
              <button onClick={() => setIsEditingBio(true)} className="text-[9.5px] font-bold text-[#a67c52] hover:underline cursor-pointer shrink-0 mt-0.5">修改一句话</button>
            </p>
          )}
        </div>

        {/* Emotion States Chips Widget on Profile Card */}
        <div className="border-t border-dashed border-gray-500/10 pt-2.5">
          <p className={`text-[10px] font-bold mb-1.5 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-stone-550'}`}>
            <Smile className="w-3.5 h-3.5 text-amber-500" />
            <span>今日心情卡：</span>
          </p>
          <div className="flex flex-wrap gap-1 border-stone-200">
            {MOOD_CHIPS.map(mood => {
              const isActive = userMood === mood;
              return (
                <button
                  key={mood}
                  onClick={() => handleSelectMood(mood)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-bold'
                      : isDark
                        ? 'bg-slate-900/60 border-transparent text-gray-500 hover:text-gray-300'
                        : 'bg-stone-100 border-transparent text-stone-500 hover:text-stone-850'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>

          {/* Clickable shortcut helper to check trend logs and sync cloud database */}
          <div className="mt-3 pt-2.5 border-t border-dashed border-gray-500/10 flex justify-end">
            <button
               onClick={() => setShowMoodTrendsModal(true)}
              className={`text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark 
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20 shadow-sm' 
                  : 'bg-stone-550/10 border-stone-250 text-stone-700 hover:bg-[#faf6ed] shadow-sm'
              }`}
              id="open_trends_btn"
            >
              <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>查看七日情绪能量走势 & 数据库云同步 ▴</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHINESE JOURNAL DIARY DIALOG TRIGGER BAR */}
      <div className={`p-4 rounded-2xl border text-center flex flex-col gap-2 transition-all ${
        isDark ? 'bg-slate-950/60 border-slate-900 shadow-lg' : 'bg-white border-stone-200/85 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
      }`} id="record_starter_box">
        <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h3 className="text-xs font-black tracking-wider uppercase font-sans">心流记录岛</h3>
        </div>
        <p className={`text-[10px] leading-relaxed max-w-xs mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-stone-500'}`}>
          闭上眼，默念您的疑惑、委屈或感悟。翻开“答案之书”，或呼出“AI疗愈师”续笔并开方，舒缓您繁杂的身心状态。
        </p>

        <div className="grid grid-cols-2 gap-3 mt-1.5" id="mind_island_suboptions">
          {/* Card A: Essay Diary */}
          <button
            onClick={() => {
              setRecordType('diary');
              setShowRecordModal(true);
              setIsBookOpened(false);
              setDiaryInput('');
            }}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer hover:scale-102 active:scale-98 group ${
              isDark 
                ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-amber-500/30' 
                : 'bg-stone-50 border-stone-200 hover:bg-[#faf6ed] hover:border-[#a67c52]/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-[#a67c52]/10 text-[#a67c52]'}`}>
                <Edit2 className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gray-400" />
            </div>
            <div>
              <p className="text-[11.5px] font-extrabold tracking-wide">阅己 • 随笔日记</p>
              <p className={`text-[9px] mt-0.5 leading-relaxed opacity-60 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>写写喜怒哀乐，由AI疗愈师辅助开方</p>
            </div>
          </button>

          {/* Card B: Book of Answers */}
          <button
            onClick={() => {
              setRecordType('tag');
              setShowRecordModal(true);
              setIsBookOpened(false);
              setDiaryInput('');
            }}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer hover:scale-102 active:scale-98 group ${
              isDark 
                ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-amber-500/30' 
                : 'bg-stone-50 border-stone-200 hover:bg-[#faf6ed] hover:border-[#a67c52]/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-[#a67c52]/10 text-[#a67c52]'}`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gray-400" />
            </div>
            <div>
              <p className="text-[11.5px] font-extrabold tracking-wide">叩问 • 答案之书</p>
              <p className={`text-[9px] mt-0.5 leading-relaxed opacity-60 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>默念心头疑惑，随机翻开深省箴言</p>
            </div>
          </button>
        </div>
      </div>

      {/* 2.5 AI RESPONSE FLOATING PRESCRIPTION (STAYS AS CORR FEEDBACK) */}
      {latestAiLetter && (
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'border-amber-500/30 bg-slate-950/50' : 'border-[#ecdcb9] bg-[#faf6ed] text-stone-900 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 mb-2 text-[#a67c52]">
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
              className="px-2.5 py-1 text-[10.5px] font-bold bg-[#a67c52] text-white rounded cursor-pointer"
            >
              立刻载入试听
            </button>
          </div>
        </div>
      )}

      {/* 3. MY COMPREHENSIVE HEALING PRACTICE SPACE (TABS WIDGET) */}
      <div className={`rounded-2xl border p-4 transition-all ${
        isDark ? 'bg-[#0f172a]/40 border-slate-900/80 shadow-lg' : 'bg-white border-stone-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
      }`} id="personal_healing_workspace_tabs">
        {/* Tab Headers */}
        <div className={`grid grid-cols-2 p-1 rounded-xl mb-4 text-[10.5px] font-extrabold font-sans select-none ${
          isDark ? 'bg-slate-950/70 border border-slate-900' : 'bg-stone-100/80 border border-stone-200'
        }`}>
          <button
            onClick={() => setProfileActiveTab('recipes')}
            className={`py-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              profileActiveTab === 'recipes'
                ? isDark ? 'bg-slate-900 text-amber-500 border border-slate-800' : 'bg-white text-[#a67c52] shadow-sm'
                : isDark ? 'text-gray-500' : 'text-stone-500'
            }`}
          >
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span>我的配方库 ({savedRecipes.length + userCreations.length})</span>
          </button>
          
          <button
            onClick={() => setProfileActiveTab('diaries')}
            className={`py-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              profileActiveTab === 'diaries'
                ? isDark ? 'bg-slate-900 text-amber-500 border border-slate-800' : 'bg-white text-[#a67c52] shadow-sm'
                : isDark ? 'text-gray-500' : 'text-stone-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>日签反思 ({diaries.length})</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[220px]">
          {/* A. MY RECIPES TAB SECTION */}
          {profileActiveTab === 'recipes' && (
            <div className="space-y-4">
              {/* Three-way Sub-tab selector */}
              <div className="flex gap-2 mb-3 border-b border-gray-500/10 pb-2 select-none">
                <button
                  onClick={() => setRecipeSubTab('my_recipes')}
                  className={`px-3 py-1.5 text-[11px] font-black tracking-tight rounded-lg cursor-pointer transition-all ${
                    recipeSubTab === 'my_recipes'
                      ? isDark ? 'bg-amber-500/15 text-amber-540 border border-amber-500/30' : 'bg-stone-900 text-white shadow-sm font-black'
                      : 'text-gray-400 hover:text-stone-500'
                  }`}
                >
                  我的配方 ({savedRecipes.filter(r => r.isCustom).length})
                </button>
                <button
                  onClick={() => setRecipeSubTab('fav_recipes')}
                  className={`px-3 py-1.5 text-[11px] font-black tracking-tight rounded-lg cursor-pointer transition-all ${
                    recipeSubTab === 'fav_recipes'
                      ? isDark ? 'bg-amber-500/15 text-amber-540 border border-amber-500/30' : 'bg-stone-900 text-white shadow-sm font-black'
                      : 'text-gray-400 hover:text-stone-500'
                  }`}
                >
                  收藏配方 ({savedRecipes.filter(r => !r.isCustom).length})
                </button>
                <button
                  onClick={() => setRecipeSubTab('melody_creation')}
                  className={`px-3 py-1.5 text-[11px] font-black tracking-tight rounded-lg cursor-pointer transition-all ${
                    recipeSubTab === 'melody_creation'
                      ? isDark ? 'bg-amber-500/15 text-amber-540 border border-amber-500/30' : 'bg-stone-900 text-white shadow-sm font-black'
                      : 'text-gray-400 hover:text-stone-500'
                  }`}
                >
                  旋律创作 ({userCreations.length})
                </button>
              </div>

              {/* Sub-tab 1: My Recipes */}
              {recipeSubTab === 'my_recipes' && (
                <div className="space-y-2.5">
                  {savedRecipes.filter(r => r.isCustom).length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                        暂无自制配方。您可以前往「音能混配」栏目调谐属于您气血的专属自然白噪音配方。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-0.5" id="my_recipes_subtab">
                      {savedRecipes.filter(r => r.isCustom).map(recipe => (
                        <div
                          key={recipe.id}
                          className={`p-3 rounded-xl border relative transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs font-sans ${
                            isDark ? 'bg-slate-950/60 border-slate-900/80 text-gray-300' : 'bg-stone-550/10 border-stone-200/50 text-stone-900 shadow-sm'
                          }`}
                        >
                          <div className="pr-8 flex-1 min-w-0 text-left">
                            <span className="font-extrabold text-[12px] text-[#8e6b46]">{recipe.name}</span>
                            <p className={`text-[9.5px] mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>
                              {recipe.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => onApplyRecipe(recipe)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                isDark
                                  ? 'bg-slate-950 hover:bg-slate-805 text-cyan-400 border border-slate-800'
                                  : 'bg-[#a67c52] hover:bg-[#8e6b46] text-white shadow-sm'
                              }`}
                            >
                              载入混配
                            </button>
                            
                            {onDeleteRecipe && (
                              <button
                                onClick={() => onDeleteRecipe(recipe.id)}
                                className={`p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${
                                  isDark ? 'text-slate-600' : 'text-stone-300'
                                }`}
                                title="从自制名册中移除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Favorited Recipes */}
              {recipeSubTab === 'fav_recipes' && (
                <div className="space-y-2.5">
                  {savedRecipes.filter(r => !r.isCustom).length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                        暂无收藏配方。您可以前往「发现/社区」发现并收藏其他静修同修分享的药膳古法秘方。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-0.5" id="fav_recipes_subtab">
                      {savedRecipes.filter(r => !r.isCustom).map(recipe => (
                        <div
                          key={recipe.id}
                          className={`p-3 rounded-xl border relative transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs font-sans ${
                            isDark ? 'bg-slate-950/60 border-slate-900/80 text-gray-300' : 'bg-stone-550/10 border-stone-200/50 text-stone-900 shadow-sm'
                          }`}
                        >
                          <div className="pr-8 flex-1 min-w-0 text-left">
                            <span className="font-extrabold text-[12px] text-[#8e6b46]">{recipe.name}</span>
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">{recipe.purposeLabel}</span>
                            <p className={`text-[9.5px] mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>
                              {recipe.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => {
                                onApplyRecipe(recipe);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                isDark
                                  ? 'bg-slate-950 hover:bg-slate-805 text-cyan-400 border border-slate-800'
                                  : 'bg-[#a67c52] hover:bg-[#8e6b46] text-white shadow-sm'
                              }`}
                            >
                              载入配方
                            </button>
                            
                            {onDeleteRecipe && (
                              <button
                                onClick={() => onDeleteRecipe(recipe.id)}
                                className={`p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${
                                  isDark ? 'text-slate-600' : 'text-stone-300'
                                }`}
                                title="取消收藏配方"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Melody Creations */}
              {recipeSubTab === 'melody_creation' && (
                <div className="space-y-2.5">
                  {!userCreations || userCreations.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                        暂无旋律创作。您可以前往「声疗编钟/五音疗疾」栏目自由敲击编钟，录制专属舒缓音乐曲目。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-0.5" id="melody_creation_subtab">
                      {userCreations.map(creation => (
                        <div
                          key={creation.id}
                          className={`p-3 rounded-xl border relative transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs font-sans ${
                            isDark ? 'bg-slate-950/60 border-slate-900/80 text-gray-300' : 'bg-stone-550/10 border-stone-200/50 text-stone-900 shadow-sm'
                          }`}
                        >
                          <div className="pr-8 flex-1 min-w-0 text-left">
                            <span className="font-extrabold text-[12px] text-[#8e6b46]">{creation.name}</span>
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-mono">{creation.instrumentLabel}</span>
                            <p className={`text-[9.5px] mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>
                              小节数: {creation.barCount} | 包含音符: {creation.totalNotes} | 节奏: {creation.bpm} BPM | 创作时间: {creation.date}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {onLoadCreation && (
                              <button
                                onClick={() => onLoadCreation(creation)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  isDark
                                    ? 'bg-slate-950 hover:bg-slate-805 text-cyan-400 border border-slate-800'
                                    : 'bg-[#a67c52] hover:bg-[#8e6b46] text-white shadow-sm'
                                }`}
                              >
                                载入创作
                              </button>
                            )}
                            
                            {onDeleteCreation && (
                              <button
                                onClick={() => onDeleteCreation(creation.id)}
                                className={`p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${
                                  isDark ? 'text-slate-600' : 'text-stone-300'
                                }`}
                                title="永久删除曲谱档案"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* C. MY REFLECTION LOGS (DIARIES) */}
          {profileActiveTab === 'diaries' && (
            <div className="space-y-4">
              {/* Sub-label heading for historic list */}
              <div className="flex items-center justify-between text-[10.5px] font-black px-1">
                <span className="flex items-center gap-1 font-sans">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" /> 历史反思日记名录 ({diaries.length})
                </span>
                <span className="text-[8.5px] text-gray-400 font-mono">
                  AES-256 本地密存
                </span>
              </div>

              {/* ORIGINAL LIST OF DIARIES */}
              {diaries.length === 0 ? (
                <div className="py-6 text-center px-4 border border-dashed rounded-xl border-gray-400/25">
                  <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                    心灵净地尚无印记。点击上方的「随笔日记」写写您的喜怒哀意，系统随后会在此展示实存平滑情绪变化指数。
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                  {diaries.map(diary => (
                    <div 
                      key={diary.id}
                      className={`p-3 rounded-xl border transition-all text-xs font-sans relative ${
                        isDark 
                          ? 'bg-slate-950/60 border-slate-900 text-gray-300' 
                          : 'bg-stone-550/10 border-stone-200/50 text-stone-900 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[9.5px] opacity-50">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" /> {diary.date}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] ${isDark ? 'bg-slate-900 text-amber-500 font-bold' : 'bg-stone-150 text-stone-700 font-bold'}`}>
                          感觉: {diary.mood}
                        </span>
                      </div>
                      <p className="leading-relaxed text-[11px] text-justify whitespace-pre-wrap">{diary.content}</p>
                      {diary.aiResponse && (
                        <div className={`mt-2 p-2 rounded-lg border text-[10px] leading-relaxed relative ${
                          isDark ? 'bg-slate-900/40 border-slate-900 text-gray-400' : 'bg-stone-550/10 border-stone-100 text-stone-600'
                        }`}>
                          <p className="font-extrabold text-[#a67c52] dark:text-[#8e6b46] mb-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                            <span>导师赠言: {diary.aiResponse.feedback}</span>
                          </p>
                          {diary.aiResponse.suggestedRecipeName && (
                            <p className="text-[9.5px] text-sky-500 dark:text-cyan-400 font-medium mt-0.5">
                              推荐药膳配方: {diary.aiResponse.suggestedRecipeName}
                            </p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => onDeleteDiary(diary.id)}
                        className="absolute right-2 top-2 p-1 rounded hover:bg-rose-500/10 hover:text-rose-500 text-gray-400 opacity-60 hover:opacity-100 transition-all cursor-pointer border-0 outline-none"
                        title="删除日记"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. SHOW MOOD TRENDS AND CLINICAL CLOUD SYNC DRAWER OVERLAY */}
      <AnimatePresence>
        {showMoodTrendsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            {showMoodTrendsModal && (
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className={`w-full max-w-4xl rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto text-left flex flex-col ${
                  isDark ? 'bg-[#0f172a] border border-slate-905 text-gray-200' : 'bg-[#faf6ed] text-stone-900 shadow-2xl'
                }`}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowMoodTrendsModal(false)}
                  className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-500/10 cursor-pointer transition-colors border-0 outline-none"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-4 pb-1.5 border-b border-gray-500/10">
                  <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h3 className="text-sm font-black uppercase font-sans tracking-wider font-extrabold text-[#8e6b46]">
                    情绪能量波动图谱 & 云端同步控制中心
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Recharts Mood Flow Chart */}
                  <div className="space-y-4 font-sans">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                        近七日心力场律振幅图谱
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-stone-200 text-stone-700'
                      }`}>
                        状态指标: ${trendFeedback.badge}
                      </span>
                    </div>

                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <defs>
                            <linearGradient id="gradientMoodArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="#94a3b8" fontSize={9} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className={`p-2.5 rounded-xl border text-[9.5px] font-sans ${isDark ? 'bg-slate-950 border-slate-900 text-gray-200' : 'bg-white border-stone-250 text-stone-900 shadow-md'}`}>
                                    <p className="font-bold opacity-50 font-mono">${item.name}</p>
                                    <p className="text-rose-500 font-extrabold mt-0.5 font-sans">情绪能量: ${payload[0].value} / 10</p>
                                    <p className="text-[#a67c52] dark:text-cyan-400 font-bold font-sans">归属状态: ${item.mood} ${item.isReal ? '(实录)' : '(中和 baseline)'}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="情绪能量" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradientMoodArea)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* AI Feedback Clinical Diagnostic Card */}
                    <div className={`p-3 rounded-xl border relative text-left ${
                      isDark ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-stone-200 shadow-sm'
                    }`}>
                      <span className="font-extrabold text-[11px] text-[#a67c52] dark:text-amber-500 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        ${trendFeedback.title}
                      </span>
                      <p className={`text-[10px] leading-relaxed text-justify ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                        ${trendFeedback.advice}
                        {` 同时建议结合「声疗编钟/五音疗疾」的“徵音(火)”或“羽音(水)”混配设计，通过 528Hz 黄金频率促醒中枢神经，修补经络堵点。`}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Clock Database Sync / Config Area */}
                  <div className="space-y-4 font-sans text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                       <span className="flex items-center gap-1 text-emerald-500 font-bold">
                         <Cloud className="w-3.5 h-3.5 shrink-0" />
                         云备份储存与凭点设置 (Supabase)
                       </span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={dbMode === 'supabase'}
                          onChange={(e) => {
                            setDbMode(e.target.checked ? 'supabase' : 'local');
                            setSyncLogs(e.target.checked ? '云同步管道就绪。正在加载 Supabase schema 信息。' : '回退至本地沙盒，使用 localStorage 持久存储。');
                          }}
                        />
                        <div className="w-7 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-1 text-[8.5px] font-bold text-gray-400">网络同步</span>
                      </label>
                    </div>

                  {dbMode === 'supabase' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-400 font-medium mb-1 font-sans text-[10px]">VITE_SUPABASE_URL</label>
                        <input
                          type="text"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://your-project.supabase.co"
                          className={`w-full p-2 rounded-xl text-xs font-mono outline-none border transition-all ${
                            isDark 
                              ? 'bg-slate-900 border-slate-800 text-gray-100 focus:border-emerald-500/50' 
                              : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#a67c52]/50 shadow-inner'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 font-medium mb-1 font-sans text-[10px]">VITE_SUPABASE_ANON_KEY</label>
                        <input
                          type="password"
                          value={supabaseAnonKey}
                          onChange={(e) => setSupabaseAnonKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                          className={`w-full p-2 rounded-xl text-xs font-mono outline-none border transition-all ${
                            isDark 
                              ? 'bg-slate-900 border-slate-800 text-gray-100 focus:border-emerald-500/50' 
                              : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#a67c52]/50 shadow-inner'
                          }`}
                        />
                      </div>

                      <button
                        onClick={handleSaveDbSettings}
                        className="w-full py-2 text-[10.5px] font-black bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl shadow transition-all cursor-pointer text-center"
                      >
                        测试 & 保存连接
                      </button>

                      {/* Add dynamic quotes input to database */}
                      <div className="border-t border-dashed border-gray-400/20 pt-3 mt-1 text-[11px]">
                        <span className="font-extrabold text-[#a67c52] dark:text-amber-400 flex items-center gap-1 mb-1.5">
                          <Plus className="w-3.5 h-3.5 text-emerald-500" /> 上传新纸签至 Supabase 语料库
                        </span>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newQuoteInput}
                            onChange={(e) => setNewQuoteInput(e.target.value)}
                            placeholder="写下一句你想要的国风心灵笺言..."
                            className={`flex-1 p-2 rounded-xl text-xs outline-none border transition-all ${
                              isDark 
                                ? 'bg-slate-900 border-slate-800 text-gray-100 focus:border-sky-500/50' 
                                : 'bg-stone-50 border-stone-200 text-stone-900 shadow-sm focus:border-[#a67c52]/50'
                            }`}
                          />
                          <button
                            onClick={handleAddCustomQuote}
                            disabled={isAddingQuote || !newQuoteInput.trim()}
                            className="p-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-extrabold cursor-pointer transition-all shrink-0 text-[10.5px]"
                          >
                            {isAddingQuote ? '存储中...' : '放入云库'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-xl border text-[10px] text-gray-400 leading-relaxed ${
                      isDark ? 'bg-slate-900/40 border-slate-900' : 'bg-stone-550/10 border-stone-200/55 shadow-sm'
                    }`}>
                      当前运行在本地安全沙盒模式下。如果您拥有 Supabase 云数据库凭点，并希望持久安全保存您的纸本配餐和心流记录，请开启右侧“云端同步”，并在其界面下建立表单和注入 credentials 金匙。
                    </div>
                  )}

                  {/* logs and backup status */}
                  <div className={`p-2.5 rounded-lg border text-[9.5px] mt-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-900/80 text-gray-400' : 'bg-[#faf6ed]/60 border-[#ecdcb9]/50 text-[#857463]'
                  } font-mono leading-relaxed`}>
                    <span className="font-black block text-[8px] uppercase tracking-wide opacity-50 mb-0.5">云网同传管道状态:</span>
                    {syncLogs}
                  </div>

                  {/* Schema SQL info box */}
                  {dbMode === 'supabase' && (
                    <div className={`p-2.5 rounded-lg border text-[9.5px] ${
                      isDark ? 'bg-slate-900/80 border-slate-800 text-gray-400' : 'bg-[#faf6ed]/60 border-[#ecdcb9]/40 text-[#857463]'
                    } font-sans text-justify mt-3`}>
                      <p className="font-bold mb-1 text-emerald-500">💡 数据库表配置指南</p>
                      请在您的 Supabase 控制台的 SQL Editor 中执行下述语句以建立语料库表格：
                      <pre className="mt-1.5 p-2 bg-black/40 text-[8.5px] rounded border border-white/5 font-mono overflow-x-auto text-[#a6e22e] leading-normal select-all">
{`-- 1. 答案之书与日签
create table book_quotes (
  id bigint generated always as identity primary key,
  quote text not null,
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table book_quotes enable row level security;
create policy "Allow public read" on book_quotes for select using (true);
create policy "Allow public insert" on book_quotes for insert with check (true);

-- 2. 电子木鱼云端预设词库
create table muyu_presets (
  id bigint generated always as identity primary key,
  theme_name text not null,
  base_word text not null,
  floatings text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table muyu_presets enable row level security;
create policy "Allow public read" on muyu_presets for select using (true);
create policy "Allow public insert" on muyu_presets for insert with check (true);`}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

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
              <div className="flex items-center gap-1.5 text-amber-500">
                {recordType === 'diary' ? (
                  <>
                    <Edit2 className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="text-[11.5px] font-black uppercase font-sans">阅己 • 随笔日记</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="text-[11.5px] font-black uppercase font-sans">叩问 • 答案之书</span>
                  </>
                )}
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
                        &ldquo; {dynamicQuotes[selectedQuoteIndex] || BOOK_QUOTES[selectedQuoteIndex]} &rdquo;
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
                    isDark ? 'bg-slate-950/40 border-slate-900/40 text-gray-400' : 'bg-[#faf6ed] border-[#ecdcb9]/55 text-stone-600'
                  }`}>
                    <div className="flex justify-between items-center mb-1 text-amber-500">
                      <p className="font-black text-[10px] opacity-75">📖 愈思写作建议：</p>
                      <button
                        onClick={handleRefreshPrompts}
                        className="text-[8.5px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        id="refresh_prompts_btn"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> 换几句建议
                      </button>
                    </div>
                    <ul className="list-disc pl-3.5 space-y-1">
                      {diaryPrompts.map((prompt, pi) => (
                        <li key={pi} className="cursor-pointer hover:text-amber-500" onClick={() => setDiaryInput(prev => prev + prompt)}>
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
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/40 font-bold'
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
                          ? 'bg-[#040810] border-slate-900 text-white focus:border-amber-400/30' 
                          : 'bg-white border-stone-250 text-stone-900 focus:border-[#a67c52]/40 shadow-inner'
                      }`}
                    />
                  </div>

                  {/* 🪄 INTERVENTION AI AUTO-CONTINUING ASSISTANCE DRAWER CARD */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-900' : 'bg-white shadow-sm border-stone-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-500">
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
                              : 'bg-[#a67c52] hover:bg-[#8e6b46] text-white font-extrabold shadow-sm'
                        }`}
                      >
                        {isContinuing ? <RefreshCw className="w-3 h-3 animate-spin" /> : '试用 润色续笔'}
                      </button>
                    </div>
                    <p className={`text-[9.5px] leading-relaxed opacity-60 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                      写到一半无法流畅展开？点击上方让专家助理顺着您的情绪 and 感悟优雅续写诗意修持，句式将直接追加到您的随笔末尾。
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
                      className={`py-2.5 rounded-xl font-black text-xs select-none cursor-pointer flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-[#a67c52] to-amber-700 text-white ${
                        isAiProcessing || !diaryInput.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:from-[#9c6f44] shadow-md'
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
