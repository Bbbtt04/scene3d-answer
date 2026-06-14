import { MessageRenderer } from './MessageRenderer'
import type { ChatMessage } from './chat.types'

type Props = {
  messages: ChatMessage[]
}

export function MessageList({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="empty-state" aria-live="polite">
        <p>Try "Explain a binary search tree", "解释一次 HTTP 请求流程", or "人活着为了什么".</p>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageRenderer key={message.id} message={message} />
      ))}
    </div>
  )
}
