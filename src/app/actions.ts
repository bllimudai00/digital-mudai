'use server';

import { doc, updateDoc, arrayUnion, getDoc, runTransaction, increment, collection, getDocs, writeBatch, setDoc, query, where, addDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firestore';
import type { UserData, Referral, Task, NewsArticle } from '@/lib/types';

// This is a placeholder for a real user ID
const FAKE_USER_ID = 'user_placeholder_id';

const hardcodedNewsData = [
  {
    id: 'news_1',
    title: "🔥 New Fighting Game Coming Soon to Pari Network! 🔥",
    date: "Sep 4, 2025",
    priority: "low",
    content: [
      {
        type: 'paragraph',
        text: 'Pari Network will soon launch a new fighting game that will be directly available inside the app. This game will be easy and fun for everyone.'
      },
      {
        type: 'section',
        title: "Simple and Fun Gameplay",
        icon: 'Gamepad2',
        text: "Choose your favorite character and fight against other players or smart bots. The game will be fast and exciting!",
      },
      {
        type: 'section',
        title: "Earn Crypto Tokens While You Play",
        icon: 'Wallet',
        text: "Win battles and earn Pari Network crypto tokens as rewards. Your earnings will be safe and secured by smart contracts.",
      },
      {
        type: 'section',
        title: "What's Next?",
        icon: 'Star',
        text: "Soon, new features like tournaments and ranking systems will be added to make the game even more enjoyable.",
      },
      {
        type: 'coming-soon',
        text: "Coming soon!",
      }
    ],
  },
  {
    id: 'news_2',
    title: "Our Launching Plan: Bringing Innovation to You",
    date: "Sep 1, 2025",
    priority: "low",
    content: [
      {
        type: 'paragraph',
        text: "We are excited to announce that the launch of our project is on the horizon. Our plan is to introduce the application in phases, ensuring thorough testing, user feedback, and continuous improvements."
      },
      {
        type: 'paragraph',
        text: "The launch will include a special campaign to engage users, share exclusive previews, and highlight the unique features powered by AI, gaming, Web 3.0, and Pari blockchain. We aim to provide a seamless and impactful experience from day one."
      },
      {
        type: 'paragraph',
        text: "Stay tuned for updates and be ready to explore a new era of digital innovation with us!"
      }
    ]
  },
  {
    id: 'news_3',
    title: "Pari Blockchain Integration in Our Project",
    date: "Sep 1, 2025",
    priority: "low",
    content: [
        {
            type: 'paragraph',
            text: "Our project incorporates the cutting-edge Pari blockchain to power secure, scalable, and decentralized digital solutions. Pari blockchain offers enhanced speed, low transaction costs, and high security, making it ideal for gaming, AI, and Web 3.0 applications."
        },
        {
            type: 'paragraph',
            text: "By leveraging Pari blockchain, we provide users with true ownership of digital assets, transparent smart contract automation, and reliable data integrity. This integration boosts trust and efficiency in both virtual and real-world use cases."
        },
        {
            type: 'paragraph',
            text: "Pari blockchain's advanced technology strengthens our project's mission to deliver innovative, user-centric, and future-proof digital experiences."
        }
    ]
  },
];


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
    
    // Seed news
    const newsRef = collection(db, 'news');
    const newsSnapshot = await getDocs(newsRef);
    if (newsSnapshot.empty) {
        console.log("No news found, seeding initial news...");
        const batch = writeBatch(db);
        hardcodedNewsData.forEach(article => {
            const articleRef = doc(newsRef, article.id);
            batch.set(articleRef, article);
        });
        await batch.commit();
        console.log("Initial news seeded.");
    }
}


export async function getInitialUserData() {
    await seedInitialData();
    const user = await getUserData();
    const referrals = await getReferrals(user?.referrals || []);
    const tasks = await getTasks();
    const news = await getNews();
    return { user, referrals, tasks, news };
}

function serializeFirestoreTimestamps(data: { [key: string]: any }): { [key: string]: any } {
    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
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
    return serializedData;
}


export async function getUserData(): Promise<UserData | null> {
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        const userData = serializeFirestoreTimestamps(data) as UserData;
        // Sync vip status
        if (userData.vipStatus === 'approved' && !userData.vip) {
            await updateDoc(userRef, { vip: true });
            userData.vip = true;
        } else if (userData.vipStatus !== 'approved' && userData.vip) {
            await updateDoc(userRef, { vip: false });
            userData.vip = false;
        }
        return { ...userData, id: userSnap.id };

    } else {
        // If user doesn't exist, create a new one with default values
        console.log("User not found, creating a new one...");
        const newUser: UserData = {
            id: FAKE_USER_ID,
            pariBalance: 10.00,
            hashPower: 1,
            baseRate: 10.00,
            streak: 16,
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

        const dataToSet = { ...newUser };
        delete (dataToSet as any).id; // Don't save the id in the document body

        await setDoc(userRef, {
            ...dataToSet,
            createdAt: serverTimestamp(), // Use server timestamp for creation
        });
        await seedInitialData(); 
        console.log("New user and initial data seeded successfully.");
        
        // After setting, we need to get the data again to have the server timestamp
        const newUserSnap = await getDoc(userRef);
        const newUserData = newUserSnap.data();
        return serializeFirestoreTimestamps({id: newUserSnap.id, ...newUserData}) as UserData;
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
                claimedAt: serverTimestamp(),
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
    await updateDoc(userRef, {
        vipStatus: status,
    });
    revalidatePath('/admin');
    revalidatePath(`/vip`); 
    // The user's page will update in real-time due to snapshot listeners.
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
        // Sort by date if needed, assuming date format is sortable (e.g., YYYY-MM-DD)
        // For "Sep 4, 2025" format, a custom sort is needed.
        return newsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    return users;
}

export async function updateUserFromAdmin(userId: string, dataToUpdate: Partial<UserData>) {
    'use server';
    const userRef = doc(db, 'users', userId);

    // Sanitize data: remove id and any other non-updatable fields
    const { id, ...updateData } = dataToUpdate;

    try {
        await updateDoc(userRef, updateData);
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

    