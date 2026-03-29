import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, Wifi } from 'lucide-react';

const COLORS = [
  'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 
  'bg-amber-500', 'bg-rose-500', 'bg-blue-500'
];

export default function PresenceBar({ collaborators = [] }) {
  const defaultCollabs = collaborators.length > 0 ? collaborators : [
    { name: 'Tu', email: 'you@itec.ro', type: 'human', active: true },
    { name: 'Ana M.', email: 'ana@itec.ro', type: 'human', active: true },
    { name: 'Radu P.', email: 'radu@itec.ro', type: 'human', active: true },
    { name: 'iTECify AI', email: 'ai@itec.ro', type: 'ai', active: true },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
        </div>
        <div className="flex -space-x-2">
          {defaultCollabs.map((c, i) => (
            <Tooltip key={i}>
              <TooltipTrigger>
                <div className={`relative w-7 h-7 rounded-full ${c.type === 'ai' ? 'bg-primary/20 border-primary/50' : COLORS[i % COLORS.length]} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-110 transition-transform`}>
                  {c.type === 'ai' ? (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    c.name.charAt(0)
                  )}
                  {c.active && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{c.name} {c.type === 'ai' && '🤖'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-1">{defaultCollabs.length} online</span>
      </div>
    </TooltipProvider>
  );
}