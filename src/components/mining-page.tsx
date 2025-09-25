
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Link as LinkIcon,
  TrendingUp,
  Zap,
  Crown,
  Users,
  ListChecks,
  Gift,
  User,
  Loader,
  ShieldCheck,
  Droplets,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import { claimReward, startMiningSession } from "@/app/actions";
import type { UserData, GlobalSettings } from "@/lib/types";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";


function BalanceCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card className={`bg-card/50 backdrop-blur-sm p-4 border border-blue-500/20 shadow-lg shadow-blue-500/5 ${className}`}>
      <CardContent className="p-0 text-center">
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="font-bold mt-1 text-[clamp(1.75rem,1.25rem+2.5vw,2.25rem)]">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function BenefitCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={`bg-card/80 backdrop-blur-sm p-4 ${className}`}>
      <CardContent className="p-0 flex items-center gap-4">
        <div className="p-2 bg-black/20 rounded-lg">{icon}</div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, title, value, className }: { icon: React.ReactNode, title: string, value: string, className?: string }) {
  return (
    <Card className={`bg-card/80 backdrop-blur-sm p-4 ${className}`}>
      <CardContent className="p-0 flex items-center gap-4">
        <div className="p-3 bg-black/20 rounded-xl">{icon}</div>
        <div>
          <h3 className="font-bold text-white text-[clamp(1.125rem,1rem+0.625vw,1.25rem)]">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
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
      } transition-colors duration-200`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
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
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [miningState, setMiningState] = useState<'idle' | 'mining' | 'claimable' | 'loading'>('loading');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showFloatingText, setShowFloatingText] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  useEffect(() => {
    if (!authContext?.user?.id) return;
    
    // Real-time listener for user updates
    const userRef = doc(db, 'users', authContext.user.id);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as UserData;
            if (data.vipStatus === 'approved' && !data.vip) {
                data.vip = true;
            } else if (data.vipStatus !== 'approved' && data.vip) {
                data.vip = false;
            }
            setUserData({ ...data, id: doc.id });
        } else {
            setUserData(null);
        }
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
    });

    // Real-time listener for settings updates
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setSettings(doc.data() as GlobalSettings);
        }
    });

    return () => {
        unsubscribeUser();
        unsubscribeSettings();
    };
  }, [authContext?.user?.id]);


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
    await startMiningSession(userData.id);
    setIsActionLoading(false);
  };

  const handleClaimReward = async () => {
    if (!userData || miningState !== 'claimable') return;
    setIsActionLoading(true);
    const result = await claimReward(userData.id);
    if(result.success && result.reward) {
        setClaimedAmount(result.reward);
        setShowFloatingText(true);
        setTimeout(() => setShowFloatingText(false), 2000);
    }
    setIsActionLoading(false);
  };

  const MiningButton = () => {
    if (isActionLoading || miningState === 'loading') {
      return (
        <Button size="lg" className="w-full text-white mt-6 shadow-lg shadow-blue-500/20" disabled>
          <Loader className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </Button>
      )
    }
    switch (miningState) {
      case 'idle':
        return (
          <Button size="lg" className="w-full bg-gradient-to-r from-primary to-accent text-white mt-6 shadow-lg shadow-blue-500/30 hover:opacity-90 transition-opacity" onClick={handleStartMining}>
            <Zap className="w-5 h-5 mr-2" />
            Start Mining
          </Button>
        );
      case 'mining':
        return (
          <Button size="lg" className="w-full bg-secondary text-white/70 mt-6" disabled>
            <Zap className="w-5 h-5 mr-2 animate-pulse" />
            Mining...
          </Button>
        );
      case 'claimable':
        return (
          <Button size="lg" className="relative overflow-hidden w-full bg-gradient-to-r from-green-500 to-teal-500 text-white mt-6 shadow-lg shadow-green-500/30" onClick={handleClaimReward}>
            <Gift className="w-5 h-5 mr-2" />
            Claim Reward
          </Button>
        );
      default:
        return null;
    }
  }

  const baseRate = settings?.baseRate ?? userData?.baseRate ?? 10.0;
  const rewardAmount = userData ? (baseRate * 4 * (userData.vipStatus === 'approved' ? 2 : 1)) : 40;

  const getCardContent = () => {
    switch(miningState){
        case 'mining':
            return (
                <>
                    <h2 className="text-[clamp(1.5rem,1rem+2.5vw,1.875rem)] font-bold font-mono tracking-widest">{formatTime(timeRemaining)}</h2>
                    <p className="text-muted-foreground text-sm">Until session complete</p>
                </>
            );
        case 'claimable':
             return (
                <>
                    <h2 className="text-[clamp(1.5rem,1rem+2.5vw,1.875rem)] font-bold">Session Complete</h2>
                    <p className="text-muted-foreground text-sm">Claim your {rewardAmount.toFixed(4)} PARI reward!</p>
                </>
            );
        default:
             return (
                <>
                    <h2 className="text-[clamp(1.5rem,1rem+2.5vw,1.875rem)] font-bold">Start New Session</h2>
                    <p className="text-muted-foreground text-sm">Tap to start mining PARI</p>
                </>
            );
    }
  }

  const claimedSlots = settings?.claimedVipSlots || 0;
  const totalSlots = settings?.totalVipSlots || 1;
  const progressPercentage = (claimedSlots / totalSlots) * 100;

  if (authContext?.loading || !userData || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="text-foreground min-h-screen flex flex-col font-body">
      <header className="p-4 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <Image
              src="https://ik.imagekit.io/parinetwork/IMG_20250827_125111.jpg?updatedAt=1756725448569"
              alt="PARI NETWORK Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <h1 className="text-xl font-bold text-white">PARI NETWORK</h1>
        </div>
      </header>
      
      <main className="flex-1 p-4 space-y-6 pb-24">
        <BalanceCard icon={<LinkIcon className="w-5 h-5 text-cyan-400" />} label="PARI Balance" value={(userData.pariBalance as number).toFixed(4)} />

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Zap className="w-6 h-6 text-cyan-400" />} title="Base Rate" value={`${baseRate.toFixed(2)}/hr`} />
          <StatCard icon={<TrendingUp className="w-6 h-6 text-cyan-400" />} title="Streak" value={(userData.history?.filter(h => h.type === 'mining').length || 0).toString()} />
        </div>

        <Card className="bg-card/50 backdrop-blur-sm text-center p-6 space-y-4 border-0 shadow-xl shadow-blue-500/5">
          <CardContent className="p-0">
            <div className="flex justify-center items-center mb-4 relative">
               {showFloatingText && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-green-400 animate-float-up z-20">
                        +{claimedAmount.toFixed(4)} PARI
                    </div>
                )}
              <div className="relative w-40 h-40">
                <Image
                  src="https://ik.imagekit.io/parinetwork/IMG_20250827_125111.jpg?updatedAt=1756725448569"
                  alt="PARI Network"
                  width={160}
                  height={160}
                  data-ai-hint="network logo"
                  className="rounded-full shadow-2xl shadow-blue-500/20"
                />
                 {userData.vip && (
                    <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-2.5 border-4 border-background shadow-lg">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                 )}
                <div className="absolute bottom-1 right-1 bg-card rounded-full p-2 border-2 border-primary shadow-md">
                  <Zap className="w-5 h-5 text-primary animate-pulse" />
                </div>
              </div>
            </div>
            {getCardContent()}
            {miningState === 'mining' && (
              <div className="relative w-full my-2 h-2 overflow-hidden">
                  <div className="absolute top-1/2 left-0 h-0.5 w-full bg-primary/70 animate-line-across" />
                  <div className="absolute top-1/2 left-0 h-0.5 w-full bg-accent/70 animate-line-across-reverse" />
              </div>
            )}
            <MiningButton />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm p-4 border border-blue-500/20">
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground">Next Reward</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{rewardAmount.toFixed(4)} PARI</p>
            <p className="text-xs text-muted-foreground">{baseRate.toFixed(2)} x 4h x ({userData.vip ? "VIP 2x" : "Normal 1x"})</p>
          </CardContent>
        </Card>

        {!userData.vip && (
            <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20 p-4">
              <CardContent className="p-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Crown className="w-6 h-6 text-accent"/> Upgrade to VIP</h3>
                    <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shrink-0" size="sm">
                        <Link href="/vip">Upgrade</Link>
                    </Button>
                  </div>
                  <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Users className="w-4 h-4" />
                          <span>FCFS Limited Slots</span>
                      </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="text-right text-sm text-muted-foreground mt-1">{claimedSlots} / {totalSlots}</div>
                  </div>
              </CardContent>
            </Card>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/50 backdrop-blur-sm border-t p-2 z-50">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" isActive={true} />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" />
        </div>
      </footer>
    </div>
  );
}

    