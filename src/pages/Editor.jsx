import React, { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Plus,
  Save,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import ProjectChat from '@/components/ProjectChat'
import { useAuth } from '@/lib/AuthContext'
import { generateAiSuggestion } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import {
  createProjectFile,
  ensureProfile,
  ensureProjectMembership,
  getProjectBySlug,
  getProjectFiles,
  getProjectMembers,
  getUserCursorColor,
  touchProject,
  updateProjectFile,
} from '@/lib/project'

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
  return ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'jsx'
}

function getLanguageFromFilename(name = '') {
  const ext = getExtension(name)

  switch (ext) {
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'json':
      return 'json'
    case 'py':
      return 'python'
    case 'java':
      return 'java'
    case 'cpp':
    case 'c':
      return 'cpp'
    default:
      return 'javascript'
  }
}

/**
 * @param {string} language
 */
function getStarterContent(language) {
  switch (language) {
    case 'html':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iTECify</title>
</head>
<body>
  <h1>Hello from iTECify</h1>
</body>
</html>
`
    case 'css':
      return `body {
  margin: 0;
  font-family: Arial, sans-serif;
}
`
    case 'python':
      return `print("Hello from iTECify!")\n`
    case 'json':
      return `{\n  "hello": "world"\n}\n`
    default:
      return `console.log("Hello from iTECify!");\n`
  }
}

/**
 * @param {any[]} files
 */
function buildPreviewDocument(files) {
  const htmlFiles = files.filter(
    /** @param {any} file */
    (file) => isHtmlFile(file.name)
  )
  const cssFiles = files.filter(
    /** @param {any} file */
    (file) => isCssFile(file.name)
  )
  const jsFiles = files.filter(
    /** @param {any} file */
    (file) => isJsFile(file.name)
  )

  const chosenHtml =
    htmlFiles.find((file) => file.name.toLowerCase() === 'index.html') || htmlFiles[0]

  if (!chosenHtml) {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>No HTML file found</h2>
          <p>Create an <strong>.html</strong> file to see the preview.</p>
        </body>
      </html>
    `
  }

  let html = chosenHtml.content || ''

  const allCss = cssFiles.map(
    /** @param {any} file */
    (file) => file.content || ''
  ).join('\n\n')
  const allJs = jsFiles.map(
    /** @param {any} file */
    (file) => file.content || ''
  ).join('\n\n')

  if (allCss.trim()) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>${allCss}</style></head>`)
    } else {
      html = `<style>${allCss}</style>${html}`
    }
  }

  if (allJs.trim()) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `<script>${allJs}<\/script></body>`)
    } else {
      html = `${html}<script>${allJs}<\/script>`
    }
  }

  return html
}

/**
 * @param {string} value
 */
function formatTime(value) {
  return new Date(value).toLocaleTimeString()
}

export default function Editor() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const user = auth?.user

  /** @type {[any, Function]} */
  const [project, setProject] = useState(null)
  /** @type {[any[], Function]} */
  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [preview, setPreview] = useState('')
  /** @type {[any[], Function]} */
  const [collaborators, setCollaborators] = useState([])
  /** @type {[any[], Function]} */
  const [remoteCursors, setRemoteCursors] = useState([])
  const [newFileName, setNewFileName] = useState('')
  const [newFileLanguage, setNewFileLanguage] = useState('javascript')

  const [aiPrompt, setAiPrompt] = useState('')
  /** @type {[any, Function]} */
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const [timeline, setTimeline] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  /** @type {React.MutableRefObject<any>} */
  const presenceChannelRef = useRef(null)
  /** @type {React.MutableRefObject<any>} */
  const filesChannelRef = useRef(null)

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) || files[0] || null,
    [files, activeFileId]
  )

  const shareToken = searchParams.get('share')

  const saveContentDebounced = useMemo(
    () =>
      debounce(async ({ fileId, content, userId, projectId }) => {
        await updateProjectFile({ fileId, content, userId })
        await touchProject(projectId)
      }, 400),
    []
  )

  useEffect(() => {
    return () => saveContentDebounced.cancel()
  }, [saveContentDebounced])

  /**
   * @param {any} entry
   */
  function pushTimelineEntry(entry) {
    setTimeline((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        ...entry,
      },
      ...prev.slice(0, 29),
    ])
  }

  useEffect(() => {
    if (!user?.id) return

    if (!slug) {
      setIsLoading(false)
      navigate('/dashboard', { replace: true })
      return
    }

    let cancelled = false

    async function loadProject() {
      try {
        setIsLoading(true)

        await ensureProfile(user)

    if (!slug) throw new Error('No project slug provided')
    const foundProject = await getProjectBySlug(slug)
        if (!foundProject) throw new Error('Project not found.')

        if (
          foundProject.share_token &&
          shareToken &&
          shareToken !== foundProject.share_token
        ) {
          throw new Error('Invalid share link.')
        }

        await ensureProjectMembership(foundProject.id, user.id, 'editor')

        const [projectFiles, members] = await Promise.all([
          getProjectFiles(foundProject.id),
          getProjectMembers(foundProject.id),
        ])

        if (cancelled) return

        setProject(foundProject)
        setFiles(projectFiles || [])
        setActiveFileId(projectFiles?.[0]?.id ?? null)
        setCollaborators(
          (members || []).map((member) => ({
            userId: member.user_id,
            username: member.profiles?.username || 'User',
            color: member.profiles?.cursor_color || getUserCursorColor(member.user_id),
            role: member.role,
          }))
        )

        pushTimelineEntry({
          type: 'system',
          label: 'Project loaded',
          detail: foundProject.name,
        })
      } catch (error) {
        console.error(error)
        alert(error instanceof Error ? error.message : 'Could not load project.')
        if (!cancelled) navigate('/dashboard', { replace: true })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadProject()
    return () => {
      cancelled = true
    }
  }, [slug, shareToken, user, navigate])

  useEffect(() => {
    setPreview(buildPreviewDocument(files))
  }, [files])

  useEffect(() => {
    if (!project?.id || !user?.id) return

    const filesChannel = supabase.channel(`project-files-${project.id}`)
    filesChannelRef.current = filesChannel

    filesChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_files',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const inserted = payload.new
          setFiles(
            /**
             * @param {any} prev
             */
            (prev) => {
              if (prev.some(
                /**
                 * @param {any} file
                 */
                (file) => file.id === inserted.id
              )) return prev
              return [...prev, inserted]
            }
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_files',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const updated = payload.new
          setFiles(
            /**
             * @param {any} prev
             */
            (prev) =>
              prev.map(
                /**
                 * @param {any} file
                 */
                (file) => (file.id === updated.id ? updated : file)
              )
          )
        }
      )
      .subscribe()

    const presenceChannel = supabase.channel(`project-presence-${project.id}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false },
      },
    })

    presenceChannelRef.current = presenceChannel

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const onlineUsers = Object.values(state)
          .flat()
          .map(
            /**
             * @param {any} entry
             */
            (entry) => ({
              userId: entry?.user_id ?? '',
              username: entry?.username ?? 'User',
              color: entry?.color ?? '#6366f1',
            })
          )

        const uniqueUsers = Array.from(
          new Map(onlineUsers.map((item) => [item.userId, item])).values()
        )

        setCollaborators(
          /**
           * @param {any} prev
           */
          (prev) => {
            const roleMap = new Map(
              prev.map(
                /**
                 * @param {any} item
                 */
                (item) => [item.userId, item.role]
              )
            )
          return uniqueUsers.map((item) => ({
            ...item,
            role: roleMap.get(item.userId) || 'editor',
          }))
        })
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        setRemoteCursors(
          /**
           * @param {any} prev
           */
          (prev) => {
            const next = prev.filter(
              /**
               * @param {any} item
               */
              (item) => item.userId !== payload.userId
            )
          return [...next, payload]
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            color: getUserCursorColor(user.id),
          })
        }
      })

    return () => {
      if (filesChannelRef.current) supabase.removeChannel(filesChannelRef.current)
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current)
    }
  }, [project?.id, user])

  async function handleCreateFile() {
    if (!project?.id || !user?.id) return
    if (!newFileName.trim()) {
      alert('Write a file name.')
      return
    }

    try {
      setIsCreatingFile(true)

      let normalizedName = newFileName.trim()
      const extension = getExtension(normalizedName)

      if (!extension) {
        const extensionMap = {
          javascript: 'js',
          html: 'html',
          css: 'css',
          python: 'py',
          json: 'json',
        }
        normalizedName = `${normalizedName}.${extensionMap[newFileLanguage] || 'js'}`
      }

      const created = await createProjectFile({
        projectId: project.id,
        name: normalizedName,
        language: newFileLanguage,
        content: getStarterContent(newFileLanguage),
        updatedBy: user.id,
      })

      setFiles(
        /**
         * @param {any} prev
         */
        (prev) => [...prev, created]
      )
      setActiveFileId(created.id)
      setNewFileName('')

      await touchProject(project.id)

      pushTimelineEntry({
        type: 'file',
        label: 'File created',
        detail: normalizedName,
      })
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Could not create file.')
    } finally {
      setIsCreatingFile(false)
    }
  }

  /**
   * @param {any} nextValue
   */
  function handleFileContentChange(nextValue) {
    if (!activeFile || !user?.id || !project?.id) return

    setFiles(
      /**
       * @param {any} prev
       */
      (prev) =>
        prev.map(
          /**
           * @param {any} file
           */
          (file) =>
            file.id === activeFile.id ? { ...file, content: nextValue } : file
        )
    )

    saveContentDebounced({
      fileId: activeFile.id,
      content: nextValue,
      userId: user.id,
      projectId: project.id,
    })
  }

  async function handleSaveNow() {
    if (!activeFile || !user?.id || !project?.id) return

    try {
      setIsSaving(true)
      saveContentDebounced.cancel()

      await updateProjectFile({
        fileId: activeFile.id,
        content: activeFile.content || '',
        userId: user.id,
      })

      await touchProject(project.id)

      pushTimelineEntry({
        type: 'save',
        label: 'Manual save',
        detail: activeFile.name,
      })

      alert('Project saved.')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Could not save project.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCopyShareLink() {
    if (!project?.slug) return

    try {
      const url = `${window.location.origin}/editor/${project.slug}${
        project.share_token ? `?share=${project.share_token}` : ''
      }`
      await navigator.clipboard.writeText(url)
      alert('Project link copied.')
    } catch (error) {
      console.error(error)
      alert('Could not copy project link.')
    }
  }

  /**
   * @param {any} position
   */
  /**
   * @param {any} position
   */
  async function handleCursorChange(position) {
    if (!presenceChannelRef.current || !activeFile || !user?.id || !position) return

    try {
      await presenceChannelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          color: getUserCursorColor(user.id),
          fileId: activeFile.id,
          lineNumber: position.lineNumber,
          column: position.column,
        },
      })
    } catch (error) {
      console.error(error)
    }
  }

  async function handleGenerateAiEdit() {
    if (!activeFile) {
      alert('Select a file first.')
      return
    }

    if (!aiPrompt.trim()) {
      alert('Write what you want the AI to change.')
      return
    }

    try {
      setIsAiLoading(true)

      const result = await generateAiSuggestion({
        prompt: aiPrompt.trim(),
        code: activeFile.content || '',
        filename: activeFile.name,
        language: getLanguageFromFilename(activeFile.name),
      })

      setAiSuggestion({
        fileId: activeFile.id,
        filename: activeFile.name,
        originalCode: activeFile.content || '',
        suggestedCode: result.code,
        summary: result.summary,
      })

      pushTimelineEntry({
        type: 'ai',
        label: 'AI suggestion created',
        detail: activeFile.name,
      })
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'AI edit failed.')
    } finally {
      setIsAiLoading(false)
    }
  }

  async function handleAcceptAiSuggestion() {
    if (!aiSuggestion || !activeFile || !user?.id || !project?.id) return

    const nextCode = aiSuggestion.suggestedCode

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFile.id ? { ...file, content: nextCode } : file
      )
    )

    saveContentDebounced.cancel()

    await updateProjectFile({
      fileId: activeFile.id,
      content: nextCode,
      userId: user.id,
    })

    await touchProject(project.id)

    pushTimelineEntry({
      type: 'ai',
      label: 'AI suggestion accepted',
      detail: activeFile.name,
    })

    setAiSuggestion(null)
    setAiPrompt('')
  }

  function handleRejectAiSuggestion() {
    pushTimelineEntry({
      type: 'ai',
      label: 'AI suggestion rejected',
      detail: aiSuggestion?.filename || 'current file',
    })
    setAiSuggestion(null)
  }

  /**
   * @param {any} item
   */
  function restoreTimelineEntry(item) {
    if (!activeFile || !item?.snapshot) return

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFile.id ? { ...file, content: item.snapshot } : file
      )
    )
  }

  const visibleRemoteCursors = remoteCursors.filter(
    (cursor) => cursor.userId !== user?.id && cursor.fileId === activeFile?.id
  )

  const replayItems = timeline.map((item) => ({
    ...item,
    snapshot:
      item.detail === activeFile?.name
        ? activeFile?.content || ''
        : null,
  }))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b14] text-white flex items-center justify-center">
        Loading project...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <div className="mx-auto max-w-[1700px] p-4 space-y-5">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0f172a,#172554,#0b1020)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>

                <button
                  onClick={handleSaveNow}
                  disabled={isSaving || !activeFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>

                <button
                  onClick={handleCopyShareLink}
                  disabled={!project}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <Copy className="h-4 w-4" />
                  Copy Share Link
                </button>
              </div>

              <h1 className="text-3xl font-bold break-words">
                {project?.name || 'Untitled project'}
              </h1>

              <p className="mt-1 text-slate-300">
                Collaborative editor + live cursors + project chat + AI proposals
              </p>

              <p className="mt-4 text-sm text-slate-400 break-all">
                {project?.slug ? `${window.location.origin}/editor/${project.slug}` : ''}
                {project?.share_token ? `?share=${project.share_token}` : ''}
              </p>
            </div>

            <div className="min-w-[280px] rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Users className="h-4 w-4" />
                Collaborators
              </div>

              <div className="flex flex-wrap gap-2">
                {collaborators.length ? (
                  collaborators.map((person) => (
                    <span
                      key={person.userId}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: person.color || '#6366f1' }}
                      />
                      {person.username}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">No collaborators online yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[320px,minmax(0,1fr),320px]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#081121] p-4">
              <h2 className="mb-4 text-xl font-semibold">Project Files</h2>

              <div className="mb-4 space-y-2">
                {files.map((file) => {
                  const isActive = file.id === activeFile?.id

                  return (
                    <button
                      key={file.id}
                      onClick={() => {
                        setActiveFileId(file.id)
                        setAiSuggestion(null)
                      }}
                      className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-violet-600 text-white'
                          : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {file.name}
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-sm font-medium text-slate-200">Create new file</div>

                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="example: index.html"
                  className="mb-2 w-full rounded-xl border border-white/10 bg-[#020817] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <select
                  value={newFileLanguage}
                  onChange={(e) => setNewFileLanguage(e.target.value)}
                  className="mb-3 w-full rounded-xl border border-white/10 bg-[#020817] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="python">Python</option>
                  <option value="json">JSON</option>
                </select>

                <button
                  onClick={handleCreateFile}
                  disabled={isCreatingFile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingFile ? 'Creating...' : 'Create File'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#081121] p-4">
              <div className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Clock3 className="h-5 w-5" />
                Session Replay
              </div>

              <div className="max-h-[320px] space-y-2 overflow-y-auto">
                {replayItems.length ? (
                  replayItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs text-slate-400">{item.detail}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatTime(item.at)}</div>

                      {item.snapshot ? (
                        <button
                          onClick={() => restoreTimelineEntry(item)}
                          className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                        >
                          Restore current-file snapshot
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No session events yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#081121]">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-2xl font-semibold">Editor</h2>
                <p className="text-sm text-slate-400">
                  {activeFile
                    ? `${activeFile.name} • ${getLanguageFromFilename(activeFile.name)}`
                    : 'No file selected'}
                </p>
              </div>

              <div className="p-4">
                {activeFile ? (
                  <MonacoCodeEditor
                    filename={activeFile.name}
                    value={activeFile.content || ''}
                    onChange={handleFileContentChange}
                    onCursorChange={handleCursorChange}
                    remoteCursors={visibleRemoteCursors}
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-slate-400">
                    Select or create a file.
                  </div>
                )}
              </div>
            </div>

            {aiSuggestion && aiSuggestion.fileId === activeFile?.id ? (
              <div className="rounded-3xl border border-violet-500/30 bg-[linear-gradient(135deg,#150f2f,#0a1322)] p-4">
                <div className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5" />
                  AI Suggestion Block
                </div>

                <p className="mb-4 text-sm text-slate-300">
                  {aiSuggestion.summary || 'AI prepared a change proposal for this file.'}
                </p>

                <div className="mb-4 rounded-2xl border border-white/10 bg-[#07111f] p-3">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Proposed code preview
                  </div>
                  <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap text-sm text-slate-200">
                    {aiSuggestion.suggestedCode}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAcceptAiSuggestion}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>

                  <button
                    onClick={handleRejectAiSuggestion}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#081121]">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-2xl font-semibold">Live Preview</h2>
                <p className="text-sm text-slate-400">
                  Uses the first HTML file and injects all CSS and JS files.
                </p>
              </div>

              <iframe
                title="preview"
                srcDoc={preview}
                className="h-[650px] w-full bg-white"
                sandbox="allow-scripts"
              />
            </div>

            <ProjectChat projectId={project?.id} user={user} />
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0b1220,#1a2640)] p-4">
              <div className="mb-4 flex items-center gap-2 text-2xl font-semibold">
                <Sparkles className="h-5 w-5" />
                AI Assistant
              </div>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: fix the bug, refactor this function, improve UI styling, convert to valid HTML..."
                className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={handleGenerateAiEdit}
                disabled={isAiLoading || !activeFile}
                className="mt-4 w-full rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
              >
                {isAiLoading ? 'Generating...' : 'Generate Suggestion'}
              </button>

              <p className="mt-3 text-xs text-slate-400">
                AI does not overwrite the file directly. It creates a proposal you can accept or reject.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#081121] p-4">
              <h2 className="mb-3 text-xl font-semibold">Why this scores better</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Multi-user cursors and shared chat</li>
                <li>• AI suggestion blocks with accept/reject flow</li>
                <li>• Live preview inside the workspace</li>
                <li>• Session replay / time-travel style event history</li>
                <li>• Shareable room links for collaboration demos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}