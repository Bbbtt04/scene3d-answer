// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProcessPlayer } from './ProcessPlayer'
import type { TraceStep } from './processTrace.types'

const steps: TraceStep[] = [
  {
    id: 'enter-a',
    title: '进入 A',
    explanation: 'A 入栈，先处理左子树。',
    activeIds: ['A'],
    stackedIds: ['A'],
    completedIds: [],
    containers: [
      { id: 'call-stack', label: '调用栈', items: [{ id: 'A', label: 'A' }] },
      { id: 'output', label: '输出序列', items: [] },
    ],
  },
  {
    id: 'emit-d',
    title: '输出 D',
    explanation: 'D 没有孩子，可以输出。',
    activeIds: ['D'],
    stackedIds: ['A', 'B', 'D'],
    completedIds: ['D'],
    containers: [
      {
        id: 'call-stack',
        label: '调用栈',
        items: [
          { id: 'A', label: 'A' },
          { id: 'B', label: 'B' },
          { id: 'D', label: 'D' },
        ],
      },
      { id: 'output', label: '输出序列', items: [{ id: 'D', label: 'D' }] },
    ],
  },
]

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ProcessPlayer', () => {
  it('renders the current explanation and trace containers', () => {
    render(<ProcessPlayer steps={steps} />)

    expect(screen.getByText('步骤 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('进入 A')).toBeInTheDocument()
    expect(screen.getByText('A 入栈，先处理左子树。')).toBeInTheDocument()
    expect(screen.getByText('调用栈')).toBeInTheDocument()
    expect(screen.getByText('输出序列')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('moves between steps and reports the active step', () => {
    const onStepChange = vi.fn()

    render(<ProcessPlayer steps={steps} onStepChange={onStepChange} />)
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('步骤 2 / 2')).toBeInTheDocument()
    expect(screen.getByText('输出 D')).toBeInTheDocument()
    expect(screen.getByText('D 没有孩子，可以输出。')).toBeInTheDocument()
    expect(onStepChange).toHaveBeenLastCalledWith(steps[1], 1)

    fireEvent.click(screen.getByRole('button', { name: '上一步' }))
    expect(screen.getByText('步骤 1 / 2')).toBeInTheDocument()
    expect(onStepChange).toHaveBeenLastCalledWith(steps[0], 0)
  })

  it('can auto-play and reset the trace', () => {
    vi.useFakeTimers()

    render(<ProcessPlayer steps={steps} intervalMs={500} />)
    fireEvent.click(screen.getByRole('button', { name: '播放' }))

    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText('步骤 2 / 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(screen.getByText('步骤 1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '播放' })).toBeInTheDocument()
  })
})
