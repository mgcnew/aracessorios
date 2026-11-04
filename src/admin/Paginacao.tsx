'use client';

import { SetaIcon } from '../components/Icons';
import { POR_PAGINA } from './produtos';

/** Navegação entre páginas das listas do painel (estoque, produtos). */
export function Paginacao({
  pagina,
  total,
  ir,
  carregando,
  rotulo,
}: {
  pagina: number;
  total: number;
  ir: (p: number) => void;
  carregando?: boolean;
  /** Ex.: "variações", "produtos". */
  rotulo: string;
}) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (total === 0) return null;
  const de = (pagina - 1) * POR_PAGINA + 1;
  const ate = Math.min(total, pagina * POR_PAGINA);
  return (
    <nav className="pag" aria-label={`Páginas de ${rotulo}`}>
      <span className="pag-info" aria-live="polite">
        {de}–{ate} de {total} {rotulo}
      </span>
      {paginas > 1 && (
        <span className="pag-bts">
          <button className="pill" disabled={pagina <= 1 || carregando} onClick={() => ir(pagina - 1)} aria-label="Página anterior">
            <SetaIcon dir="esq" size={16} />
          </button>
          <span className="pag-n">
            {pagina} / {paginas}
          </span>
          <button className="pill" disabled={pagina >= paginas || carregando} onClick={() => ir(pagina + 1)} aria-label="Próxima página">
            <SetaIcon size={16} />
          </button>
        </span>
      )}
    </nav>
  );
}
