'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task } from '@/lib/types';

// This is a placeholder for a real user ID
const FAKE_USER_ID = 'user_placeholder_id';

export async function getUserData(): Promise<UserData | null> {
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserData;
    } else {
        // Create a dummy user if one doesn't exist
        const newUser: UserData = {
            id: FAKE_USER_ID,
            pariBalance: 1080.00,
            hashPower: 1,
            baseRate: 10.00,
            streak: 16,
            referrals: [],
            tasks: ['task1'],
            vip: false,
            referralCode: 'PARIRBESS8',
            name: 'Balram Singh Rajput',
            email: 'seemarajput8540@gmail.com',
            createdAt: Date.now(),
            sessionEndTime: null,
            miningHistory: [],
        };
        await runTransaction(db, async (transaction) => {
            transaction.set(userRef, newUser);
        });
        return newUser;
    }
}

export async function getReferrals(referralIds: string[]): Promise<Referral[]> {
    if (!referralIds || referralIds.length === 0) return [];
    // In a real app, fetch referral data from Firestore
    return [
        { id: '1', name: 'Friend 1', avatar: 'https://picsum.photos/seed/friend1/40' },
        { id: '2', name: 'Friend 2', avatar: 'https://picsum.photos/seed/friend2/40' },
    ];
}

export async function getTasks(taskIds: string[]): Promise<Task[]> {
    // In a real app, fetch task data from Firestore
    return [
        { id: 'task1', title: 'Join our official Telegram Channel', reward: 10 },
        { id: 'task2', title: 'First Referral Bonus', reward: 50 },
    ];
}


export async function startMiningSession(userId: string) {
  'use server';
  const userRef = doc(db, 'users', userId);
  const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
  const sessionEndTime = Date.now() + FOUR_HOURS_IN_MS;

  try {
    await updateDoc(userRef, {
      sessionEndTime: sessionEndTime,
    });
    revalidatePath('/');
    return { success: true, sessionEndTime };
  } catch (error) {
    console.error('Error starting mining session:', error);
    return { success: false, error: 'Failed to start mining session.' };
  }
}

export async function claimReward(userId: string) {
    'use server';
    const userRef = doc(db, 'users', userId);
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        const userData = userDoc.data() as UserData;

        if (!userData.sessionEndTime || userData.sessionEndTime > Date.now()) {
            return { success: false, error: 'Mining session not yet complete.' };
        }

        // Calculate reward (using existing logic)
        const reward = 40.0; // This should be calculated based on rate, power, etc.

        await updateDoc(userRef, {
            pariBalance: increment(reward),
            sessionEndTime: null, // Reset session
            miningHistory: arrayUnion({
                amount: reward,
                claimedAt: Date.now(),
            }),
        });

        revalidatePath('/');
        revalidatePath('/mining-history');
        return { success: true, reward };
    } catch (error) {
        console.error('Error claiming reward:', error);
        return { success: false, error: 'Failed to claim reward.' };
    }
}


export async function submitVipProof(userId: string, transactionId: string) {
    const proofRef = doc(db, 'vip_proofs', `${userId}_${Date.now()}`);
    try {
        await runTransaction(db, async (transaction) => {
            transaction.set(proofRef, {
                userId,
                transactionId,
                submittedAt: new Date(),
                status: 'pending'
            });
        });
        revalidatePath('/vip');
        return { success: true, message: "Proof submitted successfully!" };
    } catch (error) {
        console.error("Error submitting VIP proof: ", error);
        return { success: false, error: "Failed to submit proof." };
    }
}
