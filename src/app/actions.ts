'use server';

import type { UserData, Referral, Task } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// --- Placeholder Data ---
let FAKE_USER_ID = 'user_placeholder_id';

let fakeUser: UserData = {
    id: FAKE_USER_ID,
    pariBalance: 1080.00,
    hashPower: 1,
    baseRate: 10.00,
    streak: 16,
    referrals: [],
    tasks: [],
    vip: false,
    referralCode: 'PARIRBESS8',
    name: 'Balram Singh Rajput',
    email: 'seemarajput8540@gmail.com',
    createdAt: Date.now(),
    sessionEndTime: null,
    miningHistory: [],
    vipStatus: 'none',
};

let fakeTasks: Task[] = [
    { id: 'task_1', title: "Join our official Telegram Channel", reward: 10, order: 1, type: 'external' },
    { id: 'task_2', title: "First Referral Bonus", reward: 50, order: 2, type: 'referral_milestone', requiredCount: 1 },
    { id: 'task_3', title: "Join our official Telegram group", reward: 10, order: 3, type: 'external' },
    { id: 'task_4', title: "Referral Milestone", reward: 20, order: 4, type: 'referral_milestone', requiredCount: 50 },
    { id: 'task_5', title: "Follow on X", reward: 10, order: 5, type: 'external' },
    { id: 'task_6', title: "Referral Milestone", reward: 100, order: 6, type: 'referral_milestone', requiredCount: 500 },
    { id: 'task_7', title: "Referral Milestone", reward: 200, order: 7, type: 'referral_milestone', requiredCount: 1000 },
    { id: 'task_8', title: "Referral Milestone", reward: 1000, order: 8, type: 'referral_milestone', requiredCount: 5000 },
];


// --- Mock Actions ---

export async function getInitialUserData() {
    const user = await getUserData();
    const referrals = await getReferrals(user?.referrals || []);
    const tasks = await getTasks();
    return { user, referrals, tasks };
}


export async function getUserData(): Promise<UserData | null> {
    return JSON.parse(JSON.stringify(fakeUser));
}

export async function getReferrals(referralIds: string[]): Promise<Referral[]> {
    if (!referralIds || referralIds.length === 0) return [];
    return referralIds.map((id, index) => ({
        id: id,
        name: `Friend ${index + 1}`,
        avatar: `https://picsum.photos/seed/friend${index + 1}/40`
    }));
}


export async function getTasks(): Promise<Task[]> {
    return JSON.parse(JSON.stringify(fakeTasks));
}

export async function claimTaskReward(userId: string, taskId: string) {
    'use server';
    const task = fakeTasks.find(t => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    if (fakeUser.tasks.includes(taskId)) {
        return { success: false, error: 'Task already completed.' };
    }

    if (task.type === 'referral_milestone') {
        const referralCount = fakeUser.referrals?.length || 0;
        if (referralCount < (task.requiredCount || 0)) {
            return { success: false, error: 'Referral requirement not met.' };
        }
    }

    fakeUser.pariBalance += task.reward;
    fakeUser.tasks.push(taskId);

    revalidatePath('/tasks');
    revalidatePath('/');
    return { success: true, reward: task.reward };
}


export async function startMiningSession(userId: string) {
  'use server';
  const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
  const sessionEndTime = Date.now() + FOUR_HOURS_IN_MS;
  fakeUser.sessionEndTime = sessionEndTime;

  revalidatePath('/');
  return { success: true, sessionEndTime };
}

export async function claimReward(userId: string) {
    'use server';
    if (!fakeUser.sessionEndTime || fakeUser.sessionEndTime > Date.now()) {
        return { success: false, error: 'Mining session not yet complete.' };
    }

    const reward = 40.0;
    fakeUser.pariBalance += reward;
    fakeUser.sessionEndTime = null;
    fakeUser.miningHistory.push({
        amount: reward,
        claimedAt: Date.now(),
    });

    revalidatePath('/');
    revalidatePath('/mining-history');
    return { success: true, reward };
}


export async function submitVipProof(userId: string, transactionId: string) {
    fakeUser.vipStatus = 'pending';
    fakeUser.vipTransactionId = transactionId;
    fakeUser.vipProofSubmittedAt = new Date();

    revalidatePath('/vip');
    return { success: true, message: "Proof submitted successfully!" };
}
