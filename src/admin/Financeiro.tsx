'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apagarDespesaFixa,
  apagarLancamento,
  carregarFinanceiro,
  criarLancamento,
  pagarDespesaFixa,
  salvarDespesaFixa,
} from '../app/admin/financeiro-acoes';
import { SetaIcon } from '../components/Icons';
import { Selecao } from '../components/Selecao';
import { fmt } from '../data/catalog';
import type { DespesaFixaRow } from '../lib/database-biblioteca.types';
import { confirmar } from './confirmar';
import { FiltroOpcoes } from './FiltroOpcoes';
import {
  CATEGORIAS_ENTRADA,
  CATEGORIAS_SAIDA,
  centavosParaTexto,
  diaMes,
  hoje,
  mesAtual,
  nomeCategoria,
  nomeMes,
  reaisParaCentavos,
  somarMes,
  type DespesaPendente,
  type FiltroFinanceiro,
  type FiltroTipo,
  type PaginaFinanceiro,
} from './financeiro';
import { Paginacao } from './Paginacao';
import { useAcao } from './Produtos';

const TIPOS = [
  { value: 'todos', label: 'Tudo' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'saida', label: 'Saídas' },
] as const;

const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

/*
 * Financeiro do painel (FIN-DEC-001): entradas e saídas lançadas à mão, mês a mês, e despesas fixas
 * (aluguel, internet…) que aparecem todo mês como "a pagar" até serem marcadas como pagas.
 */
