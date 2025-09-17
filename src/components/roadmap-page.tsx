"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Map, CheckCircle2, CircleDashed, Loader } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { RoadmapPhase } from "@/lib/types";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

function RoadmapPhaseCard({ phase, title, status, items }: RoadmapPhase) {
  const isCompleted = status === "Completed";
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-bold text-primary">{phase}</p>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={
                status === 'Completed' ? "bg-green-500/20 text-green-400 border-green-500/30" 
              : status === 'In Progress' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : ""
            }
          >
            {status}
          </Badge>
        </div>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-muted-foreground">{item.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function RoadmapPage() {
  const [roadmapData, setRoadmapData] = useState<RoadmapPhase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roadmapCollection = collection(db, 'roadmap');
    const q = query(roadmapCollection, orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const phases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoadmapPhase));
      setRoadmapData(phases);
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
          <Map className="w-5 h-5" />
          Project Roadmap
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        ) : roadmapData.length > 0 ? (
          roadmapData.map((phase) => (
            <RoadmapPhaseCard key={phase.id} {...phase} />
          ))
        ) : (
            <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
                <CardContent className="p-0 flex flex-col items-center">
                    <Map className="w-12 h-12 text-muted-foreground mb-4" />
                    <h2 className="text-lg font-semibold">Roadmap Not Available</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        The project roadmap will be updated soon.
                    </p>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
