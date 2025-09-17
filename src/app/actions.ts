'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment, collection, getDocs, writeBatch, setDoc, query, where, addDoc, deleteDoc, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task, NewsArticle, GlobalSettings, LeaderboardEntry } from '@/lib/types';

// This is a placeholder for a real user ID
const FAKE_USER_ID = 'user_placeholder_id';

// --- Firebase Actions ---

export async function seedInitialData() {
    // Seed tasks
    const tasksRef = collection(db, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    if (tasksSnapshot.empty) {
        console.log("No tasks found, seeding initial tasks...");
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
        const batch = writeBatch(db);
        defaultTasks.forEach(task => {
            const taskRef = doc(tasksRef, task.id);
            batch.set(taskRef, task);
        });
        await batch.commit();
        console.log("Initial tasks seeded.");
    }
    
    // Seed global settings
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnapshot = await getDoc(settingsRef);
    if (!settingsSnapshot.exists()) {
        await setDoc(settingsRef, { 
            baseRate: 10.00,
            totalVipSlots: 20000,
            claimedVipSlots: 1500,
        });
        console.log("Initial global settings seeded.");
    }
     // Seed leaderboard
    const leaderboardRef = collection(db, 'leaderboard');
    const leaderboardSnapshot = await getDocs(leaderboardRef);
    if (leaderboardSnapshot.empty) {
        console.log("Seeding initial leaderboard...");
        const initialLeaderboard = [
            { rank: 1, userId: "top_user_1", name: "Alex", referralCount: 1250, prize: 1000, type: "manual" },
            { rank: 2, userId: "top_user_2", name: "Maria", referralCount: 980, prize: 500, type: "manual" },
            { rank: 3, userId: "top_user_3", name: "John", referralCount: 750, prize: 200, type: "manual" },
        ];
        const batch = writeBatch(db);
        initialLeaderboard.forEach(entry => {
            const entryRef = doc(leaderboardRef, `rank_${entry.rank}`);
            batch.set(entryRef, entry);
        });
        await batch.commit();
        console.log("Initial leaderboard seeded.");
    }
}


export async function getInitialUserData() {
    await seedInitialData();
    const user = await getUserData();
    const referrals = await getReferrals(user?.referrals || []);
    const tasks = await getTasks();
    const news = await getNews();
    const settings = await getGlobalSettings();
    const leaderboard = await getLeaderboard();
    
    let finalUser = user;
    if (user && settings) {
        // Ensure user's baseRate is synced with global settings
        if (user.baseRate !== settings.baseRate) {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { baseRate: settings.baseRate });
            finalUser = { ...user, baseRate: settings.baseRate };
        }
    }

    return { user: finalUser, referrals, tasks, news, settings, leaderboard };
}

function serializeFirestoreTimestamps(data: { [key: string]: any }): { [key: string]: any } {
    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value instanceof Timestamp) {
                serializedData[key] = value.toDate().toISOString();
            } else if (value && typeof value.toDate === 'function') { // Fallback for other timestamp-like objects
                serializedData[key] = value.toDate().toISOString();
            } else if (Array.isArray(value)) {
                serializedData[key] = value.map(item =>
                    (item && typeof item === 'object' && !Array.isArray(item))
                        ? serializeFirestoreTimestamps(item)
                        : item
                );
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                serializedData[key] = serializeFirestoreTimestamps(value);
            } else {
                serializedData[key] = value;
            }
        }
    }
    return serializedData;
}


