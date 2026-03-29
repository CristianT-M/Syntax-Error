import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TermIcon, ChevronUp, ChevronDown, Maximize2, X, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";

const INITIAL_LINES = [
  { text: '$ docker build -t itecify-sandbox .', type: 'command', author: 'Radu P.' },
  { text: '[+] Building 2.3s (8/8) FINISHED', type: 'success' },
  { text: ' => [internal] load build definition from Dockerfile', type: 'info' },
  { text: ' => [1/4] FROM python:3.11-slim', type: 'info' },
  { text: ' => [2/4] COPY requirements.txt .', type: 'info' },
  { text: ' => [3/4] RUN pip install -r requirements.txt', type: 'info' },
  { text: ' => [4/4] COPY . .', type: 'info' },
  { text: ' => exporting to image', type: 'info' },
  { text: '', type: 'blank' },
  { text: '$ python -m pytest tests/ -v', type: 'command', author: 'Ana M.' },
  { text: 'collected 5 items', type: 'info' },
  { text: 'tests/test_api.py::test_create_task PASSED  [20%]', type: 'success' },
  { text: 'tests/test_api.py::test_get_tasks PASSED    [40%]', type: 'success' },
  { text: 'tests/test_api.py::test_delete_task PASSED   [60%]', type: 'success' },
  { text: 'tests/test_api.py::test_validation PASSED    [80%]', type: 'success' },
  { text: 'tests/test_api.py::test_rate_limit PASSED   [100%]', type: 'success' },
  { text: '', type: 'blank' },
  { text: '========= 5 passed in 0.42s =========', type: 'success' },
];

const TYPE_COLORS = {
  command: 'text-cyan-400',
  success: 'text-emerald-400',
  error: 'text-destructive',
  warning: 'text-amber-400',
  info: 'text-muted-foreground',
  blank: '',
};

export default function Terminal({ isExpanded, onToggle }) {
  const [lines, setLines] = useState(INITIAL_LINES);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      const newLines = [
        ...lines,
        { text: `$ ${input}`, type: 'command', author: 'Tu' },
      ];

      // Simulate responses
      if (input.includes('node') || input.includes('npm')) {
        newLines.push({ text: 'Starting development server...', type: 'info' });
        newLines.push({ text: 'Server running at http://localhost:3000', type: 'success' });
      } else if (input.includes('python')) {
        newLines.push({ text: 'Python 3.11.4 sandbox container ready', type: 'success' });
      } else if (input === 'clear') {
        setLines([]);
        setInput('');
        return;
      } else if (input.includes('itecify')) {
        newLines.push({ text: '🚀 iTECify v2026.3 — Code collaboration reimagined', type: 'success' });
        newLines.push({ text: '   Powered by CRDT + Docker sandboxing', type: 'info' });
      } else {
        newLines.push({ text: `Executing in sandbox container...`, type: 'info' });
        newLines.push({ text: `Command completed successfully`, type: 'success' });
      }
      
      setLines(newLines);
      setInput('');
    }
  };

  return (
    <div className={`border-t border-border bg-card/80 backdrop-blur-sm flex flex-col transition-all duration-300 ${isExpanded ? 'h-64' : 'h-9'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 border-b border-border cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <TermIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Shared Terminal
          </span>
          <div className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-accent/10">
            <Users className="w-2.5 h-2.5 text-accent" />
            <span className="text-[9px] text-accent font-medium">4 connected</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Terminal content */}
      {isExpanded && (
        <div className="flex-1 overflow-auto p-2 font-mono text-xs" onClick={() => inputRef.current?.focus()}>
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-5">
              {line.author && (
                <span className="text-[9px] text-primary/50 min-w-[50px] text-right">[{line.author}]</span>
              )}
              <span className={TYPE_COLORS[line.type]}>{line.text}</span>
            </div>
          ))}
          
          {/* Input line */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-emerald-400">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleCommand}
              className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs"
              placeholder="Type a command..."
              autoFocus
            />
          </div>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}