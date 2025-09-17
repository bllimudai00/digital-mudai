"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { WhitePaperSection } from "@/lib/types";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import Image from "next/image";

export default function WhitePaperPage() {
  const [sections, setSections] = useState<WhitePaperSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const whitepaperCollection = collection(db, 'whitepaper');
    const q = query(whitepaperCollection, orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sectionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhitePaperSection));
      setSections(sectionsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" />
          White Paper
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-8">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : sections.length > 0 ? (
                sections.map((section) => (
                <div key={section.id}>
                    <h2 className="text-xl font-bold text-primary mb-2">{section.title}</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {section.content}
                    </p>
                    {section.imageUrl && (
                        <div className="mt-4 relative aspect-video">
                             <Image 
                                src={section.imageUrl} 
                                alt={section.title} 
                                layout="fill" 
                                objectFit="contain" 
                                className="rounded-md"
                              />
                        </div>
                    )}
                </div>
                ))
            ) : (
                <div className="text-center p-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-semibold">White Paper Not Available</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Content will be updated soon.
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
