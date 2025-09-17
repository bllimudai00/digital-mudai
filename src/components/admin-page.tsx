"use client";

import { useEffect, useState } from "react";
import type { UserData, NewsArticle } from "@/lib/types";
import { getUserData, getVipRequests, updateVipStatus, getNews, addNews, deleteNews, getUsers, updateUserFromAdmin, deleteUser } from "@/app/actions";
import { Loader, Shield, UserCheck, UserX, Trash2, PlusCircle, Users, Badge, Edit, Clock, ShieldCheck } from "lucide-react";
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

function NewsManagementSection() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchNews = async () => {
        setLoading(true);
        const newsList = await getNews();
        setNews(newsList);
        setLoading(false);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleDelete = async (articleId: string) => {
        const result = await deleteNews(articleId);
        if (result.success) {
            toast({ title: "Success", description: "News article deleted." });
            fetchNews();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const article = {
            title: newTitle,
            priority: 'low' as 'low',
            content: [{ type: 'paragraph' as 'paragraph', text: newContent }],
            date: new Date().toISOString()
        };
        const result = await addNews(article);
        if (result.success) {
            toast({ title: "Success", description: "News article added." });
            setNewTitle("");
            setNewContent("");
            fetchNews();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    if(loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>
    }

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
                            placeholder="Article Content (simple text only for now)"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            required
                            className="bg-card"
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                            {isSubmitting ? "Adding..." : "Add Article"}
                        </Button>
                    </form>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-4">Existing Articles</h3>
                    {news.length > 0 ? (
                        <ul className="space-y-3">
                            {news.map((article) => (
                                <li key={article.id} className="p-3 bg-background rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold">{article.title}</p>
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
        } else {
            toast({ title: "Error", description: result.error || "Failed to delete user.", variant: "destructive" });
            onOpenChange(false);
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


export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [vipRequests, setVipRequests] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        // Set loading to true only if it's not the initial load to prevent flickering
        setLoading(prev => prev ? true : false);
        const [user, users, requests] = await Promise.all([
            getUserData(),
            getUsers(),
            getVipRequests()
        ]);
        setCurrentUser(user);
        setAllUsers(users);
        setVipRequests(requests);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            <UserManagementSection users={allUsers} loading={loading} onUpdate={fetchData} />
            <VipRequestSection vipRequests={vipRequests} loading={loading} onUpdate={fetchData} />
            <NewsManagementSection />

        </div>
    );
}
