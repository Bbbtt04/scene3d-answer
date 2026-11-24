import {
  createSceneAnswerFromOpenAI,
  type OpenAISceneAnswerFetcher,
} from './openaiSceneAnswer.js'
import {
  createSceneAnswerFromDeepSeek,
  streamSceneAnswerFromDeepSeek,
  type SceneAnswerStreamEvent,
} from './deepseekSceneAnswer.js'

type SceneAnswerApiOptions = {
  provider?: 'deepseek' | 'openai'
  deepseekApiKey?: string
  deepseekModel?: string
  openaiApiKey?: string
  openaiModel?: string
  fetcher?: OpenAISceneAnswerFetcher
}

type RequestLike = {
  method?: string
  url?: string
  on?: (event: 'data' | 'end' | 'error', listener: (chunk?: unknown) => void) => void
}

type ResponseLike = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  flushHeaders?: () => void
  write?: (chunk: string) => void
  end: (body?: string) => void
}

export function createSceneAnswerApiMiddleware(options: SceneAnswerApiOptions) {
  return async function sceneAnswerApiMiddleware(
    request: unknown,
    response: unknown,
    next?: (error?: unknown) => void,
  ) {
    const req = request as RequestLike
    const res = response as ResponseLike

    if (req.method !== 'POST') {
      if (next) {
        next()
        return
      }

      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const body = await readJsonBody(req)
      const input = typeof body.input === 'string' ? body.input.trim() : ''

      if (!input) {
        if (isStreamRequest(req)) {
          sendSseError(res, 'Missing input')
        } else {
          sendJson(res, 400, { error: 'Missing input' })
        }
        return
      }

      if (isStreamRequest(req)) {
        await sendSceneAnswerStream(res, input, options)
        return
      }

      const message =
        options.provider === 'openai'
          ? await createSceneAnswerFromOpenAI(input, {
              apiKey: options.openaiApiKey,
              fetcher: options.fetcher,
              model: options.openaiModel,
            })
          : await createSceneAnswerFromDeepSeek(input, {
              apiKey: options.deepseekApiKey,
              fetcher: options.fetcher,
              model: options.deepseekModel,
            })

      sendJson(res, 200, message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scene answer error'
      const status = message.includes('API_KEY') ? 503 : 502
      sendJson(res, status, { error: message })
    }
  }
}

async function sendSceneAnswerStream(
  response: ResponseLike,
  input: string,
  options: SceneAnswerApiOptions,
) {
  startSseResponse(response)

  try {
    if (options.provider === 'openai') {
      writeSse(response, {
        type: 'status',
        message: 'OpenAI provider is generating the final scene...',
      })
      const message = await createSceneAnswerFromOpenAI(input, {
        apiKey: options.openaiApiKey,
        fetcher: options.fetcher,
        model: options.openaiModel,
      })
      writeSse(response, { type: 'message', message })
      return
    }

    for await (const event of streamSceneAnswerFromDeepSeek(input, {
      apiKey: options.deepseekApiKey,
      fetcher: options.fetcher,
      model: options.deepseekModel,
    })) {
      writeSse(response, event)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scene answer error'
    writeSse(response, { type: 'error', message })
  } finally {
    response.end()
  }
}

async function readJsonBody(request: RequestLike): Promise<Record<string, unknown>> {
  const on = request.on?.bind(request)

  if (!on) {
    throw new Error('Request body stream is not available')
  }

  const raw = await new Promise<string>((resolve, reject) => {
    let body = ''

    on('data', (chunk) => {
      body += String(chunk ?? '')
    })
    on('end', () => resolve(body))
    on('error', (error) => reject(error))
  })

  if (!raw) {
    return {}
  }

  const parsed = JSON.parse(raw)
  return typeof parsed === 'object' && parsed !== null ? parsed : {}
}

function sendJson(response: ResponseLike, statusCode: number, body: unknown) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

function isStreamRequest(request: RequestLike) {
  return new URL(request.url ?? '/', 'http://scene3d.local').searchParams.get('stream') === '1'
}

function startSseResponse(response: ResponseLike) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('Connection', 'keep-alive')
  response.setHeader('X-Accel-Buffering', 'no')
  response.flushHeaders?.()
}

function sendSseError(response: ResponseLike, message: string) {
  startSseResponse(response)
  writeSse(response, { type: 'error', message })
  response.end()
}

function writeSse(
  response: ResponseLike,
  event:
    | SceneAnswerStreamEvent
    | {
        type: 'error'
        message: string
      },
) {
  const write = response.write?.bind(response)

  if (!write) {
    throw new Error('Streaming response is not available in this runtime')
  }

  const { type, ...data } = event
  write(`event: ${type}\n`)
  write(`data: ${JSON.stringify(data)}\n\n`)
}
