function detectLanguage(fileName = 'file.js') {
      return 'css'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'json':
      return 'json'
    case 'py':
      return 'python'
    case 'java':
      return 'java'
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
      return 'cpp'
    default:
      return 'text'
  }
}

function buildPatch({ language, filename, prompt }) {
  const cleanPrompt = (prompt || '').trim()

  if (!cleanPrompt) {
    return '// AI: descrie ce vrei să modifici și apasă din nou.\n'
  }

  if (language === 'html') {
    return `\n<!-- AI BLOCK START -->\n<section class="ai-generated-block">\n  <h2>AI suggestion</h2>\n  <p>${cleanPrompt}</p>\n</section>\n<!-- AI BLOCK END -->\n`
  }

  if (language === 'css') {
    return `\n/* AI BLOCK START */\n.ai-generated-block {\n  border: 1px dashed currentColor;\n  padding: 1rem;\n  border-radius: 1rem;\n}\n/* AI TASK: ${cleanPrompt} */\n/* AI BLOCK END */\n`
  }

  if (language === 'python') {
    return `\n# AI BLOCK START\n# TODO: ${cleanPrompt}\nprint("AI suggestion for ${filename}")\n# AI BLOCK END\n`
  }

  if (language === 'java') {
    return `\n// AI BLOCK START\n// TODO: ${cleanPrompt}\n// AI BLOCK END\n`
  }

  if (language === 'cpp') {
    return `\n// AI BLOCK START\n// TODO: ${cleanPrompt}\n// This section was suggested by AI\n// AI BLOCK END\n`
  }

  return `\n// AI BLOCK START\n// TODO: ${cleanPrompt}\n// Suggested for ${filename}\n// AI BLOCK END\n`
}

export async function generateAiSuggestion({ prompt, fileName, content }) {
  const language = detectLanguage(fileName)
  const patch = buildPatch({ language, filename: fileName, prompt })

  return {
    language,
    patch,
    nextContent: `${content || ''}${patch}`,
  }
}