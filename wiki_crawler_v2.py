import requests
import json
import time
import re
from collections import defaultdict

# ==================== CONFIGURACIÓN ====================

API_URL = "https://wiki.remilia.org/api.php"
BATCH_SIZE = 50  # Páginas por batch query
RATE_LIMIT_DELAY = 0.3  # Segundos entre requests

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

# ==================== PHASE 1: BASIC CRAWL ====================

def get_all_wiki_pages():
    """Obtiene lista de TODAS las páginas existentes en la wiki"""
    all_pages = []
    continue_param = {}
    
    print("🔍 Phase 1: Descubriendo páginas de la wiki...")
    
    while True:
        params = {
            'action': 'query',
            'list': 'allpages',
            'apnamespace': 0,
            'aplimit': 500,
            'format': 'json',
            **continue_param
        }
        
        response = requests.get(API_URL, params=params)
        data = response.json()
        
        pages = data.get('query', {}).get('allpages', [])
        for page in pages:
            title = page['title']
            if not is_non_english(title):
                all_pages.append(title)
        
        print(f"  Descubiertas: {len(all_pages)} páginas...")
        
        if 'continue' in data:
            continue_param = data['continue']
        else:
            break
        
        time.sleep(RATE_LIMIT_DELAY)
    
    print(f"✅ Total páginas encontradas: {len(all_pages)}\n")
    return all_pages


def get_page_links_api(page_title):
    """Obtiene todos los links de una página"""
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
            response = requests.get(API_URL, params=params, timeout=10)
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
            print(f"  ⚠️ API error for {page_title}: {e}")
            break
        
        time.sleep(RATE_LIMIT_DELAY)
    
    return links


def is_non_english(title):
    """Detecta páginas no-inglesas: sufijo /xx o caracteres Hangul"""
    if re.search(r'/[a-z]{2}$', title):
        return True
    if re.search(r'[\uAC00-\uD7AF\u1100-\u11FF]', title):
        return True
    return False


def filter_links(links, verbose=False):
    """Filtra links según reglas configurables"""
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

        # Excluir páginas no-inglesas
        if is_non_english(link):
            excluded.append((link, 'non-english'))
            continue

        filtered.append(link)
    
    if verbose and excluded:
        print(f"    Excluidos ({len(excluded)}):")
        for link, reason in excluded[:3]:
            print(f"      - {link} (razón: {reason})")
        if len(excluded) > 3:
            print(f"      ... y {len(excluded) - 3} más")
    
    return filtered


def crawl_wiki(pages, verbose=True):
    """Crawlea la wiki y obtiene el grafo básico"""
    graph = {}
    stats = {
        'total_pages': len(pages),
        'total_raw_links': 0,
        'total_filtered_links': 0,
    }
    
    print(f"🚀 Crawleando {len(pages)} páginas...\n")
    
    for i, page in enumerate(pages, 1):
        if verbose:
            print(f"[{i}/{len(pages)}] {page}")
        
        raw_links = get_page_links_api(page)
        stats['total_raw_links'] += len(raw_links)
        
        filtered_links = filter_links(raw_links, verbose=verbose)
        stats['total_filtered_links'] += len(filtered_links)
        
        graph[page] = filtered_links
        
        if verbose:
            print(f"  └─ {len(raw_links)} raw → {len(filtered_links)} filtrados\n")
        
        time.sleep(RATE_LIMIT_DELAY)
    
    return graph, stats


# ==================== PHASE 2: REDIRECT RESOLUTION ====================

def resolve_redirects_batch(page_titles):
    """
    Resuelve redirects para múltiples páginas en batch
    Retorna: {nombre_original: nombre_canonical}
    """
    redirect_map = {}
    
    # Procesar en batches de BATCH_SIZE
    for i in range(0, len(page_titles), BATCH_SIZE):
        batch = page_titles[i:i+BATCH_SIZE]
        
        params = {
            'action': 'query',
            'titles': '|'.join(batch),
            'redirects': 1,
            'format': 'json'
        }
        
        try:
            response = requests.get(API_URL, params=params, timeout=10)
            data = response.json()
            
            # Procesar redirects
            redirects = data.get('query', {}).get('redirects', [])
            for redirect in redirects:
                redirect_map[redirect['from']] = redirect['to']
            
            # Páginas sin redirect apuntan a sí mismas
            pages = data.get('query', {}).get('pages', {})
            for page_data in pages.values():
                if 'title' in page_data:
                    title = page_data['title']
                    if title not in redirect_map:
                        redirect_map[title] = title
            
        except Exception as e:
            print(f"⚠️ Error resolviendo batch: {e}")
        
        time.sleep(RATE_LIMIT_DELAY)
    
    return redirect_map


