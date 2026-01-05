import type { GraphData, GraphNode, GraphEdge, RawGraphData } from '../types/graph'
import rawGraphData from '../../data/remilia_graph_final.json'
import missingPagesData from '../../data/missing_pages_analysis.json'

const graphData = rawGraphData as RawGraphData
const missingPages = missingPagesData as Record<string, number>

// Nodes to hide from the graph
const HIDDEN_NODES = new Set(['Main Page'])

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

  // Build edges and collect all node IDs (excluding hidden nodes)
  for (const [source, targets] of Object.entries(graph)) {
    if (HIDDEN_NODES.has(source)) continue

    nodeIds.add(source)
    outgoingCounts[source] = targets.length

    for (const target of targets) {
      if (HIDDEN_NODES.has(target)) continue

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
  const nodes: GraphNode[] = Array.from(mainComponent).map((id) => {
    const outgoing = outgoingCounts[id] || 0
    const incoming = incomingCounts[id] || 0
    const totalConnections = outgoing + incoming

    // Logarithmic scale for subtle size hierarchy
    const minSize = 3
    const scaleFactor = 2
    const size = minSize + Math.log(totalConnections + 1) * scaleFactor

    return {
      id,
      label: id,
      outgoingCount: outgoing,
      incomingCount: incoming,
      isMissing: id in missingPages,
      size,
    }
  })

  return { nodes, edges: filteredEdges }
}
