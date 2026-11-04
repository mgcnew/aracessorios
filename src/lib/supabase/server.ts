import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { DatabaseComBiblioteca } from '../database-biblioteca.types';
import { supabaseEnv } from './env';

/**
 * Cliente do painel no servidor: lê e grava a sessão nos cookies.
 * Crie um por requisição; nunca compartilhe entre requisições.
 */
export async function supabaseServidor() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient<DatabaseComBiblioteca>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um componente de servidor, onde não se gravam cookies.
          // Sem problema: o proxy.ts renova a sessão a cada requisição do painel.
        }
      },
    },
  });
}
