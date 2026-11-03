import { isAvailable, minPrice, norm, type CategoryId, type Product } from './catalog';

/** Ordenações do catálogo, com o valor que aparece no endereço (?ordem=). */
export const SORTS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'novos', label: 'Lançamentos' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'a-z', label: 'Nome (A–Z)' },
] as const;

export type SortValue = (typeof SORTS)[number]['value'];

export interface CatalogQuery {
  cat: CategoryId | 'all';
  q: string;
  sort: SortValue;
  onlyAvail: boolean;
}

const isSort = (s: string | null): s is SortValue => SORTS.some((o) => o.value === s);

/** Lê busca, ordem e disponibilidade dos parâmetros do endereço. */
export function readQuery(cat: CategoryId | 'all', params: URLSearchParams): CatalogQuery {
  const ordem = params.get('ordem');
  return { cat, q: params.get('q') ?? '', sort: isSort(ordem) ? ordem : 'relevancia', onlyAvail: params.get('disponiveis') === '1' };
}

/** Monta o endereço do catálogo; valores padrão ficam fora para manter o link curto. */
export function catalogHref({ cat = 'all', q = '', sort = 'relevancia', onlyAvail = false }: Partial<CatalogQuery> = {}): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (sort !== 'relevancia') params.set('ordem', sort);
  if (onlyAvail) params.set('disponiveis', '1');
  const qs = params.toString();
  return `/loja${cat === 'all' ? '' : `/${cat}`}${qs ? `?${qs}` : ''}`;
}

export function filterProducts(products: Product[], { cat, q, sort, onlyAvail }: CatalogQuery): Product[] {
  let list = products.filter((p) => cat === 'all' || p.catIds.includes(cat));
  const nq = norm(q.trim());
  if (nq) {
    list = list.filter((p) =>
      norm(`${p.name} ${p.desc} ${p.catNames.join(' ')}${p.isKit ? ' kit' : ''}`).includes(nq),
    );
  }
  if (onlyAvail) list = list.filter(isAvailable);
  const sorted = list.slice();
  if (sort === 'menor-preco') sorted.sort((a, b) => minPrice(a) - minPrice(b));
  else if (sort === 'maior-preco') sorted.sort((a, b) => minPrice(b) - minPrice(a));
  else if (sort === 'a-z') sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  else if (sort === 'novos') sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  return sorted;
}

export const countInCategory = (products: Product[], cat: CategoryId | 'all') =>
  products.filter((p) => cat === 'all' || p.catIds.includes(cat)).length;
