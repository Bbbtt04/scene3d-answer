import { describe, expect, it } from 'vitest'
import { treeMockScene } from '../features/scene3d/mocks/tree.mock'
import { createSceneAnswerFromModelOutput } from './createSceneAnswer'
import { safeParseJson } from './safeParseJson'

describe('safeParseJson', () => {
  it('parses a plain JSON object', () => {
    expect(safeParseJson('{"version":"scene3d.v1"}')).toEqual({
      version: 'scene3d.v1',
    })
  })

  it('extracts the first JSON object from surrounding text', () => {
    expect(safeParseJson(`Here is JSON:\n${JSON.stringify(treeMockScene)}\nDone`)).toEqual(
      treeMockScene,
    )
  })
})

describe('createSceneAnswerFromModelOutput', () => {
  it('turns valid model JSON into a scene3d assistant block', async () => {
    const message = await createSceneAnswerFromModelOutput(JSON.stringify(treeMockScene))
    const block = message.blocks[0]

    expect(message.role).toBe('assistant')
    expect(block.type).toBe('scene3d')
    if (block.type === 'scene3d') {
      expect(block.scene.template).toBe('tree')
      expect(block.fallbackText).toBe(treeMockScene.subtitle)
    }
  })
})
