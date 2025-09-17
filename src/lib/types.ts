export type UserData = {
  id: string;
  pariBalance: number;
  hashPower: number;
  baseRate: number;
  streak: number;
  referrals: string[];
  tasks: string[];
  vip: boolean;
  referralCode: string;
  referredBy?: string;
  name: string;
  email: string;
  createdAt: string; // Changed to string for serializability
  sessionEndTime: number | null;
  miningHistory: { amount: number; claimedAt: number | string }[]; // Allow string for serialization
  vipStatus: 'none' | 'pending' | 'approved' | 'rejected';
  vipTransactionId?: string;
  vipProofSubmittedAt?: string; // Changed to string to be serializable
  isAdmin?: boolean;
};

export type Referral = {
  id: string;
  name: string;
  avatar: string;
};

export type Task = {
  id: string;
  title: string;
  reward: number;
  order: number;
  type: 'external' | 'referral_milestone';
  requiredCount?: number;
  url?: string;
};

export type NewsContentItem = {
  type: 'paragraph' | 'section' | 'coming-soon';
  text: string;
  title?: string;
  icon?: 'Gamepad2' | 'Wallet' | 'Star' | 'Flame';
};

export type NewsArticle = {
  id: string;
  title: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  content: NewsContentItem[];
};

    