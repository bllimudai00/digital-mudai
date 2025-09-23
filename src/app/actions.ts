
'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment, collection, getDocs, writeBatch, setDoc, query, where, addDoc, deleteDoc, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task, GlobalSettings, RoadmapPhase, WhitePaperSection, TelegramUser, ContestSettings, ContestEntry } from '@/lib/types';
import { createHmac } from 'crypto';

const ADMIN_USER_IDS = ['987654321', '991619957', '6869453432', '6143578047'];

// --- Telegram Auth Verification ---
export async function verifyTelegramAuth(initData: string): Promise<{ user: UserData; isNewUser: boolean } | { error: string }> {
    const isDevEnv = process.env.NODE_ENV === 'development';
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken && !isDevEnv) {
        console.error("Telegram Bot Token not found in environment variables.");
        return { error: 'Server configuration error.' };
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const userParam = urlParams.get('user');

    if (!userParam) {
        return { error: 'Invalid authentication data: Missing user data.' };
    }
    
    // In dev mode, we might not have a hash, so we can bypass validation.
    // In production, hash is required.
    if (!isDevEnv) {
        if (!hash) {
            return { error: 'Invalid authentication data: Missing hash.' };
        }
        const dataCheckArr = [];
        urlParams.sort(); // Sort parameters alphabetically by key
        for (const [key, value] of urlParams.entries()) {
            if (key !== 'hash') {
                dataCheckArr.push(`${key}=${value}`);
            }
        }
        const dataCheckString = dataCheckArr.join('\n');
        const secretKey = createHmac('sha256', 'WebAppData').update(botToken!).digest();
        const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash !== hash) {
            console.error("Hash validation failed.", { calculatedHash, hash });
            return { error: 'Authentication failed: Invalid hash.' };
        }
    }
    
    const tgUser: TelegramUser = JSON.parse(userParam);
    const userIdStr = tgUser.id.toString();
    const isUserAdmin = ADMIN_USER_IDS.includes(userIdStr);
    const startParam = urlParams.get('start_param');

    const userRef = doc(db, 'users', userIdStr);
    
    try {
        const { user, isNewUser } = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            
            if (userSnap.exists()) {
                // --- EXISTING USER LOGIC ---
                const existingUser = serializeFirestoreTimestamps({ id: userSnap.id, ...userSnap.data() }) as UserData;
                const updates: Partial<UserData> = {};
                let needsUpdate = false;
                
                const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
                const settings = settingsDoc.exists() ? settingsDoc.data() as GlobalSettings : null;

                if (existingUser.isAdmin !== isUserAdmin) {
                    updates.isAdmin = isUserAdmin;
                    needsUpdate = true;
                }
                if (settings && existingUser.baseRate !== settings.baseRate) {
                    updates.baseRate = settings.baseRate;
                    needsUpdate = true;
                }
                if (!existingUser.referralCode) {
                    updates.referralCode = userIdStr;
                    needsUpdate = true;
                }
                 if(existingUser.username !== (tgUser.username || '')) {
                    updates.username = tgUser.username || '';
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    transaction.update(userRef, updates);
                }

                return { user: { ...existingUser, ...updates }, isNewUser: false };
            } else {
                // --- NEW USER CREATION LOGIC ---
                let referrerId: string | null = null;
                let referrerRef: any = null;

                if (startParam) { 
                    const potentialReferrerRefById = doc(db, "users", startParam);
                    const referrerSnapById = await transaction.get(potentialReferrerRefById);

                    if (referrerSnapById.exists()) {
                        referrerId = referrerSnapById.id;
                        referrerRef = potentialReferrerRefById;
                    } else {
                        console.log(`[Referral] No referrer found for ID: ${startParam}`);
                    }
                }
                
                const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
                const settings = settingsDoc.exists() ? settingsDoc.data() as GlobalSettings : null;
                const referralCode = userIdStr;
                
                const newUserDocData: Omit<UserData, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
                    pariBalance: 10,
                    baseRate: settings?.baseRate || 10.00,
                    referrals: [],
                    tasks: [],
                    vip: false,
                    referralCode: referralCode,
                    name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
                    username: tgUser.username || '', 
                    email: '', 
                    createdAt: serverTimestamp(),
                    sessionEndTime: null,
                    history: [],
                    vipStatus: 'none',
                    isAdmin: isUserAdmin,
                    referralEarnings: 0
                };
                
                if (referrerId) {
                    newUserDocData.referredBy = referrerId;
                }
                
                transaction.set(userRef, newUserDocData);

                if (referrerId && referrerRef) {
                    console.log(`[Referral] Updating referrer ${referrerId} with new referral ${userIdStr}`);
                    transaction.update(referrerRef, {
                        referrals: arrayUnion(userIdStr)
                    });
                }
                
                const serializedUser: UserData = {
                    id: userIdStr,
                    pariBalance: newUserDocData.pariBalance,
                    baseRate: newUserDocData.baseRate,
                    referrals: newUserDocData.referrals,
                    tasks: newUserDocData.tasks,
                    vip: newUserDocData.vip,
                    referralCode: newUserDocData.referralCode,
                    name: newUserDocData.name,
                    username: newUserDocData.username,
                    email: newUserDocData.email,
                    createdAt: new Date().toISOString(),
                    sessionEndTime: newUserDocData.sessionEndTime,
                    history: newUserDocData.history,
                    vipStatus: newUserDocData.vipStatus,
                    isAdmin: newUserDocData.isAdmin,
                    referralEarnings: newUserDocData.referralEarnings,
                    ...(newUserDocData.referredBy && { referredBy: newUserDocData.referredBy })
                };
                
                return { user: serializedUser, isNewUser: true };
            }
        });

        return { user, isNewUser };

    } catch (error: any) {
        console.error(`[User Verification Transaction Failed] for user: ${userIdStr}, with startParam: ${startParam}. Error: `, error);
        return { error: `Database transaction error: ${error.message}` };
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

     // Seed contest settings
    const contestRef = doc(db, 'contest', 'settings');
    const contestSnap = await getDoc(contestRef);
    if (!contestSnap.exists()) {
        await setDoc(contestRef, { 
            winners: Array(5).fill({ name: "N/A", referralCount: 0 })
        });
        console.log("Initial contest settings seeded.");
    }
}


