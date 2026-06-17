import { useMemo, useState } from 'react'
import { SceneEdgeLine } from './SceneEdgeLine'
import { SceneInspector } from './SceneInspector'
import { SceneNodeMesh, type SceneNodeTraceState } from './SceneNodeMesh'
import { computeLayout } from './layouts/computeLayout'
import type { TraceStep } from '../process/processTrace.types'
import type { Scene3D, SceneNode } from './schema/scene3d.types'

type Props = {
  scene: Scene3D
  traceStep?: TraceStep | null
}

export function SceneCanvas({ scene, traceStep }: Props) {
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
          traceState={getTraceState(node.id, traceStep)}
          onClick={() => setSelectedNode(node)}
        />
      ))}

      {selectedNode && <SceneInspector node={selectedNode} />}
    </>
  )
}

function getTraceState(nodeId: string, traceStep?: TraceStep | null): SceneNodeTraceState | undefined {
  if (!traceStep) {
    return undefined
  }

  if (traceStep.activeIds.includes(nodeId)) {
    return 'active'
  }

  if (traceStep.completedIds.includes(nodeId)) {
    return 'completed'
  }

  if (traceStep.stackedIds.includes(nodeId)) {
    return 'stacked'
  }

  return undefined
}
