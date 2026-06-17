import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { ProcessPlayer } from '../process/ProcessPlayer'
import { buildSceneTrace } from '../process/sceneProcess'
import type { TraceStep } from '../process/processTrace.types'
import { SceneCanvas } from './SceneCanvas'
import type { Scene3D } from './schema/scene3d.types'

type Props = {
  scene: Scene3D
  fallbackText?: string
}

export function SceneCard({ scene, fallbackText }: Props) {
  const cameraPosition = scene.camera?.position ?? [0, 0, 7]
  const cameraTarget = scene.camera?.target ?? [0, 0, 0]
  const cameraFov = scene.camera?.fov ?? 45
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
          <span className="ready">Ready</span>
        </div>
      </header>

      <div className="scene-card-body">
        <Canvas camera={{ position: cameraPosition, fov: cameraFov }}>
          <color attach="background" args={['#080b12']} />
          <ambientLight intensity={0.68} />
          <directionalLight position={[4, 5, 4]} intensity={1.15} />
          <pointLight position={[-3, -2, 4]} intensity={0.8} color="#6df0c2" />
          <pointLight position={[3.5, 2.5, -2]} intensity={0.45} color="#ffbe6b" />

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
