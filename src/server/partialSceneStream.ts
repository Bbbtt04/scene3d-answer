import {
  SceneEdgeSchema,
  SceneNodeSchema,
  SceneTemplateSchema,
} from '../features/scene3d/schema/scene3d.schema.js'
import type {
  Scene3D,
  SceneEdge,
  SceneNode,
  SceneTemplate,
} from '../features/scene3d/schema/scene3d.types'

export function createPartialSceneExtractor() {
  let emittedNodeCount = 0
  let emittedEdgeCount = 0

  return {
    update(source: string): Scene3D[] {
      const nodes = extractNodes(source)
      if (nodes.length === 0) {
        return []
      }

      const edges = extractEdges(source, nodes)
      const scenes: Scene3D[] = []

      if (nodes.length > emittedNodeCount) {
        for (let count = emittedNodeCount + 1; count <= nodes.length; count += 1) {
          scenes.push(buildPreviewScene(source, nodes.slice(0, count), edges))
        }
      } else if (edges.length > emittedEdgeCount) {
        scenes.push(buildPreviewScene(source, nodes, edges))
      }

      emittedNodeCount = Math.max(emittedNodeCount, nodes.length)
      emittedEdgeCount = Math.max(emittedEdgeCount, edges.length)

      return scenes
    },
  }
}

function buildPreviewScene(source: string, nodes: SceneNode[], edges: SceneEdge[]): Scene3D {
  const nodeIds = new Set(nodes.map((node) => node.id))

  return {
    version: 'scene3d.v1',
    template: extractTemplate(source),
    title: extractStringProperty(source, 'title') ?? '生成 3D 场景中',
    subtitle: extractStringProperty(source, 'subtitle') ?? '节点正在流式生成',
    nodes,
    edges: edges.filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)),
    interaction: {
      orbit: true,
      zoom: true,
      selectable: true,
      hoverable: true,
    },
    metadata: {
      model: 'streaming-preview',
    },
  }
}

function extractTemplate(source: string): SceneTemplate {
  const parsed = SceneTemplateSchema.safeParse(extractStringProperty(source, 'template'))
  return parsed.success ? parsed.data : 'radial'
}

function extractNodes(source: string): SceneNode[] {
  return uniqueById(
    extractArrayObjects(source, 'nodes')
      .map((value) => parseJsonObject(value, SceneNodeSchema.safeParse))
      .filter((node): node is SceneNode => Boolean(node)),
  )
}

function extractEdges(source: string, nodes: SceneNode[]): SceneEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id))

  return extractArrayObjects(source, 'edges')
    .map((value) => parseJsonObject(value, SceneEdgeSchema.safeParse))
    .filter((edge): edge is SceneEdge => {
      return Boolean(edge && nodeIds.has(edge.from) && nodeIds.has(edge.to))
    })
}

function parseJsonObject<T>(
  source: string,
  parse: (value: unknown) => { success: true; data: T } | { success: false },
): T | null {
  try {
    const result = parse(JSON.parse(source))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function uniqueById(nodes: SceneNode[]) {
  const seen = new Set<string>()
  const unique: SceneNode[] = []

  for (const node of nodes) {
    if (seen.has(node.id)) {
      continue
    }

    seen.add(node.id)
    unique.push(node)
  }

  return unique
}

function extractStringProperty(source: string, property: string): string | undefined {
  const match = new RegExp(`"${property}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 's').exec(
    source,
  )

  if (!match) {
    return undefined
  }

  try {
    return JSON.parse(`"${match[1]}"`) as string
  } catch {
    return undefined
  }
}

function extractArrayObjects(source: string, property: string): string[] {
  const propertyIndex = source.indexOf(`"${property}"`)
  if (propertyIndex === -1) {
    return []
  }

  const colonIndex = source.indexOf(':', propertyIndex)
  const arrayStart = colonIndex === -1 ? -1 : source.indexOf('[', colonIndex)
  if (arrayStart === -1) {
    return []
  }

  const objects: string[] = []
  let inString = false
  let escaping = false
  let objectDepth = 0
  let objectStart = -1

  for (let index = arrayStart + 1; index < source.length; index += 1) {
    const character = source[index]

    if (inString) {
      if (escaping) {
        escaping = false
      } else if (character === '\\') {
        escaping = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }

    if (character === '"') {
      inString = true
      continue
    }

    if (character === ']' && objectDepth === 0) {
      break
    }

    if (character === '{') {
      if (objectDepth === 0) {
        objectStart = index
      }
      objectDepth += 1
      continue
    }

    if (character === '}' && objectDepth > 0) {
      objectDepth -= 1

      if (objectDepth === 0 && objectStart !== -1) {
        objects.push(source.slice(objectStart, index + 1))
        objectStart = -1
      }
    }
  }

  return objects
}
