// Tipos e funções de apoio do catálogo, usados pela vitrine.
// Os dados vêm do banco (src/data/loja.ts); o catálogo fictício está em demo-catalog.ts.

/** Slug da categoria no banco (ex.: "brincos"). */
export type CategoryId = string;
/** Ilustrações disponíveis enquanto não há fotos reais. */
export type ArtCat = 'brincos' | 'colares' | 'pulseiras' | 'aneis' | 'tornozeleiras' | 'piercings' | 'kit';
export type Tone = 'gold' | 'rose' | 'silver';
export type ProductKind = 'simple' | 'kit_stocked' | 'kit_composed';
export type Unit = 'par' | 'unidade' | 'conjunto';

export interface Category {
  id: CategoryId;
  name: string;
}

export interface VariantGroup {
  name: string;
  values: string[];
}

export interface Variant {
  /** Identificador da variação no banco (vazio nos dados fictícios). */
  id?: string;
  key: string;
  vals: string[];
  label: string;
  sku: string;
  /** Preço cobrado agora, em centavos (já com a promoção, se estiver valendo). */
  price: number;
  /** Preço normal quando há promoção valendo; senão, null. */
  compare: number | null;
  /** Fim da promoção que está valendo (ISO), para o aviso na página; senão, null. */
  promoEnds?: string | null;
  avail: boolean;
}

/** Peça de um kit composto. Só "disponível ou não", nunca quantidade (CAT-DEC-024). */
export interface KitComponent {
  ref: string;
  name: string;
  unit: Unit;
  qty: number;
  avail: boolean;
}

/** Foto do produto no Storage: versão grande (página) e pequena (cartões, sacola). */
export interface Foto {
  src: string;
  thumb: string;
  alt: string;
}

/** Vídeo curto do produto: MP4 sem som e a capa tirada dele. */
export interface VideoProduto {
  src: string;
  poster: string;
}

export interface Product {
  id: string;
  /** Endereço amigável da página do produto (/produto/<slug>). */
  slug: string;
  name: string;
  catIds: CategoryId[];
  catNames: string[];
  gem: boolean;
  isNew: boolean;
  best: boolean;
  unit: Unit;
  groups: VariantGroup[];
  base: number;
  desc: string;
  short?: string;
  material: string;
  /** Cuidados com a peça (campo "Cuidados" do cadastro); vazio não aparece. */
  care?: string;
  kind: ProductKind;
  isKit: boolean;
  variants: Variant[];
  tone: Tone;
  bg: number;
  comps: KitComponent[] | null;
  /** Fotos na ordem de exibição, capa primeiro. Vazio: mostra a ilustração. */
  photos?: Foto[];
  /** Vídeo curto; aparece por último na galeria da página do produto. */
  video?: VideoProduto;
}

export interface ArtProps {
  cat: ArtCat;
  tone: Tone;
  gem: boolean;
  bg: number;
}

/** Tom da ilustração de cada categoria na home. */
export const CATEGORY_TONE: Record<string, Tone> = {
  brincos: 'rose',
  colares: 'gold',
  pulseiras: 'gold',
  aneis: 'silver',
  tornozeleiras: 'gold',
  piercings: 'rose',
};

const ART_CATS: ArtCat[] = ['brincos', 'colares', 'pulseiras', 'aneis', 'tornozeleiras', 'piercings'];
export const artCatOf = (slug: string): ArtCat => (ART_CATS.includes(slug as ArtCat) ? (slug as ArtCat) : 'aneis');

export const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const norm = (s: string) => stripDiacritics(String(s)).toLowerCase();

export const slugify = (s: string) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const toneOf = (vals: string[]): Tone => {
  const s = vals.join(' ');
  return /Ródio/.test(s) ? 'silver' : /Rosé/.test(s) ? 'rose' : 'gold';
};

export const fmt = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const artOf = (p: Product, v?: Variant): ArtProps => ({
  cat: p.isKit ? 'kit' : artCatOf(p.catIds[0] ?? ''),
  tone: v ? toneOf(v.vals) : p.tone,
  gem: p.gem,
  bg: p.bg,
});

export const categoryLabel = (p: Product) => (p.isKit ? 'Kit' : (p.catNames[0] ?? ''));

export const cheapestVariant = (p: Product) => p.variants.reduce((a, b) => (b.price < a.price ? b : a));

export const minPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));

export const isAvailable = (p: Product) => p.variants.some((v) => v.avail);
