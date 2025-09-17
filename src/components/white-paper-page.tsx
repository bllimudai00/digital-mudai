"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "1. Introduction",
    content: "PARI Network is a pioneering mobile-first platform designed to democratize access to cryptocurrency. Our mission is to build a global, user-centric ecosystem where earning, learning, and participating in the digital economy is simple, intuitive, and rewarding. Through our mobile application, users can mine PARI tokens, engage with tasks, and benefit from a multi-level referral system, fostering a community-driven approach to growth."
  },
  {
    title: "2. Vision & Mission",
    content: "Our vision is to onboard the next billion users into Web3 by removing the traditional barriers to entry. We aim to create an inclusive financial ecosystem powered by the PARI token. Our mission is to provide a secure, scalable, and user-friendly mobile platform that empowers individuals worldwide to earn cryptocurrency and participate in a decentralized economy without needing expensive hardware or extensive technical knowledge."
  },
  {
    title: "3. Core Features",
    content: "The PARI Network app is built around three core pillars: Mobile Mining (allowing users to earn PARI tokens with minimal battery impact), Task-based Earnings (offering additional rewards for completing simple tasks), and a two-level Referral System (creating network effects and rewarding community growth). The VIP membership further enhances the user experience by offering benefits like doubled mining speed."
  },
  {
    title: "4. Tokenomics",
    content: "The PARI token is the native utility token of the ecosystem. The total supply will be capped, with a significant portion allocated to community rewards, including mining, task completion, and referral commissions. Further allocations will be made for ecosystem development, liquidity, and team incentives. A detailed token distribution and vesting schedule will be released prior to the token generation event (TGE)."
  },
  {
    title: "5. Technology",
    content: "The PARI Network leverages a hybrid on-chain and off-chain architecture to ensure scalability and a smooth user experience. User balances and mining sessions are managed through a secure off-chain ledger for efficiency, with periodic on-chain settlements planned. The platform is built on robust cloud infrastructure, ensuring high availability and security for our users' data and assets."
  },
  {
    title: "6. Roadmap",
    content: "Our development is structured in phases, moving from the foundational launch to ecosystem expansion. Future phases include the PARI token launch on a decentralized exchange (DEX), wallet integration, staking programs, and the development of a governance portal to give the community a voice in the project's future. Please refer to our live Roadmap page for the latest updates."
  }
];

export default function WhitePaperPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" />
          White Paper
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-xl font-bold text-primary mb-2">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
