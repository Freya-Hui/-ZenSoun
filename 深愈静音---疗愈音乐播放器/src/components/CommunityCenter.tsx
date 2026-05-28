import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Bookmark, Download, Sparkles, Send, ShieldAlert, BadgeCheck, Music } from 'lucide-react';
import { SoundRecipe, CommunityPost } from '../types';

interface CommunityProps {
  isPremiumUser: boolean;
  onOpenSubscribeModal: () => void;
  savedRecipesList: SoundRecipe[];
  onAddMessage: (content: string) => void;
  posts: CommunityPost[];
  onLikePost: (postId: string) => void;
  onImportRecipe: (recipe: SoundRecipe) => void;
  theme?: 'day' | 'night';
}

export default function CommunityCenter({
  isPremiumUser,
  onOpenSubscribeModal,
  savedRecipesList,
  onAddMessage,
  posts,
  onLikePost,
  onImportRecipe,
  theme = 'day'
}: CommunityProps) {
  const isDark = theme === 'night';
  const [newPostText, setNewPostText] = useState('');
  const [activeRecipeFilter, setActiveRecipeFilter] = useState<'all' | 'recipes'>('all');
  const [showPaywallAlert, setShowPaywallAlert] = useState(false);

  const handleSubmitPost = () => {
    if (!newPostText.trim()) return;
    onAddMessage(newPostText.trim());
    setNewPostText('');
  };

  const handleImportClick = (recipe: SoundRecipe) => {
    if (!isPremiumUser) {
      setShowPaywallAlert(true);
      return;
    }
    onImportRecipe(recipe);
  };

  const filteredPosts = activeRecipeFilter === 'recipes' 
    ? posts.filter(p => !!p.recipe) 
    : posts;

  const loggedInName = localStorage.getItem('zensound_user_name') || '观心行者';
  
  const isUserPremium = (name: string, isPostPremium?: boolean) => {
    if (name === '静听松波' || name === '妙法导师') return true;
    if (name === loggedInName && isPremiumUser) return true;
    if (isPostPremium !== undefined) return isPostPremium;
    return false;
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-[#0a0f1d] text-gray-200' : 'bg-[#faf9f6] text-stone-800'}`}>
      {/* Community Segment Filter */}
      <div className={`flex items-center justify-between px-4 py-2 border-b font-sans shadow-xs ${isDark ? 'bg-[#0d1629] border-slate-900/60' : 'bg-white border-stone-200'}`} id="community_filters">
        <div className={`flex rounded-lg p-0.5 border ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-stone-100 border-stone-200'}`}>
          <button
            onClick={() => setActiveRecipeFilter('all')}
            className={`px-3 py-1 text-xs font-md rounded-md transition-all cursor-pointer ${
              activeRecipeFilter === 'all'
                ? isDark
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner'
                  : 'bg-[#a67c52]/10 text-[#a67c52] shadow-xs border border-[#a67c52]/20 font-black'
                : isDark ? 'text-gray-455 hover:text-gray-300' : 'text-stone-500 hover:text-stone-750'
            }`}
          >
            全部交流
          </button>
          <button
            onClick={() => setActiveRecipeFilter('recipes')}
            className={`px-3 py-1 text-xs font-md rounded-md transition-all cursor-pointer ${
              activeRecipeFilter === 'recipes'
                ? isDark
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner'
                  : 'bg-[#a67c52]/10 text-[#a67c52] shadow-xs border border-[#a67c52]/20 font-black'
                : isDark ? 'text-gray-455 hover:text-gray-300' : 'text-stone-500 hover:text-stone-750'
            }`}
          >
            愈疗配方
          </button>
        </div>
        <span className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-stone-550'}`}>
          共 {posts.length} 条讨论
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-20" id="posts_scroller">
        {/* Post Input Box */}
        <div className={`rounded-xl border p-4 shadow-sm flex flex-col gap-3 ${isDark ? 'bg-[#0f172a] border-slate-800/80 shadow-lg' : 'bg-white border-stone-200'}`}>
          <p className={`text-[10px] font-semibold flex items-center gap-1 font-sans ${isDark ? 'text-amber-400' : 'text-[#a67c52] font-bold'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> 说说当下受声波疗愈后的心音...
          </p>
          <div className="relative">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="分享倾听松涛或木鱼后的感受，或者发布你的独特环境白噪音调制配方..."
              rows={3}
              className={`w-full rounded-xl px-3 py-2.5 text-xs font-sans focus:outline-none border ${isDark ? 'bg-[#070b13] border-slate-900 text-white placeholder-gray-600 focus:border-amber-500/50' : 'bg-stone-50 border-[#ecdcb9]/55 text-stone-900 placeholder-stone-400 focus:border-[#a67c52]'}`}
            />
          </div>
          <div className="flex justify-end font-sans">
            <button
              onClick={handleSubmitPost}
              className="px-4 py-2 bg-gradient-to-r from-[#a67c52] to-amber-700 hover:from-[#9c6f44] hover:to-[#8e6b46] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-98 shadow-md"
            >
              <Send className="w-3 h-3" /> 点击发布帖文
            </button>
          </div>
        </div>

        {/* Posts feed */}
        <div className="space-y-4" id="community_posts_feed">
          {filteredPosts.map(post => {
            return (
              <div 
                key={post.id}
                className={`rounded-xl p-4 transition-all border ${isDark ? 'bg-[#0f172a]/60 border-slate-900 hover:border-slate-800' : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'}`}
              >
                {/* Post Author area */}
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
                      {post.userAvatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold font-sans ${isDark ? 'text-gray-200' : 'text-stone-850'}`}>
                          {post.userName}
                        </span>
                        {isUserPremium(post.userName, post.userIsPremium) && (
                          <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded font-sans leading-[1.25] shadow-sm select-none">PRO</span>
                        )}
                      </div>
                      <span className={`text-[9.5px] font-mono block ${isDark ? 'text-gray-500' : 'text-stone-450'}`}>
                        {post.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Subscribing / Status */}
                  {isUserPremium(post.userName, post.userIsPremium) && (
                    <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-sans font-black uppercase shadow-sm select-none">
                      PRO
                    </span>
                  )}
                </div>

                {/* Post Content */}
                <p className={`text-xs font-sans leading-relaxed mb-3 break-all ${isDark ? 'text-gray-300' : 'text-stone-650'}`}>
                  {post.content}
                </p>

                {/* SHARING FORMULA SECTION! */}
                {post.recipe && (
                  <div className={`p-3 rounded-xl border border-l-[3px] border-l-[#a67c52] flex items-center justify-between mb-3.5 ${isDark ? 'bg-[#070b13] border-slate-900' : 'bg-[#faf6ed] border-[#ecdcb9]/50'}`}>
                    <div className="flex-1 min-w-0 pr-2">
                       <div className="flex items-center gap-1.5 mb-1">
                        <Music className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-[#a67c52]'}`} />
                        <span className={`text-xs font-black font-sans truncate ${isDark ? 'text-gray-200' : 'text-stone-800'}`}>
                          {post.recipe.name}
                        </span>
                      </div>
                      <p className={`text-[10px] font-sans line-clamp-1 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                        主奏: {post.recipe.melodyInstrument === 'bowl' ? '西藏颂钵' : post.recipe.melodyInstrument === 'harp' ? '愈疗竖琴' : post.recipe.melodyInstrument === 'bell' ? '星铃' : '古典钢琴'} • {post.recipe.purposeLabel}功效
                      </p>
                    </div>

                    {/* One-key Save direct handler */}
                    <button
                      onClick={() => handleImportClick(post.recipe!)}
                      className={`px-3 py-2 rounded-lg text-[10.5px] font-sans font-semibold border flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${isDark ? 'bg-gradient-to-r from-slate-950 to-slate-900 hover:bg-slate-800 text-amber-500 border-slate-800' : 'bg-[#a67c52]/10 hover:bg-[#a67c52]/20 text-[#a67c52] border-[#a67c52]/20 font-bold'}`}
                    >
                      <Download className="w-3.5 h-3.5" /> 一键装配
                    </button>
                  </div>
                )}

                {/* Footer tools: Likes, Comments, Views count */}
                <div className={`flex justify-between items-center text-xs border-t pt-3 ${isDark ? 'text-gray-500 border-slate-900/60' : 'text-stone-500 border-stone-100'}`}>
                  <div className="flex items-center gap-4 font-sans">
                    <button 
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1.5 group cursor-pointer ${post.isLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-455'}`}
                    >
                      <Heart className={`w-4 h-4 transition-transform group-active:scale-130 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button className={`flex items-center gap-1.5 cursor-pointer ${isDark ? 'hover:text-amber-400' : 'hover:text-[#a67c52]'}`}>
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </button>
                  </div>

                  <span className="text-[9.5px] font-mono text-gray-500 font-medium">
                    ID: {post.id}
                  </span>
                </div>

                {/* Comments box mock preview */}
                {post.comments.length > 0 && (
                  <div className={`rounded-lg p-2.5 mt-3 space-y-1.5 border ${isDark ? 'bg-[#070b13]/40 border-slate-950' : 'bg-stone-50 border-stone-200'}`}>
                    {post.comments.map(c => (
                      <div key={c.id} className="text-[10.5px] font-sans leading-relaxed flex items-center gap-1 flex-wrap">
                        <span className={`font-bold ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>{c.userName}</span>
                        {isUserPremium(c.userName) && (
                          <span className="bg-amber-500 text-slate-950 text-[7.5px] font-black px-1 rounded font-sans leading-none inline-flex items-center select-none scale-90">PRO</span>
                        )}
                        <span className={isDark ? 'text-gray-400' : 'text-stone-500'}>:</span>
                        <span className={isDark ? 'text-gray-300' : 'text-stone-750'}>{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYWALL ALERT FOR FREE USERS TO ENFORCE LAWS */}
      <AnimatePresence>
        {showPaywallAlert && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border ${isDark ? 'bg-gradient-to-b from-[#111827] to-[#040814] border-slate-800 text-white' : 'bg-white border-stone-250 text-stone-800'}`}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className={`text-sm font-bold font-sans ${isDark ? 'text-gray-100' : 'text-stone-850'}`}>一键保存配方功能受限</h3>
              </div>

              <p className={`text-xs leading-relaxed font-sans mb-5 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                限免账号无法复制或查看非公开高级社群配比。请订阅专业版以无限转存、微调与装配别人的配方。
              </p>

              <div className={`p-4 rounded-xl border mb-6 font-sans ${isDark ? 'bg-amber-500/5' : 'bg-amber-50/50'} border-amber-550/15`}>
                <div className="flex justify-between items-baseline">
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-stone-600'}`}>专业愈疗版</span>
                  <span className="text-lg font-bold text-amber-500 font-mono">¥ 19.9 / 月</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-sans">
                <button
                  onClick={() => {
                    setShowPaywallAlert(false);
                    onOpenSubscribeModal();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 font-semibold text-xs text-white cursor-pointer hover:from-amber-400 shadow-md flex items-center justify-center"
                >
                  订阅解锁全部高级配方
                </button>
                <button
                  onClick={() => setShowPaywallAlert(false)}
                  className={`w-full py-2 rounded-xl text-xs transition-all cursor-pointer ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-stone-400 hover:text-stone-650'}`}
                >
                  回到社区看看
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
