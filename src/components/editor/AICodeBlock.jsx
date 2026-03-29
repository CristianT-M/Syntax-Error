import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Check, X, GripVertical, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AICodeBlock({ code, description, onAccept, onReject, status = 'pending' }) {
  if (status === 'accepted') return null;
  if (status === 'rejected') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="relative my-1 group"
      >
        <div className="border border-primary/30 rounded-lg bg-primary/5 overflow-hidden glow-primary">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3 h-3 text-primary/40 cursor-grab" />
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Generated</span>
              <Sparkles className="w-3 h-3 text-primary/60 animate-pulse-glow" />
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 hover:bg-emerald-500/20 hover:text-emerald-400"
                onClick={onAccept}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
                onClick={onReject}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Description */}
          {description && (
            <div className="px-3 py-1 bg-primary/5 border-b border-primary/10">
              <p className="text-[10px] text-primary/70 italic">{description}</p>
            </div>
          )}
          
          {/* Code */}
          <div className="p-3 font-mono text-xs leading-relaxed">
            {code.split('\n').map((line, i) => (
              <div key={i} className="code-line-ai pl-2">
                <span className="text-muted-foreground/50 select-none inline-block w-6 text-right mr-3 text-[10px]">{i + 1}</span>
                <span className="text-foreground/90">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}