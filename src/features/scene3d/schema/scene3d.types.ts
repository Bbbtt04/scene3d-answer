export type Vec3 = [number, number, number]

export type SceneTemplate = 'radial' | 'tree' | 'flow'

export type SceneShape = 'sphere' | 'box' | 'cylinder' | 'torus' | 'polyhedron'

export type SceneNodeRole =
  | 'root'
  | 'concept'
  | 'example'
  | 'step'
  | 'leaf'
  | 'warning'
  | 'result'

export type SceneEdgeKind =
  | 'default'
  | 'left'
  | 'right'
  | 'next'
  | 'depends_on'
  | 'contains'
  | 'causes'

export type SceneNode = {
  id: string
  label: string
  description?: string
  shape?: SceneShape
  role?: SceneNodeRole
  value?: string | number
  weight?: number
  position?: Vec3
}

export type SceneEdge = {
  id?: string
  from: string
  to: string
  label?: string
  kind?: SceneEdgeKind
}

export type SceneCamera = {
  position?: Vec3
  target?: Vec3
  fov?: number
}

export type SceneInteraction = {
  orbit?: boolean
  zoom?: boolean
  selectable?: boolean
  hoverable?: boolean
}

export type Scene3D = {
  version: 'scene3d.v1'
  template: SceneTemplate
  title: string
  subtitle?: string
  nodes: SceneNode[]
  edges?: SceneEdge[]
  camera?: SceneCamera
  interaction?: SceneInteraction
  metadata?: {
    sourcePrompt?: string
    generatedAt?: number
    model?: string
  }
}
