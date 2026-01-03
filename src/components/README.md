# Components Directory

React components for the Remilia Wiki Graph visualization.

## 🏗️ Component Architecture

```
components/
├── Graph/              # Graph visualization
│   ├── Graph.tsx
│   └── GraphControls.tsx
├── Panel/              # Side panel
│   ├── SidePanel.tsx
│   ├── NodeInfo.tsx
│   └── ConnectionList.tsx
├── Search/             # Search functionality
│   └── SearchBar.tsx
└── Layout/             # App structure
    └── AppLayout.tsx
```

## 📦 Component Overview

### Graph Components

#### `Graph.tsx`
Main graph visualization component using react-force-graph.

**Props:**
```typescript
interface GraphProps {
  data: GraphData;
  selectedNode: string | null;
  onNodeClick: (node: string) => void;
  onNodeHover: (node: string | null) => void;
  showMissingPages: boolean;
  nodeSizeMode: 'uniform' | 'weighted' | 'custom';
}
```

**Responsibilities:**
- Render the force-directed graph
- Handle zoom, pan, drag interactions
- Apply hover highlighting
- Show/hide missing pages

#### `GraphControls.tsx`
Overlay controls for the graph (zoom in/out, reset view, etc.)

---

### Panel Components

#### `SidePanel.tsx`
Container for the side panel that slides in from the right.

**Props:**
```typescript
interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

**Features:**
- Slide-in animation from right
- Close button (X icon)
- 30% width on desktop
- Full-screen overlay on mobile

#### `NodeInfo.tsx`
Displays information about the selected node.

**Props:**
```typescript
interface NodeInfoProps {
  node: GraphNode;
  onNodeClick: (nodeId: string) => void;
}
```

**Displays:**
- Node name as heading
- Link to wiki page (external link icon)
- Connection counts: "Incoming (7) / Outgoing (3)"
- "Add content to wiki" button (for missing pages)

#### `ConnectionList.tsx`
Lists incoming and outgoing connections.

**Props:**
```typescript
interface ConnectionListProps {
  incoming: string[];
  outgoing: string[];
  onNodeClick: (nodeId: string) => void;
}
```

**Structure:**
```
Incoming (7)
  - Charlotte Fang
  - Milady Maker
  - ...

Outgoing (3)
  - Network Spirituality
  - Post-Authorship
  - ...
```

---

### Search Components

#### `SearchBar.tsx`
Search input with magnifying glass icon.

**Props:**
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  onResult: (nodeId: string | null) => void;
}
```

**Features:**
- Magnifying glass icon
- Real-time filtering
- Highlights matching node on select
- Keyboard navigation (arrow keys, enter)

---

### Layout Components

#### `AppLayout.tsx`
Main application layout wrapper.

**Structure:**
```
┌─────────────────────────────────────┐
│  Search Bar        [Controls]       │
├─────────────────────────────────────┤
│                             ┌───────┤
│                             │       │
│         Graph               │ Panel │
│                             │       │
│                             └───────┤
└─────────────────────────────────────┘
```

---

## 🎨 Styling Conventions

All components use **Tailwind CSS** utility classes:

```tsx
// Example: Consistent dark theme
<div className="bg-black text-white">
  
// Example: Hover effects
<button className="hover:text-white transition-colors">

// Example: Responsive design
<div className="w-full md:w-[30%]">
```

## 🔄 State Management

Components receive state via props (passed down from App.tsx).

**Prop drilling pattern:**
```
App.tsx (state)
  ↓
AppLayout.tsx (structure)
  ↓
Graph.tsx, SidePanel.tsx (features)
  ↓
NodeInfo.tsx, ConnectionList.tsx (details)
```

For larger state needs in the future, consider React Context or Zustand.

## 📱 Responsive Behavior

### Desktop (> 768px)
- Side panel: 30% width, slides in from right
- Hover interactions
- Full controls visible

### Mobile (< 768px)
- Side panel: Full-screen overlay or bottom sheet
- Tap interactions (no hover)
- Eye icon button to toggle panel
- Simplified controls

## 🧪 Testing

Each component should be testable in isolation:

```tsx
// Example: Test NodeInfo component
import { render, screen } from '@testing-library/react';
import NodeInfo from './NodeInfo';

test('displays node name', () => {
  const node = { id: 'test', label: 'Test Node', ... };
  render(<NodeInfo node={node} onNodeClick={() => {}} />);
  expect(screen.getByText('Test Node')).toBeInTheDocument();
});
```

## 🚀 Future Components

### Phase 5: Communities
- `CommunityFilter.tsx` - Filter by detected communities
- `CommunityLegend.tsx` - Show color-coded communities

### Optional
- `GraphMinimap.tsx` - Bird's eye view of graph
- `NodeTooltip.tsx` - Rich hover tooltips
- `ExportButton.tsx` - Export graph as image
