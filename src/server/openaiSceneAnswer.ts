import type { ChatMessage } from '../features/chat/chat.types'
import { buildScenePrompt } from './buildScenePrompt'
import { createSceneAnswerFromModelOutput } from './createSceneAnswer'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = 'gpt-4.1-mini'

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type OpenAISceneAnswerFetcher = (
  input: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{
  ok: boolean
  status?: number
  statusText?: string
  json: () => Promise<unknown>
  text?: () => Promise<string>
}>

type CreateSceneAnswerOptions = {
  apiKey?: string
  model?: string
  fetcher?: OpenAISceneAnswerFetcher
}

export type OpenAIResponsesRequest = {
  model: string
  input: string
  text: {
    format: {
      type: 'json_schema'
      name: 'scene3d_v1'
      strict: false
      schema: JsonValue
    }
  }
}

export function buildOpenAIResponsesRequest(
  userInput: string,
  model = DEFAULT_MODEL,
): OpenAIResponsesRequest {
  return {
    model,
    input: buildScenePrompt(userInput),
    text: {
      format: {
        type: 'json_schema',
        name: 'scene3d_v1',
        strict: false,
        schema: scene3dJsonSchema,
      },
    },
  }
}

export async function createSceneAnswerFromOpenAI(
  userInput: string,
  options: CreateSceneAnswerOptions = {},
): Promise<ChatMessage> {
  const apiKey = options.apiKey?.trim()

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const fetcher =
    options.fetcher ?? (globalThis as { fetch?: OpenAISceneAnswerFetcher }).fetch

  if (!fetcher) {
    throw new Error('fetch is not available in this runtime')
  }

  const response = await fetcher(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildOpenAIResponsesRequest(userInput, options.model)),
  })

  if (!response.ok) {
    const details = response.text ? await response.text() : response.statusText
    throw new Error(
      `OpenAI Responses API request failed (${response.status ?? 'unknown'}): ${details}`,
    )
  }

  const outputText = extractResponseText(await response.json())

  if (!outputText) {
    throw new Error('OpenAI Responses API response did not contain output text')
  }

  return createSceneAnswerFromModelOutput(outputText)
}

function extractResponseText(response: unknown): string | null {
  if (!isRecord(response)) {
    return null
  }

  if (typeof response.output_text === 'string') {
    return response.output_text
  }

  if (!Array.isArray(response.output)) {
    return null
  }

  for (const item of response.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue
    }

    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === 'string') {
        return content.text
      }
    }
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const scene3dJsonSchema = {
  type: 'object',
  properties: {
    version: { const: 'scene3d.v1' },
    template: { enum: ['radial', 'tree', 'flow'] },
    title: { type: 'string', minLength: 1, maxLength: 100 },
    subtitle: { type: 'string', maxLength: 240 },
    nodes: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, maxLength: 64 },
          label: { type: 'string', minLength: 1, maxLength: 80 },
          description: { type: 'string', maxLength: 500 },
          shape: {
            enum: ['sphere', 'box', 'cylinder', 'torus', 'polyhedron'],
          },
          role: {
            enum: ['root', 'concept', 'example', 'step', 'leaf', 'warning', 'result'],
          },
          value: {
            anyOf: [{ type: 'string' }, { type: 'number' }],
          },
          weight: { type: 'number', minimum: 0, maximum: 10 },
          position: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: { type: 'number' },
          },
        },
        required: ['id', 'label'],
      },
    },
    edges: {
      type: 'array',
      maxItems: 60,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', maxLength: 64 },
          from: { type: 'string', minLength: 1, maxLength: 64 },
          to: { type: 'string', minLength: 1, maxLength: 64 },
          label: { type: 'string', maxLength: 60 },
          kind: {
            enum: [
              'default',
              'left',
              'right',
              'next',
              'depends_on',
              'contains',
              'causes',
            ],
          },
        },
        required: ['from', 'to'],
      },
    },
    camera: {
      type: 'object',
      properties: {
        position: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: { type: 'number' },
        },
        target: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: { type: 'number' },
        },
        fov: { type: 'number', minimum: 20, maximum: 90 },
      },
    },
    interaction: {
      type: 'object',
      properties: {
        orbit: { type: 'boolean' },
        zoom: { type: 'boolean' },
        selectable: { type: 'boolean' },
        hoverable: { type: 'boolean' },
      },
    },
    metadata: {
      type: 'object',
      properties: {
        sourcePrompt: { type: 'string' },
        generatedAt: { type: 'number' },
        model: { type: 'string' },
      },
    },
  },
  required: ['version', 'template', 'title', 'nodes'],
} satisfies JsonValue
