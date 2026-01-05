export interface GraphNode {
  id: string
  label: string
  outgoingCount: number
  incomingCount: number
  isMissing: boolean
  aliases: string[]
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

// Enriched format from crawler v2
export interface EnrichedNode {
  id: string
  label: string
  exists: boolean
  aliases: string[]
  type: 'canonical' | 'missing'
}

export interface EnrichedEdge {
  source: string
  target: string
}

export interface EnrichedMetadata {
  total_nodes: number
  existing_nodes: number
  missing_nodes: number
  total_edges: number
  redirects_resolved: number
  timestamp: string
}

export interface EnrichedGraphData {
  metadata: EnrichedMetadata
  nodes: EnrichedNode[]
  edges: EnrichedEdge[]
}
