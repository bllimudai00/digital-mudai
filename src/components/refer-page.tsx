"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Gift,
  Users,
  BarChart,
  Clipboard,
  Link as LinkIcon,
  Send,
  Smartphone,
  Mail,
  Info,
  Zap,
  Newspaper,
  ListChecks,
  User,
  Loader,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getInitialUserData, getReferrals, getLeaderboard } from "@/app/actions";
import type { UserData, Referral, LeaderboardEntry } from "@/lib/types";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


function BottomNavItem({
  icon,
  label,
  href,
  isActive = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm p-4">
      <CardContent className="p-0 flex items-center gap-4">
        {icon}
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
)

function PodiumSpot({ user, rank, medal, podiumHeight, avatarSize }: { user: LeaderboardEntry, rank: number, medal: string, podiumHeight: string, avatarSize: string }) {
    if (!user) return <div className={`flex-1 ${podiumHeight}`}></div>;

    const rankColors = {
        1: 'bg-yellow-400/80', // Gold
        2: 'bg-slate-400/80', // Silver
        3: 'bg-orange-400/80', // Bronze
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-end mx-1">
            <div className="relative mb-2">
                <p className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">{medal}</p>
                <Avatar className={`${avatarSize} border-4 border-background shadow-lg`}>
                    <AvatarImage src={`https://picsum.photos/seed/${user.userId}/100`} />
                    <AvatarFallback>{user.name ? user.name.substring(0, 2) : '?'}</AvatarFallback>
                </Avatar>
            </div>
            <div className={`w-full ${podiumHeight} ${rankColors[rank as keyof typeof rankColors]} rounded-t-lg flex flex-col items-center justify-center p-2 pt-4 text-center`}>
                <p className="font-bold text-black text-sm truncate w-20">{user.name}</p>
                <p className="text-xs text-black/80 font-semibold">{user.referralCount} Referrals</p>
                <p className="text-lg font-bold text-black/70 mt-1">#{rank}</p>
            </div>
        </div>
    );
}

export default function ReferPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const FAKE_USER_ID = 'user_placeholder_id';
    
    const fetchAndSetData = async () => {
        setLoading(true);
        try {
            const [initialData, leaderboardData] = await Promise.all([getInitialUserData(), getLeaderboard()]);
            setUserData(initialData.user);
            setReferrals(initialData.referrals);
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    }
    
    fetchAndSetData();

    const userRef = doc(db, 'users', FAKE_USER_ID);
    const unsubscribeUser = onSnapshot(userRef, async (doc) => {
        if (doc.exists()) {
            const user = doc.data() as UserData;
            setUserData(user);
            if (user.referrals && user.referrals.length > 0) {
                const referralData = await getReferrals(user.referrals);
                setReferrals(referralData);
            } else {
                setReferrals([]);
            }
        }
    });

    const leaderboardCollection = collection(db, 'leaderboard');
    const unsubscribeLeaderboard = onSnapshot(leaderboardCollection, async () => {
        const updatedLeaderboard = await getLeaderboard();
        setLeaderboard(updatedLeaderboard);
    });

    return () => {
        unsubscribeUser();
        unsubscribeLeaderboard();
    };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${label} has been copied.`,
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
       toast({
        title: "Error",
        description: `Failed to copy ${label}.`,
        variant: "destructive",
      });
    });
  };

  const referralLink = userData ? `https://parinetwork.com/join?ref=${userData.referralCode}` : "";
  
  const top1 = leaderboard.find(u => u.rank === 1);
  const top2 = leaderboard.find(u => u.rank === 2);
  const top3 = leaderboard.find(u => u.rank === 3);

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <Card className="bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-accent"/> Referral Contest</h2>
                 <Button asChild variant="outline" size="sm">
                    <Link href="/referral-contest">View All</Link>
                 </Button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center min-h-[250px]">
                    <Loader className="w-8 h-8 animate-spin" />
                </div>
            ) : top1 && top2 && top3 ? (
                <div className="mt-4 flex items-end justify-center min-h-[250px] bg-gradient-to-t from-background/50 to-transparent pt-8 px-2">
                    <PodiumSpot user={top2} rank={2} medal="🥈" podiumHeight="h-24" avatarSize="w-16 h-16" />
                    <PodiumSpot user={top1} rank={1} medal="🥇" podiumHeight="h-32" avatarSize="w-20 h-20" />
                    <PodiumSpot user={top3} rank={3} medal="🥉" podiumHeight="h-20" avatarSize="w-14 h-14" />
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center min-h-[250px] text-muted-foreground">
                    <Trophy className="w-10 h-10 mb-2"/>
                    <p>Leaderboard is being prepared.</p>
                </div>
            )}
          </CardContent>
        </Card>


        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Gift className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Refer & Earn</h2>
              <p className="text-sm text-green-400">
                Level 1: 10% Commission
              </p>
              <p className="text-sm text-green-400/80">
                Level 2: 5% Commission
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <StatCard
            icon={<Users className="w-8 h-8 text-primary" />}
            label="Active Referrals"
            value={(userData?.referrals?.length || 0).toString()}
          />
          <StatCard
            icon={<BarChart className="w-8 h-8 text-accent" />}
            label="Total Earned"
            value="0.0000"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground ml-1 mb-1 block">
              Your Referral Code
            </label>
            <div className="relative">
              <Input
                type="text"
                readOnly
                value={userData?.referralCode || ""}
                className="pr-12 bg-card/80 border-border"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(userData?.referralCode || "", "Referral Code")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
              >
                <Clipboard className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground ml-1 mb-1 block">
              Your Referral Link
            </label>
            <div className="relative">
              <Input
                type="text"
                readOnly
                value={referralLink}
                className="pr-12 bg-card/80 border-border"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(referralLink, "Referral Link")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button className="bg-green-500 hover:bg-green-600 text-white h-12 text-md">
            <WhatsAppIcon />
            WhatsApp
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white h-12 text-md">
            <Send className="w-5 h-5" />
            Telegram
          </Button>
          <Button className="bg-card/80 hover:bg-card/90 text-foreground h-12 text-md">
            <Smartphone className="w-5 h-5" />
            SMS
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white h-12 text-md">
            <Mail className="w-5 h-5" />
            Email
          </Button>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm p-6 space-y-4">
           <CardContent className="p-0 flex flex-col items-center justify-center">
             <Users className="w-8 h-8 text-primary mb-2" />
             <h3 className="text-lg font-bold">Your Referred Users</h3>
           </CardContent>
            {referrals.length > 0 ? (
                <ul className="space-y-3">
                    {referrals.map(ref => (
                        <li key={ref.id} className="flex items-center gap-4 bg-background p-3 rounded-lg">
                           <Avatar>
                                <AvatarImage src={ref.avatar} alt={ref.name} />
                                <AvatarFallback>{ref.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{ref.name}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center text-center text-muted-foreground mt-4">
                    <Info className="w-8 h-8 mb-2" />
                    <p>You haven't referred anyone yet.</p>
                    <p>Share your code to start earning!</p>
                </div>
            )}
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem
            icon={<Zap className="w-6 h-6" />}
            label="Mining"
            href="/"
          />
          <BottomNavItem
            icon={<Newspaper className="w-6 h-6" />}
            label="News"
            href="/news"
          />
          <BottomNavItem
            icon={<ListChecks className="w-6 h-6" />}
            label="Tasks"
            href="/tasks"
          />
          <BottomNavItem
            icon={<Gift className="w-6 h-6" />}
            label="Refer"
            href="/refer"
            isActive
          />
          <BottomNavItem
            icon={<User className="w-6 h-6" />}
            label="Profile"
            href="/profile"
          />
        </div>
      </footer>
    </div>
  );
}
