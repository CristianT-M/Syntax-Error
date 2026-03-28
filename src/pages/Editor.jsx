import React, { useState } from 'react';
import FileExplorer from '../components/editor/FileExplorer';
import CodeEditor from '../components/editor/CodeEditor';
import Terminal from '../components/editor/Terminal';
import TimeTravel from '../components/editor/TimeTravel';
import EditorToolbar from '../components/editor/EditorToolbar';

export default function Editor() {
  const [activeFile, setActiveFile] = useState('main.py');
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [timeTravelVisible, setTimeTravelVisible] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top toolbar */}
      <EditorToolbar
        onToggleTimeTravel={() => setTimeTravelVisible(!timeTravelVisible)}
        timeTravelVisible={timeTravelVisible}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-48 border-r border-border bg-card/30 flex-shrink-0 hidden md:block">
          <FileExplorer
            activeFile={activeFile}
            onSelectFile={setActiveFile}
          />
        </div>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor activeFile={activeFile} />
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