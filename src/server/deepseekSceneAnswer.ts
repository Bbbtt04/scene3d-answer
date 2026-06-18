import type { ChatMessage } from '../features/chat/chat.types'
import { createSseDecoder } from '../lib/sse.js'
import { buildSceneSystemPrompt } from './buildScenePrompt.js'
import { createSceneAnswerFromModelOutput } from './createSceneAnswer.js'
import { createPartialSceneExtractor } from './partialSceneStream.js'
import type { OpenAISceneAnswerFetcher } from './openaiSceneAnswer'

const DEEPSEEK_CHAT_COMPLETIONS_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_MODEL = 'deepseek-v4-flash'

type CreateDeepSeekSceneAnswerOptions = {
  apiKey?: string
  model?: string
  fetcher?: OpenAISceneAnswerFetcher
}

export type DeepSeekChatRequest = {
  model: string
  messages: Array<{
    role: 'system' | 'user'
    content: string
  }>
  response_format: {
    type: 'json_object'
  }
  stream: boolean
}

export type SceneAnswerStreamEvent =
  | {
      type: 'status'
      message: string
    }
  | {
      type: 'scene'
      scene: import('../features/scene3d/schema/scene3d.types').Scene3D
    }
  | {
      type: 'message'
      message: ChatMessage
    }

export function buildDeepSeekChatRequest(
  userInput: string,
  model = DEFAULT_MODEL,
  stream = false,
): DeepSeekChatRequest {
  return {
    model,
    messages: [
      {
        role: 'system',
        content: buildSceneSystemPrompt(),
      },
      {
        role: 'user',
        content: userInput,
      },
    ],
    response_format: { type: 'json_object' },
    stream,
  }
}

export async function createSceneAnswerFromDeepSeek(
  userInput: string,
  options: CreateDeepSeekSceneAnswerOptions = {},
): Promise<ChatMessage> {
  const apiKey = options.apiKey?.trim()

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const fetcher =
    options.fetcher ?? (globalThis as { fetch?: OpenAISceneAnswerFetcher }).fetch

  if (!fetcher) {
    throw new Error('fetch is not available in this runtime')
  }

  const response = await fetcher(DEEPSEEK_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildDeepSeekChatRequest(userInput, options.model)),
  })

  if (!response.ok) {
    const details = response.text ? await response.text() : response.statusText
    throw new Error(
      `DeepSeek Chat Completions request failed (${response.status ?? 'unknown'}): ${details}`,
    )
  }

  const outputText = extractDeepSeekContent(await response.json())

  if (!outputText) {
    throw new Error('DeepSeek Chat Completions response did not contain content')
  }

  return createSceneAnswerFromModelOutput(outputText)
}

export async function* streamSceneAnswerFromDeepSeek(
  userInput: string,
  options: CreateDeepSeekSceneAnswerOptions = {},
): AsyncGenerator<SceneAnswerStreamEvent> {
  const apiKey = options.apiKey?.trim()

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const fetcher =
    options.fetcher ?? (globalThis as { fetch?: OpenAISceneAnswerFetcher }).fetch

  if (!fetcher) {
    throw new Error('fetch is not available in this runtime')
  }

  yield { type: 'status', message: '连接模型中...' }

  const response = await fetcher(DEEPSEEK_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildDeepSeekChatRequest(userInput, options.model, true)),
  })

  if (!response.ok) {
    const details = response.text ? await response.text() : response.statusText
    throw new Error(
      `DeepSeek Chat Completions request failed (${response.status ?? 'unknown'}): ${details}`,
    )
  }

  if (!response.body) {
    throw new Error('DeepSeek Chat Completions stream did not include a response body')
  }

  yield { type: 'status', message: '模型正在生成节点...' }

  const sseDecoder = createSseDecoder()
  const partialSceneExtractor = createPartialSceneExtractor()
  let outputText = ''

  for await (const chunk of readTextStream(response.body)) {
    for (const event of sseDecoder.push(chunk)) {
      const delta = extractDeepSeekStreamContent(event.data)

      if (!delta) {
        continue
      }

      outputText += delta

      for (const scene of partialSceneExtractor.update(outputText)) {
        yield { type: 'scene', scene }
      }
    }
  }

  for (const event of sseDecoder.flush()) {
    const delta = extractDeepSeekStreamContent(event.data)

    if (!delta) {
      continue
    }

    outputText += delta

    for (const scene of partialSceneExtractor.update(outputText)) {
      yield { type: 'scene', scene }
    }
  }

  if (!outputText) {
    throw new Error('DeepSeek Chat Completions stream did not contain content')
  }

  yield { type: 'status', message: '校验 3D 场景...' }
  yield {
    type: 'message',
    message: await createSceneAnswerFromModelOutput(outputText),
  }
}

function extractDeepSeekContent(response: unknown): string | null {
  if (!isRecord(response) || !Array.isArray(response.choices)) {
    return null
  }

  for (const choice of response.choices) {
    if (!isRecord(choice) || !isRecord(choice.message)) {
      continue
    }

    if (typeof choice.message.content === 'string') {
      return choice.message.content
    }
  }

  return null
}

function extractDeepSeekStreamContent(data: string): string | null {
  if (data.trim() === '[DONE]') {
    return null
  }

  let response: unknown

  try {
    response = JSON.parse(data)
  } catch {
    return null
  }

  if (!isRecord(response) || !Array.isArray(response.choices)) {
    return null
  }

  for (const choice of response.choices) {
    if (!isRecord(choice) || !isRecord(choice.delta)) {
      continue
    }

    if (typeof choice.delta.content === 'string') {
      return choice.delta.content
    }
  }

  return null
}

async function* readTextStream(
  body: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder()

  if ('getReader' in body) {
    const reader = body.getReader()

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

    return
  }

  for await (const chunk of body) {
    yield decoder.decode(chunk, { stream: true })
  }

  const rest = decoder.decode()
  if (rest) {
    yield rest
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