export async function getUserData(): Promise<UserData | null> {
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        let userData = serializeFirestoreTimestamps(data) as UserData;
        
        // Sync vip status
        let needsUpdate = false;
        const updates: Partial<UserData> = {};

        if (userData.vipStatus === 'approved' && !userData.vip) {
            updates.vip = true;
needsUpdate = true;
        } else if (userData.vipStatus !== 'approved' && userData.vip) {
            updates.vip = false;
            needsUpdate = true;
        }
        
        // Sync baseRate with global settings
        const settings = await getGlobalSettings();
        if (settings && userData.baseRate !== settings.baseRate) {
            updates.baseRate = settings.baseRate;
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            await updateDoc(userRef, updates);
            userData = { ...userData, ...updates };
        }

        return { ...userData, id: userSnap.id };

    } else {
        // If user doesn't exist, create a new one with default values
        console.log("User not found, creating a new one...");
        const settings = await getGlobalSettings();
        const newUser: Omit<UserData, 'id'> = {
            pariBalance: 10,
            baseRate: settings?.baseRate || 10.00,
            referrals: [],
            tasks: [],
            vip: false,
            referralCode: 'PARIRBESS8',
            name: 'Balram Singh Rajput',
            email: 'seemarajput8540@gmail.com',
            createdAt: new Date().toISOString(),
            sessionEndTime: null,
            miningHistory: [],
            vipStatus: 'none',
            isAdmin: true,
            referredBy: 'super_referrer_placeholder_id'
        };

        await setDoc(userRef, {
            ...newUser,
            createdAt: serverTimestamp(),
        });
        await seedInitialData(); 
        console.log("New user and initial data seeded successfully.");
        
        // After setting, get the data again to have the server timestamp
        const newUserSnap = await getDoc(userRef);
        if (newUserSnap.exists()) {
             const newUserData = newUserSnap.data();
             return serializeFirestoreTimestamps({id: newUserSnap.id, ...newUserData}) as UserData;
        }
       return null;
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
        const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task);
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
            
            const settings = await getGlobalSettings();
            const baseRate = settings?.baseRate || 10.0;

            // Calculate reward
            const baseReward = baseRate * 4; // 4 hours session
            const finalReward = userData.vip ? baseReward * 2 : baseReward;
            rewardAmount = finalReward;

            // Update user's balance and history
            const newHistoryItem = {
                amount: finalReward,
                claimedAt: new Date().toISOString(),
            };

            transaction.update(userRef, {
                pariBalance: increment(finalReward),
                sessionEndTime: null,
                miningHistory: arrayUnion(newHistoryItem)
            });

            // Handle referral commission for Level 1
            if (userData.referredBy) {
                const referrerRefL1 = doc(db, "users", userData.referredBy);
                const referrerL1Doc = await transaction.get(referrerRefL1);
                
                if (referrerL1Doc.exists()) {
                    const commissionAmountL1 = finalReward * 0.10; // 10% commission
                    transaction.update(referrerRefL1, {
                        pariBalance: increment(commissionAmountL1)
                    });

                    // Handle referral commission for Level 2
                    const referrerL1Data = referrerL1Doc.data() as UserData;
                    if (referrerL1Data.referredBy) {
                        const referrerRefL2 = doc(db, "users", referrerL1Data.referredBy);
                        const referrerL2Doc = await transaction.get(referrerRefL2);
                        if(referrerL2Doc.exists()) {
                            const commissionAmountL2 = finalReward * 0.05; // 5% commission
                            transaction.update(referrerRefL2, {
                                pariBalance: increment(commissionAmountL2)
                            });
                        }
                    }
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
        vipProofSubmittedAt: serverTimestamp(),
    });

    revalidatePath('/vip');
    revalidatePath('/admin');
    return { success: true, message: "Proof submitted successfully!" };
}


// --- Admin Actions ---

export async function getGlobalSettings(): Promise<GlobalSettings | null> {
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
        return settingsSnap.data() as GlobalSettings;
    }
    return null;
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>) {
    'use server';
    const settingsRef = doc(db, 'settings', 'global');
    try {
        await updateDoc(settingsRef, settings);
        revalidatePath('/admin');
        revalidatePath('/'); // Revalidate home page to reflect new rate
        return { success: true };
    } catch (error: any) {
        console.error("Error updating global settings:", error);
        return { success: false, error: error.message };
    }
}

export async function getVipRequests(): Promise<UserData[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('vipStatus', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const docId = doc.id;
        const serializedData = serializeFirestoreTimestamps({ id: docId, ...data });
        return serializedData as UserData;
    });

    return requests;
}


export async function updateVipStatus(userId: string, status: 'approved' | 'rejected') {
    const userRef = doc(db, 'users', userId);
    const settingsRef = doc(db, 'settings', 'global');
    
    if (status === 'approved') {
        try {
            await runTransaction(db, async (transaction) => {
                const settingsDoc = await transaction.get(settingsRef);
                if (!settingsDoc.exists()) {
                    throw "Global settings not found!";
                }
                
                transaction.update(userRef, { vipStatus: 'approved' });
                transaction.update(settingsRef, { claimedVipSlots: increment(1) });
            });
        } catch (e: any) {
            console.error("VIP approval transaction failed: ", e);
            return { success: false, error: e.message || 'An unexpected error occurred.' };
        }
    } else { // For rejected status
         await updateDoc(userRef, { vipStatus: status });
    }

    revalidatePath('/admin');
    revalidatePath('/vip');
    revalidatePath('/'); // For progress bar on mining page
    
    return { success: true };
}


