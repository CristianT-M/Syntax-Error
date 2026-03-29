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
  '#f43f5e',
]

export function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function generateShareToken(length = 18) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
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
 * @param {any} user
 */
export async function ensureProfile(user) {
  if (!user?.id) return null

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existingError) throw existingError

  const username =
    existing?.username ||
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'User'

  const cursorColor = existing?.cursor_color || getUserCursorColor(user.id)

  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username,
        cursor_color: cursorColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username,
      cursor_color: cursorColor,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * @param {{name: string, ownerId: string, description?: string, language?: string}} params
 */
export async function createProject({
  name,
  ownerId,
  description = '',
  language = 'javascript',
}) {
  const slug = generateSlug()
  const shareToken = generateShareToken()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name,
      description,
      slug,
      share_token: shareToken,
      owner_id: ownerId,
      language,
      is_public: true,
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: ownerId,
      role: 'owner',
    })

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
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * @param {string} projectId
 * @param {string} userId
 * @param {string} role
 */
export async function ensureProjectMembership(projectId, userId, role = 'editor') {
  const { data: existing, error: existingError } = await supabase
    .from('project_members')
    .select('id, role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing

  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * @param {string} projectId
 */
export async function getProjectMembers(projectId) {
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('id, project_id, user_id, role, joined_at')
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true })

  if (membersError) throw membersError
  if (!members?.length) return []

  const userIds = members.map((m) => m.user_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, cursor_color')
    .in('id', userIds)

  if (profilesError) throw profilesError

  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

  return members.map((member) => ({
    ...member,
    profiles: profilesMap.get(member.user_id) || null,
  }))
}

/**
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
 * @param {{projectId: string, name: string, language: string, content?: string, isEntry?: boolean, updatedBy?: string | null}} params
 */
export async function createProjectFile({
  projectId,
  name,
  language,
  content = '',
  isEntry = false,
  updatedBy = null,
}) {
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      name,
      language,
      content,
      is_entry: isEntry,
      updated_by: updatedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * @param {{fileId: string, content: string, userId: string}} params
 */
export async function updateProjectFile({ fileId, content, userId }) {
  const { data, error } = await supabase
    .from('project_files')
    .update({
      content,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * @param {{fileId: string, name: string}} params
 */
export async function renameProjectFile({ fileId, name }) {
  const { data, error } = await supabase
    .from('project_files')
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
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
 * @param {string} projectId
 */
export async function getProjectMessages(projectId) {
  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('id, project_id, user_id, content, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (messagesError) throw messagesError
  if (!messages?.length) return []

  const userIds = [...new Set(messages.map((m) => m.user_id))]

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, cursor_color')
    .in('id', userIds)

  if (profilesError) throw profilesError

  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

  return messages.map((message) => ({
    ...message,
    profiles: profilesMap.get(message.user_id) || null,
  }))
}

/**
 * @param {{projectId: string, userId: string, content: string}} params
 */
export async function sendProjectMessage({ projectId, userId, content }) {
  const cleanContent = content?.trim()
  if (!cleanContent) return null

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      project_id: projectId,
      user_id: userId,
      content: cleanContent,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * @param {string} projectId
 */
export async function touchProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) throw error
}