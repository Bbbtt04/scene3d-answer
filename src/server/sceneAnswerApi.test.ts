import { describe, expect, it, vi } from 'vitest'
import { treeMockScene } from '../features/scene3d/mocks/tree.mock'
import { createSceneAnswerApiMiddleware } from './sceneAnswerApi'

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

describe('createSceneAnswerApiMiddleware', () => {
  it('reads a Node request stream and returns configuration errors as JSON', async () => {
    const request = new RequestStub()
    const response = new ResponseStub()
    const middleware = createSceneAnswerApiMiddleware({})
    const done = middleware(request, response)

    request.emit('data', JSON.stringify({ input: 'Explain a binary search tree' }))
    request.emit('end')
    await done

    expect(response.statusCode).toBe(503)
    expect(response.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(response.body)).toEqual({
      error: 'DEEPSEEK_API_KEY is not configured',
    })
  })

  it('passes non-POST requests to the next middleware', async () => {
    const request = new RequestStub()
    request.method = 'GET'
    const next = vi.fn()

    await createSceneAnswerApiMiddleware({})(request, new ResponseStub(), next)

    expect(next).toHaveBeenCalled()
  })

  it('uses an injected fetcher for the OpenAI request', async () => {
    const request = new RequestStub()
    const response = new ResponseStub()
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(treeMockScene) }),
    })
    const done = createSceneAnswerApiMiddleware({
      provider: 'openai',
      openaiApiKey: 'test-key',
      fetcher,
      openaiModel: 'gpt-4.1-mini',
    })(request, response)

    request.emit('data', JSON.stringify({ input: 'Explain a binary search tree' }))
    request.emit('end')
    await done

    expect(response.statusCode).toBe(200)
    expect(fetcher).toHaveBeenCalled()
    const body = JSON.parse(response.body)
    expect(body.blocks[0].scene.template).toBe('tree')
  })

  it('uses DeepSeek as the default provider', async () => {
    const request = new RequestStub()
    const response = new ResponseStub()
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
    const done = createSceneAnswerApiMiddleware({
      deepseekApiKey: 'test-key',
      fetcher,
      deepseekModel: 'deepseek-v4-flash',
    })(request, response)

    request.emit('data', JSON.stringify({ input: 'Explain a binary search tree' }))
    request.emit('end')
    await done

    expect(response.statusCode).toBe(200)
    const [url] = fetcher.mock.calls[0]
    expect(url).toBe('https://api.deepseek.com/chat/completions')
    const body = JSON.parse(response.body)
    expect(body.blocks[0].scene.template).toBe('tree')
  })
})
