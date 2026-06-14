import { SceneCard } from '../scene3d/SceneCard'
import type { ChatMessage } from './chat.types'

type Props = {
  message: ChatMessage
}

export function MessageRenderer({ message }: Props) {
  return (
    <div className={`message message-${message.role}`}>
      {message.blocks.map((block, index) => {
        if (block.type === 'text') {
          return (
            <div key={index} className="text-block">
              {block.content}
            </div>
          )
        }

        return (
          <SceneCard key={index} scene={block.scene} fallbackText={block.fallbackText} />
        )
      })}
    </div>
  )
}
