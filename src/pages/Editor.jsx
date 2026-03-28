import React, { useState } from 'react';
import FileExplorer from '../components/editor/FileExplorer';
import CodeEditor from '../components/editor/CodeEditor';
import Terminal from '../components/editor/Terminal';
import TimeTravel from '../components/editor/TimeTravel';
import EditorToolbar from '../components/editor/EditorToolbar';
import AuthButtons from '../components/AuthButtons';

export default function Editor() {
  const [activeFile, setActiveFile] = useState('main.py');
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [timeTravelVisible, setTimeTravelVisible] = useState(false);
  const [files, setFiles] = useState([
    { name: 'main.py', language: 'python' },
    { name: 'App.jsx', language: 'javascript' },
  ]);

  const handleAddFile = (/** @type {{ name: string; language: string }} */ newFile) => {
    setFiles([...files, newFile]);
  };

  const handleCodeChange = (/** @type {string} */ _code) => {
    // Handle code changes - could save to state or backend
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top toolbar */}
      <EditorToolbar
        onToggleTimeTravel={() => setTimeTravelVisible(!timeTravelVisible)}
        timeTravelVisible={timeTravelVisible}
      />

      {/* Auth bar */}
      <div className="border-b border-border bg-card/40 px-4 py-2 flex items-center justify-end">
        <AuthButtons />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-48 border-r border-border bg-card/30 flex-shrink-0 hidden md:block">
          <FileExplorer
            files={/** @type {any} */(files)}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onAddFile={handleAddFile}
          />
        </div>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor activeFile={activeFile} onCodeChange={handleCodeChange} />
          </div>

          {/* Time Travel */}
          <TimeTravel
            isVisible={timeTravelVisible}
            onToggle={() => setTimeTravelVisible(false)}
          />

          {/* Terminal */}
          <Terminal
            isExpanded={terminalExpanded}
            onToggle={() => setTerminalExpanded(!terminalExpanded)}
          />
        </div>
      </div>
    </div>
  );
}