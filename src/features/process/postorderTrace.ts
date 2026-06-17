import type { Scene3D, SceneEdge, SceneNode } from '../scene3d/schema/scene3d.types'
import type { TraceContainer, TraceStep } from './processTrace.types'

const EDGE_ORDER: Record<string, number> = {
  left: 0,
  default: 1,
  contains: 1,
  depends_on: 1,
  causes: 1,
  next: 1,
  right: 2,
}

export function buildPostorderTrace(scene: Scene3D): TraceStep[] {
  if (scene.template !== 'tree') {
    return []
  }

  const nodesById = new Map(scene.nodes.map((node) => [node.id, node]))
  const childrenById = buildChildrenById(scene.edges ?? [], nodesById)
  const root = findRoot(scene, childrenById)

  if (!root) {
    return []
  }

  const steps: TraceStep[] = []
  const outputIds: string[] = []
  const visiting = new Set<string>()

  function walk(node: SceneNode, stack: string[]) {
    if (visiting.has(node.id)) {
      return
    }

    const nextStack = [...stack, node.id]
    visiting.add(node.id)

    steps.push(
      createStep({
        id: `enter-${node.id}-${steps.length}`,
        title: `进入 ${node.label}`,
        explanation: `${node.label} 入栈。后序遍历要先处理左子树，再处理右子树，最后输出自己。`,
        activeIds: [node.id],
        stackedIds: nextStack,
        completedIds: outputIds,
        scene,
      }),
    )

    for (const childId of childrenById.get(node.id) ?? []) {
      const child = nodesById.get(childId)
      if (child) {
        walk(child, nextStack)
      }
    }

    outputIds.push(node.id)
    steps.push(
      createStep({
        id: `emit-${node.id}-${steps.length}`,
        title: `输出 ${node.label}`,
        explanation: `${node.label} 的左右子树都已经完成，现在把它加入后序结果。`,
        activeIds: [node.id],
        stackedIds: nextStack,
        completedIds: outputIds,
        scene,
      }),
    )

    visiting.delete(node.id)
  }

  walk(root, [])

  return steps
}

function buildChildrenById(edges: SceneEdge[], nodesById: Map<string, SceneNode>) {
  const childrenById = new Map<string, SceneEdge[]>()

  for (const edge of edges) {
    if (!nodesById.has(edge.from) || !nodesById.has(edge.to)) {
      continue
    }

    const children = childrenById.get(edge.from) ?? []
    children.push(edge)
    children.sort((a, b) => {
      const orderA = EDGE_ORDER[a.kind ?? 'default'] ?? EDGE_ORDER.default
      const orderB = EDGE_ORDER[b.kind ?? 'default'] ?? EDGE_ORDER.default
      return orderA - orderB || a.to.localeCompare(b.to)
    })
    childrenById.set(edge.from, children)
  }

  return new Map(
    Array.from(childrenById.entries()).map(([parentId, children]) => [
      parentId,
      children.map((edge) => edge.to),
    ]),
  )
}

function findRoot(scene: Scene3D, childrenById: Map<string, string[]>) {
  const hasParent = new Set(Array.from(childrenById.values()).flat())

  return (
    scene.nodes.find((node) => node.role === 'root') ??
    scene.nodes.find((node) => !hasParent.has(node.id)) ??
    scene.nodes[0]
  )
}

function createStep({
  id,
  title,
  explanation,
  activeIds,
  stackedIds,
  completedIds,
  scene,
}: {
  id: string
  title: string
  explanation: string
  activeIds: string[]
  stackedIds: string[]
  completedIds: string[]
  scene: Scene3D
}): TraceStep {
  return {
    id,
    title,
    explanation,
    activeIds: [...activeIds],
    stackedIds: [...stackedIds],
    completedIds: [...completedIds],
    containers: [
      createContainer('call-stack', '调用栈', stackedIds, scene),
      createContainer('output', '输出序列', completedIds, scene),
    ],
  }
}

function createContainer(
  id: string,
  label: string,
  itemIds: string[],
  scene: Scene3D,
): TraceContainer {
  return {
    id,
    label,
    items: itemIds.map((itemId) => ({
      id: itemId,
      label: scene.nodes.find((node) => node.id === itemId)?.label ?? itemId,
    })),
  }
}
