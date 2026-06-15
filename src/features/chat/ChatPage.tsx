import { useState } from 'react'
import { createId } from '../../lib/createId'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'
import { createAssistantMessage } from './createAssistantMessage'
import type { ChatMessage } from './chat.types'

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(value: string) {
    const userMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      createdAt: Date.now(),
      blocks: [{ type: 'text', content: value }],
    }

    setMessages((current) => [...current, userMessage])
    setLoading(true)

    try {
      const assistantMessage = await createAssistantMessage(value)
      setMessages((current) => [...current, assistantMessage])
    } catch {
      const fallbackMessage: ChatMessage = {
        id: createId('assistant'),
        role: 'assistant',
        createdAt: Date.now(),
        blocks: [
          {
            type: 'text',
            content: '3D scene generation failed, so this answer was downgraded to text.',
          },
        ],
      }

      setMessages((current) => [...current, fallbackMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="chat-page">
      <div className="ambient-grid" aria-hidden="true" />
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <h1 id="page-title">Scene3D Answer MVP</h1>
          <p>Ask a concept. Get a structured, inspectable 3D answer.</p>
        </div>
        <div className="hero-status">
          <div className="protocol-chip" aria-label="Protocol version">
            scene3d.v1
          </div>
          <div className="signal-chip" aria-label="Model status">
            Live model
          </div>
        </div>
      </section>

      <MessageList messages={messages} />

      {loading && (
        <div className="loading-row" role="status">
          Generating 3D scene...
        </div>
      )}

      <ChatInput disabled={loading} onSubmit={handleSubmit} />
    </main>
  )
}
