'use server';

import { redirect } from 'next/navigation';
import { supabaseServidor } from '../../lib/supabase/server';

export type EstadoEntrar = { erro: string | null; email: string };

export async function entrar(_anterior: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  const email = String(form.get('email') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  if (!email || !senha) return { erro: 'Preencha o e-mail e a senha.', email };

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    // Mensagem única para não revelar se o e-mail existe.
    const erro =
      error.status === 429
        ? 'Muitas tentativas. Espere alguns minutos e tente de novo.'
        : error.status === 400
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar agora. Tente de novo em instantes.';
    return { erro, email };
  }
  redirect('/admin');
}

export async function sair() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect('/admin/entrar');
}
