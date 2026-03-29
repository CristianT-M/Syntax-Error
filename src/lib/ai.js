export function getAiEndpoint() {
  const configured = import.meta.env.VITE_AI_API_URL
  if (configured && configured.trim()) return configured.trim()
  return '/api/ai'
}

/**
 * @param {any} value
 */
function stripCodeFences(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/^```[\w-]*\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()
}

/**
 * @param {{prompt: string, code: string, filename: string, language: string}} params
 */
export async function generateAiSuggestion({ prompt, code, filename, language }) {
  const response = await fetch(getAiEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      code,
      filename,
      language,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error || 'AI request failed.')
  }

  return {
    code: stripCodeFences(data?.code || ''),
    summary: data?.summary || '',
  }
}