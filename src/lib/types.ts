export type MiningTool = {
  name: string;
  description: string;
};

export type LogEntry = {
  id: string;
  timestamp: Date;
  amount: number;
  toolName: string;
};
