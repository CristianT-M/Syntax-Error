// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  FileCode2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react'

const DEFAULT_CODE = `function greet(name) {
  return \`Salut, \${name}!\`
}

console.log(greet("iTEC"))
`

function getLanguageFromFilename(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'js':
      return 'javascript'
    case 'jsx':
      return 'javascript'
    case 'ts':
      return 'typescript'
    case 'tsx':
      return 'typescript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'scss':
      return 'scss'
    case 'md':
      return 'markdown'
    case 'py':
      return 'python'
    case 'java':
      return 'java'
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp'
    case 'c':
      return 'c'
    case 'php':
      return 'php'
    case 'xml':
      return 'xml'
    case 'sql':
      return 'sql'
    case 'yaml':
    case 'yml':
      return 'yaml'
    default:
      return 'javascript'
  }
}

export default function MonacoCodeEditor({
  /** @type {string} */
  value,
  /** @type {(value: string) => void} */
  onChange,
  filename = 'main.js',
  height = '70vh',
  readOnly = false,
  theme = 'vs-dark'
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const language = useMemo(() => getLanguageFromFilename(filename), [filename])

  const safeValue = value ?? DEFAULT_CODE

  const handleEditorDidMount = (/** @type {any} */ editor, /** @type {any} */ monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.editor.defineTheme('syntax-error-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C084FC' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'identifier', foreground: 'E5E7EB' }
      ],
      colors: {
        'editor.background': '#0B1020',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#E2E8F0',
        'editorCursor.foreground': '#F8FAFC',
        'editor.selectionBackground': '#7C3AED55',
        'editor.inactiveSelectionBackground': '#33415566',
        'editor.lineHighlightBackground': '#FFFFFF08',
        'editorIndentGuide.background1': '#1E293B',
        'editorIndentGuide.activeBackground1': '#475569'
      }
    })

    monaco.editor.setTheme('syntax-error-theme')

    editor.focus()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editorRef.current?.getValue() ?? safeValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleResetView = () => {
    if (!editorRef.current) return

    editorRef.current.updateOptions({
      fontSize: 14,
      minimap: { enabled: false }
    })
    editorRef.current.layout()
    editorRef.current.focus()
  }

  useEffect(() => {
    const onResize = () => {
      editorRef.current?.layout()
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl ${
        isFullscreen ? 'fixed inset-4 z-[9998]' : 'relative w-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg">
            <FileCode2 className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{filename}</p>
            <p className="text-xs text-slate-400">{language}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            type="button"
          >
            <span className="flex items-center gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>

          <button
            onClick={handleResetView}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            type="button"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            type="button"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="w-full bg-[#0B1020]" style={{ height: isFullscreen ? 'calc(100vh - 88px)' : height }}>
        <Editor
          height="100%"
          language={language}
          value={safeValue}
          onChange={(nextValue) => onChange?.(nextValue ?? '')}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            readOnly,
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontLigatures: true,
            wordWrap: 'on',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 16, bottom: 16 },
            roundedSelection: true,
            scrollBeyondLastLine: false,
            bracketPairColorization: { enabled: true },
            guides: {
              indentation: true,
              bracketPairs: true
            },
            suggest: {
              showKeywords: true,
              showSnippets: true
            }
          }}
        />
      </div>
    </div>
  )
}