export async function getInitialUserData(userId: string) {
    await seedInitialData();
    const user = await getUserData(userId);
    const referrals = await getReferrals(user?.referrals || []);
    const tasks = await getTasks();
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

    return { user: finalUser, referrals, tasks, settings };
}

function serializeFirestoreTimestamps(data: { [key: string]: any }): { [key:string]: any } {
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
        
        const isUserAdmin = ADMIN_USER_IDS.includes(userId);
        if (userData.isAdmin !== isUserAdmin) {
            updates.isAdmin = isUserAdmin;
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
    // To avoid hitting DB for each referral, fetch them in batches.
    // Firestore `in` query supports up to 30 items.
    const batchSize = 30;
    for (let i = 0; i < referralIds.length; i += batchSize) {
        const batchIds = referralIds.slice(i, i + batchSize);
        if(batchIds.length === 0) continue;

        try {
            const q = query(collection(db, 'users'), where('__name__', 'in', batchIds));
            const usersSnapshot = await getDocs(q);
            usersSnapshot.forEach(userSnap => {
                 if (userSnap.exists()) {
                    const userData = userSnap.data();
                    referrals.push({
                        id: userSnap.id,
                        name: userData.name || `Friend ${userSnap.id.substring(0, 4)}`,
                        avatar: `https://picsum.photos/seed/${userSnap.id}/40`
                    });
                }
            });
        } catch (error) {
            console.error(`Failed to fetch referral batch`, error);
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

export async function getUsers(): Promise<UserData[]> {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    // Create a map of user IDs to their full data for quick lookups
    const userMap = new Map<string, UserData>();
    querySnapshot.docs.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() } as UserData;
        userMap.set(doc.id, userData);
    });

    const usersWithReferrerNames = Array.from(userMap.values()).map(user => {
        const serializedData = serializeFirestoreTimestamps(user) as UserData;
        const referrerName = user.referredBy ? userMap.get(user.referredBy)?.name : undefined;
        
        // Ensure the referral count is derived from the complete data in the map
        const fullUserData = userMap.get(user.id);
        const referralCount = fullUserData?.referrals?.length || 0;

        return {
            ...serializedData,
            referralCount: referralCount,
            referredByName: referrerName || 'N/A'
        };
    });

    return usersWithReferrerNames.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
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
    if (snapshot.empty) {
        return [];
    }
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

// --- Contest ---

export async function getContestSettings(manualOnly = false): Promise<ContestSettings> {
    const contestRef = doc(db, 'contest', 'settings');
    const contestSnap = await getDoc(contestRef);
    let manualWinners: ContestEntry[] = Array(5).fill({ name: "N/A", referralCount: 0 });

    if (contestSnap.exists()) {
        const data = contestSnap.data() as ContestSettings;
        if (data.winners) {
            manualWinners = data.winners;
        }
    }

    if (manualOnly) {
        return { winners: manualWinners };
    }

    const manualWinnerNames = manualWinners.map(w => w.name).filter(name => name !== "N/A");
    
    // Fetch all users and calculate referralCount on the fly
    const allUsers = await getUsers(); 

    const automaticWinners: ContestEntry[] = allUsers
        .filter(user => user.name && !manualWinnerNames.includes(user.name))
        .map(user => ({
            name: user.name,
            referralCount: user.referrals?.length || 0,
        }))
        .sort((a, b) => b.referralCount - a.referralCount);

    const finalWinners = [...manualWinners];
    const remainingSlots = 10 - finalWinners.length;
    if (remainingSlots > 0) {
      finalWinners.push(...automaticWinners.slice(0, remainingSlots));
    }

    // Ensure we always have 10 winners, filling with N/A if needed
    while (finalWinners.length < 10) {
        finalWinners.push({ name: 'N/A', referralCount: 0 });
    }

    return { winners: finalWinners.slice(0, 10) };
}

export async function saveContestWinners(winners: ContestEntry[]) {
    'use server';
    const contestRef = doc(db, 'contest', 'settings');
    try {
        // We only save the manually entered winners (top 5)
        await setDoc(contestRef, { winners: winners.slice(0, 5) });
        revalidatePath('/admin');
        revalidatePath('/referral-contest');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function migrateOldReferrals() {
    'use server';
    console.log("[Migration] Starting old referrals migration...");
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (usersSnapshot.empty) {
            return { success: true, message: "No users found to migrate." };
        }

        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
        const allUserIds = new Set(allUsers.map(u => u.id));
        
        // Step 1: Build a map of who referred whom
        const referrersMap: { [key: string]: string[] } = {};
        allUsers.forEach(user => {
            if (user.referredBy) {
                // Check if the referrer actually exists before adding to map
                if (allUserIds.has(user.referredBy)) {
                    if (!referrersMap[user.referredBy]) {
                        referrersMap[user.referredBy] = [];
                    }
                    referrersMap[user.referredBy].push(user.id);
                } else {
                    console.warn(`[Migration] Found a user (${user.id}) with a non-existent referrer (${user.referredBy}). Skipping this relation.`);
                }
            }
        });
        
        if (Object.keys(referrersMap).length === 0) {
             console.log("[Migration] No users with a 'referredBy' field found, or all referrers are non-existent. No migration needed.");
             return { success: true, message: "No valid referrals found to migrate." };
        }

        // Step 2: Create a batch write to update all referrers
        const batch = writeBatch(db);
        let updatedCount = 0;
        
        for (const referrerId in referrersMap) {
            const userRef = doc(db, 'users', referrerId);
            const referredUserIds = referrersMap[referrerId];
            
            const userToUpdate = allUsers.find(u => u.id === referrerId);
            const existingReferrals = userToUpdate?.referrals || [];
            
            // Merge existing and newly found referrals, ensuring no duplicates
            const mergedReferrals = [...new Set([...existingReferrals, ...referredUserIds])];

            // Only update if there are new referrals to add
            if (mergedReferrals.length > existingReferrals.length) {
                batch.update(userRef, { referrals: mergedReferrals });
                updatedCount++;
                console.log(`[Migration] Queued update for referrer ${referrerId} with ${mergedReferrals.length} total referrals.`);
            }
        }
        
        if (updatedCount === 0) {
             console.log("[Migration] All referral arrays are already up-to-date.");
             return { success: true, message: "All referral data is already consistent." };
        }
        
        // Step 3: Commit the batch
        await batch.commit();
        
        console.log(`[Migration] Successfully updated ${updatedCount} user documents.`);
        revalidatePath('/');
        revalidatePath('/refer');
        revalidatePath('/admin');
        
        return { success: true, message: `Migration successful. Updated ${updatedCount} referrer documents.` };

    } catch (error: any) {
        console.error("[Migration Failed] Error during referral migration:", error);
        return { success: false, error: `Migration failed: ${error.message}` };
    }
}
    

    

    



    

    

    

    


