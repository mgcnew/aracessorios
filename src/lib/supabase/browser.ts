'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';
import { supabaseEnv } from './env';

/**
 * Cliente do painel no navegador, com a sessão de quem entrou (lida dos cookies).
 * Usado só para enviar fotos direto ao Storage; o resto passa pelas ações de servidor.
 */
export function supabaseNavegador() {
  const { url, key } = supabaseEnv();
  return createBrowserClient<Database>(url, key);
}
