"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { claimTaskReward } from "@/app/actions";
import type { Task, UserData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { onSnapshot, doc, collection } from "firebase/firestore";
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
    const [isExternalTaskPending, setIsExternalTaskPending] = useState(false);
    const { toast } = useToast();

    const isCompleted = userData?.tasks?.includes(task.id);
    const referralCount = userData?.referrals?.length || 0;

    let buttonState: 'claim' | 'completed' | 'go_to_refer' | 'loading' | 'requirement_not_met' | 'external_verify' | 'external_initial' = 'external_initial';
    
    if (isCompleted) {
        buttonState = 'completed';
    } else if (isLoading) {
        buttonState = 'loading';
    } else if (task.type === 'referral_milestone') {
        if (referralCount >= (task.requiredCount || 0)) {
            buttonState = 'claim';
        } else {
            buttonState = 'go_to_refer';
        }
    } else if (task.type === 'external') {
        if (isExternalTaskPending) {
            buttonState = 'external_verify';
        } else {
            buttonState = 'external_initial';
        }
    }

    const handleClaim = async () => {
        setIsLoading(true);
        await onClaim(task.id);
        setIsLoading(false);
        setIsExternalTaskPending(false); // Reset pending state after claim attempt
    };
    
    const handleExternalTask = () => {
        if (task.url) {
            window.open(task.url, '_blank', 'noopener,noreferrer');
            setIsExternalTaskPending(true);
             toast({
                title: "Task in Progress",
                description: "Once you have completed the task, come back and click Verify.",
            });
        } else {
            toast({
                title: "Error",
                description: "This task has no URL configured.",
                variant: "destructive",
            });
        }
    }

    const getButtonContent = () => {
        switch(buttonState) {
            case 'completed':
                return { label: "Claimed", icon: <CheckCircle2 className="w-4 h-4 mr-1" />, disabled: true };
            case 'loading':
                return { label: "Claiming...", icon: <Loader className="w-4 h-4 mr-1 animate-spin" />, disabled: true };
            case 'claim':
                return { label: "Claim Reward", icon: <Gift className="w-4 h-4 mr-1" />, disabled: false };
            case 'go_to_refer':
                return { label: "Go to Refer", icon: <Users className="w-4 h-4 mr-1" />, disabled: false };
            case 'external_initial':
                return { label: "Go", icon: <ExternalLink className="w-4 h-4 mr-1" />, disabled: false };
            case 'external_verify':
                return { label: "Verify", icon: <BadgeCheck className="w-4 h-4 mr-1" />, disabled: false };
            default:
                 return { label: "Go", icon: <ExternalLink className="w-4 h-4 mr-1" />, disabled: false };
        }
    }

    const { label, icon, disabled } = getButtonContent();
    
    const description = task.type === 'referral_milestone' && task.requiredCount
        ? `Invite ${task.requiredCount} friends to join Pari Network.`
        : task.title;

    const taskIcon = task.type === 'referral_milestone' 
        ? <Users className="w-5 h-5 text-primary" /> 
        : <Gift className="w-5 h-5 text-accent" />;

    const handleButtonClick = () => {
        if (buttonState === 'go_to_refer') {
            // The Link component will handle navigation
            return;
        }
        if (buttonState === 'claim' || buttonState === 'external_verify') {
            handleClaim();
        }
        if (buttonState === 'external_initial') {
            handleExternalTask();
        }
    };
    
    const progressValue = (task.requiredCount && referralCount) ? (referralCount / task.requiredCount) * 100 : 0;

    const ButtonComponent = (
        <Button size="sm" onClick={handleButtonClick} disabled={disabled} className={isCompleted ? "bg-green-500/20 text-green-400 cursor-not-allowed hover:bg-green-500/20" : ""}>
            {icon}
            {label}
        </Button>
    );

  return (
    <Card className={`bg-card/80 backdrop-blur-sm transition-all ${isCompleted ? 'opacity-70' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                    {taskIcon}
                    <h3 className="text-md font-bold">{task.title}</h3>
                </div>
                {task.type === 'referral_milestone' && task.requiredCount && !isCompleted &&
                    <>
                        <p className="text-xs text-muted-foreground mb-2">{description}</p>
                        <div className="flex items-center gap-2">
                           <Progress value={progressValue} className="w-full h-1.5" />
                           <span className="text-xs font-semibold text-muted-foreground">{referralCount}/{task.requiredCount}</span>
                        </div>
                    </>
                }
                 {task.type === 'referral_milestone' && isCompleted &&
                    <p className="text-xs text-muted-foreground mb-2">Requirement met: {task.requiredCount} referrals</p>
                }
                <p className="text-green-400 font-bold text-sm mt-2">+{task.reward} PARI</p>
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
  const [dataLoaded, setDataLoaded] = useState({ user: false, tasks: false });
  const { toast } = useToast();

  useEffect(() => {
    const FAKE_USER_ID = 'user_placeholder_id';
    
    // Listen for user data
    const userRef = doc(db, 'users', FAKE_USER_ID);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            setUserData(doc.data() as UserData);
        }
        setDataLoaded(prev => ({...prev, user: true}));
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
        setDataLoaded(prev => ({...prev, user: true}));
    });
    
    // Listen for tasks data
    const tasksCollection = collection(db, 'tasks');
    const q = query(tasksCollection, orderBy("order"));
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task);
        setTasks(tasksList);
        setDataLoaded(prev => ({...prev, tasks: true}));
    }, (error) => {
        console.error("Error fetching real-time tasks:", error);
        setDataLoaded(prev => ({...prev, tasks: true}));
    });

    return () => {
        unsubscribeUser();
        unsubscribeTasks();
    };
  }, []);

  useEffect(() => {
    if (dataLoaded.user && dataLoaded.tasks) {
        setLoading(false);
    }
  }, [dataLoaded]);


  const handleClaim = async (taskId: string) => {
    if (!userData) return;
    const result = await claimTaskReward(userData.id, taskId);
    if (result.success) {
      toast({
        title: "Reward Claimed!",
        description: `You've received +${result.reward} PARI.`,
      });
      // Data will refresh automatically via snapshot listener
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
        {tasks.length > 0 ? (
            <div className="space-y-4">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} userData={userData} onClaim={handleClaim} />
            ))}
            </div>
        ) : (
             <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
                <CardContent className="p-0 flex flex-col items-center">
                <ListChecks className="w-12 h-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold">No Tasks Available</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Check back later for more ways to earn.
                </p>
                </CardContent>
            </Card>
        )}
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
