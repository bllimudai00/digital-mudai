"use client";

import { useEffect, useState } from "react";
import type { UserData } from "@/lib/types";
import { getUserData, getVipRequests, updateVipStatus } from "@/app/actions";
import { Loader, Shield, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [vipRequests, setVipRequests] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const user = await getUserData();
            setCurrentUser(user);
            if (user?.isAdmin) {
                const requests = await getVipRequests();
                setVipRequests(requests);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
        const result = await updateVipStatus(userId, status);
        if (result.success) {
            toast({
                title: "Success",
                description: `User has been ${status}.`,
            });
            // Refresh list
            const requests = await getVipRequests();
            setVipRequests(requests);
        } else {
            toast({
                title: "Error",
                description: "Could not update user status.",
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

    if (!currentUser?.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
                <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Go to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col font-body p-4 space-y-6">
             <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Admin Panel
                </h1>
                <Button asChild variant="outline">
                    <Link href="/">Back to App</Link>
                </Button>
            </header>

            <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Pending VIP Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {vipRequests.length > 0 ? (
                        <ul className="space-y-4">
                            {vipRequests.map((req) => (
                                <li key={req.id} className="p-4 bg-background rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="font-bold">{req.name}</p>
                                        <p className="text-sm text-muted-foreground">{req.email}</p>
                                        <p className="text-xs text-accent mt-1">TxID: <span className="font-mono">{req.vipTransactionId}</span></p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Submitted: {req.vipProofSubmittedAt ? format(new Date(req.vipProofSubmittedAt), 'PPP p') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black" onClick={() => handleUpdateStatus(req.id, 'approved')}>
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                         <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-black" onClick={() => handleUpdateStatus(req.id, 'rejected')}>
                                            <UserX className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center p-8">No pending VIP requests found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
