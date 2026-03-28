import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Bot, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const HISTORY_ENTRIES = [
  { time: '03:00', author: 'Ana M.', type: 'human', desc: 'Initialized FastAPI project', file: 'main.py' },
  { time: '03:04', author: 'Radu P.', type: 'human', desc: 'Created React App component', file: 'App.jsx' },
  { time: '03:08', author: 'iTECify AI', type: 'ai', desc: 'Generated Express server routes', file: 'server.js' },
  { time: '03:12', author: 'Ana M.', type: 'human', desc: 'Added task CRUD endpoints', file: 'main.py' },
  { time: '03:15', author: 'iTECify AI', type: 'ai', desc: 'Added rate limiting middleware', file: 'main.py' },
  { time: '03:18', author: 'Radu P.', type: 'human', desc: 'Added task list UI with hooks', file: 'App.jsx' },
  { time: '03:22', author: 'iTECify AI', type: 'ai', desc: 'Generated Dockerfile config', file: 'Dockerfile' },
  { time: '03:25', author: 'Ana M.', type: 'human', desc: 'Added unit tests', file: 'tests/test_api.py' },
  { time: '03:28', author: 'iTECify AI', type: 'ai', desc: 'Optimized query performance', file: 'main.py' },
  { time: '03:30', author: 'Radu P.', type: 'human', desc: 'Styled components with Tailwind', file: 'App.jsx' },
];

export default function TimeTravel({ isVisible, onToggle }) {
  const [currentIndex, setCurrentIndex] = useState(HISTORY_ENTRIES.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= HISTORY_ENTRIES.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!isVisible) return null;

  const entry = HISTORY_ENTRIES[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border-t border-border bg-card/90 backdrop-blur-sm"
    >
      <div className="px-4 py-2 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">Time-Travel Debugger</span>
        </div>
        <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={onToggle}>Close</Button>
      </div>

      <div className="px-4 py-3">
        {/* Timeline */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted-foreground font-mono w-10">{HISTORY_ENTRIES[0].time}</span>
          <Slider
            value={[currentIndex]}
            max={HISTORY_ENTRIES.length - 1}
            step={1}
            onValueChange={([val]) => setCurrentIndex(val)}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground font-mono w-10">{HISTORY_ENTRIES[HISTORY_ENTRIES.length - 1].time}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentIndex(0)}>
              <SkipBack className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 bg-primary/10 hover:bg-primary/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-3 h-3 text-primary" /> : <Play className="w-3 h-3 text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentIndex(Math.min(HISTORY_ENTRIES.length - 1, currentIndex + 1))}>
              <ChevronRight className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentIndex(HISTORY_ENTRIES.length - 1)}>
              <SkipForward className="w-3 h-3" />
            </Button>
          </div>

          {/* Current entry info */}
          <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-1.5">
            {entry.type === 'ai' ? (
              <Bot className="w-3.5 h-3.5 text-primary" />
            ) : (
              <User className="w-3.5 h-3.5 text-accent" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold">{entry.author}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{entry.time}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{entry.desc}</p>
            </div>
            <span className="text-[10px] font-mono text-primary/70 ml-2">{entry.file}</span>
          </div>
        </div>

        {/* Mini timeline dots */}
        <div className="flex items-center gap-1 mt-2 justify-center">
          {HISTORY_ENTRIES.map((e, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex 
                  ? 'scale-150 ' + (e.type === 'ai' ? 'bg-primary' : 'bg-accent')
                  : i <= currentIndex 
                    ? (e.type === 'ai' ? 'bg-primary/40' : 'bg-accent/40')
                    : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}