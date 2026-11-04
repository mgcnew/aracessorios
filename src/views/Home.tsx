import Link from 'next/link';
import { Midia } from '../components/Midia';
import { ProductGrid } from '../components/ProductCard';
import { SectionHead } from '../components/ui';
import { artCatOf, CATEGORY_TONE, cheapestVariant, fmt, isAvailable } from '../data/catalog';
import type { Catalogo } from '../data/loja';
import { catalogHref } from '../data/catalogQuery';
import { ConversaIcon, GemIcon, PresenteIcon, SetaIcon } from '../components/Icons';
import { PILLARS } from './About';

const ICONE_PILAR = [GemIcon, PresenteIcon, ConversaIcon];

const HERO = {
  pulseira: { src: '/hero/pulseira.webp', thumb: '/hero/pulseira.webp', alt: 'Pulseira dourada fina com pontos de brilho no pulso, sobre linho claro' },
  brincos: { src: '/hero/brincos.webp', thumb: '/hero/brincos.webp', alt: 'Par de brincos em ouro rosé com pérolas em gota, sobre seda champagne' },
  anel: { src: '/hero/anel.webp', thumb: '/hero/anel.webp', alt: 'Anel solitário dourado com zircônia, em um pratinho de cerâmica' },
};

// Fotos ilustrativas das categorias (geradas por IA para o protótipo). Categoria sem foto aqui mostra a ilustração.
const fotoCat = (slug: string, alt: string) => ({ src: `/categorias/${slug}.webp`, thumb: `/categorias/${slug}.webp`, alt });
const FOTO_CATEGORIA: Record<string, { src: string; thumb: string; alt: string }> = {
  brincos: fotoCat('brincos', 'Brincos em ouro rosé com pérolas'),
  colares: fotoCat('colares', 'Colar dourado fino com ponto de luz'),
  pulseiras: fotoCat('pulseiras', 'Pulseira dourada fina no pulso'),
  aneis: fotoCat('aneis', 'Anel solitário dourado'),
  tornozeleiras: fotoCat('tornozeleiras', 'Tornozeleira dourada com pingentes de concha'),
  piercings: fotoCat('piercings', 'Piercings dourados em um pratinho de cerâmica'),
};
const FOTO_PRESENTES = {
  src: '/marca/sobre.webp',
  thumb: '/marca/sobre.webp',
  alt: 'Colar, brincos de pérola e anel dourados sobre linho, com flores secas',
};
const FOTO_EMBALAGEM = {
  src: '/marca/embalagem.webp',
  thumb: '/marca/embalagem.webp',
  alt: 'Caixa de presente clara com laço rosé e colar dourado, ao lado de um cartão',
};

