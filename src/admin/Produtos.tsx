'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { criarProduto, type Resultado } from '../app/admin/produtos-acoes';
import { SearchIcon } from '../components/Icons';
import { fmt, norm } from '../data/catalog';
import { ProdutoEditor } from './ProdutoEditor';
import {
  AJUDA_TIPO,
  NOME_STATUS,
  NOME_TIPO,
  NOME_UNIDADE,
  TAG_STATUS,
  sugerirSlug,
  type CatalogoPainel,
  type StatusProduto,
  type TipoProduto,
  type UnidadeVenda,
} from './produtos';

type Filtro = StatusProduto | 'todos';
const FILTROS: { f: Filtro; nome: string }[] = [
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
  catalogo,
  erroCarga,
  aoMudar,
}: {
  catalogo: CatalogoPainel;
  erroCarga: string | null;
  aoMudar: (c: CatalogoPainel) => void;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const produto = aberto ? catalogo.produtos.find((p) => p.id === aberto) : undefined;
  if (produto) {
    return <ProdutoEditor produto={produto} catalogo={catalogo} voltar={() => setAberto(null)} aoMudar={aoMudar} />;
  }

  const nomeCat = new Map(catalogo.categorias.map((c) => [c.id, c.name]));
  const nq = norm(busca.trim());
  const linhas = catalogo.produtos.filter(
    (p) =>
      (filtro === 'todos' || p.status === filtro) &&
      (!nq || norm(`${p.name} ${p.slug} ${p.variacoes.map((v) => v.sku).join(' ')}`).includes(nq)),
  );
  const conta = (f: Filtro) => (f === 'todos' ? catalogo.produtos.length : catalogo.produtos.filter((p) => p.status === f).length);

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

      {erroCarga && (
        <p className="auth-err" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível carregar os produtos: {erroCarga}
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
        {FILTROS.map(({ f, nome }) => (
          <button key={f} className={`pill${filtro === f ? ' on' : ''}`} aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {nome} ({conta(f)})
          </button>
        ))}
      </div>

      <section className="card">
        <div className="tw">
          <table>
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
                    <td>
                      <strong style={{ fontWeight: 500 }}>{p.name}</strong>
                      <div className="sku">
                        {NOME_TIPO[p.kind]} · /{p.slug}
                        {p.is_new && ' · Novo'}
                        {p.is_featured && ' · Destaque'}
                      </div>
                    </td>
                    <td>{p.categorias.map((c) => nomeCat.get(c)).filter(Boolean).join(', ') || <span className="note">—</span>}</td>
                    <td className="num">
                      {ativas.length}
                      {ativas.length !== p.variacoes.length && <span className="note"> de {p.variacoes.length}</span>}
                    </td>
                    <td className="num">{menor === null ? '—' : fmt(menor)}</td>
                    <td>
                      <span className={`tag ${TAG_STATUS[p.status]}`}>{NOME_STATUS[p.status]}</span>
                    </td>
                    <td>
                      <button className="pill" onClick={() => setAberto(p.id)} aria-label={`Editar ${p.name}`}>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="sub">
                    {catalogo.produtos.length === 0 ? 'Nenhum produto cadastrado.' : 'Nada encontrado com esse filtro.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {novo && (
        <NovoProdutoDialog
          fechar={() => setNovo(false)}
          criado={(c, id) => {
            aoMudar(c);
            setNovo(false);
            setAberto(id);
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
          <select className="auth-i" value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeVenda)}>
            {(Object.keys(NOME_UNIDADE) as UnidadeVenda[]).map((u) => (
              <option key={u} value={u}>
                {NOME_UNIDADE[u]}
              </option>
            ))}
          </select>
        </label>
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        <button className="btn auth-btn" type="submit" disabled={pendente}>
          {pendente ? 'Criando…' : 'Criar rascunho'}
        </button>
      </form>
    </dialog>
  );
}
