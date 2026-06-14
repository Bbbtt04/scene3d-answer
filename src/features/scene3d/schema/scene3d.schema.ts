import { z } from 'zod'

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()])

export const SceneTemplateSchema = z.enum(['radial', 'tree', 'flow'])

export const SceneShapeSchema = z.enum([
  'sphere',
  'box',
  'cylinder',
  'torus',
  'polyhedron',
])

export const SceneNodeRoleSchema = z.enum([
  'root',
  'concept',
  'example',
  'step',
  'leaf',
  'warning',
  'result',
])

export const SceneEdgeKindSchema = z.enum([
  'default',
  'left',
  'right',
  'next',
  'depends_on',
  'contains',
  'causes',
])

export const SceneNodeSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  shape: SceneShapeSchema.optional(),
  role: SceneNodeRoleSchema.optional(),
  value: z.union([z.string(), z.number()]).optional(),
  weight: z.number().min(0).max(10).optional(),
  position: Vec3Schema.optional(),
})

export const SceneEdgeSchema = z.object({
  id: z.string().max(64).optional(),
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().max(60).optional(),
  kind: SceneEdgeKindSchema.optional(),
})

export const Scene3DSchema = z.object({
  version: z.literal('scene3d.v1'),
  template: SceneTemplateSchema,
  title: z.string().min(1).max(100),
  subtitle: z.string().max(240).optional(),
  nodes: z.array(SceneNodeSchema).min(1).max(50),
  edges: z.array(SceneEdgeSchema).max(100).optional(),
  camera: z
    .object({
      position: Vec3Schema.optional(),
      target: Vec3Schema.optional(),
      fov: z.number().min(20).max(90).optional(),
    })
    .optional(),
  interaction: z
    .object({
      orbit: z.boolean().optional(),
      zoom: z.boolean().optional(),
      selectable: z.boolean().optional(),
      hoverable: z.boolean().optional(),
    })
    .optional(),
  metadata: z
    .object({
      sourcePrompt: z.string().optional(),
      generatedAt: z.number().optional(),
      model: z.string().optional(),
    })
    .optional(),
})
