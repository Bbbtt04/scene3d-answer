import { createSceneAnswerApiMiddleware } from '../src/server/sceneAnswerApi.js'

type Env = Record<string, string | undefined>
type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: Env
  }
}
type SceneAnswerApiOptions = Parameters<typeof createSceneAnswerApiMiddleware>[0]
type HandlerOptions = {
  env?: Env
  fetcher?: SceneAnswerApiOptions['fetcher']
}

export function createVercelSceneAnswerHandler(options: HandlerOptions = {}) {
  const env = options.env ?? readRuntimeEnv()
  const provider = env.AI_PROVIDER === 'openai' ? 'openai' : 'deepseek'

  return createSceneAnswerApiMiddleware({
    provider,
    deepseekApiKey: env.DEEPSEEK_API_KEY,
    deepseekModel: env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    fetcher: options.fetcher,
  })
}

function readRuntimeEnv(): Env {
  return (globalThis as RuntimeGlobal).process?.env ?? {}
}

export default createVercelSceneAnswerHandler()
