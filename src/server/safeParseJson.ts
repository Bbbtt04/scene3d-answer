export function safeParseJson(input: string): unknown {
  try {
    return JSON.parse(input)
  } catch {
    const jsonLike = extractFirstJsonObject(input)

    if (!jsonLike) {
      throw new Error('No JSON object found in model output')
    }

    return JSON.parse(jsonLike)
  }
}

function extractFirstJsonObject(input: string) {
  const start = input.indexOf('{')
  const end = input.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return input.slice(start, end + 1)
}
