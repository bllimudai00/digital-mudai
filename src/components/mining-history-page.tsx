"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, Loader, Coins } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserData } from "@/app/actions";
import type { UserData } from "@/lib/types";
import { format } from "date-fns";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

function serializeTimestampInHistory(history: any[]) {
    return history.map(item => ({
        ...item,
        claimedAt: item.claimedAt && typeof (item.claimedAt as any).toDate === 'function' 
            ? (item.claimedAt as any).toDate().toISOString()
            : item.claimedAt,
    })).sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
}

export default function MiningHistoryPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const FAKE_USER_ID = 'user_placeholder_id';

    // Initial fetch for SSR and to handle user creation
    getUserData().then(user => {
      if (user) {
        setUserData(user);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    
    // Real-time listener for client-side updates
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const user = doc.data() as UserData;
            // The snapshot might return Timestamps, so we need to handle them
            if (user.miningHistory) {
                user.miningHistory = serializeTimestampInHistory(user.miningHistory);
            }
            setUserData(user);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const history = userData?.miningHistory || [];

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
            <History className="w-5 h-5"/>
            Mining History
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : history.length > 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {history.map((item, index) => (
                  <li key={index} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 rounded-full">
                            <Coins className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-400">+{item.amount.toFixed(4)} PARI</p>
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(item.claimedAt as string), "PPP p")}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-foreground bg-secondary px-2 py-1 rounded-md">Claimed</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
            <CardContent className="p-0 flex flex-col items-center">
              <History className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold">No History Yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start a mining session to see your rewards here.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
