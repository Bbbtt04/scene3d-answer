import type { ChatMessage } from '../features/chat/chat.types'
import { buildSceneSystemPrompt } from './buildScenePrompt.js'
import { createSceneAnswerFromModelOutput } from './createSceneAnswer.js'
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
  stream: false
}

export function buildDeepSeekChatRequest(
  userInput: string,
  model = DEFAULT_MODEL,
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
    stream: false,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
