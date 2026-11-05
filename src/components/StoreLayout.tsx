'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useCatalogo } from '../data/CatalogoContext';
import { catalogHref } from '../data/catalogQuery';
import { useStore } from '../store';
import { BagIcon, CheckIcon, CrossIcon, GemIcon, HeartIcon, HomeIcon, InfoIcon, MoonIcon, SearchIcon, SunIcon } from './Icons';
import { useEmpresa, useTextos } from '../data/SiteContext';
import { InstalarApp } from './InstalarApp';
import { Midia } from './Midia';
import { LogoMark } from './ui';

type NavKey = 'home' | 'catalog' | 'favs' | 'about';

const NAV: { label: string; key: NavKey; href: string; icon: () => ReactElement }[] = [
  { label: 'Início', key: 'home', href: '/', icon: () => <HomeIcon /> },
  { label: 'Loja', key: 'catalog', href: '/loja', icon: () => <GemIcon /> },
  { label: 'Favoritos', key: 'favs', href: '/favoritos', icon: () => <HeartIcon size={24} /> },
  { label: 'Sobre', key: 'about', href: '/sobre', icon: () => <InfoIcon /> },
];

function activeNav(pathname: string): NavKey | null {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/loja') || pathname.startsWith('/produto')) return 'catalog';
  if (pathname.startsWith('/favoritos')) return 'favs';
  if (pathname.startsWith('/sobre')) return 'about';
  return null;
}

