

"use client";

import { useEffect, useState, useContext } from "react";
import type { UserData, GlobalSettings, Task, RoadmapPhase, WhitePaperSection, RoadmapItem, ContestSettings, ContestEntry } from "@/lib/types";
import { getVipRequests, updateVipStatus, getUsers, updateUserFromAdmin, deleteUser, getGlobalSettings, updateGlobalSettings, getTasks, deleteTask, addTask, updateTask, getRoadmap, saveRoadmap, getWhitePaper, saveWhitePaper, getContestSettings, saveContestWinners, migrateOldReferrals, getPendingTaskRequests, approveTask, rejectTask } from "@/app/actions";
import { Loader, Shield, UserCheck, UserX, Trash2, PlusCircle, Users, Badge, Edit, Clock, ShieldCheck, Zap, ListChecks, ExternalLink, Map, FileText, GripVertical, Plus, Image as ImageIcon, Trophy, Database, Search, Settings, FileEdit, Wrench, UserCog, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "./ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { onSnapshot, collection, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { AuthContext } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function DashboardStatsSection({ users, vipRequests, pendingTaskRequests }: { users: UserData[], vipRequests: UserData[], pendingTaskRequests: any[] }) {
    const totalUsers = users.length;
    const vipUsers = users.filter(u => u.vipStatus === 'approved').length;
    const pendingVip = vipRequests.length;
    const pendingTasks = pendingTaskRequests.length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={totalUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="VIP Users" value={vipUsers} icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Pending VIP" value={pendingVip} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Pending Tasks" value={pendingTasks} icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} />
        </div>
    );
}

function VipRequestSection({ vipRequests, loading, onUpdate }: { vipRequests: UserData[], loading: boolean, onUpdate: () => void }) {
    const { toast } = useToast();

    const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
        const result = await updateVipStatus(userId, status);
        if (result.success) {
            toast({
                title: "Success",
                description: `User has been ${status}.`,
            });
            onUpdate(); // Refresh list
        } else {
            toast({
                title: "Error",
                description: "Could not update user status.",
                variant: "destructive",
            });
        }
    };

    if(loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
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
    );
}

