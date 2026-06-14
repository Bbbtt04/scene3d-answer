import { describe, expect, it, vi } from 'vitest'
import { treeMockScene } from '../features/scene3d/mocks/tree.mock'
import {
  buildDeepSeekChatRequest,
  createSceneAnswerFromDeepSeek,
} from './deepseekSceneAnswer'

describe('buildDeepSeekChatRequest', () => {
  it('builds a DeepSeek JSON-mode chat completion request', () => {
    const request = buildDeepSeekChatRequest(
      'Explain binary search trees',
      'deepseek-v4-flash',
    )

    expect(request.model).toBe('deepseek-v4-flash')
    expect(request.stream).toBe(false)
    expect(request.response_format).toEqual({ type: 'json_object' })
    expect(request.messages[0]).toEqual({
      role: 'system',
      content: expect.stringContaining('Output JSON only.'),
    })
    expect(request.messages[1]).toEqual({
      role: 'user',
      content: 'Explain binary search trees',
    })
  })
})

describe('createSceneAnswerFromDeepSeek', () => {
  it('throws before network access when the API key is missing', async () => {
    const fetcher = vi.fn()

    await expect(
      createSceneAnswerFromDeepSeek('Explain a binary search tree', {
        apiKey: '',
        fetcher,
      }),
    ).rejects.toThrow('DEEPSEEK_API_KEY is not configured')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('turns DeepSeek chat completion content into a scene3d assistant message', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(treeMockScene),
            },
          },
        ],
      }),
    })

    const message = await createSceneAnswerFromDeepSeek(
      'Explain a binary search tree',
      {
        apiKey: 'test-key',
        model: 'deepseek-v4-flash',
        fetcher,
      },
    )

    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('https://api.deepseek.com/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer test-key')
    expect(message.blocks[0].type).toBe('scene3d')
    if (message.blocks[0].type === 'scene3d') {
      expect(message.blocks[0].scene.template).toBe('tree')
    }
  })
})
