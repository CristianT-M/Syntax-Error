// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
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
  _readOnly = false,
  _height = '100%',
  onRun,
  onCursorChange,
  remoteCursors = []
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const decorationsRef = useRef([])

  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const language = useMemo(() => getLanguageFromFileName(filename), [filename])

  const handleMount = (editor, monaco) => {
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
      ],
      colors: {
        'editor.background': '#07111f',
        'editor.foreground': '#e5eef9',
      }
    })

    monaco.editor.setTheme('syntax-error-theme')

    // 🔥 Detect cursor movement
    editor.onDidChangeCursorPosition((event) => {
      onCursorChange?.({
        lineNumber: event.position.lineNumber,
        column: event.position.column
      })
    })

    editor.focus()
  }

  // 🔥 Render remote cursors
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current

    if (!editor || !monaco) return

    const decorations = remoteCursors.map((cursor) => ({
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
          inlineClassName: `remote-label-${cursor.userId}`
        }
      }
    }))

    remoteCursors.forEach((cursor) => {
      const styleId = `cursor-style-${cursor.userId}`

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

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      decorations
    )
  }, [remoteCursors])

  const handleCopy = async () => {
    const text = editorRef.current?.getValue() ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black p-4' : ''}`}>
      <div className="rounded-2xl border border-white/10 bg-[#07111f]">
        
        <div className="flex justify-between p-3 border-b border-white/10">
          <span>{filename}</span>

          <div className="flex gap-2">
            <button onClick={onRun}>
              <Play size={16} />
            </button>

            <button onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>

            <button onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </button>
          </div>
        </div>

        <Editor
          height="600px"
          language={language}
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          onMount={handleMount}
        />
      </div>
    </div>
  )
}