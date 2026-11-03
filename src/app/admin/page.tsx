import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Admin } from '../../admin/Admin';
import { SemAcesso } from '../../admin/SemAcesso';
import { carregarEstoque } from './estoque-acoes';
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

  const estoque = await carregarEstoque();
  return (
    <Admin
      email={auth.user.email ?? ''}
      estoque={estoque.ok ? estoque.dados : []}
      erroEstoque={estoque.ok ? null : estoque.erro}
    />
  );
}
