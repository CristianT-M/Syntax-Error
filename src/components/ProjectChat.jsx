import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProjectMessages, sendProjectMessage } from '@/lib/project'

/**
 * @param {{projectId: string, user: any}} props
 */
export default function ProjectChat({ projectId, user }) {
  /** @type {[any[], Function]} */
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  /** @type {[any[], Function]} */
  const [onlineUsers, setOnlineUsers] = useState([])
  /** @type {React.MutableRefObject<any>} */
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!projectId || !user?.id) return

    /** @type {any} */
    let channel

    async function init() {
      const initialMessages = await getProjectMessages(projectId)

      setMessages(
        initialMessages.map((msg) => ({
          ...msg,
          username: msg.profiles?.username || 'User',
          color: msg.profiles?.cursor_color || '#6366f1',
        }))
      )

      channel = supabase.channel(`project-chat-${projectId}`, {
        config: { presence: { key: user.id } },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const users = Object.values(state).flat()
          setOnlineUsers(users)
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `project_id=eq.${projectId}`,
          },          /**
           * @param {any} payload
           */          async (payload) => {
            const newMessage = payload.new

            const { data: profile } = await supabase
              .from('profiles')
              .select('username, cursor_color')
              .eq('id', newMessage.user_id)
              .maybeSingle()

            setMessages(
              /**
               * @param {any} prev
               */
              (prev) => {
                if (prev.some(
                  /**
                   * @param {any} msg
                   */
                  (msg) => msg.id === newMessage.id
                )) return prev
              return [
                ...prev,
                {
                  ...newMessage,
                  username: profile?.username || 'User',
                  color: profile?.cursor_color || '#6366f1',
                },
              ]
            })
          }
        )
        .subscribe(
          /**
           * @param {any} status
           */
          async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            })
          }
        })
    }

    init().catch((error) => {
      console.error('Project chat init error:', error)
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [projectId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * @param {any} e
   */
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
      console.error('Send message error:', error)
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081121]">
      <div className="border-b border-white/10 p-4">
        <div className="text-xl font-semibold text-white">Project Chat</div>
        <div className="text-sm text-slate-400">Online: {onlineUsers.length}</div>
      </div>

      <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: msg.color }}
                />
                {msg.username}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>

            <div className="text-sm text-slate-200">{msg.content}</div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-white/10 p-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Send
        </button>
      </form>
    </div>
  )
}