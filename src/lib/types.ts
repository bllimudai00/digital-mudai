import { Timestamp } from "firebase/firestore";

export type UserData = {
  id: string;
  pariBalance: number;
  baseRate: number;
  referrals: string[];
  tasks: string[];
  vip: boolean;
  referralCode: string;
  referredBy?: string;
  name: string;
  email: string;
  createdAt: string | Timestamp; // Allow both for server/client
  sessionEndTime: number | null;
  miningHistory: { amount: number; claimedAt: string | Timestamp }[]; // Allow both for server/client
  vipStatus: 'none' | 'pending' | 'approved' | 'rejected';
  vipTransactionId?: string;
  vipProofSubmittedAt?: string | Timestamp; // Allow both for server/client
  isAdmin?: boolean;
};

export type GlobalSettings = {
  baseRate: number;
  totalVipSlots: number;
  claimedVipSlots: number;
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
