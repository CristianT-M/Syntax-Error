// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Blocks,
  Bot,
  Clock3,
  Code2,
  Container,
  Cpu,
  MonitorSmartphone,
  Shield,
  Sparkles,
  TerminalSquare,
  Users,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AuthButtons from '@/components/AuthButtons'
import ThemeToggle from '@/components/ThemeToggle'

const PAGE_TITLES = [
  'iTECify — collaborative coding sandbox',
  'iTECify — code together, ship faster',
  'iTECify — AI + humans, one workspace',
  'iTECify — build, test and preview live',
  'iTECify — shared terminal, shared flow',
  'iTECify — time-travel your coding session',
  'iTECify — smarter sandbox execution',
  'iTECify — edit code with your whole team',
  'iTECify — built for ITEC 2026',
  'iTECify — real-time development, rethought',
]

const FEATURES = [
  { icon: Users, title: 'Colaborare în timp real', desc: 'Mai mulți utilizatori lucrează în aceeași sesiune, cu prezență vizibilă și feedback instant.' },
  { icon: Bot, title: 'AI pair programming', desc: 'Asistentul AI poate propune cod și idei fără să rupă flow-ul echipei.' },
  { icon: Blocks, title: 'AI blocks controlabile', desc: 'Sugestiile AI pot fi tratate ca blocuri clare, acceptate sau respinse ușor.' },
  { icon: Container, title: 'Sandboxing modern', desc: 'Rulezi și testezi proiecte într-un mediu izolat, mai sigur și mai predictibil.' },
  { icon: TerminalSquare, title: 'Shared terminal', desc: 'Toți colegii văd output-ul comenzilor și înțeleg imediat ce se întâmplă în runtime.' },
  { icon: Clock3, title: 'Time-travel debugging', desc: 'Poți revedea evoluția sesiunii și urmări când a apărut o problemă.' },
  { icon: Cpu, title: 'Smart resource limits', desc: 'Mediul rămâne stabil chiar și când cineva execută cod problematic.' },
  { icon: MonitorSmartphone, title: 'Responsive workspace', desc: 'View curat și adaptat pentru desktop, tabletă și mobil.' },
]

export default function Landing() {
  const [titleIndex, setTitleIndex] = useState(0)

  useEffect(() => {
    const next = Math.floor(Math.random() * PAGE_TITLES.length)
    setTitleIndex(next)
    document.title = PAGE_TITLES[next]
    return () => { document.title = 'iTECify' }
  }, [])

  const activeTitle = useMemo(() => PAGE_TITLES[titleIndex], [titleIndex])

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 glow-primary">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold sm:text-lg">iTECify</p>
                <p className="truncate text-xs text-muted-foreground">Collaborative coding sandbox</p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">ITEC 2026</Badge>
              <Badge variant="secondary" className="bg-secondary/70">AI + Team Workspace</Badge>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/dashboard" className="hidden sm:block">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <AuthButtons />
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-5 flex flex-wrap items-center gap-3">
                  <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Built for iTEC 2026
                  </Badge>
                  <Badge variant="secondary" className="max-w-full truncate">{activeTitle}</Badge>
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }} className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Un spațiu unde
                  <span className="glow-text-primary"> oamenii, AI-ul </span>
                  și codul lucrează împreună.
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  iTECify este o platformă de code collaboration și sandboxing gândită pentru sesiuni moderne de dezvoltare: editor comun, sugestii AI, terminal partajat, preview live și control mai bun asupra modului în care îți organizezi workspace-ul.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="glow-primary">
                    <Link to="/editor">
                      Intră în editor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/dashboard">Vezi proiectele mele</Link>
                  </Button>
                </motion.div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Real-time', 'collaboration flow'],
                    ['AI + Human', 'shared workspace'],
                    ['Live preview', 'and shared terminal'],
                    ['Layout control', 'for every team'],
                  ].map(([value, label]) => (
                    <div key={label} className="surface-panel p-4">
                      <p className="text-lg font-semibold">{value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.45 }} className="surface-panel p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Workspace preview</p>
                    <p className="text-xs text-muted-foreground">editor, AI blocks, preview și terminal</p>
                  </div>
                  <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">Live</Badge>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">workspace.tsx</p>
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border border-background bg-cyan-400/80" />
                        <div className="h-8 w-8 rounded-full border border-background bg-violet-400/80" />
                        <div className="h-8 w-8 rounded-full border border-background bg-emerald-400/80" />
                      </div>
                    </div>

                    <div className="space-y-2 font-mono text-sm">
                      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                        <span className="text-cyan-500 dark:text-cyan-300">Ana</span> editează sincronizarea
                      </div>
                      <div className="code-line-ai rounded-xl px-3 py-2">
                        <span className="font-semibold text-primary">AI block:</span> propune structură pentru shared terminal și sandbox lifecycle
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                        <span className="text-emerald-600 dark:text-emerald-300">Radu</span> lucrează la preview și layout controls
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <TerminalSquare className="h-4 w-4 text-accent" />
                        <p className="text-sm font-medium">Shared terminal</p>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">$ npm run dev<br />sandbox booted...<br />preview ready on port 4173</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Time-travel</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Rewind modificările până la punctul în care a apărut bug-ul.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <p className="text-sm font-medium">Safe execution</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Resource limits, containere izolate și runtime mai sigur.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="surface-panel p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/40">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.desc}</p>
                  </div>
                )
              })}
            </div>
          </section>
        </main>

        <footer className="border-t border-border/70 bg-background/85">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-bold tracking-wide">ITEC 2026</p>
              <p className="mt-1 text-sm text-muted-foreground">iTECify — collaborative coding sandbox for modern teams.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-muted/30 px-3 py-1">Real-time collaboration</span>
              <span className="rounded-full border border-border bg-muted/30 px-3 py-1">AI-assisted workflow</span>
              <span className="rounded-full border border-border bg-muted/30 px-3 py-1">Custom editor layout</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
