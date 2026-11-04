// Tipos e textos do painel de estoque. Pode ser usado no navegador e no servidor.

import type { Database } from '../lib/database.types';

export type LinhaEstoque = Database['public']['Functions']['painel_estoque']['Returns'][number];
export type TipoMovimento = Database['public']['Enums']['movement_type'];

export interface FiltroEstoque {
  pagina: number;
  busca: string;
  soBaixo: boolean;
  verArquivados: boolean;
  /** Variações ocultas da loja ficam fora da lista até a pessoa pedir para ver. */
  verInativas: boolean;
}

export interface PaginaEstoque {
  linhas: LinhaEstoque[];
  /** Total de linhas com os filtros atuais (para as páginas). */
  total: number;
  /** Quantas, com a busca atual, estão no mínimo ou esgotadas. */
  baixo: number;
  /** Variações de produtos arquivados (escondidas por padrão). */
  arquivadas: number;
  arquivados: string[];
  /** Ids das variações ocultas da loja (inativas); a linha ganha a marca "inativa". */
  inativas: string[];
}

/** Movimentações que o painel pode registrar à mão (CAT-DEC-012/021). */
export type Operacao = 'entrada' | 'ajuste' | 'contagem';

export interface Movimento {
  id: number;
  created_at: string;
  type: TipoMovimento;
  on_hand_delta: number;
  reserved_delta: number;
  on_hand_after: number;
  reason: string;
}

export const NOME_TIPO: Record<TipoMovimento, string> = {
  entrada: 'Entrada',
  ajuste: 'Ajuste',
  contagem: 'Contagem',
  reserva: 'Reserva',
  liberacao: 'Liberação',
  baixa: 'Baixa (venda)',
  reposicao: 'Reposição',
};

export const OPERACOES: { op: Operacao; nome: string; campo: string; ajuda: string }[] = [
  { op: 'entrada', nome: 'Entrada', campo: 'Quantidade recebida', ajuda: 'Mercadoria que chegou. Soma ao saldo.' },
  { op: 'ajuste', nome: 'Ajuste', campo: 'Quantidade', ajuda: 'Avaria, perda ou correção. Ex.: tirar 1 por uma peça quebrada.' },
  { op: 'contagem', nome: 'Contagem', campo: 'Quantidade contada', ajuda: 'Contou na prateleira? O saldo passa a ser o número contado.' },
];

/** Atributos da variação em texto: "Ródio · G". */
export function descreverVariacao(attributes: unknown): string {
  if (!attributes || typeof attributes !== 'object') return '';
  const ordem = ['banho', 'tamanho', 'material', 'cor', 'modelo'];
  const a = attributes as Record<string, unknown>;
  const chaves = [...ordem.filter((k) => k in a), ...Object.keys(a).filter((k) => !ordem.includes(k))];
  return chaves
    .map((k) => a[k])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' · ');
}

export const ehKitComposto = (l: LinhaEstoque) => l.product_kind === 'kit_composto';

/** Saldo que ficaria depois da operação (só para a prévia; quem decide é o banco). */
export function saldoDepois(op: Operacao, atual: number, valor: number): number {
  if (op === 'entrada') return atual + valor;
  if (op === 'ajuste') return atual + valor;
  return valor;
}

/** Valida o número digitado antes de mandar ao banco (o banco valida de novo). */
export function validarValor(op: Operacao, texto: string): { valor: number } | { erro: string } {
  const limpo = texto.trim().replace('−', '-');
  if (!/^[-+]?\d+$/.test(limpo)) return { erro: 'Digite um número inteiro.' };
  const valor = Number(limpo);
  if (!Number.isSafeInteger(valor) || Math.abs(valor) > 100000) return { erro: 'Número fora do limite.' };
  if (op === 'entrada' && valor <= 0) return { erro: 'A entrada precisa ser maior que zero.' };
  if (op === 'ajuste' && valor === 0) return { erro: 'O ajuste precisa somar ou tirar ao menos uma unidade.' };
  if (op === 'contagem' && valor < 0) return { erro: 'A contagem não pode ser negativa.' };
  return { valor };
}
