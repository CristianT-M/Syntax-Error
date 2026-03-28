import React, { useMemo, useState } from 'react'
import { Plus, X, Wand2, Play } from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import { starterFiles } from '@/lib/editor-defaults'

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

function buildPreviewDocument(/** @type {any[]} */ files) {
  const htmlFiles = files.filter((/** @type {any} */ file) => isHtmlFile(file.name))
  const cssFiles = files.filter((/** @type {any} */ file) => isCssFile(file.name))
  const jsFiles = files.filter((/** @type {any} */ file) => isJsFile(file.name))

  const chosenHtml =
    htmlFiles.find((/** @type {any} */ file) => file.name.toLowerCase() === 'index.html') ||
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

  const allCss = cssFiles.map((/** @type {any} */ file) => file.content || '').join('\n\n')
  const allJs = jsFiles.map((/** @type {any} */ file) => file.content || '').join('\n\n')

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

function makeStarterContent(/** @type {string} */ type, /** @type {string} */ fileName) {
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
  const [files, setFiles] = useState(starterFiles)
  const [activeFileId, setActiveFileId] = useState(starterFiles[0]?.id ?? '1')
  const [previewDoc, setPreviewDoc] = useState(buildPreviewDocument(starterFiles))
  const [aiPrompt, setAiPrompt] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState('js')

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
    const trimmedName = newFileName.trim()
    const finalName = trimmedName || `file-${files.length + 1}.${newFileType}`

    const hasExtension = finalName.includes('.')
    const safeName = hasExtension ? finalName : `${finalName}.${newFileType}`

    const alreadyExists = files.some(
      file => file.name.toLowerCase() === safeName.toLowerCase()
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

  const closeFile = (/** @type {string} */ fileId) => {
    if (files.length === 1) return

    const nextFiles = files.filter(file => file.id !== fileId)
    setFiles(nextFiles)

    if (activeFileId === fileId) {
      setActiveFileId(nextFiles[0]?.id ?? null)
    }

    setPreviewDoc(buildPreviewDocument(nextFiles))
  }

  const runCode = () => {
    setPreviewDoc(buildPreviewDocument(files))
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
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
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
  )
}