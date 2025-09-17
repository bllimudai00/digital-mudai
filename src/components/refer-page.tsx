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
  MessageCircle,
  Send,
  Smartphone,
  Mail,
  Info,
  Zap,
  Newspaper,
  ListChecks,
  User,
} from "lucide-react";
import Link from "next/link";

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


export default function ReferPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
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
            value="0"
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
                className="pr-12 bg-card/80 border-border"
              />
              <Button
                variant="ghost"
                size="icon"
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
                className="pr-12 bg-card/80 border-border"
              />
              <Button
                variant="ghost"
                size="icon"
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

        <Card className="bg-card/80 backdrop-blur-sm text-center p-6 space-y-4">
          <CardContent className="p-0 flex flex-col items-center justify-center">
            <Users className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-bold">Your Referred Users</h3>
            <div className="flex flex-col items-center text-center text-muted-foreground mt-4">
                <Info className="w-8 h-8 mb-2" />
                <p>You haven't referred anyone yet.</p>
                <p>Share your code to start earning!</p>
            </div>
          </CardContent>
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
