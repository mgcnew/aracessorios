import type { DespesaFixaRow, LancamentoRow } from '../lib/database-biblioteca.types';

/** Categorias oferecidas nos menus. O banco aceita qualquer texto curto; a lista só orienta. */
export const CATEGORIAS_ENTRADA = [
  { value: 'venda', label: 'Venda' },
  { value: 'outros', label: 'Outros' },
] as const;
export const CATEGORIAS_SAIDA = [
  { value: 'fornecedor', label: 'Fornecedor e mercadoria' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'contas', label: 'Água, luz e internet' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'frete', label: 'Frete' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'impostos', label: 'Impostos e taxas' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'outros', label: 'Outros' },
] as const;

export const nomeCategoria = (c: string) =>
  [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA].find((x) => x.value === c)?.label ?? c;

export type FiltroTipo = 'todos' | 'entrada' | 'saida';

export interface FiltroFinanceiro {
  /** Mês mostrado, "AAAA-MM". */
  mes: string;
  tipo: FiltroTipo;
  pagina: number;
}

export interface DespesaPendente {
  fixa: DespesaFixaRow;
  /** Vencimento neste mês (AAAA-MM-DD); em mês curto, o último dia. */
  vence: string;
  atrasada: boolean;
}

export interface PaginaFinanceiro {
  mes: string;
  entradas: number;
  saidas: number;
  /** Soma das despesas fixas do mês ainda não pagas. */
  aPagar: number;
  pendentes: DespesaPendente[];
  lancamentos: LancamentoRow[];
  total: number;
  /** Todas as despesas fixas cadastradas (ativas e pausadas), para a janela de gerenciar. */
  fixas: DespesaFixaRow[];
}

export const mesAtual = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
export const hoje = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

export const mesValido = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);

export function somarMes(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const ultimoDia = (mes: string): number => {
  const [a, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
};

export function nomeMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  const t = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, 1)));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "AAAA-MM-DD" → "05/11". */
export const diaMes = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Texto digitado ("1.234,56", "89,9", "R$ 50") em centavos; null se não for um valor válido (> 0). */
export function reaisParaCentavos(texto: string): number | null {
  const t = texto.replace(/R\$|\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$|^\d+\.\d{1,2}$/.test(t)) return null;
  const n = t.includes(',') ? Number(t.replace(/\./g, '').replace(',', '.')) : /^\d{1,3}(\.\d{3})+$/.test(t) ? Number(t.replace(/\./g, '')) : Number(t);
  const c = Math.round(n * 100);
  return c > 0 && c <= 100_000_000 ? c : null;
}

export const centavosParaTexto = (c: number) => (c / 100).toFixed(2).replace('.', ',');
