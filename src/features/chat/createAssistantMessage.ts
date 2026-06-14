import { createId } from '../../lib/createId'
import { Scene3DSchema } from '../scene3d/schema/scene3d.schema'
import { validateSceneGraph } from '../scene3d/schema/validateSceneGraph'
import { mockCreateAssistantMessage } from './mockAssistant'
import type { ChatMessage } from './chat.types'

type Fetcher = (
  input: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{
  ok: boolean
  json: () => Promise<unknown>
}>

type Options = {
  fetcher?: Fetcher
}

export async function createAssistantMessage(
  input: string,
  options: Options = {},
): Promise<ChatMessage> {
  const fetcher = options.fetcher ?? globalThis.fetch

  if (!fetcher) {
    return createFallbackAssistantMessage(input)
  }

  try {
    const response = await fetcher('/api/scene-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    if (!response.ok) {
      return createFallbackAssistantMessage(input)
    }

    return parseChatMessage(await response.json())
  } catch {
    return createFallbackAssistantMessage(input)
  }
}

async function createFallbackAssistantMessage(input: string): Promise<ChatMessage> {
  const message = await mockCreateAssistantMessage(input)

  return {
    ...message,
    blocks: [
      {
        type: 'text',
        content:
          'Live model unavailable in this dev server. Showing the local fallback scene.',
      },
      ...message.blocks,
    ],
  }
}

function parseChatMessage(value: unknown): ChatMessage {
  if (!isRecord(value)) {
    throw new Error('Invalid assistant message')
  }

  const blocks = Array.isArray(value.blocks) ? value.blocks : []
  const parsedBlocks = blocks.map((block) => {
    if (!isRecord(block)) {
      throw new Error('Invalid assistant message block')
    }

    if (block.type === 'text' && typeof block.content === 'string') {
      return {
        type: 'text' as const,
        content: block.content,
      }
    }

    if (block.type === 'scene3d') {
      const scene = Scene3DSchema.parse(block.scene)
      validateSceneGraph(scene)

      return {
        type: 'scene3d' as const,
        scene,
        fallbackText:
          typeof block.fallbackText === 'string' ? block.fallbackText : scene.subtitle,
      }
    }

    throw new Error('Unsupported assistant message block')
  })

  return {
    id: typeof value.id === 'string' ? value.id : createId('assistant'),
    role: 'assistant',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
    blocks: parsedBlocks,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
