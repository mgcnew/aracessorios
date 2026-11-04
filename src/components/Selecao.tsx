'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

/*
 * Menu de seleção no tema da marca, no lugar do <select> nativo: a lista aberta do
 * navegador não aceita CSS (caixa quadrada, realce azul do sistema). Segue o padrão
 * "combobox só de seleção" (WAI-ARIA): abre com clique, Enter, Espaço ou setas;
 * ↑/↓/Home/End navegam; letras procuram; Enter escolhe; Esc fecha e devolve o foco.
 * Funciona dentro de <label> (o rótulo vira o nome acessível) e nas duas áreas (.ar e .adm).
 */
export interface OpcaoSelecao<V extends string> {
  value: V;
  label: string;
}

export function Selecao<V extends string>({
  value,
  opcoes,
  onChange,
  className = '',
  placeholder = 'Escolha…',
  disabled = false,
  'aria-label': ariaLabel,
}: {
  value: V | '';
  opcoes: readonly OpcaoSelecao<V>[];
  onChange: (v: V) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  const id = useId();
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const busca = useRef({ texto: '', ate: 0 });
  const [aberta, setAberta] = useState(false);
  const [ativa, setAtiva] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);

  const atual = opcoes.find((o) => o.value === value);
  const idxAtual = Math.max(0, opcoes.findIndex((o) => o.value === value));

  const posicionar = useCallback(() => {
    const b = botao.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const abaixo = window.innerHeight - r.bottom - 12;
    const acima = r.top - 12;
    const width = Math.max(r.width, 200);
    const left = Math.min(r.left, window.innerWidth - width - 8);
    // Abre para cima quando não cabe embaixo (ex.: perto da barra de baixo no celular).
    if (abaixo < 220 && acima > abaixo) setPos({ left, width, bottom: window.innerHeight - r.top + 6, maxHeight: Math.min(320, acima) });
    else setPos({ left, width, top: r.bottom + 6, maxHeight: Math.min(320, abaixo) });
  }, []);

  const abrir = (indice = idxAtual) => {
    if (disabled) return;
    posicionar();
    setAtiva(indice);
    setAberta(true);
  };
  const fechar = (devolverFoco = true) => {
    setAberta(false);
    if (devolverFoco) botao.current?.focus();
  };
  const escolher = (i: number) => {
    const o = opcoes[i];
    if (o && o.value !== value) onChange(o.value);
    fechar();
  };

  useLayoutEffect(() => {
    if (!aberta) return;
    lista.current?.focus({ preventScroll: true });
  }, [aberta]);

  // Mantém a opção ativa à vista dentro da lista.
  useEffect(() => {
    if (!aberta) return;
    lista.current?.querySelector<HTMLElement>(`[data-i="${ativa}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [aberta, ativa]);

  // Fecha ao tocar fora; acompanha rolagem e mudança de tamanho da página.
  useEffect(() => {
    if (!aberta) return;
    const fora = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!lista.current?.contains(t) && !botao.current?.contains(t)) fechar(false);
    };
    const mover = (e: Event) => {
      if (lista.current?.contains(e.target as Node)) return;
      posicionar();
    };
    document.addEventListener('pointerdown', fora, true);
    window.addEventListener('scroll', mover, true);
    window.addEventListener('resize', mover);
    return () => {
      document.removeEventListener('pointerdown', fora, true);
      window.removeEventListener('scroll', mover, true);
      window.removeEventListener('resize', mover);
    };
  }, [aberta, posicionar]);

  const procurar = (tecla: string) => {
    const agora = Date.now();
    const b = busca.current;
    b.texto = (agora < b.ate ? b.texto : '') + tecla.toLowerCase();
    b.ate = agora + 700;
    const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const alvo = norm(b.texto);
    const inicio = aberta ? ativa : idxAtual;
    const ordem = [...opcoes.keys()].map((k) => (inicio + (b.texto.length === 1 ? 1 : 0) + k) % opcoes.length);
    return ordem.find((i) => norm(opcoes[i].label).startsWith(alvo)) ?? ordem.find((i) => norm(opcoes[i].label).includes(alvo));
  };

  const teclaBotao = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      abrir(e.key === 'ArrowUp' ? Math.max(0, idxAtual - 1) : idxAtual);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const i = procurar(e.key);
      if (i !== undefined && opcoes[i].value !== value) onChange(opcoes[i].value);
    }
  };

  const teclaLista = (e: KeyboardEvent<HTMLUListElement>) => {
    const ultimo = opcoes.length - 1;
    if (e.key === 'ArrowDown') setAtiva((a) => Math.min(ultimo, a + 1));
    else if (e.key === 'ArrowUp') setAtiva((a) => Math.max(0, a - 1));
    else if (e.key === 'Home') setAtiva(0);
    else if (e.key === 'End') setAtiva(ultimo);
    else if (e.key === 'PageDown') setAtiva((a) => Math.min(ultimo, a + 8));
    else if (e.key === 'PageUp') setAtiva((a) => Math.max(0, a - 8));
    else if (e.key === 'Enter' || e.key === ' ') escolher(ativa);
    else if (e.key === 'Escape') fechar();
    else if (e.key === 'Tab') {
      fechar(false);
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const i = procurar(e.key);
      if (i !== undefined) setAtiva(i);
    } else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        ref={botao}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberta}
        aria-controls={aberta ? `${id}-l` : undefined}
        aria-label={ariaLabel}
        className={`selecao ${className}`}
        disabled={disabled}
        onClick={() => (aberta ? fechar() : abrir())}
        onKeyDown={teclaBotao}
      >
        <span className={`selecao-v${atual ? '' : ' vazio'}`}>{atual?.label ?? placeholder}</span>
        <svg className="selecao-seta" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {aberta && pos && (
        <ul
          ref={lista}
          id={`${id}-l`}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={`${id}-o${ativa}`}
          className={`selecao-lista${pos.bottom !== undefined ? ' cima' : ''}`}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          onKeyDown={teclaLista}
          // Dentro de <label>, o clique numa opção "clicaria" o botão de novo e reabriria a lista.
          onClick={(e) => e.preventDefault()}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget !== botao.current) setAberta(false);
          }}
        >
          {opcoes.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-o${i}`}
              data-i={i}
              role="option"
              aria-selected={o.value === value}
              className={i === ativa ? 'ativa' : undefined}
              onPointerMove={() => i !== ativa && setAtiva(i)}
              onClick={() => escolher(i)}
            >
              <span>{o.label}</span>
              {o.value === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
