// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatInput } from './ChatInput'

afterEach(() => {
  cleanup()
})

describe('ChatInput', () => {
  it('submits a trimmed prompt and clears the input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ChatInput onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText(
      'Ask for a concept, system, comparison, process...',
    )
    await user.type(input, '  Explain a binary search tree  ')
    await user.click(screen.getByRole('button', { name: 'Render' }))

    expect(onSubmit).toHaveBeenCalledWith('Explain a binary search tree')
    expect(input).toHaveValue('')
  })

  it('does not submit blank prompts', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ChatInput onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText(
      'Ask for a concept, system, comparison, process...',
    )
    await user.type(input, '   ')
    await user.click(screen.getByRole('button', { name: 'Render' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
