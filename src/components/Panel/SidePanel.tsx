import type { GraphData } from '@/types/graph'

interface SidePanelProps {
  selectedNodeId: string | null
  hoveredNode: string | null
  data: GraphData
  onNodeSelect: (nodeId: string) => void
  onNodeHover: (nodeId: string | null) => void
  onClose: () => void
}

export function SidePanel({ selectedNodeId, hoveredNode, data, onNodeSelect, onNodeHover, onClose }: SidePanelProps) {
  if (!selectedNodeId) return null

  const node = data.nodes.find(n => n.id === selectedNodeId)
  if (!node) return null

  const pageSlug = node.label.replace(/ /g, '_')
  const wikiUrl = `https://wiki.remilia.org/${pageSlug}`

  // Find incoming connections (edges where this node is the target)
  const incoming = data.edges
    .filter(e => e.target === selectedNodeId)
    .map(e => e.source)
    .sort()

  // Find outgoing connections (edges where this node is the source)
  const outgoing = data.edges
    .filter(e => e.source === selectedNodeId)
    .map(e => e.target)
    .sort()

  return (
    <div className="fixed inset-x-0 bottom-0 max-h-[40vh] md:inset-auto md:right-0 md:top-0 md:bottom-auto md:max-h-none md:h-full md:w-80 bg-black/95 border-t md:border-t-0 md:border-l border-white/20 flex flex-col z-50 rounded-t-2xl md:rounded-none safe-area-bottom">
      {/* Mobile handle */}
      <div className="md:hidden flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 bg-white/30 rounded-full" />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-white font-medium truncate">{node.label}</h2>
            {node.isMissing && (
              <span className="text-white/40 text-xs flex-shrink-0">(Empty)</span>
            )}
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
              aria-label="Open in wiki"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {node.aliases.length > 0 && (
          <p className="text-white/40 text-xs mt-1">
            aka: {node.aliases.join(', ')}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Incoming connections */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white/60 text-sm mb-2">
            Mentioned by ({incoming.length})
          </h3>
          {incoming.length > 0 ? (
            <ul>
              {incoming.map(id => (
                <li key={id}>
                  <button
                    onClick={() => onNodeSelect(id)}
                    onMouseEnter={() => onNodeHover(id)}
                    onMouseLeave={() => onNodeHover(null)}
                    className={`text-sm text-left w-full truncate transition-colors py-1 ${
                      hoveredNode === id
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {id}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/40 text-sm">No incoming connections</p>
          )}
        </div>

        {/* Outgoing connections */}
        <div className="p-4">
          <h3 className="text-white/60 text-sm mb-2">
            Mentions ({outgoing.length})
          </h3>
          {outgoing.length > 0 ? (
            <ul>
              {outgoing.map(id => (
                <li key={id}>
                  <button
                    onClick={() => onNodeSelect(id)}
                    onMouseEnter={() => onNodeHover(id)}
                    onMouseLeave={() => onNodeHover(null)}
                    className={`text-sm text-left w-full truncate transition-colors py-1 ${
                      hoveredNode === id
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {id}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/40 text-sm">No outgoing connections</p>
          )}
        </div>
      </div>
    </div>
  )
}
