// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2, Users, Shield, Play,
  Zap, Layers, Container
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthButtons from '../components/AuthButtons';

const FEATURES = [
  {
    icon: Users,
    title: 'Colaborare în Timp Real',
    desc: 'Multi-cursor pentru toți utilizatorii și agenții AI.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
  {
    icon: Container,
    title: 'Sandboxing Docker',
    desc: 'Containere izolate pentru orice limbaj.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    icon: Shield,
    title: 'Security',
    desc: 'Scanare live a codului pentru vulnerabilități.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold">iTECify</span>
          <Badge variant="outline" className="text-[9px] ml-1">
            2026
          </Badge>
        </div>

        {/* 🔥 AICI ESTE PARTEA IMPORTANTĂ */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>

          <Link to="/editor">
            <Button size="sm" className="gap-1.5">
              <Play className="w-3 h-3" />
              Editor
            </Button>
          </Link>

          <AuthButtons />
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-6">
            Code Together.
            <br />
            <span className="text-primary">Ship Faster.</span>
          </h1>

          <p className="text-muted-foreground mb-8">
            Platformă de colaborare cu AI și sandboxing.
          </p>

          <div className="flex justify-center gap-4">
            <Link to="/editor">
              <Button className="gap-2">
                <Zap className="w-4 h-4" />
                Intră în Editor
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button variant="outline">
                <Layers className="w-4 h-4 mr-2" />
                Proiectele Mele
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-5 rounded-xl border ${f.border} ${f.bg}`}
            >
              <f.icon className={`w-6 h-6 ${f.color} mb-2`} />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          iTECify 2026 🚀
        </p>
      </footer>
    </div>
  );
}