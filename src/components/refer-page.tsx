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
import { onSnapshot, doc, collection, query, orderBy } from "firebase/firestore";
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

const ShareButton = ({ platform, referralLink, children, className }: { platform: 'whatsapp' | 'telegram' | 'sms' | 'email', referralLink: string, children: React.ReactNode, className: string }) => {
    const shareText = `Join me on PARI Network and start mining! Use my referral link: ${referralLink}`;
    
    const getShareUrl = () => {
        switch (platform) {
            case 'whatsapp':
                return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            case 'telegram':
                return `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
            case 'sms':
                return `sms:?body=${encodeURIComponent(shareText)}`;
            case 'email':
                return `mailto:?subject=Join me on PARI Network&body=${encodeURIComponent(shareText)}`;
        }
    };

    return (
        <a href={getShareUrl()} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    );
};


export default function ReferPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

   useEffect(() => {
    const FAKE_USER_ID = 'user_placeholder_id';

    // Initial data fetch
    getInitialUserData().then(initialData => {
      if (initialData.user) setUserData(initialData.user);
      if (initialData.referrals) setReferrals(initialData.referrals);
      if (initialData.leaderboard) setLeaderboard(initialData.leaderboard);
      setLoading(false);
    });

    // Real-time listener for user updates (referrals, earnings)
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

    // Real-time listener for leaderboard updates
    const leaderboardQuery = query(collection(db, 'leaderboard'));
    const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, async () => {
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

  if (loading) {
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
            <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-accent"/> Referral Contest</h2>
                 <Button asChild variant="outline" size="sm">
                    <Link href="/referral-contest">View All</Link>
                 </Button>
            </div>
            {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[160px] text-muted-foreground">
                    <Trophy className="w-10 h-10 mb-2"/>
                    <p>Leaderboard is being prepared.</p>
                </div>
            ) : (
                <div className="flex items-end justify-center w-full h-40 space-x-1">
                    <PodiumSpot user={top2!} rank={2} medal="🥈" />
                    <PodiumSpot user={top1!} rank={1} medal="🥇" />
                    <PodiumSpot user={top3!} rank={3} medal="🥉" />
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
            value={(userData?.referralEarnings || 0).toFixed(4)}
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
            <ShareButton platform="whatsapp" referralLink={referralLink} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-white hover:bg-green-600 h-12 text-md">
                <WhatsAppIcon />
                WhatsApp
            </ShareButton>
            <ShareButton platform="telegram" referralLink={referralLink} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-12 text-md">
                <Send className="w-5 h-5" />
                Telegram
            </ShareButton>
            <ShareButton platform="sms" referralLink={referralLink} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-card/80 text-foreground hover:bg-card/90 h-12 text-md">
                <Smartphone className="w-5 h-5" />
                SMS
            </ShareButton>
            <ShareButton platform="email" referralLink={referralLink} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-500 text-white hover:bg-orange-600 h-12 text-md">
                <Mail className="w-5 h-5" />
                Email
            </ShareButton>
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
    