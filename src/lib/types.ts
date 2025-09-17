import { Timestamp } from "firebase/firestore";

export type Transaction = {
    type: 'mining' | 'task';
    title: string;
    amount: number;
    claimedAt: string | Timestamp;
};

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
  username?: string;
  email: string;
  createdAt: string | Timestamp; // Allow both for server/client
  sessionEndTime: number | null;
  history: Transaction[]; 
  vipStatus: 'none' | 'pending' | 'approved' | 'rejected';
  vipTransactionId?: string;
  vipProofSubmittedAt?: string | Timestamp; // Allow both for server/client
  isAdmin?: boolean;
  referralEarnings?: number;
};

export type GlobalSettings = {
  baseRate: number;
  totalVipSlots: number;
  claimedVipSlots: number;
  vipWalletAddress?: string;
  vipPrice?: number;
  telegramChannelUrl?: string;
  telegramGroupUrl?: string;
  xUrl?: string;
  supportEmail?: string;
  supportTelegramUsername?: string;
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

export type NewsArticle = {
  id: string;
  title: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  content: string;
};

export type LeaderboardEntry = {
    rank: number;
    userId: string;
    name: string;
    referralCount: number;
    prize: number;
    type: 'manual' | 'genuine';
};

export type RoadmapItem = {
    text: string;
};

export type RoadmapPhase = {
    id: string;
    order: number;
    phase: string;
    title: string;
    status: 'Completed' | 'In Progress' | 'Upcoming';
    items: RoadmapItem[];
};

export type WhitePaperSection = {
    id: string;
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
};

    