import type { Scene3D, Vec3 } from '../schema/scene3d.types'
import { flowLayout } from './flowLayout'
import { radialLayout } from './radialLayout'
import { treeLayout } from './treeLayout'

export type SceneLayout = {
  positions: Record<string, Vec3>
}

export function computeLayout(scene: Scene3D): SceneLayout {
  const hasAnyPosition = scene.nodes.some((node) => node.position)

  if (hasAnyPosition) {
    return {
      positions: Object.fromEntries(
        scene.nodes.map((node) => [node.id, node.position ?? [0, 0, 0]]),
      ),
    }
  }

  switch (scene.template) {
    case 'tree':
      return treeLayout(scene)
    case 'flow':
      return flowLayout(scene)
    case 'radial':
    default:
      return radialLayout(scene)
  }
}