function TaskVerificationSection({ requests, loading, onUpdate }: { requests: any[], loading: boolean, onUpdate: () => void }) {
    const { toast } = useToast();

    const handleApprove = async (userId: string, taskId: string) => {
        const result = await approveTask(userId, taskId);
        if (result.success) {
            toast({ title: "Success", description: "Task approved and reward sent." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleReject = async (userId: string, taskId: string) => {
        const result = await rejectTask(userId, taskId);
        if (result.success) {
            toast({ title: "Task Rejected", description: "The task submission has been rejected." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    if(loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader>
                <CardTitle>Pending Task Verifications</CardTitle>
            </CardHeader>
            <CardContent>
                {requests.length > 0 ? (
                    <ul className="space-y-4">
                        {requests.map((req) => (
                            <li key={`${req.userId}-${req.taskId}`} className="p-4 bg-background rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-bold">{req.userName}</p>
                                    <p className="text-sm text-muted-foreground">Task: <span className="font-semibold">{req.taskTitle}</span></p>
                                    <p className="text-xs text-accent mt-1">TxID: <span className="font-mono">{req.transactionId}</span></p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black" onClick={() => handleApprove(req.userId, req.taskId)}>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-black" onClick={() => handleReject(req.userId, req.taskId)}>
                                        <UserX className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center p-8">No pending task submissions found.</p>
                )}
            </CardContent>
        </Card>
    );
}

function EditUserDialog({ user, isOpen, onOpenChange, onUserUpdate }: { user: UserData | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: () => void }) {
    const [editedUser, setEditedUser] = useState<Partial<UserData>>({});
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setEditedUser({
                name: user.name,
                email: user.email,
                pariBalance: user.pariBalance,
                referralEarnings: user.referralEarnings,
            });
        }
    }, [user]);

    if (!user) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = async () => {
        setIsSaving(true);
    
        const dataToUpdate: Partial<UserData> = { ...editedUser };
        
        if (dataToUpdate.pariBalance !== undefined) {
            dataToUpdate.pariBalance = parseFloat(dataToUpdate.pariBalance as any) || 0;
        }
        if (dataToUpdate.referralEarnings !== undefined) {
            dataToUpdate.referralEarnings = parseFloat(dataToUpdate.referralEarnings as any) || 0;
        }

        const result = await updateUserFromAdmin(user.id, dataToUpdate);
        setIsSaving(false);
        if (result.success) {
            toast({ title: "Success", description: "User updated successfully." });
            onUserUpdate();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.error || "Failed to update user.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User: {user.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" name="name" value={editedUser.name || ""} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" name="email" value={editedUser.email || ""} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pariBalance" className="text-right">PARI Balance</Label>
                        <Input id="pariBalance" name="pariBalance" type="number" value={editedUser.pariBalance || 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="referralEarnings" className="text-right">Referral Earnings</Label>
                        <Input id="referralEarnings" name="referralEarnings" type="number" value={editedUser.referralEarnings || 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteUserDialog({ user, isOpen, onOpenChange, onUserDelete }: { user: UserData | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onUserDelete: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    if (!user) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteUser(user.id);
        setIsDeleting(false);
        if (result.success) {
            toast({ title: "Success", description: "User deleted successfully." });
            onUserDelete();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.error || "Failed to delete user.", variant: "destructive" });
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user <span className="font-bold">{user.name}</span> and their data from the servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                        {isDeleting ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


function UserTable({ users, onEdit, onDelete }: { users: UserData[], onEdit: (user: UserData) => void, onDelete: (user: UserData) => void }) {
    if (users.length === 0) {
        return <p className="text-muted-foreground text-center p-8">No users found in this category.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead className="text-center">Referrals</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">VIP</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.referredByName || 'N/A'}</TableCell>
                        <TableCell className="text-center font-bold">{user.referralCount || 0}</TableCell>
                        <TableCell className="text-right">{(typeof user.pariBalance === 'number' ? user.pariBalance : parseFloat(user.pariBalance || '0')).toFixed(4)}</TableCell>
                        <TableCell className="text-center">
                            {user.vip ? (
                                <Badge className="bg-green-500 text-white">Yes</Badge>
                            ) : (
                                <Badge variant="secondary">No</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(user)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function UserManagementSection({ users, loading, onUpdate }: { users: UserData[], loading: boolean, onUpdate: () => void }) {
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const handleEditClick = (user: UserData) => {
        setEditingUser(user);
    };
    
    const handleUserUpdate = () => {
        setEditingUser(null);
        onUpdate();
    }
    
    const handleUserDelete = () => {
        setDeletingUser(null);
        onUpdate();
    }

    const filteredUsers = users
        .filter(user => {
            if (activeTab === "vip") return user.vipStatus === 'approved' || user.vip;
            if (activeTab === "normal") return user.vipStatus !== 'approved' && !user.vip;
            return true;
        })
        .filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    if (loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                 <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="vip">VIP Users</TabsTrigger>
                        <TabsTrigger value="normal">Normal Users</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-4">
                        <UserTable users={filteredUsers} onEdit={handleEditClick} onDelete={setDeletingUser} />
                    </TabsContent>
                     <TabsContent value="vip" className="mt-4">
                        <UserTable users={filteredUsers} onEdit={handleEditClick} onDelete={setDeletingUser} />
                    </TabsContent>
                     <TabsContent value="normal" className="mt-4">
                        <UserTable users={filteredUsers} onEdit={handleEditClick} onDelete={setDeletingUser} />
                    </TabsContent>
                </Tabs>
            </CardContent>
             <EditUserDialog 
                user={editingUser}
                isOpen={!!editingUser}
                onOpenChange={(isOpen) => { if (!isOpen) setEditingUser(null); }}
                onUserUpdate={handleUserUpdate}
            />
            <DeleteUserDialog
                user={deletingUser}
                isOpen={!!deletingUser}
                onOpenChange={(isOpen) => { if(!isOpen) setDeletingUser(null); }}
                onUserDelete={handleUserDelete}
            />
        </Card>
    );
}

function GlobalSettingsSection({ onUpdate }: { onUpdate: () => void}) {
    const [settings, setSettings] = useState<Partial<GlobalSettings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const currentSettings = await getGlobalSettings();
            if (currentSettings) {
                setSettings(currentSettings);
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (['baseRate', 'totalVipSlots', 'claimedVipSlots', 'vipPrice'].includes(name)) {
             setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
             setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdateSettings = async () => {
        setIsSaving(true);
        const result = await updateGlobalSettings(settings);
        if (result.success) {
            toast({ title: "Success", description: "Global settings updated." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error || "Failed to update settings.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    if (isLoading) {
         return (
            <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
                <CardHeader>
                    <CardTitle>Global Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>
                </CardContent>
            </Card>
         )
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardContent className="space-y-4 pt-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="baseRate">Global Base Rate (/hr)</Label>
                        <Input 
                            id="baseRate"
                            name="baseRate"
                            type="number"
                            value={settings.baseRate || 0}
                            onChange={handleInputChange}
                            className="mt-2"
                        />
                    </div>
                     <div>
                        <Label htmlFor="vipPrice">VIP Price (in TON)</Label>
                        <Input 
                            id="vipPrice"
                            name="vipPrice"
                            type="number"
                            value={settings.vipPrice || 0}
                            onChange={handleInputChange}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label htmlFor="totalVipSlots">Total VIP Slots</Label>
                        <Input 
                            id="totalVipSlots"
                            name="totalVipSlots"
                            type="number"
                            value={settings.totalVipSlots || 0}
                            onChange={handleInputChange}
                            className="mt-2"
                        />
                    </div>
                     <div>
                        <Label htmlFor="claimedVipSlots">Claimed VIP Slots</Label>
                        <Input 
                            id="claimedVipSlots"
                            name="claimedVipSlots"
                            type="number"
                            value={settings.claimedVipSlots || 0}
                            onChange={handleInputChange}
                            className="mt-2"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="vipWalletAddress">VIP TON Wallet Address</Label>
                        <Input 
                            id="vipWalletAddress"
                            name="vipWalletAddress"
                            type="text"
                            value={settings.vipWalletAddress || ""}
                            onChange={handleInputChange}
                            className="mt-2"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold border-t pt-6 mt-4">Social & Support Links</h3>
                         <div>
                            <Label htmlFor="telegramChannelUrl">Telegram Channel URL</Label>
                            <Input id="telegramChannelUrl" name="telegramChannelUrl" value={settings.telegramChannelUrl || ""} onChange={handleInputChange} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="telegramGroupUrl">Telegram Group URL</Label>
                            <Input id="telegramGroupUrl" name="telegramGroupUrl" value={settings.telegramGroupUrl || ""} onChange={handleInputChange} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="xUrl">X (Twitter) URL</Label>
                            <Input id="xUrl" name="xUrl" value={settings.xUrl || ""} onChange={handleInputChange} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input id="supportEmail" name="supportEmail" type="email" value={settings.supportEmail || ""} onChange={handleInputChange} className="mt-1" />
                        </div>
                         <div>
                            <Label htmlFor="supportTelegramUsername">1-to-1 Support (Telegram Username)</Label>
                            <Input id="supportTelegramUsername" placeholder="e.g. PariSupport (without @)" value={settings.supportTelegramUsername || ""} onChange={handleInputChange} className="mt-1" />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end mt-4">
                    <Button onClick={handleUpdateSettings} disabled={isSaving}>
                        {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Update Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function DataMigrationSection({ onUpdate }: { onUpdate: () => void}) {
    const [isMigrating, setIsMigrating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { toast } = useToast();

    const handleMigration = async () => {
        setIsMigrating(true);
        setShowConfirm(false);
        toast({ title: "Migration Started", description: "This may take a few moments. Do not close the page." });
        
        const result = await migrateOldReferrals();
        
        if (result.success) {
            toast({ title: "Migration Successful", description: result.message });
            onUpdate();
        } else {
            toast({ title: "Migration Failed", description: result.error, variant: "destructive" });
        }
        setIsMigrating(false);
    };

    return (
        <>
            <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
                <CardContent className="space-y-4 pt-6">
                    <p className="text-sm text-muted-foreground">
                        Use these actions for one-time data corrections. Please backup your database before running any migration.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background rounded-lg">
                        <div>
                            <h4 className="font-bold">Backfill Old Referrals</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Scans all users and populates the `referrals` array for old users who have referrals but an empty array.
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            className="mt-2 sm:mt-0"
                            onClick={() => setShowConfirm(true)}
                            disabled={isMigrating}
                        >
                            {isMigrating ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                            {isMigrating ? 'Migrating...' : 'Migrate Old Referrals'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will scan all user documents and update their `referrals` array. This action is irreversible. It's highly recommended to **backup your Firestore data** before proceeding.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isMigrating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMigration} disabled={isMigrating} className={buttonVariants({ variant: "destructive" })}>
                            {isMigrating ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                            Yes, run migration
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function TaskDialog({ task, isOpen, onOpenChange, onTaskUpdate }: { task: Partial<Task> | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onTaskUpdate: () => void }) {
    const [editedTask, setEditedTask] = useState<Partial<Task>>({});
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (task) {
            setEditedTask(task);
        }
    }, [task]);

    if (!task) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedTask(prev => ({ ...prev, [name]: ['reward', 'order', 'requiredCount', 'amount'].includes(name) ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (value: 'external' | 'referral_milestone' | 'onchain_transaction') => {
        setEditedTask(prev => ({...prev, type: value}));
    }

    const handleSave = async () => {
        setIsSaving(true);
        const result = editedTask.id ? await updateTask(editedTask.id, editedTask) : await addTask(editedTask);
        setIsSaving(false);
        if (result.success) {
            toast({ title: "Success", description: `Task ${editedTask.id ? 'updated' : 'added'} successfully.` });
            onTaskUpdate();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.error || "Failed to save task.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{task.id ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input id="title" name="title" value={editedTask.title || ""} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reward" className="text-right">Reward</Label>
                        <Input id="reward" name="reward" type="number" value={editedTask.reward || 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="order" className="text-right">Order</Label>
                        <Input id="order" name="order" type="number" value={editedTask.order || 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                         <Select onValueChange={handleSelectChange} value={editedTask.type}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="external">External Link</SelectItem>
                                <SelectItem value="referral_milestone">Referral Milestone</SelectItem>
                                <SelectItem value="onchain_transaction">On-Chain Transaction</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {editedTask.type === 'external' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="url" className="text-right">URL</Label>
                            <Input id="url" name="url" value={editedTask.url || ""} onChange={handleInputChange} className="col-span-3" />
                        </div>
                    )}
                     {editedTask.type === 'referral_milestone' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="requiredCount" className="text-right">Required Count</Label>
                            <Input id="requiredCount" name="requiredCount" type="number" value={editedTask.requiredCount || 0} onChange={handleInputChange} className="col-span-3" />
                        </div>
                    )}
                    {editedTask.type === 'onchain_transaction' && (
                        <>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="network" className="text-right">Network</Label>
                                <Input id="network" name="network" value="TON" readOnly className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="toAddress" className="text-right">To Address</Label>
                                <Input id="toAddress" name="toAddress" value={editedTask.toAddress || ""} onChange={handleInputChange} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Amount (TON)</Label>
                                <Input id="amount" name="amount" type="number" value={editedTask.amount || 0} onChange={handleInputChange} className="col-span-3" />
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function TaskManagementSection({ onUpdate }: { onUpdate: () => void }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const tasksCollection = collection(db, 'tasks');
        const unsubscribe = onSnapshot(query(tasksCollection, orderBy('order')), (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task);
            setTasks(tasksList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time tasks:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

     const handleDelete = async () => {
        if (!deletingTask) return;
        const result = await deleteTask(deletingTask.id);
        if (result.success) {
            toast({ title: "Success", description: "Task deleted successfully." });
            setDeletingTask(null);
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    if (loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Task Management</CardTitle>
                <Button size="sm" onClick={() => setEditingTask({})}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Task
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Reward</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell>{task.order}</TableCell>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        task.type === 'referral_milestone' ? 'default' 
                                        : task.type === 'onchain_transaction' ? 'destructive'
                                        : 'secondary'
                                    }>
                                        {task.type === 'referral_milestone' ? <Users className="w-3 h-3 mr-1" /> : 
                                         task.type === 'onchain_transaction' ? <Send className="w-3 h-3 mr-1" /> :
                                         <ExternalLink className="w-3 h-3 mr-1" />}
                                        {task.type.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{task.reward}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingTask(task)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingTask(task)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <TaskDialog 
                task={editingTask}
                isOpen={!!editingTask}
                onOpenChange={(isOpen) => { if (!isOpen) setEditingTask(null); }}
                onTaskUpdate={() => { setEditingTask(null); onUpdate(); }}
            />
            <AlertDialog open={!!deletingTask} onOpenChange={(isOpen) => { if (!isOpen) setDeletingTask(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the task: <span className="font-bold">{deletingTask?.title}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

function RoadmapManagementSection({ onUpdate }: { onUpdate: () => void }) {
    const [phases, setPhases] = useState<RoadmapPhase[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRoadmap = async () => {
            setLoading(true);
            const roadmapData = await getRoadmap();
             if (roadmapData.length === 0) {
                 const initialPhases: RoadmapPhase[] = [
                    { id: "1", order: 1, phase: "Phase 1", title: "Foundation & Launch", status: "Completed", items: [{ text: "Concept and Idea Finalization" }, { text: "Core Team Formation" }] },
                    { id: "2", order: 2, phase: "Phase 2", title: "Growth & Engagement", status: "In Progress", items: [{ text: "VIP Membership Program Launch" }, { text: "Referral Contest Implementation" }] }
                ];
                setPhases(initialPhases);
             } else {
                setPhases(roadmapData);
             }
            setLoading(false);
        };
        fetchRoadmap();
    }, []);

    const handlePhaseChange = (index: number, field: keyof RoadmapPhase, value: any) => {
        const newPhases = [...phases];
        (newPhases[index] as any)[field] = value;
        setPhases(newPhases);
    };

    const handleItemChange = (phaseIndex: number, itemIndex: number, value: string) => {
        const newPhases = [...phases];
        newPhases[phaseIndex].items[itemIndex].text = value;
        setPhases(newPhases);
    };

    const addItem = (phaseIndex: number) => {
        const newPhases = [...phases];
        newPhases[phaseIndex].items.push({ text: "" });
        setPhases(newPhases);
    };
    
    const removeItem = (phaseIndex: number, itemIndex: number) => {
        const newPhases = [...phases];
        newPhases[phaseIndex].items.splice(itemIndex, 1);
        setPhases(newPhases);
    };
    
    const addPhase = () => {
        const newOrder = phases.length > 0 ? Math.max(...phases.map(p => p.order)) + 1 : 1;
        setPhases([...phases, { id: `new_${Date.now()}`, order: newOrder, phase: `Phase ${newOrder}`, title: "", status: "Upcoming", items: [] }]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveRoadmap(phases);
        if (result.success) {
            toast({ title: "Success", description: "Roadmap updated." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSaving(false);
    };

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Roadmap Management</CardTitle>
                <Button onClick={handleSave} disabled={isSaving || loading}>
                    {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Save Roadmap
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div> :
                <Accordion type="multiple" className="w-full space-y-4">
                    {phases.map((phase, phaseIndex) => (
                        <AccordionItem value={`item-${phaseIndex}`} key={phase.id} className="bg-background rounded-lg border-none">
                            <AccordionTrigger className="p-4 hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                                    <span className="font-bold text-lg">{phase.phase}: {phase.title}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0 space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <Input value={phase.phase} onChange={e => handlePhaseChange(phaseIndex, 'phase', e.target.value)} placeholder="Phase (e.g. Phase 1)" />
                                    <Input value={phase.title} onChange={e => handlePhaseChange(phaseIndex, 'title', e.target.value)} placeholder="Title" />
                                    <Select value={phase.status} onValueChange={value => handlePhaseChange(phaseIndex, 'status', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Items</Label>
                                    {phase.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex items-center gap-2">
                                            <Input value={item.text} onChange={e => handleItemChange(phaseIndex, itemIndex, e.target.value)} />
                                            <Button variant="destructive" size="icon" onClick={() => removeItem(phaseIndex, itemIndex)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => addItem(phaseIndex)}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                }
                 <Button variant="secondary" onClick={addPhase} className="mt-4"><PlusCircle className="w-4 h-4 mr-2" />Add Phase</Button>
            </CardContent>
        </Card>
    );
}

function WhitePaperManagementSection({ onUpdate }: { onUpdate: () => void }) {
    const [sections, setSections] = useState<WhitePaperSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchWhitePaper = async () => {
            setLoading(true);
            const wpData = await getWhitePaper();
            if (wpData.length === 0) {
                 const initialSections: WhitePaperSection[] = [
                    { id: "1", order: 1, title: "1. Introduction", content: "PARI Network is a pioneering mobile-first platform..." },
                    { id: "2", order: 2, title: "2. Vision & Mission", content: "Our vision is to onboard the next billion users into Web3..." }
                ];
                setSections(initialSections);
            } else {
                setSections(wpData);
            }
            setLoading(false);
        };
       fetchWhitePaper();
    }, []);

    const handleSectionChange = (index: number, field: keyof WhitePaperSection, value: any) => {
        const newSections = [...sections];
        (newSections[index] as any)[field] = value;
        setSections(newSections);
    };

    const addSection = () => {
        const newOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1;
        setSections([...sections, { id: `new_${Date.now()}`, order: newOrder, title: "", content: "" }]);
    };
    
    const removeSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
    }

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveWhitePaper(sections);
        if (result.success) {
            toast({ title: "Success", description: "White Paper updated." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSaving(false);
    };

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>White Paper Management</CardTitle>
                <Button onClick={handleSave} disabled={isSaving || loading}>
                    {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Save White Paper
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div> :
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <div key={section.id} className="p-4 bg-background rounded-lg space-y-3 relative">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-5 h-5 text-muted-foreground" />
                                <Input value={section.title} onChange={e => handleSectionChange(index, 'title', e.target.value)} placeholder="Section Title" className="font-bold text-lg" />
                            </div>
                            <Textarea value={section.content} onChange={e => handleSectionChange(index, 'content', e.target.value)} placeholder="Section Content" className="h-32" />
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                <Input value={section.imageUrl || ""} onChange={e => handleSectionChange(index, 'imageUrl', e.target.value)} placeholder="Optional Image URL" />
                            </div>
                             <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => removeSection(index)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    ))}
                </div>
                }
                <Button variant="secondary" onClick={addSection} className="mt-4"><PlusCircle className="w-4 h-4 mr-2" />Add Section</Button>
            </CardContent>
        </Card>
    )
}

function ContestManagementSection({ onUpdate }: { onUpdate: () => void }) {
    const [winners, setWinners] = useState<ContestEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchWinners = async () => {
            setLoading(true);
            const settings = await getContestSettings();
            setWinners(settings.winners);
            setLoading(false);
        };
        fetchWinners();
    }, []);

    const handleWinnerChange = (index: number, field: keyof ContestEntry, value: string | number) => {
        const newWinners = [...winners];
        (newWinners[index] as any)[field] = value;
        setWinners(newWinners);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveContestWinners(winners);
        if (result.success) {
            toast({ title: "Success", description: "Contest winners updated." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSaving(false);
    };

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Referral Contest Management</CardTitle>
                <Button onClick={handleSave} disabled={isSaving || loading}>
                    {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                    Save Winners
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div> :
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Manually set the top 10 winners for the referral contest leaderboard.</p>
                    {winners.map((winner, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                            <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`winner-name-${index}`} className="text-xs">Winner Name</Label>
                                    <Input
                                        id={`winner-name-${index}`}
                                        value={winner.name}
                                        onChange={e => handleWinnerChange(index, 'name', e.target.value)}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`winner-count-${index}`} className="text-xs">Referral Count</Label>
                                    <Input
                                        id={`winner-count-${index}`}
                                        type="number"
                                        value={winner.referralCount}
                                        onChange={e => handleWinnerChange(index, 'referralCount', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                }
            </CardContent>
        </Card>
    );
}

const AdminAccordionItem = ({ icon, title, value, children }: { icon: React.ReactNode, title: string, value: string, children: React.ReactNode }) => (
    <AccordionItem value={value} className="bg-card/30 backdrop-blur-sm border border-blue-500/10 rounded-lg">
        <AccordionTrigger className="p-4 text-lg hover:no-underline">
            <div className="flex items-center gap-3">
                {icon}
                {title}
            </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
            {children}
        </AccordionContent>
    </AccordionItem>
)

export default function AdminPage() {
    const authContext = useContext(AuthContext);
    const { user: currentUser } = authContext || {};
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [vipRequests, setVipRequests] = useState<UserData[]>([]);
    const [pendingTaskRequests, setPendingTaskRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        const usersPromise = getUsers();
        const requestsPromise = getVipRequests();
        const taskRequestsPromise = getPendingTaskRequests();

        const [users, requests, taskRequests] = await Promise.all([usersPromise, requestsPromise, taskRequestsPromise]);
        
        setAllUsers(users);
        setVipRequests(requests);
        setPendingTaskRequests(taskRequests);
        setLoading(false);
    };
    
    const handleDataUpdate = () => {
        setRefreshKey(prev => prev + 1);
    }

    useEffect(() => {
        if(currentUser?.isAdmin){
            fetchData();
        } else {
             setLoading(false);
        }
    }, [refreshKey, currentUser]);

    if (!authContext || authContext.loading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-transparent">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentUser?.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-center p-4">
                <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Go to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-transparent text-foreground min-h-screen flex flex-col font-body p-4 space-y-6">
             <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Admin Panel
                </h1>
                <Button asChild variant="outline">
                    <Link href="/">Back to App</Link>
                </Button>
            </header>
            
            <DashboardStatsSection users={allUsers} vipRequests={vipRequests} pendingTaskRequests={pendingTaskRequests}/>

            <Accordion type="multiple" className="w-full space-y-4" defaultValue={["user-management"]}>
                <AdminAccordionItem value="global-settings" title="Global App Settings" icon={<Settings className="w-5 h-5 text-primary" />}>
                    <GlobalSettingsSection onUpdate={handleDataUpdate} />
                </AdminAccordionItem>
                
                <AdminAccordionItem value="user-management" title="User Management" icon={<UserCog className="w-5 h-5 text-primary" />}>
                     <UserManagementSection users={allUsers} loading={loading} onUpdate={handleDataUpdate} />
                </AdminAccordionItem>
                
                <AdminAccordionItem value="verification-queues" title="Verification Queues" icon={<ShieldCheck className="w-5 h-5 text-primary" />}>
                    <div className="space-y-4">
                        <VipRequestSection vipRequests={vipRequests} loading={loading} onUpdate={handleDataUpdate} />
                        <TaskVerificationSection requests={pendingTaskRequests} loading={loading} onUpdate={handleDataUpdate} />
                    </div>
                </AdminAccordionItem>
                
                <AdminAccordionItem value="content-management" title="Content Management" icon={<FileEdit className="w-5 h-5 text-primary" />}>
                    <div className="space-y-4">
                        <TaskManagementSection onUpdate={handleDataUpdate} />
                        <ContestManagementSection onUpdate={handleDataUpdate} />
                        <RoadmapManagementSection onUpdate={handleDataUpdate} />
                        <WhitePaperManagementSection onUpdate={handleDataUpdate} />
                    </div>
                </AdminAccordionItem>

                 <AdminAccordionItem value="advanced-tools" title="Advanced Tools" icon={<Wrench className="w-5 h-5 text-primary" />}>
                    <DataMigrationSection onUpdate={handleDataUpdate} />
                </AdminAccordionItem>
            </Accordion>
        </div>
    );
}
