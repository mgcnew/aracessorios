import Link from 'next/link';
import { Midia } from '../components/Midia';
import { ProductGrid } from '../components/ProductCard';
import { SectionHead } from '../components/ui';
import { artCatOf, CATEGORY_TONE, cheapestVariant, fmt, isAvailable } from '../data/catalog';
import type { Catalogo } from '../data/loja';
import { catalogHref } from '../data/catalogQuery';

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
            <span className="eyebrow">Nova coleção · demonstração</span>
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

      <section className="wrap sec" aria-labelledby="h-cats">
        <SectionHead eyebrow="Navegue por categoria" title="Escolha o seu estilo" id="h-cats" />
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
          eyebrow="Acabou de chegar"
          title="Lançamentos"
          id="h-new"
          action={
            <Link className="lnk" href={catalogHref({ sort: 'novos' })}>
              Ver tudo
            </Link>
          }
        />
        <ProductGrid products={newest} />
      </section>

      <section className="wrap sec" aria-labelledby="h-best">
        <SectionHead
          eyebrow="As mais desejadas"
          title="Mais vendidos"
          id="h-best"
          action={
            <Link className="lnk" href="/loja">
              Ver a loja
            </Link>
          }
        />
        <ProductGrid products={best} />
      </section>

      <section className="wrap" aria-labelledby="h-kits">
        <SectionHead eyebrow="Para presentear" title="Vitrine de kits" id="h-kits" />
        <div className="kits">
          {kits.map((k) => {
            const href = `/produto/${k.slug}`;
            return (
              <article key={k.id} className="kit">
                <Link href={href} aria-label={`Ver ${k.name}`} tabIndex={-1} style={{ display: 'block' }}>
                  <Midia foto={k.photos?.[0]} art={{ cat: 'kit', tone: k.tone, gem: true, bg: k.bg }} ratio="5 / 4" />
                </Link>
                <div className="kit-b">
                  <span className="eyebrow">{k.kind === 'kit_stocked' ? 'Kit com estoque próprio' : 'Kit composto'}</span>
                  <h3>{k.name}</h3>
                  <p>{k.short}</p>
                  <div className="kit-f">
                    <strong>{fmt(cheapestVariant(k).price)}</strong>
                    <Link className="btn btn-s" href={href}>
                      {isAvailable(k) ? 'Ver kit' : 'Ver detalhes'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="wrap sec" aria-labelledby="h-inst">
        <div className="inst split">
          <div>
            <span className="eyebrow">Sobre a AR</span>
            <h2 id="h-inst" className="h-serif" style={{ fontSize: 'clamp(34px,4.8vw,56px)', marginTop: 10 }}>
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
