import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, rest: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  'aria-hidden': true,
  ...rest,
});

export const SearchIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

export const HeartIcon = ({ size = 22, filled = false, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'} strokeLinejoin="round">
    <path d="M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z" />
  </svg>
);

export const BagIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6.5a3 3 0 016 0V8" />
  </svg>
);

export const SunIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
);

export const MoonIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
  </svg>
);

export const MinusIcon = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeWidth={1.8} strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>
);

export const PlusIcon = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeWidth={1.8} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const FilterIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round">
    <path d="M4 7h16M7 12h10M10 17h4" />
  </svg>
);

export const TrashIcon = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export const HomeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M3.5 11L12 3.5 20.5 11M5.5 9.5V20h4.5v-6h4v6h4.5V9.5" />
  </svg>
);

export const GemIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M6.5 4h11l4 5.5L12 20.5 2.5 9.5z M2.5 9.5h19 M9 4l3 5.5L15 4 M12 9.5v11" />
  </svg>
);

export const InfoIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.01" />
  </svg>
);

export const CheckIcon = ({ size = 12, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const CrossIcon = ({ size = 12, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeWidth={3} strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// Painel: navegação no celular ----------------------------------------------------
export const PainelIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round">
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="5" rx="1.5" />
    <rect x="13" y="11" width="7" height="9" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

export const CaixaIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
    <path d="M4 8l8 4 8-4M12 12v8" />
  </svg>
);

export const EtiquetaIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round">
    <path d="M4 12.5V5a1 1 0 011-1h7.5L20 11.5 12.5 19 4 12.5z" />
    <circle cx="8.5" cy="8.5" r="1.4" />
  </svg>
);

export const PedidoIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

export const MaisIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const VoltarIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const SetaIcon = ({ size = 18, dir = 'dir', ...p }: IconProps & { dir?: 'esq' | 'dir' }) => (
  <svg {...base(size, p)} strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'dir' ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'} />
  </svg>
);

export const ExternoIcon = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h4" />
  </svg>
);

export const PresenteIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M4 11h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1zM3 7.5h18V11H3zM12 7.5V21M12 7.5C10.5 4 7 3.8 7 5.8 7 7.2 9.5 7.5 12 7.5zM12 7.5c1.5-3.5 5-3.7 5-1.7 0 1.4-2.5 1.7-5 1.7z" />
  </svg>
);

export const ConversaIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinejoin="round" strokeLinecap="round">
    <path d="M20 12a7.5 7.5 0 01-10.9 6.7L4 20l1.4-4.4A7.5 7.5 0 1120 12z" />
    <path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" strokeWidth={2.2} />
  </svg>
);

export const SinoIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 16.5V11a6 6 0 1112 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 004 0" />
  </svg>
);

/** O ícone "Compartilhar" do Safari (caixa com seta para cima), usado no passo a passo de instalar o painel. */
export const CompartilharIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V4M8.5 7.5L12 4l3.5 3.5M7 10.5H6a1.5 1.5 0 00-1.5 1.5v6.5A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5V12A1.5 1.5 0 0018 10.5h-1" />
  </svg>
);
