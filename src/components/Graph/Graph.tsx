import { useCallback, useState, useRef, useEffect } from 'react'
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d'
import { forceX, forceY } from 'd3-force'
import type { GraphData, GraphNode, GraphEdge } from '@/types/graph'
import { COLORS } from '@/utils/colors'

interface GraphProps {
  data: GraphData
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

export function Graph({ data }: GraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods<NodeObject, LinkObject> | undefined>(undefined)

  const connectedNodes = useRef<Set<string>>(new Set())
  const connectedLinks = useRef<Set<string>>(new Set())

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


  const graphData = {
    nodes: data.nodes as NodeObject[],
    links: data.edges.map((edge: GraphEdge) => ({
      source: edge.source,
      target: edge.target,
    })),
  }

  const handleNodeHover = useCallback((node: NodeObject | null) => {
    connectedNodes.current.clear()
    connectedLinks.current.clear()

    if (node) {
      setHoveredNode(node.id)
      connectedNodes.current.add(node.id)

      data.edges.forEach((edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          connectedNodes.current.add(edge.source)
          connectedNodes.current.add(edge.target)
          connectedLinks.current.add(`${edge.source}-${edge.target}`)
        }
      })
    } else {
      setHoveredNode(null)
    }
  }, [data.edges])

  const nodeColor = useCallback((node: NodeObject) => {
    const isHighlighted = hoveredNode || draggedNode
    if (!isHighlighted) {
      return node.isMissing ? COLORS.node.missing : COLORS.node.default
    }
    if (connectedNodes.current.has(node.id)) {
      return COLORS.node.hover
    }
    return node.isMissing ? COLORS.node.missing : COLORS.node.default
  }, [hoveredNode, draggedNode])

  const linkColor = useCallback((link: LinkObject) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    const linkKey = `${sourceId}-${targetId}`

    const isHighlighted = hoveredNode || draggedNode
    if (isHighlighted && connectedLinks.current.has(linkKey)) {
      return COLORS.node.hover
    }
    return COLORS.node.default
  }, [hoveredNode, draggedNode])

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

    // Draw label with background on hover or drag
    if (hoveredNode === node.id || draggedNode === node.id) {
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
  }, [hoveredNode, draggedNode, nodeColor])

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
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onEngineStop={handleEngineStop}
          linkWidth={1}
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
