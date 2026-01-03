# Architecture Documentation

## 🏛️ Technical Decisions

### Why React + TypeScript?

- **React**: Component-based architecture, great ecosystem, easy to maintain
- **TypeScript**: Type safety prevents bugs, better IDE support, self-documenting code
- **react-force-graph**: Chosen over D3.js for faster development while maintaining flexibility

### Why react-force-graph over D3.js?

| Aspect | react-force-graph | D3.js Pure |
|--------|------------------|------------|
| Development Speed | ⚡ Fast (hours) | 🐌 Slow (weeks) |
| React Integration | ✅ Native | ⚠️ Complex |
| Performance | 🚀 WebGL | 📊 Canvas/SVG |
| Customization | 🎨 Good enough | 🎨 Total control |
| Learning Curve | 📚 Easy | 📚 Steep |

**Decision**: Start with react-force-graph. If we hit limitations, we can migrate to D3 later. For 177-500 nodes, react-force-graph is perfect.

## 📐 Data Flow

```
MediaWiki API
      ↓
wiki_crawler.py (Python)
      ↓
remilia_graph_final.json
      ↓
React App loads JSON
      ↓
react-force-graph renders
      ↓
User interactions → State updates → Re-render
```

## 🗂️ File Structure

```
src/
├── components/
│   ├── Graph/
│   │   ├── Graph.tsx          # Main graph component
│   │   ├── GraphNode.tsx      # Custom node rendering (if needed)
│   │   └── GraphControls.tsx  # Zoom/pan controls
│   ├── Panel/
│   │   ├── SidePanel.tsx      # Side panel container
│   │   ├── NodeInfo.tsx       # Node details
│   │   └── ConnectionList.tsx # Incoming/outgoing lists
│   ├── Search/
│   │   └── SearchBar.tsx      # Search functionality
│   └── Layout/
│       └── AppLayout.tsx      # Main app layout
├── hooks/
│   ├── useGraphData.ts        # Load and process JSON
│   ├── useGraphInteraction.ts # Handle clicks, hovers
│   └── useSearch.ts           # Search logic
├── utils/
│   ├── graphProcessor.ts      # Process raw JSON data
│   ├── nodeSize.ts            # Calculate node sizes
│   └── colors.ts              # Color constants
├── types/
│   └── graph.ts               # TypeScript interfaces
└── App.tsx                    # Root component
```

## 🎨 Design System

### Color Palette
```typescript
const colors = {
  background: '#000000',      // Black
  node: {
    default: '#666666',       // Gray at 30% opacity
    hover: '#FFFFFF',         // White 100%
    missing: '#666666',       // Gray at 15% opacity
  },
  edge: {
    default: '#666666',       // Gray at 30% opacity
    hover: '#FFFFFF',         // White 100%
  }
}
```

### Interaction States
- **Default**: Nodes + edges at 30% opacity
- **Hover**: Hovered node + connected edges/nodes at 100% white
- **Selected**: Same as hover + side panel opens

## 🔄 State Management

Using React's built-in state (useState, useContext) - no Redux needed for this project.

```typescript
// Global state
{
  selectedNode: string | null,
  hoveredNode: string | null,
  isPanelOpen: boolean,
  searchQuery: string,
  showMissingPages: boolean,
  nodeSizeMode: 'uniform' | 'weighted' | 'custom'
}
```

## 📱 Responsive Strategy

### Desktop (> 768px)
- Full graph view
- Side panel slides in from right (30% width)
- Hover interactions

### Mobile (< 768px)
- Full-screen graph
- Panel becomes bottom sheet or full overlay
- Tap interactions instead of hover
- Eye icon to toggle panel visibility

## 🚀 Performance Considerations

### Current Scale (177 nodes)
- No optimization needed
- Load entire graph at once

### Future Scale (500+ nodes)
- Monitor performance
- Consider: viewport culling, level-of-detail rendering
- react-force-graph handles this well with WebGL

## 🔮 Future Architecture Decisions

### Phase 5: Community Detection
- Use Louvain algorithm (via graphology library)
- Calculate once, cache in JSON
- Add `community` field to node data

### Phase 6: Auto-updates
- GitHub Actions: runs crawler daily
- Commits new JSON if changes detected
- Vercel auto-deploys on commit
- No server-side logic needed

## 🛠️ Development Tools

- **Vite**: Fast build tool, better than CRA
- **ESLint + Prettier**: Code quality
- **Tailwind CSS**: Utility-first styling
- **Vercel**: Deploy preview on every commit

## 🔐 Data Privacy

- No user data collected
- No analytics (unless added later)
- All data is public wiki content
- No authentication needed
