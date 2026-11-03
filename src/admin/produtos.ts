// Cadastro de produtos no painel: tipos, conversões e validações.
// Pode ser usado no navegador e no servidor. O banco valida tudo de novo.

import type { Database } from '../lib/database.types';

type Enums = Database['public']['Enums'];
export type StatusProduto = Enums['product_status'];
export type TipoProduto = Enums['product_kind'];
export type UnidadeVenda = Enums['sale_unit'];

export interface CategoriaPainel {
  id: string;
  name: string;
}

export interface PecaKit {
  component_variant_id: string;
  quantity: number;
}

export interface VariacaoPainel {
  id: string;
  sku: string;
  attributes: Atributos;
  price_cents: number;
  promo_price_cents: number | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  /** Vem de painel_estoque(): a coluna não é lida direto da tabela. */
  min_stock: number;
  position: number;
  active: boolean;
  pecas: PecaKit[];
}

export interface FotoPainel {
  id: string;
  storage_path: string;
  alt: string;
  position: number;
  is_cover: boolean;
}

export interface ProdutoPainel {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  material: string;
  care_info: string;
  status: StatusProduto;
  kind: TipoProduto;
  sale_unit: UnidadeVenda;
  is_new: boolean;
  is_featured: boolean;
  categorias: string[];
  variacoes: VariacaoPainel[];
  /** Capa primeiro, depois a ordem cadastrada. */
  fotos: FotoPainel[];
}

export interface CatalogoPainel {
  categorias: CategoriaPainel[];
  produtos: ProdutoPainel[];
  /** Algo deu certo só em parte (ex.: arquivo de foto que ficou no armazenamento). */
  aviso?: string;
}

// Atributos da variação (D-011, CAT-DEC-022) ----------------------------------
export const ATRIBUTOS = [
  { chave: 'banho', nome: 'Banho' },
  { chave: 'tamanho', nome: 'Tamanho' },
  { chave: 'material', nome: 'Material' },
  { chave: 'cor', nome: 'Cor' },
  { chave: 'modelo', nome: 'Modelo' },
] as const;
export type ChaveAtributo = (typeof ATRIBUTOS)[number]['chave'];
export type Atributos = Partial<Record<ChaveAtributo, string>>;

export function limparAtributos(a: Record<string, unknown> | null | undefined): Atributos {
  const out: Atributos = {};
  for (const { chave } of ATRIBUTOS) {
    const v = a?.[chave];
    if (typeof v === 'string' && v.trim()) out[chave] = v.trim();
  }
  return out;
}

export const textoAtributos = (a: Atributos) =>
  ATRIBUTOS.map(({ chave }) => a[chave])
    .filter(Boolean)
    .join(' · ') || 'Única';

// Rótulos ----------------------------------------------------------------------
export const NOME_STATUS: Record<StatusProduto, string> = { rascunho: 'Rascunho', ativo: 'Ativo', arquivado: 'Arquivado' };
export const TAG_STATUS: Record<StatusProduto, string> = { rascunho: 't-warn', ativo: 't-ok', arquivado: 't-bad' };
export const NOME_TIPO: Record<TipoProduto, string> = {
  simples: 'Simples',
  kit_estoque_proprio: 'Kit com estoque próprio',
  kit_composto: 'Kit composto',
};
export const AJUDA_TIPO: Record<TipoProduto, string> = {
  simples: 'Uma peça (ou um par) com estoque próprio.',
  kit_estoque_proprio: 'Kit montado e guardado pronto; tem estoque próprio e não mexe nas peças.',
  kit_composto: 'Kit montado na hora a partir de outras peças; a disponibilidade vem do estoque delas.',
};
export const NOME_UNIDADE: Record<UnidadeVenda, string> = { unidade: 'Unidade', par: 'Par', conjunto: 'Conjunto' };

// Texto → valores ----------------------------------------------------------------
/** "Brinco Gota Aurora" → "brinco-gota-aurora". */
export function sugerirSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const SLUG_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SKU_OK = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;

/** "89,90" ou "89.90" ou "89" → 8990. Devolve null se não for um preço válido. */
export function reaisParaCentavos(texto: string): number | null {
  const t = texto.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (!t) return null;
  // Aceita "1.234,56", "1234,56", "1234.56", "1234".
  const normal = /,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null;
  const c = Math.round(Number(normal) * 100);
  return Number.isSafeInteger(c) && c > 0 ? c : null;
}

export const centavosParaReais = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));

// Datas da promoção: o painel trabalha com dias; o banco guarda instantes.
// Brasília sem horário de verão: -03:00 fixo.
export const inicioDoDia = (dia: string) => `${dia}T00:00:00-03:00`;
export const fimDoDia = (dia: string) => `${dia}T23:59:59-03:00`;
const diaSP = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
/** Instante do banco → "aaaa-mm-dd" no horário de Brasília (para o campo de data). */
export const paraDia = (iso: string | null) => (iso ? diaSP.format(new Date(iso)) : '');
const diaBR = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' });
export const diaCurto = (iso: string) => diaBR.format(new Date(iso));

