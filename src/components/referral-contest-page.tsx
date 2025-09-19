
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader, Trophy, Users, Award } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import type { UserData, ContestSettings, ContestWinner } from "@/lib/types";
import { getUsers, getContestSettings } from "@/app/actions";
import { AuthContext } from "@/context/AuthContext";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const prizes = {
    1: 1000, 2: 500, 3: 300, 4: 100, 5: 50,
    6: 10, 7: 10, 8: 10, 9: 10, 10: 10
};

function PodiumCard({ rank, user, prize }: { rank: number; user: ContestWinner | null; prize: number }) {
    const colors = {
        1: { bg: 'bg-yellow-400/20', text: 'text-yellow-400', border: 'border-yellow-400', shadow: 'shadow-yellow-400/20' },
        2: { bg: 'bg-gray-300/20', text: 'text-gray-300', border: 'border-gray-300', shadow: 'shadow-gray-300/20' },
        3: { bg: 'bg-orange-400/20', text: 'text-orange-400', border: 'border-orange-400', shadow: 'shadow-orange-400/20' },
    };

    const rankInfo = colors[rank as keyof typeof colors];

    const heightClasses = {
        1: 'h-40',
        2: 'h-32',
        3: 'h-24'
    };

    return (
        <div className={`flex flex-col items-center justify-end ${heightClasses[rank as keyof typeof heightClasses]}`}>
            <Avatar className="w-12 h-12 mb-2 border-2 border-primary">
                 <AvatarImage src={`https://picsum.photos/seed/${user?.id || rank}/48`} alt={user?.name} />
                <AvatarFallback>{user ? user.name.substring(0, 2) : '?'}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-bold truncate w-20 text-center">{user?.name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">{user ? `${user.referralCount} referrals` : ''}</p>
            <div className={`w-full text-center mt-2 flex-grow-0 rounded-t-lg p-2 flex flex-col justify-center items-center ${rankInfo.bg} border-t-4 ${rankInfo.border} shadow-lg ${rankInfo.shadow}`}>
                <p className={`text-2xl font-bold ${rankInfo.text}`}>{rank}</p>
                <p className="text-sm font-bold text-white">${prize}</p>
            </div>
        </div>
    );
}

function LeaderboardItem({ rank, user, prize, currentUserId }: { rank: number; user: ContestWinner; prize: number; currentUserId: string | null }) {
    const isCurrentUser = user.id === currentUserId;
    return (
        <li className={`flex items-center p-3 rounded-lg ${isCurrentUser ? 'bg-primary/20 border border-primary' : 'bg-card/50'}`}>
            <span className="text-lg font-bold w-8">{rank}</span>
            <Avatar className="w-10 h-10 mx-2">
                 <AvatarImage src={`https://picsum.photos/seed/${user.id}/40`} alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.referralCount} referrals</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-green-400">${prize}</p>
            </div>
        </li>
    );
}

export default function ReferralContestPage() {
    const authContext = useContext(AuthContext);
    const [leaderboard, setLeaderboard] = useState<ContestWinner[]>([]);
    const [top3, setTop3] = useState<(ContestWinner | null)[]>([null, null, null]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);

            const [allUsers, contestSettings] = await Promise.all([
                getUsers(),
                getContestSettings()
            ]);

            // Filter out admin-set top 3 from the general user list
            const top3Ids = [
                contestSettings?.top1_user?.id, 
                contestSettings?.top2_user?.id, 
                contestSettings?.top3_user?.id
            ].filter(id => id);

            const remainingUsers = allUsers
                .filter(user => !top3Ids.includes(user.id))
                .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));

            const finalTop3: (ContestWinner | null)[] = [
                contestSettings?.top1_user || null,
                contestSettings?.top2_user || null,
                contestSettings?.top3_user || null
            ];
            
            // The rest of the leaderboard, up to rank 10
            const finalLeaderboard = remainingUsers.slice(0, 7); // Ranks 4-10

            setTop3(finalTop3);
            setLeaderboard(finalLeaderboard);
            setLoading(false);
        };

        fetchLeaderboard();
    }, []);

    const currentUserId = authContext?.user?.id || null;

    if (authContext?.loading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // Find current user's rank
    const allRankedUsers = [...top3.filter(u => u), ...leaderboard];
    const currentUserRank = allRankedUsers.findIndex(u => u && u.id === currentUserId);

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
            <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/profile">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Referral Contest
                </h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-1 p-4 space-y-6">
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <h2 className="text-2xl font-bold text-center mb-2">Leaderboard</h2>
                        <p className="text-center text-muted-foreground mb-6">Total Prize Pool: $2000</p>
                        
                        {/* Podium for Top 3 */}
                        <div className="flex justify-around items-end h-48">
                            <PodiumCard rank={2} user={top3[1]} prize={prizes[2]} />
                            <PodiumCard rank={1} user={top3[0]} prize={prizes[1]} />
                            <PodiumCard rank={3} user={top3[2]} prize={prizes[3]} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm">
                     <CardContent className="p-4">
                        <h3 className="text-lg font-bold mb-4">Ranks 4-10</h3>
                        {leaderboard.length > 0 ? (
                             <ul className="space-y-3">
                                {leaderboard.map((user, index) => (
                                    <LeaderboardItem key={user.id} rank={index + 4} user={user} prize={prizes[index + 4 as keyof typeof prizes]} currentUserId={currentUserId} />
                                ))}
                            </ul>
                        ) : (
                             <div className="text-center text-muted-foreground py-8">
                                <Users className="w-10 h-10 mx-auto mb-2"/>
                                <p>No other players in the top 10 yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {currentUserRank !== -1 && (
                    <Card className="bg-primary/20 border border-primary fixed bottom-4 left-4 right-4 z-20">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                                <p className="font-bold">Your Rank: <span className="text-primary text-xl">{currentUserRank + 1}</span></p>
                                <div className="text-right">
                                    <p className="font-bold text-green-400">Prize: ${prizes[currentUserRank + 1 as keyof typeof prizes] || 0}</p>
                                    <p className="text-xs text-muted-foreground">{authContext?.user?.referralCount || 0} referrals</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
