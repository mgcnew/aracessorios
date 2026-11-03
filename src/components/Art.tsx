import type { CSSProperties, ReactElement } from 'react';
import type { ArtCat, Tone } from '../data/catalog';

/**
 * Ilustração vetorial de cada categoria de peça — ocupa o lugar das fotos
 * de produto até que as fotos reais da marca sejam fornecidas.
 */
export interface ArtComponentProps {
  cat?: ArtCat;
  tone?: Tone;
  gem?: boolean;
  bg?: number;
  rot?: number;
  ratio?: string;
}

const TONES: Record<Tone, string> = { gold: '#B8864B', rose: '#BE8570', silver: '#8C8683' };
const BGS: [string, string][] = [
  ['#F8EEE2', '#EAD9C6'],
  ['#FBF2E9', '#EFDCCB'],
  ['#F2E6D9', '#E3CFB9'],
  ['#FAF3EB', '#ECDFD2'],
];

const SHADOW = '#38291F';

function Shine({ d, w = 2.2 }: { d: string; w?: number }) {
  return <path d={d} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={w} strokeLinecap="round" />;
}

function Ring({ gem }: { gem: boolean }) {
  return (
    <>
      <ellipse cx="100" cy="184" rx="52" ry="5" fill={SHADOW} fillOpacity=".08" />
      <ellipse cx="100" cy="124" rx="42" ry="46" fill="none" stroke="currentColor" strokeWidth="7" />
      <Shine d="M68 102 A42 46 0 0 1 100 78" />
      {gem ? (
        <g>
          <path d="M100 36 L119 58 L100 82 L81 58 Z" fill="#fff" fillOpacity=".9" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M81 58 H119 M100 36 L92 58 L100 82 L108 58 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeOpacity=".7" />
        </g>
      ) : (
        <g>
          <ellipse cx="100" cy="124" rx="35" ry="39" fill="none" stroke="currentColor" strokeWidth="1.6" strokeOpacity=".6" />
          <circle cx="100" cy="76" r="5" fill="currentColor" />
        </g>
      )}
    </>
  );
}

function Earring({ gem }: { gem: boolean }) {
  return (
    <g>
      <circle cx="64" cy="34" r="6" fill="currentColor" />
      <path d="M64 40 V68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 68 C42 92 42 126 64 138 C86 126 86 92 64 68 Z" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M52 96 C50 108 54 118 58 124" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="2.2" strokeLinecap="round" />
      {gem && <circle cx="64" cy="112" r="13" fill="#fff" fillOpacity=".95" stroke="currentColor" strokeWidth="2.5" />}
    </g>
  );
}

function Earrings({ gem }: { gem: boolean }) {
  return (
    <>
      <ellipse cx="100" cy="184" rx="60" ry="5" fill={SHADOW} fillOpacity=".08" />
      <Earring gem={gem} />
      <g transform="translate(72 0)">
        <Earring gem={gem} />
      </g>
    </>
  );
}

function Necklace({ gem }: { gem: boolean }) {
  const chain = 'M26 34 C34 150 166 150 174 34';
  return (
    <>
      <ellipse cx="100" cy="186" rx="40" ry="5" fill={SHADOW} fillOpacity=".08" />
      <path d={chain} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d={chain} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 9" />
      <path d="M100 117 V132" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M100 132 C84 148 84 164 100 172 C116 164 116 148 100 132 Z" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round" />
      {gem && <circle cx="100" cy="155" r="6.5" fill="#fff" fillOpacity=".95" stroke="currentColor" strokeWidth="2" />}
    </>
  );
}

function Bracelet({ gem }: { gem: boolean }) {
  return (
    <>
      <ellipse cx="100" cy="180" rx="62" ry="6" fill={SHADOW} fillOpacity=".08" />
      <ellipse cx="100" cy="102" rx="68" ry="44" fill="none" stroke="currentColor" strokeWidth="7" />
      <ellipse cx="100" cy="102" rx="59" ry="35" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity=".55" />
      <Shine d="M48 84 C60 66 84 58 108 58" />
      {gem && (
        <g>
          {[
            [62, 134, 6],
            [82, 143, 6],
            [104, 146, 7],
            [126, 143, 6],
            [146, 134, 6],
          ].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r={r} fill="#fff" fillOpacity=".95" stroke="currentColor" strokeWidth="2" />
          ))}
        </g>
      )}
    </>
  );
}

