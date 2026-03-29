import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProjectMessages, sendProjectMessage } from '@/lib/project'

/**
 * @param {Object} props
 * @param {string} props.projectId
 * @param {any} props.user
 */
export default function ProjectChat({ projectId, user }) {
  /** @type {[any[], Function]} */
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  /** @type {[any[], Function]} */
  const [onlineUsers, setOnlineUsers] = useState([])
  /** @type {React.MutableRefObject<HTMLDivElement | null>} */
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!projectId || !user?.id) return

    /** @type {any} */
    let channel

    async function init() {
      const initialMessages = await getProjectMessages(projectId)

      setMessages(
        initialMessages.map(
          /** @param {any} msg */
          (msg) => ({
            ...msg,
            username: (Array.isArray(msg.profiles) ? msg.profiles[0]?.username : msg.profiles?.username) || 'User'
          })
        )
      )

      channel = supabase.channel(`project-chat-${projectId}`, {
        config: {
          presence: {
            key: user.id
          }
        }
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
            filter: `project_id=eq.${projectId}`
          },
          /** @param {any} payload */
          async (payload) => {
            const newMessage = payload.new

            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', newMessage.user_id)
              .single()

            setMessages(
              /** @param {any[]} prev */
              (prev) => [
              ...prev,
              {
                ...newMessage,
                username: profile?.username || 'User'
              }
            ])
          }
        )
        .subscribe(
          /** @param {any} status */
          async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'User'
            })
          }
        })
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [projectId, user])

  useEffect(() => {
    /** @type {HTMLDivElement | null} */
    const ref = bottomRef.current
    if (ref) ref.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** @param {any} e */
  async function handleSend(e) {
    e.preventDefault()
    const content = message.trim()
    if (!content) return

    await sendProjectMessage({
      projectId,
      userId: user.id,
      content
    })

    setMessage('')
  }

  return (
    <div className="h-full flex flex-col border-l border-zinc-800 bg-zinc-950 text-white">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="font-semibold">Project Chat</h2>
        <p className="text-xs text-zinc-400">Online: {onlineUsers.length}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-xl bg-zinc-900 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{msg.username}</span>
              <span className="text-[11px] text-zinc-500">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-zinc-200">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrie un mesaj..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  )
}