import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem } from "lucide-react";

export default function ResourceDisplay({ resources }: { resources: number }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-muted-foreground font-headline">Resources</h2>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aetherium Mined</CardTitle>
          <Gem className="h-5 w-5 text-accent drop-shadow-[0_0_4px_hsl(var(--accent))]" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-headline text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]">
            {resources.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground pt-1">Total accumulated virtual resources</p>
        </CardContent>
      </Card>
    </div>
  );
}
