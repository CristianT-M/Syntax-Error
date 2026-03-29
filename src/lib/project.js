import { supabase } from './supabase'

export function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

/**
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.ownerId
 */
export async function createProject({ name, ownerId }) {
  const slug = generateSlug()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name,
      slug,
      owner_id: ownerId,
      is_public: true
    })
    .select()
    .single()

  if (error) throw error

  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: ownerId
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
    .single()

  if (error) throw error
  return data
}

/**
 * @param {string} projectId
 * @param {string} userId
 */
export async function ensureProjectMembership(projectId, userId) {
  const { error } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: projectId,
        user_id: userId
      },
      {
        onConflict: 'project_id,user_id'
      }
    )

  if (error) throw error
}

/**
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
        username
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {string} params.content
 */
export async function sendProjectMessage({ projectId, userId, content }) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      project_id: projectId,
      user_id: userId,
      content
    })

  if (error) throw error
}