"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Map, Rocket, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";

const roadmapData = [
  {
    phase: "Phase 1",
    title: "Foundation & Launch",
    status: "Completed",
    items: [
      "Concept and Idea Finalization",
      "Core Team Formation",
      "Mobile App Development (Mining, Referrals, Tasks)",
      "Initial User Onboarding",
    ],
  },
  {
    phase: "Phase 2",
    title: "Growth & Engagement",
    status: "In Progress",
    items: [
      "VIP Membership Program Launch",
      "Referral Contest Implementation",
      "News & Updates Section",
      "Admin Panel for Management",
    ],
  },
  {
    phase: "Phase 3",
    title: "Ecosystem Expansion",
    status: "Upcoming",
    items: [
      "PARI Token Launch on DEX",
      "Wallet Integration within App",
      "Staking Program Introduction",
      "First Airdrop Event",
    ],
  },
  {
    phase: "Phase 4",
    title: "Utility & Governance",
    status: "Upcoming",
    items: [
      "P2P Marketplace for PARI",
      "Governance Portal for voting",
      "Partnerships with other projects",
      "Global Community Events",
    ],
  },
];

function RoadmapPhase({ phase, title, status, items }: (typeof roadmapData)[0]) {
  const isCompleted = status === "Completed";
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-bold text-primary">{phase}</p>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={isCompleted ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
          >
            {status}
          </Badge>
        </div>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function RoadmapPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
          <Map className="w-5 h-5" />
          Project Roadmap
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {roadmapData.map((phase) => (
          <RoadmapPhase key={phase.phase} {...phase} />
        ))}
      </main>
    </div>
  );
}
