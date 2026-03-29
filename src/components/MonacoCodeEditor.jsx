// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Check, Copy, Maximize2, Minimize2, Play } from 'lucide-react'

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
    case 'scss':
      return 'css'
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

/**
 * @param {{
 *   value: string;
 *   onChange: Function;
 *   filename?: string;
 *   onRun?: Function;
 *   onCursorChange?: Function;
 *   remoteCursors?: any[];
 * }} props
 */
export default function MonacoCodeEditor({
  value,
  onChange,
  filename = 'main.js',
  onRun,
  onCursorChange,
  remoteCursors = [],
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const decorationsRef = useRef([])
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const language = useMemo(() => getLanguageFromFileName(filename), [filename])

  function handleMount(editor, monaco) {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.editor.defineTheme('itecify-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C084FC' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'F59E0B' },
      ],
      colors: {
        'editor.background': '#07111f',
        'editor.foreground': '#e5eef9',
        'editor.lineHighlightBackground': '#0b1529',
        'editorCursor.foreground': '#a855f7',
      },
    })

    monaco.editor.setTheme('itecify-dark')

    editor.onDidChangeCursorPosition((event) => {
      onCursorChange?.({
        lineNumber: event.position.lineNumber,
        column: event.position.column,
      })
    })

    editor.focus()
  }

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    remoteCursors.forEach((cursor) => {
      const styleId = `remote-cursor-style-${cursor.userId}`

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.innerHTML = `
          .remote-cursor-${cursor.userId} {
            border-left: 2px solid ${cursor.color};
            margin-left: -1px;
          }
          .remote-label-${cursor.userId} {
            background: ${cursor.color};
            color: white;
            padding: 2px 6px;
            border-radius: 6px;
            margin-left: 5px;
            font-size: 10px;
          }
        `
        document.head.appendChild(style)
      }
    })

    const nextDecorations = remoteCursors.map((cursor) => ({
      range: new monaco.Range(
        cursor.lineNumber,
        cursor.column,
        cursor.lineNumber,
        cursor.column + 1
      ),
      options: {
        className: `remote-cursor-${cursor.userId}`,
        after: {
          content: cursor.username,
          inlineClassName: `remote-label-${cursor.userId}`,
        },
      },
    }))

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      nextDecorations
    )
  }, [remoteCursors])

  async function handleCopy() {
    const text = editorRef.current?.getValue() ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-[#07111f] p-4' : ''}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">{filename}</div>
            <div className="text-xs text-slate-400">{language}</div>
          </div>

          <div className="flex items-center gap-2">
            {onRun && (
              <button
                onClick={onRun}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Run
              </button>
            )}

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {isFullscreen ? 'Exit full' : 'Fullscreen'}
            </button>
          </div>
        </div>

        <Editor
          height={isFullscreen ? 'calc(100vh - 110px)' : '520px'}
          language={language}
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          onMount={handleMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            smoothScrolling: true,
            automaticLayout: true,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>
    </div>
  )
}