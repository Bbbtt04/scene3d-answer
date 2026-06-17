import { describe, expect, it } from 'vitest'
import { treeMockScene } from '../scene3d/mocks/tree.mock'
import type { Scene3D } from '../scene3d/schema/scene3d.types'
import { buildPostorderTrace } from './postorderTrace'

function containerIds(
  steps: ReturnType<typeof buildPostorderTrace>,
  stepIndex: number,
  containerId: string,
) {
  return (
    steps[stepIndex]?.containers
      .find((container) => container.id === containerId)
      ?.items.map((item) => item.id) ?? []
  )
}

describe('buildPostorderTrace', () => {
  it('derives postorder steps with synchronized call stack and output', () => {
    const steps = buildPostorderTrace(treeMockScene)

    expect(steps.length).toBeGreaterThan(0)
    expect(steps[0]).toMatchObject({
      activeIds: ['50'],
      stackedIds: ['50'],
      completedIds: [],
    })
    expect(containerIds(steps, 0, 'call-stack')).toEqual(['50'])
    expect(containerIds(steps, 0, 'output')).toEqual([])

    const firstLeafEmit = steps.find((step) => step.completedIds.includes('12'))
    expect(firstLeafEmit?.activeIds).toEqual(['12'])
    expect(firstLeafEmit?.stackedIds).toEqual(['50', '25', '12'])
    expect(firstLeafEmit?.containers.find((container) => container.id === 'output')?.items).toEqual([
      { id: '12', label: 'Left: 12' },
    ])

    const finalStep = steps[steps.length - 1]
    expect(finalStep.completedIds).toEqual(['12', '37', '25', '62', '88', '75', '50'])
    expect(containerIds(steps, steps.length - 1, 'call-stack')).toEqual(['50'])
    expect(containerIds(steps, steps.length - 1, 'output')).toEqual([
      '12',
      '37',
      '25',
      '62',
      '88',
      '75',
      '50',
    ])
  })

  it('walks left edges before right edges regardless of edge array order', () => {
    const scene: Scene3D = {
      version: 'scene3d.v1',
      template: 'tree',
      title: 'Postorder',
      nodes: [
        { id: 'root', label: 'Root', role: 'root' },
        { id: 'right', label: 'Right' },
        { id: 'left', label: 'Left' },
      ],
      edges: [
        { from: 'root', to: 'right', kind: 'right' },
        { from: 'root', to: 'left', kind: 'left' },
      ],
    }

    const steps = buildPostorderTrace(scene)

    expect(containerIds(steps, steps.length - 1, 'output')).toEqual(['left', 'right', 'root'])
  })

  it('returns no steps for non-tree scenes', () => {
    expect(buildPostorderTrace({ ...treeMockScene, template: 'flow' })).toEqual([])
  })
})