export function Home({ catalogo: { categories, products } }: { catalogo: Catalogo }) {
  const newest = products.filter((p) => p.isNew).slice(0, 4);
  const best = products.filter((p) => p.best).slice(0, 4);
  const kits = products.filter((p) => p.isKit);

  return (
    <div className="fade">
      <div className="wrap">
        <section className="hero" aria-label="Destaque">
          <div>
            <h1>
              Brilho <em>delicado</em> para os seus dias
            </h1>
            <p className="lead">
              Semijoias de acabamento refinado para compor o seu estilo — do básico de todo dia aos presentes que ficam na memória.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-p" href="/loja">
                Explorar a loja
              </Link>
              <Link className="btn btn-s" href={catalogHref({ q: 'kit' })}>
                Conhecer os kits
              </Link>
            </div>
          </div>
          {/* Fotos ilustrativas geradas por IA (Kairogen) para o protótipo; trocar pelas fotos reais da loja. */}
          <div className="hero-art">
            <div className="hero-main">
              <Midia foto={HERO.pulseira} tamanho="g" art={{ cat: 'pulseiras', tone: 'gold', gem: true, bg: 1 }} ratio="4 / 5" prioridade />
            </div>
            <div className="hero-f hero-f1">
              <Midia foto={HERO.brincos} art={{ cat: 'brincos', tone: 'rose', gem: true, bg: 2 }} />
            </div>
            <div className="hero-f hero-f2">
              <Midia foto={HERO.anel} art={{ cat: 'aneis', tone: 'gold', gem: true, bg: 3 }} />
            </div>
          </div>
        </section>
      </div>

      <div className="wrap">
        <ul className="promessas" aria-label="O que você encontra na AR">
          {PILLARS.map((p, i) => {
            const Icone = ICONE_PILAR[i];
            return (
              <li key={p.n}>
                <Icone size={26} />
                <div>
                  <strong>{p.title}</strong>
                  <span>{p.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="wrap sec" aria-labelledby="h-cats">
        <SectionHead title="Escolha o seu estilo" id="h-cats" />
        <div className="ctiles">
          {categories.map((c, i) => (
            <Link key={c.id} className="ctile" href={catalogHref({ cat: c.id })} aria-label={`Ver ${c.name}`}>
              <div className="ctile-i">
                <Midia foto={FOTO_CATEGORIA[c.id] ?? null} art={{ cat: artCatOf(c.id), tone: CATEGORY_TONE[c.id] ?? 'gold', gem: true, bg: i % 4 }} />
              </div>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap" aria-labelledby="h-new">
        <SectionHead
          title="Lançamentos"
          id="h-new"
          action={
            <Link className="lnk" href={catalogHref({ sort: 'novos' })}>
              Ver tudo
            </Link>
          }
        />
        <ProductGrid products={newest} trilho />
      </section>

      {/* Presentes: foto grande de um lado, kits em lista do outro (substitui os cartões grandes de kit). */}
      <section className="wrap sec" aria-labelledby="h-kits">
        <div className="presentes">
          <div className="presentes-foto">
            <Midia foto={FOTO_PRESENTES} tamanho="g" art={{ cat: 'kit', tone: 'gold', gem: true, bg: 1 }} ratio="4 / 5" />
          </div>
          <div className="presentes-txt">
            <h2 id="h-kits" className="h-serif">
              Kits para <em>presentear</em>
            </h2>
            <p className="presentes-lead">Conjuntos pensados para combinar entre si, prontos para entregar a quem você gosta.</p>
            <ul className="kitlista">
              {kits.map((k) => {
                const href = `/produto/${k.slug}`;
                const disp = isAvailable(k);
                return (
                  <li key={k.id}>
                    <Link className="kitl" href={href}>
                      <span className="kitl-i">
                        <Midia foto={k.photos?.[0]} art={{ cat: 'kit', tone: k.tone, gem: true, bg: k.bg }} />
                      </span>
                      <span className="kitl-b">
                        <span className="kitl-n">{k.name}</span>
                        {k.short && <span className="kitl-s">{k.short}</span>}
                        <span className="kitl-p">
                          {fmt(cheapestVariant(k).price)}
                          {!disp && <span className="kitl-esg">Esgotado</span>}
                        </span>
                      </span>
                      <SetaIcon className="kitl-seta" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap" aria-labelledby="h-best">
        <SectionHead
          title="Mais vendidos"
          id="h-best"
          action={
            <Link className="lnk" href="/loja">
              Ver a loja
            </Link>
          }
        />
        <ProductGrid products={best} trilho />
      </section>

      <section className="wrap sec" aria-labelledby="h-inst">
        <div className="inst split">
          <div>
            <h2 id="h-inst" className="h-serif" style={{ fontSize: 'clamp(34px,4.8vw,56px)' }}>
              Feita para ser presenteada
            </h2>
            <p>
              Cada peça é pensada para acompanhar momentos do dia a dia e também os que merecem ser lembrados — com embalagem
              cuidadosa e acabamento delicado.
            </p>
            <div style={{ marginTop: 26 }}>
              <Link className="btn btn-p" href="/sobre">
                Conheça a marca
              </Link>
            </div>
          </div>
          <div className="rounded">
            <Midia foto={FOTO_EMBALAGEM} tamanho="g" art={{ cat: 'kit', tone: 'rose', gem: true, bg: 0 }} ratio="6 / 5" />
          </div>
        </div>
      </section>
    </div>
  );
}
