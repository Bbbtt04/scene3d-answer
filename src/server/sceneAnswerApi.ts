import {
  createSceneAnswerFromOpenAI,
  type OpenAISceneAnswerFetcher,
} from './openaiSceneAnswer.js'
import { createSceneAnswerFromDeepSeek } from './deepseekSceneAnswer.js'

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
  on?: (event: 'data' | 'end' | 'error', listener: (chunk?: unknown) => void) => void
}

type ResponseLike = {
  statusCode: number
  setHeader: (name: string, value: string) => void
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
        sendJson(res, 400, { error: 'Missing input' })
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
