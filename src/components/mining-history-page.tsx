"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, Loader, Coins } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserData } from "@/app/actions";
import type { UserData } from "@/lib/types";
import { format } from "date-fns";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

export default function MiningHistoryPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const FAKE_USER_ID = 'user_placeholder_id';
    const unsub = onSnapshot(doc(db, "users", FAKE_USER_ID), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const history = userData?.miningHistory?.sort((a, b) => b.claimedAt - a.claimedAt) || [];

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1">Mining History</h1>
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
                        <Coins className="w-6 h-6 text-green-400" />
                        <div>
                            <p className="font-semibold text-green-400">+{item.amount.toFixed(4)} PARI</p>
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(item.claimedAt), "PPP p")}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-foreground">Claimed</p>
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
