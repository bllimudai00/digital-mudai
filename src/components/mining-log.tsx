import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { LogEntry } from "@/lib/types";
import { History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MiningLog({ logEntries }: { logEntries: LogEntry[] }) {
  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      <h2 className="text-lg font-medium text-muted-foreground font-headline">Mining Log</h2>
      <Card className="bg-card/50 backdrop-blur-sm flex-1 flex flex-col border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session History</CardTitle>
            <History className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1">
          <ScrollArea className="h-full pr-3">
            {logEntries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Click on the canvas to start mining.
              </div>
            ) : (
              <div className="space-y-3">
                {logEntries.map((entry) => (
                  <div key={entry.id}>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          Mined <span className="text-accent font-bold">+{entry.amount}</span> Aetherium
                        </span>
                        <span className="text-xs text-muted-foreground">with {entry.toolName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
