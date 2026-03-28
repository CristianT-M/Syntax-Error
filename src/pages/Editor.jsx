// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Plus, X, Wand2, Play, Copy, Users } from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ProjectChat from '@/components/ProjectChat'
import {
  ensureProfile,
  ensureProjectMembership,
  getProjectBySlug,
  getProjectFiles,
  getProjectMembers,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
  getUserCursorColor,
  touchProject
} from '@/lib/project'

function debounce(fn, wait = 300) {
  let timeout

  function debounced(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn(...args)
    }, wait)
  }

  debounced.cancel = () => {
    clearTimeout(timeout)
  }

  return debounced
}

function getExtension(name = '') {
  return name.split('.').pop()?.toLowerCase() || ''
}

function isHtmlFile(name = '') {
  return getExtension(name) === 'html'
}

function isCssFile(name = '') {
  return getExtension(name) === 'css'
}

function isJsFile(name = '') {
  const ext = getExtension(name)
  return ext === 'js' || ext === 'mjs' || ext === 'cjs'
}

/**
 * @param {any[]} files
 */
function buildPreviewDocument(files) {
  const htmlFiles = files.filter((file) => isHtmlFile(file.name))
  const cssFiles = files.filter((file) => isCssFile(file.name))
  const jsFiles = files.filter((file) => isJsFile(file.name))

  const chosenHtml =
    htmlFiles.find((file) => file.name.toLowerCase() === 'index.html') ||
    htmlFiles[0]

  if (!chosenHtml) {
    return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #0b1220;
      color: white;
      display: grid;
      place-items: center;
      min-height: 100vh;
    }
    .box {
      text-align: center;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>Nu există fișier HTML</h1>
    <p>Creează un fișier .html ca să meargă preview-ul.</p>
  </div>
</body>
</html>`
  }

  let html = chosenHtml.content || ''

  const allCss = cssFiles.map((file) => file.content || '').join('\n\n')
  const allJs = jsFiles.map((file) => file.content || '').join('\n\n')

  html = html.replace(/<link[^>]*href=["'][^"']+\.css["'][^>]*>/gi, '')
  html = html.replace(/<script[^>]*src=["'][^"']+\.js["'][^>]*><\/script>/gi, '')

  if (allCss.trim()) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>\n${allCss}\n</style>\n</head>`)
    } else {
      html = `<style>\n${allCss}\n</style>\n${html}`
    }
  }

  if (allJs.trim()) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `<script>\n${allJs}\n<\/script>\n</body>`)
    } else {
      html = `${html}\n<script>\n${allJs}\n<\/script>`
    }
  }

  return html
}

/**
 * @param {string} type
 * @param {string} fileName
 */
function makeStarterContent(type, fileName) {
  switch (type) {
    case 'html':
      return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fileName}</title>
</head>
<body>

</body>
</html>`
    case 'css':
      return `body {
  margin: 0;
  font-family: Arial, sans-serif;
}`
    case 'js':
      return `console.log('Salut din ${fileName}')`
    case 'json':
      return `{
  "name": "${fileName}"
}`
    case 'md':
      return `# ${fileName}`
    case 'py':
      return `print("Salut din ${fileName}")`
    case 'cpp':
      return `#include <iostream>

int main() {
  std::cout << "Salut din ${fileName}" << std::endl;
  return 0;
}`
    default:
      return ''
  }
}

