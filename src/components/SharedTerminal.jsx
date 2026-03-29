import { useEffect, useMemo, useRef, useState } from 'react'
import { Terminal, Play, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { addTerminalEvent, getTerminalEvents } from '@/lib/project'

export default function SharedTerminal({
  projectId,
  user,
  files,
  language = 'javascript',
}) {
  const [command, setCommand] = useState('')
  const [events, setEvents] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const bottomRef = useRef(null)

  const payloadFiles = useMemo(() => {
    return (files || []).map((file) => ({
      name: file.name,
      content: file.content || '',
      language: file.language || language,
    }))
  }, [files, language])

  useEffect(() => {
    if (!projectId) return

    let channel

    async function init() {
      const initial = await getTerminalEvents(projectId)
      setEvents(initial)

      channel = supabase.channel(`terminal-${projectId}`)
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'terminal_events',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            setEvents((prev) => [...prev, payload.new])
          }
        )
        .subscribe()
    }

    init().catch(console.error)

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  async function handleRun() {
    const cleanCommand = command.trim()
    if (!cleanCommand || !projectId || !user?.id) return

    try {
      setIsRunning(true)

      await addTerminalEvent({
        projectId,
        userId: user.id,
        type: 'command',
        command: cleanCommand,
        meta: { actor: user.email || 'user' },
      })

      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cleanCommand,
          files: payloadFiles,
          language,
          limits: {
            timeoutMs: 4000,
            maxBufferKb: 128,
            cpuLabel: 'soft-limit',
            memoryMb: 128,
          },
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        await addTerminalEvent({
          projectId,
          userId: user.id,
          type: 'stderr',
          output: data?.error || 'Execution failed.',
          exitCode: 1,
        })
        return
      }

      if (data?.stdout) {
        await addTerminalEvent({
          projectId,
          userId: user.id,
          type: 'stdout',
          output: data.stdout,
          exitCode: data.exitCode ?? 0,
          meta: data.limits || null,
        })
      }

      if (data?.stderr) {
        await addTerminalEvent({
          projectId,
          userId: user.id,
          type: 'stderr',
          output: data.stderr,
          exitCode: data.exitCode ?? 1,
          meta: data.limits || null,
        })
      }

      if (!data?.stdout && !data?.stderr) {
        await addTerminalEvent({
          projectId,
          userId: user.id,
          type: 'stdout',
          output: '[process finished with no output]',
          exitCode: data.exitCode ?? 0,
          meta: data.limits || null,
        })
      }

      setCommand('')
    } catch (error) {
      console.error(error)

      await addTerminalEvent({
        projectId,
        userId: user.id,
        type: 'stderr',
        output: error?.message || 'Terminal error.',
        exitCode: 1,
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081121] overflow-hidden">
      <div className="border-b border-white/10 p-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold text-white">
            <Terminal className="h-5 w-5" />
            Shared Terminal
          </div>
          <div className="text-sm text-slate-400">
            Everyone in the room sees commands and output live.
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          Soft resource limits enabled
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto bg-[#020817] p-4 font-mono text-sm">
        {events.length === 0 ? (
          <div className="text-slate-500">No terminal activity yet.</div>
        ) : (
          events.map((event) => {
            const color =
              event.type === 'stderr'
                ? 'text-red-300'
                : event.type === 'command'
                ? 'text-violet-300'
                : 'text-emerald-300'

            return (
              <div key={event.id} className={`mb-2 whitespace-pre-wrap ${color}`}>
                {event.type === 'command'
                  ? `$ ${event.command}`
                  : event.output}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 p-4 flex gap-2">
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Example: run"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  )
}