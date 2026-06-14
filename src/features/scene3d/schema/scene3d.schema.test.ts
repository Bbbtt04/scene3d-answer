import { describe, expect, it } from 'vitest'
import { flowMockScene } from '../mocks/flow.mock'
import { treeMockScene } from '../mocks/tree.mock'
import { Scene3DSchema } from './scene3d.schema'
import type { Scene3D } from './scene3d.types'
import { validateSceneGraph } from './validateSceneGraph'

describe('Scene3D schema', () => {
  it('accepts a valid scene3d.v1 mock scene', () => {
    const parsed = Scene3DSchema.parse(treeMockScene)

    expect(parsed.version).toBe('scene3d.v1')
    expect(parsed.template).toBe('tree')
    expect(parsed.nodes).toHaveLength(7)
    expect(validateSceneGraph(parsed)).toBe(parsed)
  })

  it('rejects scenes outside the supported templates', () => {
    const invalidScene = {
      ...treeMockScene,
      template: 'network',
    }

    expect(() => Scene3DSchema.parse(invalidScene)).toThrow()
  })

  it('rejects edges that reference missing nodes', () => {
    const sceneWithMissingEdge: Scene3D = {
      ...flowMockScene,
      edges: [{ from: 'url', to: 'missing-node' }],
    }

    expect(() => validateSceneGraph(sceneWithMissingEdge)).toThrow(
      'Edge references missing target node: missing-node',
    )
  })
})
