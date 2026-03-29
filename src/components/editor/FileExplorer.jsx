// @ts-nocheck
import React, { useState } from 'react';
import { File, FolderOpen, Plus, ChevronRight, ChevronDown, FileCode, FileText, Hash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILE_ICONS = {
  js: { icon: FileCode, color: 'text-amber-400' },
  jsx: { icon: FileCode, color: 'text-cyan-400' },
  ts: { icon: FileCode, color: 'text-blue-400' },
  tsx: { icon: FileCode, color: 'text-blue-400' },
  py: { icon: FileCode, color: 'text-emerald-400' },
  rs: { icon: FileCode, color: 'text-orange-400' },
  go: { icon: FileCode, color: 'text-cyan-400' },
  cpp: { icon: Hash, color: 'text-blue-400' },
  md: { icon: FileText, color: 'text-muted-foreground' },
  json: { icon: FileCode, color: 'text-amber-300' },
};

function getFileIcon(name) {
  const ext = name.split('.').pop();
  return FILE_ICONS[ext] || { icon: File, color: 'text-muted-foreground' };
}

export default function FileExplorer({ files = [], activeFile, onSelectFile, onAddFile }) {
  const [expanded, setExpanded] = useState(true);

  const defaultFiles = files.length > 0 ? files : [
    { name: 'main.py', language: 'python' },
    { name: 'App.jsx', language: 'javascript' },
    { name: 'server.js', language: 'javascript' },
    { name: 'README.md', language: 'markdown' },
    { name: 'Cargo.toml', language: 'rust' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Explorer</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onAddFile}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-1">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-2 py-1 w-full text-left text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <FolderOpen className="w-3.5 h-3.5 text-primary/70" />
          <span>project</span>
        </button>
        
        {expanded && defaultFiles.map((file, idx) => {
          const { icon: Icon, color } = getFileIcon(file.name);
          const isActive = activeFile === file.name || (!activeFile && idx === 0);
          return (
            <button
              key={file.name}
              onClick={() => onSelectFile?.(file.name)}
              className={cn(
                "flex items-center gap-2 pl-7 pr-3 py-1 w-full text-left text-xs transition-colors",
                isActive 
                  ? "bg-primary/10 text-foreground border-r-2 border-primary" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", color)} />
              <span className="font-mono text-[11px]">{file.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}