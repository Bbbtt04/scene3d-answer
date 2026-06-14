import type { Scene3D } from '../schema/scene3d.types'
import type { SceneLayout } from './computeLayout'

const EDGE_ORDER: Record<string, number> = {
  left: 0,
  default: 1,
  contains: 1,
  depends_on: 1,
  causes: 1,
  next: 1,
  right: 2,
}

export function treeLayout(scene: Scene3D): SceneLayout {
  const positions: SceneLayout['positions'] = {}
  const childrenMap = new Map<string, string[]>()
  const hasParent = new Set<string>()

  for (const edge of scene.edges ?? []) {
    const children = childrenMap.get(edge.from) ?? []
    children.push(edge.to)
    children.sort((a, b) => {
      const edgeA = scene.edges?.find(
        (candidate) => candidate.from === edge.from && candidate.to === a,
      )
      const edgeB = scene.edges?.find(
        (candidate) => candidate.from === edge.from && candidate.to === b,
      )

      return EDGE_ORDER[edgeA?.kind ?? 'default'] - EDGE_ORDER[edgeB?.kind ?? 'default']
    })
    childrenMap.set(edge.from, children)
    hasParent.add(edge.to)
  }

  const root =
    scene.nodes.find((node) => node.role === 'root') ??
    scene.nodes.find((node) => !hasParent.has(node.id)) ??
    scene.nodes[0]

  const visited = new Set<string>()

  function walk(nodeId: string, depth: number, x: number, span: number) {
    if (visited.has(nodeId)) {
      return
    }

    visited.add(nodeId)
    positions[nodeId] = [normalizeZero(x), depth === 0 ? 0 : -depth * 1.25, depth * 0.16]

    const children = childrenMap.get(nodeId) ?? []
    if (children.length === 0) {
      return
    }

    const childSpan = span / Math.max(children.length, 1.65)
    const startX = x - ((children.length - 1) * span) / 2

    children.forEach((childId, index) => {
      walk(childId, depth + 1, startX + index * span, childSpan)
    })
  }

  walk(root.id, 0, 0, 1.8)

  const missing = scene.nodes.filter((node) => !positions[node.id])
  missing.forEach((node, index) => {
    positions[node.id] = [(index - missing.length / 2) * 1.4, -3.8, 0.5]
  })

  return { positions }
}

function normalizeZero(value: number) {
  return Object.is(value, -0) ? 0 : value
}
