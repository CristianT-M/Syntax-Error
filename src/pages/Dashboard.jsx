// @ts-nocheck

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Code2, Search, Play,
  MoreHorizontal, Trash2, FolderOpen, ArrowLeft,
  GitBranch, Activity, Copy
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AuthButtons from '../components/AuthButtons'

const LANG_COLORS = {
  javascript: 'bg-amber-400',
  python: 'bg-emerald-400',
  rust: 'bg-orange-400',
  typescript: 'bg-blue-400',
  go: 'bg-cyan-400',
  cpp: 'bg-blue-500',
  java: 'bg-red-400',
}

const LANG_LABELS = {
  javascript: 'JavaScript',
  python: 'Python',
  rust: 'Rust',
  typescript: 'TypeScript',
  go: 'Go',
  cpp: 'C++',
  java: 'Java',
}

const DEFAULT_FILES = {
  javascript: {
    name: 'index.js',
    content: 'console.log("Hello from iTECify!");',
  },
  python: {
    name: 'main.py',
    content: 'print("Hello from iTECify!")',
  },
  rust: {
    name: 'main.rs',
    content: `fn main() {
    println!("Hello from iTECify!");
}`,
  },
  typescript: {
    name: 'index.ts',
    content: 'console.log("Hello from iTECify!");',
  },
  go: {
    name: 'main.go',
    content: `package main

import "fmt"

func main() {
    fmt.Println("Hello from iTECify!")
}`,
  },
  cpp: {
    name: 'main.cpp',
    content: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello from iTECify!" << endl;
  return 0;
}`,
  },
  java: {
    name: 'Main.java',
    content: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from iTECify!");
  }
}`,
  },
}

function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    language: 'javascript'
  })

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  const createMutation = useMutation({
  mutationFn: async (data) => {
    const slug = generateSlug()

    // 1. creează proiectul
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: data.name.trim(),
        description: data.description.trim(),
        language: data.language,
        slug,
        is_public: true,
      })
      .select()
      .single()

    if (projectError) throw projectError

    // 2. creează fișier default
    const starter = DEFAULT_FILES[data.language] || DEFAULT_FILES.javascript

    const { error: fileError } = await supabase
      .from('project_files')
      .insert({
        project_id: project.id,
        name: starter.name,
        language: data.language,
        content: starter.content,
        is_entry: true,
      })

    if (fileError) throw fileError

    return project
  },

  onSuccess: (project) => {
    queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
    setCreateOpen(false)
    setNewProject({ name: '', description: '', language: 'javascript' })

    // 🔥 IMPORTANT
    navigate(`/editor/${project.slug}`)
  },

  onError: (error) => {
    alert(error.message || 'Eroare la creare proiect.')
  },
})

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
    },
    onError: (error) => {
      alert(error.message || 'Eroare la ștergere proiect.')
    },
  })

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function copyProjectLink(project) {
    try {
      const link = `${window.location.origin}/editor/${project.slug}`
      await navigator.clipboard.writeText(link)
      setCopiedId(project.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (error) {
      console.error(error)
      alert('Nu am putut copia linkul proiectului.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-sm">iTECify</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Caută proiecte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-56 text-xs bg-secondary/50"
              />
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90">
                  <Plus className="w-3.5 h-3.5" />
                  Proiect Nou
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-card border-border">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-lg">Creează un proiect nou</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Nume proiect</Label>
                    <Input
                      placeholder="Ex: iTEC API Backend"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Descriere</Label>
                    <Input
                      placeholder="O scurtă descriere..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Limbaj principal</Label>
                    <Select
                      value={newProject.language}
                      onValueChange={(value) => setNewProject({ ...newProject, language: value })}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LANG_LABELS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => createMutation.mutate(newProject)}
                    disabled={!newProject.name.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Se creează...' : 'Creează Proiect'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <AuthButtons />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Proiectele tale</h1>
          <p className="text-sm text-muted-foreground">
            Creează și colaborează pe proiecte în timp real
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-1">
              {search ? 'Niciun proiect găsit' : 'Niciun proiect încă'}
            </h3>
            <p className="text-sm text-muted-foreground/60 mb-4">
              {search ? 'Încearcă alt termen de căutare' : 'Creează primul tău proiect pentru a începe'}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5" />
                Proiect Nou
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card/60 border-border hover:border-primary/30 transition-all group overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${LANG_COLORS[project.language] || 'bg-muted-foreground'}`} />
                      <h3 className="font-semibold text-sm truncate max-w-[180px]">{project.name}</h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => copyProjectLink(project)}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          {copiedId === project.id ? 'Copiat' : 'Copiază linkul'}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-destructive text-xs"
                          onClick={() => deleteMutation.mutate(project.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Șterge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    {project.description && (
                      <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="outline" className="h-5 text-[9px] border-border gap-1">
                        <GitBranch className="w-2.5 h-2.5" />
                        main
                      </Badge>

                      <Badge variant="outline" className="h-5 text-[9px] border-border gap-1">
                        {LANG_LABELS[project.language] || project.language}
                      </Badge>

                      {project.status === 'running' && (
                        <Badge
                          variant="secondary"
                          className="h-5 text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1"
                        >
                          <Activity className="w-2.5 h-2.5" />
                          Running
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Link to={`/editor/${project.slug}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full h-7 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary"
                        >
                          <Play className="w-3 h-3" />
                          Deschide în Editor
                        </Button>
                      </Link>

                      <p className="truncate text-[10px] text-muted-foreground">
                        {window.location.origin}/editor/{project.slug}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}