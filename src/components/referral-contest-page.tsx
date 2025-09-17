"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/app/actions";
import type { LeaderboardEntry } from "@/lib/types";
import { onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

function PodiumSpot({ user, rank, medal }: { user: LeaderboardEntry, rank: number, medal: string }) {
    if (!user || !user.name) return <div className="w-1/3" />;

    const rankStyles = {
        1: { podium: 'h-32 bg-yellow-400/30', avatar: 'w-20 h-20 border-yellow-400', offset: 'bottom-0' },
        2: { podium: 'h-24 bg-slate-400/30', avatar: 'w-16 h-16 border-slate-400', offset: 'bottom-0' },
        3: { podium: 'h-16 bg-orange-500/30', avatar: 'w-14 h-14 border-orange-500', offset: 'bottom-0' },
    }[rank] || {};

    return (
        <div className={`relative w-1/3 flex flex-col items-center justify-end`}>
            <div className={`absolute -top-8 flex flex-col items-center z-10`}>
                <p className="text-3xl drop-shadow-lg">{medal}</p>
                <Avatar className={`${rankStyles.avatar} border-4 shadow-lg`}>
                    <AvatarImage src={`https://picsum.photos/seed/${user.userId}/100`} />
                    <AvatarFallback>{user.name ? user.name.substring(0, 2) : '?'}</AvatarFallback>
                </Avatar>
            </div>
            <div className={`${rankStyles.podium} w-full rounded-t-lg flex flex-col items-center justify-center p-1 pt-8 text-center shadow-inner`}>
                <p className="font-bold text-sm truncate w-24 text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground font-semibold">{user.referralCount} Ref</p>
            </div>
        </div>
    );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
    return (
        <TableRow>
            <TableCell className="text-center font-bold">{entry.rank}</TableCell>
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
    const fetchAndSetLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboard();
            setLeaderboard(data);
        } catch (error) {
            console.error("Error fetching initial leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }
    
    fetchAndSetLeaderboard();

    const q = query(collection(db, 'leaderboard'), where('type', '==', 'manual'));
    const unsubscribe = onSnapshot(q, async () => {
        const data = await getLeaderboard();
        setLeaderboard(data);
    }, (error) => {
        console.error("Error fetching real-time leaderboard:", error);
    });

    return () => unsubscribe();
  }, []);

  const top1 = leaderboard.find(u => u.rank === 1);
  const top2 = leaderboard.find(u => u.rank === 2);
  const top3 = leaderboard.find(u => u.rank === 3);
  const others = leaderboard.filter(u => u.rank > 3);

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

      <main className="flex-1 p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
            <>
                { (top1 && top2 && top3) && (
                     <Card className="bg-card/50 backdrop-blur-sm overflow-hidden py-6">
                        <CardContent>
                            <div className="flex items-end justify-center w-full h-40 space-x-1">
                                <PodiumSpot user={top2} rank={2} medal="🥈" />
                                <PodiumSpot user={top1} rank={1} medal="🥇" />
                                <PodiumSpot user={top3} rank={3} medal="🥉" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                { others.length > 0 ? (
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">Rank</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-center">Referrals</TableHead>
                                        <TableHead className="text-right">Prize (USDT)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {others.map((entry) => (
                                        <LeaderboardRow key={entry.rank} entry={entry} />
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    ) : !top1 && !top2 && !top3 ? (
                     <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
                        <CardContent className="p-0 flex flex-col items-center">
                            <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                            <h2 className="text-lg font-semibold">Leaderboard is Empty</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Start referring to see your name here!
                            </p>
                        </CardContent>
                    </Card>
                ) : null }
            </>
        )}
      </main>
    </div>
  );
}
