# Scripts Directory

Python scripts for crawling and processing Remilia wiki data.

## 📜 Scripts

### `wiki_crawler.py`
Main crawler that fetches all pages and their connections from the MediaWiki API.

**Usage:**
```bash
python wiki_crawler.py
```

**Output:**
- `remilia_graph_final.json` - Complete graph data
- `missing_pages_analysis.json` - Missing page statistics

**Features:**
- Configurable filters (excludes Templates, Categories, etc.)
- Rate limiting (0.3s between requests)
- Progress reporting
- Automatic analysis of top pages

### `visualize_graph.py`
Generates a PyVis HTML visualization for quick inspection.

**Usage:**
```bash
python visualize_graph.py
```

**Output:**
- `remilia_wiki_graph.html` - Interactive visualization (for testing)

**Note:** This is for local testing only. The web app uses react-force-graph instead.

## 🔧 Dependencies

```bash
pip install requests pyvis
```

Or use the requirements file:
```bash
pip install -r requirements.txt
```

## ⚙️ Configuration

### wiki_crawler.py

Edit these constants at the top of the file:

```python
# Pages to exclude
EXCLUDE_PREFIXES = [
    'Category:', 'File:', 'Template:', 
    'Special:', 'Help:', 'User:'
]

# Keywords to skip
EXCLUDE_KEYWORDS = [
    'navigation', 'Navigation'
]
```

## 📊 Output Format

The crawler generates JSON in this format:

```json
{
  "metadata": {
    "total_nodes": 177,
    "total_edges": 1244,
    "timestamp": "2026-01-01 19:19:24"
  },
  "graph": {
    "Page Name": ["Connection 1", "Connection 2"]
  }
}
```

## 🔄 Update Workflow

### Current (Manual)
1. Run `wiki_crawler.py`
2. Review output in terminal
3. Copy JSON files to `../data/`
4. Commit and push

### Future (Automated - Phase 6)
GitHub Actions will run this workflow:

```yaml
name: Update Wiki Data
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
      - name: Install dependencies
        run: pip install -r scripts/requirements.txt
      - name: Run crawler
        run: python scripts/wiki_crawler.py
      - name: Move files
        run: |
          mv remilia_graph_final.json data/
          mv missing_pages_analysis.json data/
      - name: Commit changes
        run: |
          git config --global user.name 'Bot'
          git config --global user.email 'bot@example.com'
          git add data/
          git diff --quiet && git diff --staged --quiet || \
            git commit -m "Update wiki data [skip ci]"
          git push
```

## 🚨 Error Handling

The crawler includes:
- Timeout handling (10s per request)
- Retry logic for failed requests
- Validation of JSON output
- Missing page tracking

## 📈 Performance

- **Speed**: ~0.3s per page (rate limited)
- **Total time**: ~1 minute for 177 pages
- **Memory**: Minimal (streaming JSON)

## 🧪 Testing

Test the crawler on a small subset:

```python
# In wiki_crawler.py, modify main():
test_pages = ['Milady Maker', 'Charlotte Fang', 'Bonkler']
graph, stats = crawl_wiki(pages=test_pages, verbose=True)
```

## 📝 Future Improvements

- [ ] Diff detection (only update if changed)
- [ ] Incremental updates (only new/modified pages)
- [ ] Community detection (Louvain algorithm)
- [ ] Webhook notification on updates
