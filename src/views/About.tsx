import Link from 'next/link';
import { MidiaFixa } from '../components/MidiaFixa';
import { midiaDoEspaco, type Site } from '../data/site';
import { pilaresDe, textoDe } from '../data/site-textos';

export function About({ site }: { site: Site }) {
  const t = (chave: string) => textoDe(site.textos, chave);
  // O aviso de "ilustrativo" some assim que a dona escreve a história real.
  const ilustrativo = ['sobre-titulo', 'sobre-texto-1', 'sobre-texto-2'].every((c) => !(c in site.textos));
  return (
    <div className="wrap fade" style={{ paddingBottom: 20 }}>
      <div className="split sec">
        <div className="prose">
          <h1 className="h-serif" style={{ fontSize: 'clamp(42px,6vw,76px)' }}>
            {t('sobre-titulo')}
          </h1>
          <p>{t('sobre-texto-1')}</p>
          <p>{t('sobre-texto-2')}</p>
          {ilustrativo && (
            <p className="note" style={{ marginTop: 22 }}>
              Texto institucional ilustrativo — será substituído pela história real da marca.
            </p>
          )}
        </div>
        <div className="rounded">
          {/* Foto ilustrativa gerada por IA para o protótipo; trocar pela foto real da marca. */}
          <MidiaFixa item={midiaDoEspaco(site, 'sobre')} tamanho="g" art={{ cat: 'kit', tone: 'gold', gem: true, bg: 1 }} ratio="1 / 1.05" />
        </div>
      </div>
      <div className="pillars">
        {pilaresDe(site.textos).map((p) => (
          <div key={p.n} className="pillar">
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '48px 0 20px' }}>
        <Link className="btn btn-p" href="/loja">
          Explorar a loja
        </Link>
      </div>
    </div>
  );
}
