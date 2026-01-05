import { useState, useCallback, useRef, useEffect } from 'react'
import type { GraphNode } from '@/types/graph'

interface SearchBarProps {
  nodes: GraphNode[]
  onNodeSelect: (nodeId: string) => void
}

export function SearchBar({ nodes, onNodeSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter nodes based on query
  const results = query.length > 0
    ? nodes
        .filter(node => node.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : []

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((nodeId: string) => {
    onNodeSelect(nodeId)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [onNodeSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && results.length > 0) {
        handleSelect(results[0].id)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        handleSelect(results[selectedIndex].id)
        break
      case 'Escape':
        setIsOpen(false)
        setQuery('')
        inputRef.current?.blur()
        break
    }
  }, [isOpen, results, selectedIndex, handleSelect])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-black/80 border border-white/20 rounded-lg px-3 py-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/60 mr-2 flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages..."
          className="bg-transparent text-white text-sm outline-none w-48 placeholder:text-white/40"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/20 rounded-lg overflow-hidden z-50">
          {results.map((node, index) => (
            <button
              key={node.id}
              onClick={() => handleSelect(node.id)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-white/10 text-white'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {node.label}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length > 0 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/20 rounded-lg overflow-hidden z-50">
          <div className="px-3 py-2 text-sm text-white/40">
            No results found
          </div>
        </div>
      )}
    </div>
  )
}
