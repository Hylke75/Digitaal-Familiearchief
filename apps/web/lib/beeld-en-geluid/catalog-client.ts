import type { ExternalArchiveItem, RightsStatus } from './types';

/**
 * NISV Media Catalog client (docs/connectors/beeld-en-geluid.md). Automated
 * access uses ONLY the sanctioned open-data SPARQL endpoint — never Schatkamer
 * (scraping is forbidden by its terms). Metadata is CC0. The exact schema.org
 * predicates the catalog exposes are not fully published; this query is
 * defensive and the adapter reads bindings tolerantly — verify predicates with a
 * `DESCRIBE` against the live endpoint before relying on any specific field.
 */
const SPARQL_ENDPOINT = 'https://cat.apis.beeldengeluid.nl/sparql';

export type Fetcher = (
  url: string,
  init: { method: string; headers: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

interface SparqlValue {
  type: string;
  value: string;
}
type SparqlBinding = Record<string, SparqlValue | undefined>;
interface SparqlResults {
  results?: { bindings?: SparqlBinding[] };
}

/** Map an item's rights value (rightsstatements.org / creativecommons.org) to a
 * Bewora rights state. Default is link-only for protected material (§13). */
export function rightsFrom(value?: string): {
  rightsStatus: RightsStatus;
  publicDomain: boolean;
  embeddable: boolean;
} {
  const v = (value ?? '').toLowerCase();
  if (!v) return { rightsStatus: 'rights_unknown', publicDomain: false, embeddable: false };
  if (
    v.includes('publicdomain') ||
    v.includes('/pdm') ||
    v.includes('mark/1.0') ||
    v.includes('cc0') ||
    v.includes('zero/1.0')
  ) {
    return { rightsStatus: 'public_domain', publicDomain: true, embeddable: true };
  }
  if (v.includes('creativecommons.org/licenses')) {
    return { rightsStatus: 'open_license', publicDomain: false, embeddable: false };
  }
  if (v.includes('rightsstatements.org')) {
    return { rightsStatus: 'link_only', publicDomain: false, embeddable: false };
  }
  return { rightsStatus: 'rights_unknown', publicDomain: false, embeddable: false };
}

function str(b: SparqlBinding, key: string): string | undefined {
  const v = b[key];
  return v && v.value !== '' ? v.value : undefined;
}

/** Adapt SPARQL result bindings to Bewora domain items. Version-tolerant. */
export function adaptBindings(bindings: SparqlBinding[]): ExternalArchiveItem[] {
  const items: ExternalArchiveItem[] = [];
  for (const b of bindings) {
    const uri = str(b, 's') ?? str(b, 'item');
    const title = str(b, 'title') ?? str(b, 'name');
    if (!uri || !title) continue;
    const rights = rightsFrom(str(b, 'rights') ?? str(b, 'license'));
    items.push({
      provider: 'beeld_en_geluid',
      providerRecordId: uri,
      title,
      broadcastDate: str(b, 'date') ?? str(b, 'datePublished'),
      broadcaster: str(b, 'publisher') ?? str(b, 'broadcaster'),
      series: str(b, 'series'),
      publicPageUrl: uri.startsWith('http') ? uri : undefined,
      license: str(b, 'rights') ?? str(b, 'license'),
      ...rights,
    });
  }
  return items;
}

function buildSearchQuery(query: string, limit: number): string {
  const term = query.replace(/["\\\n\r]/g, ' ').trim();
  const lim = Math.min(Math.max(limit, 1), 50);
  return `PREFIX sdo: <https://schema.org/>
SELECT ?s ?title ?date ?publisher ?rights WHERE {
  ?s sdo:name ?title .
  OPTIONAL { ?s sdo:datePublished ?date }
  OPTIONAL { ?s sdo:publisher ?publisher }
  OPTIONAL { ?s sdo:license ?rights }
  FILTER(CONTAINS(LCASE(STR(?title)), LCASE("${term}")))
} LIMIT ${lim}`;
}

export class NisvMediaCatalogClient {
  constructor(
    private readonly fetchImpl: Fetcher,
    private readonly endpoint: string = SPARQL_ENDPOINT,
  ) {}

  /** Free-text search over the open metadata (server-side; throttle callers). */
  async search(query: string, limit = 20): Promise<ExternalArchiveItem[]> {
    if (query.trim().length < 3) return [];
    const url = `${this.endpoint}?query=${encodeURIComponent(buildSearchQuery(query, limit))}`;
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/sparql-results+json' },
    });
    if (!res.ok) throw new Error(`NISV Media Catalog ${res.status}`);
    const data = (await res.json()) as SparqlResults;
    return adaptBindings(data.results?.bindings ?? []);
  }
}
