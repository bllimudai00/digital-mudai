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
  createdAt: number;
  sessionEndTime: number | null;
  miningHistory: { amount: number; claimedAt: number }[];
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
};
