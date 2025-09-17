'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment, collection, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task } from '@/lib/types';

// This is a placeholder for a real user ID
const FAKE_USER_ID = 'user_placeholder_id';


// --- Firebase Actions ---

export async function getInitialUserData() {
    const user = await getUserData();
    const referrals = await getReferrals(user?.referrals || []);
    const tasks = await getTasks();
    return { user, referrals, tasks };
}

export async function getUserData(): Promise<UserData | null> {
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data() as UserData;
        // Sync vip status
        if (userData.vipStatus === 'approved' && !userData.vip) {
            await updateDoc(userRef, { vip: true });
            userData.vip = true;
        } else if (userData.vipStatus !== 'approved' && userData.vip) {
            await updateDoc(userRef, { vip: false });
            userData.vip = false;
        }
        return userData;
    } else {
        // If user doesn't exist, create a new one with default values
        console.log("User not found, creating a new one...");
        const defaultTasks = [
            { id: 'task_1', title: "Join our official Telegram Channel", reward: 10, order: 1, type: 'external', url: 'https://t.me/PariNetwork' },
            { id: 'task_2', title: "First Referral Bonus", reward: 50, order: 2, type: 'referral_milestone', requiredCount: 1 },
            { id: 'task_3', title: "Join our official Telegram group", reward: 10, order: 3, type: 'external', url: 'https://t.me/PariNetworkGroup' },
            { id: 'task_4', title: "Referral Milestone", reward: 20, order: 4, type: 'referral_milestone', requiredCount: 50 },
            { id: 'task_5', title: "Follow on X", reward: 10, order: 5, type: 'external', url: 'https://x.com/PariNetwork' },
            { id: 'task_6', title: "Referral Milestone", reward: 100, order: 6, type: 'referral_milestone', requiredCount: 500 },
            { id: 'task_7', title: "Referral Milestone", reward: 200, order: 7, type: 'referral_milestone', requiredCount: 1000 },
            { id: 'task_8', title: "Referral Milestone", reward: 1000, order: 8, type: 'referral_milestone', requiredCount: 5000 },
        ];
        
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

        // Create user document and tasks collection in a batch
        const batch = writeBatch(db);
        batch.set(userRef, newUser);

        const tasksRef = collection(db, 'tasks');
        defaultTasks.forEach(task => {
            const taskRef = doc(tasksRef, task.id);
            batch.set(taskRef, task);
        });

        await batch.commit();
        console.log("New user and tasks created successfully.");
        return newUser;
    }
}


export async function getReferrals(referralIds: string[]): Promise<Referral[]> {
    if (!referralIds || referralIds.length === 0) return [];

    const referrals: Referral[] = [];
    // To avoid fetching too many documents at once, let's process in chunks or limit.
    // For this example, we'll fetch them one by one, but in a real app, batching is better.
    for (const id of referralIds) {
        try {
            const userRef = doc(db, 'users', id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                referrals.push({
                    id: id,
                    name: userData.name || `Friend ${id.substring(0, 4)}`,
                    avatar: `https://picsum.photos/seed/${id}/40`
                });
            }
        } catch (error) {
            console.error(`Failed to fetch referral with id: ${id}`, error);
        }
    }
    return referrals;
}

export async function getTasks(): Promise<Task[]> {
    try {
        const tasksCollection = collection(db, 'tasks');
        const tasksSnapshot = await getDocs(tasksCollection);
        if (tasksSnapshot.empty) {
            console.log("No tasks found, maybe they haven't been created yet.");
            return [];
        }
        const tasksList = tasksSnapshot.docs.map(doc => doc.data() as Task);
        return tasksList.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

export async function claimTaskReward(userId: string, taskId: string) {
    'use server';
    const userRef = doc(db, 'users', userId);
    const taskRef = doc(db, 'tasks', taskId);

    try {
        let reward = 0;

        const error = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const taskDoc = await transaction.get(taskRef);

            if (!userDoc.exists() || !taskDoc.exists()) {
                return "User or Task not found";
            }

            const userData = userDoc.data() as UserData;
            const taskData = taskDoc.data() as Task;
            reward = taskData.reward;

            if (userData.tasks.includes(taskId)) {
                return "Task already completed.";
            }

            if (taskData.type === 'referral_milestone') {
                const referralCount = userData.referrals?.length || 0;
                if (referralCount < (taskData.requiredCount || 0)) {
                    return "Referral requirement not met.";
                }
            }
            
            // If all checks pass, update user document
            transaction.update(userRef, {
                pariBalance: increment(taskData.reward),
                tasks: arrayUnion(taskId)
            });
            
            return null; // No error
        });

        if (error) {
            return { success: false, error: error };
        }

        revalidatePath('/tasks');
        revalidatePath('/');
        return { success: true, reward };

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
}


export async function startMiningSession(userId: string) {
  'use server';
  const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
  const sessionEndTime = Date.now() + FOUR_HOURS_IN_MS;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { sessionEndTime });

  revalidatePath('/');
  return { success: true, sessionEndTime };
}

export async function claimReward(userId: string) {
    'use server';
    const userRef = doc(db, 'users', userId);
    
    try {
        let rewardAmount = 0;
        const error = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                return "User not found.";
            }

            const userData = userDoc.data() as UserData;
            if (!userData.sessionEndTime || userData.sessionEndTime > Date.now()) {
                return "Mining session not yet complete.";
            }

            // Calculate reward
            const baseReward = 40.0;
            const finalReward = userData.vip ? baseReward * 2 : baseReward;
            rewardAmount = finalReward;

            // Update user's balance and history
            const newHistoryItem = {
                amount: finalReward,
                claimedAt: Date.now(),
            };

            transaction.update(userRef, {
                pariBalance: increment(finalReward),
                sessionEndTime: null,
                miningHistory: arrayUnion(newHistoryItem)
            });

            // Handle referral commission for Level 1
            if (userData.referredBy) {
                const referrerRef = doc(db, "users", userData.referredBy);
                const referrerDoc = await transaction.get(referrerRef);
                if (referrerDoc.exists()) {
                    const commissionAmount = finalReward * 0.10; // 10% commission
                    transaction.update(referrerRef, {
                        pariBalance: increment(commissionAmount)
                    });
                }
            }

            return null; // No error
        });

        if (error) {
             return { success: false, error: error };
        }

        revalidatePath('/');
        revalidatePath('/mining-history');
        return { success: true, reward: rewardAmount };

    } catch (e: any) {
        return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
}


export async function submitVipProof(userId: string, transactionId: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        vipStatus: 'pending',
        vipTransactionId: transactionId,
        vipProofSubmittedAt: new Date(),
    });

    revalidatePath('/vip');
    return { success: true, message: "Proof submitted successfully!" };
}
