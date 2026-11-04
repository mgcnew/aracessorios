'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useCatalogo } from '../data/CatalogoContext';
import { catalogHref } from '../data/catalogQuery';
import { useStore } from '../store';
import { BagIcon, GemIcon, HeartIcon, HomeIcon, InfoIcon, MoonIcon, SearchIcon, SunIcon } from './Icons';
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
  const { dark, toggleDark, favs, cart, toast, clearDemo } = useStore();
  const { categories } = useCatalogo();
  const [search, setSearch] = useState('');
  const active = activeNav(pathname);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const isProduct = pathname.startsWith('/produto/');

  return (
    <div className={`ar${isProduct ? ' r-product' : ''}${dark ? ' dark' : ''}`}>
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
            <Link className="ib ib-m" href="/loja" aria-label="Buscar na loja">
              <SearchIcon size={22} />
            </Link>
            <button className="ib" onClick={toggleDark} aria-pressed={dark} aria-label={dark ? 'Ativar modo claro' : 'Ativar modo noturno'}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link className="ib" href="/favoritos" aria-label={`Favoritos (${favs.length})`}>
              <HeartIcon />
              {favs.length > 0 && <span className="cnt">{favs.length}</span>}
            </Link>
            <Link className="ib" href="/sacola" aria-label={`Sacola (${cartCount} itens)`}>
              <BagIcon />
              {cartCount > 0 && <span className="cnt">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo">{children}</main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-g">
            <div className="foot-marca">
              <Link className="logo-btn" href="/" aria-label="AR Acessórios — início">
                <LogoMark />
              </Link>
              <p>Semijoias delicadas para o dia a dia e para presentear.</p>
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
          <div className="foot-b">
            <span>© AR Acessórios</span>
            <span className="foot-acoes">
              <button className="lnk" onClick={clearDemo}>
                Limpar sacola e favoritos
              </button>
              <Link href="/admin">Painel da loja</Link>
            </span>
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
        <div className="toast" role="status">
          <span>{toast}</span>
          <Link href="/sacola">Ver sacola</Link>
        </div>
      )}
    </div>
  );
}
