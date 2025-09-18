
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, Loader, Coins, ListChecks, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import type { UserData, Transaction } from "@/lib/types";
import { format } from "date-fns";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";

function serializeTimestampInHistory(history: any[]) {
    return history.map(item => ({
        ...item,
        claimedAt: item.claimedAt && typeof (item.claimedAt as any).toDate === 'function' 
            ? (item.claimedAt as any).toDate().toISOString()
            : item.claimedAt,
    })).sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
}

const transactionIcons = {
  mining: <Zap className="w-6 h-6 text-orange-400" />,
  task: <ListChecks className="w-6 h-6 text-blue-400" />,
};

const transactionColors = {
    mining: 'bg-orange-500/10',
    task: 'bg-blue-500/10',
}

function HistoryItem({ item }: { item: Transaction }) {
    const Icon = transactionIcons[item.type] || <Coins className="w-6 h-6 text-green-400" />;
    const bgColor = transactionColors[item.type] || 'bg-green-500/10';

    return (
        <li className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className={`p-2 ${bgColor} rounded-full`}>
                    {Icon}
                </div>
                <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(item.claimedAt as string), "PPP p")}
                    </p>
                </div>
            </div>
             <p className="text-sm font-medium text-green-400">+{item.amount.toFixed(4)} PARI</p>
        </li>
    );
}

export default function HistoryPage() {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  useEffect(() => {
    if (!authContext?.user?.id) return;
    
    const userRef = doc(db, 'users', authContext.user.id);
    const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const user = doc.data() as UserData;
            if (user.history) {
                user.history = serializeTimestampInHistory(user.history);
            }
            setUserData(user);
        }
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
    });

    return () => unsubscribe();
  }, [authContext?.user?.id]);
  
  if (!authContext || authContext.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const history = userData?.history || [];

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
            History
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {authContext.loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : history.length > 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {history.map((item, index) => (
                    <HistoryItem key={index} item={item} />
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
                Your claimed rewards from mining and tasks will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
