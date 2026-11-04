import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import logoClaro from '../assets/logo-ar-claro.png';
import logoEscuro from '../assets/logo-ar-escuro.png';
import { MinusIcon, PlusIcon } from './Icons';

/**
 * Logo oficial da marca (D-004), sem redesenho: a mesma arte com o fundo preto tirado,
 * como nas embalagens. Dourado mais fundo no claro (dourado sobre creme) e o dourado
 * original no escuro. Arquivos gerados de docs/assets/logo_ar_original.jpg.
 */
export function LogoMark() {
  return (
    <span className="logo-img">
      <Image className="logo-claro" src={logoClaro} alt="AR Acessórios" sizes="72px" priority />
      <Image className="logo-escuro" src={logoEscuro} alt="" aria-hidden="true" sizes="72px" priority />
    </span>
  );
}

export function SectionHead({ title, id, action }: { title: string; id: string; action?: ReactNode }) {
  return (
    <div className="sec-h">
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  );
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-h">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, text, action, style }: { icon?: ReactNode; title: string; text: string; action: ReactNode; style?: CSSProperties }) {
  return (
    <div className="empty" style={style}>
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Stepper({
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
  label,
  live,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button onClick={onDec} aria-label="Diminuir quantidade" disabled={decDisabled}>
        <MinusIcon />
      </button>
      <span aria-live={live ? 'polite' : undefined}>{value}</span>
      <button onClick={onInc} aria-label="Aumentar quantidade" disabled={incDisabled}>
        <PlusIcon />
      </button>
    </div>
  );
}
