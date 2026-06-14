import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createSceneAnswerApiMiddleware } from './src/server/sceneAnswerApi'
import type { OpenAISceneAnswerFetcher } from './src/server/openaiSceneAnswer'

const execFileAsync = promisify(execFile)

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
              fetcher: createSystemNetworkFetcher(),
              openaiApiKey: env.OPENAI_API_KEY,
              openaiModel: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
            }),
          )
        },
      },
    ],
  }
})

function createSystemNetworkFetcher(): OpenAISceneAnswerFetcher {
  return async function systemNetworkFetch(url, init) {
    const script = `
$headerObject = ConvertFrom-Json $env:AI_REQUEST_HEADERS
$headers = @{}
$headerObject.PSObject.Properties | ForEach-Object {
  $headers[$_.Name] = [string]$_.Value
}
try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $env:AI_REQUEST_URL -Method $env:AI_REQUEST_METHOD -Headers $headers -Body $env:AI_REQUEST_BODY -ContentType 'application/json' -TimeoutSec 90 -ErrorAction Stop
  $status = [int]$response.StatusCode
  $content = $response.Content
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
    $status = [int]$_.Exception.Response.StatusCode
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
      $reader = New-Object System.IO.StreamReader($stream)
      $content = $reader.ReadToEnd()
    } else {
      $content = $_.Exception.Message
    }
  } else {
    $status = 599
    $content = $_.Exception.Message
  }
}
Write-Output $status
Write-Output '---AI_BODY---'
Write-Output $content
`

    try {
      const { stdout } = await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-EncodedCommand',
          Buffer.from(script, 'utf16le').toString('base64'),
        ],
        {
          env: {
            ...process.env,
            AI_REQUEST_BODY: init.body,
            AI_REQUEST_HEADERS: JSON.stringify(init.headers),
            AI_REQUEST_METHOD: init.method,
            AI_REQUEST_URL: url,
          },
          maxBuffer: 1024 * 1024 * 4,
          windowsHide: true,
        },
      )

      return parsePowerShellResponse(stdout)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`System network AI request failed: ${message}`)
    }
  }
}

function parsePowerShellResponse(stdout: string) {
  const [statusLine, ...rest] = stdout.trim().split(/\r?\n/)
  const markerIndex = rest.findIndex((line) => line.trim() === '---AI_BODY---')
  const body = markerIndex === -1 ? rest.join('\n') : rest.slice(markerIndex + 1).join('\n')
  const status = Number(statusLine)

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: statusLine,
    json: async () => JSON.parse(body),
    text: async () => body,
  }
}
