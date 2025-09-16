import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { MiningTool } from "@/lib/types";
import { Wand2 } from "lucide-react";

export default function ToolSelector({
  tools,
  selectedTool,
  onToolSelect,
}: {
  tools: MiningTool[];
  selectedTool: MiningTool;
  onToolSelect: (tool: MiningTool) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-muted-foreground font-headline">Mining Tools</h2>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardContent className="p-4">
          <RadioGroup
            value={selectedTool.name}
            onValueChange={(value) => {
              const tool = tools.find((t) => t.name === value);
              if (tool) onToolSelect(tool);
            }}
            className="space-y-2"
          >
            {tools.map((tool) => (
              <Label
                key={tool.name}
                htmlFor={tool.name}
                className={`flex flex-col gap-2 rounded-md border-2 p-3 cursor-pointer transition-all hover:border-primary/80 ${
                  selectedTool.name === tool.name ? "border-accent bg-accent/10" : "border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={tool.name} id={tool.name} />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <Wand2 className={`h-6 w-6 transition-colors ${selectedTool.name === tool.name ? "text-accent" : "text-muted-foreground"}`} />
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
