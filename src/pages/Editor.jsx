import React, { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'
import { starterFiles } from '@/lib/editor-defaults'

export default function Editor() {
  const [files, setFiles] = useState(starterFiles)
  const [activeFileId, setActiveFileId] = useState(starterFiles[0]?.id ?? '1')

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#13233d_0%,#08111e_45%,#050b14_100%)] text-white">
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">Syntax Error Editor</h1>
            <p className="text-sm text-slate-400">Monaco-powered browser IDE</p>
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

      <div className="mx-auto max-w-7xl p-4">
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

        <div className="h-[78vh]">
          <MonacoCodeEditor
            filename={activeFile?.name || 'main.js'}
            value={activeFile?.content || ''}
            onChange={updateActiveFileContent}
            height="100%"
          />
        </div>
      </div>
    </div>
  )
}