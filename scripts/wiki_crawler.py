import requests
import json
import time
from collections import defaultdict

# ==================== FILTROS CONFIGURABLES ====================

# Prefijos de páginas a EXCLUIR completamente
EXCLUDE_PREFIXES = [
    'Category:',
    'File:',
    'Template:',
    'Template talk:',
    'Special:',
    'Help:',
    'MediaWiki:',
    'User:',
    'User talk:',
    'Talk:',
    'Wikipedia:',
]

# Palabras clave que indican páginas de navegación/sistema a EXCLUIR
EXCLUDE_KEYWORDS = [
    'navigation',
    'Navigation',
]

# ==================== API FUNCTIONS ====================

def get_all_wiki_pages():
    """Obtiene lista de TODAS las páginas de la wiki (main namespace)"""
    url = "https://wiki.remilia.org/api.php"
    
    all_pages = []
    continue_param = {}
    
    print("🔍 Descubriendo todas las páginas de la wiki...")
    
    while True:
        params = {
            'action': 'query',
            'list': 'allpages',
            'apnamespace': 0,  # Solo main namespace
            'aplimit': 500,
            'format': 'json',
            **continue_param
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        pages = data.get('query', {}).get('allpages', [])
        for page in pages:
            all_pages.append(page['title'])
        
        print(f"  Descubiertas: {len(all_pages)} páginas...")
        
        if 'continue' in data:
            continue_param = data['continue']
        else:
            break
    
    print(f"✅ Total de páginas encontradas: {len(all_pages)}\n")
    return all_pages

def get_page_links_api(page_title):
    """Obtiene todos los links de una página usando la API"""
    url = "https://wiki.remilia.org/api.php"
    
    links = []
    continue_param = {}
    
    while True:
        params = {
            'action': 'query',
            'titles': page_title,
            'prop': 'links',
            'pllimit': 500,
            'format': 'json',
            **continue_param
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'links' in page_data:
                    for link in page_data['links']:
                        links.append(link['title'])
            
            if 'continue' in data:
                continue_param = data['continue']
            else:
                break
        except Exception as e:
            print(f"  ❌ API error: {e}")
            break
    
    return links

def filter_links(links, verbose=False):
    """
    Filtra links según las reglas configurables
    
    EXCLUYE:
    - Páginas de navegación (templates, categorías, etc)
    - Links externos (estos vienen en otra prop de la API)
    - Páginas de sistema/ayuda
    
    INCLUYE:
    - Todo el contenido conceptual (incluyendo See Also)
    - Links a otras páginas de la wiki en main namespace
    """
    filtered = []
    excluded = []
    
    for link in links:
        # Check prefijos
        if any(link.startswith(prefix) for prefix in EXCLUDE_PREFIXES):
            excluded.append((link, 'prefix'))
            continue
        
        # Check keywords
        if any(keyword in link for keyword in EXCLUDE_KEYWORDS):
            excluded.append((link, 'keyword'))
            continue
        
        # Si pasó todos los filtros, incluir
        filtered.append(link)
    
    if verbose and excluded:
        print(f"    Excluidos ({len(excluded)}):")
        for link, reason in excluded[:3]:
            print(f"      - {link} (razón: {reason})")
        if len(excluded) > 3:
            print(f"      ... y {len(excluded) - 3} más")
    
    return filtered

# ==================== CRAWLER ====================

def crawl_wiki(pages=None, verbose=True):
    """Crawlea la wiki con API + filtros configurables"""
    
    if pages is None:
        pages = get_all_wiki_pages()
    
    graph = {}
    stats = {
        'total_pages': len(pages),
        'total_raw_links': 0,
        'total_filtered_links': 0,
        'pages_with_links': 0,
        'pages_without_links': 0
    }
    
    print(f"🚀 Crawleando {len(pages)} páginas...\n")
    
    for i, page in enumerate(pages, 1):
        if verbose:
            print(f"[{i}/{len(pages)}] {page}")
        
        # Obtener links raw de la API
        raw_links = get_page_links_api(page)
        stats['total_raw_links'] += len(raw_links)
        
        # Filtrar según configuración
        filtered_links = filter_links(raw_links, verbose=verbose)
        stats['total_filtered_links'] += len(filtered_links)
        
        graph[page] = filtered_links
        
        if filtered_links:
            stats['pages_with_links'] += 1
        else:
            stats['pages_without_links'] += 1
        
        if verbose:
            print(f"  └─ {len(raw_links)} raw → {len(filtered_links)} filtrados\n")
        
        time.sleep(0.3)  # Rate limiting
    
    return graph, stats

# ==================== ANALYSIS ====================

def analyze_graph(graph, stats):
    """Análisis del grafo final"""
    
    print("\n" + "="*60)
    print("📊 ANÁLISIS DEL GRAFO")
    print("="*60)
    
    print(f"\n📈 Estadísticas generales:")
    print(f"  Total de páginas: {stats['total_pages']}")
    print(f"  Páginas con links: {stats['pages_with_links']}")
    print(f"  Páginas sin links: {stats['pages_without_links']}")
    print(f"  Links raw (API): {stats['total_raw_links']}")
    print(f"  Links filtrados: {stats['total_filtered_links']}")
    print(f"  Reducción: {((stats['total_raw_links'] - stats['total_filtered_links']) / stats['total_raw_links'] * 100):.1f}%")
    
    avg_links = stats['total_filtered_links'] / stats['total_pages']
    print(f"  Promedio de links por página: {avg_links:.1f}")
    
    # Páginas más referenciadas (centralidad)
    incoming = defaultdict(int)
    for source, targets in graph.items():
        for target in targets:
            incoming[target] += 1
    
    print(f"\n🔗 Top 10 conceptos más referenciados:")
    for page, count in sorted(incoming.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {count:3d} ← {page}")
    
    # Páginas con más links salientes
    print(f"\n📤 Top 10 páginas con más conexiones:")
    outgoing = [(page, len(links)) for page, links in graph.items()]
    for page, count in sorted(outgoing, key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {count:3d} → {page}")
    
    # Páginas aisladas (sin links entrantes ni salientes)
    isolated = [
        page for page in graph.keys() 
        if len(graph[page]) == 0 and incoming.get(page, 0) == 0
    ]
    if isolated:
        print(f"\n⚠️  Páginas aisladas (sin conexiones): {len(isolated)}")
        for page in isolated[:5]:
            print(f"    - {page}")
        if len(isolated) > 5:
            print(f"    ... y {len(isolated) - 5} más")

def export_for_visualization(graph, filename='remilia_graph_final.json'):
    """Exporta en formato listo para visualización"""
    
    # Formato con metadata útil
    export = {
        'metadata': {
            'total_nodes': len(graph),
            'total_edges': sum(len(links) for links in graph.values()),
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        },
        'graph': graph
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Grafo exportado a: {filename}")

# ==================== MAIN ====================

if __name__ == "__main__":
    
    print("🌐 REMILIA WIKI GRAPH CRAWLER")
    print("="*60)
    print(f"\nFiltros activos:")
    print(f"  Excluir prefijos: {', '.join(EXCLUDE_PREFIXES[:5])}...")
    print(f"  Excluir keywords: {', '.join(EXCLUDE_KEYWORDS)}")
    print()
    
    # Crawlear
    graph, stats = crawl_wiki(verbose=True)
    
    # Analizar
    analyze_graph(graph, stats)
    
    # Exportar
    export_for_visualization(graph)
    
    print("\n✨ Done!")