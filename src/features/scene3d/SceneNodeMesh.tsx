import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useState } from 'react'
import type { SceneNode, SceneNodeRole, Vec3 } from './schema/scene3d.types'

const ROLE_COLORS: Record<SceneNodeRole, string> = {
  root: '#7c8cff',
  concept: '#67e8c3',
  example: '#f4c76b',
  step: '#78b7ff',
  leaf: '#a8d577',
  warning: '#ff7a7a',
  result: '#f59ee0',
}

const TRACE_COLORS = {
  active: '#ffcf6b',
  stacked: '#78b7ff',
  completed: '#5df2ba',
}

export type SceneNodeTraceState = 'active' | 'stacked' | 'completed'

type Props = {
  node: SceneNode
  position: Vec3
  selected?: boolean
  traceState?: SceneNodeTraceState
  onClick?: () => void
}

export function SceneNodeMesh({ node, position, selected, traceState, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const color = traceState ? TRACE_COLORS[traceState] : ROLE_COLORS[node.role ?? 'concept']
  const highlighted = selected || traceState === 'active' || traceState === 'completed'

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onClick?.()
  }

  function handlePointerOver(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    setHovered(true)
  }

  function handlePointerOut() {
    setHovered(false)
  }

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh scale={selected || traceState === 'active' ? 1.22 : hovered ? 1.12 : 1}>
        {renderGeometry(node.shape)}
        <meshStandardMaterial
          color={color}
          roughness={0.42}
          metalness={0.12}
          emissive={highlighted ? color : '#000000'}
          emissiveIntensity={highlighted ? 0.35 : 0}
        />
      </mesh>

      <Html position={[0, 0.52, 0]} center distanceFactor={8}>
        <div
          className={[
            'scene-node-label',
            selected ? 'selected' : '',
            traceState ? `trace-${traceState}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {node.label}
        </div>
      </Html>
    </group>
  )
}

function renderGeometry(shape: SceneNode['shape']) {
  switch (shape) {
    case 'box':
      return <boxGeometry args={[0.52, 0.52, 0.52]} />
    case 'cylinder':
      return <cylinderGeometry args={[0.3, 0.3, 0.66, 32]} />
    case 'torus':
      return <torusGeometry args={[0.31, 0.08, 16, 48]} />
    case 'polyhedron':
      return <icosahedronGeometry args={[0.44, 0]} />
    case 'sphere':
    default:
      return <sphereGeometry args={[0.36, 32, 32]} />
  }
}
