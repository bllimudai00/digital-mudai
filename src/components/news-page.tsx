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
  Wallet,
  Star,
  Flame,
  Loader,
} from "lucide-react";
import Link from "next/link";
import { getNews } from "@/app/actions";
import { NewsArticle } from "@/lib/types";
import { useEffect, useState } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";


const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Gamepad2,
  Wallet,
  Star,
  Flame,
};


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

function NewsArticleCard({ article }: { article: NewsArticle }) {
  const displayDate = article.date 
    ? new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'No date';

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold pr-2">{article.title}</h3>
          <Badge variant={article.priority === 'high' ? 'destructive' : article.priority === 'medium' ? 'default' : 'secondary'} className="capitalize">{article.priority}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{displayDate}</p>
        <div className="text-sm text-muted-foreground space-y-2 whitespace-pre-wrap">
            {article.content}
        </div>
      </CardContent>
    </Card>
  );
}


export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <main className="flex-1 p-4 space-y-6 pb-24">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Newspaper className="w-6 h-6" />
          <h1>News & Updates</h1>
        </div>
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="space-y-4">
              {news.map((article) => (
                <NewsArticleCard key={article.id} article={article} />
              ))}
            </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-2">
        <div className="flex justify-around">
          <BottomNavItem icon={<Zap className="w-6 h-6" />} label="Mining" href="/" />
          <BottomNavItem icon={<Newspaper className="w-6 h-6" />} label="News" href="/news" isActive />
          <BottomNavItem icon={<ListChecks className="w-6 h-6" />} label="Tasks" href="/tasks" />
          <BottomNavItem icon={<Gift className="w-6 h-6" />} label="Refer" href="/refer" />
          <BottomNavItem icon={<User className="w-6 h-6" />} label="Profile" href="/profile" />
        </div>
      </footer>
    </div>
  );
}
