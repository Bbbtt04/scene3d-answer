import type { Scene3D } from '../scene3d/schema/scene3d.types'
import { buildPostorderTrace } from './postorderTrace'
import type { TraceStep } from './processTrace.types'

export type SceneTrace = {
  kind: 'postorder'
  label: string
  steps: TraceStep[]
}

export function buildSceneTrace(scene: Scene3D, fallbackText?: string): SceneTrace | null {
  if (!isPostorderScene(scene, fallbackText)) {
    return null
  }

  const steps = buildPostorderTrace(scene)

  if (steps.length === 0) {
    return null
  }

  return {
    kind: 'postorder',
    label: '后序遍历过程',
    steps,
  }
}

export function isPostorderScene(scene: Scene3D, fallbackText = '') {
  if (scene.template !== 'tree') {
    return false
  }

  const searchable = [
    scene.title,
    scene.subtitle,
    fallbackText,
    scene.metadata?.sourcePrompt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    searchable.includes('postorder') ||
    searchable.includes('后序') ||
    searchable.includes('后续')
  )
}
