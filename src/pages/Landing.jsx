import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code2, Users, Shield, Clock, Play, ArrowRight, 
  Terminal, Bot, Sparkles, Zap, Globe, Lock,
  ChevronRight, Layers, Container
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Users,
    title: 'Colaborare în Timp Real',
    desc: 'Multi-cursor pentru toți utilizatorii și agenții AI. Codul scris de oameni vs. AI este vizual diferit.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
  {
    icon: Container,
    title: 'Sandboxing Docker',
    desc: 'Containere izolate on-the-fly pentru orice limbaj. Node.js, Python, Rust — totul rulează în siguranță.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    icon: Shield,
    title: 'Security Scanning',
    desc: 'Scanare live a codului pentru vulnerabilități înainte de execuție. Zero compromisuri pe securitate.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  {
    icon: Clock,
    title: 'Time-Travel Debugging',
    desc: 'Derulează înapoi prin istoricul codului. Replay-uri ale sesiunilor de codare, ca un timeline video.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
  {
    icon: Terminal,
    title: 'Terminal Comun',
    desc: 'Terminalul e și el colaborativ. Când cineva rulează o comandă, toți văd output-ul în timp real.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
  },
  {
    icon: Bot,
    title: 'AI Code Blocks',
    desc: 'Codul generat de AI apare ca blocuri Notion — poți accepta, refuza sau muta cu un singur click.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
];

const TYPING_TEXTS = [
  'def create_api():',
  'const App = () => {',
  'fn main() -> Result<()>',
  'class TaskManager:',
  'docker build -t sandbox .',
];

function TypingAnimation() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const text = TYPING_TEXTS[textIndex];

  useEffect(() => {
    if (charIndex < text.length) {
      const timer = setTimeout(() => setCharIndex(c => c + 1), 60);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setTextIndex((textIndex + 1) % TYPING_TEXTS.length);
        setCharIndex(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [charIndex, text, textIndex]);

  return (
    <span className="font-mono text-primary">
      {text.slice(0, charIndex)}
      <span className="animate-cursor-blink text-primary">|</span>
    </span>
  );
}

export default function Landing() {
  // Easter egg: Konami code
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === KONAMI[konamiProgress]) {
        const next = konamiProgress + 1;
        if (next === KONAMI.length) {
          setEasterEgg(true);
          setKonamiProgress(0);
          setTimeout(() => setEasterEgg(false), 5000);
        } else {
          setKonamiProgress(next);
        }
      } else {
        setKonamiProgress(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [konamiProgress]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Easter egg overlay */}
      {easterEgg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            className="text-center"
          >
            <p className="text-8xl mb-4">🎮</p>
            <h2 className="text-3xl font-bold text-primary glow-text-primary">Konami Code Activated!</h2>
            <p className="text-muted-foreground mt-2">You found the secret! iTEC 2026 🚀</p>
          </motion.div>
        </motion.div>
      )}

      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
            <Code2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">iTECify</span>
          <Badge variant="outline" className="text-[9px] px-1.5 border-primary/30 text-primary ml-1">
            2026
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-xs">Dashboard</Button>
          </Link>
          <Link to="/editor">
            <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 gap-1.5">
              <Play className="w-3 h-3" />
              Open Editor
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 md:pt-32 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Proba Web Development — iTEC 2026
          </Badge>
          
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            <span className="text-foreground">Code Together.</span>
            <br />
            <span className="text-primary glow-text-primary">Ship Faster.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            Platforma de colaborare în cod cu sandboxing Docker, AI code blocks 
            și time-travel debugging. Gândește-te la flexibilitatea din Figma, dar aplicată pe cod.
          </p>

          {/* Typing animation */}
          <div className="h-8 mb-8 flex items-center justify-center">
            <div className="bg-secondary/50 border border-border rounded-lg px-4 py-1.5 inline-flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{'>'}</span>
              <TypingAnimation />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link to="/editor">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 text-sm px-6 glow-primary">
                <Zap className="w-4 h-4" />
                Intră în Editor
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 text-sm px-6 border-border hover:bg-secondary">
                <Layers className="w-4 h-4" />
                Proiectele Mele
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Editor preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden glow-primary shadow-2xl"
        >
          {/* Fake title bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-card/80 border-b border-border/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono ml-2">iTECify — main.py</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] text-emerald-400 font-medium">3 online</span>
              </div>
            </div>
          </div>
          
          {/* Fake code */}
          <div className="p-4 font-mono text-xs leading-6 max-h-64 overflow-hidden relative">
            <div className="space-y-0.5">
              <div><span className="text-muted-foreground/40 mr-3">1</span><span className="text-violet-400">import</span> asyncio</div>
              <div><span className="text-muted-foreground/40 mr-3">2</span><span className="text-violet-400">from</span> fastapi <span className="text-violet-400">import</span> FastAPI</div>
              <div><span className="text-muted-foreground/40 mr-3">3</span></div>
              <div><span className="text-muted-foreground/40 mr-3">4</span>app = FastAPI()</div>
              <div><span className="text-muted-foreground/40 mr-3">5</span></div>
              <div className="relative">
                <span className="text-muted-foreground/40 mr-3">6</span>
                <span className="text-amber-400">@app.get</span>(<span className="text-emerald-400">"/tasks"</span>)
                {/* Simulated cursor */}
                <span className="absolute top-0 right-32 bg-cyan-500/20 border-l-2 border-cyan-500 px-1 text-[8px] text-cyan-400 rounded-r">Ana M.</span>
              </div>
              <div><span className="text-muted-foreground/40 mr-3">7</span><span className="text-violet-400">async def</span> <span className="text-cyan-400">get_tasks</span>():</div>
              <div><span className="text-muted-foreground/40 mr-3">8</span>    <span className="text-violet-400">return</span> {`{`}<span className="text-emerald-400">"tasks"</span>: tasks{`}`}</div>
              
              {/* AI Block preview */}
              <div className="ml-8 my-2 border border-primary/30 rounded-lg bg-primary/5 p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="w-3 h-3 text-primary" />
                  <span className="text-[8px] text-primary font-bold uppercase">AI Generated</span>
                  <Sparkles className="w-2.5 h-2.5 text-primary/50 animate-pulse-glow" />
                </div>
                <div className="text-muted-foreground/80">
                  <div><span className="text-amber-400">@app.middleware</span>(<span className="text-emerald-400">"http"</span>)</div>
                  <div><span className="text-violet-400">async def</span> <span className="text-cyan-400">rate_limit</span>(request, call_next):</div>
                  <div>    <span className="text-muted-foreground/60"># Rate limiting: max 100 req/min</span></div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-card to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">Tot ce ai nevoie, într-un singur loc</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            De la editor colaborativ la execuție izolată în containere Docker — totul fluid, sigur și în timp real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className={`group p-5 rounded-xl border ${f.border} ${f.bg} hover:scale-[1.02] transition-all duration-300 cursor-default`}
            >
              <f.icon className={`w-8 h-8 ${f.color} mb-3`} />
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          iTECify — Proba Web Development, iTEC 2026 · Built with ❤️ and ☕ at 3AM
        </p>
      </footer>
    </div>
  );
}