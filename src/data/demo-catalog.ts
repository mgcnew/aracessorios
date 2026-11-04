// Catálogo FICTÍCIO do protótipo: produtos, preços e estoques inventados.
// Usado só por scripts/gerar-seed.ts para gerar a carga de demonstração do banco.
// O site lê o catálogo do banco (src/data/loja.ts); não importe este arquivo nas telas.

import { slugify, stripDiacritics, toneOf, type Category, type KitComponent, type Product, type ProductKind, type Unit, type Variant, type VariantGroup } from './catalog.ts';

/** Produto fictício: tem também o código usado no SKU e o saldo do kit com estoque próprio. */
export interface DemoProduct extends Product {
  code: string;
  kitStock?: number;
}

export const DEMO_CATEGORIES: Category[] = [
  { id: 'brincos', name: 'Brincos' },
  { id: 'colares', name: 'Colares' },
  { id: 'pulseiras', name: 'Pulseiras' },
  { id: 'aneis', name: 'Anéis' },
  { id: 'tornozeleiras', name: 'Tornozeleiras' },
  { id: 'piercings', name: 'Piercings' },
];

const skuPart = (s: string) =>
  stripDiacritics(String(s)).replace(/[^A-Za-z0-9]+/g, '').toUpperCase().slice(0, 4);

const BA: VariantGroup = { name: 'Banho', values: ['Ouro 18k', 'Rosé', 'Ródio'] };
const BB: VariantGroup = { name: 'Banho', values: ['Ouro 18k', 'Ródio'] };
const BC: VariantGroup = { name: 'Banho', values: ['Ouro 18k', 'Rosé'] };

/** Estoque por produto simples usado no cálculo dos kits compostos. */
const STOCK: Record<string, number> = { p1: 6, p3: 12, p4: 3, p9: 0 };

interface RawProduct {
  id: string;
  code: string;
  name: string;
  catIds: string[];
  gem: boolean;
  isNew?: boolean;
  best?: boolean;
  unit: Unit;
  groups: VariantGroup[];
  add?: Record<string, number>;
  base: number;
  compare?: number;
  out?: string[];
  allOut?: boolean;
  kind?: Exclude<ProductKind, 'simple'>;
  kitStock?: number;
  comps?: { ref: string; qty: number }[];
  short?: string;
  desc: string;
  material: string;
}

