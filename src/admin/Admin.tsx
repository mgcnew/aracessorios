'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { sair } from '../app/admin/acoes';
import { Estoque, Situacao } from './Estoque';
import { descreverVariacao, type FiltroEstoque, type PaginaEstoque } from './estoque';
import { Produtos } from './Produtos';
import { Biblioteca } from './Biblioteca';
import type { PaginaProdutos, ProdutoPainel } from './produtos';
import { carregarEstoquePagina } from '../app/admin/estoque-acoes';
import { CaixaIcon, CheckIcon, CrossIcon, EtiquetaIcon, MaisIcon, PainelIcon, PedidoIcon } from '../components/Icons';
import { Selecao } from '../components/Selecao';
import { contarNaoLidos } from '../app/admin/avisos-acoes';
import { SinoIcon } from '../components/Icons';
import { Avisos } from './Avisos';
import { FiltroOpcoes } from './FiltroOpcoes';
import { useParamUrl } from './url';
import { Confirmacoes } from './confirmar';
import { LogoMark } from '../components/ui';
import { fmt } from '../data/catalog';
import { useTheme } from '../store';
import {
  ASK_LIST,
  CAN_LIST,
  CANT_LIST,
  EDITABLE_STATUSES,
  ORDER_STATUSES,
  SEED_ORDERS,
  type AdminOrder,
  type OrderStatus,
} from './seed';

type View = 'overview' | 'stock' | 'products' | 'orders' | 'perms' | 'library' | 'notices';

const MENU: { label: string; view: View }[] = [
  { label: 'Visão geral', view: 'overview' },
  { label: 'Estoque', view: 'stock' },
  { label: 'Produtos', view: 'products' },
  { label: 'Biblioteca', view: 'library' },
  { label: 'Pedidos', view: 'orders' },
  { label: 'Avisos', view: 'notices' },
  { label: 'Permissões', view: 'perms' },
];

// Abas no endereço (?aba=…): o "voltar" do celular volta para a aba anterior.
const VIEW_ABA: Record<View, string> = { overview: 'visao', stock: 'estoque', products: 'produtos', orders: 'pedidos', perms: 'permissoes', library: 'biblioteca', notices: 'avisos' };
const ABA_VIEW: Record<string, View> = Object.fromEntries(Object.entries(VIEW_ABA).map(([v, a]) => [a, v as View]));

const NAV_CELULAR: { view: View; label: string; Icone: ComponentType }[] = [
  { view: 'overview', label: 'Início', Icone: PainelIcon },
  { view: 'stock', label: 'Estoque', Icone: CaixaIcon },
  { view: 'products', label: 'Produtos', Icone: EtiquetaIcon },
  { view: 'orders', label: 'Pedidos', Icone: PedidoIcon },
];

const TAG: Record<OrderStatus, string> = {
  'Aguardando pagamento': 't-warn',
  Pago: 't-info',
  'Em separação': 't-info',
  Enviado: 't-info',
  Entregue: 't-ok',
  Cancelado: 't-bad',
};

const PAID: OrderStatus[] = ['Pago', 'Em separação', 'Enviado', 'Entregue'];
const isEditable = (s: OrderStatus) => s === 'Pago' || s === 'Em separação' || s === 'Enviado';

/** O que o servidor já trouxe ao abrir o painel: só o necessário para a aba do endereço. */
export interface CargaInicial {
  aba: string;
  produtoAberto: string;
  baixo: PaginaEstoque | null;
  estoque: PaginaEstoque | null;
  produtos: PaginaProdutos | null;
  produto: ProdutoPainel | null;
  erro: string | null;
}

const SO_BAIXO: FiltroEstoque = { pagina: 1, busca: '', soBaixo: true, verArquivados: false };

