import { useState, useRef, useCallback, useEffect } from 'react'
import type { GraphData } from '@/types/graph'

interface SidePanelProps {
  selectedNodeId: string | null
  hoveredNode: string | null
  data: GraphData
  onNodeSelect: (nodeId: string) => void
  onNodeHover: (nodeId: string | null) => void
  onClose: () => void
}

type DrawerState = 'default' | 'expanded'

export function SidePanel({ selectedNodeId, hoveredNode, data, onNodeSelect, onNodeHover, onClose }: SidePanelProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>('default')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const dragStartY = useRef(0)
  const dragStartTime = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  // Reset drawer state when panel closes/opens
  useEffect(() => {
    if (!selectedNodeId) {
      setDrawerState('default')
      setDragOffset(0)
    }
  }, [selectedNodeId])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    dragStartTime.current = Date.now()
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - dragStartY.current

    // Limit drag range
    const maxUp = drawerState === 'default' ? -200 : 0 // Can drag up more from default
    const maxDown = 300
    const clampedDelta = Math.max(maxUp, Math.min(maxDown, deltaY))

    setDragOffset(clampedDelta)
  }, [isDragging, drawerState])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return

    const elapsed = Date.now() - dragStartTime.current
    const velocity = dragOffset / elapsed // px/ms
    const velocityThreshold = 0.5 // px/ms

    // Fast swipe down = close
    if (velocity > velocityThreshold) {
      onClose()
    }
    // Dragged up significantly = expand
    else if (dragOffset < -80) {
      setDrawerState('expanded')
    }
    // Dragged down significantly from expanded = collapse to default
    else if (dragOffset > 80 && drawerState === 'expanded') {
      setDrawerState('default')
    }
    // Dragged down from default = close
    else if (dragOffset > 120 && drawerState === 'default') {
      onClose()
    }
    // Otherwise snap back

    setIsDragging(false)
    setDragOffset(0)
  }, [isDragging, dragOffset, drawerState, onClose])

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

  // Calculate mobile height based on state and drag
  const getMobileMaxHeight = () => {
    const baseHeight = drawerState === 'expanded' ? 80 : 40 // vh
    if (isDragging) {
      // Convert dragOffset (px) to approximate vh adjustment
      const vhAdjustment = (dragOffset / window.innerHeight) * 100
      return `${Math.max(20, Math.min(85, baseHeight - vhAdjustment))}vh`
    }
    return `${baseHeight}vh`
  }

  return (
    <div
      ref={panelRef}
      className="fixed inset-x-0 bottom-0 md:inset-auto md:right-0 md:top-0 md:bottom-auto md:max-h-none md:h-full md:w-80 bg-black/95 border-t md:border-t-0 md:border-l border-white/20 flex flex-col z-50 rounded-t-2xl md:rounded-none safe-area-bottom"
      style={window.innerWidth < 768 ? {
        maxHeight: getMobileMaxHeight(),
        transition: isDragging ? 'none' : 'max-height 0.3s ease-out',
      } : {}}
    >
      {/* Mobile handle - draggable area */}
      <div
        className="md:hidden flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
