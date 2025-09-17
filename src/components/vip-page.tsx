"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Star,
  ShieldCheck,
  Zap,
  Droplets,
  Crown,
  Copy,
  HelpCircle,
  Newspaper,
  ListChecks,
  Gift,
  User,
  Upload,
  Loader,
  BadgeCheck,
  Clock,
  XCircle,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "./ui/input";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { submitVipProof, getGlobalSettings } from "@/app/actions";
import { UserData, GlobalSettings } from "@/lib/types";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Progress } from "./ui/progress";

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

const faqData = [
    {
        question: "How do I upgrade to VIP?",
        answer: "Send the specified USDT amount to the wallet address above, then submit your Transaction ID for manual verification."
    },
    {
        question: "How long does verification take?",
        answer: "Usually 2-24 hours. Admin manually verifies payment proof."
    },
    {
        question: "What if my payment is not verified?",
        answer: "Contact support with your transaction details. We'll help resolve any issues."
    },
    {
        question: "Can I get a refund?",
        answer: "VIP membership is non-refundable. Please read terms before upgrading."
    }
]

function UpgradeToVipForm({ userId }: { userId: string }) {
    const [transactionId, setTransactionId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionId) {
            toast({ title: "Error", description: "Please enter a Transaction ID.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const result = await submitVipProof(userId, transactionId);
        setIsLoading(false);

        if (result.success) {
            toast({ title: "Success", description: result.message });
            setTransactionId("");
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    return (
         <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground ml-1 mb-1 block">Payment Amount (USDT)</label>
              <Input type="text" readOnly value="5" className="bg-background" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground ml-1 mb-1 block">Transaction ID</label>
              <Input 
                type="text" 
                placeholder="Enter transaction hash/ID" 
                className="bg-background"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" type="submit" disabled={isLoading}>
              {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isLoading ? "Submitting..." : "Submit for Verification"}
            </Button>
        </form>
    )
}

function VipStatus({ status, userId, walletAddress }: { status: 'none' | 'pending' | 'approved' | 'rejected', userId: string, walletAddress: string }) {
    
    const { toast } = useToast();
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Wallet address copied to clipboard."
        })
    }
    
    const qrCodeUrl = walletAddress ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}` : "";


    if (status === 'approved') {
        return (
            <div className="text-center bg-green-900/30 border border-green-500/50 p-6 rounded-lg flex flex-col items-center gap-2">
                <BadgeCheck className="w-12 h-12 text-green-400" />
                <h3 className="text-xl font-bold text-white mt-2">VIP Active</h3>
                <p className="text-sm text-muted-foreground">Your VIP membership is approved and active. Enjoy your benefits!</p>
            </div>
        )
    }
     if (status === 'pending') {
        return (
            <div className="text-center bg-yellow-900/30 border border-yellow-500/50 p-6 rounded-lg flex flex-col items-center gap-2">
                <Clock className="w-12 h-12 text-yellow-400" />
                <h3 className="text-xl font-bold text-white mt-2">Verification Pending</h3>
                <p className="text-sm text-muted-foreground">Your proof has been submitted and is awaiting verification (2-24 hours).</p>
            </div>
        )
    }

    // Default view for 'none' or 'rejected'
    return (
        <Tabs defaultValue="payment">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="proof">Submit Proof</TabsTrigger>
          </TabsList>
          <TabsContent value="payment" className="mt-6 space-y-6">
            <div className="text-center bg-muted/50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-accent">$5 USDT</p>
                <p className="text-sm text-muted-foreground">Permanent VIP Membership</p>
            </div>
            {status === 'rejected' && (
                 <div className="text-center bg-red-900/30 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
                    <XCircle className="w-5 h-5"/>
                    <p className="text-sm">Your last submission was rejected. Please re-check your transaction ID and submit again.</p>
                 </div>
            )}
            <div>
                <label className="text-sm text-muted-foreground">Payment Method</label>
                <div className="mt-1 bg-background p-3 rounded-md">
                    <p className="font-bold text-accent">USDT (BEP-20)</p>
                    <p className="text-xs text-muted-foreground">Binance Smart Chain Network</p>
                </div>
            </div>
             <div>
                <label className="text-sm text-muted-foreground">Wallet Address</label>
                <div className="relative mt-1">
                    <Input type="text" readOnly value={walletAddress} className="pr-12 bg-background"/>
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => copyToClipboard(walletAddress)}>
                        <Copy className="w-4 h-4"/>
                    </Button>
                </div>
            </div>
            {qrCodeUrl && (
                <div className="flex flex-col items-center gap-2">
                    <Image src={qrCodeUrl} width={150} height={150} alt="QR Code" data-ai-hint="qr code" />
                    <p className="text-sm text-muted-foreground">Scan QR Code</p>
                </div>
            )}
          </TabsContent>
          <TabsContent value="proof">
            <UpgradeToVipForm userId={userId} />
          </TabsContent>
        </Tabs>
    );
}

export default function VipPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);


  useEffect(() => {
    const FAKE_USER_ID = 'user_placeholder_id';
    
    // Listen for user data
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const user = doc.data() as UserData;
            if (user.vipStatus === 'approved' && !user.vip) {
                user.vip = true;
            } else if (user.vipStatus !== 'approved' && user.vip) {
                user.vip = false;
            }
            setUserData(user);
        }
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
    });

    // Listen for global settings
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
         if (doc.exists()) {
            setSettings(doc.data() as GlobalSettings);
        }
    }, (error) => {
        console.error("Error fetching real-time settings:", error);
    });

    return () => {
        unsubscribeUser();
        unsubscribeSettings();
    };
  }, []);

  const claimedSlots = settings?.claimedVipSlots || 0;
  const totalSlots = settings?.totalVipSlots || 1;
  const progressPercentage = (claimedSlots / totalSlots) * 100;
  const walletAddress = settings?.vipWalletAddress || "0x10FA107AF74434313841FB36F4547ac";

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
        <header className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">PARI NETWORK</h1>
            </div>
            <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts On
            </Button>
        </header>

      <main className="flex-1 p-4 space-y-6 pb-24">
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-accent" />
              VIP Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <BenefitCard
              icon={<ShieldCheck className="w-6 h-6 text-blue-400" />}
              title="Verified Status"
              description="Blue tick with profile"
              className="bg-blue-900/30 border-blue-500/30"
            />
            <BenefitCard
              icon={<Zap className="w-6 h-6 text-green-400" />}
              title="Double Mining Speed"
              description="Double your mining rewards permanently"
              className="bg-green-900/30 border-green-500/30"
            />
            <BenefitCard
              icon={<Droplets className="w-6 h-6 text-purple-400" />}
              title="Extra Airdrop Allocation"
              description="Priority support and special airdrop allocation"
              className="bg-purple-900/30 border-purple-500/30"
            />
             <Card className="bg-card/80 backdrop-blur-sm p-4">
                <CardContent className="p-0">
                    <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Users className="w-4 h-4" />
                            <span>FCFS Limited Slots</span>
                        </div>
                    <Progress value={progressPercentage} className="h-2 bg-muted" />
                    <div className="text-right text-sm text-muted-foreground mt-1">{claimedSlots} / {totalSlots}</div>
                    </div>
                </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-accent" />
              Upgrade to VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData && settings ? (
                <VipStatus 
                    status={userData.vipStatus || 'none'} 
                    userId={userData.id}
                    walletAddress={walletAddress}
                />
            ) : (
                <div className="flex justify-center items-center p-8">
                    <Loader className="w-8 h-8 animate-spin" />
                </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    VIP FAQ & Support
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible>
                    {faqData.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-green-400 text-left">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>

      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" href="/news" />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" />
        </div>
      </footer>
    </div>
  );
}
