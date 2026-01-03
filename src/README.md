# Source Code Directory

This directory contains all the React application source code.

## 📁 Structure

```
src/
├── components/     # React components (UI building blocks)
├── hooks/          # Custom React hooks (reusable logic)
├── utils/          # Helper functions (pure utilities)
├── types/          # TypeScript type definitions
├── App.tsx         # Root component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## 🧩 Components

See [components/README.md](./components/README.md) for details on each component.

### Component Organization
- Each major feature gets its own directory
- Related components are grouped together
- Shared/common components go in `components/common/`

## 🪝 Hooks

Custom hooks encapsulate reusable logic:

- `useGraphData.ts` - Loads and processes the graph JSON
- `useGraphInteraction.ts` - Handles node clicks, hovers, selection
- `useSearch.ts` - Search functionality and node filtering

## 🛠️ Utils

Pure functions with no React dependencies:

- `graphProcessor.ts` - Transform raw JSON into graph format
- `nodeSize.ts` - Calculate node sizes based on connections
- `colors.ts` - Color constants and theme values

## 📝 Types

TypeScript interfaces and types:

```typescript
// Example: types/graph.ts
interface GraphNode {
  id: string;
  label: string;
  connections: string[];
  isMissing: boolean;
  size?: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

## 🎨 Styling

We use **Tailwind CSS** for styling:
- Utility classes for most styling
- Custom CSS only when necessary
- Dark theme by default (black background)

## 🚀 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

## 📦 Key Dependencies

- `react` - UI library
- `react-force-graph` - Graph visualization
- `tailwindcss` - Styling
- `lucide-react` - Icons (search, external-link, eye, x)
