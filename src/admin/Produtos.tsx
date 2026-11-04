'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { carregarProduto, carregarProdutosPagina, criarProduto, type Resultado } from '../app/admin/produtos-acoes';
import { SearchIcon } from '../components/Icons';
import { Selecao } from '../components/Selecao';
import { fmt } from '../data/catalog';
import { Paginacao } from './Paginacao';
import { FiltroOpcoes } from './FiltroOpcoes';
import { ProdutoEditor } from './ProdutoEditor';
import { useParamUrl } from './url';
import {
  AJUDA_TIPO,
  NOME_STATUS,
  NOME_TIPO,
  OPCOES_UNIDADE,
  TAG_STATUS,
  sugerirSlug,
  type CatalogoPainel,
  type CategoriaPainel,
  type FiltroStatus,
  type PaginaProdutos,
  type ProdutoPainel,
  type TipoProduto,
  type UnidadeVenda,
} from './produtos';

const FILTROS: { f: FiltroStatus; nome: string }[] = [
  { f: 'todos', nome: 'Todos' },
  { f: 'ativo', nome: 'Ativos' },
  { f: 'rascunho', nome: 'Rascunhos' },
  { f: 'arquivado', nome: 'Arquivados' },
];

/** Roda uma ação de servidor, trava o botão enquanto isso e guarda o erro. */
export function useAcao() {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  function rodar<T>(acao: () => Promise<Resultado<T>>, ok: (dados: T) => void, mensagem?: string) {
    setErro(null);
    setFeito(null);
    iniciar(async () => {
      const r = await acao();
      if (!r.ok) return setErro(r.erro);
      ok(r.dados);
      if (mensagem) setFeito(mensagem);
    });
  }
  return { pendente, erro, feito, rodar, setErro };
}

