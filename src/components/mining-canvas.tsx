"use client";

import { useState, useRef, MouseEvent } from "react";
import type { MiningTool } from "@/lib/types";

type Effect = {
  id: number;
  x: number;
  y: number;
  toolName: string;
  amount: number;
};

export default function MiningCanvas({
  onMine,
  tool,
}: {
  onMine: (amount: number) => void;
  tool: MiningTool;
}) {
  const [effects, setEffects] = useState<Effect[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const effectIdCounter = useRef(0);

  const handleCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const amount = Math.floor(Math.random() * (tool.name.length % 5 + 1) * 5) + 5;
    onMine(amount);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newEffect: Effect = {
      id: effectIdCounter.current++,
      x,
      y,
      toolName: tool.name,
      amount: amount
    };
    setEffects((prev) => [...prev, newEffect]);

    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== newEffect.id));
    }, 1500);
  };

  const getEffectStyle = (toolName: string) => {
    let hash = 0;
    for (let i = 0; i < toolName.length; i++) {
        hash = toolName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 70 + (Math.abs(hash) % 20);
    const l = 60 + (Math.abs(hash) % 10);
    return {
        backgroundColor: `hsla(${h}, ${s}%, ${l}%, 0.3)`,
        borderColor: `hsl(${h}, ${s}%, ${l}%)`,
        boxShadow: `0 0 15px hsla(${h}, ${s}%, ${l}%, 0.5)`
    }
  }

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full min-h-screen cursor-crosshair overflow-hidden bg-background"
      onClick={handleCanvasClick}
      style={{
        backgroundImage: 'radial-gradient(circle at center, hsl(var(--secondary) / 0.1) 0%, transparent 60%)',
      }}
    >
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,hsl(var(--border)_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)_/_0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
      
      {effects.map((effect) => (
        <div key={effect.id} className="absolute pointer-events-none" style={{ left: effect.x, top: effect.y }}>
            <div
                className="absolute w-12 h-12 rounded-full border-2 animate-ripple"
                style={{
                  ...tool.name === 'Standard-Issue Pickaxe' 
                        ? { backgroundColor: 'hsl(var(--accent) / 0.3)', borderColor: 'hsl(var(--accent))', boxShadow: '0 0 15px hsl(var(--accent) / 0.5)' }
                        : getEffectStyle(effect.toolName),
                  transform: 'translate(-50%, -50%)',
                }}
            />
            <div
                className="absolute text-2xl font-bold font-headline animate-float-up"
                style={{ 
                    color: (getEffectStyle(effect.toolName)).borderColor,
                    textShadow: `0 0 8px ${(getEffectStyle(effect.toolName)).borderColor}`,
                    transform: 'translateX(-50%)'
                }}
            >
                +{effect.amount}
            </div>
        </div>
      ))}
    </div>
  );
}
