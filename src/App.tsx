import { useMemo, useState, useCallback } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { Graph } from '@/components/Graph'
import { SidePanel } from '@/components/Panel'
import { SearchBar } from '@/components/Search'
import { processGraphData } from '@/utils/graphProcessor'
import type { GraphData } from '@/types/graph'

function App() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [showMissingPages, setShowMissingPages] = useState(true)

  const { data, error } = useMemo<{ data: GraphData | null; error: string | null }>(() => {
    try {
      return { data: processGraphData(), error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Error loading graph data' }
    }
  }, [])

  // Filter out missing pages when toggle is off
  const filteredData = useMemo<GraphData | null>(() => {
    if (!data) return null
    if (showMissingPages) return data

    const existingNodes = data.nodes.filter(n => !n.isMissing)
    const existingIds = new Set(existingNodes.map(n => n.id))
    const filteredEdges = data.edges.filter(
      e => existingIds.has(e.source) && existingIds.has(e.target)
    )

    return { nodes: existingNodes, edges: filteredEdges }
  }, [data, showMissingPages])

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId)
  }, [])

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedNode(null)
  }, [])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-red-500 text-lg">Failed to load graph</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!filteredData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {/* Search Bar + Toggle (mobile) */}
      <div className="fixed top-4 left-4 right-4 md:right-auto z-50 flex items-center gap-3">
        <div className="flex-1 md:flex-none">
          <SearchBar nodes={filteredData.nodes} onNodeSelect={handleNodeSelect} />
        </div>

        {/* Toggle - mobile only (next to search) */}
        <button
          onClick={() => setShowMissingPages(!showMissingPages)}
          className="md:hidden flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] text-white/40 hover:text-white/60 transition-colors"
          aria-label={showMissingPages ? 'Hide empty pages' : 'Show empty pages'}
        >
          <span className={`w-3 h-3 rounded-full border border-current ${showMissingPages ? 'bg-current' : ''}`} />
        </button>
      </div>

      {/* Toggle - desktop only (bottom left) */}
      <button
        onClick={() => setShowMissingPages(!showMissingPages)}
        className="hidden md:flex fixed bottom-4 left-4 z-50 items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-xs"
        aria-label={showMissingPages ? 'Hide empty pages' : 'Show empty pages'}
      >
        <span className={`w-2.5 h-2.5 rounded-full border border-current ${showMissingPages ? 'bg-current' : ''}`} />
        {showMissingPages ? 'Showing empty pages' : 'Hiding empty pages'}
      </button>

      <Graph
        data={filteredData}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
        onNodeSelect={handleNodeSelect}
        onNodeHover={handleNodeHover}
      />
      <SidePanel
        selectedNodeId={selectedNode}
        hoveredNode={hoveredNode}
        data={filteredData}
        onNodeSelect={handleNodeSelect}
        onNodeHover={handleNodeHover}
        onClose={handlePanelClose}
      />
      <Analytics />
    </div>
  )
}

export default App