def normalize_graph(graph, redirect_map):
    """
    Normaliza el grafo usando el redirect_map
    Retorna: (normalized_graph, aliases_dict)
    """
    normalized = defaultdict(set)
    aliases = defaultdict(set)
    
    # Normalizar páginas fuente y sus links
    for source, targets in graph.items():
        canonical_source = redirect_map.get(source, source)
        
        # Si source era un redirect, guardar como alias
        if source != canonical_source:
            aliases[canonical_source].add(source)
        
        # Normalizar targets
        for target in targets:
            canonical_target = redirect_map.get(target, target)
            
            # Si target era un redirect, guardar como alias
            if target != canonical_target:
                aliases[canonical_target].add(target)
            
            normalized[canonical_source].add(canonical_target)
    
    # Convertir sets a lists para JSON
    normalized_graph = {k: list(v) for k, v in normalized.items()}
    aliases_dict = {k: list(v) for k, v in aliases.items()}
    
    return normalized_graph, aliases_dict


# ==================== PHASE 3: MISSING PAGES VERIFICATION ====================

def check_pages_exist_batch(page_titles):
    """
    Verifica qué páginas existen realmente
    Retorna: {nombre_pagina: existe_bool}
    """
    existence_map = {}
    
    print(f"🔍 Verificando existencia de {len(page_titles)} páginas...")
    
    for i in range(0, len(page_titles), BATCH_SIZE):
        batch = page_titles[i:i+BATCH_SIZE]
        
        params = {
            'action': 'query',
            'titles': '|'.join(batch),
            'format': 'json'
        }
        
        try:
            response = requests.get(API_URL, params=params, timeout=10)
            data = response.json()
            
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                title = page_data.get('title', '')
                # Si tiene 'missing', no existe; si tiene 'pageid', existe
                existence_map[title] = 'missing' not in page_data
            
        except Exception as e:
            print(f"⚠️ Error verificando batch: {e}")
        
        time.sleep(RATE_LIMIT_DELAY)
        
        if (i // BATCH_SIZE + 1) % 5 == 0:
            print(f"  Verificadas: {min(i+BATCH_SIZE, len(page_titles))}/{len(page_titles)}...")
    
    print(f"✅ Verificación completa\n")
    return existence_map


def analyze_missing_pages(graph, existing_pages):
    """
    Identifica y verifica páginas missing
    Retorna: {nombre_pagina: cantidad_referencias}
    """
    existing_set = set(existing_pages)
    
    # Contar referencias
    referenced_counts = defaultdict(int)
    for source, targets in graph.items():
        for target in targets:
            referenced_counts[target] += 1
    
    # Identificar potencialmente missing
    potentially_missing = [
        page for page in referenced_counts.keys()
        if page not in existing_set
    ]
    
    print(f"📊 Encontradas {len(potentially_missing)} páginas potencialmente missing")
    
    # Verificar con API
    existence_map = check_pages_exist_batch(potentially_missing)
    
    # Filtrar solo las que realmente no existen
    confirmed_missing = {
        page: referenced_counts[page]
        for page in potentially_missing
        if not existence_map.get(page, False)
    }
    
    # Páginas que existen pero no crawleamos (edge case)
    exist_but_not_crawled = [
        page for page in potentially_missing
        if existence_map.get(page, False)
    ]
    
    if exist_but_not_crawled:
        print(f"⚠️ {len(exist_but_not_crawled)} páginas existen pero no fueron crawleadas:")
        for page in exist_but_not_crawled[:5]:
            print(f"    - {page}")
        if len(exist_but_not_crawled) > 5:
            print(f"    ... y {len(exist_but_not_crawled) - 5} más")
        print()
    
    return confirmed_missing


# ==================== PHASE 4: ENRICHED EXPORT ====================

def build_enriched_graph(graph, aliases_dict, missing_pages, existing_pages):
    """
    Construye el grafo enriquecido con toda la metadata
    """
    nodes = []
    edges = []
    
    # Crear nodes
    all_page_names = set(graph.keys()) | set(missing_pages.keys())
    
    for page_name in all_page_names:
        node = {
            'id': page_name,
            'label': page_name,
            'exists': page_name in existing_pages or page_name in graph,
            'aliases': aliases_dict.get(page_name, []),
            'type': 'missing' if page_name in missing_pages else 'canonical'
        }
        nodes.append(node)
    
    # Crear edges
    for source, targets in graph.items():
        for target in targets:
            edges.append({
                'source': source,
                'target': target
            })
    
    # Calcular estadísticas
    total_redirects = sum(len(aliases) for aliases in aliases_dict.values())
    
    enriched = {
        'metadata': {
            'total_nodes': len(nodes),
            'existing_nodes': len([n for n in nodes if n['exists']]),
            'missing_nodes': len(missing_pages),
            'total_edges': len(edges),
            'redirects_resolved': total_redirects,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        },
        'nodes': nodes,
        'edges': edges
    }
    
    return enriched


def export_enriched_graph(enriched_graph, filename='remilia_graph_enriched.json'):
    """Exporta el grafo enriquecido"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(enriched_graph, f, indent=2, ensure_ascii=False)
    
    meta = enriched_graph['metadata']
    print(f"\n✅ Grafo enriquecido exportado a: {filename}")
    print(f"   Nodos totales: {meta['total_nodes']}")
    print(f"   Nodos existentes: {meta['existing_nodes']}")
    print(f"   Nodos missing: {meta['missing_nodes']}")
    print(f"   Edges: {meta['total_edges']}")
    print(f"   Redirects resueltos: {meta['redirects_resolved']}")


def export_missing_pages(missing_pages, filename='missing_pages_analysis.json'):
    """Exporta análisis de páginas faltantes"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(missing_pages, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Páginas missing exportadas a: {filename}")
    print(f"   Total: {len(missing_pages)} páginas confirmadas como red links")

    # Top 10
    if missing_pages:
        print(f"\n   🔗 Top 10 más referenciadas:")
        for page, count in sorted(missing_pages.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"      {count:3d}x → {page}")


