import { useMemo, useState, useCallback } from 'react'
import { Graph } from '@/components/Graph'
import { SidePanel } from '@/components/Panel'
import { SearchBar } from '@/components/Search'
import { processGraphData } from '@/utils/graphProcessor'
import type { GraphData } from '@/types/graph'

function App() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const { data, error } = useMemo<{ data: GraphData | null; error: string | null }>(() => {
    try {
      return { data: processGraphData(), error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Error loading graph data' }
    }
  }, [])

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

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {/* Search Bar */}
      <div className="fixed top-4 left-4 z-50">
        <SearchBar nodes={data.nodes} onNodeSelect={handleNodeSelect} />
      </div>

      <Graph
        data={data}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
        onNodeSelect={handleNodeSelect}
        onNodeHover={handleNodeHover}
      />
      <SidePanel
        selectedNodeId={selectedNode}
        hoveredNode={hoveredNode}
        data={data}
        onNodeSelect={handleNodeSelect}
        onNodeHover={handleNodeHover}
        onClose={handlePanelClose}
      />
    </div>
  )
}

export default App