export default function Editor() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const auth = useAuth()
  const user = auth?.user

  /** @type {[any, Function]} */
  const [project, setProject] = useState(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState('')

  /** @type {[any[], Function]} */
  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [previewDoc, setPreviewDoc] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState('js')
  const [copied, setCopied] = useState(false)

  /** @type {[any[], Function]} */
  const [collaborators, setCollaborators] = useState([])
  /** @type {[any[], Function]} */
  const [remoteCursors, setRemoteCursors] = useState([])

  const fileChannelRef = useRef(null)
  const presenceChannelRef = useRef(null)

  const activeFile = useMemo(() => {
    return files.find((file) => file.id === activeFileId) || files[0] || null
  }, [files, activeFileId])

  const projectLink = project
    ? `${window.location.origin}/editor/${project.slug}?share=${project.share_token}`
    : ''

  const saveFileDebounced = useMemo(
    () =>
      debounce(async ({ fileId, content, userId, projectId }) => {
        await updateProjectFile({
          fileId,
          content,
          userId
        })

        await touchProject(projectId)
      }, 350),
    []
  )

  useEffect(() => {
    return () => {
      saveFileDebounced.cancel()
    }
  }, [saveFileDebounced])

  useEffect(() => {
    if (!user || !slug) {
      setProjectLoading(false)
      return
    }

    async function loadProject() {
      try {
        setProjectLoading(true)
        setProjectError('')

        await ensureProfile(user)

        const foundProject = await getProjectBySlug(slug)
        const shareToken = searchParams.get('share')

        if (foundProject.share_token && shareToken && shareToken !== foundProject.share_token) {
          throw new Error('Link de share invalid.')
        }

        await ensureProjectMembership(foundProject.id, user.id, 'editor')

        const [projectFiles, members] = await Promise.all([
          getProjectFiles(foundProject.id),
          getProjectMembers(foundProject.id)
        ])

        setProject(foundProject)
        setFiles(projectFiles || [])
        setActiveFileId(projectFiles?.[0]?.id ?? null)
        setPreviewDoc(buildPreviewDocument(projectFiles || []))
        setCollaborators(
          (members || []).map((member) => ({
            userId: member.user_id,
            username:
              (Array.isArray(member.profiles)
                ? member.profiles[0]?.username
                : member.profiles?.username) || 'User',
            color:
              (Array.isArray(member.profiles)
                ? member.profiles[0]?.cursor_color
                : member.profiles?.cursor_color) || getUserCursorColor(member.user_id),
            role: member.role || 'editor'
          }))
        )
      } catch (error) {
        console.error(error)
        setProjectError(error?.message || 'Nu am putut încărca proiectul.')
        setProject(null)
      } finally {
        setProjectLoading(false)
      }
    }

    loadProject()
  }, [slug, user, searchParams])

  useEffect(() => {
    setPreviewDoc(buildPreviewDocument(files))
  }, [files])

  useEffect(() => {
    if (!project?.id || !user?.id) return

    let fileChannel
    let presenceChannel

    async function setupRealtime() {
      fileChannel = supabase.channel(`project-files-${project.id}`)
      fileChannelRef.current = fileChannel

      fileChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_files',
            filter: `project_id=eq.${project.id}`
          },
          (payload) => {
            const inserted = payload.new

            setFiles((prev) => {
              if (prev.some((file) => file.id === inserted.id)) return prev
              const next = [...prev, inserted]
              return next
            })

            setActiveFileId((prev) => prev || inserted.id)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'project_files',
            filter: `project_id=eq.${project.id}`
          },
          (payload) => {
            const updated = payload.new

            setFiles((prev) =>
              prev.map((file) => (file.id === updated.id ? updated : file))
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'project_files',
            filter: `project_id=eq.${project.id}`
          },
          (payload) => {
            const deletedId = payload.old.id

            setFiles((prev) => {
              const next = prev.filter((file) => file.id !== deletedId)
              return next
            })

            setActiveFileId((prev) => {
              if (prev !== deletedId) return prev
              const remaining = files.filter((file) => file.id !== deletedId)
              return remaining[0]?.id ?? null
            })
          }
        )
        .subscribe()

      presenceChannel = supabase.channel(`project-presence-${project.id}`, {
        config: {
          presence: {
            key: user.id
          },
          broadcast: {
            self: false
          }
        }
      })

      presenceChannelRef.current = presenceChannel

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          const users = Object.values(state).flat()

          const uniqueUsers = Array.from(
            new Map(
              users.map((entry) => [
                entry.user_id,
                {
                  userId: entry.user_id,
                  username: entry.username,
                  color: entry.color,
                  role: entry.role || 'editor'
                }
              ])
            ).values()
          )

          setCollaborators(uniqueUsers)
        })
        .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
          setRemoteCursors((prev) => {
            const filtered = prev.filter((cursor) => cursor.userId !== payload.userId)
            return [...filtered, payload]
          })
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              username:
                user.user_metadata?.username ||
                user.email?.split('@')[0] ||
                'User',
              color: getUserCursorColor(user.id),
              role: 'editor'
            })
          }
        })
    }

    setupRealtime().catch((error) => {
      console.error('Realtime setup error:', error)
    })

    return () => {
      if (fileChannel) supabase.removeChannel(fileChannel)
      if (presenceChannel) supabase.removeChannel(presenceChannel)
    }
  }, [project?.id, user?.id])

  /** @param {string} nextContent */
  function updateActiveFileContent(nextContent) {
    if (!activeFile || !project?.id || !user?.id) return

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFile.id
          ? { ...file, content: nextContent ?? '' }
          : file
      )
    )

    saveFileDebounced({
      fileId: activeFile.id,
      content: nextContent ?? '',
      userId: user.id,
      projectId: project.id
    })
  }

  async function createNewFile() {
    if (!project?.id || !user?.id) return

    const trimmedName = newFileName.trim()
    const finalName = trimmedName || `file-${files.length + 1}.${newFileType}`
    const hasExtension = finalName.includes('.')
    const safeName = hasExtension ? finalName : `${finalName}.${newFileType}`

    const alreadyExists = files.some(
      (file) => file.name.toLowerCase() === safeName.toLowerCase()
    )

    if (alreadyExists) {
      alert('Există deja un fișier cu numele ăsta.')
      return
    }

    try {
      const created = await createProjectFile({
        projectId: project.id,
        name: safeName,
        language: newFileType,
        content: makeStarterContent(newFileType, safeName),
        updatedBy: user.id
      })

      setFiles((prev) => [...prev, created])
      setActiveFileId(created.id)
      setNewFileName('')
      setNewFileType('js')
      await touchProject(project.id)
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Nu am putut crea fișierul.')
    }
  }

  async function closeFile(fileId) {
    if (files.length === 1) {
      alert('Proiectul trebuie să aibă cel puțin un fișier.')
      return
    }

    try {
      await deleteProjectFile(fileId)

      const nextFiles = files.filter((file) => file.id !== fileId)
      setFiles(nextFiles)

      if (activeFileId === fileId) {
        setActiveFileId(nextFiles[0]?.id ?? null)
      }

      await touchProject(project.id)
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Nu am putut șterge fișierul.')
    }
  }

  function runCode() {
    setPreviewDoc(buildPreviewDocument(files))
  }

  async function copyProjectLink() {
    if (!projectLink) return

    try {
      await navigator.clipboard.writeText(projectLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error(error)
      alert('Nu am putut copia linkul.')
    }
  }

  async function handleCursorChange(position) {
    if (!presenceChannelRef.current || !activeFile || !user?.id) return

    try {
      await presenceChannelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: user.id,
          username:
            user.user_metadata?.username ||
            user.email?.split('@')[0] ||
            'User',
          color: getUserCursorColor(user.id),
          fileId: activeFile.id,
          lineNumber: position.lineNumber,
          column: position.column
        }
      })
    } catch (error) {
      console.error('Cursor broadcast error:', error)
    }
  }

  async function askAI() {
  if (!activeFile) {
    alert('Nu există fișier activ.')
    return
  }

  if (!aiPrompt.trim()) {
    alert('Scrie un prompt mai întâi.')
    return
  }

  try {
    setIsLoadingAI(true)

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: aiPrompt.trim(),
        code: activeFile.content ?? '',
        filename: activeFile.name,
        projectId: project?.id,
      }),
    })

    const contentType = res.headers.get('content-type') || ''
    let data

    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      const text = await res.text()
      throw new Error(text || 'Răspuns invalid de la server.')
    }

    if (!res.ok) {
      throw new Error(data?.error || 'AI request failed')
    }

    if (!data || typeof data.code !== 'string') {
      throw new Error('Serverul nu a returnat cod valid.')
    }

    const newCode = data.code

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFile.id
          ? { ...file, content: newCode }
          : file
      )
    )

    await updateProjectFile({
      fileId: activeFile.id,
      content: newCode,
      userId: user.id,
    })

    await touchProject(project.id)
    setAiPrompt('')
  } catch (error) {
    console.error('AI error:', error)
    alert(error?.message || 'A apărut o eroare la AI.')
  } finally {
    setIsLoadingAI(false)
  }
}

  const visibleRemoteCursors = remoteCursors.filter(
    (cursor) => cursor.userId !== user?.id && cursor.fileId === activeFile?.id
  )

  if (projectLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_top,#13233d_0%,#08111e_45%,#050b14_100%)] text-white">
        Se încarcă proiectul...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_top,#13233d_0%,#08111e_45%,#050b14_100%)] text-white">
        Trebuie să fii logat ca să intri în proiect.
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_top,#13233d_0%,#08111e_45%,#050b14_100%)] text-white">
        {projectError || 'Proiectul nu există.'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#13233d_0%,#08111e_45%,#050b14_100%)] text-white">
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-slate-400">
              Editor colaborativ + cursoare live + project chat
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyProjectLink}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy project link'}
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[1700px] px-4 pb-4">
          <p className="mb-3 truncate text-xs text-slate-400">{projectLink}</p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <Users className="h-4 w-4" />
              <span>{collaborators.length} online</span>
            </div>

            {collaborators.map((member) => (
              <div
                key={member.userId}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-white">{member.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1700px] gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0">
              <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Plus className="h-4 w-4" />
                  <p className="text-sm font-medium">Create new file</p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Ex: about, app, index, styles"
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                  />

                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="js">JavaScript</option>
                    <option value="json">JSON</option>
                    <option value="md">Markdown</option>
                    <option value="py">Python</option>
                    <option value="cpp">C++</option>
                  </select>

                  <button
                    type="button"
                    onClick={createNewFile}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Create
                  </button>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {files.map((file) => {
                  const isActive = file.id === activeFileId

                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 transition ${
                        isActive
                          ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFileId(file.id)}
                        className="text-sm"
                      >
                        {file.name}
                      </button>

                      {files.length > 1 && (
                        <button
                          type="button"
                          onClick={() => closeFile(file.id)}
                          className="rounded-md p-0.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <Wand2 className="h-4 w-4" />
                  AI edit current file
                </div>

                <div className="flex flex-col gap-3">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: schimbă fișierul într-un HTML valid, adaugă head și body..."
                    className="min-h-[110px] rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={askAI}
                    disabled={isLoadingAI}
                    className="w-fit rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                  >
                    {isLoadingAI ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  Fișier activ: <span className="font-semibold text-white">{activeFile?.name}</span>
                </p>

                <button
                  type="button"
                  onClick={runCode}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <Play className="h-4 w-4" />
                  Run Preview
                </button>
              </div>

              <div className="h-[72vh]">
                <MonacoCodeEditor
                  filename={activeFile?.name || 'main.js'}
                  value={activeFile?.content || ''}
                  onChange={updateActiveFileContent}
                  height="100%"
                  onRun={runCode}
                  onCursorChange={handleCursorChange}
                  remoteCursors={visibleRemoteCursors}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="h-[72vh] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl">
                <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Live Preview</p>
                  <p className="text-xs text-slate-400">
                    Preview-ul folosește primul fișier HTML și injectează toate fișierele CSS și JS.
                  </p>
                </div>

                <iframe
                  title="preview"
                  srcDoc={previewDoc}
                  sandbox="allow-scripts"
                  className="h-[calc(100%-57px)] w-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl">
            <ProjectChat projectId={project.id} user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}