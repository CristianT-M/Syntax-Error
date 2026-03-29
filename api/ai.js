function stripCodeFences(value = '') {
  return String(value)
    .replace(/^```[\w-]*\n?/i, '')
  .replace(/\n?```$/i, '')
  .trim()
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  try {
    const { prompt, code, filename, language } = req.body || {}
    if (!prompt || typeof prompt !== 'string') {
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code.' })
    }
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'http://localhost:5173',
        'X-Title': 'iTECify AI Assistant',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
        'You are a coding assistant inside a collaborative code editor. Return only JSON: {"code":"<full updated file>","summary":"<short sentence>"}. Do not wrap in markdown fences.',
      },
      {
            role: 'user',
            content: [
              `Filename: ${filename || 'unknown'}`,
              `Language: ${language || 'unknown'}`,
              `Instruction: ${prompt}`,
              'Current file contents:',
              code,
            ].join('\n\n'),
          },
        ],
      }),
    })
  const rawText = await response.text()
  let json
  try {
      json = JSON.parse(rawText)
    } catch {
      return res.status(500).json({
        error: `Invalid AI provider response: ${rawText.slice(0, 300)}`,
      })
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: json?.error?.message || 'AI provider error.',
      })
    }
    const content = json?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      return res.status(500).json({ error: 'AI did not return valid content.' })
    }
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      return res.status(200).json({
        code: stripCodeFences(content),
        summary: 'AI generated an updated version of the file.',
      })
    }
    return res.status(200).json({
      code: stripCodeFences(parsed?.code || ''),
      summary: parsed?.summary || 'AI generated an updated version of the file.',
    })
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Server error.',
    })
  }
}
<<<<<<< HEAD
function stripCodeFences(value = '') {
  return String(value)
    .replace(/^```[\w-]*\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const { prompt, code, filename, language } = req.body || {}

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt.' })
    }

    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code.' })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not set.' })
    }

    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
=======
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, code, filename } = req.body || {}

    if (!prompt || !code) {
      return res.status(400).json({ error: 'Lipsește prompt sau code.' })
    }

    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENROUTER_API_KEY nu este setată pe Vercel.',
      })
    }
>>>>>>> 31c57fe (Initial commit)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
<<<<<<< HEAD
        'HTTP-Referer': req.headers.origin || 'http://localhost:5173',
        'X-Title': 'iTECify AI Assistant',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
=======
        'HTTP-Referer': 'https://syntax-error-penultimul.vercel.app',
        'X-Title': 'Syntax Error Monaco Editor',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
>>>>>>> 31c57fe (Initial commit)
        messages: [
          {
            role: 'system',
            content:
<<<<<<< HEAD
              'You are a coding assistant inside a collaborative code editor. Return only JSON: {"code":"<full updated file>","summary":"<short sentence>"}. Do not wrap in markdown fences.',
          },
          {
            role: 'user',
            content: [
              `Filename: ${filename || 'unknown'}`,
              `Language: ${language || 'unknown'}`,
              `Instruction: ${prompt}`,
              'Current file contents:',
              code,
            ].join('\n\n'),
=======
              'You are a coding assistant. Modify the provided code based on the instruction and return ONLY the updated code. No markdown fences. Raw code only.',
          },
          {
            role: 'user',
            content: `Filename: ${filename || 'unknown'}\nInstruction: ${prompt}\nCode:\n${code}`,
>>>>>>> 31c57fe (Initial commit)
          },
        ],
      }),
    })

<<<<<<< HEAD
    const rawText = await response.text()

    let json
    try {
      json = JSON.parse(rawText)
    } catch {
      return res.status(500).json({
        error: `Invalid AI provider response: ${rawText.slice(0, 300)}`,
=======
    const text = await response.text()

    let json
    try {
      json = JSON.parse(text)
    } catch {
      return res.status(500).json({
        error: `OpenRouter a returnat răspuns invalid: ${text.slice(0, 200)}`,
>>>>>>> 31c57fe (Initial commit)
      })
    }

    if (!response.ok) {
      return res.status(response.status).json({
<<<<<<< HEAD
        error: json?.error?.message || 'AI provider error.',
      })
    }

    const content = json?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      return res.status(500).json({ error: 'AI did not return valid content.' })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      return res.status(200).json({
        code: stripCodeFences(content),
        summary: 'AI generated an updated version of the file.',
      })
    }

    return res.status(200).json({
      code: stripCodeFences(parsed?.code || ''),
      summary: parsed?.summary || 'AI generated an updated version of the file.',
    })
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Server error.',
=======
        error: json?.error?.message || 'API error',
      })
    }

    const newCode = json?.choices?.[0]?.message?.content || ''

    return res.status(200).json({ code: newCode })
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Server error',
>>>>>>> 31c57fe (Initial commit)
    })
  }
}