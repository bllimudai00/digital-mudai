"use client";

import { useState } from "react";
import type { LogEntry, MiningTool } from "@/lib/types";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import ResourceDisplay from "./resource-display";
import ToolSelector from "./tool-selector";
import MiningLog from "./mining-log";
import MiningCanvas from "./mining-canvas";
import { Gem } from "lucide-react";

export default function Dashboard({ initialTools }: { initialTools: MiningTool[] }) {
  const [tools] = useState<MiningTool[]>(initialTools);
  const [selectedTool, setSelectedTool] = useState<MiningTool>(tools[0]);
  const [resources, setResources] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);

  const handleMine = (amount: number) => {
    setResources((prev) => prev + amount);
    const newLogEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      amount: amount,
      toolName: selectedTool.name,
    };
    setLog((prev) => [newLogEntry, ...prev].slice(0, 100));
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 items-center flex flex-row gap-3">
           <Gem className="w-8 h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]"/>
          <h1 className="text-2xl font-headline font-bold">Aetherium Forge</h1>
        </SidebarHeader>
        <SidebarContent className="p-4 flex flex-col gap-8">
          <ResourceDisplay resources={resources} />
          <ToolSelector
            tools={tools}
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
          <MiningLog logEntries={log} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="absolute top-4 left-4 z-20 md:hidden">
          <SidebarTrigger />
        </div>
        <MiningCanvas onMine={handleMine} tool={selectedTool} />
      </SidebarInset>
    </SidebarProvider>
  );
}
