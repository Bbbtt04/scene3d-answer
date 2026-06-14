import type { Scene3D } from './scene3d.types'

export function validateSceneGraph(scene: Scene3D): Scene3D {
  const nodeIds = new Set(scene.nodes.map((node) => node.id))

  for (const edge of scene.edges ?? []) {
    if (!nodeIds.has(edge.from)) {
      throw new Error(`Edge references missing source node: ${edge.from}`)
    }

    if (!nodeIds.has(edge.to)) {
      throw new Error(`Edge references missing target node: ${edge.to}`)
    }
  }

  return scene
}
