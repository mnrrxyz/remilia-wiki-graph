import type { GraphData, GraphNode, GraphEdge, RawGraphData } from '../types/graph'
import rawGraphData from '../../data/remilia_graph_final.json'
import missingPagesData from '../../data/missing_pages_analysis.json'

const graphData = rawGraphData as RawGraphData
const missingPages = missingPagesData as Record<string, number>

function findLargestComponent(nodeIds: Set<string>, edges: GraphEdge[]): Set<string> {
  // Build adjacency list (undirected)
  const adj = new Map<string, Set<string>>()
  for (const id of nodeIds) adj.set(id, new Set())
  for (const { source, target } of edges) {
    adj.get(source)?.add(target)
    adj.get(target)?.add(source)
  }

  // BFS to find connected components
  const visited = new Set<string>()
  let largest: Set<string> = new Set()

  for (const start of nodeIds) {
    if (visited.has(start)) continue

    const component = new Set<string>()
    const queue = [start]

    while (queue.length > 0) {
      const node = queue.shift()!
      if (visited.has(node)) continue
      visited.add(node)
      component.add(node)

      for (const neighbor of adj.get(node) || []) {
        if (!visited.has(neighbor)) queue.push(neighbor)
      }
    }

    if (component.size > largest.size) largest = component
  }

  return largest
}

export function processGraphData(): GraphData {
  const { graph } = graphData
  const nodeIds = new Set<string>()
  const edges: GraphEdge[] = []
  const outgoingCounts: Record<string, number> = {}
  const incomingCounts: Record<string, number> = {}

  // Build edges and collect all node IDs
  for (const [source, targets] of Object.entries(graph)) {
    nodeIds.add(source)
    outgoingCounts[source] = targets.length

    for (const target of targets) {
      nodeIds.add(target)
      edges.push({ source, target })
      incomingCounts[target] = (incomingCounts[target] || 0) + 1
    }
  }

  // Find largest connected component
  const mainComponent = findLargestComponent(nodeIds, edges)

  // Filter to only include nodes in main component
  const filteredEdges = edges.filter(
    (e) => mainComponent.has(e.source) && mainComponent.has(e.target)
  )

  // Build nodes array (only main component)
  const nodes: GraphNode[] = Array.from(mainComponent).map((id) => ({
    id,
    label: id,
    outgoingCount: outgoingCounts[id] || 0,
    incomingCount: incomingCounts[id] || 0,
    isMissing: id in missingPages,
  }))

  return { nodes, edges: filteredEdges }
}
