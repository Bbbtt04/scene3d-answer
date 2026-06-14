import { Html, Line } from '@react-three/drei'
import type { SceneLayout } from './layouts/computeLayout'
import type { SceneEdge, Vec3 } from './schema/scene3d.types'

const EDGE_COLORS = {
  default: '#52617e',
  left: '#67e8c3',
  right: '#f4c76b',
  next: '#78b7ff',
  depends_on: '#ffbe6b',
  contains: '#8793ff',
  causes: '#ff7a7a',
}

type Props = {
  edge: SceneEdge
  layout: SceneLayout
}

export function SceneEdgeLine({ edge, layout }: Props) {
  const from = layout.positions[edge.from]
  const to = layout.positions[edge.to]

  if (!from || !to) {
    return null
  }

  const mid: Vec3 = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ]

  return (
    <>
      <Line
        points={[from, to]}
        color={EDGE_COLORS[edge.kind ?? 'default']}
        lineWidth={2}
        transparent
        opacity={0.72}
      />
      {edge.label && (
        <Html position={mid} center distanceFactor={9}>
          <div className="scene-edge-label">{edge.label}</div>
        </Html>
      )}
    </>
  )
}
