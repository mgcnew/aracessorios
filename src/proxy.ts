import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './lib/database.types';
import { supabaseEnv } from './lib/supabase/env';

/**
 * Renova a sessão do painel antes de cada página de /admin e manda quem não
 * entrou para o login. É só a primeira barreira: a página do painel confere de
 * novo no servidor, e o banco (RLS + is_admin()) é quem protege os dados.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista, headers) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims() valida o token; não troque por getSession(), que confia no cookie sem conferir.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);
  const naTelaDeLogin = request.nextUrl.pathname === '/admin/entrar';

  if (!logado && !naTelaDeLogin) {
    return redirecionar(request, '/admin/entrar', response);
  }
  if (logado && naTelaDeLogin) {
    return redirecionar(request, '/admin', response);
  }
  return response;
}

/** Redireciona sem perder os cookies de sessão que acabaram de ser renovados. */
function redirecionar(request: NextRequest, destino: string, base: NextResponse) {
  const r = NextResponse.redirect(new URL(destino, request.url));
  base.cookies.getAll().forEach((c) => r.cookies.set(c));
  return r;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
