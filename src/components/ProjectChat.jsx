import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProjectMessages, sendProjectMessage } from '@/lib/project'

export default function ProjectChat({ projectId, user }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!projectId || !user?.id) return

    let channel

    async function init() {
      const initial = await getProjectMessages(projectId)

      setMessages(
        initial.map((msg) => ({
          ...msg,
          username: msg.profiles?.username || 'User',
          color: msg.profiles?.cursor_color || '#6366f1',
        }))
      )

      channel = supabase.channel(`project-chat-${projectId}`)
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `project_id=eq.${projectId}`,
          },
          async (payload) => {
            const newMessage = payload.new

            const { data: profile } = await supabase
              .from('profiles')
              .select('username, cursor_color')
              .eq('id', newMessage.user_id)
              .maybeSingle()

            setMessages((prev) => [
              ...prev,
              {
                ...newMessage,
                username: profile?.username || 'User',
                color: profile?.cursor_color || '#6366f1',
              },
            ])
          }
        )
        .subscribe()
    }

    init().catch(console.error)

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [projectId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = message.trim()
    if (!content) return

    try {
      await sendProjectMessage({
        projectId,
        userId: user.id,
        content,
      })
      setMessage('')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081121]">
      <div className="border-b border-white/10 p-4">
        <div className="text-xl font-semibold text-white">Project Chat</div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: msg.color }}
              />
              {msg.username}
            </div>
            <div className="text-sm text-slate-200">{msg.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 p-4 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Send
        </button>
      </form>
    </div>
  )
}