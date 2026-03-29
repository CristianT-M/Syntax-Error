import React, { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Copy, Plus, Play, Save, Users, Wand2 } from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import ProjectChat from '@/components/ProjectChat'
import { useAuth } from '@/lib/AuthContext'
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
  return ext === 'js' || ext === 'mjs' || ext === 'cjs'
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
      <html>
        <body style="background:#07111f;color:white;font-family:Inter,Arial,sans-serif;padding:24px;">
          <h1>Nu există fișier HTML</h1>
          <p>Creează un fișier .html ca să meargă preview-ul.</p>
        </body>
      </html>
    `
  }

  let html = chosenHtml.content || ''
  const allCss = cssFiles
    .map(
      /** @param {any} file */
      (file) => file.content || ''
    )
    .join('\n\n')
  const allJs = jsFiles
    .map(
      /** @param {any} file */
      (file) => file.content || ''
    )
    .join('\n\n')

  html = html.replace(/<link[^>]*href=["'][^"']+\.css["'][^>]*>/gi, '')
  html = html.replace(/<script[^>]*src=["'][^"']+\.js["'][^>]*><\/script>/gi, '')

  if (allCss.trim()) {
    if (html.includes('</head>')) html = html.replace('</head>', `<style>${allCss}</style></head>`)
    else html = `<style>${allCss}</style>${html}`
  }

  if (allJs.trim()) {
    if (html.includes('</body>')) html = html.replace('</body>', `<script>${allJs}</script></body>`)
    else html = `${html}<script>${allJs}</script>`
  }

  return html
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

  const saveContentDebounced = useMemo(
    () =>
      debounce(
        /** @param {{fileId: string, content: string, userId: string, projectId: string}} params */
        async ({ fileId, content, userId, projectId }) => {
          await updateProjectFile({ fileId, content, userId })
          await touchProject(projectId)
        },
        400
      ),
    []
  )

  useEffect(() => {
    return () => {
      saveContentDebounced.cancel()
    }
  }, [saveContentDebounced])

  useEffect(() => {
    if (!slug || !user?.id) return

    let cancelled = false

    async function loadProject() {
      try {
        setIsLoading(true)

        await ensureProfile(user)

        if (!slug) throw new Error('No project slug provided')
        const foundProject = await getProjectBySlug(slug)

        const shareToken = searchParams.get('share')
        if (foundProject.share_token && shareToken && shareToken !== foundProject.share_token) {
          throw new Error('Invalid share link.')
        }

        await ensureProjectMembership(foundProject.id, user.id, 'editor')

        const [projectFiles, members] = await Promise.all([
          getProjectFiles(foundProject.id),
          getProjectMembers(foundProject.id),
        ])

        if (cancelled) return

        setProject(foundProject)
        setFiles(projectFiles)
        setActiveFileId(projectFiles[0]?.id ?? null)
        setCollaborators(
          members.map((member) => ({
            userId: member.user_id,
            username: member.profiles?.username || 'User',
            color: member.profiles?.cursor_color || getUserCursorColor(member.user_id),
            role: member.role,
          }))
        )
      } catch (error) {
        console.error(error)
        alert(((error instanceof Error ? error.message : String(error)) || 'Could not load project.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadProject()

    return () => {
      cancelled = true
    }
  }, [slug, searchParams, user])

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
          /** @param {any[]} prev */
          (prev) => {
            if (
              prev.some(
                /** @param {any} file */
                (file) => file.id === inserted.id
              )
            ) return prev
            return [...prev, inserted]
          })
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
            /** @param {any[]} prev */
            (prev) =>
              prev.map(
                /** @param {any} file */
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
          .map((entry) => {
            /** @type {any} */
            const entryData = entry
            return {
              userId: (entryData?.user_id || entryData?.['user_id']) ?? '',
              username: (entryData?.username || entryData?.['username']) ?? 'User',
              color: (entryData?.color || entryData?.['color']) ?? '#000000',
            }
          })

        const uniqueUsers = Array.from(new Map(onlineUsers.map((u) => [u.userId, u])).values())
        setCollaborators(
          /** @param {any[]} prev */
          (prev) => {
            const roleMap = new Map(
              prev.map(
                /** @param {any} item */
                (item) => [item.userId, item.role]
              )
            )
          return uniqueUsers.map((userItem) => ({
            ...userItem,
            role: roleMap.get(userItem.userId) || 'editor',
          }))
        })
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        setRemoteCursors(
          /** @param {any[]} prev */
          (prev) => {
            /** @type {any[]} */
            const next = prev.filter(
              /** @param {any} item */
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
    if (!project?.id) return
    if (!newFileName.trim()) {
      alert('Scrie numele fișierului.')
      return
    }

    try {
      setIsCreatingFile(true)

      let normalizedName = newFileName.trim()
      const extension = getExtension(normalizedName)

      if (!extension) {
        const _map = {
          javascript: 'js',
          html: 'html',
          css: 'css',
          python: 'py',
          json: 'json',
        }
        normalizedName = `${normalizedName}.${{ javascript: 'js', html: 'html', css: 'css', python: 'py', json: 'json' }[newFileLanguage] || 'js'}`
      }

      const _starterContentMap = {
        html: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
        css: 'body {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n',
        javascript: 'console.log("Hello from iTECify!");\n',
        python: 'print("Hello from iTECify!")\n',
        json: '{\n  "hello": "world"\n}\n',
      }

      const created = await createProjectFile({
        projectId: project.id,
        name: normalizedName,
        language: getLanguageFromFilename(normalizedName),
        content: { html: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>', css: 'body {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n', javascript: 'console.log("Hello from iTECify!");\n', python: 'print("Hello from iTECify!")\n', json: '{\n  "hello": "world"\n}\n' }[newFileLanguage] || '',
        updatedBy: user.id,
      })

      setFiles(
        /** @param {any[]} prev */
        (prev) => [...prev, created]
      )
      setActiveFileId(created.id)
      setNewFileName('')
      await touchProject(project.id)
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Nu s-a putut crea fișierul.'
      alert(message)
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
      /** @param {any[]} prev */
      (prev) =>
        prev.map(
          /** @param {any} file */
          (file) =>
            file.id === activeFile.id
              ? { ...file, content: nextValue }
              : file
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
        content: activeFile.content,
        userId: user.id,
      })

      await touchProject(project.id)
      alert('Project saved.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : String(error) || 'Nu s-a putut salva proiectul.'
      alert(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCopyShareLink() {
    if (!project) return

    try {
      const url = `${window.location.origin}/editor/${project.slug}?share=${project.share_token}`
      await navigator.clipboard.writeText(url)
      alert('Project link copied.')
    } catch (error) {
      console.error(error)
      alert('Nu s-a putut copia linkul.')
    }
  }

  /**
   * @param {any} position
   */
  async function handleCursorChange(position) {
    if (!presenceChannelRef.current || !activeFile || !user?.id) return

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

  function handleGenerateAiEdit() {
    if (!aiPrompt.trim()) {
      alert('Scrie ce vrei să modifice AI-ul.')
      return
    }

    alert('Butonul AI este doar UI momentan. Dacă vrei, îți scriu și integrarea reală.')
  }

  const visibleRemoteCursors = remoteCursors.filter(
    (cursor) => cursor.userId !== user?.id && cursor.fileId === activeFile?.id
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b14] text-white flex items-center justify-center">
        Loading project...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <div className="mx-auto max-w-[1700px] p-4">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0f172a,#172554,#0b1020)] p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>

              <h1 className="text-3xl font-bold break-words">{project?.name || 'Untitled project'}</h1>
              <p className="mt-1 text-slate-300">
                Editor colaborativ + cursoare live + project chat
              </p>

              <p className="mt-4 text-sm text-slate-400 break-all">
                {window.location.origin}/editor/{project?.slug}
                {project?.share_token ? `?share=${project.share_token}` : ''}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                  <Users className="h-4 w-4" />
                  {collaborators.length} online
                </div>

                {collaborators.map((member) => (
                  <div
                    key={member.userId}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                    {member.username}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Copy className="h-4 w-4" />
              Copy project link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr_0.65fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0b1220,#1a2640)] p-4">
              <div className="mb-4 flex items-center gap-2 text-2xl font-semibold">
                <Plus className="h-5 w-5" />
                Create new file
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Ex: about, app, index, styles"
                  className="flex-1 rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />

                <select
                  value={newFileLanguage}
                  onChange={(e) => setNewFileLanguage(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-white outline-none"
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
                  className="rounded-2xl bg-slate-600 px-6 py-3 font-semibold text-white transition hover:bg-slate-500 disabled:opacity-60"
                >
                  {isCreatingFile ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeFileId === file.id
                      ? 'bg-fuchsia-900/70 text-white border border-fuchsia-400/40'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0b1220,#1a2640)] p-4">
              <div className="mb-4 flex items-center gap-2 text-2xl font-semibold">
                <Wand2 className="h-5 w-5" />
                AI edit current file
              </div>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: schimbă fișierul într-un HTML valid, adaugă head și body..."
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={handleGenerateAiEdit}
                className="mt-4 rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500"
              >
                Generate with AI
              </button>
            </div>

            <div>
              <div className="mb-3 text-2xl font-semibold">
                Fișier activ: <span className="font-bold">{activeFile?.name || 'niciun fișier'}</span>
              </div>

              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => setPreview(buildPreviewDocument(files))}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400"
                >
                  <Play className="h-4 w-4" />
                  Run Preview
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#081121]">
                {activeFile ? (
                  <MonacoCodeEditor
                    filename={activeFile.name}
                    value={activeFile.content || ''}
                    onChange={handleFileContentChange}
                    onCursorChange={handleCursorChange}
                    remoteCursors={visibleRemoteCursors ?? []}
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-slate-400">
                    Selectează sau creează un fișier.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#081121]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-2xl font-semibold">Live Preview</h2>
              <p className="text-sm text-slate-400">
                Preview-ul folosește primul fișier HTML și injectează toate fișierele CSS și JS.
              </p>
            </div>

            <iframe
              title="preview"
              srcDoc={preview}
              className="h-[760px] w-full bg-white"
              sandbox="allow-scripts"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#081121]">
            {project?.id ? <ProjectChat projectId={project.id} user={user} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}