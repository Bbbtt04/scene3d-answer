import { createSseDecoder } from '../../lib/sse'
import { Scene3DSchema } from '../scene3d/schema/scene3d.schema'
import type { Scene3D } from '../scene3d/schema/scene3d.types'
import { validateSceneGraph } from '../scene3d/schema/validateSceneGraph'
import type { ChatMessage } from './chat.types'
import { createAssistantMessage, parseChatMessage } from './createAssistantMessage'

type StreamingFetcher = (
  input: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{
  ok: boolean
  body?: ReadableStream<Uint8Array> | null
  json?: () => Promise<unknown>
}>

type Options = {
  fetcher?: StreamingFetcher
  onScene?: (scene: Scene3D) => void
  onStatus?: (message: string) => void
}

export async function createStreamingAssistantMessage(
  input: string,
  options: Options = {},
): Promise<ChatMessage> {
  const fetcher = options.fetcher ?? globalThis.fetch

  if (!fetcher) {
    return createAssistantMessage(input)
  }

  try {
    const response = await fetcher('/api/scene-answer?stream=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    if (!response.ok || !response.body) {
      return createAssistantMessage(input)
    }

    const finalMessage = await readAssistantMessageStream(response.body, options)

    if (!finalMessage) {
      return createAssistantMessage(input)
    }

    return finalMessage
  } catch {
    return createAssistantMessage(input)
  }
}

async function readAssistantMessageStream(
  body: ReadableStream<Uint8Array>,
  options: Options,
): Promise<ChatMessage | null> {
  const sseDecoder = createSseDecoder()
  let finalMessage: ChatMessage | null = null

  for await (const chunk of readTextStream(body)) {
    for (const event of sseDecoder.push(chunk)) {
      finalMessage = handleStreamEvent(event.event, event.data, options) ?? finalMessage
    }
  }

  for (const event of sseDecoder.flush()) {
    finalMessage = handleStreamEvent(event.event, event.data, options) ?? finalMessage
  }

  return finalMessage
}

function handleStreamEvent(
  event: string,
  data: string,
  options: Options,
): ChatMessage | null {
  const payload = parsePayload(data)

  if (event === 'status' && typeof payload.message === 'string') {
    options.onStatus?.(payload.message)
    return null
  }

  if (event === 'scene') {
    const scene = parseScene(payload.scene)
    if (scene) {
      options.onScene?.(scene)
    }
    return null
  }

  if (event === 'message') {
    return parseChatMessage(payload.message)
  }

  if (event === 'error' && typeof payload.message === 'string') {
    throw new Error(payload.message)
  }

  return null
}

function parsePayload(data: string): Record<string, unknown> {
  const parsed = JSON.parse(data)
  return typeof parsed === 'object' && parsed !== null ? parsed : {}
}

function parseScene(value: unknown): Scene3D | null {
  const parsed = Scene3DSchema.safeParse(value)
  if (!parsed.success) {
    return null
  }

  return validateSceneGraph(parsed.data)
}

async function* readTextStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      yield decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }

  const rest = decoder.decode()
  if (rest) {
    yield rest
  }
}
