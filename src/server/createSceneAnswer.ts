import type { ChatMessage } from '../features/chat/chat.types'
import { Scene3DSchema } from '../features/scene3d/schema/scene3d.schema.js'
import { validateSceneGraph } from '../features/scene3d/schema/validateSceneGraph.js'
import { createId } from '../lib/createId.js'
import { safeParseJson } from './safeParseJson.js'

export async function createSceneAnswerFromModelOutput(
  rawModelOutput: string,
): Promise<ChatMessage> {
  const json = safeParseJson(rawModelOutput)
  const scene = Scene3DSchema.parse(json)
  validateSceneGraph(scene)

  return {
    id: createId('assistant'),
    role: 'assistant',
    createdAt: Date.now(),
    blocks: [
      {
        type: 'scene3d',
        scene,
        fallbackText: scene.subtitle,
      },
    ],
  }
}
