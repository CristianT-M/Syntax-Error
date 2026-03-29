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

export function getUserCursorColor(userId) {
  if (!userId) return CURSOR_COLORS[0]

  let hash = 0
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export function getUserDisplayName(user, profile) {
  return profile?.username || user?.email || 'User'
}

export async function ensureProfile(user) {
  if (!user?.id) return null

  const username = user.email || 'user@example.com'
  const cursorColor = getUserCursorColor(user.id)

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username,
        cursor_color: existing.cursor_color || cursorColor,
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

export async function getProjectBySlug(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

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

export async function getProjectFiles(projectId) {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

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

export async function touchProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) throw error
}

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
    .select('id, username, cursor_color')
    .in('id', userIds)

  if (profilesError) throw profilesError

  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

  return messages.map((message) => ({
    ...message,
    profiles: profilesMap.get(message.user_id) || null,
  }))
}

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

export async function createProjectSnapshot({
  projectId,
  fileId,
  fileName,
  content,
  actorId,
  type = 'edit',
}) {
  const { data, error } = await supabase
    .from('project_snapshots')
    .insert({
      project_id: projectId,
      file_id: fileId,
      file_name: fileName,
      content,
      actor_id: actorId,
      event_type: type,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProjectSnapshots(projectId) {
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

export async function addTerminalEvent({
  projectId,
  userId,
  type,
  command = null,
  output = null,
  exitCode = null,
  meta = null,
}) {
  const { data, error } = await supabase
    .from('terminal_events')
    .insert({
      project_id: projectId,
      user_id: userId,
      type,
      command,
      output,
      exit_code: exitCode,
      meta,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTerminalEvents(projectId) {
  const { data, error } = await supabase
    .from('terminal_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(300)

  if (error) throw error
  return data || []
}

export async function searchUsersByEmail(email) {
  const query = email?.trim()
  if (!query) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data || []
}

export async function sendFriendRequest(fromUserId, toUserId) {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return null

  const { data: existing, error: existingError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing

  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getIncomingFriendRequests(userId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function acceptFriendRequest(requestId) {
  const { data: req, error: reqError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select()
    .single()

  if (reqError) throw reqError

  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert([
      {
        user_id: req.from_user_id,
        friend_id: req.to_user_id,
      },
      {
        user_id: req.to_user_id,
        friend_id: req.from_user_id,
      },
    ])

  if (friendshipError) throw friendshipError
  return req
}

export async function getFriends(userId) {
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  if (!friendships?.length) return []

  const ids = friendships.map((f) => f.friend_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, cursor_color')
    .in('id', ids)

  if (profilesError) throw profilesError
  return profiles || []
}