import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useState, type CSSProperties } from 'react'
import type { SceneNode, SceneNodeRole, Vec3 } from './schema/scene3d.types'

type NodeStyle = {
  color: string
  glow: string
}

const ROLE_STYLES: Record<SceneNodeRole, NodeStyle> = {
  root: { color: '#7c8cff', glow: '#c7d0ff' },
  concept: { color: '#67e8c3', glow: '#d9fff4' },
  example: { color: '#ffdd00', glow: '#fff688' },
  step: { color: '#78b7ff', glow: '#d8eaff' },
  leaf: { color: '#a8d577', glow: '#e1fae8' },
  warning: { color: '#ff7a7a', glow: '#ffc6c1' },
  result: { color: '#f59ee0', glow: '#ffe0f5' },
}

type Props = {
  node: SceneNode
  position: Vec3
  selected?: boolean
  onClick?: () => void
}

export function SceneNodeMesh({ node, position, selected, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const nodeStyle = ROLE_STYLES[node.role ?? 'concept']
  const active = selected || hovered
  const scale = selected ? 1.14 : hovered ? 1.06 : 0.94
  const labelStyle = { '--node-color': nodeStyle.color } as CSSProperties

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
      <mesh scale={active ? 1.18 : 1.02}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          color={nodeStyle.color}
          transparent
          opacity={active ? 0.14 : 0.045}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={scale}>
        {renderGeometry(node.shape)}
        <meshPhysicalMaterial
          color={nodeStyle.color}
          roughness={0.28}
          metalness={0.22}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          emissive={nodeStyle.color}
          emissiveIntensity={selected ? 0.32 : hovered ? 0.2 : 0.04}
        />
      </mesh>

      <pointLight
        color={nodeStyle.glow}
        distance={2.8}
        intensity={selected ? 0.62 : hovered ? 0.34 : 0.08}
      />

      <Html position={[0, 0.52, 0]} center distanceFactor={9.5}>
        <div
          className={selected ? 'scene-node-label selected' : 'scene-node-label'}
          style={labelStyle}
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
