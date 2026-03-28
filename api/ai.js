export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, code, filename } = req.body || {}

    if (!prompt || typeof code !== 'string') {
      return res.status(400).json({ error: 'Lipsește prompt sau code.' })
    }

    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENROUTER_API_KEY nu este setată.',
      })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://syntax-error-penultimul.vercel.app',
        'X-Title': 'Syntax Error Monaco Editor',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a coding assistant. Modify the provided code based on the instruction and return ONLY the updated code. No markdown fences. Raw code only.',
          },
          {
            role: 'user',
            content: `Filename: ${filename || 'unknown'}\nInstruction: ${prompt}\nCode:\n${code}`,
          },
        ],
      }),
    })

    const text = await response.text()

    let json
    try {
      json = JSON.parse(text)
    } catch {
      return res.status(500).json({
        error: `OpenRouter a returnat răspuns invalid: ${text.slice(0, 300)}`,
      })
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: json?.error?.message || 'API error',
      })
    }

    const newCode = json?.choices?.[0]?.message?.content

    if (!newCode || typeof newCode !== 'string') {
      return res.status(500).json({
        error: 'OpenRouter nu a returnat cod valid.',
      })
    }

    return res.status(200).json({ code: newCode })
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Server error',
    })
  }
}