// Formulário da variação --------------------------------------------------------
export interface FormVariacao {
  id: string | null;
  sku: string;
  attributes: Atributos;
  preco: string;
  promoPreco: string;
  promoInicio: string; // aaaa-mm-dd
  promoFim: string;
  minimo: string;
  active: boolean;
}

export type VariacaoGravar = Omit<VariacaoPainel, 'id' | 'pecas' | 'position'> & { id: string | null };

export function formDaVariacao(v: VariacaoPainel | null): FormVariacao {
  return {
    id: v?.id ?? null,
    sku: v?.sku ?? '',
    attributes: v ? { ...v.attributes } : {},
    preco: centavosParaReais(v?.price_cents ?? null),
    promoPreco: centavosParaReais(v?.promo_price_cents ?? null),
    promoInicio: paraDia(v?.promo_starts_at ?? null),
    promoFim: paraDia(v?.promo_ends_at ?? null),
    minimo: String(v?.min_stock ?? 0),
    active: v?.active ?? true,
  };
}

export function validarVariacao(f: FormVariacao): { erro: string } | { dados: VariacaoGravar } {
  const sku = f.sku.trim().toUpperCase();
  if (!SKU_OK.test(sku)) return { erro: 'SKU: use só letras maiúsculas, números e hífen (ex.: AR-BRC010-OURO-P).' };
  const price = reaisParaCentavos(f.preco);
  if (price === null) return { erro: 'Preço inválido. Ex.: 89,90' };
  if (!/^\d+$/.test(f.minimo.trim())) return { erro: 'Estoque mínimo: número inteiro, 0 ou mais.' };

  const temPromo = Boolean(f.promoPreco.trim() || f.promoInicio || f.promoFim);
  let promo: Pick<VariacaoGravar, 'promo_price_cents' | 'promo_starts_at' | 'promo_ends_at'> = {
    promo_price_cents: null,
    promo_starts_at: null,
    promo_ends_at: null,
  };
  if (temPromo) {
    const pp = reaisParaCentavos(f.promoPreco);
    if (pp === null) return { erro: 'Preço promocional inválido.' };
    if (pp >= price) return { erro: 'O preço promocional precisa ser menor que o preço normal.' };
    if (!f.promoInicio || !f.promoFim) return { erro: 'Promoção precisa de data de início e de fim.' };
    if (f.promoFim < f.promoInicio) return { erro: 'A promoção termina antes de começar.' };
    promo = { promo_price_cents: pp, promo_starts_at: inicioDoDia(f.promoInicio), promo_ends_at: fimDoDia(f.promoFim) };
  }

  return {
    dados: {
      id: f.id,
      sku,
      attributes: limparAtributos(f.attributes),
      price_cents: price,
      ...promo,
      min_stock: Number(f.minimo.trim()),
      active: f.active,
    },
  };
}

/** O que falta para um produto poder ficar ativo (aparecer na vitrine). */
export function pendenciasParaAtivar(p: ProdutoPainel): string[] {
  const falta: string[] = [];
  const ativas = p.variacoes.filter((v) => v.active);
  if (ativas.length === 0) falta.push('Cadastre ao menos uma variação ativa.');
  if (p.kind === 'kit_composto') {
    const semPecas = ativas.filter((v) => v.pecas.length === 0);
    if (semPecas.length) falta.push(`Informe as peças do kit em: ${semPecas.map((v) => v.sku).join(', ')}.`);
  }
  return falta;
}

// Erros do banco → português ------------------------------------------------------
export function mensagemDoBanco(erro: { code?: string; message: string; details?: string | null }): string {
  const m = `${erro.message} ${erro.details ?? ''}`;
  switch (erro.code) {
    case '23505':
      if (m.includes('products_slug_key')) return 'Já existe um produto com esse endereço (slug). Escolha outro.';
      if (m.includes('product_variants_sku_key')) return 'Esse SKU já está em uso em outra variação.';
      if (m.includes('product_variants_combinacao_unica')) return 'Já existe uma variação com esses mesmos atributos neste produto.';
      return 'Já existe um cadastro igual.';
    case '23514':
      if (m.includes('product_variants_promo_valida')) return 'Promoção inválida: preço menor que o normal e datas de início e fim.';
      if (m.includes('slug')) return 'Endereço (slug) inválido: só letras minúsculas, números e hífen.';
      if (m.includes('sku')) return 'SKU inválido: só letras maiúsculas, números e hífen.';
      if (m.includes('attributes')) return 'Atributo não permitido. Use banho, tamanho, material, cor ou modelo.';
      return erro.message; // as mensagens das regras do banco já vêm em português
    case '23503':
      return 'Não dá para apagar: esta variação já tem histórico de estoque ou é peça de um kit. Desative-a em vez de apagar.';
    case '42501':
      return 'Acesso restrito ao painel. Entre de novo com a conta da loja.';
    case 'PGRST116': // nenhuma linha: não existe ou a regra de acesso escondeu
      return 'Não encontrado, ou sem permissão. Recarregue a página e entre de novo com a conta da loja, se preciso.';
    case 'PGRST301':
      return 'Sua sessão expirou. Entre de novo.';
    default:
      return erro.message;
  }
}
