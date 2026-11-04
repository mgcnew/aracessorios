import Link from 'next/link';
import { Midia } from '../components/Midia';

// Também aparecem na página inicial (faixa abaixo do destaque).
export const PILLARS = [
  { n: '01', title: 'Acabamento cuidadoso', text: 'Peças pensadas para combinar entre si e compor com o seu dia a dia.' },
  { n: '02', title: 'Embalagem para presente', text: 'Uma apresentação delicada, pronta para surpreender quem recebe.' },
  { n: '03', title: 'Atendimento próximo', text: 'Ajuda na escolha da peça certa para cada ocasião.' },
];

export function About() {
  return (
    <div className="wrap fade" style={{ paddingBottom: 20 }}>
      <div className="split sec">
        <div className="prose">
          <h1 className="h-serif" style={{ fontSize: 'clamp(42px,6vw,76px)' }}>
            Delicadeza em cada detalhe
          </h1>
          <p>
            A AR Acessórios nasceu do desejo de oferecer semijoias que valorizam o estilo de cada pessoa, com acabamento cuidadoso e um
            olhar atento ao presentear.
          </p>
          <p>Das peças de todo dia aos kits pensados para surpreender, cada escolha busca unir elegância, conforto e um toque de brilho.</p>
          <p className="note" style={{ marginTop: 22 }}>
            Texto institucional ilustrativo — será substituído pela história real da marca.
          </p>
        </div>
        <div className="rounded">
          {/* Foto ilustrativa gerada por IA para o protótipo; trocar pela foto real da marca. */}
          <Midia
            foto={{ src: '/marca/sobre.webp', thumb: '/marca/sobre.webp', alt: 'Colar, brincos de pérola e anel dourados sobre linho, com flores secas' }}
            tamanho="g"
            art={{ cat: 'kit', tone: 'gold', gem: true, bg: 1 }}
            ratio="1 / 1.05"
          />
        </div>
      </div>
      <div className="pillars">
        {PILLARS.map((p) => (
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
