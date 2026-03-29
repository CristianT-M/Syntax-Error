const JUDGE0_URL = 'https://ce.judge0.com'

async function pollSubmission(token) {
  for (let i = 0; i < 12; i += 1) {
    const response = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status`,
      { headers: { Accept: 'application/json' } },
    )

    const data = await response.json()

    if (data?.status?.id && data.status.id > 2) {
      return data
    }

    await new Promise((resolve) => setTimeout(resolve, 800))
  }

  throw new Error('Execuția a durat prea mult.')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { source_code, language_id, stdin } = req.body || {}

    if (!source_code || !language_id) {
      return res.status(400).json({ error: 'Lipsesc source_code sau language_id.' })
    }

    const createResponse = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin: stdin || '',
      }),
    })

    const created = await createResponse.json()

    if (!createResponse.ok) {
      return res.status(createResponse.status).json({
        error: created?.error || created?.message || 'Judge0 create submission failed.',
      })
    }

    const result = await pollSubmission(created.token)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Runner error' })
  }
}
