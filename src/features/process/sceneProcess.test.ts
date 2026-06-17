import { describe, expect, it } from 'vitest'
import { treeMockScene } from '../scene3d/mocks/tree.mock'
import { buildSceneTrace, isPostorderScene } from './sceneProcess'

describe('sceneProcess', () => {
  it('builds a postorder trace for postorder tree scenes', () => {
    const scene = {
      ...treeMockScene,
      title: '二叉树后序遍历',
      subtitle: '展示调用栈和输出序列。',
    }

    const trace = buildSceneTrace(scene)
    const finalStep = trace?.steps[trace.steps.length - 1]

    expect(isPostorderScene(scene)).toBe(true)
    expect(trace).not.toBeNull()
    expect(finalStep?.completedIds).toEqual([
      '12',
      '37',
      '25',
      '62',
      '88',
      '75',
      '50',
    ])
  })

  it('does not build a process trace for ordinary tree scenes', () => {
    expect(isPostorderScene(treeMockScene)).toBe(false)
    expect(buildSceneTrace(treeMockScene)).toBeNull()
  })

  it('recognizes postorder intent from fallback text', () => {
    expect(isPostorderScene(treeMockScene, 'postorder traversal with a call stack')).toBe(true)
  })
})
