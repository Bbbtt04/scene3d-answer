import { createId } from '../../lib/createId'
import { flowMockScene } from '../scene3d/mocks/flow.mock'
import { radialMockScene } from '../scene3d/mocks/radial.mock'
import { treeMockScene } from '../scene3d/mocks/tree.mock'
import { Scene3DSchema } from '../scene3d/schema/scene3d.schema'
import { validateSceneGraph } from '../scene3d/schema/validateSceneGraph'
import type { ChatMessage } from './chat.types'

export async function mockCreateAssistantMessage(input: string): Promise<ChatMessage> {
  const lower = input.toLowerCase()
  const scene = isPostorderPrompt(input, lower)
    ? {
        ...treeMockScene,
        title: '二叉树后序遍历',
        subtitle: '同步展示左子树、右子树、根节点的访问顺序，以及调用栈和输出序列。',
      }
    : isTreePrompt(input, lower)
      ? treeMockScene
      : isFlowPrompt(input, lower)
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

function isPostorderPrompt(input: string, lower: string) {
  return lower.includes('postorder') || input.includes('后序') || input.includes('后续')
}

function isTreePrompt(input: string, lower: string) {
  return lower.includes('tree') || lower.includes('bst') || input.includes('树')
}

function isFlowPrompt(input: string, lower: string) {
  return lower.includes('http') || input.includes('流程') || input.includes('请求')
}

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}
