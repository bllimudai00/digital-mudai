"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/app/actions";
import type { LeaderboardEntry } from "@/lib/types";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";


function LeaderboardRow({ entry, isTopThree }: { entry: LeaderboardEntry, isTopThree: boolean }) {
    
    let medal = null;
    if(isTopThree) {
        if (entry.rank === 1) medal = '🥇';
        else if (entry.rank === 2) medal = '🥈';
        else if (entry.rank === 3) medal = '🥉';
    }

    return (
        <TableRow className={isTopThree ? "bg-card/80 font-bold" : ""}>
            <TableCell className="text-center">
                <span className="text-lg">{medal || entry.rank}</span>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary/50">
                        <AvatarImage src={`https://picsum.photos/seed/${entry.userId}/40`} />
                        <AvatarFallback>{entry.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{entry.name}</span>
                </div>
            </TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {entry.referralCount}
                </div>
            </TableCell>
             <TableCell className="text-right text-green-400 font-semibold">
                ${entry.prize.toLocaleString()}
            </TableCell>
        </TableRow>
    )
}

export default function ReferralContestPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    getLeaderboard().then(data => {
        setLeaderboard(data);
        setLoading(false);
    });

    // Listen for real-time updates
    const leaderboardCollection = collection(db, 'leaderboard');
    const unsubscribe = onSnapshot(leaderboardCollection, (snapshot) => {
        getLeaderboard().then(data => {
            setLeaderboard(data);
        });
    }, (error) => {
        console.error("Error fetching real-time leaderboard:", error);
    });

    return () => unsubscribe();
  }, []);


  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-accent" />
            Referral Leaderboard
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leaderboard.length > 0 ? (
          <Card className="bg-transparent border-0 shadow-none">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-center">Referrals</TableHead>
                            <TableHead className="text-right">Prize</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry, index) => (
                            <LeaderboardRow key={index} entry={entry} isTopThree={index < 3} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
            <CardContent className="p-0 flex flex-col items-center">
              <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold">Leaderboard is Empty</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start referring to see your name here!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
