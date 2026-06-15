import type { Scene3D } from '../schema/scene3d.types'
import type { SceneLayout } from './computeLayout'

export function radialLayout(scene: Scene3D): SceneLayout {
  const positions: SceneLayout['positions'] = {}
  const root = scene.nodes.find((node) => node.role === 'root') ?? scene.nodes[0]

  positions[root.id] = [0, 0, 0]

  const others = scene.nodes.filter((node) => node.id !== root.id)
  const radius = Math.max(3.1, others.length * 0.58)

  others.forEach((node, index) => {
    const angle = (index / others.length) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius * 0.68
    const z = Math.sin(angle * 0.72) * 0.9

    positions[node.id] = [x, y, z]
  })

  return { positions }
}
