'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * Confirmação e aviso no tema do painel, no lugar de window.confirm/alert
 * (caixas do navegador, sempre claras e com o endereço do site no título).
 * Uso: `if (await confirmar({ titulo: 'Apagar esta foto?' })) …`.
 * Precisa de <Confirmacoes /> montado dentro de `.adm` (feito em Admin.tsx).
 */
interface Pedido {
  titulo: string;
  texto?: string;
  confirmar?: string;
  perigo?: boolean;
  soAviso?: boolean;
}

let abrir: ((p: Pedido, resolver: (ok: boolean) => void) => void) | null = null;

export function confirmar(p: Pedido): Promise<boolean> {
  return new Promise((resolver) => {
    if (abrir) abrir(p, resolver);
    else resolver(window.confirm(p.texto ? `${p.titulo}\n\n${p.texto}` : p.titulo));
  });
}

export function avisar(titulo: string, texto?: string): Promise<void> {
  return confirmar({ titulo, texto, soAviso: true, confirmar: 'Entendi' }).then(() => undefined);
}

export function Confirmacoes() {
  const ref = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    abrir = (p, r) => {
      resolver.current?.(false);
      resolver.current = r;
      setPedido(p);
    };
    return () => {
      abrir = null;
    };
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (pedido && d && !d.open) d.showModal();
  }, [pedido]);

  const fim = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      className="dlg dlg-conf"
      role="alertdialog"
      aria-labelledby="conf-t"
      aria-describedby={pedido?.texto ? 'conf-x' : undefined}
      onClose={() => {
        // Esc ou fechar por fora conta como "Cancelar".
        resolver.current?.(false);
        resolver.current = null;
        setPedido(null);
      }}
    >
      {pedido && (
        <>
          <h2 id="conf-t">{pedido.titulo}</h2>
          {pedido.texto && <p id="conf-x">{pedido.texto}</p>}
          <div className="conf-acoes">
            {!pedido.soAviso && (
              <button className="btn" onClick={() => fim(false)} autoFocus>
                Cancelar
              </button>
            )}
            <button
              className={`btn ${pedido.perigo ? 'btn-perigo-cheio' : 'auth-btn'}`}
              onClick={() => fim(true)}
              autoFocus={pedido.soAviso}
            >
              {pedido.confirmar ?? 'Confirmar'}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
