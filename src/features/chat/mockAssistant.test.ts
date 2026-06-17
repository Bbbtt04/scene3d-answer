import { describe, expect, it } from 'vitest'
import { mockCreateAssistantMessage } from './mockAssistant'

describe('mockCreateAssistantMessage', () => {
  it('returns a tree scene for binary search tree prompts', async () => {
    const message = await mockCreateAssistantMessage('Explain a binary search tree')
    const block = message.blocks[0]

    expect(block.type).toBe('scene3d')
    if (block.type === 'scene3d') {
      expect(block.scene.template).toBe('tree')
      expect(block.scene.nodes).toHaveLength(7)
    }
  })

  it('returns a postorder tree scene for traversal prompts', async () => {
    const message = await mockCreateAssistantMessage('解释二叉树后序遍历')
    const block = message.blocks[0]

    expect(block.type).toBe('scene3d')
    if (block.type === 'scene3d') {
      expect(block.scene.template).toBe('tree')
      expect(block.scene.title).toContain('后序')
      expect(block.scene.subtitle).toContain('调用栈')
    }
  })

  it('returns a flow scene for HTTP process prompts', async () => {
    const message = await mockCreateAssistantMessage('解释一次 HTTP 请求流程')
    const block = message.blocks[0]

    expect(block.type).toBe('scene3d')
    if (block.type === 'scene3d') {
      expect(block.scene.template).toBe('flow')
      expect(block.scene.nodes).toHaveLength(6)
    }
  })

  it('returns a radial scene for meaning-of-life prompts', async () => {
    const message = await mockCreateAssistantMessage('人活着为了什么')
    const block = message.blocks[0]

    expect(block.type).toBe('scene3d')
    if (block.type === 'scene3d') {
      expect(block.scene.template).toBe('radial')
      expect(block.scene.nodes).toHaveLength(7)
    }
  })
})
