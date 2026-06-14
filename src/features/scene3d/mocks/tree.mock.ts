import type { Scene3D } from '../schema/scene3d.types'

export const treeMockScene: Scene3D = {
  version: 'scene3d.v1',
  template: 'tree',
  title: 'Binary Search Tree',
  subtitle: "Each node's left child is smaller and right child is larger.",
  nodes: [
    {
      id: '50',
      label: 'Root: 50',
      description: 'The root node of the binary search tree.',
      shape: 'sphere',
      role: 'root',
    },
    {
      id: '25',
      label: 'Left: 25',
      description: '25 is smaller than 50, so it goes to the left.',
      shape: 'sphere',
      role: 'concept',
    },
    {
      id: '75',
      label: 'Right: 75',
      description: '75 is larger than 50, so it goes to the right.',
      shape: 'sphere',
      role: 'concept',
    },
    {
      id: '12',
      label: 'Left: 12',
      description: '12 is smaller than 25.',
      shape: 'box',
      role: 'leaf',
    },
    {
      id: '37',
      label: 'Right: 37',
      description: '37 is larger than 25 but smaller than 50.',
      shape: 'box',
      role: 'leaf',
    },
    {
      id: '62',
      label: 'Left: 62',
      description: '62 is smaller than 75 but larger than 50.',
      shape: 'box',
      role: 'leaf',
    },
    {
      id: '88',
      label: 'Right: 88',
      description: '88 is larger than 75.',
      shape: 'box',
      role: 'leaf',
    },
  ],
  edges: [
    { from: '50', to: '25', label: 'left', kind: 'left' },
    { from: '50', to: '75', label: 'right', kind: 'right' },
    { from: '25', to: '12', label: 'left', kind: 'left' },
    { from: '25', to: '37', label: 'right', kind: 'right' },
    { from: '75', to: '62', label: 'left', kind: 'left' },
    { from: '75', to: '88', label: 'right', kind: 'right' },
  ],
  interaction: {
    orbit: true,
    zoom: true,
    selectable: true,
    hoverable: true,
  },
}
