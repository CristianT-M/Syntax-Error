// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import FileExplorer from '../components/editor/FileExplorer';
import CodeEditor from '../components/editor/CodeEditor';
import Terminal from '../components/editor/Terminal';
import TimeTravel from '../components/editor/TimeTravel';
import EditorToolbar from '../components/editor/EditorToolbar';
import AuthButtons from '../components/AuthButtons';
import { supabase } from '../lib/supabase';

/**
 * @typedef {Object} File
 * @property {string} id
 * @property {string} name
 * @property {string} language
 * @property {string} content
 * @property {boolean} is_entry
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 */

export default function Editor() {
  const { projectId } = useParams();

  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [timeTravelVisible, setTimeTravelVisible] = useState(false);

  /** @type {[Project | null, Function]} */
  const [project, setProject] = useState(null);
  /** @type {[File[], Function]} */
  const [files, setFiles] = useState([]);
  /** @type {[string, Function]} */
  const [activeFile, setActiveFile] = useState('');
  const [loading, setLoading] = useState(true);

  /** @type {React.MutableRefObject<NodeJS.Timeout | null>} */
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      setLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error(projectError);
        alert(projectError.message || 'Nu am putut încărca proiectul.');
        setLoading(false);
        return;
      }

      const { data: fileData, error: fileError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (fileError) {
        console.error(fileError);
        alert(fileError.message || 'Nu am putut încărca fișierele.');
        setLoading(false);
        return;
      }

      setProject(projectData);
      setFiles(fileData || []);

      const entryFile =
        (fileData || []).find((file) => file.is_entry) ||
        (fileData || [])[0] ||
        null;

      if (entryFile) {
        setActiveFile(entryFile.name);
      } else {
        setActiveFile('');
      }

      setLoading(false);
    };

    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!activeFile || files.length === 0) return;

    const selected = files.find((file) => file.name === activeFile);
    if (selected) {
      // Selection confirmed
    }
  }, [activeFile, files]);

  /**
   * @param {string} fileName
   * @param {string} nextContent
   */
  const saveFileContent = async (fileName, nextContent) => {
    const file = files.find((f) => f.name === fileName);
    if (!file) return;

    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('project_files')
      .update({
        content: nextContent,
        updated_at: nowIso,
      })
      .eq('id', file.id);

    if (updateError) {
      console.error(updateError);
      return;
    }

    await supabase.from('project_snapshots').insert({
      project_id: projectId,
      file_id: file.id,
      content: nextContent,
    });
  };

  /**
   * @param {string} nextCode
   */
  const handleCodeChange = (nextCode) => {
    // @ts-ignore
    setFiles((prev) =>
      prev.map((file) =>
        // @ts-ignore
        file.name === activeFile ? { ...file, content: nextCode } : file
      )
    );

    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveFileContent(activeFile, nextCode);
    }, 1000);
  };

  /**
   * @param {{name: string, language: string}} newFile
   */
  const handleAddFile = async (newFile) => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        name: newFile.name,
        language: newFile.language,
        content: '',
        is_entry: false,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message || 'Nu am putut crea fișierul.');
      return;
    }

    // @ts-ignore
    setFiles((prev) => [...prev, data]);
    setActiveFile(data.name);
  };

  if (!projectId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        Se încarcă editorul...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EditorToolbar
        onToggleTimeTravel={() => setTimeTravelVisible(!timeTravelVisible)}
        timeTravelVisible={timeTravelVisible}
        // @ts-ignore
        roomName={project?.name || 'Project'}
      />

      <div className="border-b border-border bg-card/40 px-4 py-2 flex items-center justify-end">
        <AuthButtons />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-border bg-card/30 flex-shrink-0 hidden md:block">
          {/* @ts-ignore */}
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onAddFile={handleAddFile}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              activeFile={activeFile}
              onCodeChange={handleCodeChange}
            />
          </div>

          <TimeTravel
            isVisible={timeTravelVisible}
            onToggle={() => setTimeTravelVisible(false)}
          />

          <Terminal
            isExpanded={terminalExpanded}
            onToggle={() => setTerminalExpanded(!terminalExpanded)}
          />
        </div>
      </div>
    </div>
  );
}