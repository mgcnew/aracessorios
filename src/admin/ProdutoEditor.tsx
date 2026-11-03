'use client';

import { useEffect, useRef, useState } from 'react';
import {
  apagarProduto,
  apagarVariacao,
  mudarStatus,
  salvarCategorias,
  salvarDadosProduto,
  salvarPecas,
  salvarVariacao,
  type DadosProduto,
} from '../app/admin/produtos-acoes';
import { fmt } from '../data/catalog';
import { useAcao } from './Produtos';
import {
  ATRIBUTOS,
  NOME_STATUS,
  NOME_TIPO,
  NOME_UNIDADE,
  SLUG_OK,
  TAG_STATUS,
  diaCurto,
  formDaVariacao,
  pendenciasParaAtivar,
  textoAtributos,
  type CatalogoPainel,
  type FormVariacao,
  type PecaKit,
  type ProdutoPainel,
  type StatusProduto,
  type UnidadeVenda,
  type VariacaoPainel,
} from './produtos';

type AoMudar = (c: CatalogoPainel) => void;

function Avisos({ erro, feito }: { erro: string | null; feito: string | null }) {
  return (
    <>
      {erro && (
        <p className="auth-err" role="alert">
          {erro}
        </p>
      )}
      {feito && (
        <p className="ok-msg" role="status">
          {feito}
        </p>
      )}
    </>
  );
}

export function ProdutoEditor({
  produto: p,
  catalogo,
  voltar,
  aoMudar,
}: {
  produto: ProdutoPainel;
  catalogo: CatalogoPainel;
  voltar: () => void;
  aoMudar: AoMudar;
}) {
  const [variacao, setVariacao] = useState<VariacaoPainel | 'nova' | null>(null);
  const aberta = variacao === 'nova' ? null : variacao ? (p.variacoes.find((v) => v.id === variacao.id) ?? null) : null;

  return (
    <>
      <div className="top">
        <button className="sl" onClick={voltar} style={{ marginBottom: 14 }}>
          ← Todos os produtos
        </button>
        <h1 className="h1">{p.name}</h1>
        <p className="sub">
          <span className={`tag ${TAG_STATUS[p.status]}`}>{NOME_STATUS[p.status]}</span> {NOME_TIPO[p.kind]} ·{' '}
          {p.status === 'ativo' ? (
            <a href={`/produto/${p.slug}`} target="_blank" rel="noreferrer">
              ver na loja
            </a>
          ) : (
            'fora da vitrine'
          )}
        </p>
      </div>

      <div className="ed">
        <Status p={p} aoMudar={aoMudar} voltar={voltar} />
        <Dados p={p} aoMudar={aoMudar} />
        <Categorias p={p} catalogo={catalogo} aoMudar={aoMudar} />
        <Variacoes p={p} abrir={(v) => setVariacao(v ?? 'nova')} />
      </div>

      {variacao && (
        <VariacaoDialog
          key={variacao === 'nova' ? 'nova' : variacao.id}
          p={p}
          v={aberta}
          catalogo={catalogo}
          fechar={() => setVariacao(null)}
          aoMudar={aoMudar}
          criada={(id) => {
            // Depois de criar, a janela continua aberta na variação nova (para as peças do kit).
            setVariacao({ id } as VariacaoPainel);
          }}
        />
      )}
    </>
  );
}

