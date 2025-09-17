'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment, collection, getDocs, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task } from '@/lib/types';

// This is a placeholder for a real user ID
const FAKE_USER_ID = 'user_placeholder_id';

// Consolidated function to get all user-related data
export async function getInitialUserData() {
    const user = await getUserData();
    if (!user) return null;

    const referrals = await getReferrals(user.referrals || []);
    const tasks = await getTasks();

    return { user, referrals, tasks };
}


export async function getUserData(): Promise<UserData | null> {
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserData;
    } else {
        console.log("No such user! Creating one.");
        // Create a dummy user if one doesn't exist
        const newUser: UserData = {
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
        await runTransaction(db, async (transaction) => {
            transaction.set(userRef, newUser);
        });
        // Seed tasks if they don't exist
        await seedTasks();
        return newUser;
    }
}

export async function getReferrals(referralIds: string[]): Promise<Referral[]> {
    if (!referralIds || referralIds.length === 0) return [];
    // In a real app, fetch referral data from Firestore for each ID
    // For now, returning placeholder data
    return referralIds.map((id, index) => ({
        id: id,
        name: `Friend ${index + 1}`,
        avatar: `https://picsum.photos/seed/friend${index + 1}/40`
    }));
}


export async function getTasks(): Promise<Task[]> {
    const tasksCollection = collection(db, 'tasks');
    const taskSnapshot = await getDocs(tasksCollection);
    if (taskSnapshot.empty) {
        return await seedTasks();
    }
    const tasks: Task[] = [];
    taskSnapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks.sort((a, b) => a.order - b.order);
}

// Function to seed initial tasks into Firestore
async function seedTasks() {
    const tasksCollection = collection(db, 'tasks');
    const batch = writeBatch(db);
    const tasksToSeed: Omit<Task, 'id'>[] = [
        { title: "Join our official Telegram Channel", reward: 10, order: 1, type: 'external' },
        { title: "First Referral Bonus", reward: 50, order: 2, type: 'referral_milestone', requiredCount: 1 },
        { title: "Join our official Telegram group", reward: 10, order: 3, type: 'external' },
        { title: "Referral Milestone", reward: 20, order: 4, type: 'referral_milestone', requiredCount: 50 },
        { title: "Follow on X", reward: 10, order: 5, type: 'external' },
        { title: "Referral Milestone", reward: 100, order: 6, type: 'referral_milestone', requiredCount: 500 },
        { title: "Referral Milestone", reward: 200, order: 7, type: 'referral_milestone', requiredCount: 1000 },
        { title: "Referral Milestone", reward: 1000, order: 8, type: 'referral_milestone', requiredCount: 5000 },
    ];

    const seededTasks: Task[] = [];
    tasksToSeed.forEach((task, index) => {
        const docRef = doc(tasksCollection, `task_${index + 1}`);
        batch.set(docRef, task);
        seededTasks.push({ id: `task_${index + 1}`, ...task });
    });

    await batch.commit();
    console.log('Tasks have been seeded to Firestore.');
    return seededTasks.sort((a, b) => a.order - b.order);
}


export async function claimTaskReward(userId: string, taskId: string) {
    'use server';
    const userRef = doc(db, 'users', userId);
    const taskRef = doc(db, 'tasks', taskId);

    try {
        const [userDoc, taskDoc] = await Promise.all([getDoc(userRef), getDoc(taskRef)]);

        if (!userDoc.exists()) throw new Error('User not found');
        if (!taskDoc.exists()) throw new Error('Task not found');

        const userData = userDoc.data() as UserData;
        const taskData = taskDoc.data() as Task;

        if (userData.tasks.includes(taskId)) {
            return { success: false, error: 'Task already completed.' };
        }

        // For referral tasks, check if the condition is met
        if (taskData.type === 'referral_milestone') {
            const referralCount = userData.referrals?.length || 0;
            if (referralCount < (taskData.requiredCount || 0)) {
                return { success: false, error: 'Referral requirement not met.' };
            }
        }
        
        // For external tasks, we assume completion upon click for this demo.
        // In a real app, this would involve backend verification.

        await updateDoc(userRef, {
            pariBalance: increment(taskData.reward),
            tasks: arrayUnion(taskId)
        });

        revalidatePath('/tasks');
        revalidatePath('/'); // Revalidate home if balance is shown there
        return { success: true, reward: taskData.reward };

    } catch (error: any) {
        console.error('Error claiming task reward:', error);
        return { success: false, error: error.message || 'Failed to claim task reward.' };
    }
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
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, {
            vipStatus: 'pending',
            vipTransactionId: transactionId,
            vipProofSubmittedAt: new Date(),
        });
        revalidatePath('/vip');
        return { success: true, message: "Proof submitted successfully!" };
    } catch (error) {
        console.error("Error submitting VIP proof: ", error);
        return { success: false, error: "Failed to submit proof." };
    }
}
