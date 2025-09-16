import { generateMiningToolVariants } from "@/ai/flows/generate-mining-tool-variants";
import Dashboard from "@/components/dashboard";
import type { MiningTool } from "@/lib/types";

export default async function Home() {
  const baseTool: MiningTool = {
    name: "Standard-Issue Pickaxe",
    description: "A reliable, standard-issue plasma pickaxe for asteroid mining.",
  };

  let allTools: MiningTool[] = [baseTool];

  try {
    const variants = await generateMiningToolVariants({
      baseToolDescription: baseTool.description,
      numberOfVariants: 4,
    });
    allTools = [baseTool, ...variants.variants];
  } catch (error) {
    console.error("Failed to generate mining tool variants:", error);
  }

  return <Dashboard initialTools={allTools} />;
}
