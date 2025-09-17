"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ListChecks,
  Gift,
  Users,
  ExternalLink,
  Zap,
  Newspaper,
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
    <Link href={href}
      className={`flex flex-col items-center gap-1 ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    {task.icon}
                    <h3 className="text-md font-bold">{task.title}</h3>
                </div>
                {task.description && <p className="text-xs text-muted-foreground mb-2">{task.description}</p>}
                <p className="text-green-400 font-bold text-sm">{task.reward}</p>
            </div>
            <Button size="sm" className={task.button.className}>
                {task.button.icon}
                {task.button.label}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const tasksData = [
    {
        icon: <Gift className="w-5 h-5 text-accent" />,
        title: "Join our official Telegram Channel",
        reward: "+10 PARI",
        button: {
            label: "Complete Task",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "",
        }
    },
    {
        icon: <Users className="w-5 h-5 text-primary" />,
        title: "First Referral Bonus",
        description: "Successfully refer your first friend to earn a special bonus.",
        reward: "+50 PARI",
        button: {
            label: "Claim Reward",
            icon: <Gift className="w-4 h-4 mr-1" />,
            className: "bg-green-500 hover:bg-green-600 text-white",
        }
    },
    {
        icon: <Gift className="w-5 h-5 text-accent" />,
        title: "Join our official Telegram group",
        reward: "+10 PARI",
        button: {
            label: "Complete Task",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "",
        }
    },
    {
        icon: <Users className="w-5 h-5 text-primary" />,
        title: "Referral Milestone",
        description: "Invite 50 friends to join Pari Network.",
        reward: "+20 PARI",
        button: {
            label: "Go to Refer",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "bg-card-foreground/10 text-foreground hover:bg-card-foreground/20",
        }
    },
    {
        icon: <Gift className="w-5 h-5 text-accent" />,
        title: "Follow on X",
        reward: "+10 PARI",
        button: {
            label: "Complete Task",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "",
        }
    },
    {
        icon: <Users className="w-5 h-5 text-primary" />,
        title: "Referral Milestone",
        description: "Invite 500 friends to join Pari Network.",
        reward: "+100 PARI",
        button: {
            label: "Go to Refer",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "bg-card-foreground/10 text-foreground hover:bg-card-foreground/20",
        }
    },
    {
        icon: <Users className="w-5 h-5 text-primary" />,
        title: "Referral Milestone",
        description: "Invite 1000 friends to join Pari Network.",
        reward: "+200 PARI",
        button: {
            label: "Go to Refer",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "bg-card-foreground/10 text-foreground hover:bg-card-foreground/20",
        }
    },
    {
        icon: <Users className="w-5 h-5 text-primary" />,
        title: "Referral Milestone",
        description: "Invite 5000 friends to join Pari Network.",
        reward: "+1000 PARI",
        button: {
            label: "Go to Refer",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "bg-card-foreground/10 text-foreground hover:bg-card-foreground/20",
        }
    },
    {
        icon: <Gift className="w-5 h-5 text-accent" />,
        title: "Join the telegram",
        description: "join telegram",
        reward: "+10 PARI",
        button: {
            label: "Complete Task",
            icon: <ExternalLink className="w-4 h-4 mr-1" />,
            className: "",
        }
    }
];

export default function TasksPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <div className="flex items-center gap-2 text-xl font-bold">
          <ListChecks className="w-6 h-6" />
          <h1>Earn More with Tasks</h1>
        </div>
        <div className="space-y-4">
          {tasksData.map((task, index) => (
            <TaskCard key={index} task={task} />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" href="/news" />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" isActive />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" />
        </div>
      </footer>
    </div>
  );
}
