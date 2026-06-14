import type { FormEvent } from 'react'
import { useState } from 'react'

type Props = {
  disabled?: boolean
  onSubmit: (value: string) => void
}

export function ChatInput({ disabled, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const canSubmit = Boolean(value.trim()) && !disabled

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValue = value.trim()

    if (!nextValue || disabled) {
      return
    }

    onSubmit(nextValue)
    setValue('')
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask for a concept, system, comparison, process..."
        aria-label="Scene prompt"
      />
      <button disabled={!canSubmit} type="submit">
        Render
      </button>
    </form>
  )
}
