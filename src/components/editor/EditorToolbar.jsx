// @ts-nocheck
import React from 'react';
import { Clock, Share2, GitBranch, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PresenceBar from './PresenceBar';
import SandboxControls from './SandboxControls';

export default function EditorToolbar({ onToggleTimeTravel, timeTravelVisible, roomName = 'iTEC 2026 Project' }) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
        {/* Left: Room info + Sandbox controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-foreground">{roomName}</span>
            <Badge variant="outline" className="h-4 text-[8px] px-1.5 border-primary/30 text-primary">
              <GitBranch className="w-2.5 h-2.5 mr-0.5" />
              main
            </Badge>
          </div>
          
          <div className="h-4 w-px bg-border" />
          <SandboxControls />
        </div>

        {/* Right: Presence + Tools */}
        <div className="flex items-center gap-3">
          <PresenceBar />
          
          <div className="h-4 w-px bg-border" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${timeTravelVisible ? 'bg-accent/10 text-accent' : ''}`}
                onClick={onToggleTimeTravel}
              >
                <Clock className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Time-Travel Debugger</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI Assistant</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Room</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}