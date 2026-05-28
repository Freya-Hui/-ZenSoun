export type PurposeType = 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin';

export interface NoiseItem {
  id: string;
  name: string;
  icon: string;
  volume: number; // 0 to 100
  isActive: boolean;
}

export interface SoundRecipe {
  id: string;
  name: string;
  creator: string;
  creatorEmail?: string;
  isCustom: boolean; // True if created by user
  noises: NoiseItem[];
  purpose: PurposeType;
  purposeLabel: string;
  melodyInstrument: 'harp' | 'bell' | 'bowl' | 'piano';
  tempo: 'slow' | 'ambient' | 'none';
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isPremium: boolean;
  description: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  aiResponse?: {
    feedback: string;
    suggestedRecipeName: string;
    suggestedNoises: { id: string; volume: number }[];
    suggestedInstrument: 'harp' | 'bell' | 'bowl' | 'piano';
  };
}

export interface Profile {
  name: string;
  avatar: string;
  isPremium: boolean;
  joinDate: string;
  listeningTime: number; // in minutes
  streak: number; // daily streak
}

export interface CommunityPost {
  id: string;
  userName: string;
  userAvatar: string;
  userIsPremium: boolean;
  content: string;
  createdAt: string;
  recipe?: SoundRecipe;
  likes: number;
  isLiked: boolean;
  comments: { id: string; userName: string; content: string; date: string }[];
}
