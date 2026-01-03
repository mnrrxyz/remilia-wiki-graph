# Getting Started

Quick guide to get the Remilia Wiki Graph running locally.

## 📋 Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([download](https://git-scm.com/))
- **Python** 3.8+ (for crawling scripts, optional)

## 🚀 Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/remilia-wiki-graph.git
cd remilia-wiki-graph
```

### 2. Install Dependencies

```bash
npm install
```

This installs all the packages defined in `package.json`.

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📁 Project Structure

```
remilia-wiki-graph/
├── src/                 # React source code
│   ├── components/      # UI components (Graph, Panel, Search)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   └── types/          # TypeScript types
├── data/               # Graph JSON files
├── scripts/            # Python crawling scripts
├── docs/               # Documentation
└── public/             # Static assets
```

## 🎯 Development Workflow

### Running the App

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run type-check   # Verify TypeScript types
```

### Making Changes

1. **Edit components** in `src/components/`
2. **Changes auto-reload** in browser (hot module replacement)
3. **Check console** for errors
4. **Commit changes** when ready

### File Locations

- **Add new components**: `src/components/`
- **Update graph data**: `data/remilia_graph_final.json`
- **Modify colors/styles**: `tailwind.config.js` or component files
- **Change build config**: `vite.config.ts`

## 🐍 Python Scripts (Optional)

If you want to update the graph data:

### 1. Install Python Dependencies

```bash
cd scripts/
pip install -r requirements.txt
```

### 2. Run the Crawler

```bash
python wiki_crawler.py
```

This generates:
- `remilia_graph_final.json`
- `missing_pages_analysis.json`

### 3. Move Files to Data Directory

```bash
mv remilia_graph_final.json ../data/
mv missing_pages_analysis.json ../data/
```

The React app automatically uses the updated data on next reload.

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  'remilia-black': '#000000',  // Background
  'remilia-gray': '#666666',   // Default nodes/edges
  'remilia-white': '#FFFFFF',  // Hover state
}
```

### Adjust Graph Physics

Edit graph settings in `src/components/Graph/Graph.tsx`:

```typescript
// Example: Make nodes spread out more
<ForceGraph2D
  d3VelocityDecay={0.3}  // Lower = slower settling
  d3AlphaDecay={0.02}    // Lower = longer simulation
  cooldownTicks={100}    // More ticks = better layout
/>
```

### Modify Node Sizes

Edit `src/utils/nodeSize.ts` to change size calculation logic.

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
npx kill-port 5173

# Or run on different port
npm run dev -- --port 3000
```

### Dependencies Won't Install

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Verify types
npm run type-check

# Common fix: update types
npm install --save-dev @types/react@latest @types/react-dom@latest
```

### Graph Won't Render

1. Check browser console for errors
2. Verify `data/remilia_graph_final.json` exists
3. Check JSON is valid: `node -p "require('./data/remilia_graph_final.json')"`

## 📚 Learn More

- [React Documentation](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [react-force-graph](https://github.com/vasturiano/react-force-graph)
- [Vite Guide](https://vitejs.dev/guide/)

## 🔄 Updating from Git

```bash
git pull origin main
npm install  # Update dependencies if needed
npm run dev
```

## 🚢 Deploying

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Vercel deployment guide.

Quick version:
1. Push to GitHub
2. Import project in Vercel
3. Auto-deploys on every commit

## ❓ Need Help?

1. Check the READMEs in each directory
2. Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details
3. Review [CHANGELOG.md](./CHANGELOG.md) for recent changes

## 🎉 You're Ready!

You should now have a running development environment. Start exploring the code in `src/` and make it your own!
