"use client";

import { useEffect, useState } from "react";
import type { UserData, NewsArticle, GlobalSettings, Task, LeaderboardEntry } from "@/lib/types";
import { getUserData, getVipRequests, updateVipStatus, getNews, addNews, deleteNews, getUsers, updateUserFromAdmin, deleteUser, getGlobalSettings, updateGlobalSettings, getTasks, deleteTask, addTask, updateTask, getLeaderboard, updateLeaderboardEntry } from "@/app/actions";
import { Loader, Shield, UserCheck, UserX, Trash2, PlusCircle, Users, Badge, Edit, Clock, ShieldCheck, Zap, ListChecks, ExternalLink, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Label } from "./ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { onSnapshot, collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
    return (
        <Card className="bg-card/80 backdrop-blur-sm">
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

function DashboardStatsSection({ users, vipRequests }: { users: UserData[], vipRequests: UserData[] }) {
    const totalUsers = users.length;
    const vipUsers = users.filter(u => u.vip).length;
    const pendingRequests = vipRequests.length;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Total Users" value={totalUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="VIP Users" value={vipUsers} icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Pending VIP Requests" value={pendingRequests} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
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
    );
}

function NewsManagementSection({ onUpdate }: { onUpdate: () => void }) {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('low');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const newsCollection = collection(db, 'news');
        const unsubscribe = onSnapshot(newsCollection, (snapshot) => {
            const newsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NewsArticle);
            
            const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
            const sortedNews = newsList.sort((a, b) => {
                const priorityA = priorityOrder[a.priority] || 4;
                const priorityB = priorityOrder[b.priority] || 4;
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setNews(sortedNews);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time news:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (articleId: string) => {
        const result = await deleteNews(articleId);
        if (result.success) {
            toast({ title: "Success", description: "News article deleted." });
            onUpdate(); 
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const parseContent = (content: string): any[] => {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        const items: any[] = [];

        for (const line of lines) {
            if (line.startsWith('# ')) {
                items.push({ type: 'heading', text: line.substring(2) });
            } else if (line.startsWith('[COMING-SOON]')) {
                items.push({ type: 'coming-soon', text: line.substring(14) });
            } else if (line.startsWith('[ICON:')) {
                const match = line.match(/\[ICON: (Wallet|Gamepad2|Star|Flame)\]\[TITLE: (.*?)\] (.*)/);
                if (match) {
                    items.push({
                        type: 'section',
                        icon: match[1] as 'Wallet' | 'Gamepad2' | 'Star' | 'Flame',
                        title: match[2],
                        text: match[3],
                    });
                }
            } else {
                items.push({ type: 'paragraph', text: line });
            }
        }
        return items;
    };
    
    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newContent) {
            toast({ title: "Error", description: "Title and content are required.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        
        const contentItems = parseContent(newContent);

        const article = {
            title: newTitle,
            priority: newPriority,
            content: contentItems,
            date: new Date().toISOString()
        };
        const result = await addNews(article);
        if (result.success) {
            toast({ title: "Success", description: "News article added." });
            setNewTitle("");
            setNewContent("");
            setNewPriority("low");
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>News Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Add New Article</h3>
                    <form onSubmit={handleAddNews} className="space-y-4 p-4 bg-background rounded-lg">
                        <Input
                            placeholder="Article Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                            className="bg-card"
                        />
                         <Textarea
                            placeholder="Article Content... Use formatting rules from docs."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            required
                            className="bg-card h-40"
                        />
                         <Select onValueChange={(value: 'low' | 'medium' | 'high') => setNewPriority(value)} defaultValue="low">
                            <SelectTrigger>
                                <SelectValue placeholder="Set priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low Priority</SelectItem>
                                <SelectItem value="medium">Medium Priority</SelectItem>
                                <SelectItem value="high">High Priority</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                            {isSubmitting ? "Adding..." : "Add Article"}
                        </Button>
                    </form>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-4">Existing Articles</h3>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>
                    ) : news.length > 0 ? (
                        <ul className="space-y-3">
                            {news.map((article) => (
                                <li key={article.id} className="p-3 bg-background rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold flex items-center gap-2">
                                            {article.title}
                                            <Badge variant={article.priority === 'high' ? 'destructive' : article.priority === 'medium' ? 'default' : 'secondary'} className="capitalize">{article.priority}</Badge>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{new Date(article.date).toLocaleDateString()}</p>
                                    </div>
                                    <Button size="icon" variant="destructive" onClick={() => handleDelete(article.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-muted-foreground text-center p-8">No news articles found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
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
            });
        }
    }, [user]);

    if (!user) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: name === 'pariBalance' ? parseFloat(value) || 0 : value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateUserFromAdmin(user.id, editedUser);
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


function UserManagementSection({ users, loading, onUpdate }: { users: UserData[], loading: boolean, onUpdate: () => void }) {
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

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


    if (loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-center">VIP</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-right">{(typeof user.pariBalance === 'number' ? user.pariBalance : parseFloat(user.pariBalance || '0')).toFixed(4)}</TableCell>
                                <TableCell className="text-center">
                                    {user.vip ? (
                                        <Badge className="bg-green-500 text-white">Yes</Badge>
                                    ) : (
                                        <Badge variant="secondary">No</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingUser(user)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
            <Card className="bg-card/80 backdrop-blur-sm">
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
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Global Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
        setEditedTask(prev => ({ ...prev, [name]: ['reward', 'order', 'requiredCount'].includes(name) ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (value: 'external' | 'referral_milestone') => {
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
        const unsubscribe = onSnapshot(tasksCollection, (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task);
            setTasks(tasksList.sort((a, b) => a.order - b.order));
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
        <Card className="bg-card/80 backdrop-blur-sm">
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
                                    <Badge variant={task.type === 'referral_milestone' ? 'default' : 'secondary'}>
                                        {task.type === 'referral_milestone' ? <Users className="w-3 h-3 mr-1" /> : <ExternalLink className="w-3 h-3 mr-1" />}
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

function LeaderboardManagementSection({ onUpdate }: { onUpdate: () => void }) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const leaderboardCollection = collection(db, 'leaderboard');
        const unsubscribe = onSnapshot(leaderboardCollection, (snapshot) => {
            const entries = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
            // Ensure we have entries for ranks 1, 2, 3
            const finalEntries: LeaderboardEntry[] = [1, 2, 3].map(rank => {
                const existing = entries.find(e => e.rank === rank && e.type === 'manual');
                return existing || { rank, userId: "", name: "", referralCount: 0, prize: 0, type: "manual" };
            });
            setLeaderboard(finalEntries);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (rank: number, field: keyof LeaderboardEntry, value: string | number) => {
        setLeaderboard(prev => prev.map(entry => 
            entry.rank === rank ? { ...entry, [field]: value } : entry
        ));
    };

    const handleSave = async (rank: number) => {
        const entryToSave = leaderboard.find(e => e.rank === rank);
        if (!entryToSave) return;
        
        const result = await updateLeaderboardEntry(entryToSave);
        if (result.success) {
            toast({ title: "Success", description: `Rank ${rank} updated.` });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Leaderboard Management (Top 3)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {leaderboard.map(entry => (
                    <div key={entry.rank} className="p-4 bg-background rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-primary">Rank #{entry.rank}</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`name-${entry.rank}`}>Name</Label>
                                <Input id={`name-${entry.rank}`} value={entry.name} onChange={(e) => handleInputChange(entry.rank, 'name', e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor={`userId-${entry.rank}`}>User ID</Label>
                                <Input id={`userId-${entry.rank}`} value={entry.userId} onChange={(e) => handleInputChange(entry.rank, 'userId', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor={`referrals-${entry.rank}`}>Referral Count</Label>
                                <Input id={`referrals-${entry.rank}`} type="number" value={entry.referralCount} onChange={(e) => handleInputChange(entry.rank, 'referralCount', Number(e.target.value))} />
                            </div>
                            <div>
                                <Label htmlFor={`prize-${entry.rank}`}>Prize (USDT)</Label>
                                <Input id={`prize-${entry.rank}`} type="number" value={entry.prize} onChange={(e) => handleInputChange(entry.rank, 'prize', Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleSave(entry.rank)}>Save Rank #{entry.rank}</Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}


export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [vipRequests, setVipRequests] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        const userPromise = getUserData();
        const usersPromise = getUsers();
        const requestsPromise = getVipRequests();

        const [user, users, requests] = await Promise.all([userPromise, usersPromise, requestsPromise]);
        
        setCurrentUser(user);
        setAllUsers(users);
        setVipRequests(requests);
        setLoading(false);
    };
    
    const handleDataUpdate = () => {
        setRefreshKey(prev => prev + 1);
    }

    useEffect(() => {
        fetchData();
    }, [refreshKey]);

    if (loading && !currentUser) {
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
            
            <DashboardStatsSection users={allUsers} vipRequests={vipRequests} />
            <GlobalSettingsSection onUpdate={handleDataUpdate} />
            <LeaderboardManagementSection onUpdate={handleDataUpdate} />
            <UserManagementSection users={allUsers} loading={loading} onUpdate={handleDataUpdate} />
            <VipRequestSection vipRequests={vipRequests} loading={loading} onUpdate={handleDataUpdate} />
            <NewsManagementSection onUpdate={handleDataUpdate} />
            <TaskManagementSection onUpdate={handleDataUpdate} />

        </div>
    );
}
