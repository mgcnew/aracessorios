import type { SiteMediaRow, SiteSettingsRow } from '../lib/database-biblioteca.types';

export interface CategoriaConfig {
  slug: string;
  name: string;
}

export interface PaginaConfiguracoes {
  midia: Record<string, SiteMediaRow>;
  empresa: SiteSettingsRow;
  categorias: CategoriaConfig[];
  /** E-mail de quem está logado no painel. */
  email: string;
}

/** Dados da empresa como o formulário envia (texto puro; o servidor limpa e valida). */
export type DadosEmpresa = Omit<SiteSettingsRow, 'id' | 'updated_at'>;

export const apenasDigitos = (t: string) => t.replace(/\D/g, '');

/** "12345678000190" → "12.345.678/0001-90" (quando tem 14 dígitos; senão devolve como está). */
export function formatarCnpj(t: string): string {
  const d = apenasDigitos(t);
  if (d.length !== 14) return t.trim();
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
