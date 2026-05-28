/**
 * @file AmbientBrainwaves.ts
 * @description
 * 
 * --- 脑波能量自研映射机理与底逻辑 (Under-the-hood Brainwave Engineering Logic) ---
 * 
 * 依据脑电波生物学与声学诱导机制 (Binaural Beats Entrainment Frequency Dynamics), 
 * 不同愈疗心境对应独特的双耳差频区间：
 * 
 * 1. 【深睡助眠 - Delta波 (1-4Hz)】:
 *    - 主频率: 150Hz. 差频: 3.5Hz.
 *    - 原理: 诱导大脑皮质层产生同步慢波慢放，促成深度无梦睡眠与细胞整复。
 * 
 * 2. 【澄澈专注 - Alpha/Beta波 (8-15Hz)】:
 *    - 主频率: 180Hz. 差频: 11.0Hz.
 *    - 原理: 强化大脑顶枕叶Alpha共振，收拢白日纷杂思绪、极大化扩展工作信息承载容量。
 * 
 * 3. 【正念静心 - Theta波 (4-7Hz)】:
 *    - 主频率: 160Hz. 差频: 6.8Hz.
 *    - 原理: 放空精神皮质张力，舒缓副交感神经，消退情绪重压焦虑。
 * 
 * 4. 【朝气释压 - Gamma波 (30Hz+)】:
 *    - 主频率: 200Hz. 差频: 14.5Hz.
 *    - 原理: 提神醒脑，打破昏沉倦怠，注入朝气并重新激活活力意志。
 * 
 * 5. 【古法疗愈 - 五脏五音特配】:
 *    - 主频率: 132Hz (黃钟律底). 差频: 5.28Hz (黄金谐波).
 *    - 原理: 基于中医《黄帝内经》「五音疗疾」理论，通过谐频声波共振，调理五脏。
 */

export type BrainwavePurpose = 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin';

export interface BrainwaveDefinition {
  purpose: BrainwavePurpose;
  label: string;
  underlyingLogic: string; // 科学说明注释
  baseFreq: number; // 载波频率 Hz
  offsetFreq: number; // 调制差频 Hz
  bioFeedbackDesc: string; // 生物反馈舒缓状态说明
}

export const brainwaveSpecs: Record<BrainwavePurpose, BrainwaveDefinition> = {
  sleep: {
    purpose: 'sleep',
    label: '深睡助眠',
    underlyingLogic: '双耳差频 Δ: 3.5Hz (Delta波段)，慢波睡眠同步',
    baseFreq: 150,
    offsetFreq: 3.5,
    bioFeedbackDesc: '降低自主活性神经递质，触发褪黑素平缓释放。'
  },
  focus: {
    purpose: 'focus',
    label: '澄澈专注',
    underlyingLogic: '双耳差频 Δ: 11.0Hz (Alpha波段)，顶波高维聚焦',
    baseFreq: 180,
    offsetFreq: 11.0,
    bioFeedbackDesc: '提升海马皮质对特定任务的信息编码，平复周遭微杂干扰。'
  },
  rest: {
    purpose: 'rest',
    label: '正念静心',
    underlyingLogic: '双耳差频 Δ: 6.8Hz (Theta波段)，中度静虑冥修',
    baseFreq: 160,
    offsetFreq: 6.8,
    bioFeedbackDesc: '平复杏仁核神经冲动，收敛由于过度刺激导致的体内虚火。'
  },
  energy: {
    purpose: 'energy',
    label: '振奋释压',
    underlyingLogic: '双耳差频 Δ: 14.5Hz (Low Gamma波段)，唤醒神经通路',
    baseFreq: 200,
    offsetFreq: 14.5,
    bioFeedbackDesc: '激活神经系统运动及能量通路，温阳扫除晨起与午后昏沉。'
  },
  wuyin: {
    purpose: 'wuyin',
    label: '古法疗愈',
    underlyingLogic: '和谐差频 Δ: 5.28Hz (古法黄金律调和拍)',
    baseFreq: 132,
    offsetFreq: 5.28,
    bioFeedbackDesc: '通过精微谐音平抚心脉神识，使脏气归于本位和中。'
  }
};
