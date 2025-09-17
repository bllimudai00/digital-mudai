"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Link,
  TrendingUp,
  Zap,
  Flame,
  Crown,
  Users,
  Newspaper,
  ListChecks,
  Gift,
  User,
} from "lucide-react";
import Image from "next/image";

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
  isActive = false,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </div>
  );
}

export default function MiningPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Link className="w-4 h-4" />} label="PARI Balance" value="1080.00" />
          <StatCard icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Hash Power" value="1x" />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Base Rate" value="10.00/hr" />
          <StatCard icon={<Flame className="w-4 h-4 text-orange-400" />} label="Streak" value="16" />
        </div>

        <Card className="bg-card/80 backdrop-blur-sm text-center p-6 space-y-4">
          <CardContent className="p-0">
            <div className="flex justify-center items-center mb-4">
              <div className="relative w-32 h-32">
                <Image
                  src="https://picsum.photos/seed/pari/200"
                  alt="PARI Network"
                  width={128}
                  height={128}
                  data-ai-hint="network logo"
                  className="rounded-full"
                />
                <div className="absolute bottom-0 right-0 bg-card rounded-full p-2 border-2 border-primary">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold">Session Complete</h2>
            <p className="text-muted-foreground">Claim your 40.0000 PARI reward!</p>
            <Button size="lg" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-4">
              <Zap className="w-4 h-4 mr-2" />
              Claim Reward
            </Button>
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
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Upgrade</Button>
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
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" isActive />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" />
        </div>
      </footer>
    </div>
  );
}
