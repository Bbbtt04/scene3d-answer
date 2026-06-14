import type { Scene3D } from '../schema/scene3d.types'

export const radialMockScene: Scene3D = {
  version: 'scene3d.v1',
  template: 'radial',
  title: '人为什么而活',
  subtitle: '意义不是外在答案，而是由自由、体验、联结、成长和贡献共同编织出来。',
  nodes: [
    {
      id: 'meaning',
      label: '活着的意义',
      description:
        '意义不是单一答案，而是由体验、关系、成长和创造共同组成的持续过程。',
      shape: 'polyhedron',
      role: 'root',
    },
    {
      id: 'freedom',
      label: '自由',
      description: '人通过选择塑造自己的人生，也承担选择带来的责任。',
      shape: 'box',
      role: 'concept',
    },
    {
      id: 'experience',
      label: '体验',
      description: '感受世界、经历悲喜，是生命本身的重要部分。',
      shape: 'torus',
      role: 'concept',
    },
    {
      id: 'love',
      label: '爱与联结',
      description: '人与人之间的关系会让生命产生重量和回声。',
      shape: 'sphere',
      role: 'concept',
    },
    {
      id: 'growth',
      label: '成长',
      description: '不断变化、学习和突破，是活着的重要动力。',
      shape: 'sphere',
      role: 'concept',
    },
    {
      id: 'contribution',
      label: '贡献',
      description: '把自己的存在转化为对他人或世界的积极影响。',
      shape: 'cylinder',
      role: 'concept',
    },
    {
      id: 'transcendence',
      label: '超越',
      description: '人会追求比生存更高的价值、信念或创造。',
      shape: 'sphere',
      role: 'concept',
    },
  ],
  edges: [
    { from: 'meaning', to: 'freedom', kind: 'contains' },
    { from: 'meaning', to: 'experience', kind: 'contains' },
    { from: 'meaning', to: 'love', kind: 'contains' },
    { from: 'meaning', to: 'growth', kind: 'contains' },
    { from: 'meaning', to: 'contribution', kind: 'contains' },
    { from: 'meaning', to: 'transcendence', kind: 'contains' },
  ],
  interaction: {
    orbit: true,
    zoom: true,
    selectable: true,
    hoverable: true,
  },
}