export async function getNews(): Promise<NewsArticle[]> {
    try {
        const newsCollection = collection(db, 'news');
        const newsSnapshot = await getDocs(newsCollection);
        if (newsSnapshot.empty) {
            console.log("No news found.");
            return [];
        }
        const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NewsArticle);
        
        // Sort by priority then date
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        return newsList.sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 4;
            const priorityB = priorityOrder[b.priority] || 4;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
}

export async function addNews(article: Omit<NewsArticle, 'id' | 'date'> & { date: string }) {
    try {
        const newsCollection = collection(db, 'news');
        const docRef = await addDoc(newsCollection, {
            ...article,
            date: new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        });
        revalidatePath('/news');
        revalidatePath('/admin');
        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Error adding news: ", error);
        return { success: false, error: error.message };
    }
}

export async function deleteNews(articleId: string) {
    try {
        const newsRef = doc(db, 'news', articleId);
        await deleteDoc(newsRef);
        revalidatePath('/news');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting news: ", error);
        return { success: false, error: error.message };
    }
}

export async function getUsers(): Promise<UserData[]> {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const docId = doc.id;
        const serializedData = serializeFirestoreTimestamps({ id: docId, ...data });
        return serializedData as UserData;
    });

    // Sort by referral count descending for leaderboard purposes
    return users.sort((a, b) => (b.referrals?.length || 0) - (a.referrals?.length || 0));
}

export async function updateUserFromAdmin(userId: string, dataToUpdate: Partial<UserData>) {
    'use server';
    const userRef = doc(db, 'users', userId);

    // Sanitize data: remove id and any other non-updatable fields
    const { id, ...updateData } = dataToUpdate; 

    try {
        await updateDoc(userRef, updateData as any);
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteUser(userId: string) {
    'use server';
    if (!userId) {
        return { success: false, error: "User ID is required." };
    }
    try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message };
    }
}

export async function addTask(taskData: Partial<Task>) {
    'use server';
    try {
        const { id, ...data } = taskData;
        const tasksCollection = collection(db, 'tasks');
        const docRef = await addDoc(tasksCollection, data);
        revalidatePath('/admin/tasks');
        revalidatePath('/tasks');
        return { success: true, id: docRef.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTask(taskId: string, taskData: Partial<Task>) {
    'use server';
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const { id, ...data } = taskData;
        await updateDoc(taskRef, data);
        revalidatePath('/admin/tasks');
        revalidatePath('/tasks');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteTask(taskId: string) {
    'use server';
    try {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);
        revalidatePath('/admin/tasks');
        revalidatePath('/tasks');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        // 1. Fetch manually set top 3
        const leaderboardRef = collection(db, 'leaderboard');
        const manualQuery = query(leaderboardRef, where('type', '==', 'manual'), orderBy('rank'), limit(3));
        const manualSnapshot = await getDocs(manualQuery);
        const manualEntries = manualSnapshot.docs.map(doc => doc.data() as LeaderboardEntry);
        const manualUserIds = manualEntries.map(e => e.userId);

        // 2. Fetch top 7 genuine users, excluding the manual ones
        const allUsers = await getUsers();
        const genuineUsers = allUsers
            .filter(user => !manualUserIds.includes(user.id))
            .slice(0, 7);

        const genuineEntries: LeaderboardEntry[] = genuineUsers.map((user, index) => ({
            rank: 4 + index,
            userId: user.id,
            name: user.name,
            referralCount: user.referrals?.length || 0,
            prize: 100 - (index * 10), // Example prize structure
            type: 'genuine'
        }));
        
        // 3. Combine and sort
        const finalLeaderboard = [...manualEntries, ...genuineEntries];
        return finalLeaderboard.sort((a, b) => a.rank - b.rank);

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
}


export async function updateLeaderboardEntry(entry: LeaderboardEntry) {
    'use server';
    try {
        const docRef = doc(db, 'leaderboard', `rank_${entry.rank}`);
        await setDoc(docRef, { ...entry, type: 'manual' });
        revalidatePath('/admin');
        revalidatePath('/refer');
        revalidatePath('/referral-contest');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
