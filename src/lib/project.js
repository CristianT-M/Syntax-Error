import { supabase } from '@/lib/supabase'

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
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) throw error
}