// Status -------------------------------------------------------------------------
function Status({ p, aoMudar, voltar }: { p: ProdutoPainel; aoMudar: AoMudar; voltar: () => void }) {
  const { pendente, erro, feito, rodar } = useAcao();
  const falta = pendenciasParaAtivar(p);
  const ir = (s: StatusProduto, msg: string) => rodar(() => mudarStatus(p.id, s), aoMudar, msg);

  return (
    <section className="card">
      <h2>Situação</h2>
      <p className="note" style={{ marginBottom: 12 }}>
        {p.status === 'rascunho' && 'Rascunho: só aparece aqui no painel. Ative quando estiver pronto.'}
        {p.status === 'ativo' && 'Ativo: aparece na vitrine. Variações sem estoque aparecem como esgotadas.'}
        {p.status === 'arquivado' && 'Arquivado: fora da vitrine, mas o histórico fica guardado.'}
      </p>
      {p.status !== 'ativo' && falta.length > 0 && (
        <ul className="falta">
          {falta.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <div className="bar" style={{ marginBottom: 0 }}>
        {p.status !== 'ativo' && (
          <button className="btn auth-btn" disabled={pendente || falta.length > 0} onClick={() => ir('ativo', 'Produto ativo na vitrine.')}>
            Ativar na loja
          </button>
        )}
        {p.status === 'ativo' && (
          <button className="btn" disabled={pendente} onClick={() => ir('rascunho', 'Produto voltou para rascunho.')}>
            Tirar da loja (rascunho)
          </button>
        )}
        {p.status !== 'arquivado' && (
          <button className="btn" disabled={pendente} onClick={() => ir('arquivado', 'Produto arquivado.')}>
            Arquivar
          </button>
        )}
        {p.status === 'rascunho' && (
          <button
            className="btn btn-perigo"
            disabled={pendente}
            onClick={() => {
              if (window.confirm(`Apagar "${p.name}" e todas as variações? Isso não pode ser desfeito.`))
                rodar(
                  () => apagarProduto(p.id),
                  (c) => {
                    aoMudar(c);
                    voltar();
                  },
                );
            }}
          >
            Apagar rascunho
          </button>
        )}
      </div>
      <Avisos erro={erro} feito={feito} />
    </section>
  );
}

// Dados --------------------------------------------------------------------------
function Dados({ p, aoMudar }: { p: ProdutoPainel; aoMudar: AoMudar }) {
  const inicial = (): DadosProduto => ({
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    description: p.description,
    material: p.material,
    care_info: p.care_info,
    sale_unit: p.sale_unit,
    is_new: p.is_new,
    is_featured: p.is_featured,
  });
  const [d, setD] = useState<DadosProduto>(inicial);
  const { pendente, erro, feito, rodar, setErro } = useAcao();
  const set = <K extends keyof DadosProduto>(k: K, v: DadosProduto[K]) => setD((x) => ({ ...x, [k]: v }));
  const mudou = JSON.stringify(d) !== JSON.stringify(inicial());

  return (
    <section className="card">
      <h2>Dados do produto</h2>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!SLUG_OK.test(d.slug)) return setErro('Endereço (slug) inválido: só letras minúsculas, números e hífen.');
          rodar(() => salvarDadosProduto(p.id, d), aoMudar, 'Dados salvos.');
        }}
      >
        <div className="g2">
          <label className="auth-l">
            Nome
            <input className="auth-i" value={d.name} maxLength={120} onChange={(e) => set('name', e.target.value)} required />
          </label>
          <label className="auth-l">
            Endereço na loja
            <span className="pre-i">
              <span>/produto/</span>
              <input className="auth-i" value={d.slug} maxLength={80} onChange={(e) => set('slug', e.target.value.toLowerCase())} required />
            </span>
          </label>
        </div>
        {p.status === 'ativo' && d.slug !== p.slug && (
          <p className="note neg">Mudar o endereço de um produto ativo quebra links já compartilhados.</p>
        )}
        <label className="auth-l">
          Descrição curta (aparece nos cartões)
          <input className="auth-i" value={d.short_description} maxLength={160} onChange={(e) => set('short_description', e.target.value)} />
        </label>
        <label className="auth-l">
          Descrição
          <textarea className="auth-i auth-t" value={d.description} maxLength={2000} onChange={(e) => set('description', e.target.value)} />
        </label>
        <div className="g2">
          <label className="auth-l">
            Material
            <input className="auth-i" value={d.material} maxLength={200} onChange={(e) => set('material', e.target.value)} />
          </label>
          <label className="auth-l">
            Vendido por
            <select className="auth-i" value={d.sale_unit} onChange={(e) => set('sale_unit', e.target.value as UnidadeVenda)}>
              {(Object.keys(NOME_UNIDADE) as UnidadeVenda[]).map((u) => (
                <option key={u} value={u}>
                  {NOME_UNIDADE[u]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="auth-l">
          Cuidados
          <textarea className="auth-i auth-t" value={d.care_info} maxLength={1000} onChange={(e) => set('care_info', e.target.value)} />
        </label>
        <div className="bar" style={{ marginBottom: 0 }}>
          <label className="sw">
            <input type="checkbox" checked={d.is_new} onChange={(e) => set('is_new', e.target.checked)} />
            <span>Novo (entra em Lançamentos)</span>
          </label>
          <label className="sw">
            <input type="checkbox" checked={d.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
            <span>Destaque (entra em Mais vendidos)</span>
          </label>
        </div>
        <Avisos erro={erro} feito={feito} />
        <button className="btn auth-btn" type="submit" disabled={pendente || !mudou}>
          {pendente ? 'Salvando…' : mudou ? 'Salvar dados' : 'Nada para salvar'}
        </button>
      </form>
    </section>
  );
}

// Categorias -----------------------------------------------------------------------
function Categorias({ p, catalogo, aoMudar }: { p: ProdutoPainel; catalogo: CatalogoPainel; aoMudar: AoMudar }) {
  const [sel, setSel] = useState<string[]>(p.categorias);
  const { pendente, erro, feito, rodar } = useAcao();
  const mudou = [...sel].sort().join() !== [...p.categorias].sort().join();

  return (
    <section className="card">
      <h2>Categorias</h2>
      <p className="note" style={{ marginBottom: 10 }}>
        Um produto pode estar em várias. Para criar uma categoria nova, peça ao desenvolvimento por enquanto.
      </p>
      <div className="bar">
        {catalogo.categorias.map((c) => {
          const on = sel.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`pill${on ? ' on' : ''}`}
              aria-pressed={on}
              onClick={() => setSel((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
            >
              {c.name}
            </button>
          );
        })}
      </div>
      <Avisos erro={erro} feito={feito} />
      <button className="btn auth-btn" disabled={pendente || !mudou} onClick={() => rodar(() => salvarCategorias(p.id, sel), aoMudar, 'Categorias salvas.')}>
        {pendente ? 'Salvando…' : mudou ? 'Salvar categorias' : 'Nada para salvar'}
      </button>
    </section>
  );
}

// Variações --------------------------------------------------------------------------
function precoTexto(v: VariacaoPainel) {
  if (v.promo_price_cents === null || !v.promo_ends_at || !v.promo_starts_at) return fmt(v.price_cents);
  return `${fmt(v.promo_price_cents)} (de ${fmt(v.price_cents)}, ${diaCurto(v.promo_starts_at)}–${diaCurto(v.promo_ends_at)})`;
}

function Variacoes({ p, abrir }: { p: ProdutoPainel; abrir: (v: VariacaoPainel | null) => void }) {
  return (
    <section className="card">
      <div className="card-h">
        <h2>Variações</h2>
        <button className="btn auth-btn" onClick={() => abrir(null)}>
          Nova variação
        </button>
      </div>
      <p className="note" style={{ marginBottom: 10 }}>
        Cada combinação vendável (ex.: Ouro 18k · P) tem SKU e preço próprios.
        {p.kind === 'kit_composto'
          ? ' Kit composto não tem estoque próprio: informe as peças de cada variação.'
          : ' Variação nova começa com estoque 0: dê entrada na aba Estoque.'}
      </p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Variação</th>
              <th>Preço</th>
              {p.kind === 'kit_composto' ? <th className="num">Peças</th> : <th className="num">Mínimo</th>}
              <th>Na loja</th>
              <th>
                <span className="sr">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {p.variacoes.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong style={{ fontWeight: 500 }}>{textoAtributos(v.attributes)}</strong>
                  <div className="sku">{v.sku}</div>
                </td>
                <td>{precoTexto(v)}</td>
                <td className="num">{p.kind === 'kit_composto' ? v.pecas.length || <span className="neg">0</span> : v.min_stock}</td>
                <td>{v.active ? <span className="tag t-ok">Ativa</span> : <span className="tag t-bad">Inativa</span>}</td>
                <td>
                  <button className="pill" onClick={() => abrir(v)} aria-label={`Editar variação ${v.sku}`}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {p.variacoes.length === 0 && (
              <tr>
                <td colSpan={5} className="sub">
                  Nenhuma variação ainda. Todo produto precisa de pelo menos uma (mesmo sem opções, cadastre uma única).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VariacaoDialog({
  p,
  v,
  catalogo,
  fechar,
  aoMudar,
  criada,
}: {
  p: ProdutoPainel;
  v: VariacaoPainel | null;
  catalogo: CatalogoPainel;
  fechar: () => void;
  aoMudar: AoMudar;
  criada: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState<FormVariacao>(() => formDaVariacao(v));
  const { pendente, erro, feito, rodar } = useAcao();
  const set = <K extends keyof FormVariacao>(k: K, val: FormVariacao[K]) => setF((x) => ({ ...x, [k]: val }));

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog ref={ref} className="dlg dlg-l" onClose={fechar} aria-labelledby="var-t">
      <div className="dlg-h">
        <div>
          <h2 id="var-t">{v ? textoAtributos(v.attributes) : 'Nova variação'}</h2>
          <p className="sku">{p.name}</p>
        </div>
        <button className="pill" onClick={() => ref.current?.close()}>
          Fechar
        </button>
      </div>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          rodar(
            () => salvarVariacao(p.id, f),
            (d) => {
              aoMudar(d);
              if (!v) criada(d.extra);
            },
            v ? 'Variação salva.' : p.kind === 'kit_composto' ? 'Variação criada. Agora informe as peças abaixo.' : 'Variação criada com estoque 0.',
          );
        }}
      >
        <fieldset className="opcoes">
          <legend>Atributos (preencha só os que valem para esta peça)</legend>
          <div className="g3">
            {ATRIBUTOS.map(({ chave, nome }) => (
              <label key={chave} className="auth-l">
                {nome}
                <input
                  className="auth-i"
                  value={f.attributes[chave] ?? ''}
                  maxLength={40}
                  onChange={(e) => set('attributes', { ...f.attributes, [chave]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="g2">
          <label className="auth-l">
            SKU
            <input className="auth-i" value={f.sku} maxLength={60} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="ex.: AR-BRC010-OURO-P" required />
          </label>
          <label className="auth-l">
            Preço (R$)
            <input className="auth-i" inputMode="decimal" value={f.preco} onChange={(e) => set('preco', e.target.value)} placeholder="89,90" required />
          </label>
        </div>
        <fieldset className="opcoes">
          <legend>Promoção (opcional)</legend>
          <div className="g3">
            <label className="auth-l">
              Preço promocional
              <input className="auth-i" inputMode="decimal" value={f.promoPreco} onChange={(e) => set('promoPreco', e.target.value)} />
            </label>
            <label className="auth-l">
              Começa em
              <input className="auth-i" type="date" value={f.promoInicio} onChange={(e) => set('promoInicio', e.target.value)} />
            </label>
            <label className="auth-l">
              Termina em
              <input className="auth-i" type="date" value={f.promoFim} onChange={(e) => set('promoFim', e.target.value)} />
            </label>
          </div>
          {(f.promoPreco || f.promoInicio || f.promoFim) && (
            <button
              type="button"
              className="sl"
              onClick={() => setF((x) => ({ ...x, promoPreco: '', promoInicio: '', promoFim: '' }))}
              style={{ alignSelf: 'flex-start' }}
            >
              Tirar promoção
            </button>
          )}
        </fieldset>
        <div className="g2">
          {p.kind !== 'kit_composto' && (
            <label className="auth-l">
              Estoque mínimo (alerta)
              <input className="auth-i" inputMode="numeric" value={f.minimo} onChange={(e) => set('minimo', e.target.value)} />
            </label>
          )}
          <label className="sw" style={{ alignSelf: 'end' }}>
            <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
            <span>Variação ativa (aparece na loja quando o produto está ativo)</span>
          </label>
        </div>
        <Avisos erro={erro} feito={feito} />
        <div className="bar" style={{ marginBottom: 0 }}>
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Salvando…' : v ? 'Salvar variação' : 'Criar variação'}
          </button>
          {v && (
            <button
              type="button"
              className="btn btn-perigo"
              disabled={pendente}
              onClick={() => {
                if (window.confirm(`Apagar a variação ${v.sku}?`))
                  rodar(
                    () => apagarVariacao(v.id),
                    (d) => {
                      aoMudar(d);
                      ref.current?.close();
                    },
                  );
              }}
            >
              Apagar variação
            </button>
          )}
        </div>
        {v && <p className="note">Variação com histórico de estoque não pode ser apagada: desmarque "ativa".</p>}
      </form>

      {p.kind === 'kit_composto' && v && <Pecas p={p} v={v} catalogo={catalogo} aoMudar={aoMudar} />}
    </dialog>
  );
}

// Peças do kit composto ----------------------------------------------------------
function Pecas({ p, v, catalogo, aoMudar }: { p: ProdutoPainel; v: VariacaoPainel; catalogo: CatalogoPainel; aoMudar: AoMudar }) {
  const [linhas, setLinhas] = useState<PecaKit[]>(v.pecas.length ? v.pecas : [{ component_variant_id: '', quantity: 1 }]);
  const { pendente, erro, feito, rodar } = useAcao();
  const travado = p.status !== 'rascunho';

  // Peças possíveis: variações de produtos que não são kit composto.
  const opcoes = catalogo.produtos
    .filter((x) => x.kind !== 'kit_composto')
    .flatMap((x) =>
      x.variacoes.map((vv) => ({ id: vv.id, nome: `${x.name} — ${textoAtributos(vv.attributes)} (${vv.sku})${vv.active ? '' : ' · inativa'}` })),
    );
  const setLinha = (i: number, patch: Partial<PecaKit>) => setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <>
      <h3 className="dlg-s">Peças do kit</h3>
      <p className="note" style={{ marginBottom: 10 }}>
        {travado
          ? 'A composição fica travada depois que o kit sai do rascunho (Q-CAT-03 em aberto). Para mudar, arquive e crie outro kit.'
          : 'Quantas unidades de cada peça formam um kit. A disponibilidade do kit vem do estoque delas.'}
      </p>
      <div className="pecas">
        {linhas.map((l, i) => (
          <div key={i} className="peca">
            <select
              className="auth-i"
              aria-label={`Peça ${i + 1}`}
              value={l.component_variant_id}
              disabled={travado}
              onChange={(e) => setLinha(i, { component_variant_id: e.target.value })}
            >
              <option value="">Escolha a peça…</option>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            <input
              className="auth-i qtd"
              inputMode="numeric"
              aria-label={`Quantidade da peça ${i + 1}`}
              value={String(l.quantity)}
              disabled={travado}
              onChange={(e) => setLinha(i, { quantity: Number(e.target.value.replace(/\D/g, '')) || 0 })}
            />
            {!travado && (
              <button type="button" className="pill" onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))} aria-label={`Tirar peça ${i + 1}`}>
                Tirar
              </button>
            )}
          </div>
        ))}
      </div>
      {!travado && (
        <div className="bar" style={{ marginTop: 10, marginBottom: 0 }}>
          <button type="button" className="pill" onClick={() => setLinhas((ls) => [...ls, { component_variant_id: '', quantity: 1 }])}>
            + Peça
          </button>
          <button className="btn auth-btn" disabled={pendente} onClick={() => rodar(() => salvarPecas(v.id, linhas), aoMudar, 'Peças salvas.')}>
            {pendente ? 'Salvando…' : 'Salvar peças'}
          </button>
        </div>
      )}
      <Avisos erro={erro} feito={feito} />
    </>
  );
}
