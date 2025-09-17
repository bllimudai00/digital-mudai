import Dashboard from "@/components/dashboard";
import type { MiningTool } from "@/lib/types";

export default async function Home() {
  const allTools: MiningTool[] = [
    {
      name: "Standard-Issue Pickaxe",
      description: "A reliable, standard-issue plasma pickaxe for asteroid mining.",
    },
    {
      name: "Quantum Drill",
      description: "Utilizes quantum tunneling to phase through rock, increasing yield.",
    },
    {
      name: "Sonic Resonator",
      description: "Emits sonic frequencies to shatter crystalline structures.",
    },
    {
      name: "Gravity Hammer",
      description: "Manipulates local gravity fields to crush dense ores.",
    },
    {
      name: "Laser Etcher",
      description: "Precisely cuts through rock with a high-energy laser beam.",
    }
  ];

  return <Dashboard initialTools={allTools} />;
}
