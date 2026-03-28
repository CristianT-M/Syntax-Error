import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, X, Wand2, Play, Copy } from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import { starterFiles } from '@/lib/editor-defaults'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ProjectChat from '@/components/ProjectChat'

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

function isUUID(value = '') {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
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
  const { projectId } = useParams()
  const auth = useAuth()
  const user = auth?.user

  /** @type {[any, Function]} */
  const [project, setProject] = useState(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState('')

  /** @type {[any[], Function]} */
  const [files, setFiles] = useState(starterFiles)
  const [activeFileId, setActiveFileId] = useState(starterFiles[0]?.id ?? '1')
  const [previewDoc, setPreviewDoc] = useState(buildPreviewDocument(starterFiles))
  const [aiPrompt, setAiPrompt] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState('js')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user || !projectId) {
      setProjectLoading(false)
      return
    }

    async function loadProject() {
      try {
        setProjectLoading(true)
        setProjectError('')

        let query = supabase
          .from('projects')
          .select('*')

        if (isUUID(projectId)) {
          query = query.eq('id', projectId)
        } else {
          query = query.eq('slug', projectId)
        }

        const { data: foundProject, error } = await query.single()

        if (error || !foundProject) {
          console.error('Project load error:', error)
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

  const activeFile = useMemo(() => {
    return files.find((file) => file.id === activeFileId) || files[0]
  }, [files, activeFileId])

  const projectLink = project
    ? `${window.location.origin}/editor/${project.slug}`
    : ''

  /** @param {any} nextContent */
  const updateActiveFileContent = (nextContent) => {
    setFiles(
      /** @param {any[]} prev */
      (prev) =>
        prev.map((file) =>
          file.id === activeFileId
            ? { ...file, content: nextContent ?? '' }
            : file
        )
    )
  }

  const createNewFile = () => {
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
    setPreviewDoc(buildPreviewDocument(nextFiles))
  }

  /** @param {any} fileId */
  const closeFile = (fileId) => {
    if (files.length === 1) return

    const nextFiles = files.filter(
      /** @param {any} file */
      (file) => file.id !== fileId
    )

    setFiles(nextFiles)

    if (activeFileId === fileId) {
      setActiveFileId(nextFiles[0]?.id ?? null)
    }

    setPreviewDoc(buildPreviewDocument(nextFiles))
  }

  const runCode = () => {
    setPreviewDoc(buildPreviewDocument(files))
  }

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

      setFiles(
        /** @param {any[]} prev */
        (prev) =>
          prev.map(
            /** @param {any} file */
            (file) =>
              file.id === activeFileId
                ? { ...file, content: newCode }
                : file
          )
      )

      setAiPrompt('')
    } catch (error) {
      alert((error instanceof Error ? error.message : String(error)) || 'A apărut o eroare la AI.')
    } finally {
      setIsLoadingAI(false)
    }
  }

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
            <p className="text-sm text-slate-400">Editor colaborativ + project chat</p>
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
          <p className="truncate text-xs text-slate-400">{projectLink}</p>
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