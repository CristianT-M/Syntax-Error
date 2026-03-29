import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Eye,
  FileCode2,
  LayoutDashboard,
  MessageSquare,
  PanelLeft,
  Play,
  Save,
  SlidersHorizontal,
  TerminalSquare,
  Plus,
  Wand2,
  X,
} from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import { starterFiles } from '@/lib/editor-defaults'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ProjectChat from '@/components/ProjectChat'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

function buildPreviewDocument(files) {
  const htmlFiles = files.filter((file) => isHtmlFile(file.name))
  const cssFiles = files.filter((file) => isCssFile(file.name))
  const jsFiles = files.filter((file) => isJsFile(file.name))

  const chosenHtml = htmlFiles.find((file) => file.name.toLowerCase() === 'index.html') || htmlFiles[0]

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
  const navigate = useNavigate()
  const { projectId } = useParams()
  const auth = useAuth()
  const user = auth?.user

  const [project, setProject] = useState(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState('')

  const [files, setFiles] = useState(starterFiles)
  const [activeFileId, setActiveFileId] = useState(starterFiles[0]?.id ?? '1')
  const [previewDoc, setPreviewDoc] = useState(buildPreviewDocument(starterFiles))
  const [aiPrompt, setAiPrompt] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState('js')
  const [copied, setCopied] = useState(false)
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [layout, setLayout] = useState({
    leftWidth: 280,
    rightWidth: 360,
    bottomHeight: 250,
    showExplorer: true,
    showPreview: true,
    showChat: true,
    rightTop: 'preview',
    rightBottom: 'chat',
  })

  useEffect(() => {
    if (!user || !projectId) {
      setProjectLoading(false)
      return
    }

    async function loadProject() {
      try {
        setProjectLoading(true)
        setProjectError('')

        const { data: foundProject, error } = await supabase
          .from('projects')
          .select('*')
          .or(`id.eq.${projectId},slug.eq.${projectId}`)
          .single()

        if (error || !foundProject) {
          setProjectError('Proiectul nu există.')
          setProject(null)
          return
        }

        setProject(foundProject)
      } catch (error) {
        console.error(error)
        setProjectError('Nu am putut încărca proiectul.')
        setProject(null)
      } finally {
        setProjectLoading(false)
      }
    }

    loadProject()
  }, [projectId, user])

  useEffect(() => {
    setPreviewDoc(buildPreviewDocument(files))
  }, [files])

  useEffect(() => {
    document.title = project?.name ? `Editor — ${project.name} — iTECify` : 'Editor — iTECify'
    return () => {
      document.title = 'iTECify'
    }
  }, [project?.name])

  const activeFile = useMemo(() => {
    return files.find((file) => file.id === activeFileId) || files[0]
  }, [files, activeFileId])

  const projectLink = project ? `${window.location.origin}/editor/${project.slug}` : ''

  const updateActiveFileContent = (nextContent) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFileId ? { ...file, content: nextContent ?? '' } : file
      )
    )
    setIsSaved(false)
  }

  const createNewFile = () => {
    const trimmedName = newFileName.trim()
    const finalName = trimmedName || `file-${files.length + 1}.${newFileType}`
    const safeName = finalName.includes('.') ? finalName : `${finalName}.${newFileType}`

    const alreadyExists = files.some(
      (file) => file.name.toLowerCase() === safeName.toLowerCase()
    )

    if (alreadyExists) {
      alert('Există deja un fișier cu numele ăsta.')
      return
    }

    const newFile = {
      id: String(Date.now()),
      name: safeName,
      content: makeStarterContent(newFileType, safeName),
    }

    const nextFiles = [...files, newFile]
    setFiles(nextFiles)
    setActiveFileId(newFile.id)
    setNewFileName('')
    setNewFileType('js')
    setIsSaved(false)
  }

  const closeFile = (fileId) => {
    if (files.length === 1) return

    const nextFiles = files.filter((file) => file.id !== fileId)
    setFiles(nextFiles)

    if (activeFileId === fileId) {
      setActiveFileId(nextFiles[0]?.id ?? null)
    }

    setIsSaved(false)
  }

  const runCode = () => setPreviewDoc(buildPreviewDocument(files))
  const saveProject = () => setIsSaved(true)

  const copyProjectLink = async () => {
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

  const askAI = async () => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          code: activeFile.content,
          filename: activeFile.name,
        }),
      })

      const rawText = await res.text()
      let data

      try {
        data = JSON.parse(rawText)
      } catch {
        throw new Error(rawText || 'Răspuns invalid de la server.')
      }

      if (!res.ok) {
        throw new Error(data.error || 'AI request failed')
      }

      const newCode = data.code ?? ''

      setFiles((prev) =>
        prev.map((file) =>
          file.id === activeFileId ? { ...file, content: newCode } : file
        )
      )
      setAiPrompt('')
      setIsSaved(false)
    } catch (error) {
      alert((error instanceof Error ? error.message : String(error)) || 'A apărut o eroare la AI.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  function applyPreset(preset) {
    if (preset === 'balanced') {
      setLayout({
        leftWidth: 280,
        rightWidth: 360,
        bottomHeight: 250,
        showExplorer: true,
        showPreview: true,
        showChat: true,
        rightTop: 'preview',
        rightBottom: 'chat',
      })
    }

    if (preset === 'focus') {
      setLayout({
        leftWidth: 240,
        rightWidth: 320,
        bottomHeight: 220,
        showExplorer: true,
        showPreview: true,
        showChat: false,
        rightTop: 'preview',
        rightBottom: 'chat',
      })
    }

    if (preset === 'collab') {
      setLayout({
        leftWidth: 260,
        rightWidth: 380,
        bottomHeight: 250,
        showExplorer: true,
        showPreview: true,
        showChat: true,
        rightTop: 'chat',
        rightBottom: 'preview',
      })
    }
  }

  function updateLayout(key, value) {
    setLayout((current) => ({ ...current, [key]: value }))
  }

  function renderRightPanel(panelKey) {
    if (panelKey === 'preview' && layout.showPreview) {
      return (
        <div className="surface-panel flex-1 overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Live Preview</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Preview-ul folosește primul fișier HTML și injectează toate fișierele CSS și JS.
            </p>
          </div>
          <div className="h-[320px] min-h-[240px] p-3">
            <iframe
              title="preview"
              srcDoc={previewDoc}
              sandbox="allow-scripts"
              className="h-full w-full rounded-2xl border border-border bg-white"
            />
          </div>
        </div>
      )
    }

    if (panelKey === 'chat' && layout.showChat && project && user) {
      return (
        <div className="surface-panel flex-1 overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Project chat</h2>
            </div>
          </div>
          <div className="h-[320px] min-h-[240px]">
            <ProjectChat projectId={project.id} user={user} />
          </div>
        </div>
      )
    }

    return null
  }

  if (projectLoading) {
    return <div className="min-h-screen grid place-items-center bg-background text-foreground">Se încarcă proiectul...</div>
  }

  if (!user) {
    return <div className="min-h-screen grid place-items-center bg-background text-foreground">Trebuie să fii logat ca să intri în proiect.</div>
  }

  if (!project) {
    return <div className="min-h-screen grid place-items-center bg-background text-foreground">{projectError || 'Proiectul nu există.'}</div>
  }

  return (
    <div className="editor-shell bg-background text-foreground">
      <div className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] flex-col gap-3 px-4 py-4 sm:px-6 xl:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-bold sm:text-xl">{project.name}</h1>
                  <Badge variant="secondary">Editor</Badge>
                  <Badge className={isSaved ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10' : 'border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/10'}>
                    {isSaved ? 'Saved' : 'Unsaved changes'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Editor colaborativ + project chat + layout personalizabil</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <Button type="button" variant="outline" onClick={copyProjectLink}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied' : 'Copy project link'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLayoutEditorOpen(true)}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Edit layout
              </Button>
              <Button type="button" variant="outline" onClick={runCode}>
                <Play className="mr-2 h-4 w-4" />
                Run Preview
              </Button>
              <Button type="button" onClick={saveProject} className="glow-primary">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          <div className="truncate text-xs text-muted-foreground">{projectLink}</div>
        </div>
      </div>

      <div className="mx-auto max-w-[1700px] px-4 py-4 sm:px-6 xl:px-8">
        <div
          className="editor-grid"
          style={{
            '--left-width': layout.showExplorer ? `${layout.leftWidth}px` : '0px',
            '--right-width': layout.showPreview || layout.showChat ? `${layout.rightWidth}px` : '0px',
            '--bottom-height': `${layout.bottomHeight}px`,
          }}
        >
          {layout.showExplorer && (
            <aside className="editor-area-sidebar surface-panel flex min-h-[240px] flex-col overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <PanelLeft className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Files</h2>
                </div>
              </div>

              <div className="border-b border-border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Plus className="h-4 w-4" />
                  <p className="text-sm font-medium">Create new file</p>
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Ex: about, app, index, styles"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
                  />

                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
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
                    className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-medium transition hover:bg-secondary"
                  >
                    Create
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3">
                <div className="space-y-2">
                  {files.map((file) => {
                    const isActive = file.id === activeFileId
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                          isActive ? 'bg-primary/10 text-primary' : 'bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <button type="button" onClick={() => setActiveFileId(file.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <FileCode2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </button>

                        {files.length > 1 && (
                          <button
                            type="button"
                            onClick={() => closeFile(file.id)}
                            className="rounded-md p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </aside>
          )}

          <section className="editor-area-main min-h-[420px] overflow-hidden">
            <div className="mb-4 surface-panel p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Wand2 className="h-4 w-4" />
                AI edit current file
              </div>

              <div className="flex flex-col gap-3">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: schimbă fișierul într-un HTML valid, adaugă head și body..."
                  className="min-h-[110px] rounded-2xl border border-border bg-background p-3 text-sm outline-none"
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

            <div className="h-[56vh] min-h-[360px]">
              <MonacoCodeEditor
                filename={activeFile?.name || 'main.js'}
                value={activeFile?.content || ''}
                onChange={updateActiveFileContent}
                height="100%"
                onRun={runCode}
              />
            </div>
          </section>

          <section className="editor-area-bottom surface-panel min-h-[220px] overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-accent" />
                <h2 className="font-semibold">Terminal / Activity</h2>
              </div>
            </div>

            <div className="h-full overflow-auto bg-background/70 p-4 font-mono text-sm">
              <div className="space-y-2 text-muted-foreground">
                <p>$ npm run dev</p>
                <p>booting collaborative sandbox...</p>
                <p>workspace: {project.slug}</p>
                <p>preview updated from {activeFile?.name}</p>
                <p className="text-emerald-500">ready on local preview</p>
              </div>
            </div>
          </section>

          {(layout.showPreview || layout.showChat) && (
            <aside className="editor-area-sidepanel flex min-h-[280px] flex-col gap-4">
              {renderRightPanel(layout.rightTop)}
              {layout.rightBottom !== layout.rightTop && renderRightPanel(layout.rightBottom)}
            </aside>
          )}
        </div>
      </div>

      {layoutEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-2xl rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Edit layout</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Schimbă ordinea blocurilor, mărimea lor și ce panouri sunt vizibile.
                </p>
              </div>

              <Button type="button" variant="outline" size="icon" onClick={() => setLayoutEditorOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold">Presets</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => applyPreset('balanced')}>Balanced</Button>
                    <Button type="button" variant="outline" onClick={() => applyPreset('focus')}>Focus</Button>
                    <Button type="button" variant="outline" onClick={() => applyPreset('collab')}>Collaboration</Button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Explorer width</label>
                  <input type="range" min="200" max="420" value={layout.leftWidth} onChange={(e) => updateLayout('leftWidth', Number(e.target.value))} className="w-full" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Right panel width</label>
                  <input type="range" min="260" max="520" value={layout.rightWidth} onChange={(e) => updateLayout('rightWidth', Number(e.target.value))} className="w-full" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Bottom panel height</label>
                  <input type="range" min="180" max="420" value={layout.bottomHeight} onChange={(e) => updateLayout('bottomHeight', Number(e.target.value))} className="w-full" />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold">Visibility</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={layout.showExplorer} onChange={(e) => updateLayout('showExplorer', e.target.checked)} />Show explorer</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={layout.showPreview} onChange={(e) => updateLayout('showPreview', e.target.checked)} />Show preview</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={layout.showChat} onChange={(e) => updateLayout('showChat', e.target.checked)} />Show chat</label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Top right block</label>
                  <select value={layout.rightTop} onChange={(e) => updateLayout('rightTop', e.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-2">
                    <option value="preview">Preview</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Bottom right block</label>
                  <select value={layout.rightBottom} onChange={(e) => updateLayout('rightBottom', e.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-2">
                    <option value="chat">Chat</option>
                    <option value="preview">Preview</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <div className="mb-2 flex items-center gap-2 text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Layout tip</span>
                  </div>
                  Pentru mobil, layout-ul cade automat pe coloană, astfel încât editorul, preview-ul și chat-ul să rămână ușor de folosit.
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLayoutEditorOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
