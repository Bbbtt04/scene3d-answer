import type { Scene3D } from '../schema/scene3d.types'

export const flowMockScene: Scene3D = {
  version: 'scene3d.v1',
  template: 'flow',
  title: 'HTTP 请求流程',
  subtitle: '从输入 URL 到浏览器渲染页面的主要步骤。',
  nodes: [
    {
      id: 'url',
      label: '输入 URL',
      description: '用户在浏览器地址栏输入网站地址。',
      shape: 'box',
      role: 'step',
    },
    {
      id: 'dns',
      label: 'DNS 解析',
      description: '浏览器查询域名对应的 IP 地址。',
      shape: 'sphere',
      role: 'step',
    },
    {
      id: 'tcp',
      label: '建立连接',
      description: '浏览器和服务器建立网络连接，通常还会完成 TLS 握手。',
      shape: 'sphere',
      role: 'step',
    },
    {
      id: 'request',
      label: '发送请求',
      description: '浏览器发送 HTTP 请求报文。',
      shape: 'box',
      role: 'step',
    },
    {
      id: 'response',
      label: '返回响应',
      description: '服务器返回 HTML、CSS、JS 或数据。',
      shape: 'box',
      role: 'step',
    },
    {
      id: 'render',
      label: '浏览器渲染',
      description: '浏览器解析资源并绘制页面。',
      shape: 'polyhedron',
      role: 'result',
    },
  ],
  edges: [
    { from: 'url', to: 'dns', label: 'resolve', kind: 'next' },
    { from: 'dns', to: 'tcp', label: 'connect', kind: 'next' },
    { from: 'tcp', to: 'request', label: 'send', kind: 'next' },
    { from: 'request', to: 'response', label: 'receive', kind: 'next' },
    { from: 'response', to: 'render', label: 'paint', kind: 'next' },
  ],
  interaction: {
    orbit: true,
    zoom: true,
    selectable: true,
    hoverable: true,
  },
}
