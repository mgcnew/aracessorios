import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Admin, type CargaInicial } from '../../admin/Admin';
import { SemAcesso } from '../../admin/SemAcesso';
import { carregarEstoquePagina } from './estoque-acoes';
import { carregarProduto, carregarProdutosPagina } from './produtos-acoes';
import { supabaseServidor } from '../../lib/supabase/server';

export const metadata: Metadata = { title: 'Painel' };

// Depende da sessão de quem acessa: nunca gerar como página estática.
export const dynamic = 'force-dynamic';

const FILTRO = { pagina: 1, busca: '', soBaixo: false, verArquivados: false };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ aba?: string; produto?: string }> }) {
  const supabase = await supabaseServidor();
  // getUser() confirma a sessão com o servidor de login; o proxy.ts é só a primeira barreira.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/admin/entrar');

  const { data: admin, error } = await supabase.rpc('is_admin');
  if (error || admin !== true) return <SemAcesso email={auth.user.email ?? null} />;

  // Carrega só a primeira página da aba aberta; as outras abas buscam quando forem abertas.
  const { aba, produto } = await searchParams;
  const [baixo, estoque, produtos, um] = await Promise.all([
    !aba || aba === 'visao' ? carregarEstoquePagina({ ...FILTRO, soBaixo: true }) : null,
    aba === 'estoque' ? carregarEstoquePagina(FILTRO) : null,
    aba === 'produtos' ? carregarProdutosPagina({ pagina: 1, busca: '', status: 'todos' }) : null,
    aba === 'produtos' && produto ? carregarProduto(produto) : null,
  ]);
  const erro = [baixo, estoque, produtos, um].find((r) => r && !r.ok);
  const carga: CargaInicial = {
    aba: aba ?? 'visao',
    produtoAberto: aba === 'produtos' ? (produto ?? '') : '',
    baixo: baixo?.ok ? baixo.dados : null,
    estoque: estoque?.ok ? estoque.dados : null,
    produtos: produtos?.ok ? produtos.dados : null,
    produto: um?.ok ? um.dados : null,
    erro: erro && !erro.ok ? erro.erro : null,
  };
  return <Admin email={auth.user.email ?? ''} carga={carga} />;
}
