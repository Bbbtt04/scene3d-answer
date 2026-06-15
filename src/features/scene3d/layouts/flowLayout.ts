import type { Scene3D } from '../schema/scene3d.types'
import type { SceneLayout } from './computeLayout'

export function flowLayout(scene: Scene3D): SceneLayout {
  const positions: SceneLayout['positions'] = {}
  const centerOffset = (scene.nodes.length - 1) / 2

  scene.nodes.forEach((node, index) => {
    positions[node.id] = [(index - centerOffset) * 1.82, 0, index % 2 === 0 ? 0 : 0.25]
  })

  return { positions }
}
