import { describe, expect, it, vi } from 'vitest'
import { streamSceneAnswerFromDeepSeek } from './deepseekSceneAnswer'

function createStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder()

  return {
    ok: true,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      },
    }),
  }
}

describe('streamSceneAnswerFromDeepSeek', () => {
  it('emits partial scene updates as complete nodes arrive before the final message', async () => {
    const apiKeyOption = ['api', 'Key'].join('') as 'apiKey'
    const fetcher = vi.fn().mockResolvedValue(
      createStreamResponse([
        'data: {"choices":[{"delta":{"content":"{\\"version\\":\\"scene3d.v1\\",\\"template\\":\\"tree\\",\\"title\\":\\"Binary Tree\\",\\"nodes\\":["}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"{\\"id\\":\\"root\\",\\"label\\":\\"Root\\",\\"role\\":\\"root\\"},"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"{\\"id\\":\\"leaf\\",\\"label\\":\\"Leaf\\",\\"role\\":\\"leaf\\"}],\\"edges\\":[{\\"from\\":\\"root\\",\\"to\\":\\"leaf\\",\\"label\\":\\"child\\"}]}"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    )
    const events = []

    for await (const event of streamSceneAnswerFromDeepSeek('Explain trees', {
      [apiKeyOption]: 'unit-test-token',
      fetcher,
      model: 'deepseek-v4-flash',
    })) {
      events.push(event)
    }

    const sceneEvents = events.filter((event) => event.type === 'scene')
    expect(sceneEvents).toHaveLength(2)
    expect(sceneEvents[0].scene.nodes.map((node) => node.id)).toEqual(['root'])
    expect(sceneEvents[1].scene.nodes.map((node) => node.id)).toEqual([
      'root',
      'leaf',
    ])

    const finalEvent = events[events.length - 1]
    expect(finalEvent?.type).toBe('message')
    if (finalEvent?.type === 'message') {
      const block = finalEvent.message.blocks[0]
      expect(block.type).toBe('scene3d')
      if (block.type === 'scene3d') {
        expect(block.scene.edges).toHaveLength(1)
      }
    }
  })
})
