import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

function runExec(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        resolve({
          stdout: stdout || '',
          stderr: stderr || error.message,
          exitCode: typeof error.code === 'number' ? error.code : 1,
        })
        return
      }

      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
      })
    })
  })
}

function sanitizeCommand(input = '') {
  return String(input).trim().toLowerCase()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const { command, files = [], language = 'javascript', limits = {} } = req.body || {}

    const clean = sanitizeCommand(command)
    if (!clean) {
      return res.status(400).json({ error: 'Missing command.' })
    }

    const timeoutMs = Math.min(Number(limits.timeoutMs) || 4000, 5000)
    const maxBuffer = Math.min((Number(limits.maxBufferKb) || 128) * 1024, 256 * 1024)
    const memoryMb = Math.min(Number(limits.memoryMb) || 128, 256)

    if (!['run', 'preview', 'python', 'node'].includes(clean)) {
      return res.status(400).json({
        error: 'Only safe commands are allowed: run, preview, python, node.',
      })
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-'))

    for (const file of files) {
      const safeName = path.basename(file.name || 'file.txt')
      await fs.writeFile(path.join(tempDir, safeName), file.content || '', 'utf8')
    }

    let result = {
      stdout: '',
      stderr: '',
      exitCode: 0,
    }

    if (clean === 'run' || clean === 'node') {
      const entry =
        files.find((f) => f.name === 'index.js') ||
        files.find((f) => f.name.endsWith('.js'))

      if (!entry) {
        return res.status(400).json({ error: 'No JavaScript file found to run.' })
      }

      const entryPath = path.join(tempDir, path.basename(entry.name))
      result = await runExec(
        process.execPath,
        [`--max-old-space-size=${memoryMb}`, entryPath],
        {
          cwd: tempDir,
          timeout: timeoutMs,
          maxBuffer,
        }
      )
    } else if (clean === 'python') {
      const entry =
        files.find((f) => f.name === 'main.py') ||
        files.find((f) => f.name.endsWith('.py'))

      if (!entry) {
        return res.status(400).json({ error: 'No Python file found to run.' })
      }

      const entryPath = path.join(tempDir, path.basename(entry.name))
      result = await runExec(
        'python',
        [entryPath],
        {
          cwd: tempDir,
          timeout: timeoutMs,
          maxBuffer,
        }
      )
    } else if (clean === 'preview') {
      result = {
        stdout: 'Preview is handled in-browser for HTML/CSS/JS projects.',
        stderr: '',
        exitCode: 0,
      }
    }

    return res.status(200).json({
      ...result,
      limits: {
        timeoutMs,
        maxBufferKb: maxBuffer / 1024,
        memoryMb,
        mode: 'soft-resource-limits',
      },
    })
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Terminal execution failed.',
    })
  }
}