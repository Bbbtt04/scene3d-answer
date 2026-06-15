import { useState } from 'react'
import { createId } from '../../lib/createId'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'
import { createStreamingAssistantMessage } from './createStreamingAssistantMessage'
import type { ChatMessage } from './chat.types'
import type { Scene3D } from '../scene3d/schema/scene3d.types'

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Generating 3D scene...')

  async function handleSubmit(value: string) {
    const assistantMessageId = createId('assistant')
    const assistantCreatedAt = Date.now()
    const userMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      createdAt: Date.now(),
      blocks: [{ type: 'text', content: value }],
    }
    let streamStatus = '连接模型中...'
    let streamScene: Scene3D | null = null
    const assistantDraft: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      createdAt: assistantCreatedAt,
      blocks: [{ type: 'text', content: streamStatus }],
    }

    setMessages((current) => [...current, userMessage, assistantDraft])
    setLoading(true)
    setLoadingStatus(streamStatus)

    function updateAssistantDraft() {
      setMessages((current) =>
        current.map((message) => {
          if (message.id !== assistantMessageId) {
            return message
          }

          return {
            ...message,
            blocks: [
              { type: 'text', content: streamStatus },
              ...(streamScene
                ? [
                    {
                      type: 'scene3d' as const,
                      scene: streamScene,
                      fallbackText: streamScene.subtitle,
                    },
                  ]
                : []),
            ],
          }
        }),
      )
    }

    try {
      const assistantMessage = await createStreamingAssistantMessage(value, {
        onStatus(message) {
          streamStatus = message
          setLoadingStatus(message)
          updateAssistantDraft()
        },
        onScene(scene) {
          streamScene = scene
          streamStatus = `已生成 ${scene.nodes.length} 个节点...`
          setLoadingStatus(streamStatus)
          updateAssistantDraft()
        },
      })
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...assistantMessage,
                id: assistantMessageId,
                createdAt: assistantCreatedAt,
              }
            : message,
        ),
      )
    } catch {
      const fallbackMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        createdAt: assistantCreatedAt,
        blocks: [
          {
            type: 'text',
            content: '3D scene generation failed, so this answer was downgraded to text.',
          },
        ],
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId ? fallbackMessage : message,
        ),
      )
    } finally {
      setLoading(false)
      setLoadingStatus('Generating 3D scene...')
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
          {loadingStatus}
        </div>
      )}

      <ChatInput disabled={loading} onSubmit={handleSubmit} />
    </main>
  )
}
