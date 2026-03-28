// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import CollaboratorCursors from './CollaboratorCursors';
import AICodeBlock from './AICodeBlock';
import { Bot } from 'lucide-react';

const SAMPLE_CODE = {
  'main.py': `import asyncio
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Task(BaseModel):
    title: str
    completed: bool = False

tasks: list[Task] = []

@app.get("/tasks")
async def get_tasks():
    return {"tasks": tasks}

@app.post("/tasks")
async def create_task(task: Task):
    tasks.append(task)
    return {"status": "created", "task": task}

@app.delete("/tasks/{index}")
async def delete_task(index: int):
    if 0 <= index < len(tasks):
        removed = tasks.pop(index)
        return {"status": "deleted", "task": removed}
    return {"error": "Task not found"}`,

  'App.jsx': `import React, { useState, useEffect } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data.tasks));
  }, []);

  const addTask = async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask })
    });
    const data = await res.json();
    setTasks([...tasks, data.task]);
    setNewTask('');
  };

  return (
    <div className="app">
      <h1>Task Manager</h1>
      <input
        value={newTask}
        onChange={e => setNewTask(e.target.value)}
        placeholder="Add a new task..."
      />
      <button onClick={addTask}>Add</button>
      <ul>
        {tasks.map((task, i) => (
          <li key={i}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;`,

  'server.js': `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let tasks = [];

app.get('/api/tasks', (req, res) => {
  res.json({ tasks });
});

app.post('/api/tasks', (req, res) => {
  const task = { 
    id: Date.now(), 
    ...req.body,
    completed: false 
  };
  tasks.push(task);
  res.json({ status: 'created', task });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});`,

  'README.md': `# iTECify Project

## Getting Started
Run the following commands:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Architecture
- Frontend: React + Vite
- Backend: FastAPI (Python)
- Runtime: Docker containers`,

  'Cargo.toml': `[package]
name = "itecify-sandbox"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
axum = "0.7"`,
};

export default function CodeEditor({ activeFile = 'main.py', onCodeChange }) {
  const [code, setCode] = useState(SAMPLE_CODE[activeFile] || '// Select a file to edit');
  const editorRef = useRef(null);
  
  useEffect(() => {
    setCode(SAMPLE_CODE[activeFile] || '// Select a file to edit');
  }, [activeFile]);

  const handleCodeChange = (event) => {
    const nextCode = event.target.value;
    setCode(nextCode);
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
    setAiBlocks((prev) => prev.map((block) => block.id === id ? { ...block, status: 'accepted' } : block));
  };

  const handleRejectBlock = (id) => {
    setAiBlocks((prev) => prev.map((block) => block.id === id ? { ...block, status: 'rejected' } : block));
  };

  const [isAiTyping, setIsAiTyping] = useState(false);

  // Simulate AI typing occasionally
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAiTyping(true);
      setTimeout(() => setIsAiTyping(false), 3000);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background relative" ref={editorRef}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-card/50 px-1">
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-background border-b-2 border-primary text-xs font-mono">
          <span className="text-foreground">{activeFile}</span>
          <span className="text-muted-foreground/40 ml-2 text-[10px]">~modified</span>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto relative font-mono text-sm leading-[22px]">
        <CollaboratorCursors />

        <div className="p-2 h-full">
          <textarea
            value={code}
            onChange={handleCodeChange}
            spellCheck="false"
            className="w-full h-full min-h-[24rem] resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-[22px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />

          <div className="mt-4 space-y-3">
            {aiBlocks.filter((block) => block.status === 'pending').map((block) => (
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

      {/* AI typing indicator */}
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