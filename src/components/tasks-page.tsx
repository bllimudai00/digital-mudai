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
  CheckCircle2,
  Loader,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getInitialUserData, claimTaskReward } from "@/app/actions";
import type { Task, UserData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

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

function TaskCard({ task, userData, onClaim }: { task: Task, userData: UserData | null, onClaim: (taskId: string) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const isCompleted = userData?.tasks?.includes(task.id);
    const referralCount = userData?.referrals?.length || 0;

    let buttonState: 'claim' | 'completed' | 'go_to_refer' | 'loading' | 'requirement_not_met' | 'external' = 'external';
    let buttonLabel = "Complete Task";
    let buttonIcon = <ExternalLink className="w-4 h-4 mr-1" />;
    let buttonClassName = "";
    let isDisabled = false;

    if (isCompleted) {
        buttonState = 'completed';
    } else if (task.type === 'referral_milestone') {
        if (referralCount >= (task.requiredCount || 0)) {
            buttonState = 'claim';
        } else {
            buttonState = 'go_to_refer';
        }
    } else { // external tasks
        buttonState = 'claim';
    }


    const handleClaim = async () => {
        setIsLoading(true);
        await onClaim(task.id);
        setIsLoading(false);
    }
    
    switch(buttonState) {
        case 'completed':
            buttonLabel = "Claimed";
            buttonIcon = <CheckCircle2 className="w-4 h-4 mr-1" />;
            isDisabled = true;
            buttonClassName = "bg-green-500/20 text-green-400";
            break;
        case 'claim':
            buttonLabel = "Claim Reward";
            buttonIcon = <Gift className="w-4 h-4 mr-1" />;
            buttonClassName = "bg-green-500 hover:bg-green-600 text-white";
            break;
        case 'go_to_refer':
            buttonLabel = "Go to Refer";
            buttonIcon = <Users className="w-4 h-4 mr-1" />;
            buttonClassName = "bg-card-foreground/10 text-foreground hover:bg-card-foreground/20";
            break;
        case 'external':
            buttonLabel = "Complete Task";
            buttonIcon = <ExternalLink className="w-4 h-4 mr-1" />;
            break;
    }
    
    if (isLoading) {
        buttonLabel = "Claiming...";
        buttonIcon = <Loader className="w-4 h-4 mr-1 animate-spin" />;
        isDisabled = true;
    }

    const description = task.type === 'referral_milestone' 
        ? `Invite ${task.requiredCount} friends to join Pari Network. (${referralCount}/${task.requiredCount})`
        : task.title;

    const icon = task.type === 'referral_milestone' 
        ? <Users className="w-5 h-5 text-primary" /> 
        : <Gift className="w-5 h-5 text-accent" />;

    const handleButtonClick = () => {
        if (buttonState === 'go_to_refer') {
            // This requires client-side navigation, so we can't use Link directly in the button
            // but for this demo we'll just wrap it in a Link
            return;
        }
        if (buttonState === 'claim') {
            handleClaim();
        }
        // For 'external', we assume the user navigates away and comes back.
        // In a real app, you might open a new tab.
    };

    const ButtonComponent = (
        <Button size="sm" className={buttonClassName} onClick={handleButtonClick} disabled={isDisabled}>
            {buttonIcon}
            {buttonLabel}
        </Button>
    );

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <h3 className="text-md font-bold">{task.title}</h3>
                </div>
                {task.type === 'referral_milestone' && 
                    <p className="text-xs text-muted-foreground mb-2">{description}</p>
                }
                <p className="text-green-400 font-bold text-sm">+{task.reward} PARI</p>
            </div>
            {buttonState === 'go_to_refer' ? (
                <Link href="/refer" passHref>
                    {ButtonComponent}
                </Link>
            ) : (
                ButtonComponent
            )}
        </div>
      </CardContent>
    </Card>
  );
}


export default function TasksPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const data = await getInitialUserData();
        if(data) {
            setTasks(data.tasks);
        }
        setLoading(false);
    }
    fetchData();

    const FAKE_USER_ID = 'user_placeholder_id';
    const unsub = onSnapshot(doc(db, "users", FAKE_USER_ID), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      }
    });

    return () => unsub();
  }, []);

  const handleClaim = async (taskId: string) => {
    if (!userData) return;
    const result = await claimTaskReward(userData.id, taskId);
    if (result.success) {
      toast({
        title: "Reward Claimed!",
        description: `You've received +${result.reward} PARI.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to claim reward.",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <div className="flex items-center gap-2 text-xl font-bold">
          <ListChecks className="w-6 h-6" />
          <h1>Earn More with Tasks</h1>
        </div>
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} userData={userData} onClaim={handleClaim} />
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
