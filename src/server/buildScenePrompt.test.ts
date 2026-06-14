import { describe, expect, it } from 'vitest'
import { buildSceneSystemPrompt } from './buildScenePrompt'

describe('buildSceneSystemPrompt', () => {
  it('asks model providers to return visible scene text in Simplified Chinese', () => {
    const prompt = buildSceneSystemPrompt()

    expect(prompt).toContain('Use Simplified Chinese')
    expect(prompt).toContain('title, subtitle, node labels, node descriptions, and edge labels')
  })
})