export function StoreLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggleDark, favs, cart, toast, segurarToast, soltarToast, fecharToast } = useStore();
  const { categories } = useCatalogo();
  const empresa = useEmpresa();
  const texto = useTextos();
  // Só o que foi preenchido em Configurações aparece; sem nada, o bloco some.
  const contato = [
    empresa.whatsapp && { chave: 'whatsapp', texto: `WhatsApp ${empresa.whatsapp}`, href: `https://wa.me/${empresa.whatsapp}`, externo: true },
    empresa.phone && { chave: 'phone', texto: empresa.phone, href: `tel:${empresa.phone.replace(/[^\d+]/g, '')}`, externo: false },
    empresa.email && { chave: 'email', texto: empresa.email, href: `mailto:${empresa.email}`, externo: false },
    empresa.instagram && { chave: 'instagram', texto: `@${empresa.instagram}`, href: `https://instagram.com/${empresa.instagram}`, externo: true },
    empresa.address && { chave: 'address', texto: empresa.address, href: null, externo: false },
    empresa.hours && { chave: 'hours', texto: empresa.hours, href: null, externo: false },
  ].filter((c): c is { chave: string; texto: string; href: string | null; externo: boolean } => !!c);
  const [search, setSearch] = useState('');
  const active = activeNav(pathname);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  // Contador da sacola dá um pulo quando entra uma peça (e não ao carregar a página).
  const [pulo, setPulo] = useState(false);
  const antes = useRef(cartCount);
  useEffect(() => {
    if (cartCount > antes.current) {
      setPulo(true);
      const t = window.setTimeout(() => setPulo(false), 500);
      antes.current = cartCount;
      return () => window.clearTimeout(t);
    }
    antes.current = cartCount;
  }, [cartCount]);
  const isProduct = pathname.startsWith('/produto/');

  return (
    <div className={`ar${isProduct ? ' r-product' : ''}${pathname.startsWith('/sacola') ? ' r-cart' : ''}`}>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="hdr">
        <div className="hdr-in">
          <Link className="logo-btn" href="/" aria-label="AR Acessórios — ir para o início">
            <LogoMark />
          </Link>
          <nav className="nav-d" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.key} href={n.href} className={`nav-link${active === n.key ? ' on' : ''}`} aria-current={active === n.key ? 'page' : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hdr-act">
            <form
              className="srch"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(catalogHref({ q: search.trim() }));
              }}
            >
              <SearchIcon />
              <input type="search" placeholder="Buscar joias" aria-label="Buscar joias" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <Link className="ib ib-m" href="/loja" aria-label="Buscar na loja" data-dica="Buscar">
              <SearchIcon size={22} />
            </Link>
            <button
              className="ib"
              onClick={toggleDark}
              aria-pressed={dark}
              aria-label={dark ? 'Ativar modo claro' : 'Ativar modo noturno'}
              data-dica={dark ? 'Modo claro' : 'Modo noturno'}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link className="ib" href="/favoritos" aria-label={`Favoritos (${favs.length})`} data-dica="Favoritos">
              <HeartIcon />
              {favs.length > 0 && <span className="cnt">{favs.length}</span>}
            </Link>
            <Link className="ib dica-esq" href="/sacola" aria-label={`Sacola (${cartCount} itens)`} data-dica="Sacola">
              <BagIcon />
              {cartCount > 0 && <span className={`cnt${pulo ? ' pulo' : ''}`}>{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo">{children}</main>

      <footer className="foot" id="rodape">
        <div className="wrap">
          <div className="foot-g">
            <div className="foot-marca">
              <Link className="logo-btn" href="/" aria-label="AR Acessórios — início">
                <LogoMark />
              </Link>
              <p>{texto('rodape-texto')}</p>
            </div>
            <nav aria-labelledby="foot-loja">
              <h4 id="foot-loja">Loja</h4>
              <ul className="foot-cats">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={catalogHref({ cat: c.id })}>{c.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            {contato.length > 0 && (
              <nav aria-labelledby="foot-contato">
                <h4 id="foot-contato">Contato</h4>
                <ul className="foot-contato">
                  {contato.map((c) => (
                    <li key={c.chave}>{c.href ? <a href={c.href} {...(c.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.texto}</a> : <span>{c.texto}</span>}</li>
                  ))}
                </ul>
              </nav>
            )}
            <nav aria-labelledby="foot-ar">
              <h4 id="foot-ar">Institucional</h4>
              <ul className="foot-inst">
                <li>
                  <Link href="/sobre">Sobre a AR</Link>
                </li>
                <li>
                  <Link href="/favoritos">Favoritos</Link>
                </li>
                <li>
                  <Link href="/sacola">Sacola</Link>
                </li>
              </ul>
            </nav>
          </div>
          {/* Sem itens de bastidor no rodapé público: o painel fica em /admin e "limpar" fica na sacola. */}
          <div className="foot-b">
            <span>
              © {new Date().getFullYear()} {empresa.storeName}
              {empresa.legalName && ` · ${empresa.legalName}`}
              {empresa.cnpj && ` · CNPJ ${empresa.cnpj}`}
            </span>
            <InstalarApp />
          </div>
        </div>
      </footer>

      <nav className="bnav" aria-label="Navegação inferior">
        {NAV.map((n) => (
          <Link key={n.key} href={n.href} className={`bn${active === n.key ? ' on' : ''}`} aria-current={active === n.key ? 'page' : undefined}>
            {n.icon()}
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>

      {toast && (
        <div
          key={toast.id}
          className={`toast${toast.saindo ? ' saindo' : ''}`}
          role="status"
          onMouseEnter={segurarToast}
          onMouseLeave={soltarToast}
          onFocus={segurarToast}
          onBlur={soltarToast}
        >
          {toast.foto || toast.art ? (
            <span className="toast-m">
              <Midia foto={toast.foto} art={toast.art!} />
            </span>
          ) : (
            <span className="toast-m ok">
              <CheckIcon size={16} />
            </span>
          )}
          <span className="toast-t">
            <strong>{toast.titulo}</strong>
            {toast.detalhe && <span>{toast.detalhe}</span>}
          </span>
          {toast.acao && (
            <Link className="toast-a" href={toast.acao.href}>
              {toast.acao.rotulo}
            </Link>
          )}
          <button className="toast-x" onClick={fecharToast} aria-label="Fechar aviso">
            <CrossIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
