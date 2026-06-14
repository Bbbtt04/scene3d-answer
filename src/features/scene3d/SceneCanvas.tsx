import { useMemo, useState } from 'react'
import { SceneEdgeLine } from './SceneEdgeLine'
import { SceneInspector } from './SceneInspector'
import { SceneNodeMesh } from './SceneNodeMesh'
import { computeLayout } from './layouts/computeLayout'
import type { Scene3D, SceneNode } from './schema/scene3d.types'

type Props = {
  scene: Scene3D
}

export function SceneCanvas({ scene }: Props) {
  const [selectedNode, setSelectedNode] = useState<SceneNode | null>(null)
  const layout = useMemo(() => computeLayout(scene), [scene])

  return (
    <>
      {(scene.edges ?? []).map((edge) => (
        <SceneEdgeLine
          key={`${edge.from}-${edge.to}-${edge.label ?? ''}`}
          edge={edge}
          layout={layout}
        />
      ))}

      {scene.nodes.map((node) => (
        <SceneNodeMesh
          key={node.id}
          node={node}
          position={layout.positions[node.id] ?? [0, 0, 0]}
          selected={selectedNode?.id === node.id}
          onClick={() => setSelectedNode(node)}
        />
      ))}

      {selectedNode && <SceneInspector node={selectedNode} />}
    </>
  )
}
