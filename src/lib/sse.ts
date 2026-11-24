export type SseEvent = {
  event: string
  data: string
}

export function createSseDecoder() {
  let buffer = ''

  function push(chunk: string): SseEvent[] {
    buffer = (buffer + chunk).replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    const events: SseEvent[] = []
    let separatorIndex = buffer.indexOf('\n\n')

    while (separatorIndex !== -1) {
      const block = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      const event = parseSseBlock(block)
      if (event) {
        events.push(event)
      }

      separatorIndex = buffer.indexOf('\n\n')
    }

    return events
  }

  function flush(): SseEvent[] {
    if (!buffer.trim()) {
      buffer = ''
      return []
    }

    const event = parseSseBlock(buffer)
    buffer = ''

    return event ? [event] : []
  }

  return { push, flush }
}

function parseSseBlock(block: string): SseEvent | null {
  const data: string[] = []
  let event = 'message'

  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) {
      continue
    }

    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
      continue
    }

    if (line.startsWith('data:')) {
      data.push(stripOptionalLeadingSpace(line.slice('data:'.length)))
    }
  }

  if (data.length === 0) {
    return null
  }

  return {
    event,
    data: data.join('\n'),
  }
}

function stripOptionalLeadingSpace(value: string) {
  return value.startsWith(' ') ? value.slice(1) : value
}
