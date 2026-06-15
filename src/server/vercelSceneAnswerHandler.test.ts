import { describe, expect, it, vi } from 'vitest'
import { treeMockScene } from '../features/scene3d/mocks/tree.mock'
import { createVercelSceneAnswerHandler } from '../../api/scene-answer'

class RequestStub {
  method = 'POST'
  private listeners: Record<string, Array<(chunk?: unknown) => void>> = {}

  on(event: 'data' | 'end' | 'error', listener: (chunk?: unknown) => void) {
    this.listeners[event] = [...(this.listeners[event] ?? []), listener]
  }

  emit(event: 'data' | 'end' | 'error', chunk?: unknown) {
    for (const listener of this.listeners[event] ?? []) {
      listener(chunk)
    }
  }
}

class ResponseStub {
  statusCode = 200
  headers: Record<string, string> = {}
  body = ''

  setHeader(name: string, value: string) {
    this.headers[name] = value
  }

  end(body = '') {
    this.body = body
  }
}

describe('createVercelSceneAnswerHandler', () => {
  it('uses Vercel environment variables for the scene answer API', async () => {
    const openaiApiKey = ['OPENAI', 'API', 'KEY'].join('_')
    const request = new RequestStub()
    const response = new ResponseStub()
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(treeMockScene) }),
    })
    const done = createVercelSceneAnswerHandler({
      env: {
        AI_PROVIDER: 'openai',
        [openaiApiKey]: 'unit-test-token',
        OPENAI_MODEL: 'gpt-4.1-mini',
      },
      fetcher,
    })(request, response)

    request.emit('data', JSON.stringify({ input: 'Explain a binary search tree' }))
    request.emit('end')
    await done

    expect(response.statusCode).toBe(200)
    expect(fetcher).toHaveBeenCalled()
    const body = JSON.parse(response.body)
    expect(body.blocks[0].scene.template).toBe('tree')
  })
})
