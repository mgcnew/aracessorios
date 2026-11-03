import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Admin } from '../../admin/Admin';
import { SemAcesso } from '../../admin/SemAcesso';
import { supabaseServidor } from '../../lib/supabase/server';

export const metadata: Metadata = { title: 'Painel' };

// Depende da sessão de quem acessa: nunca gerar como página estática.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await supabaseServidor();
  // getUser() confirma a sessão com o servidor de login; o proxy.ts é só a primeira barreira.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/admin/entrar');

  const { data: admin, error } = await supabase.rpc('is_admin');
  if (error || admin !== true) return <SemAcesso email={auth.user.email ?? null} />;

  return <Admin email={auth.user.email ?? ''} />;
}
