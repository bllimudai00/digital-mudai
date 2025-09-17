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
  X,
  Wrench,
  ChevronRight,
  Mail,
  Calendar,
  Zap,
  Newspaper,
  ListChecks,
  Gift,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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

function ProfileMenuItem({
  icon,
  label,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between py-3">
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </Link>
  );
}

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
)

export default function ProfilePage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-bold">Profile</h1>

        <Card className="bg-card/80 backdrop-blur-sm p-6">
          <CardContent className="p-0 flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
              <AvatarImage src="https://picsum.photos/seed/pari/200" alt="User Avatar" data-ai-hint="network logo" />
              <AvatarFallback>BSR</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">Balram Singh Rajput</h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
              <Mail className="w-4 h-4" />
              <span>seemarajput8540@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>Member since August 2025</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
                <p className="text-sm">Your referral code: <span className="text-accent font-bold">PARIRBESS8</span></p>
            </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<ShieldCheck className="w-5 h-5 text-primary" />} label="VIP Membership" href="/vip" />
            <ProfileMenuItem icon={<History className="w-5 h-5 text-primary" />} label="Mining History" />
            <ProfileMenuItem icon={<Users className="w-5 h-5 text-primary" />} label="My Referrals" />
            <ProfileMenuItem icon={<Settings className="w-5 h-5 text-primary" />} label="Account Settings" />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<Map className="w-5 h-5 text-muted-foreground" />} label="Roadmap" />
            <ProfileMenuItem icon={<FileText className="w-5 h-5 text-muted-foreground" />} label="White Paper" />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<Shield className="w-5 h-5 text-muted-foreground" />} label="Privacy Policy" />
            <ProfileMenuItem icon={<FileJson className="w-5 h-5 text-muted-foreground" />} label="Terms of Service" />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 divide-y divide-border">
            <ProfileMenuItem icon={<Send className="w-5 h-5 text-muted-foreground" />} label="Official Channel" />
            <ProfileMenuItem icon={<MessageSquare className="w-5 h-5 text-muted-foreground" />} label="Join Group Chat" />
            <ProfileMenuItem icon={<XIcon />} label="Follow us on X" />
            <ProfileMenuItem icon={<Wrench className="w-5 h-5 text-muted-foreground" />} label="Get Support" />
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" href="/news" />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" isActive />
        </div>
      </footer>
    </div>
  );
}
