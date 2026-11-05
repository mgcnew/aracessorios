import { createClient } from '@supabase/supabase-js';
import type { DatabaseComBiblioteca } from '../database-biblioteca.types';
import { supabaseEnv } from './env';

/**
 * Cliente da vitrine: usa só a chave pública e não guarda sessão.
 * Enxerga apenas o que as regras de acesso (RLS) liberam para o visitante.
 */
export function supabasePublico() {
  const { url, key } = supabaseEnv();
  return createClient<DatabaseComBiblioteca>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
