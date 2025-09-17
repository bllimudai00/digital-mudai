"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Link as LinkIcon,
  TrendingUp,
  Zap,
  Flame,
  Crown,
  Users,
  Newspaper,
  ListChecks,
  Gift,
  User,
  Loader,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { claimReward, startMiningSession, getInitialUserData } from "@/app/actions";
import type { UserData } from "@/lib/types";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

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
    <Card className="bg-card/80 backdrop-blur-sm p-3">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

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

function formatTime(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


export default function MiningPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [miningState, setMiningState] = useState<'idle' | 'mining' | 'claimable' | 'loading'>('loading');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    // Let's use a placeholder ID for now
    const FAKE_USER_ID = 'user_placeholder_id';

    // Set up a real-time listener for user data
    const unsub = onSnapshot(doc(db, "users", FAKE_USER_ID), async (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      } else {
        // If user doesn't exist, create them
        const data = await getInitialUserData();
        setUserData(data?.user || null)
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userData) {
      setMiningState('loading');
      return;
    };

    if (userData.sessionEndTime) {
      const remaining = userData.sessionEndTime - Date.now();
      if (remaining > 0) {
        setMiningState('mining');
        setTimeRemaining(remaining);
      } else {
        setMiningState('claimable');
        setTimeRemaining(0);
      }
    } else {
      setMiningState('idle');
      setTimeRemaining(0);
    }
  }, [userData]);


  useEffect(() => {
    if (miningState !== 'mining' || timeRemaining <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setMiningState('claimable');
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [miningState, timeRemaining]);


  const handleStartMining = async () => {
    if (!userData || miningState !== 'idle') return;
    setIsActionLoading(true);
    const result = await startMiningSession(userData.id);
    // Real-time listener will update the state, so no need to set it here
    setIsActionLoading(false);
  };

  const handleClaimReward = async () => {
    if (!userData || miningState !== 'claimable') return;
    setIsActionLoading(true);
    const result = await claimReward(userData.id);
    // Real-time listener will update the state
    setIsActionLoading(false);
  };

  const MiningButton = () => {
    if (isActionLoading || miningState === 'loading') {
      return (
        <Button size="lg" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-4" disabled>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </Button>
      )
    }
    switch (miningState) {
      case 'idle':
        return (
          <Button size="lg" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-4" onClick={handleStartMining}>
            <Zap className="w-4 h-4 mr-2" />
            Start Mining
          </Button>
        );
      case 'mining':
        return (
          <Button size="lg" className="w-full bg-gradient-to-r from-purple-800 to-blue-800 text-white/70 mt-4" disabled>
            <Zap className="w-4 h-4 mr-2" />
            Mining...
          </Button>
        );
      case 'claimable':
        return (
          <Button size="lg" className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white mt-4" onClick={handleClaimReward}>
            <Gift className="w-4 h-4 mr-2" />
            Claim Reward
          </Button>
        );
      default:
        return null;
    }
  }

  const getCardContent = () => {
    switch(miningState){
        case 'mining':
            return (
                <>
                    <h2 className="text-2xl font-bold">{formatTime(timeRemaining)}</h2>
                    <p className="text-muted-foreground">Until session complete</p>
                </>
            );
        case 'claimable':
             return (
                <>
                    <h2 className="text-2xl font-bold">Session Complete</h2>
                    <p className="text-muted-foreground">Claim your 40.0000 PARI reward!</p>
                </>
            );
        default:
             return (
                <>
                    <h2 className="text-2xl font-bold">Start New Session</h2>
                    <p className="text-muted-foreground">Tap to start mining PARI</p>
                </>
            );
    }
  }


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
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<LinkIcon className="w-4 h-4" />} label="PARI Balance" value={userData.pariBalance.toFixed(4)} />
          <StatCard icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Hash Power" value={`${userData.hashPower}x`} />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Base Rate" value={`${userData.baseRate.toFixed(2)}/hr`} />
          <StatCard icon={<Flame className="w-4 h-4 text-orange-400" />} label="Streak" value={userData.streak.toString()} />
        </div>

        <Card className="bg-card/80 backdrop-blur-sm text-center p-6 space-y-4">
          <CardContent className="p-0">
            <div className="flex justify-center items-center mb-4">
              <div className="relative w-32 h-32">
                <Image
                  src="https://ik.imagekit.io/parinetwork/IMG_20250827_125111.jpg?updatedAt=1756725448569"
                  alt="PARI Network"
                  width={128}
                  height={128}
                  data-ai-hint="network logo"
                  className="rounded-full"
                />
                 {miningState === 'mining' && (
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className="relative w-full h-full">
                            <div className="absolute top-1/2 left-0 h-0.5 w-full bg-primary/70 animate-line-across-blue" />
                            <div className="absolute top-1/2 left-0 h-0.5 w-full bg-accent/70 animate-line-across-orange" />
                        </div>
                    </div>
                 )}
                <div className="absolute bottom-0 right-0 bg-card rounded-full p-2 border-2 border-primary">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
            {getCardContent()}
            <MiningButton />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm p-4">
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground">Next Reward</p>
            <p className="text-2xl font-bold text-green-400 mt-1">40.0000 PARI</p>
            <p className="text-xs text-muted-foreground">10 x 1x (Normal) x 1x</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm p-4">
          <CardContent className="p-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-accent" />
                  <h3 className="text-lg font-bold">Upgrade to VIP</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Double mining speed + Ad-free experience
                </p>
              </div>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/vip">Upgrade</Link>
              </Button>
            </div>
            <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Users className="w-4 h-4" />
                    <span>FCFS Limited Slots</span>
                </div>
              <Progress value={7.5} className="h-2 bg-muted" />
              <div className="text-right text-sm text-muted-foreground mt-1">1500 / 20000</div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" isActive />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" href="/news" />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" />
        </div>
      </footer>
    </div>
  );
}