const RAW: RawProduct[] = [
  { id: 'p1', code: 'BRC001', name: 'Brinco Gota Aurora', catIds: ['brincos'], gem: true, isNew: true, best: true, unit: 'par', groups: [BA], base: 8990, desc: 'Gota delicada com pérola ao centro, leve para usar do trabalho à noite.', material: 'Semijoia com banho, pérola sintética' },
  { id: 'p2', code: 'BRC002', name: 'Brinco Argola Lunar', catIds: ['brincos'], gem: false, best: true, unit: 'par', groups: [BB, { name: 'Tamanho', values: ['P', 'M', 'G'] }], add: { M: 1000, G: 2000 }, base: 6990, compare: 8990, out: ['Ródio|G'], desc: 'Argola lisa de linhas suaves, em três tamanhos para compor com qualquer visual.', material: 'Semijoia com banho' },
  { id: 'p3', code: 'BRC003', name: 'Brinco Pérola Clássica', catIds: ['brincos'], gem: true, unit: 'par', groups: [BB], base: 7490, desc: 'Ponto de luz clássico, para usar sozinho ou em composição com outros brincos.', material: 'Semijoia com banho, pérola sintética' },
  { id: 'p4', code: 'COL001', name: 'Colar Ponto de Luz', catIds: ['colares'], gem: true, unit: 'unidade', groups: [BB, { name: 'Comprimento', values: ['40 cm', '45 cm'] }], base: 11990, out: ['Ródio|45 cm'], desc: 'Corrente fina com um pingente brilhante, discreta e fácil de combinar.', material: 'Semijoia com banho, zircônia' },
  { id: 'p5', code: 'COL002', name: 'Colar Gotas de Orvalho', catIds: ['colares'], gem: true, isNew: true, unit: 'unidade', groups: [BB, { name: 'Comprimento', values: ['40 cm', '45 cm'] }], base: 12990, desc: 'Pingente em gota com acabamento luminoso, para dar leveza ao decote.', material: 'Semijoia com banho' },
  { id: 'p6', code: 'COL003', name: 'Colar Elo Fino', catIds: ['colares'], gem: false, best: true, unit: 'unidade', groups: [BC], base: 9990, desc: 'Corrente de elos finos, ideal para o uso diário e para sobreposição.', material: 'Semijoia com banho' },
  { id: 'p7', code: 'PUL001', name: 'Pulseira Riviera Delicada', catIds: ['pulseiras'], gem: true, best: true, unit: 'unidade', groups: [BA, { name: 'Tamanho', values: ['16 cm', '18 cm', '20 cm'] }], base: 13990, compare: 15990, out: ['Rosé|20 cm'], desc: 'Fio de pontos brilhantes que acompanha o pulso com leveza.', material: 'Semijoia com banho, zircônia' },
  { id: 'p8', code: 'PUL002', name: 'Pulseira Elos Suaves', catIds: ['pulseiras'], gem: false, isNew: true, unit: 'unidade', groups: [BC], base: 10990, desc: 'Elos arredondados em design contínuo, para usar sozinha ou em pilha.', material: 'Semijoia com banho' },
  { id: 'p9', code: 'PUL003', name: 'Pulseira Pérolas e Ouro', catIds: ['pulseiras'], gem: true, unit: 'unidade', groups: [BC], base: 9490, allOut: true, desc: 'Pérolas alternadas com detalhes dourados.', material: 'Semijoia com banho, pérola sintética' },
  { id: 'p10', code: 'ANE001', name: 'Anel Solitário Brilho', catIds: ['aneis'], gem: true, best: true, unit: 'unidade', groups: [BA, { name: 'Aro', values: ['14', '16', '18'] }], base: 8990, desc: 'Solitário clássico com pedra central em destaque.', material: 'Semijoia com banho, zircônia' },
  { id: 'p11', code: 'ANE002', name: 'Anel Duo Entrelaçado', catIds: ['aneis'], gem: false, isNew: true, unit: 'unidade', groups: [BC, { name: 'Aro', values: ['14', '16', '18'] }], base: 7990, desc: 'Dois fios que se entrelaçam em um desenho contemporâneo.', material: 'Semijoia com banho' },
  { id: 'p12', code: 'ANE003', name: 'Anel Fio de Ouro', catIds: ['aneis'], gem: false, unit: 'unidade', groups: [BB, { name: 'Aro', values: ['14', '16', '18'] }], base: 5990, out: ['Ródio|16'], desc: 'Aro fino e liso, perfeito para empilhar.', material: 'Semijoia com banho' },
  { id: 'p13', code: 'TOR001', name: 'Tornozeleira Maré', catIds: ['tornozeleiras'], gem: false, unit: 'unidade', groups: [BC, { name: 'Comprimento', values: ['22 cm', '25 cm'] }], base: 7490, desc: 'Corrente ondulada e leve para os dias de sol.', material: 'Semijoia com banho' },
  { id: 'p14', code: 'TOR002', name: 'Tornozeleira Coração Dourado', catIds: ['tornozeleiras'], gem: false, isNew: true, unit: 'unidade', groups: [BC], base: 6990, desc: 'Corrente fina com um pequeno coração como detalhe.', material: 'Semijoia com banho' },
  { id: 'p15', code: 'PIE001', name: 'Piercing Argola Segmento', catIds: ['piercings'], gem: false, unit: 'unidade', groups: [BB, { name: 'Diâmetro', values: ['8 mm', '10 mm'] }], base: 4990, desc: 'Argola segmentada com esfera, discreta e moderna.', material: 'Aço com banho' },
  { id: 'p16', code: 'PIE002', name: 'Piercing Pontinho de Luz', catIds: ['piercings'], gem: true, unit: 'unidade', groups: [BB, { name: 'Modelo', values: ['Haste', 'Pressão'] }], base: 3990, out: ['Ródio|Pressão'], desc: 'Pequeno brilho para compor orelhas e destaques.', material: 'Aço com banho, zircônia' },
  { id: 'p17', code: 'KIT001', name: 'Kit Presente Luz', kind: 'kit_stocked', catIds: ['brincos', 'colares'], gem: true, unit: 'conjunto', groups: [BC], base: 24990, compare: 29990, kitStock: 8, short: 'Brincos, colar e anel em embalagem de presente.', desc: 'Conjunto pensado para presentear, com peças que combinam entre si.', material: 'Conjunto de semijoias com banho' },
  { id: 'p18', code: 'KIT002', name: 'Conjunto Aurora', kind: 'kit_composed', catIds: ['brincos', 'colares'], gem: true, unit: 'conjunto', groups: [{ name: 'Banho', values: ['Ouro 18k'] }], base: 19990, comps: [{ ref: 'p1', qty: 1 }, { ref: 'p4', qty: 1 }], short: 'Brinco Gota Aurora + Colar Ponto de Luz.', desc: 'Brincos e colar que se completam, reunidos em um único conjunto.', material: 'Conjunto de semijoias com banho' },
  { id: 'p19', code: 'KIT003', name: 'Conjunto Noite Estrelada', kind: 'kit_composed', catIds: ['brincos', 'pulseiras'], gem: true, unit: 'conjunto', groups: [{ name: 'Banho', values: ['Ouro 18k'] }], base: 18990, comps: [{ ref: 'p3', qty: 1 }, { ref: 'p9', qty: 1 }], short: 'Brinco Pérola Clássica + Pulseira Pérolas e Ouro.', desc: 'Conjunto de pérolas para ocasiões especiais.', material: 'Conjunto de semijoias com banho' },
];

