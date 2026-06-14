import { describe, expect, it, vi } from 'vitest'
import { treeMockScene } from '../scene3d/mocks/tree.mock'
import { createAssistantMessage } from './createAssistantMessage'

describe('createAssistantMessage', () => {
  it('uses the API scene answer when the backend returns a message', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'assistant-live',
        role: 'assistant',
        createdAt: 1,
        blocks: [
          {
            type: 'scene3d',
            scene: treeMockScene,
            fallbackText: treeMockScene.subtitle,
          },
        ],
      }),
    })

    const message = await createAssistantMessage('Explain a binary search tree', {
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledWith('/api/scene-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Explain a binary search tree' }),
    })
    expect(message.id).toBe('assistant-live')
  })

  it('falls back to the local mock when the API is unavailable', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'OPENAI_API_KEY is not configured' }),
    })

    const message = await createAssistantMessage('Explain a binary search tree', {
      fetcher,
    })
    const [noticeBlock, sceneBlock] = message.blocks

    expect(noticeBlock.type).toBe('text')
    if (noticeBlock.type === 'text') {
      expect(noticeBlock.content).toContain('Live model unavailable')
    }
    expect(sceneBlock.type).toBe('scene3d')
    if (sceneBlock.type === 'scene3d') {
      expect(sceneBlock.scene.template).toBe('tree')
    }
  })
})
