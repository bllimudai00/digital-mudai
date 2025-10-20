

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
  User,
  CheckCircle2,
  Loader,
  BadgeCheck,
  Send,
  Upload,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import { claimTaskReward } from "@/app/actions";
import type { Task, UserData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { onSnapshot, doc, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { toNano } from "@ton/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

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

function OnChainTaskDialog({ task, isOpen, onOpenChange, onClaim }: { task: Task, isOpen: boolean, onOpenChange: (open: boolean) => void, onClaim: (taskId: string, transactionId: string) => void }) {
    const [transactionId, setTransactionId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [tonConnectUI] = useTonConnectUI();
    const [isSendingTx, setIsSendingTx] = useState(false);

    const handlePayWithWallet = async () => {
        if (!task.toAddress || !task.amount) {
            toast({title: "Error", description: "Task is not configured correctly.", variant: "destructive"});
            return;
        }

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: task.toAddress,
                    amount: toNano(task.amount.toString()).toString(),
                }
            ]
        };

        setIsSendingTx(true);
        try {
            toast({ title: "Confirm Transaction", description: `Please confirm the payment of ${task.amount} TON in your wallet.` });
            const result = await tonConnectUI.sendTransaction(transaction);
            const submittedTxId = "tx_" + result.boc.slice(0, 20) + "..."; // Placeholder
            toast({ title: "Transaction Sent!", description: "Submitting for verification..." });
            
            await handleProofSubmit(submittedTxId);

        } catch (error) {
            toast({ title: "Transaction Failed", description: (error as Error)?.message || "The transaction was rejected or failed.", variant: "destructive" });
        } finally {
            setIsSendingTx(false);
        }
    }
    
    const handleProofSubmit = async (txId?: string) => {
        const finalTxId = txId || transactionId;
        if (!finalTxId) {
            toast({ title: "Error", description: "Please enter a Transaction ID.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        await onClaim(task.id, finalTxId);
        setIsLoading(false);
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Complete On-Chain Task</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">To complete this task, send <span className="font-bold text-primary">{task.amount} TON</span> to the specified address. You can do this automatically with your wallet or manually and paste the transaction ID.</p>
                     <Button size="lg" className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={handlePayWithWallet} disabled={isSendingTx || isLoading}>
                        {isSendingTx ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        {isSendingTx ? "Sending..." : "Perform Transaction with Wallet"}
                    </Button>
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR SUBMIT MANUALLY</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                     <div>
                      <Label htmlFor="txId">Transaction ID</Label>
                      <Input id="txId" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Paste manual transaction ID" disabled={isLoading} />
                    </div>
                </div>
                <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isLoading}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => handleProofSubmit()} disabled={!transactionId || isLoading}>
                        {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isLoading ? 'Submitting...' : 'Submit Proof'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function TaskCard({ task, completedTasks, pendingTasks, referralCount, onClaim, onTxSubmit }: { task: Task, completedTasks: string[], pendingTasks: { [key: string]: string }, referralCount: number, onClaim: (taskId: string) => void, onTxSubmit: (taskId: string, transactionId: string) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isExternalTaskPending, setIsExternalTaskPending] = useState(false);
    const [showTxDialog, setShowTxDialog] = useState(false);
    const { toast } = useToast();

    const isCompleted = completedTasks.includes(task.id);
    const isPending = task.id in pendingTasks;

    let buttonState: 'claim' | 'completed' | 'pending' | 'go_to_refer' | 'loading' | 'requirement_not_met' | 'external_verify' | 'external_initial' | 'perform_transaction' = 'external_initial';
    
    if (isCompleted) {
        buttonState = 'completed';
    } else if (isPending) {
        buttonState = 'pending';
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
    } else if (task.type === 'onchain_transaction') {
        buttonState = 'perform_transaction';
    }


    const handleClaim = async () => {
        setIsLoading(true);
        await onClaim(task.id);
        setIsLoading(false);
        setIsExternalTaskPending(false);
    };
    
    const handleExternalTask = () => {
        if (task.url) {
            window.open(task.url, '_blank', 'noopener,noreferrer');
             toast({
                title: "Task in Progress",
                description: "Please complete the task. The claim button will be enabled shortly.",
            });
            setTimeout(() => {
                setIsExternalTaskPending(true);
            }, 5000); // 5-second delay
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
            case 'pending':
                return { label: "Pending Verification", icon: <Clock className="w-4 h-4 mr-1" />, disabled: true };
            case 'loading':
                return { label: "Claiming...", icon: <Loader className="w-4 h-4 mr-1 animate-spin" />, disabled: true };
            case 'claim':
                return { label: "Claim Reward", icon: <Gift className="w-4 h-4 mr-1" />, disabled: false };
            case 'go_to_refer':
                return { label: "Go to Refer", icon: <Users className="w-4 h-4 mr-1" />, disabled: false };
            case 'external_initial':
                return { label: "Go", icon: <ExternalLink className="w-4 h-4 mr-1" />, disabled: false };
            case 'external_verify':
                return { label: "Claim Reward", icon: <BadgeCheck className="w-4 h-4 mr-1" />, disabled: false };
            case 'perform_transaction':
                return { label: "Perform Task", icon: <Send className="w-4 h-4 mr-1" />, disabled: false };
            default:
                 return { label: "Go", icon: <ExternalLink className="w-4 h-4 mr-1" />, disabled: false };
        }
    }

    const { label, icon, disabled } = getButtonContent();
    
    let description = task.title;
    if(task.type === 'referral_milestone' && task.requiredCount) {
        description = `Invite ${task.requiredCount} friends to join Pari Network.`;
    } else if(task.type === 'onchain_transaction' && task.amount && task.network) {
        description = `Send ${task.amount} ${task.network} to the specified address.`;
    }

    const taskIcon = task.type === 'referral_milestone' 
        ? <Users className="w-5 h-5 text-primary" />
        : task.type === 'onchain_transaction'
        ? <Send className="w-5 h-5 text-red-400" />
        : <Gift className="w-5 h-5 text-accent" />;

    const handleButtonClick = () => {
        if (buttonState === 'go_to_refer') {
            return;
        }
        if (buttonState === 'claim' || buttonState === 'external_verify') {
            handleClaim();
        }
        if (buttonState === 'external_initial') {
            handleExternalTask();
        }
        if(buttonState === 'perform_transaction') {
            setShowTxDialog(true);
        }
    };
    
    const progressValue = (task.requiredCount && referralCount) ? (referralCount / task.requiredCount) * 100 : 0;

    const ButtonComponent = (
        <Button size="sm" onClick={handleButtonClick} disabled={disabled} className={cn(isCompleted ? "bg-green-500/20 text-green-400 cursor-not-allowed hover:bg-green-500/20" : "", isPending ? "bg-yellow-500/20 text-yellow-400 cursor-not-allowed hover:bg-yellow-500/20" : "")}>
            {icon}
            {label}
        </Button>
    );

  return (
      <>
        <Card className={`bg-card/80 backdrop-blur-sm transition-all ${isCompleted || isPending ? 'opacity-70' : ''}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        {taskIcon}
                        <h3 className="text-md font-bold">{task.title}</h3>
                    </div>
                    {(task.type === 'referral_milestone' && task.requiredCount && !isCompleted && !isPending) &&
                        <>
                            <p className="text-xs text-muted-foreground mb-2">{description}</p>
                            <div className="flex items-center gap-2">
                               <Progress value={progressValue} className="w-full h-1.5" />
                               <span className="text-xs font-semibold text-muted-foreground">{referralCount}/{task.requiredCount}</span>
                            </div>
                        </>
                    }
                     {(task.type === 'referral_milestone' && (isCompleted || isPending)) &&
                        <p className="text-xs text-muted-foreground mb-2">Requirement met: {task.requiredCount} referrals</p>
                    }
                    {task.type !== 'referral_milestone' && 
                        <p className="text-xs text-muted-foreground mb-2">{description}</p>
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
        {task.type === 'onchain_transaction' && <OnChainTaskDialog isOpen={showTxDialog} onOpenChange={setShowTxDialog} task={task} onClaim={onTxSubmit} />}
    </>
  );
}


export default function TasksPage() {
  const authContext = useContext(AuthContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [pendingTasks, setPendingTasks] = useState<{ [key: string]: string }>({});
  const [referralCount, setReferralCount] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!authContext?.user?.id) return;

    const userRef = doc(db, 'users', authContext.user.id);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const userData = doc.data() as UserData;
            setCompletedTasks(userData.tasks || []);
            setPendingTasks(userData.pendingTasks || {});
            setReferralCount(userData.referrals?.length || 0);
        }
    }, (error) => {
        console.error("Error fetching real-time user data:", error);
    });
    
    const tasksCollection = collection(db, 'tasks');
    const q = query(tasksCollection, orderBy("order"));
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task);
        setTasks(tasksList);
    }, (error) => {
        console.error("Error fetching real-time tasks:", error);
    });

    return () => {
        unsubscribeUser();
        unsubscribeTasks();
    };
  }, [authContext?.user?.id]);

  const handleClaim = async (taskId: string, transactionId?: string) => {
    if (!authContext?.user?.id) return;
    const result = await claimTaskReward(authContext.user.id, taskId, transactionId);
    if (result.success) {
      toast({
        title: result.message || "Reward Claimed!",
        description: result.reward ? `You've received +${result.reward} PARI.` : "Your task is submitted for verification.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process task.",
        variant: "destructive",
      });
    }
  };
  
  const allTasks = tasks
      .sort((a, b) => {
          const aCompleted = completedTasks.includes(a.id);
          const bCompleted = completedTasks.includes(b.id);
          if (aCompleted && !bCompleted) return 1;
          if (!aCompleted && bCompleted) return -1;
          return a.order - b.order;
      });

  if (authContext?.loading || !authContext.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const pendingForUser = allTasks.filter(task => !completedTasks.includes(task.id) && !(task.id in pendingTasks));

  return (
    <div className="text-foreground min-h-screen flex flex-col font-body">
       <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl font-bold">
          <ListChecks className="w-6 h-6" />
          <h1>Earn More with Tasks</h1>
        </div>
        <TonConnectButton />
      </header>

      <main className="flex-1 space-y-6 pb-24 pt-2 px-4">
        {tasks.length > 0 ? (
            <div className="space-y-4">
            {pendingForUser.length > 0 ? (
              allTasks.map((task) => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    completedTasks={completedTasks} 
                    pendingTasks={pendingTasks}
                    referralCount={referralCount} 
                    onClaim={handleClaim} 
                    onTxSubmit={handleClaim}
                />
              ))
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
                <CardContent className="p-0 flex flex-col items-center">
                  <BadgeCheck className="w-12 h-12 text-green-400 mb-4" />
                  <h2 className="text-lg font-semibold">All Tasks Completed!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've completed all available tasks. Check back later for more.
                  </p>
                </CardContent>
              </Card>
            )}
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
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" isActive={true} />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" />
        </div>
      </footer>
    </div>
  );
}