export function Admin({ email, carga }: { email: string; carga: CargaInicial }) {
  const { dark, toggleDark } = useTheme();
  const [aba, setAba] = useParamUrl('aba', 'visao', carga.aba);
  const view: View = ABA_VIEW[aba] ?? 'overview';
  const setView = (v: View) => {
    setAba(VIEW_ABA[v], { produto: null });
    window.scrollTo({ top: 0 });
  };
  const [mais, setMais] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>(SEED_ORDERS);

  // Avisos (NOT-DEC-001): contador do sino, atualizado ao abrir, a cada 45 s com a aba visível,
  // ao voltar para ela e na hora em que o service worker avisa que chegou um push.
  const [naoLidos, setNaoLidos] = useState(0);
  const [versaoAvisos, setVersaoAvisos] = useState(0);
  const ultimoNaoLidos = useRef(0);
  const aoMudarNaoLidos = useCallback((n: number) => {
    setNaoLidos(n);
    ultimoNaoLidos.current = n;
  }, []);
  const atualizarNaoLidos = useCallback(async () => {
    const n = await contarNaoLidos();
    if (n === null) return;
    setNaoLidos(n);
    if (n > ultimoNaoLidos.current) setVersaoAvisos((v) => v + 1);
    ultimoNaoLidos.current = n;
  }, []);
  useEffect(() => {
    void atualizarNaoLidos();
    const t = setInterval(() => document.visibilityState === 'visible' && void atualizarNaoLidos(), 45000);
    const aoVoltar = () => document.visibilityState === 'visible' && void atualizarNaoLidos();
    document.addEventListener('visibilitychange', aoVoltar);
    const aoReceber = (e: MessageEvent) => e.data?.tipo === 'aviso' && void atualizarNaoLidos();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      navigator.serviceWorker.addEventListener('message', aoReceber);
    }
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', aoVoltar);
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', aoReceber);
    };
  }, [atualizarNaoLidos]);
  // Número no ícone do aplicativo instalado (iOS 16.4+ e computador), quando o aparelho permite.
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    try {
      if (naoLidos > 0) void nav.setAppBadge?.(naoLidos);
      else void nav.clearAppBadge?.();
    } catch {
      /* sem suporte: segue sem o número */
    }
  }, [naoLidos]);

  // Visão geral: só as variações no mínimo ou esgotadas; atualiza ao voltar para ela.
  const [baixo, setBaixo] = useState<PaginaEstoque | null>(carga.baixo);
  const primeiraVisao = useRef(carga.baixo !== null);
  useEffect(() => {
    if (view !== 'overview') return;
    if (primeiraVisao.current) {
      primeiraVisao.current = false;
      return;
    }
    let vivo = true;
    carregarEstoquePagina(SO_BAIXO).then((r) => vivo && r.ok && setBaixo(r.dados));
    return () => {
      vivo = false;
    };
  }, [view]);
  const setOrderStatus = (id: number, status: OrderStatus) =>
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));

  return (
    <div className="adm">
      <Confirmacoes />
      {/* Computador: barra lateral. */}
      <aside className="side">
        <div className="brand">
          <LogoMark />
          <small>Painel</small>
        </div>
        <nav className="menu" aria-label="Seções do painel">
          {MENU.map((m) => (
            <button
              key={m.view}
              className={`mi${view === m.view ? ' on' : ''}`}
              aria-current={view === m.view ? 'page' : undefined}
              onClick={() => setView(m.view)}
            >
              {m.label}
              {m.view === 'notices' && naoLidos > 0 && <span className="mi-n" aria-label={`${naoLidos} não lidos`}>{naoLidos}</span>}
            </button>
          ))}
        </nav>
        <div className="side-f">
          <Link className="sl" href="/">
            Ver a loja
          </Link>
          <button className="sl" onClick={toggleDark} aria-pressed={dark}>
            {dark ? 'Modo claro' : 'Modo noturno'}
          </button>
          <form action={sair} className="sair">
            {email && <small className="quem">{email}</small>}
            <button className="sl" type="submit">
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Celular: barra de cima compacta. */}
      <header className="topo">
        <LogoMark />
        <span className="topo-t">Painel</span>
        <button className="topo-b sino" onClick={() => setView('notices')} aria-label={`Avisos${naoLidos ? ` (${naoLidos} não lidos)` : ''}`}>
          <SinoIcon />
          {naoLidos > 0 && <span className="sino-n">{naoLidos > 9 ? '9+' : naoLidos}</span>}
        </button>
        <button className="topo-b" onClick={() => setMais(true)} aria-label="Mais opções" aria-haspopup="dialog">
          <MaisIcon />
        </button>
      </header>

      <main className="main">
        {(view === 'overview' || view === 'orders' || view === 'perms') && (
          <span className="demo" role="note">
            {view === 'overview'
              ? 'Pedidos e vendas são demonstração · o estoque é real'
              : 'Demonstração · dados fictícios, nada é salvo de verdade'}
          </span>
        )}
        {view === 'overview' && (
          <Overview baixo={baixo} orders={orders} goOrders={() => setView('orders')} goStock={() => setView('stock')} />
        )}
        {view === 'stock' && <Estoque inicial={carga.estoque} erroCarga={carga.erro} />}
        {view === 'products' && <Produtos inicial={carga.produtos} produtoInicial={carga.produto} abertoInicial={carga.produtoAberto} erroCarga={carga.erro} />}
        {view === 'library' && <Biblioteca />}
        {view === 'orders' && <Orders orders={orders} setStatus={setOrderStatus} />}
        {view === 'notices' && <Avisos versao={versaoAvisos} aoMudarNaoLidos={aoMudarNaoLidos} />}
        {view === 'perms' && <Permissions />}
      </main>

      {/* Celular: navegação de baixo, como num aplicativo. */}
      <nav className="anav" aria-label="Seções do painel">
        {NAV_CELULAR.map(({ view: v, label, Icone }) => (
          <button key={v} className={`an${view === v ? ' on' : ''}`} aria-current={view === v ? 'page' : undefined} onClick={() => setView(v)}>
            <Icone />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {mais && (
        <MaisOpcoes
          fechar={() => setMais(false)}
          email={email}
          dark={dark}
          toggleDark={toggleDark}
          irBiblioteca={() => { setMais(false); setView('library'); }}
          irPermissoes={() => {
            setMais(false);
            setView('perms');
          }}
        />
      )}
    </div>
  );
}

function MaisOpcoes({
  fechar,
  email,
  dark,
  toggleDark,
  irPermissoes,
  irBiblioteca,
}: {
  fechar: () => void;
  email: string;
  dark: boolean;
  toggleDark: () => void;
  irPermissoes: () => void;
  irBiblioteca: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dlg folha" onClose={fechar} aria-label="Mais opções" onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <div className="folha-alca" aria-hidden="true" />
      {email && <p className="quem folha-quem">{email}</p>}
      <div className="folha-lista">
        <button className="fo" onClick={irBiblioteca}>Biblioteca de fotos</button>
        <button className="fo" onClick={irPermissoes}>
          Permissões
        </button>
        <Link className="fo" href="/">
          Ver a loja
        </Link>
        <button className="fo" onClick={toggleDark} aria-pressed={dark}>
          {dark ? 'Modo claro' : 'Modo noturno'}
        </button>
        <form action={sair}>
          <button className="fo fo-sair" type="submit">
            Sair
          </button>
        </form>
      </div>
      <button className="btn folha-fechar" onClick={() => ref.current?.close()}>
        Fechar
      </button>
    </dialog>
  );
}

function Overview({
  baixo,
  orders,
  goOrders,
  goStock,
}: {
  baixo: PaginaEstoque | null;
  orders: AdminOrder[];
  goOrders: () => void;
  goStock: () => void;
}) {
  const low = baixo?.linhas ?? [];
  const revenue = orders.filter((o) => PAID.includes(o.status)).reduce((s, o) => s + o.total, 0);
  const kpis = [
    { label: 'Aguardando pagamento', value: orders.filter((o) => o.status === 'Aguardando pagamento').length, note: 'pedidos' },
    { label: 'Para separar', value: orders.filter((o) => o.status === 'Pago' || o.status === 'Em separação').length, note: 'pedidos pagos' },
    { label: 'Vendas pagas', value: fmt(revenue), note: 'soma ilustrativa' },
    { label: 'Estoque baixo', value: baixo ? baixo.total : '…', note: 'variações no mínimo ou esgotadas' },
  ];

  return (
    <>
      <div className="top">
        <h1 className="h1">Olá! Veja como está a loja</h1>
        <p className="sub">Resumo dos pedidos (ilustrativos) e do estoque (real).</p>
      </div>
      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <span>{k.label}</span>
            <strong>{k.value}</strong>
            <small>{k.note}</small>
          </div>
        ))}
      </div>
      <div className="grid2">
        <section className="card">
          <h2>Pedidos recentes</h2>
          <div className="tw">
            <table className="cartoes">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td className="c-tit">#{o.id}</td>
                    <td className="c-dado" data-label="Cliente">{o.customer}</td>
                    <td className="c-dado" data-label="Total">{fmt(o.total)}</td>
                    <td className="c-sit">
                      <span className={`tag ${TAG[o.status]}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={goOrders}>
              Ver todos os pedidos
            </button>
          </div>
        </section>
        <section className="card">
          <h2>Atenção ao estoque</h2>
          {low.length > 0 ? (
            <div className="tw">
              <table className="cartoes">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th className="num">Disponível</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {low.slice(0, 8).map((l) => (
                    <tr key={l.variant_id}>
                      <td className="c-tit">
                        {l.product_name}
                        <div className="sku">
                          {descreverVariacao(l.attributes) && `${descreverVariacao(l.attributes)} · `}
                          {l.sku}
                        </div>
                      </td>
                      <td className="num c-dado c-forte" data-label="Disponível">{l.disponivel}</td>
                      <td className="c-sit">
                        <Situacao l={l} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sub">Nenhuma variação no mínimo.</p>
          )}
          {low.length > 8 && <p className="note" style={{ marginTop: 8 }}>E mais {low.length - 8}.</p>}
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={goStock}>
              Abrir o estoque
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function Orders({ orders, setStatus }: { orders: AdminOrder[]; setStatus: (id: number, s: OrderStatus) => void }) {
  const [filter, setFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const rows = orders.filter((o) => filter === 'Todos' || o.status === filter);

  return (
    <>
      <div className="top">
        <h1 className="h1">Pedidos</h1>
        <p className="sub">Acompanhe e atualize a separação e o envio. O pagamento não pode ser alterado manualmente.</p>
      </div>
      <div className="bar">
        <FiltroOpcoes
          rotulo="Filtrar por status"
          valor={filter}
          opcoes={(['Todos', ...ORDER_STATUSES] as const).map((f) => ({ value: f, label: f }))}
          onChange={setFilter}
        />
      </div>
      <section className="card">
        <div className="tw">
          <table className="cartoes">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="c-tit">#{o.id}</td>
                  <td className="c-dado" data-label="Data">{o.date}</td>
                  <td className="c-dado c-largo" data-label="Cliente">{o.customer}</td>
                  <td className="c-dado" data-label="Itens">{o.items}</td>
                  <td className="c-dado" data-label="Total">{fmt(o.total)}</td>
                  <td className="c-sit">
                    {isEditable(o.status) ? (
                      <Selecao
                        className="sel"
                        aria-label={`Status do pedido ${o.id}`}
                        value={o.status}
                        opcoes={EDITABLE_STATUSES.map((s) => ({ value: s, label: s }))}
                        onChange={(v) => setStatus(o.id, v)}
                      />
                    ) : (
                      <span className={`tag ${TAG[o.status]}`}>{o.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="sub" style={{ padding: '14px 0' }}>
            Nenhum pedido neste status.
          </p>
        )}
        <p className="note" style={{ marginTop: 12 }}>
          Pedidos aguardando pagamento, pagos e finalizados não têm o status alterado à mão: seguem o fluxo de pagamento (versão final).
        </p>
      </section>
    </>
  );
}

function PermList({ items, icon, cls }: { items: { t: string; d: string }[]; icon: ReactNode; cls: string }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i.t}>
          <span className={`ic ${cls}`} aria-hidden="true">
            {icon}
          </span>
          <span>
            {i.t}
            <small>{i.d}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Permissions() {
  return (
    <>
      <div className="top">
        <h1 className="h1">O que a dona pode e não pode</h1>
        <p className="sub">Proposta de permissões do painel, para validar com a cliente. Não altera as regras dos módulos 01 e 02.</p>
      </div>
      <div className="perm">
        <section className="card">
          <h2>Pode fazer</h2>
          <PermList items={CAN_LIST} icon={<CheckIcon />} cls="y" />
        </section>
        <section className="card">
          <h2>Não pode fazer</h2>
          <PermList items={CANT_LIST} icon={<CrossIcon />} cls="n" />
        </section>
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>A decidir com a cliente</h2>
          <PermList items={ASK_LIST} icon="?" cls="q" />
        </section>
      </div>
    </>
  );
}