export function Produtos({
  inicial,
  produtoInicial,
  abertoInicial,
  erroCarga,
}: {
  inicial: PaginaProdutos | null;
  produtoInicial: ProdutoPainel | null;
  abertoInicial: string;
  erroCarga: string | null;
}) {
  // Produto aberto fica no endereço (?produto=…): o "voltar" do celular volta para a lista.
  const [aberto, setAbertoUrl] = useParamUrl('produto', '', abertoInicial);
  const abriuAqui = useRef(false);
  const abrir = (id: string) => {
    abriuAqui.current = true;
    setAbertoUrl(id);
    window.scrollTo({ top: 0 });
  };
  const fecharEditor = () => {
    // Se foi aberto daqui, volta no histórico (o "voltar" do aparelho não reabre o editor).
    if (abriuAqui.current) window.history.back();
    else setAbertoUrl('');
    abriuAqui.current = false;
  };
  const [novo, setNovo] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<{ pagina: number; busca: string; status: FiltroStatus }>({ pagina: 1, busca: '', status: 'todos' });
  const [dados, setDados] = useState<PaginaProdutos | null>(inicial);
  const [erro, setErro] = useState<string | null>(erroCarga);
  const [carregando, iniciar] = useTransition();
  // Produtos abertos no editor (podem não estar na página atual da lista).
  const [abertos, setAbertos] = useState<Record<string, ProdutoPainel | null>>(produtoInicial ? { [produtoInicial.id]: produtoInicial } : {});
  const [categorias, setCategorias] = useState<CategoriaPainel[]>(inicial?.categorias ?? []);

  // Uma página por vez, do banco. A primeira já vem do servidor quando se abre a aba pelo endereço.
  const jaTem = useRef(inicial !== null);
  const carregar = useCallback((f: typeof filtro) => {
    iniciar(async () => {
      const r = await carregarProdutosPagina(f);
      if (r.ok) {
        setDados(r.dados);
        setCategorias(r.dados.categorias);
        setErro(null);
      } else setErro(r.erro);
    });
  }, []);
  useEffect(() => {
    if (jaTem.current) {
      jaTem.current = false;
      return;
    }
    carregar(filtro);
  }, [filtro, carregar]);
  useEffect(() => {
    const t = setTimeout(() => setFiltro((f) => (f.busca === busca ? f : { ...f, busca, pagina: 1 })), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const produto = aberto ? (aberto in abertos ? abertos[aberto] : dados?.produtos.find((p) => p.id === aberto)) : undefined;
  // Abriu pelo endereço um produto fora da página atual: busca só ele.
  useEffect(() => {
    if (!aberto || produto !== undefined) return;
    let vivo = true;
    carregarProduto(aberto).then((r) => vivo && r.ok && setAbertos((a) => ({ ...a, [aberto]: r.dados })));
    return () => {
      vivo = false;
    };
  }, [aberto, produto]);

  // Resposta de uma ação: troca só o produto que mudou e atualiza a lista em segundo plano.
  const aoMudar = (c: CatalogoPainel) => {
    if (c.categorias.length) setCategorias(c.categorias);
    setAbertos((a) => {
      const n = { ...a };
      for (const p of c.produtos) n[p.id] = p;
      if (c.removido) delete n[c.removido];
      return n;
    });
    setDados((d) => d && { ...d, produtos: d.produtos.map((p) => c.produtos.find((x) => x.id === p.id) ?? p) });
    carregar(filtro);
  };

  if (aberto) {
    if (produto) return <ProdutoEditor produto={produto} categorias={categorias} voltar={fecharEditor} aoMudar={aoMudar} />;
    return (
      <div className="top">
        <button className="sl" onClick={fecharEditor} style={{ marginBottom: 14 }}>
          Todos os produtos
        </button>
        <p className="sub">{produto === null ? 'Produto não encontrado.' : 'Carregando produto…'}</p>
      </div>
    );
  }

  const nomeCat = new Map(categorias.map((c) => [c.id, c.name]));
  const linhas = dados?.produtos ?? [];
  const conta = (f: FiltroStatus) => dados?.contagem[f] ?? 0;

  return (
    <>
      <div className="top top-acao">
        <div>
          <h1 className="h1">Produtos</h1>
          <p className="sub">Cadastro da vitrine. Produto novo nasce como rascunho e só aparece na loja quando você ativar.</p>
        </div>
        <button className="btn auth-btn" onClick={() => setNovo(true)}>
          Novo produto
        </button>
      </div>

      {erro && (
        <p className="auth-err" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível carregar os produtos: {erro}
        </p>
      )}

      <div className="bar">
        <label className="fld">
          <SearchIcon />
          <input
            type="search"
            placeholder="Buscar produto ou SKU"
            aria-label="Buscar produto ou SKU"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <FiltroOpcoes
          rotulo="Filtrar por status"
          valor={filtro.status}
          opcoes={FILTROS.map(({ f, nome }) => ({ value: f, label: `${nome} (${conta(f)})` }))}
          onChange={(status) => setFiltro((x) => ({ ...x, status, pagina: 1 }))}
        />
      </div>

      <section className="card">
        <div className={`tw${carregando ? ' carregando' : ''}`} aria-busy={carregando}>
          <table className="cartoes toque">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categorias</th>
                <th className="num">Variações</th>
                <th className="num">A partir de</th>
                <th>Status</th>
                <th>
                  <span className="sr">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((p) => {
                const ativas = p.variacoes.filter((v) => v.active);
                const menor = ativas.length ? Math.min(...ativas.map((v) => v.price_cents)) : null;
                return (
                  <tr key={p.id}>
                    <td className="c-tit">
                      <strong style={{ fontWeight: 500 }}>{p.name}</strong>
                      <div className="sku">
                        {NOME_TIPO[p.kind]} · /{p.slug}
                        {p.is_new && ' · Novo'}
                        {p.is_featured && ' · Destaque'}
                      </div>
                    </td>
                    <td className="c-dado c-largo" data-label="Categorias">{p.categorias.map((c) => nomeCat.get(c)).filter(Boolean).join(', ') || <span className="note">—</span>}</td>
                    <td className="num c-dado" data-label="Variações">
                      {ativas.length}
                      {ativas.length !== p.variacoes.length && <span className="note"> de {p.variacoes.length}</span>}
                    </td>
                    <td className="num c-dado" data-label="A partir de">{menor === null ? '—' : fmt(menor)}</td>
                    <td className="c-sit">
                      <span className={`tag ${TAG_STATUS[p.status]}`}>{NOME_STATUS[p.status]}</span>
                    </td>
                    <td className="c-acao">
                      <button className="pill" onClick={() => abrir(p.id)} aria-label={`Editar ${p.name}`}>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {dados && linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="sub">
                    {conta('todos') === 0 ? 'Nenhum produto cadastrado.' : 'Nada encontrado com esse filtro.'}
                  </td>
                </tr>
              )}
              {!dados && !erro && (
                <tr>
                  <td colSpan={6} className="sub">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao pagina={filtro.pagina} total={dados?.total ?? 0} ir={(pagina) => setFiltro((f) => ({ ...f, pagina }))} carregando={carregando} rotulo="produtos" />
      </section>

      {novo && (
        <NovoProdutoDialog
          fechar={() => setNovo(false)}
          criado={(c, id) => {
            aoMudar(c);
            setNovo(false);
            abrir(id);
          }}
        />
      )}
    </>
  );
}

function NovoProdutoDialog({ fechar, criado }: { fechar: () => void; criado: (c: CatalogoPainel, id: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugMexido, setSlugMexido] = useState(false);
  const [kind, setKind] = useState<TipoProduto>('simples');
  const [unidade, setUnidade] = useState<UnidadeVenda>('unidade');
  const { pendente, erro, rodar } = useAcao();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog ref={ref} className="dlg" onClose={fechar} aria-labelledby="novo-t">
      <div className="dlg-h">
        <h2 id="novo-t">Novo produto</h2>
        <button className="pill" onClick={() => ref.current?.close()}>
          Fechar
        </button>
      </div>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          rodar(
            () => criarProduto({ name, slug, kind, sale_unit: unidade }),
            (d) => criado(d, d.extra),
          );
        }}
      >
        <label className="auth-l">
          Nome
          <input
            className="auth-i"
            value={name}
            maxLength={120}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugMexido) setSlug(sugerirSlug(e.target.value));
            }}
            required
          />
        </label>
        <label className="auth-l">
          Endereço na loja
          <span className="pre-i">
            <span>/produto/</span>
            <input
              className="auth-i"
              value={slug}
              maxLength={80}
              onChange={(e) => {
                setSlugMexido(true);
                setSlug(e.target.value.toLowerCase());
              }}
              required
            />
          </span>
        </label>
        <fieldset className="opcoes">
          <legend>Tipo</legend>
          {(Object.keys(NOME_TIPO) as TipoProduto[]).map((k) => (
            <label key={k} className="opcao">
              <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
              <span>
                <strong>{NOME_TIPO[k]}</strong>
                <small>{AJUDA_TIPO[k]}</small>
              </span>
            </label>
          ))}
          <p className="note">O tipo não pode ser trocado depois que o produto tiver variações.</p>
        </fieldset>
        <label className="auth-l">
          Vendido por
          <Selecao className="auth-i" value={unidade} opcoes={OPCOES_UNIDADE} onChange={setUnidade} />
        </label>
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        <div className="dlg-acoes">
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Criando…' : 'Criar rascunho'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
