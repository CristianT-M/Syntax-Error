// @ts-nocheck
import React, { useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileCode2,
  Play
} from 'lucide-react'

function getLanguageFromFileName(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase()

  switch (ext) {
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
    case 'php':
      return 'php'
    case 'xml':
      return 'xml'
    case 'sql':
      return 'sql'
    case 'yml':
    case 'yaml':
      return 'yaml'
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp'
    case 'c':
      return 'c'
    default:
      return 'javascript'
  }
}

export default function MonacoCodeEditor({
  value,
  onChange,
  filename = 'main.js',
  readOnly = false,
  height = '100%',
  onRun,
}) {
  const editorRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const language = useMemo(() => getLanguageFromFileName(filename), [filename])

  const handleMount = (editor, monaco) => {
    editorRef.current = editor

    monaco.editor.defineTheme('syntax-error-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C084FC' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'delimiter', foreground: 'CBD5E1' }
      ],
      colors: {
        'editor.background': '#07111f',
        'editor.foreground': '#e5eef9',
        'editorLineNumber.foreground': '#5b6b83',
        'editorLineNumber.activeForeground': '#ffffff',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#7c3aed55',
        'editor.inactiveSelectionBackground': '#33415566',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorIndentGuide.background1': '#1e293b',
        'editorIndentGuide.activeBackground1': '#475569'
      }
    })

    monaco.editor.setTheme('syntax-error-theme')

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      jsx: monaco.languages.typescript.JsxEmit.React,
    })

    editor.focus()
  }

  const handleCopy = async () => {
    try {
      const text = editorRef.current?.getValue() ?? value ?? ''
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl ${
        isFullscreen ? 'fixed inset-4 z-[9999]' : 'relative w-full'
      }`}
      style={{ height: isFullscreen ? 'auto' : height }}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 shadow-lg">
            <FileCode2 className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{filename}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">{language}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRun}
            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Run
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
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

      <div
        className="w-full"
        style={{ height: isFullscreen ? 'calc(100vh - 88px)' : '100%' }}
      >
        <Editor
          height="100%"
          language={language}
          value={value ?? ''}
          onChange={(nextValue) => onChange?.(nextValue ?? '')}
          onMount={handleMount}
          theme="syntax-error-theme"
          options={{
            readOnly,
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 15,
            fontLigatures: true,
            wordWrap: 'on',
            smoothScrolling: true,
            mouseWheelZoom: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            tabSize: 2,
            padding: { top: 14, bottom: 14 },
            bracketPairColorization: { enabled: true },
            guides: {
              indentation: true,
              bracketPairs: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
        />
      </div>
    </div>
  )
}