def export_legacy_format(normalized_graph, filename='remilia_graph_final.json'):
    """Exporta en formato compatible con el frontend actual"""
    legacy = {
        'metadata': {
            'total_nodes': len(normalized_graph),
            'total_edges': sum(len(targets) for targets in normalized_graph.values()),
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        },
        'graph': normalized_graph
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(legacy, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Formato legacy exportado a: {filename}")
    print(f"   Nodos: {legacy['metadata']['total_nodes']}")
    print(f"   Edges: {legacy['metadata']['total_edges']}")


# ==================== MAIN ====================

def main():
    print("🌐 REMILIA WIKI GRAPH CRAWLER v2")
    print("="*60)
    print("Modo: COMPLETO (con redirects y verificación de missing)\n")
    
    # PHASE 1: Crawl básico
    print("="*60)
    print("PHASE 1: CRAWL BÁSICO")
    print("="*60)
    existing_pages = get_all_wiki_pages()
    graph, stats = crawl_wiki(existing_pages, verbose=False)
    
    print(f"\n📊 Estadísticas del crawl:")
    print(f"   Páginas crawleadas: {stats['total_pages']}")
    print(f"   Links raw: {stats['total_raw_links']}")
    print(f"   Links filtrados: {stats['total_filtered_links']}")
    
    # PHASE 2: Resolución de redirects
    print("\n" + "="*60)
    print("PHASE 2: RESOLUCIÓN DE REDIRECTS")
    print("="*60)
    
    # Recopilar todos los nombres únicos
    all_page_names = set(existing_pages)
    for targets in graph.values():
        all_page_names.update(targets)
    
    print(f"🔍 Resolviendo redirects para {len(all_page_names)} nombres únicos...")
    redirect_map = resolve_redirects_batch(list(all_page_names))
    
    # Normalizar grafo
    normalized_graph, aliases_dict = normalize_graph(graph, redirect_map)
    
    redirects_found = sum(1 for k, v in redirect_map.items() if k != v)
    print(f"✅ Redirects encontrados: {redirects_found}")
    print(f"✅ Aliases guardados para {len(aliases_dict)} páginas")
    
    # PHASE 3: Verificación de missing pages
    print("\n" + "="*60)
    print("PHASE 3: VERIFICACIÓN DE MISSING PAGES")
    print("="*60)
    
    missing_pages = analyze_missing_pages(normalized_graph, existing_pages)
    
    print(f"✅ Missing pages confirmadas: {len(missing_pages)}")
    
    # PHASE 4: Export enriquecido
    print("\n" + "="*60)
    print("PHASE 4: EXPORT")
    print("="*60)
    
    enriched_graph = build_enriched_graph(
        normalized_graph,
        aliases_dict,
        missing_pages,
        existing_pages
    )
    
    export_enriched_graph(enriched_graph)
    export_missing_pages(missing_pages)
    export_legacy_format(normalized_graph)

    print("\n✨ Done!")
    print("="*60)


if __name__ == "__main__":
    main()
