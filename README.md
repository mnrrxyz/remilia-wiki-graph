# Remilia Wiki Graph

Interactive visualization of the [Remilia Wiki](https://wiki.remilia.org/) conceptual network.

## 🎯 Project Overview

This project creates an interactive, web-based graph visualization that maps the relationships between pages in the Remilia wiki. It helps discover connections and navigate the wiki's interconnected content through an intuitive visual interface.

### Key Features

- **Interactive Graph**: Force-directed layout with zoom, pan, and drag
- **Smart Highlighting**: Hover/click to highlight node connections
- **Side Panel**: Click nodes to see incoming/outgoing connections
- **Search**: Quick node lookup with visual highlighting
- **Missing Pages**: Visual distinction for referenced-but-not-created pages
- **Responsive**: Works on desktop and mobile

## 📊 Current Stats

- **177** wiki pages
- **1,244** connections between pages
- **347** referenced but missing pages

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Visualization**: react-force-graph (WebGL-powered)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Data**: MediaWiki API scraper

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
remilia-wiki-graph/
├── src/                 # Source code
├── data/                # Graph data (JSON)
├── scripts/             # Crawling & processing scripts
├── docs/                # Additional documentation
└── public/              # Static assets
```

See individual README files in each directory for details.

## 🗺️ Development Roadmap

- [x] **Phase 0**: Project setup & architecture
- [ ] **Phase 1**: Basic graph rendering + hover
- [ ] **Phase 2**: Side panel + navigation
- [ ] **Phase 3**: Search + filters
- [ ] **Phase 4**: Mobile responsive + polish
- [ ] **Phase 5**: Community detection (future)
- [ ] **Phase 6**: Automated updates (future)

## 📝 Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical decisions
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - How to deploy

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

## 📄 License

MIT
