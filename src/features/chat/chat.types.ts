import type { Scene3D } from '../scene3d/schema/scene3d.types'

export type ChatRole = 'user' | 'assistant'

export type TextBlock = {
  type: 'text'
  content: string
}

export type Scene3DBlock = {
  type: 'scene3d'
  scene: Scene3D
  fallbackText?: string
}

export type AssistantMessageBlock = TextBlock | Scene3DBlock

export type ChatMessage = {
  id: string
  role: ChatRole
  createdAt: number
  blocks: AssistantMessageBlock[]
}
