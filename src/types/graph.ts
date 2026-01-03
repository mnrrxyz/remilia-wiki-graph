export interface GraphNode {
  id: string
  label: string
  outgoingCount: number
  incomingCount: number
  isMissing: boolean
  size?: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface RawGraphMetadata {
  total_nodes: number
  total_edges: number
  timestamp: string
}

export interface RawGraphData {
  metadata: RawGraphMetadata
  graph: Record<string, string[]>
}
