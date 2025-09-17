"use client";

import { useEffect, useState } from "react";
import type { UserData, NewsArticle } from "@/lib/types";
import { getUserData, getVipRequests, updateVipStatus, getNews, addNews, deleteNews, getUsers } from "@/app/actions";
import { Loader, Shield, UserCheck, UserX, Newspaper as NewsIcon, Trash2, PlusCircle, Users, Badge, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";


function VipRequestSection() {
    const [vipRequests, setVipRequests] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchRequests = async () => {
        setLoading(true);
        const requests = await getVipRequests();
        setVipRequests(requests);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
        const result = await updateVipStatus(userId, status);
        if (result.success) {
            toast({
                title: "Success",
                description: `User has been ${status}.`,
            });
            fetchRequests(); // Refresh list
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

function UserManagementSection() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const userList = await getUsers();
            setUsers(userList);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{users.length}</p>
                </div>
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
                                <TableCell className="text-right">{user.pariBalance.toFixed(4)}</TableCell>
                                <TableCell className="text-center">
                                    {user.vip ? (
                                        <Badge className="bg-green-500 text-white">Yes</Badge>
                                    ) : (
                                        <Badge variant="secondary">No</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            const user = await getUserData();
            setCurrentUser(user);
            setLoading(false);
        };
        loadUser();
    }, []);

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
            
            <UserManagementSection />
            <VipRequestSection />
            <NewsManagementSection />

        </div>
    );
}
