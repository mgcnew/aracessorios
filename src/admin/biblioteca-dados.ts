import type { MidiaRow } from '../lib/database-biblioteca.types';
export interface MidiaPainel extends MidiaRow { produtos: { id: string; name: string }[] }
export interface PaginaBiblioteca { fotos: MidiaPainel[]; total: number }
export const FOTOS_POR_PAGINA = 20;
