'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { carregarEstoquePagina, historicoVariacao, movimentarEstoque } from '../app/admin/estoque-acoes';
import { MinusIcon, PlusIcon, SearchIcon } from '../components/Icons';
import {
  NOME_TIPO,
  OPERACOES,
  descreverVariacao,
  ehKitComposto,
  saldoDepois,
  validarValor,
  type FiltroEstoque,
  type LinhaEstoque,
  type Movimento,
  type Operacao,
  type PaginaEstoque,
} from './estoque';
import { Paginacao } from './Paginacao';

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

const comSinal = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

export function Situacao({ l }: { l: LinhaEstoque }) {
  if (l.disponivel <= 0) return <span className="tag t-bad">Esgotado</span>;
  if (l.abaixo_do_minimo) return <span className="tag t-warn">No mínimo</span>;
  return <span className="tag t-ok">Ok</span>;
}

const FILTRO_INICIAL: FiltroEstoque = { pagina: 1, busca: '', soBaixo: false, verArquivados: false };

export function Estoque({ inicial, erroCarga }: { inicial: PaginaEstoque | null; erroCarga: string | null }) {
  const [filtro, setFiltro] = useState<FiltroEstoque>(FILTRO_INICIAL);
  const [busca, setBusca] = useState('');
  const [dados, setDados] = useState<PaginaEstoque | null>(inicial);
  const [erro, setErro] = useState<string | null>(erroCarga);
  const [carregando, iniciar] = useTransition();
  const [aberta, setAberta] = useState<LinhaEstoque | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Uma página por vez, do banco. A primeira já vem do servidor quando se abre a aba pelo endereço.
  const jaTem = useRef(inicial !== null);
  const carregar = useCallback((f: FiltroEstoque) => {
    iniciar(async () => {
      const r = await carregarEstoquePagina(f);
      if (r.ok) {
        setDados(r.dados);
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
  // Busca espera a pessoa parar de digitar.
  useEffect(() => {
    const t = setTimeout(() => setFiltro((f) => (f.busca === busca ? f : { ...f, busca, pagina: 1 })), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const linhas = dados?.linhas ?? [];
  const arquivados = new Set(dados?.arquivados ?? []);
  const mudar = (patch: Partial<FiltroEstoque>) => setFiltro((f) => ({ ...f, pagina: 1, ...patch }));

  return (
    <>
      <div className="top">
        <h1 className="h1">Estoque</h1>
        <p className="sub">Saldo de cada variação, direto do banco. Toda mudança pede um motivo e fica no histórico.</p>
      </div>

      {erro && (
        <p className="auth-err" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível carregar o estoque: {erro}
        </p>
      )}
      {aviso && (
        <p className="ok-msg" role="status">
          {aviso}
        </p>
      )}

      <div className="bar">
        <label className="fld">
          <SearchIcon />
          <input
            type="search"
            placeholder="Buscar produto, variação ou SKU"
            aria-label="Buscar produto, variação ou SKU"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <button className={`pill${filtro.soBaixo ? ' on' : ''}`} aria-pressed={filtro.soBaixo} onClick={() => mudar({ soBaixo: !filtro.soBaixo })}>
          Só no mínimo ou esgotado ({dados?.baixo ?? 0})
        </button>
        {(dados?.arquivadas ?? 0) > 0 && (
          <button
            className={`pill${filtro.verArquivados ? ' on' : ''}`}
            aria-pressed={filtro.verArquivados}
            onClick={() => mudar({ verArquivados: !filtro.verArquivados })}
          >
            Mostrar arquivados ({dados?.arquivadas})
          </button>
        )}
      </div>

      <section className="card">
        <div className={`tw${carregando ? ' carregando' : ''}`} aria-busy={carregando}>
          <table className="cartoes toque">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="num">Saldo</th>
                <th className="num">Reservado</th>
                <th className="num">Disponível</th>
                <th className="num">Mínimo</th>
                <th>Situação</th>
                <th>
                  <span className="sr">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const kit = ehKitComposto(l);
                const variacao = descreverVariacao(l.attributes);
                return (
                  <tr key={l.variant_id}>
                    <td className="c-tit">
                      <strong style={{ fontWeight: 500 }}>{l.product_name}</strong>
                      <div className="sku">
                        {variacao && `${variacao} · `}
                        {l.sku}
                        {kit && ' · kit composto'}
                        {arquivados.has(l.product_id) && ' · arquivado'}
                      </div>
                    </td>
                    <td className="num c-dado" data-label="Saldo">{kit ? '—' : l.on_hand}</td>
                    <td className="num c-dado" data-label="Reservado">{kit ? '—' : l.reserved}</td>
                    <td className="num c-dado c-forte" data-label="Disponível">
                      <strong style={{ fontWeight: 500 }}>{l.disponivel}</strong>
                    </td>
                    <td className="num c-dado" data-label="Mínimo">{l.min_stock}</td>
                    <td className="c-sit">
                      <Situacao l={l} />
                    </td>
                    <td className="c-acao">
                      {kit ? (
                        <span className="note">Calculado pelas peças</span>
                      ) : (
                        <button
                          className="pill"
                          onClick={() => {
                            setAviso(null);
                            setAberta(l);
                          }}
                          aria-label={`Movimentar ${l.product_name} ${variacao}`}
                        >
                          Movimentar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {dados && linhas.length === 0 && (
                <tr>
                  <td colSpan={7} className="sub">
                    {filtro.busca || filtro.soBaixo ? 'Nada encontrado com esse filtro.' : 'Nenhuma variação cadastrada.'}
                  </td>
                </tr>
              )}
              {!dados && !erro && (
                <tr>
                  <td colSpan={7} className="sub">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao pagina={filtro.pagina} total={dados?.total ?? 0} ir={(pagina) => setFiltro((f) => ({ ...f, pagina }))} carregando={carregando} rotulo="variações" />
        <p className="note" style={{ marginTop: 12 }}>
          Disponível = saldo − reservado. Kit composto não tem estoque próprio: a disponibilidade vem das peças, então para mudar
          um kit composto movimente as peças dele.
        </p>
      </section>

      {aberta && (
        <Movimentar
          linha={aberta}
          fechar={() => setAberta(null)}
          concluir={(nova, texto) => {
            setDados((d) => d && { ...d, linhas: d.linhas.map((l) => (l.variant_id === nova.variant_id ? nova : l)) });
            setAberta(nova);
            setAviso(texto);
            carregar(filtro); // contagens (mínimo/esgotado) podem ter mudado
          }}
        />
      )}
    </>
  );
}

function Movimentar({
  linha,
  fechar,
  concluir,
}: {
  linha: LinhaEstoque;
  fechar: () => void;
  concluir: (linha: LinhaEstoque, aviso: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [op, setOp] = useState<Operacao>('entrada');
  const [valor, setValor] = useState('');
  // Ajuste: "Tirar" ou "Somar" + quantidade só com números (o teclado numérico do celular não tem "−").
  const [sinal, setSinal] = useState<'tirar' | 'somar'>('tirar');
  const valorFinal = op === 'ajuste' && valor.trim() ? `${sinal === 'tirar' ? '-' : ''}${valor.trim()}` : valor;
  const passo = (d: number) => setValor((x) => String(Math.max(0, (Number(x) || 0) + d)));
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const [hist, setHist] = useState<Movimento[] | null>(null);
  const [erroHist, setErroHist] = useState<string | null>(null);

  const variacao = descreverVariacao(linha.attributes);
  const conf = OPERACOES.find((o) => o.op === op)!;
  const v = valor.trim() ? validarValor(op, valorFinal) : null;
  const previa = v && 'valor' in v ? saldoDepois(op, linha.on_hand, v.valor) : null;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  // Histórico recarrega quando o saldo muda (depois de salvar).
  useEffect(() => {
    let vivo = true;
    historicoVariacao(linha.variant_id).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setHist(r.dados);
        setErroHist(null);
      } else setErroHist(r.erro);
    });
    return () => {
      vivo = false;
    };
  }, [linha.variant_id, linha.on_hand]);

  const salvar = () => {
    setErro(null);
    setFeito(null);
    const check = validarValor(op, valorFinal);
    if ('erro' in check) return setErro(check.erro);
    if (!motivo.trim()) return setErro('Informe o motivo.');
    iniciar(async () => {
      const r = await movimentarEstoque(op, linha.variant_id, valorFinal, motivo);
      if (!r.ok) return setErro(r.erro);
      setValor('');
      setMotivo('');
      const nova = r.dados;
      const texto = `${conf.nome} ${op === 'ajuste' ? 'registrado' : 'registrada'} em ${linha.product_name}${variacao ? ` (${variacao})` : ''}. Saldo agora: ${nova.on_hand}.`;
      setFeito(texto);
      concluir(r.dados, texto);
    });
  };

  return (
    <dialog ref={ref} className="dlg" onClose={fechar} aria-labelledby="dlg-t">
      <div className="dlg-h">
        <div>
          <h2 id="dlg-t">{linha.product_name}</h2>
          <p className="sku">
            {variacao && `${variacao} · `}
            {linha.sku}
          </p>
        </div>
        <button className="pill" onClick={() => ref.current?.close()} aria-label="Fechar">
          Fechar
        </button>
      </div>

      <dl className="saldos">
        <div>
          <dt>Saldo</dt>
          <dd>{linha.on_hand}</dd>
        </div>
        <div>
          <dt>Reservado</dt>
          <dd>{linha.reserved}</dd>
        </div>
        <div>
          <dt>Disponível</dt>
          <dd>{linha.disponivel}</dd>
        </div>
      </dl>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
      >
        <div className="bar" role="group" aria-label="Tipo de movimentação" style={{ marginBottom: 0 }}>
          {OPERACOES.map((o) => (
            <button
              type="button"
              key={o.op}
              className={`pill${op === o.op ? ' on' : ''}`}
              aria-pressed={op === o.op}
              onClick={() => {
                setOp(o.op);
                setErro(null);
              }}
            >
              {o.nome}
            </button>
          ))}
        </div>
        <p className="note">{conf.ajuda}</p>

        <div className="auth-l">
          <span>{op === 'ajuste' ? 'Quantidade' : conf.campo}</span>
          {op === 'ajuste' && (
            <span className="seg" role="group" aria-label="Tirar ou somar">
              <button type="button" className={sinal === 'tirar' ? 'on' : ''} aria-pressed={sinal === 'tirar'} onClick={() => setSinal('tirar')}>
                − Tirar
              </button>
              <button type="button" className={sinal === 'somar' ? 'on' : ''} aria-pressed={sinal === 'somar'} onClick={() => setSinal('somar')}>
                + Somar
              </button>
            </span>
          )}
          <span className="qtd-l">
            <button type="button" className="qtd-b" onClick={() => passo(-1)} aria-label="Diminuir quantidade">
              <MinusIcon size={20} />
            </button>
            <input
              className="auth-i qtd-i"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={op === 'contagem' ? 'contado' : '0'}
              aria-label={op === 'ajuste' ? `Quantidade a ${sinal}` : conf.campo}
            />
            <button type="button" className="qtd-b" onClick={() => passo(1)} aria-label="Aumentar quantidade">
              <PlusIcon size={20} />
            </button>
          </span>
        </div>
        {previa !== null && (
          <p className={`note${previa < linha.reserved ? ' neg' : ''}`}>
            Saldo vai de {linha.on_hand} para <strong>{previa}</strong>
            {previa < linha.reserved && ' — abaixo do reservado; o banco vai recusar'}
          </p>
        )}

        <label className="auth-l">
          Motivo
          <input
            className="auth-i"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={200}
            placeholder={op === 'entrada' ? 'ex.: compra do fornecedor' : op === 'ajuste' ? 'ex.: peça com defeito' : 'ex.: contagem mensal'}
          />
        </label>

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
        <div className="dlg-acoes">
          <button className="btn auth-btn" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : `Registrar ${conf.nome.toLowerCase()}`}
          </button>
        </div>
      </form>

      <h3 className="dlg-s">Histórico</h3>
      {erroHist && <p className="auth-err">{erroHist}</p>}
      {!hist && !erroHist && <p className="note">Carregando…</p>}
      {hist && hist.length === 0 && <p className="note">Nenhuma movimentação registrada.</p>}
      {hist && hist.length > 0 && (
        <ul className="hist">
          {hist.map((m) => (
            <li key={m.id}>
              <div>
                <strong>{NOME_TIPO[m.type]}</strong>{' '}
                <span className={m.on_hand_delta < 0 ? 'neg' : ''}>{m.on_hand_delta !== 0 && comSinal(m.on_hand_delta)}</span>
                {m.reserved_delta !== 0 && <span className="note"> · reservado {comSinal(m.reserved_delta)}</span>}
                <span className="note"> · saldo {m.on_hand_after}</span>
              </div>
              <small>
                {dataHora.format(new Date(m.created_at))} · {m.reason}
              </small>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}
