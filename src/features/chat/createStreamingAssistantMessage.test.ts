import { describe, expect, it, vi } from 'vitest'
import { treeMockScene } from '../scene3d/mocks/tree.mock'
import { createStreamingAssistantMessage } from './createStreamingAssistantMessage'

function createSseResponse(events: string[]) {
  const encoder = new TextEncoder()

  return {
    ok: true,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(event))
        }
        controller.close()
      },
    }),
  }
}

describe('createStreamingAssistantMessage', () => {
  it('notifies the caller with each streamed scene before returning the final message', async () => {
    const firstScene = {
      ...treeMockScene,
      nodes: treeMockScene.nodes.slice(0, 1),
      edges: [],
    }
    const secondScene = {
      ...treeMockScene,
      nodes: treeMockScene.nodes.slice(0, 2),
      edges: [],
    }
    const finalMessage = {
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
    }
    const fetcher = vi.fn().mockResolvedValue(
      createSseResponse([
        `event: scene\ndata: ${JSON.stringify({ scene: firstScene })}\n\n`,
        `event: scene\ndata: ${JSON.stringify({ scene: secondScene })}\n\n`,
        `event: message\ndata: ${JSON.stringify({ message: finalMessage })}\n\n`,
      ]),
    )
    const onScene = vi.fn()

    const message = await createStreamingAssistantMessage('Explain trees', {
      fetcher,
      onScene,
    })

    expect(fetcher).toHaveBeenCalledWith('/api/scene-answer?stream=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Explain trees' }),
    })
    expect(onScene).toHaveBeenCalledTimes(2)
    expect(onScene.mock.calls[0][0].nodes).toHaveLength(1)
    expect(onScene.mock.calls[1][0].nodes).toHaveLength(2)
    expect(message.id).toBe('assistant-live')
  })
})
