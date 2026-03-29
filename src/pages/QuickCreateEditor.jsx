import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { createProject, ensureProfile } from '@/lib/project'
import { supabase } from '@/lib/supabase'

export default function QuickCreateEditor() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user?.id) return

      try {
        await ensureProfile(user)

        const project = await createProject({
          name: `New Project ${new Date().toLocaleTimeString()}`,
          description: 'Quick project created from Editor button',
          language: 'javascript',
          ownerId: user.id,
        })

        const { error: fileError } = await supabase
          .from('project_files')
          .insert({
            project_id: project.id,
            name: 'index.js',
            language: 'javascript',
            content: 'console.log("Hello from iTECify!");',
            is_entry: true,
            updated_by: user.id,
          })

        if (fileError) throw fileError

        if (!cancelled) {
          navigate(`/editor/${project.slug}?share=${project.share_token}`, { replace: true })
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          alert(error?.message || 'Could not create a project.')
          navigate('/dashboard', { replace: true })
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [navigate, user])

  return (
    <div className="min-h-screen bg-[#050b14] text-white flex items-center justify-center">
      Creating workspace...
    </div>
  )
}