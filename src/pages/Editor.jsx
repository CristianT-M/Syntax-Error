import React, { useMemo, useState } from 'react'
import { Plus, X, Wand2 } from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import { starterFiles } from '@/lib/editor-defaults'

function buildPreviewDocument(/** @type {any[]} */ files) {
  const htmlFile = files.find((/** @type {any} */ file) => file.name.endsWith('.html'))
  const cssFile = files.find((/** @type {any} */ file) => file.name.endsWith('.css'))
  const jsFile = files.find((/** @type {any} */ file) => file.name.endsWith('.js'))

  let html = htmlFile?.content || '<h1>No HTML file found</h1>'
  const css = cssFile?.content || ''
  const js = jsFile?.content || ''

  html = html.replace(
    /<link[^>]*href=["']styles\.css["'][^>]*>/i,
    `<style>${css}</style>`
  )

  html = html.replace(
    /<script[^>]*src=["']script\.js["'][^>]*><\/script>/i,
    `<script>${js}<\/script>`
  )

  if (!html.includes('<style>') && css) {
    html = html.replace('</head>', `<style>${css}</style></head>`)
  }

  if (!html.includes('<script>') && js) {
    html = html.replace('</body>', `<script>${js}<\/script></body>`)
  }

  return html
}

export default function Editor() {
  const [files, setFiles] = useState(starterFiles)
  const [activeFileId, setActiveFileId] = useState(starterFiles[0]?.id ?? '1')
  const [previewDoc, setPreviewDoc] = useState(buildPreviewDocument(starterFiles))
  const [aiPrompt, setAiPrompt] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  const activeFile = useMemo(() => {
    return files.find(file => file.id === activeFileId) || files[0]
  }, [files, activeFileId])

  const updateActiveFileContent = (/** @type {string} */ nextContent) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === activeFileId
          ? { ...file, content: nextContent ?? '' }
          : file
      )
    )
  }

  const createNewFile = () => {
    const newFile = {
      id: String(Date.now()),
      name: `file-${files.length + 1}.js`,
      content: '',
    }

    setFiles(prev => [...prev, newFile])
    setActiveFileId(newFile.id)
  }

  const closeFile = (/** @type {string} */ fileId) => {
    if (files.length === 1) return

    const nextFiles = files.filter(file => file.id !== fileId)
    setFiles(nextFiles)

    if (activeFileId === fileId) {
      setActiveFileId(nextFiles[0].id)
    }
  }

  const runCode = () => {
    setPreviewDoc(buildPreviewDocument(files))
  }

  const askAI = async () => {
    if (!activeFile || !aiPrompt.trim()) return

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

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'AI request failed')
      }

      const newCode = data.code ?? ''

      setFiles(prev =>
        prev.map(file =>
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#13233d_0%,#08111e_45%,#050b14_100%)] text-white">
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">Syntax Error Editor</h1>
            <p className="text-sm text-slate-400">Monaco + Run preview + AI</p>
          </div>

          <button
            type="button"
            onClick={createNewFile}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            <Plus className="h-4 w-4" />
            New file
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            {files.map(file => {
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
                placeholder="Ex: repară codul, fă UI mai modern, adaugă validare..."
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
              <p className="text-xs text-slate-400">Apasă Run ca să actualizezi</p>
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
  )
}