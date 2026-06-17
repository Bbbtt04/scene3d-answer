import { useEffect, useState } from 'react'
import type { TraceStep } from './processTrace.types'

type Props = {
  steps: TraceStep[]
  intervalMs?: number
  onStepChange?: (step: TraceStep, index: number) => void
}

export function ProcessPlayer({ steps, intervalMs = 1400, onStepChange }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const currentStep = steps[currentIndex] ?? steps[0]

  useEffect(() => {
    setCurrentIndex(0)
    setPlaying(false)
  }, [steps])

  useEffect(() => {
    if (!currentStep) {
      return
    }

    onStepChange?.(currentStep, currentIndex)
  }, [currentIndex, currentStep, onStepChange])

  useEffect(() => {
    if (!playing || steps.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % steps.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, playing, steps.length])

  if (!currentStep || steps.length === 0) {
    return null
  }

  function goPrevious() {
    setCurrentIndex((index) => (index - 1 + steps.length) % steps.length)
  }

  function goNext() {
    setCurrentIndex((index) => (index + 1) % steps.length)
  }

  function reset() {
    setPlaying(false)
    setCurrentIndex(0)
  }

  return (
    <section className="process-player" aria-label="过程动画">
      <header className="process-player-header">
        <div>
          <p className="process-step-count">
            步骤 {currentIndex + 1} / {steps.length}
          </p>
          <h3>{currentStep.title}</h3>
          <p>{currentStep.explanation}</p>
        </div>

        <div className="process-controls" aria-label="过程控制">
          <button type="button" onClick={goPrevious} aria-label="上一步">
            上一步
          </button>
          <button type="button" onClick={() => setPlaying((value) => !value)}>
            {playing ? '暂停' : '播放'}
          </button>
          <button type="button" onClick={goNext} aria-label="下一步">
            下一步
          </button>
          <button type="button" onClick={reset}>
            重置
          </button>
        </div>
      </header>

      <div className="process-containers">
        {currentStep.containers.map((container) => (
          <div className="process-container" key={container.id}>
            <h4>{container.label}</h4>
            <ol>
              {container.items.length > 0 ? (
                container.items.map((item) => <li key={item.id}>{item.label}</li>)
              ) : (
                <li className="empty">空</li>
              )}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
