// @ts-nocheck
import React, { useEffect, useMemo, useRef } from 'react'
import Editor from '@monaco-editor/react'

function getLanguageFromFileName(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
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
    case 'py':
      return 'python'
    case 'java':
      return 'java'
    case 'cpp':
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
  onCursorChange,
  remoteCursors = [],
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const decorationsRef = useRef([])

  const language = useMemo(() => getLanguageFromFileName(filename), [filename])

  function handleMount(editor, monaco) {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.editor.defineTheme('itecify-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#07111f',
        'editor.lineHighlightBackground': '#0b1529',
      },
    })

    monaco.editor.setTheme('itecify-dark')

    editor.onDidChangeCursorPosition((event) => {
      onCursorChange?.({
        lineNumber: event.position.lineNumber,
        column: event.position.column,
      })
    })
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

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]">
      <Editor
        height="520px"
        language={language}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          wordWrap: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  )
}