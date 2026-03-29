// @ts-nocheck
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  Code2,
  Copy,
  FolderOpen,
  GitBranch,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
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
    content: `fn main() { println!("Hello from iTECify!"); }`,
  },
  typescript: {
    name: 'index.ts',
    content: 'console.log("Hello from iTECify!");',
  },
  go: {
    name: 'main.go',
    content: `package main\nimport "fmt"\nfunc main() { fmt.Println("Hello from iTECify!") }`,
  },
  cpp: {
    name: 'main.cpp',
    content: `#include <iostream>\nusing namespace std;\nint main() { cout << "Hello from iTECify!" << endl; return 0; }`,
  },
  java: {
    name: 'Main.java',
    content: `public class Main { public static void main(String[] args) { System.out.println("Hello from iTECify!"); } }`,
  },
}

async function handleSaveProject(project) {
  try {
    const files = Array.isArray(project?.project_files) ? project.project_files : []
    const data = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        language: project.language,
        slug: project.slug,
        saved_at: new Date().toISOString(),
      },
      files,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${project.name || 'project'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    alert('Could not save the project.')
  }
}

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    language: 'javascript',
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
        .select('*, project_files(*)')
        .eq('owner_id', user.id)
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
          updated_by: user.id,
        })

      if (fileError) throw fileError
      return project
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
      setCreateOpen(false)
      setNewProject({ name: '', description: '', language: 'javascript' })
      navigate(`/editor/${project.slug}?share=${project.share_token}`)
    },
    onError: (error) => {
      alert(error.message || 'Error creating project.')
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
      alert(error.message || 'Error deleting project.')
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
      alert('Could not copy the project link.')
    }
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <Activity className="h-3.5 w-3.5" />
              Collaboration sandbox
            </div>
            <h1 className="text-4xl font-bold">iTECify</h1>
            <p className="mt-2 text-slate-400">
              Real-time code collaboration, AI suggestions, chat, and project replay.
            </p>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-2xl bg-violet-600 hover:bg-violet-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <Code2 className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h3 className="text-2xl font-semibold">
              {search ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="mt-2 text-slate-400">
              {search
                ? 'Try another search term.'
                : 'Create your first collaborative coding workspace.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="rounded-3xl border-white/10 bg-[#0a1322] text-white">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{project.name}</h3>
                        {project.description ? (
                          <p className="mt-1 text-sm text-slate-400">{project.description}</p>
                        ) : null}
                      </div>

                      <button
                        onClick={() => deleteMutation.mutate(project.id)}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        <span
                          className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${LANG_COLORS[project.language] || 'bg-white'}`}
                        />
                        {LANG_LABELS[project.language] || project.language}
                      </Badge>

                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                        {project.slug}
                      </Badge>

                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Shared
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => navigate(`/editor/${project.slug}?share=${project.share_token}`)}
                      className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500"
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Open in Editor
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => copyProjectLink(project)}
                        className="rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiedId === project.id ? 'Copied' : 'Copy Link'}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => handleSaveProject(project)}
                        className="rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="border-white/10 bg-[#0a1322] text-white">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-2 border-white/10 bg-white/5 text-white"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-2 border-white/10 bg-white/5 text-white"
                />
              </div>

              <div>
                <Label>Main language</Label>
                <Select
                  value={newProject.language}
                  onValueChange={(value) =>
                    setNewProject((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
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
                onClick={() => createMutation.mutate(newProject)}
                disabled={!newProject.name.trim() || createMutation.isPending}
                className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}