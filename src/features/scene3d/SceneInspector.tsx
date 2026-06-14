import { Html } from '@react-three/drei'
import type { SceneNode } from './schema/scene3d.types'

type Props = {
  node: SceneNode
}

export function SceneInspector({ node }: Props) {
  return (
    <Html position={[3.05, -2.25, 0]} distanceFactor={8}>
      <aside className="scene-inspector">
        <strong>{node.label}</strong>
        {node.description && <p>{node.description}</p>}
      </aside>
    </Html>
  )
}
