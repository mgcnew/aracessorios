import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

/**
 * Cliente da vitrine: usa só a chave pública e não guarda sessão.
 * Enxerga apenas o que as regras de acesso (RLS) liberam para o visitante.
 */
export function supabasePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veja .env.example).');
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
