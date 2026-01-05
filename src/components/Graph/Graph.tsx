import { useCallback, useState, useRef, useEffect } from 'react'
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d'
import { forceX, forceY, forceRadial, ForceLink } from 'd3-force'
import type { GraphData, GraphNode, GraphEdge } from '@/types/graph'
import { COLORS } from '@/utils/colors'

interface GraphProps {
  data: GraphData
  selectedNode: string | null
  hoveredNode: string | null
  onNodeSelect: (nodeId: string | null) => void
  onNodeHover: (nodeId: string | null) => void
}

interface NodeObject extends GraphNode {
  x?: number
  y?: number
  fx?: number | undefined
  fy?: number | undefined
  origX?: number
  origY?: number
}

interface LinkObject {
  source: string | NodeObject
  target: string | NodeObject
}

export function Graph({ data, selectedNode, hoveredNode, onNodeSelect, onNodeHover }: GraphProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods<NodeObject, LinkObject> | undefined>(undefined)

  const connectedNodes = useRef<Set<string>>(new Set())
  const connectedLinks = useRef<Set<string>>(new Set())
  const selectedConnectedNodes = useRef<Set<string>>(new Set())
  const selectedConnectedLinks = useRef<Set<string>>(new Set())
  const isDragging = useRef(false)

  // Save original positions and setup return forces when simulation ends
  const handleEngineStop = useCallback(() => {
    data.nodes.forEach((node) => {
      const n = node as NodeObject
      n.origX = n.x
      n.origY = n.y
      n.fx = n.x
      n.fy = n.y
    })

    // Setup forces that will pull nodes back to original positions
    if (graphRef.current) {
      graphRef.current.d3Force('returnX', forceX<NodeObject>().x((n: NodeObject) => n.origX || 0).strength(0.1))
      graphRef.current.d3Force('returnY', forceY<NodeObject>().y((n: NodeObject) => n.origY || 0).strength(0.1))
    }
  }, [data.nodes])

  // Unfix connected nodes during drag for elastic effect
  const handleNodeDrag = useCallback((node: NodeObject) => {
    isDragging.current = true
    setDraggedNode(node.id)

    // Update connected nodes/links for visual highlighting
    connectedNodes.current.clear()
    connectedLinks.current.clear()
    connectedNodes.current.add(node.id)

    data.edges.forEach((edge) => {
      if (edge.source === node.id || edge.target === node.id) {
        connectedNodes.current.add(edge.source)
        connectedNodes.current.add(edge.target)
        connectedLinks.current.add(`${edge.source}-${edge.target}`)

        // Unfix connected node for elastic effect
        const connectedId = edge.source === node.id ? edge.target : edge.source
        const connectedNode = data.nodes.find(n => n.id === connectedId) as NodeObject | undefined
        if (connectedNode) {
          connectedNode.fx = undefined
          connectedNode.fy = undefined
        }
      }
    })
    node.fx = node.x
    node.fy = node.y
  }, [data.nodes, data.edges])

  // Restore all nodes to original positions with ease effect
  const handleNodeDragEnd = useCallback(() => {
    // Reset drag flag con delay para que el click no se procese
    setTimeout(() => {
      isDragging.current = false
    }, 50)
    setDraggedNode(null)

    // Unfix all nodes - the return forces will pull them back smoothly
    data.nodes.forEach((node) => {
      const n = node as NodeObject
      n.fx = undefined
      n.fy = undefined
    })

    // Reheat simulation to animate the return
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation()
    }
  }, [data.nodes])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Configure force simulation
  useEffect(() => {
    if (graphRef.current) {
      // Link force: logarithmic distance based on connection count
      const linkForce = graphRef.current.d3Force('link') as ForceLink<NodeObject, LinkObject> | undefined
      if (linkForce) {
        linkForce.distance((link: LinkObject) => {
          const source = link.source as NodeObject
          const target = link.target as NodeObject

          // Calculate total connections for each node
          const sourceConnections = (source.outgoingCount || 0) + (source.incomingCount || 0)
          const targetConnections = (target.outgoingCount || 0) + (target.incomingCount || 0)
          const avgConnections = (sourceConnections + targetConnections) / 2

          // Logarithmic distance based on connections
          // More connections (central nodes) = larger distance
          // Fewer connections (peripheral nodes) = smaller distance
          const maxDistance = 120
          const minDistance = 30

          const logFactor = Math.log(avgConnections + 1)
          const distance = minDistance + logFactor * 15

          return Math.min(maxDistance, distance)
        })
      }

      // Radial force: pulls nodes toward a circle around the center
      // - radius (200): the target distance from center - nodes are pulled toward this radius
      // - strength (0.05): how strongly nodes are pulled (0-1, lower = gentler pull)
      // This prevents peripheral nodes from drifting too far away
      graphRef.current.d3Force('radial', forceRadial(200).strength(0.05))
    }
  }, [dimensions])


  const graphData = {
    nodes: data.nodes as NodeObject[],
    links: data.edges.map((edge: GraphEdge) => ({
      source: edge.source,
      target: edge.target,
    })),
  }

  const handleNodeHover = useCallback((node: NodeObject | null) => {
    onNodeHover(node ? node.id : null)
  }, [onNodeHover])

  // Update connected nodes/links when hoveredNode changes
  useEffect(() => {
    connectedNodes.current.clear()
    connectedLinks.current.clear()

    if (hoveredNode) {
      connectedNodes.current.add(hoveredNode)
      data.edges.forEach((edge) => {
        if (edge.source === hoveredNode || edge.target === hoveredNode) {
          connectedNodes.current.add(edge.source)
          connectedNodes.current.add(edge.target)
          connectedLinks.current.add(`${edge.source}-${edge.target}`)
        }
      })
    }
  }, [hoveredNode, data.edges])

  const handleNodeClick = useCallback((node: NodeObject) => {
    // Ignorar click si fue un drag
    if (isDragging.current) {
      return
    }

    if (selectedNode === node.id) {
      // Click en el mismo nodo = deseleccionar
      onNodeSelect(null)
    } else {
      // Seleccionar nuevo nodo
      onNodeSelect(node.id)
    }
  }, [selectedNode, onNodeSelect])

  const handleBackgroundClick = useCallback(() => {
    // Ignorar click si fue un drag
    if (isDragging.current) {
      return
    }
    onNodeSelect(null)
  }, [onNodeSelect])

  // Update selected connections when selectedNode changes
  useEffect(() => {
    selectedConnectedNodes.current.clear()
    selectedConnectedLinks.current.clear()

    if (selectedNode) {
      selectedConnectedNodes.current.add(selectedNode)
      data.edges.forEach((edge) => {
        if (edge.source === selectedNode || edge.target === selectedNode) {
          selectedConnectedNodes.current.add(edge.source)
          selectedConnectedNodes.current.add(edge.target)
          selectedConnectedLinks.current.add(`${edge.source}-${edge.target}`)
        }
      })
    }
  }, [selectedNode, data.edges])

  const nodeColor = useCallback((node: NodeObject) => {
    // Prioridad: selección > hover/drag > default
    if (selectedNode) {
      // Si hay hover sobre una conexión del nodo seleccionado
      if (hoveredNode && hoveredNode !== selectedNode && selectedConnectedNodes.current.has(hoveredNode)) {
        // Solo el selected y el hovered al 100%
        if (node.id === selectedNode || node.id === hoveredNode) {
          return COLORS.node.hover
        }
        return COLORS.node.dimmed
      }
      // Sin hover: todos los conectados al 100%
      if (selectedConnectedNodes.current.has(node.id)) {
        return COLORS.node.hover
      }
      return COLORS.node.dimmed
    }

    const isHighlighted = hoveredNode || draggedNode
    if (isHighlighted) {
      if (connectedNodes.current.has(node.id)) {
        return COLORS.node.hover
      }
      return COLORS.node.dimmed
    }

    return COLORS.node.default
  }, [selectedNode, hoveredNode, draggedNode])

  const linkColor = useCallback((link: LinkObject) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    const linkKey = `${sourceId}-${targetId}`

    if (selectedNode) {
      // Si hay hover sobre una conexión del nodo seleccionado
      if (hoveredNode && hoveredNode !== selectedNode && selectedConnectedNodes.current.has(hoveredNode)) {
        // Link entre selectedNode y hoveredNode → highlight
        const isLinkBetweenSelectedAndHovered =
          (sourceId === selectedNode && targetId === hoveredNode) ||
          (sourceId === hoveredNode && targetId === selectedNode)

        if (isLinkBetweenSelectedAndHovered) {
          return COLORS.link.hover
        }
        // Todo lo demás → dimmed
        return COLORS.link.dimmed
      }

      // Sin hover en conexión: todas las conexiones del seleccionado → highlight
      if (selectedConnectedLinks.current.has(linkKey)) {
        return COLORS.link.hover
      }
      return COLORS.link.dimmed
    }

    const isHighlighted = hoveredNode || draggedNode
    if (isHighlighted) {
      if (connectedLinks.current.has(linkKey)) {
        return COLORS.link.hover
      }
      return COLORS.link.dimmed
    }

    return COLORS.link.default
  }, [selectedNode, hoveredNode, draggedNode])

  const nodeCanvasObject = useCallback((
    node: NodeObject,
    ctx: CanvasRenderingContext2D,
    globalScale: number
  ) => {
    const size = node.size || 4
    const x = node.x || 0
    const y = node.y || 0

    // Draw node
    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fillStyle = nodeColor(node)
    ctx.fill()

    // Mostrar label si:
    // - Es el nodo seleccionado
    // - Es el nodo con hover
    // - Es el nodo siendo arrastrado
    // - Es un nodo conectado al seleccionado Y tiene hover
    const showLabel =
      selectedNode === node.id ||
      hoveredNode === node.id ||
      draggedNode === node.id ||
      (selectedNode && selectedConnectedNodes.current.has(node.id) && hoveredNode === node.id)

    if (showLabel) {
      const label = node.label
      const fontSize = 12 / globalScale
      const padding = 4 / globalScale

      ctx.font = `${fontSize}px Sans-Serif`
      const textWidth = ctx.measureText(label).width
      const textHeight = fontSize
      const labelY = y - size - fontSize - padding

      // Draw background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(
        x - textWidth / 2 - padding,
        labelY - textHeight / 2 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      )

      // Draw text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#000000'
      ctx.fillText(label, x, labelY)
    }
  }, [selectedNode, hoveredNode, draggedNode, nodeColor])

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh' }}>
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor={COLORS.background}
          nodeColor={nodeColor}
          linkColor={linkColor}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
            const size = node.size || 4
            ctx.beginPath()
            ctx.arc(node.x || 0, node.y || 0, size + 4, 0, 2 * Math.PI)
            ctx.fillStyle = color
            ctx.fill()
          }}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onEngineStop={handleEngineStop}
          linkWidth={1}
          linkDirectionalArrowLength={(link: LinkObject) => {
            if (!selectedNode) return 0
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source
            const targetId = typeof link.target === 'object' ? link.target.id : link.target
            return (sourceId === selectedNode || targetId === selectedNode) ? 4 : 0
          }}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={linkColor}
          enableNodeDrag={true}
          cooldownTicks={200}
          d3VelocityDecay={0.55}
          d3AlphaDecay={0.015}
          minZoom={0.5}
          maxZoom={10}
        />
      )}
    </div>
  )
}
