'use client';

import { useEffect, useRef, useState } from 'react';
import { CompartilharIcon } from './Icons';
import { useInstalar } from './useInstalar';

/** "Instalar aplicativo" no rodapé da loja. Só aparece quando o aparelho permite instalar e ainda não instalou. */
export function InstalarApp() {
  const { podeInstalar, ios, instalar } = useInstalar();
  const [passos, setPassos] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (passos && d && !d.open) d.showModal();
  }, [passos]);

  if (!podeInstalar && !ios) return null;
  return (
    <>
      <button className="lnk" onClick={podeInstalar ? () => void instalar() : () => setPassos(true)}>
        Instalar aplicativo
      </button>
      {passos && (
        <dialog ref={ref} className="inst-dlg" onClose={() => setPassos(false)} aria-labelledby="inst-t">
          <h2 id="inst-t">Instalar no iPhone</h2>
          <ol>
            <li>
              Abra esta página no <strong>Safari</strong>.
            </li>
            <li>
              Toque em <strong>Compartilhar</strong> <CompartilharIcon className="inst-ic" /> na barra do Safari.
            </li>
            <li>
              Escolha <strong>“Adicionar à Tela de Início”</strong> e toque em <strong>Adicionar</strong>.
            </li>
          </ol>
          <button className="btn btn-p" onClick={() => ref.current?.close()}>
            Entendi
          </button>
        </dialog>
      )}
    </>
  );
}
