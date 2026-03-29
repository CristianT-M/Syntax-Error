// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import CollaboratorCursors from './CollaboratorCursors';
import AICodeBlock from './AICodeBlock';
import { Bot } from 'lucide-react';

export default function CodeEditor({
  activeFile = 'main.py',
  code = '',
  onCodeChange,
}) {
  const editorRef = useRef(null);
  const [localCode, setLocalCode] = useState(code || '');

  useEffect(() => {
    setLocalCode(code || '');
  }, [code, activeFile]);

  const handleCodeChange = (event) => {
    const nextCode = event.target.value;
    setLocalCode(nextCode);
    if (onCodeChange) onCodeChange(nextCode);
  };

  const [aiBlocks, setAiBlocks] = useState([
    {
      id: 1,
      status: 'pending',
      description: 'AI suggests adding input validation middleware here.',
      code: `@app.middleware("http")
async def rate_limit(request, call_next):
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests"}
        )
    return await call_next(request)`,
    },
    {
      id: 2,
      status: 'pending',
      description: 'AI suggests adding a documentation route for health checks.',
      code: `@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}`,
    },
  ]);

  const handleAcceptBlock = (id) => {
    setAiBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, status: 'accepted' } : block
      )
    );
  };

  const handleRejectBlock = (id) => {
    setAiBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, status: 'rejected' } : block
      )
    );
  };

  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAiTyping(true);
      setTimeout(() => setIsAiTyping(false), 3000);
    }, 8000);

    return () => clearTimeout(timer);
  }, [activeFile]);

  return (
    <div className="h-full flex flex-col bg-background relative" ref={editorRef}>
      <div className="flex items-center border-b border-border bg-card/50 px-1">
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-background border-b-2 border-primary text-xs font-mono">
          <span className="text-foreground">{activeFile}</span>
          <span className="text-muted-foreground/40 ml-2 text-[10px]">~modified</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative font-mono text-sm leading-[22px]">
        <CollaboratorCursors />

        <div className="p-2 h-full">
          <textarea
            value={localCode}
            onChange={handleCodeChange}
            spellCheck="false"
            className="w-full h-full min-h-[24rem] resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-[22px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />

          <div className="mt-4 space-y-3">
            {aiBlocks
              .filter((block) => block.status === 'pending')
              .map((block) => (
                <AICodeBlock
                  key={block.id}
                  code={block.code}
                  description={block.description}
                  status={block.status}
                  onAccept={() => handleAcceptBlock(block.id)}
                  onReject={() => handleRejectBlock(block.id)}
                />
              ))}
          </div>
        </div>
      </div>

      {isAiTyping && (
        <div className="absolute bottom-3 left-14 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
          <Bot className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-primary font-medium">iTECify AI is typing</span>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}