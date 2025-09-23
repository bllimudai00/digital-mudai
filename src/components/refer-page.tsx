
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Gift,
  Users,
  BarChart,
  Link as LinkIcon,
  Send,
  Smartphone,
  Mail,
  Info,
  Zap,
  ListChecks,
  User,
  Loader,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import type { UserData, Referral } from "@/lib/types";
import { onSnapshot, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthContext } from "@/context/AuthContext";


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
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const { toast } = useToast();
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  useEffect(() => {
    if (!authContext?.user?.id) return;

    const userRef = doc(db, 'users', authContext.user.id);
    const unsubscribe = onSnapshot(userRef, async (doc) => {
        if (doc.exists()) {
            const user = { id: doc.id, ...doc.data() } as UserData;
            setUserData(user);

            if (user.referrals && user.referrals.length > 0) {
                setLoadingReferrals(true);
                const fetchedReferrals: Referral[] = [];
                const batchSize = 30; // Firestore 'in' query limit
                for (let i = 0; i < user.referrals.length; i += batchSize) {
                    const batchIds = user.referrals.slice(i, i + batchSize);
                    if(batchIds.length > 0) {
                        try {
                            const q = query(collection(db, 'users'), where('__name__', 'in', batchIds));
                            const usersSnapshot = await getDocs(q);
                            usersSnapshot.forEach(userSnap => {
                                if (userSnap.exists()) {
                                    const referralData = userSnap.data();
                                    fetchedReferrals.push({
                                        id: userSnap.id,
                                        name: referralData.name || `Friend ${userSnap.id.substring(0, 4)}`,
                                        avatar: `https://picsum.photos/seed/${userSnap.id}/40`
                                    });
                                }
                            });
                        } catch (error) {
                            console.error(`Failed to fetch referral batch`, error);
                            toast({ title: "Error", description: "Could not load some referral details.", variant: "destructive" });
                        }
                    }
                }
                setReferrals(fetchedReferrals.reverse()); // Show newest referrals first
                setLoadingReferrals(false);
            } else {
                setReferrals([]);
                setLoadingReferrals(false);
            }
        } else {
             setUserData(null);
             setReferrals([]);
             setLoadingReferrals(false);
        }
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
        toast({ title: "Error", description: "Could not load real-time user data.", variant: "destructive" });
        setLoadingReferrals(false);
    });

    return () => unsubscribe();
  }, [authContext?.user?.id, toast]);


  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `Your referral link has been copied.`,
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
       toast({
        title: "Error",
        description: `Failed to copy the link.`,
        variant: "destructive",
      });
    });
  };

  const referralLink = userData?.referralCode ? `http://t.me/Parinetworkbot/parinetwork?startapp=${userData.referralCode}` : "";

  if (authContext?.loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        
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
                onClick={() => copyToClipboard(referralLink)}
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
            {loadingReferrals ? (
                 <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>
            ) : referrals.length > 0 ? (
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
            icon={<ListChecks className="w-6 h-6" />}
            label="Tasks"
            href="/tasks"
          />
          <BottomNavItem
            icon={<Gift className="w-6 h-6" />}
            label="Refer"
            href="/refer"
            isActive={true}
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

    