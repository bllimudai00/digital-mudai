
'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment, collection, getDocs, writeBatch, setDoc, query, where, addDoc, deleteDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task, NewsArticle, GlobalSettings, RoadmapPhase, WhitePaperSection, TelegramUser } from '@/lib/types';
import { createHmac } from 'crypto';

// --- Telegram Auth Verification ---
export async function verifyTelegramAuth(initData: string): Promise<{ user: UserData; isNewUser: boolean } | { error: string }> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error("Telegram Bot Token not found in environment variables.");
        return { error: 'Server configuration error.' };
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const userData = Object.fromEntries(urlParams.entries());
    
    if (!hash) return { error: 'Invalid authentication data: No hash.' };

    const dataCheckString = Object.keys(userData)
        .filter((key) => key !== 'hash')
        .sort()
        .map((key) => `${key}=${userData[key]}`)
        .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
        return { error: 'Authentication failed: Invalid hash.' };
    }
    
    const tgUser: TelegramUser = JSON.parse(userData.user);

    const userRef = doc(db, 'users', tgUser.id.toString());
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const user = serializeFirestoreTimestamps({ id: userSnap.id, ...userSnap.data() }) as UserData;
        return { user, isNewUser: false };
    } else {
        // Create new user
        const settings = await getGlobalSettings();
        const referralCode = `PARI${tgUser.id.toString().slice(-4)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const newUser: UserData = {
            id: tgUser.id.toString(),
            pariBalance: 10,
            baseRate: settings?.baseRate || 10.00,
            referrals: [],
            tasks: [],
            vip: false,
            referralCode,
            name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
            username: tgUser.username,
            email: '', // No email from telegram
            createdAt: new Date().toISOString(),
            sessionEndTime: null,
            history: [],
            vipStatus: 'none',
            isAdmin: false, // Default user is not admin
            referralEarnings: 0
        };

        await setDoc(userRef, {
            ...newUser,
            createdAt: serverTimestamp(),
        });
        
        return { user: newUser, isNewUser: true };
    }
}


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
            vipWalletAddress: '0x10FA107AF74434313841FB36F4547ac',
            vipPrice: 5,
            telegramChannelUrl: 'https://t.me/PariNetwork',
            telegramGroupUrl: 'https://t.me/PariNetworkGroup',
            xUrl: 'https://x.com/PariNetwork',
            supportEmail: 'seemarajput8540@gmail.com',
            supportTelegramUsername: 'PariSupport'
        });
        console.log("Initial global settings seeded.");
    }
}


export async function getInitialUserData(userId: string) {
    await seedInitialData();
    const user = await getUserData(userId);
    const referrals = await getReferrals(user?.referrals || []);
    const tasks = await getTasks();
    const news = await getNews();
    const settings = await getGlobalSettings();
    
    let finalUser = user;
    if (user && settings) {
        // Ensure user's baseRate is synced with global settings
        if (user.baseRate !== settings.baseRate) {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { baseRate: settings.baseRate });
            finalUser = { ...user, baseRate: settings.baseRate };
        }
    }

    return { user: finalUser, referrals, tasks, news, settings };
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


export async function getUserData(userId: string): Promise<UserData | null> {
    if (!userId) return null;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        let userData = serializeFirestoreTimestamps(data) as UserData;
        
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
       return null;
    }
}


export async function getReferrals(referralIds: string[]): Promise<Referral[]> {
    if (!referralIds || referralIds.length === 0) return [];

    const referrals: Referral[] = [];
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
        await seedInitialData();
        const tasksCollection = collection(db, 'tasks');
        const q = query(tasksCollection, orderBy('order'));
        const tasksSnapshot = await getDocs(q);
        if (tasksSnapshot.empty) {
            console.log("No tasks found, maybe they haven't been created yet.");
            return [];
        }
        const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task);
        return tasksList;
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
        let taskTitle = "";

        const error = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const taskDoc = await transaction.get(taskRef);

            if (!userDoc.exists() || !taskDoc.exists()) {
                return "User or Task not found";
            }

            const userData = userDoc.data() as UserData;
            const taskData = taskDoc.data() as Task;
            reward = taskData.reward;
            taskTitle = taskData.title;

            if (userData.tasks.includes(taskId)) {
                return "Task already completed.";
            }

            if (taskData.type === 'referral_milestone') {
                const referralCount = userData.referrals?.length || 0;
                if (referralCount < (taskData.requiredCount || 0)) {
                    return "Referral requirement not met.";
                }
            }
            
            const newHistoryItem = {
                type: 'task',
                title: taskTitle,
                amount: reward,
                claimedAt: new Date().toISOString()
            };

            transaction.update(userRef, {
                pariBalance: increment(reward),
                tasks: arrayUnion(taskId),
                history: arrayUnion(newHistoryItem)
            });
            
            return null;
        });

        if (error) {
            return { success: false, error: error };
        }

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

            const baseReward = baseRate * 4;
            const finalReward = userData.vip ? baseReward * 2 : baseReward;
            rewardAmount = finalReward;

            const newHistoryItem = {
                type: 'mining',
                title: 'Mining Session Reward',
                amount: finalReward,
                claimedAt: new Date().toISOString(),
            };

            transaction.update(userRef, {
                pariBalance: increment(finalReward),
                sessionEndTime: null,
                history: arrayUnion(newHistoryItem)
            });

            if (userData.referredBy) {
                const referrerRefL1 = doc(db, "users", userData.referredBy);
                const referrerL1Doc = await transaction.get(referrerRefL1);
                
                if (referrerL1Doc.exists()) {
                    const commissionAmountL1 = finalReward * 0.10;
                    transaction.update(referrerRefL1, {
                        pariBalance: increment(commissionAmountL1),
                        referralEarnings: increment(commissionAmountL1)
                    });

                    const referrerL1Data = referrerL1Doc.data() as UserData;
                    if (referrerL1Data.referredBy) {
                        const referrerRefL2 = doc(db, "users", referrerL1Data.referredBy);
                        const referrerL2Doc = await transaction.get(referrerRefL2);
                        if(referrerL2Doc.exists()) {
                            const commissionAmountL2 = finalReward * 0.05;
                            transaction.update(referrerRefL2, {
                                pariBalance: increment(commissionAmountL2),
                                referralEarnings: increment(commissionAmountL2)
                            });
                        }
                    }
                }
            }

            return null;
        });

        if (error) {
             return { success: false, error: error };
        }

        revalidatePath('/');
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
        revalidatePath('/'); 
        revalidatePath('/profile');
        
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
    } else { 
         await updateDoc(userRef, { vipStatus: status });
    }

    revalidatePath('/admin');
    revalidatePath('/vip');
    revalidatePath('/'); 
    
    return { success: true };
}


export async function getNews(): Promise<NewsArticle[]> {
    try {
        await seedInitialData();
        const newsCollection = collection(db, 'news');
        const newsSnapshot = await getDocs(newsCollection);
        if (newsSnapshot.empty) {
            console.log("No news found.");
            return [];
        }
        const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NewsArticle);
        
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
            date: new Date(article.date).toISOString()
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

    return users.sort((a, b) => (b.referrals?.length || 0) - (a.referrals?.length || 0));
}

export async function updateUserFromAdmin(userId: string, dataToUpdate: Partial<UserData>) {
    'use server';
    const userRef = doc(db, 'users', userId);

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
        revalidatePath('/admin');
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
        revalidatePath('/admin');
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
        revalidatePath('/admin');
        revalidatePath('/tasks');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Roadmap and White Paper ---
export async function getRoadmap(): Promise<RoadmapPhase[]> {
    const roadmapRef = collection(db, 'roadmap');
    const q = query(roadmapRef, orderBy('order'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoadmapPhase));
}

export async function saveRoadmap(phases: RoadmapPhase[]) {
    'use server';
    try {
        const batch = writeBatch(db);
        phases.forEach(phase => {
            const { id, ...data } = phase;
            const docRef = doc(db, 'roadmap', id || doc(collection(db, 'roadmap')).id);
            batch.set(docRef, data);
        });
        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/roadmap');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getWhitePaper(): Promise<WhitePaperSection[]> {
    const whitepaperRef = collection(db, 'whitepaper');
    const q = query(whitepaperRef, orderBy('order'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhitePaperSection));
}

export async function saveWhitePaper(sections: WhitePaperSection[]) {
    'use server';
    try {
        const batch = writeBatch(db);
        sections.forEach(section => {
            const { id, ...data } = section;
            const docRef = doc(db, 'whitepaper', id || doc(collection(db, 'whitepaper')).id);
            batch.set(docRef, data);
        });
        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/white-paper');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
