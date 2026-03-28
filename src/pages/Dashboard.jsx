// @ts-nocheck

import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Code2,
  Search,
  Play,
  MoreHorizontal,
  Trash2,
  FolderOpen,
  ArrowLeft,
  GitBranch,
  Activity,
  Copy,
  Users
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AuthButtons from '../components/AuthButtons'
import { createProject, ensureProfile } from '@/lib/project'

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
        .select(`
          *,
          project_members (
            user_id,
            role
          )
        `)
        .or(`owner_id.eq.${user.id},id.in.(select project_id from project_members where user_id = '${user.id}')`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await ensureProfile(user)

      const project = await createProject({
        name: data.name.trim(),
        description: data.description.trim(),
        language: data.language,
        ownerId: user.id,
      })

      const starter = DEFAULT_FILES[data.language] || DEFAULT_FILES.javascript

      const { error: fileError } = await supabase
        .from('project_files')
        .insert({
          project_id: project.id,
          name: starter.name,
          language: data.language,
          content: starter.content,
          is_entry: true,
          updated_by: user.id
        })

      if (fileError) throw fileError

      return project
    },

    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
      setCreateOpen(false)
      setNewProject({
        name: '',
        description: '',
        language: 'javascript'
      })
      navigate(`/editor/${project.slug}?share=${project.share_token}`)
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

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const text = `${project.name || ''} ${project.description || ''}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [projects, search])

  async function copyProjectLink(project) {
    try {
      const link = `${window.location.origin}/editor/${project.slug}?share=${project.share_token}`
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
      <div className="sticky top-0 z-20 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
                <Code2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-bold">iTECify</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Caută proiecte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 bg-secondary/50 pl-8 text-xs"
              />
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 bg-primary text-xs hover:bg-primary/90">
                  <Plus className="h-3.5 w-3.5" />
                  Proiect Nou
                </Button>
              </DialogTrigger>

              <DialogContent className="border-border bg-card">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-lg">Creează un proiect nou</DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Nume proiect</Label>
                    <Input
                      placeholder="Ex: iTEC API Backend"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      className="bg-secondary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Descriere</Label>
                    <Input
                      placeholder="O scurtă descriere..."
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({ ...newProject, description: e.target.value })
                      }
                      className="bg-secondary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Limbaj principal</Label>
                    <Select
                      value={newProject.language}
                      onValueChange={(value) =>
                        setNewProject({ ...newProject, language: value })
                      }
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

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold">Proiectele tale</h1>
          <p className="text-sm text-muted-foreground">
            Creează și colaborează pe proiecte în timp real
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary/30" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 font-medium text-muted-foreground">
              {search ? 'Niciun proiect găsit' : 'Niciun proiect încă'}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground/60">
              {search
                ? 'Încearcă alt termen de căutare'
                : 'Creează primul tău proiect pentru a începe'}
            </p>

            {!search && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Proiect Nou
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, i) => {
              const collaboratorCount = project.project_members?.length || 1

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group overflow-hidden border-border bg-card/60 transition-all hover:border-primary/30">
                    <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            LANG_COLORS[project.language] || 'bg-muted-foreground'
                          }`}
                        />
                        <h3 className="max-w-[180px] truncate text-sm font-semibold">
                          {project.name}
                        </h3>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => copyProjectLink(project)}
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            {copiedId === project.id ? 'Copiat' : 'Copiază linkul'}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive text-xs"
                            onClick={() => deleteMutation.mutate(project.id)}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      {project.description && (
                        <p className="mb-3 line-clamp-2 text-[11px] text-muted-foreground">
                          {project.description}
                        </p>
                      )}

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="h-5 gap-1 border-border text-[9px]">
                          <GitBranch className="h-2.5 w-2.5" />
                          main
                        </Badge>

                        <Badge variant="outline" className="h-5 border-border text-[9px]">
                          {LANG_LABELS[project.language] || project.language}
                        </Badge>

                        <Badge variant="outline" className="h-5 gap-1 border-border text-[9px]">
                          <Users className="h-2.5 w-2.5" />
                          {collaboratorCount} colaboratori
                        </Badge>

                        {project.status === 'running' && (
                          <Badge
                            variant="secondary"
                            className="h-5 gap-1 border-emerald-500/20 bg-emerald-500/10 text-[9px] text-emerald-400"
                          >
                            <Activity className="h-2.5 w-2.5" />
                            Running
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Link to={`/editor/${project.slug}?share=${project.share_token}`}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-full gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
                          >
                            <Play className="h-3 w-3" />
                            Deschide în Editor
                          </Button>
                        </Link>

                        <p className="truncate text-[10px] text-muted-foreground">
                          {window.location.origin}/editor/{project.slug}?share={project.share_token}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}