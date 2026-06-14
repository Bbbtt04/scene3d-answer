import { describe, expect, it, vi } from 'vitest'
import { treeMockScene } from '../features/scene3d/mocks/tree.mock'
import {
  buildOpenAIResponsesRequest,
  createSceneAnswerFromOpenAI,
} from './openaiSceneAnswer'

describe('buildOpenAIResponsesRequest', () => {
  it('builds a Responses API request constrained to scene3d.v1 JSON', () => {
    const request = buildOpenAIResponsesRequest(
      'Explain binary search trees',
      'gpt-4.1-mini',
    )

    expect(request.model).toBe('gpt-4.1-mini')
    expect(request.input).toContain('Explain binary search trees')
    expect(request.text.format.type).toBe('json_schema')
    expect(request.text.format.name).toBe('scene3d_v1')
    const schema = request.text.format.schema as {
      properties: {
        version: { const: string }
        template: { enum: string[] }
      }
    }
    expect(schema.properties.version.const).toBe('scene3d.v1')
    expect(schema.properties.template.enum).toEqual([
      'radial',
      'tree',
      'flow',
    ])
  })
})

describe('createSceneAnswerFromOpenAI', () => {
  it('throws before network access when the API key is missing', async () => {
    const fetcher = vi.fn()

    await expect(
      createSceneAnswerFromOpenAI('Explain a binary search tree', {
        apiKey: '',
        fetcher,
      }),
    ).rejects.toThrow('OPENAI_API_KEY is not configured')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('turns Responses API output_text into a scene3d assistant message', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify(treeMockScene),
      }),
    })

    const message = await createSceneAnswerFromOpenAI('Explain a binary search tree', {
      apiKey: 'test-key',
      model: 'gpt-4.1-mini',
      fetcher,
    })

    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/responses')
    expect(init.headers.Authorization).toBe('Bearer test-key')
    expect(message.blocks[0].type).toBe('scene3d')
    if (message.blocks[0].type === 'scene3d') {
      expect(message.blocks[0].scene.template).toBe('tree')
    }
  })
})
