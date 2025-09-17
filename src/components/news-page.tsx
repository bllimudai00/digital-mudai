"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  Zap,
  ListChecks,
  Gift,
  User,
  Gamepad2,
  Trophy,
  Wallet,
  Star,
  Flame,
} from "lucide-react";

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

function NewsArticle({ article }: { article: any }) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold pr-2">{article.title}</h3>
          <Badge variant="outline" className="text-xs capitalize">{article.priority}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{article.date}</p>
        <div className="text-sm text-muted-foreground space-y-4">
            {article.content.map((item: any, index: number) => (
                <div key={index}>
                    {item.type === 'paragraph' && <p>{item.text}</p>}
                    {item.type === 'section' && (
                        <div>
                            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                                {item.icon}
                                <h4>{item.title}</h4>
                                {item.icon}
                            </div>
                            <p>{item.text}</p>
                        </div>
                    )}
                    {item.type === 'coming-soon' && (
                         <p className="font-semibold text-foreground flex items-center gap-2">
                            <span>{item.text}</span>
                            <Flame className="w-4 h-4 text-orange-400" />
                        </p>
                    )}
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

const newsData = [
  {
    title: "🔥 New Fighting Game Coming Soon to Pari Network! 🔥",
    date: "Sep 4, 2025",
    priority: "low",
    content: [
      {
        type: 'paragraph',
        text: 'Pari Network will soon launch a new fighting game that will be directly available inside the app. This game will be easy and fun for everyone.'
      },
      {
        type: 'section',
        title: "Simple and Fun Gameplay",
        icon: <Gamepad2 className="w-4 h-4" />,
        text: "Choose your favorite character and fight against other players or smart bots. The game will be fast and exciting!",
      },
      {
        type: 'section',
        title: "Earn Crypto Tokens While You Play",
        icon: <Wallet className="w-4 h-4" />,
        text: "Win battles and earn Pari Network crypto tokens as rewards. Your earnings will be safe and secured by smart contracts.",
      },
      {
        type: 'section',
        title: "What's Next?",
        icon: <Star className="w-4 h-4" />,
        text: "Soon, new features like tournaments and ranking systems will be added to make the game even more enjoyable.",
      },
      {
        type: 'coming-soon',
        text: "Coming soon!",
      }
    ],
  },
  {
    title: "Our Launching Plan: Bringing Innovation to You",
    date: "Sep 1, 2025",
    priority: "low",
    content: [
      {
        type: 'paragraph',
        text: "We are excited to announce that the launch of our project is on the horizon. Our plan is to introduce the application in phases, ensuring thorough testing, user feedback, and continuous improvements."
      },
      {
        type: 'paragraph',
        text: "The launch will include a special campaign to engage users, share exclusive previews, and highlight the unique features powered by AI, gaming, Web 3.0, and Pari blockchain. We aim to provide a seamless and impactful experience from day one."
      },
      {
        type: 'paragraph',
        text: "Stay tuned for updates and be ready to explore a new era of digital innovation with us!"
      }
    ]
  },
  {
    title: "Pari Blockchain Integration in Our Project",
    date: "Sep 1, 2025",
    priority: "low",
    content: [
        {
            type: 'paragraph',
            text: "Our project incorporates the cutting-edge Pari blockchain to power secure, scalable, and decentralized digital solutions. Pari blockchain offers enhanced speed, low transaction costs, and high security, making it ideal for gaming, AI, and Web 3.0 applications."
        },
        {
            type: 'paragraph',
            text: "By leveraging Pari blockchain, we provide users with true ownership of digital assets, transparent smart contract automation, and reliable data integrity. This integration boosts trust and efficiency in both virtual and real-world use cases."
        },
        {
            type: 'paragraph',
            text: "Pari blockchain's advanced technology strengthens our project's mission to deliver innovative, user-centric, and future-proof digital experiences."
        }
    ]
  },
];

export default function NewsPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Newspaper className="w-6 h-6" />
          <h1>News & Updates</h1>
        </div>
        <div className="space-y-4">
          {newsData.map((article, index) => (
            <NewsArticle key={index} article={article} />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" isActive />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" />
        </div>
      </footer>
    </div>
  );
}