function Anklet() {
  const chain = 'M18 70 C50 124 82 124 100 98 C118 72 150 72 182 118';
  return (
    <>
      <ellipse cx="100" cy="176" rx="60" ry="5" fill={SHADOW} fillOpacity=".08" />
      <path d={chain} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d={chain} fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeDasharray="0.1 9" />
      <path d="M100 112 V120" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M100 150 C84 136 80 124 88 118 C94 114 100 117 100 123 C100 117 106 114 112 118 C120 124 116 136 100 150 Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
    </>
  );
}

function Piercing({ gem }: { gem: boolean }) {
  return (
    <>
      <ellipse cx="100" cy="176" rx="48" ry="5" fill={SHADOW} fillOpacity=".08" />
      <circle cx="100" cy="100" r="46" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeDasharray="256 33" transform="rotate(-62 100 100)" />
      <circle cx="107" cy="54.5" r="9" fill="#fff" fillOpacity=".95" stroke="currentColor" strokeWidth="3" />
      <Shine d="M66 70 C72 62 80 57 88 55" w={2} />
      {gem && (
        <g>
          <circle cx="158" cy="154" r="11" fill="#fff" fillOpacity=".92" stroke="currentColor" strokeWidth="3" />
          <circle cx="158" cy="154" r="4" fill="currentColor" fillOpacity=".5" />
        </g>
      )}
    </>
  );
}

function Kit() {
  return (
    <>
      <ellipse cx="100" cy="184" rx="66" ry="5" fill={SHADOW} fillOpacity=".08" />
      <rect x="46" y="112" width="108" height="66" rx="5" fill="#fff" fillOpacity=".55" stroke="currentColor" strokeWidth="4" />
      <rect x="38" y="88" width="124" height="26" rx="5" fill="#fff" fillOpacity=".75" stroke="currentColor" strokeWidth="4" />
      <path d="M100 88 V178" stroke="currentColor" strokeWidth="4" />
      <path d="M100 88 C78 52 54 66 76 84 Z M100 88 C122 52 146 66 124 84 Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round" />
      <circle cx="100" cy="88" r="6" fill="currentColor" />
    </>
  );
}

const SHAPES: Record<ArtCat, { width: string; label: string; render: (gem: boolean) => ReactElement }> = {
  aneis: { width: '76%', label: 'Ilustração de anel', render: (g) => <Ring gem={g} /> },
  brincos: { width: '78%', label: 'Ilustração de brincos', render: (g) => <Earrings gem={g} /> },
  colares: { width: '80%', label: 'Ilustração de colar', render: (g) => <Necklace gem={g} /> },
  pulseiras: { width: '80%', label: 'Ilustração de pulseira', render: (g) => <Bracelet gem={g} /> },
  tornozeleiras: { width: '82%', label: 'Ilustração de tornozeleira', render: () => <Anklet /> },
  piercings: { width: '70%', label: 'Ilustração de piercing', render: (g) => <Piercing gem={g} /> },
  kit: { width: '74%', label: 'Ilustração de kit presente', render: () => <Kit /> },
};

export function Art({ cat = 'aneis', tone = 'gold', gem = true, bg = 0, rot = 0, ratio = '1 / 1' }: ArtComponentProps) {
  const i = (Number(bg) || 0) % 4;
  const [a, b] = BGS[i];
  const shape = SHAPES[cat] ?? SHAPES.aneis;
  const style: CSSProperties = {
    aspectRatio: ratio,
    background: `radial-gradient(120% 95% at 28% 18%, var(--artA${i}, ${a}), var(--artB${i}, ${b}))`,
  };
  return (
    <div className="art" style={style}>
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={shape.label}
        style={{ width: shape.width, color: TONES[tone], transform: `rotate(${rot}deg)` }}
      >
        {shape.render(gem)}
      </svg>
    </div>
  );
}