export function Financeiro() {
  const [filtro, setFiltro] = useState<FiltroFinanceiro>({ mes: mesAtual(), tipo: 'todos', pagina: 1 });
  const [dados, setDados] = useState<PaginaFinanceiro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [novo, setNovo] = useState(false);
  const [fixasAberto, setFixasAberto] = useState(false);
  const [pagando, setPagando] = useState<DespesaPendente | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const corrida = useRef(0);

  const carregar = useCallback(async (f: FiltroFinanceiro) => {
    const minha = ++corrida.current;
    setCarregando(true);
    const r = await carregarFinanceiro(f);
    if (minha !== corrida.current) return;
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setDados(r.dados);
  }, []);

  useEffect(() => {
    void carregar(filtro);
  }, [filtro, carregar]);

  const recarregar = (msg?: string) => {
    if (msg) setAviso(msg);
    void carregar(filtro);
  };
  const mudar = (patch: Partial<FiltroFinanceiro>) => setFiltro((f) => ({ ...f, pagina: 1, ...patch }));

  const saldo = (dados?.entradas ?? 0) - (dados?.saidas ?? 0);
  const ehAtual = filtro.mes === mesAtual();

  return (
    <>
      <div className="top top-acao">
        <div>
          <h1 className="h1">Financeiro</h1>
          <p className="sub">Entradas, saídas e despesas fixas do mês. Tudo é lançado por você; os pedidos pagos entram aqui quando o pagamento for ligado.</p>
        </div>
        <div className="acoes-topo">
          <button className="btn" onClick={() => setFixasAberto(true)}>
            Despesas fixas
          </button>
          <button className="btn auth-btn" onClick={() => setNovo(true)}>
            Novo lançamento
          </button>
        </div>
      </div>

      {erro && (
        <p className="auth-err" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível carregar o financeiro: {erro}
        </p>
      )}
      {aviso && (
        <p className="ok-msg" role="status">
          {aviso}
        </p>
      )}

      <div className="mes-nav">
        <button className="pill" onClick={() => mudar({ mes: somarMes(filtro.mes, -1) })} aria-label="Mês anterior">
          <SetaIcon dir="esq" size={16} />
        </button>
        <strong className="mes-nome" aria-live="polite">
          {nomeMes(filtro.mes)}
        </strong>
        <button className="pill" onClick={() => mudar({ mes: somarMes(filtro.mes, 1) })} aria-label="Próximo mês">
          <SetaIcon size={16} />
        </button>
        {!ehAtual && (
          <button className="pill" onClick={() => mudar({ mes: mesAtual() })}>
            Mês atual
          </button>
        )}
      </div>

      <div className="kpis" aria-busy={carregando}>
        <div className="kpi">
          <span>Entradas</span>
          <strong className="kpi-din fin-entrada">{dados ? fmt(dados.entradas) : '—'}</strong>
        </div>
        <div className="kpi">
          <span>Saídas</span>
          <strong className="kpi-din fin-saida">{dados ? fmt(dados.saidas) : '—'}</strong>
        </div>
        <div className="kpi">
          <span>Saldo do mês</span>
          <strong className={`kpi-din ${saldo < 0 ? 'fin-saida' : ''}`}>{dados ? fmt(saldo) : '—'}</strong>
        </div>
        <div className="kpi">
          <span>Fixas a pagar</span>
          <strong className="kpi-din">{dados ? fmt(dados.aPagar) : '—'}</strong>
          <small>{dados ? `${dados.pendentes.length} ${dados.pendentes.length === 1 ? 'conta' : 'contas'}` : ''}</small>
        </div>
      </div>

      <section className="card fin-fixas">
        <div className="card-h">
          <h2>Despesas fixas de {nomeMes(filtro.mes)}</h2>
          <button className="pill" onClick={() => setFixasAberto(true)}>
            Gerenciar
          </button>
        </div>
        {dados && dados.fixas.length === 0 && <p className="note">Nenhuma despesa fixa cadastrada. Cadastre aluguel, internet e outras contas que se repetem todo mês.</p>}
        {dados && dados.fixas.length > 0 && dados.pendentes.length === 0 && <p className="note">Tudo pago neste mês.</p>}
        {dados && dados.pendentes.length > 0 && (
          <ul className="fin-lista">
            {dados.pendentes.map((p) => (
              <li key={p.fixa.id}>
                <div className="fin-lista-t">
                  <strong style={{ fontWeight: 500 }}>{p.fixa.name}</strong>
                  <div className="sku">
                    vence {diaMes(p.vence)} · {nomeCategoria(p.fixa.category)}
                  </div>
                </div>
                {p.atrasada && <span className="tag t-bad">Atrasada</span>}
                <span className="fin-valor">{fmt(p.fixa.amount_cents)}</span>
                <button className="btn" onClick={() => setPagando(p)}>
                  Marcar como paga
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="bar">
        <FiltroOpcoes rotulo="Filtrar lançamentos" valor={filtro.tipo} opcoes={TIPOS} onChange={(tipo: FiltroTipo) => mudar({ tipo })} />
      </div>

      <section className="card">
        <div className={`tw${carregando ? ' carregando' : ''}`} aria-busy={carregando}>
          <table className="cartoes toque">
            <thead>
              <tr>
                <th>Lançamento</th>
                <th>Data</th>
                <th className="num">Valor</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {(dados?.lancamentos ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="c-tit">
                    <strong style={{ fontWeight: 500 }}>{l.description || nomeCategoria(l.category)}</strong>
                    <div className="sku">
                      {l.kind === 'entrada' ? 'Entrada' : 'Saída'} · {nomeCategoria(l.category)}
                      {l.fixed_expense_id && ' · despesa fixa'}
                    </div>
                  </td>
                  <td className="c-dado" data-label="Data">{dataBr(l.occurred_on)}</td>
                  <td className={`num c-dado c-forte ${l.kind === 'entrada' ? 'fin-entrada' : 'fin-saida'}`}>
                    {l.kind === 'entrada' ? '+ ' : '− '}
                    {fmt(l.amount_cents)}
                  </td>
                  <td className="c-acao">
                    <button
                      className="pill"
                      onClick={async () => {
                        const ok = await confirmar({
                          titulo: 'Apagar este lançamento?',
                          texto: l.fixed_expense_id ? 'A despesa fixa volta para "a pagar" neste mês.' : 'O valor sai dos totais do mês.',
                          confirmar: 'Apagar',
                          perigo: true,
                        });
                        if (!ok) return;
                        const r = await apagarLancamento(l.id);
                        if (!r.ok) return setErro(r.erro);
                        recarregar('Lançamento apagado.');
                      }}
                    >
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
              {dados && dados.lancamentos.length === 0 && (
                <tr>
                  <td colSpan={4} className="note">
                    Nenhum lançamento em {nomeMes(filtro.mes)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao pagina={filtro.pagina} total={dados?.total ?? 0} ir={(p) => setFiltro((f) => ({ ...f, pagina: p }))} carregando={carregando} rotulo="lançamentos" />
      </section>

      {novo && (
        <DialogoLancamento
          fechar={() => setNovo(false)}
          salvo={() => {
            setNovo(false);
            recarregar('Lançamento salvo.');
          }}
        />
      )}
      {pagando && (
        <DialogoPagar
          pendente={pagando}
          mes={filtro.mes}
          fechar={() => setPagando(null)}
          salvo={() => {
            setPagando(null);
            recarregar('Pagamento registrado como saída.');
          }}
        />
      )}
      {fixasAberto && <DialogoFixas fixas={dados?.fixas ?? []} fechar={() => setFixasAberto(false)} mudou={() => recarregar()} />}
    </>
  );
}

/** Abre a janela já aberta (showModal) e avisa o pai ao fechar. */
function useDialogo(fechar: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return { ref, props: { ref, onClose: fechar } };
}

function DialogoLancamento({ fechar, salvo }: { fechar: () => void; salvo: () => void }) {
  const { ref, props } = useDialogo(fechar);
  const [kind, setKind] = useState<'entrada' | 'saida'>('saida');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(hoje());
  const [categoria, setCategoria] = useState('fornecedor');
  const [descricao, setDescricao] = useState('');
  const { pendente, erro, rodar, setErro } = useAcao();
  const categorias = kind === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <dialog {...props} className="dlg" aria-labelledby="lanc-t">
      <div className="dlg-h">
        <h2 id="lanc-t">Novo lançamento</h2>
        <button className="pill" onClick={() => ref.current?.close()}>
          Fechar
        </button>
      </div>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          const c = reaisParaCentavos(valor);
          if (c === null) return setErro('Informe o valor em reais, maior que zero. Ex.: 89,90');
          rodar(() => criarLancamento({ kind, amount_cents: c, occurred_on: data, category: categoria, description: descricao }), salvo);
        }}
      >
        <fieldset className="opcoes">
          <legend>Tipo</legend>
          {(['saida', 'entrada'] as const).map((k) => (
            <label key={k} className="opcao">
              <input
                type="radio"
                name="tipo"
                checked={kind === k}
                onChange={() => {
                  setKind(k);
                  setCategoria(k === 'entrada' ? 'venda' : 'fornecedor');
                }}
              />
              <span>
                <strong>{k === 'entrada' ? 'Entrada' : 'Saída'}</strong>
                <small>{k === 'entrada' ? 'Dinheiro que entrou (venda no balcão, por exemplo).' : 'Dinheiro que saiu (compra de mercadoria, embalagem, frete…).'}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="auth-l">
          Valor (R$)
          <input className="auth-i" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required />
        </label>
        <label className="auth-l">
          Data
          <input className="auth-i" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        <label className="auth-l">
          Categoria
          <Selecao className="auth-i" value={categoria} opcoes={categorias} onChange={setCategoria} />
        </label>
        <label className="auth-l">
          Descrição (opcional)
          <input className="auth-i" maxLength={160} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        <div className="dlg-acoes">
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Salvando…' : 'Salvar lançamento'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DialogoPagar({ pendente: p, mes, fechar, salvo }: { pendente: DespesaPendente; mes: string; fechar: () => void; salvo: () => void }) {
  const { ref, props } = useDialogo(fechar);
  const [valor, setValor] = useState(centavosParaTexto(p.fixa.amount_cents));
  const [data, setData] = useState(hoje());
  const { pendente, erro, rodar, setErro } = useAcao();
  return (
    <dialog {...props} className="dlg" aria-labelledby="pagar-t">
      <div className="dlg-h">
        <h2 id="pagar-t">Pagar {p.fixa.name}</h2>
        <button className="pill" onClick={() => ref.current?.close()}>
          Fechar
        </button>
      </div>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          const c = reaisParaCentavos(valor);
          if (c === null) return setErro('Informe o valor em reais, maior que zero.');
          rodar(() => pagarDespesaFixa({ fixaId: p.fixa.id, mes, amount_cents: c, occurred_on: data }), salvo);
        }}
      >
        <p className="note">Referente a {nomeMes(mes)}, vence {diaMes(p.vence)}. O pagamento vira uma saída; mude o valor se a conta veio diferente.</p>
        <label className="auth-l">
          Valor pago (R$)
          <input className="auth-i" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} required />
        </label>
        <label className="auth-l">
          Data do pagamento
          <input className="auth-i" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        <div className="dlg-acoes">
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Salvando…' : 'Registrar pagamento'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DialogoFixas({ fixas, fechar, mudou }: { fixas: DespesaFixaRow[]; fechar: () => void; mudou: () => void }) {
  const { ref, props } = useDialogo(fechar);
  const [editando, setEditando] = useState<DespesaFixaRow | null>(null);
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [dia, setDia] = useState('5');
  const [categoria, setCategoria] = useState('aluguel');
  const { pendente, erro, rodar, setErro } = useAcao();

  const limpar = () => {
    setEditando(null);
    setNome('');
    setValor('');
    setDia('5');
    setCategoria('aluguel');
    setErro(null);
  };
  const editar = (f: DespesaFixaRow) => {
    setEditando(f);
    setNome(f.name);
    setValor(centavosParaTexto(f.amount_cents));
    setDia(String(f.due_day));
    setCategoria(f.category);
    setErro(null);
  };

  return (
    <dialog {...props} className="dlg" aria-labelledby="fixas-t">
      <div className="dlg-h">
        <h2 id="fixas-t">Despesas fixas</h2>
        <button className="pill" onClick={() => ref.current?.close()}>
          Fechar
        </button>
      </div>
      {fixas.length > 0 && (
        <ul className="fin-lista fin-lista-dlg">
          {fixas.map((f) => (
            <li key={f.id} className={f.active ? '' : 'pausada'}>
              <div className="fin-lista-t">
                <strong style={{ fontWeight: 500 }}>{f.name}</strong>
                <div className="sku">
                  {fmt(f.amount_cents)} · todo dia {f.due_day} · {nomeCategoria(f.category)}
                  {!f.active && ' · pausada'}
                </div>
              </div>
              <span className="fin-acoes">
                <button className="pill" onClick={() => editar(f)}>
                  Editar
                </button>
                <button
                  className="pill"
                  onClick={() =>
                    rodar(
                      () => salvarDespesaFixa({ id: f.id, name: f.name, amount_cents: f.amount_cents, due_day: f.due_day, category: f.category, active: !f.active }),
                      mudou,
                    )
                  }
                >
                  {f.active ? 'Pausar' : 'Ativar'}
                </button>
                <button
                  className="pill btn-perigo"
                  onClick={async () => {
                    const ok = await confirmar({
                      titulo: `Apagar "${f.name}"?`,
                      texto: 'Ela deixa de aparecer todo mês. Os pagamentos já lançados continuam nos totais. Para só parar por um tempo, use Pausar.',
                      confirmar: 'Apagar',
                      perigo: true,
                    });
                    if (!ok) return;
                    rodar(() => apagarDespesaFixa(f.id), () => {
                      if (editando?.id === f.id) limpar();
                      mudou();
                    });
                  }}
                >
                  Apagar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          const c = reaisParaCentavos(valor);
          if (c === null) return setErro('Informe o valor em reais, maior que zero.');
          rodar(
            () => salvarDespesaFixa({ id: editando?.id, name: nome, amount_cents: c, due_day: Number(dia), category: categoria, active: editando?.active ?? true }),
            () => {
              limpar();
              mudou();
            },
          );
        }}
      >
        <h3 className="fin-sub">{editando ? `Editar ${editando.name}` : 'Nova despesa fixa'}</h3>
        <label className="auth-l">
          Nome
          <input className="auth-i" value={nome} maxLength={80} placeholder="Ex.: Aluguel da loja" onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label className="auth-l">
          Valor (R$)
          <input className="auth-i" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required />
        </label>
        <label className="auth-l">
          Dia do vencimento
          <input className="auth-i" type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} required />
        </label>
        <label className="auth-l">
          Categoria
          <Selecao className="auth-i" value={categoria} opcoes={CATEGORIAS_SAIDA} onChange={setCategoria} />
        </label>
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        <div className="dlg-acoes">
          {editando && (
            <button className="btn" type="button" onClick={limpar}>
              Cancelar edição
            </button>
          )}
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Salvando…' : editando ? 'Salvar alterações' : 'Adicionar despesa'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
