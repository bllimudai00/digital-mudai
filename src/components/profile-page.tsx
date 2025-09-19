
"use client";

import {
  ShieldCheck,
  History,
  Users,
  Settings,
  Map,
  FileText,
  Shield,
  FileJson,
  Send,
  MessageSquare,
  Wrench,
  ChevronRight,
  Zap,
  ListChecks,
  Gift,
  User,
  Loader,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useContext } from "react";
import type { UserData, GlobalSettings } from "@/lib/types";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "./ui/button";


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

function ProfileMenuItem({
  icon,
  label,
  href,
  isExternal = false,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isExternal?: boolean;
}) {
  const linkContent = (
    <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
            {icon}
            <span className="text-base font-medium">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
  
  if (href === undefined) {
    return <div className="opacity-50 cursor-not-allowed">{linkContent}</div>
  }

  return (
    <Link href={href || ""} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : ""}>
        {linkContent}
    </Link>
  );
}

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
)

export default function ProfilePage() {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  
  useEffect(() => {
    if (!authContext?.user?.id) return;

    // Real-time updates from client-side snapshot listener
    const userRef = doc(db, 'users', authContext.user.id);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const user = doc.data() as UserData;
            
            if (user.vipStatus === 'approved' && !user.vip) {
                user.vip = true;
            } else if (user.vipStatus !== 'approved' && user.vip) {
                user.vip = false;
            }
            setUserData({...user, id: doc.id});
        }
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
    });

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
  }, [authContext?.user?.id]);

  const supportTelegramLink = settings?.supportTelegramUsername
    ? `https://t.me/${settings.supportTelegramUsername}`
    : "";

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
        <h1 className="text-3xl font-bold">Profile</h1>

        <Card className="bg-card/50 backdrop-blur-sm p-6 border-0 shadow-xl shadow-blue-500/5">
          <CardContent className="p-0 flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="w-28 h-28 mb-4 border-4 border-primary shadow-lg shadow-primary/20">
                <AvatarImage src="https://ik.imagekit.io/parinetwork/IMG_20250827_125111.jpg?updatedAt=1756725448569" alt="User Avatar" data-ai-hint="network logo" />
                <AvatarFallback>{userData.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              {userData.vip && (
                <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-1.5 border-4 border-background shadow-md">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold">{userData.name}</h2>
            {userData.username && (
              <p className="text-muted-foreground text-base mt-1">@{userData.username}</p>
            )}
          </CardContent>
        </Card>

        {userData.isAdmin && (
            <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-0">
                    <Link href="/admin" className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <Shield className="w-6 h-6 text-primary" />
                            <span className="text-base font-bold">Admin Panel</span>
                        </div>
                        <Button variant="ghost" size="icon">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )}

        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<ShieldCheck className="w-6 h-6 text-cyan-400" />} label="VIP Membership" href="/vip" />
            <ProfileMenuItem icon={<History className="w-6 h-6 text-cyan-400" />} label="History" href="/history" />
            <ProfileMenuItem icon={<Users className="w-6 h-6 text-cyan-400" />} label="My Referrals" href="/refer" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<Map className="w-6 h-6 text-muted-foreground" />} label="Roadmap" href="/roadmap" />
            <ProfileMenuItem icon={<FileText className="w-6 h-6 text-muted-foreground" />} label="White Paper" href="/white-paper" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<Shield className="w-6 h-6 text-muted-foreground" />} label="Privacy Policy" href="/privacy-policy" />
            <ProfileMenuItem icon={<FileJson className="w-6 h-6 text-muted-foreground" />} label="Terms of Service" href="/terms-of-service" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<Send className="w-6 h-6 text-muted-foreground" />} label="Official Channel" href={settings?.telegramChannelUrl || ""} isExternal />
            <ProfileMenuItem icon={<MessageSquare className="w-6 h-6 text-muted-foreground" />} label="Join Group Chat" href={settings?.telegramGroupUrl || ""} isExternal />
            <ProfileMenuItem icon={<XIcon />} label="Follow us on X" href={settings?.xUrl || ""} isExternal />
            <ProfileMenuItem icon={<Wrench className="w-6 h-6 text-muted-foreground" />} label="Get Support" href={supportTelegramLink} isExternal={!!supportTelegramLink} />
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/50 backdrop-blur-sm border-t p-2 z-50">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" isActive={true} />
        </div>
      </footer>
    </div>
  );
}

    