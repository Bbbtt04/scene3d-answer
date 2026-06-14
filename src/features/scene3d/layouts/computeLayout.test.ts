import { describe, expect, it } from 'vitest'
import { flowMockScene } from '../mocks/flow.mock'
import { radialMockScene } from '../mocks/radial.mock'
import { treeMockScene } from '../mocks/tree.mock'
import { computeLayout } from './computeLayout'

describe('computeLayout', () => {
  it('places the radial root at the center and gives every node a position', () => {
    const layout = computeLayout(radialMockScene)

    expect(layout.positions.meaning).toEqual([0, 0, 0])
    expect(Object.keys(layout.positions).sort()).toEqual(
      radialMockScene.nodes.map((node) => node.id).sort(),
    )
  })

  it('places tree children below the root with left and right branches split on x', () => {
    const layout = computeLayout(treeMockScene)

    expect(layout.positions['50']).toEqual([0, 0, 0])
    expect(layout.positions['25'][1]).toBeLessThan(layout.positions['50'][1])
    expect(layout.positions['75'][1]).toBeLessThan(layout.positions['50'][1])
    expect(layout.positions['25'][0]).toBeLessThan(layout.positions['50'][0])
    expect(layout.positions['75'][0]).toBeGreaterThan(layout.positions['50'][0])
  })

  it('places flow nodes in input order from left to right', () => {
    const layout = computeLayout(flowMockScene)

    const orderedX = flowMockScene.nodes.map((node) => layout.positions[node.id][0])
    expect(orderedX).toEqual([...orderedX].sort((a, b) => a - b))
    expect(layout.positions.url[1]).toBe(0)
  })
})
