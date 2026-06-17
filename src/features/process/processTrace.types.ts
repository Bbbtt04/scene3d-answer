export type TraceContainerItem = {
  id: string
  label: string
}

export type TraceContainer = {
  id: string
  label: string
  items: TraceContainerItem[]
}

export type TraceStep = {
  id: string
  title: string
  explanation: string
  activeIds: string[]
  stackedIds: string[]
  completedIds: string[]
  containers: TraceContainer[]
}
