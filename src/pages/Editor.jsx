import React, { useState } from 'react'
import MonacoCodeEditor from '@/components/MonacoCodeEditor'

export default function EditorPage() {
  const [code, setCode] = useState(`const app = {
  name: "Syntax Error",
  mode: "collab"
}

console.log(app)
`)

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-7xl">
        <MonacoCodeEditor
          filename="main.js"
          value={code}
          onChange={setCode}
          height="78vh"
        />
      </div>
    </div>
  )
}