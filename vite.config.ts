import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createSceneAnswerApiMiddleware } from './src/server/sceneAnswerApi'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const provider = env.AI_PROVIDER === 'openai' ? 'openai' : 'deepseek'

  return {
    plugins: [
      react(),
      {
        name: 'scene-answer-api',
        configureServer(server) {
          server.middlewares.use(
            '/api/scene-answer',
            createSceneAnswerApiMiddleware({
              provider,
              deepseekApiKey: env.DEEPSEEK_API_KEY,
              deepseekModel: env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
              openaiApiKey: env.OPENAI_API_KEY,
              openaiModel: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
            }),
          )
        },
      },
    ],
  }
})
