import type { GraphData, GraphNode, GraphEdge, EnrichedGraphData } from '../types/graph'
import enrichedData from '../../data/remilia_graph_enriched.json'

const graphData = enrichedData as EnrichedGraphData

// Nodes to hide from the graph
const HIDDEN_NODES = new Set(['Main Page'])

// Exclude non-English nodes: /ko suffixes and Korean Hangul characters
function isNonEnglish(id: string): boolean {
  if (/\/[a-z]{2}$/.test(id)) return true          // e.g. /ko, /es, /fr
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(id)) return true  // Hangul
  return false
}

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
  const { nodes: rawNodes, edges: rawEdges } = graphData

  // Build node lookup and alias map
  const nodeMap = new Map(rawNodes.map((n) => [n.id, n]))
  const aliasToId = new Map<string, string>()
  for (const node of rawNodes) {
    for (const alias of node.aliases) {
      aliasToId.set(alias, node.id)
    }
  }

  // Filter edges and collect node IDs (excluding hidden nodes)
  const nodeIds = new Set<string>()
  const edges: GraphEdge[] = []
  const outgoingCounts: Record<string, number> = {}
  const incomingCounts: Record<string, number> = {}

  for (const { source, target } of rawEdges) {
    if (HIDDEN_NODES.has(source) || HIDDEN_NODES.has(target)) continue
    if (isNonEnglish(source) || isNonEnglish(target)) continue

    nodeIds.add(source)
    nodeIds.add(target)
    edges.push({ source, target })

    outgoingCounts[source] = (outgoingCounts[source] || 0) + 1
    incomingCounts[target] = (incomingCounts[target] || 0) + 1
  }

  // Find largest connected component
  const mainComponent = findLargestComponent(nodeIds, edges)

  // Filter to only include nodes in main component
  const filteredEdges = edges.filter(
    (e) => mainComponent.has(e.source) && mainComponent.has(e.target)
  )

  // Build nodes array (only main component)
  const nodes: GraphNode[] = Array.from(mainComponent).map((id) => {
    const rawNode = nodeMap.get(id)
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
      isMissing: rawNode ? !rawNode.exists : false,
      aliases: rawNode?.aliases || [],
      size,
    }
  })

  return { nodes, edges: filteredEdges }
}

// Export alias map for search functionality
export function getAliasMap(): Map<string, string> {
  const aliasToId = new Map<string, string>()
  for (const node of graphData.nodes) {
    for (const alias of node.aliases) {
      aliasToId.set(alias.toLowerCase(), node.id)
    }
  }
  return aliasToId
}