const combos = (groups: VariantGroup[]) =>
  groups.reduce<string[][]>((acc, g) => acc.flatMap((a) => g.values.map((v) => [...a, v])), [[]]);

export const PRODUCTS: DemoProduct[] = RAW.map((r, i) => {
  const add = r.add ?? {};
  let derived: number | null = null;
  let comps: KitComponent[] | null = null;
  if (r.comps) {
    const stock = r.comps.map((c) => STOCK[c.ref] ?? 0);
    comps = r.comps.map((c, ci) => {
      const ref = RAW.find((x) => x.id === c.ref)!;
      return { ref: c.ref, name: ref.name, unit: ref.unit, qty: c.qty, avail: stock[ci] >= c.qty };
    });
    derived = Math.min(...r.comps.map((c, ci) => Math.floor(stock[ci] / c.qty)));
  }
  const variants: Variant[] = combos(r.groups).map((vals) => {
    const key = vals.join('|');
    const extra = vals.reduce((s, v) => s + (add[v] ?? 0), 0);
    let avail = !(r.out ?? []).includes(key) && !r.allOut;
    if (derived !== null) avail = derived > 0;
    return {
      key,
      vals,
      label: vals.join(' · '),
      sku: `AR-${r.code}-${vals.map(skuPart).join('-')}`,
      price: r.base + extra,
      compare: r.compare ? r.compare + extra : null,
      avail,
    };
  });
  return {
    id: r.id,
    slug: slugify(r.name),
    code: r.code,
    name: r.name,
    catIds: r.catIds,
    catNames: r.catIds.map((c) => DEMO_CATEGORIES.find((x) => x.id === c)!.name),
    gem: r.gem,
    isNew: !!r.isNew,
    best: !!r.best,
    unit: r.unit,
    groups: r.groups,
    base: r.base,
    desc: r.desc,
    short: r.short,
    material: r.material,
    kind: r.kind ?? 'simple',
    isKit: !!r.kind,
    kitStock: r.kitStock,
    variants,
    tone: toneOf(variants[0].vals),
    bg: i % 4,
    comps,
  };
});

export const productById: Record<string, DemoProduct> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

