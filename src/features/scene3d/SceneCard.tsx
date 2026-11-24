import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { ProcessPlayer } from '../process/ProcessPlayer'
import type { TraceStep } from '../process/processTrace.types'
import { buildSceneTrace } from '../process/sceneProcess'
import { SceneCanvas } from './SceneCanvas'
import type { Scene3D } from './schema/scene3d.types'

type Props = {
  scene: Scene3D
  fallbackText?: string
}

export function SceneCard({ scene, fallbackText }: Props) {
  const compactViewport = useCompactViewport()
  const streaming = scene.metadata?.model === 'streaming-preview'
  const baseCameraPosition = scene.camera?.position ?? [0, 0, 8.4]
  const cameraPosition = compactViewport
    ? ([baseCameraPosition[0], baseCameraPosition[1], baseCameraPosition[2] * 2.1] as const)
    : baseCameraPosition
  const cameraTarget =
    scene.camera?.target ?? (scene.template === 'tree' ? [0, -1.1, 0] : [0, 0, 0])
  const cameraFov = compactViewport ? Math.max(scene.camera?.fov ?? 45, 64) : scene.camera?.fov ?? 45
  const sceneTrace = useMemo(() => buildSceneTrace(scene, fallbackText), [fallbackText, scene])
  const [currentTraceStep, setCurrentTraceStep] = useState<TraceStep | null>(
    sceneTrace?.steps[0] ?? null,
  )

  useEffect(() => {
    setCurrentTraceStep(sceneTrace?.steps[0] ?? null)
  }, [sceneTrace])

  return (
    <section className="scene-card" aria-label={`${scene.title} 3D scene`}>
      <header className="scene-card-header">
        <div>
          <h2>{scene.title}</h2>
          {scene.subtitle && <p>{scene.subtitle}</p>}
        </div>
        <div className="scene-card-badges" aria-label="Scene metadata">
          <span>{scene.template}</span>
          {sceneTrace && <span>{sceneTrace.label}</span>}
          <span>{scene.nodes.length} nodes</span>
          <span className={streaming ? 'streaming' : 'ready'}>
            {streaming ? 'Streaming' : 'Ready'}
          </span>
        </div>
      </header>

      <div className="scene-card-body">
        <Canvas camera={{ position: cameraPosition, fov: cameraFov }}>
          <color attach="background" args={['#07111d']} />
          <ambientLight intensity={0.72} />
          <directionalLight position={[4, 5, 4]} intensity={1.08} />
          <pointLight position={[-3, -2, 4]} intensity={0.88} color="#6df0c2" />
          <pointLight position={[3.5, 2.5, -2]} intensity={0.42} color="#78b7ff" />

          <SceneCanvas scene={scene} traceStep={currentTraceStep} />

          <OrbitControls
            enableRotate={scene.interaction?.orbit ?? true}
            enableZoom={scene.interaction?.zoom ?? true}
            enablePan={false}
            target={cameraTarget}
          />
        </Canvas>

        <div className="scene-card-hint">drag to rotate / scroll to zoom / click nodes</div>
      </div>

      {sceneTrace && (
        <ProcessPlayer
          steps={sceneTrace.steps}
          onStepChange={(step) => setCurrentTraceStep(step)}
        />
      )}

      {fallbackText && <p className="scene-fallback">{fallbackText}</p>}
    </section>
  )
}

function useCompactViewport() {
  const [compactViewport, setCompactViewport] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px)')
    const updateViewport = () => setCompactViewport(query.matches)

    updateViewport()
    query.addEventListener('change', updateViewport)

    return () => query.removeEventListener('change', updateViewport)
  }, [])

  return compactViewport
}
