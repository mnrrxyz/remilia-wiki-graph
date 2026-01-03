import { useMemo } from 'react'
import { Graph } from '@/components/Graph'
import { processGraphData } from '@/utils/graphProcessor'
import type { GraphData } from '@/types/graph'

function App() {
  const { data, error } = useMemo<{ data: GraphData | null; error: string | null }>(() => {
    try {
      return { data: processGraphData(), error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Error loading graph data' }
    }
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
      <Graph data={data} />
    </div>
  )
}

export default App
