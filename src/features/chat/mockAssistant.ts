import { createId } from '../../lib/createId'
import { flowMockScene } from '../scene3d/mocks/flow.mock'
import { radialMockScene } from '../scene3d/mocks/radial.mock'
import { treeMockScene } from '../scene3d/mocks/tree.mock'
import { Scene3DSchema } from '../scene3d/schema/scene3d.schema'
import { validateSceneGraph } from '../scene3d/schema/validateSceneGraph'
import type { ChatMessage } from './chat.types'

export async function mockCreateAssistantMessage(input: string): Promise<ChatMessage> {
  const lower = input.toLowerCase()

  const scene =
    lower.includes('tree') || lower.includes('bst') || input.includes('树')
      ? treeMockScene
      : lower.includes('http') || input.includes('流程') || input.includes('请求')
        ? flowMockScene
        : radialMockScene

  const parsed = Scene3DSchema.parse(scene)
  validateSceneGraph(parsed)

  await sleep(450)

  return {
    id: createId('assistant'),
    role: 'assistant',
    createdAt: Date.now(),
    blocks: [
      {
        type: 'scene3d',
        scene: parsed,
        fallbackText: parsed.subtitle,
      },
    ],
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}
