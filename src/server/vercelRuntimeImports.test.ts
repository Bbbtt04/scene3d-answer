import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const runtimeFiles = [
  'api/scene-answer.ts',
  'src/server/sceneAnswerApi.ts',
  'src/server/openaiSceneAnswer.ts',
  'src/server/deepseekSceneAnswer.ts',
  'src/server/partialSceneStream.ts',
  'src/server/createSceneAnswer.ts',
  'src/server/buildScenePrompt.ts',
  'src/server/safeParseJson.ts',
  'src/features/scene3d/schema/scene3d.schema.ts',
  'src/features/scene3d/schema/validateSceneGraph.ts',
  'src/lib/sse.ts',
  'src/lib/createId.ts',
]

describe('Vercel runtime imports', () => {
  it('uses explicit JavaScript extensions for relative runtime imports', () => {
    const importsWithoutExtensions = runtimeFiles.flatMap((file) => {
      const source = readFileSync(resolve(file), 'utf8')
      const declarations = source.matchAll(
        /\b(?:import|export)\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"](\.{1,2}\/[^'"]+)['"]/g,
      )

      return Array.from(declarations)
        .map((match) => match[1])
        .filter((specifier) => !/\.(?:js|json)$/.test(specifier))
        .map((specifier) => `${file}: ${specifier}`)
    })

    expect(importsWithoutExtensions).toEqual([])
  })
})
