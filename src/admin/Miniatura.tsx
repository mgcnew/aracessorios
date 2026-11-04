'use client';

import { useEffect, useRef, useState } from 'react';
import { CrossIcon, GemIcon, SetaIcon } from '../components/Icons';
import { urlFoto } from '../lib/fotos';
import type { FotoZoom } from './produtos';

/**
 * Miniatura da foto do produto nas listas do painel. Clicar abre a foto grande (zoom):
 * toque ou clique alterna a ampliação; com várias fotos, setas e teclado passam entre elas.
 */
export function Miniatura({ fotos, nome }: { fotos: FotoZoom[]; nome: string }) {
  const [aberta, setAberta] = useState(false);
  const capa = fotos[0];
  if (!capa) {
    return (
      <span className="mini mini-vazia" role="img" aria-label="Sem foto">
        <GemIcon size={20} />
      </span>
    );
  }
  return (
    <>
      <button type="button" className="mini" onClick={() => setAberta(true)} aria-label={`Ampliar foto de ${nome}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlFoto(capa.caminho, 'p')} alt="" loading="lazy" decoding="async" />
      </button>
      {aberta && <Ampliada fotos={fotos} nome={nome} fechar={() => setAberta(false)} />}
    </>
  );
}

function Ampliada({ fotos, nome, fechar }: { fotos: FotoZoom[]; nome: string; fechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = fotos.length;
  const foto = fotos[i];

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const ir = (passo: number) => {
    setZoom(false);
    setI((x) => (x + passo + n) % n);
  };

  return (
    <dialog
      ref={ref}
      className="dlg dlg-foto"
      aria-label={`Foto de ${nome}`}
      onClose={fechar}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      onKeyDown={(e) => {
        if (n > 1 && e.key === 'ArrowLeft') ir(-1);
        if (n > 1 && e.key === 'ArrowRight') ir(1);
      }}
    >
      <div className="foto-topo">
        <span className="foto-nome">
          {nome}
          {n > 1 && <span className="note"> · {i + 1} de {n}</span>}
        </span>
        <button type="button" className="pill" onClick={() => ref.current?.close()} aria-label="Fechar" autoFocus>
          <CrossIcon size={16} />
        </button>
      </div>
      <div className={`foto-palco${zoom ? ' ampliada' : ''}`}>
        <button
          type="button"
          className="foto-zoom"
          onClick={() => setZoom((z) => !z)}
          aria-label={zoom ? 'Reduzir foto' : 'Ampliar foto'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlFoto(foto.caminho)} alt={foto.alt || nome} decoding="async" />
        </button>
      </div>
      {n > 1 && (
        <div className="foto-nav">
          <button type="button" className="pill" onClick={() => ir(-1)} aria-label="Foto anterior">
            <SetaIcon dir="esq" size={16} />
          </button>
          <button type="button" className="pill" onClick={() => ir(1)} aria-label="Próxima foto">
            <SetaIcon size={16} />
          </button>
        </div>
      )}
    </dialog>
  );
}
