import { supabase } from './supabase'

export const CURSOR_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f43f5e'
]

export function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}

/**
 * @param {string} userId
 */
export function getUserCursorColor(userId) {
  if (!userId) return CURSOR_COLORS[0]

  let hash = 0
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

/**
 * @param {any} user
 * @param {any} profile
 */
export function getUserDisplayName(user, profile) {
  return (
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'User'
  )
}

/**
 * Creează sau actualizează profilul userului
 * @param {any} user
 */
export async function ensureProfile(user) {
  if (!user?.id) return null

  const username =
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'User'

  const cursorColor = getUserCursorColor(user.id)

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        username,
        cursor_color: cursorColor,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'id'
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Creează proiect nou + owner devine membru
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.ownerId
 * @param {string} [params.description]
 * @param {string} [params.language]
 */
export async function createProject({
  name,
  ownerId,
  description = '',
  language = 'javascript'
}) {
  const slug = generateSlug()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name,
      description,
      slug,
      owner_id: ownerId,
      language,
      is_public: true,
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  const { error: memberError } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: project.id,
        user_id: ownerId,
        role: 'owner'
      },
      {
        onConflict: 'project_id,user_id'
      }
    )

  if (memberError) throw memberError

  return project
}

/**
 * @param {string} slug
 */
export async function getProjectBySlug(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

/**
 * Auto-adaugă userul ca membru în proiect
 * @param {string} projectId
 * @param {string} userId
 * @param {'owner'|'editor'|'viewer'} [role]
 */
export async function ensureProjectMembership(projectId, userId, role = 'editor') {
  const { error } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
        role
      },
      {
        onConflict: 'project_id,user_id'
      }
    )

  if (error) throw error
}

/**
 * Membrii proiectului
 * @param {string} projectId
 */
export async function getProjectMembers(projectId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      id,
      project_id,
      user_id,
      role,
      joined_at,
      profiles:user_id (
        username,
        avatar_url,
        cursor_color
      )
    `)
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Toate fișierele proiectului
 * @param {string} projectId
 */
export async function getProjectFiles(projectId) {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Creează fișier nou
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.name
 * @param {string} params.language
 * @param {string} [params.content]
 * @param {boolean} [params.isEntry]
 * @param {string|null} [params.updatedBy]
 */
export async function createProjectFile({
  projectId,
  name,
  language,
  content = '',
  isEntry = false,
  updatedBy = null
}) {
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      name,
      language,
      content,
      is_entry: isEntry,
      updated_by: updatedBy
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizează conținutul unui fișier
 * @param {Object} params
 * @param {string} params.fileId
 * @param {string} params.content
 * @param {string} params.userId
 */
export async function updateProjectFile({ fileId, content, userId }) {
  const { data, error } = await supabase
    .from('project_files')
    .update({
      content,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Redenumește un fișier
 * @param {Object} params
 * @param {string} params.fileId
 * @param {string} params.name
 */
export async function renameProjectFile({ fileId, name }) {
  const { data, error } = await supabase
    .from('project_files')
    .update({
      name,
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Șterge un fișier
 * @param {string} fileId
 */
export async function deleteProjectFile(fileId) {
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', fileId)

  if (error) throw error
}

/**
 * Snapshots / istoric
 * @param {string} projectId
 */
export async function getProjectSnapshots(projectId) {
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Creează snapshot pentru fișier
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string|null} params.fileId
 * @param {string} params.content
 */
export async function createProjectSnapshot({ projectId, fileId = null, content }) {
  const { data, error } = await supabase
    .from('project_snapshots')
    .insert({
      project_id: projectId,
      file_id: fileId,
      content
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mesajele din chat-ul proiectului
 * @param {string} projectId
 */
export async function getProjectMessages(projectId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      id,
      project_id,
      user_id,
      content,
      created_at,
      profiles:user_id (
        username,
        avatar_url,
        cursor_color
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Trimite mesaj în chat
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {string} params.content
 */
export async function sendProjectMessage({ projectId, userId, content }) {
  const cleanContent = content?.trim()

  if (!cleanContent) return

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      project_id: projectId,
      user_id: userId,
      content: cleanContent
    })

  if (error) throw error
}

/**
 * Actualizează activitatea proiectului
 * @param {string} projectId
 */
export async function touchProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({
      last_activity_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (error) throw error
}