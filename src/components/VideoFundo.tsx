'use client';

import { useEffect, useRef, useState } from 'react';

/** Duração da fusão entre o fim de uma volta e o começo da próxima, em segundos (igual a `.entra` no CSS). */
const FUSAO_S = 1.2;

/**
 * Vídeo decorativo da vitrine (destaque, kits, embalagem, sobre): mudo, em repetição, toca sozinho assim que carrega.
 * A repetição não usa o `loop` do navegador (que salta do último quadro para o primeiro): são dois vídeos iguais empilhados.
 * Perto do fim, o segundo começa do início e se dissolve por cima do primeiro; quando está opaco, o primeiro volta ao começo
 * e espera a vez. O arquivo é o mesmo e baixa uma vez só.
 * Com economia de dados ou movimento reduzido ligados, fica só a capa (e um botão de play). Pausa quando sai da tela.
 */
export function VideoFundo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const [parado, setParado] = useState(false);

  useEffect(() => {
    const a = refA.current;
    const b = refB.current;
    if (!a || !b) return;
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const poupar = conexao?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (poupar) {
      setParado(true);
      return;
    }

    let atual = a; // o que está à vista
    let proximo = b; // o que espera, parado no primeiro quadro
    let fundindo = false;
    let visivel = false;
    let quadro = 0;
    let fim = 0;

    const vigiar = () => {
      const d = atual.duration;
      if (!fundindo && d > FUSAO_S * 3 && d - atual.currentTime <= FUSAO_S) fundir();
      quadro = requestAnimationFrame(vigiar);
    };
    const parar = () => cancelAnimationFrame(quadro);

    function fundir() {
      fundindo = true;
      const entra = proximo;
      const sai = atual;
      entra.style.zIndex = '2';
      sai.style.zIndex = '1';
      entra.classList.add('entra');
      entra.classList.add('on');
      entra.currentTime = 0;
      entra.play().catch(() => setParado(true));
      // Só some o que saiu quando o que entrou já cobre tudo (assim a imagem nunca fica translúcida).
      fim = window.setTimeout(() => {
        sai.pause();
        sai.classList.remove('entra', 'on');
        sai.currentTime = 0;
        atual = entra;
        proximo = sai;
        fundindo = false;
      }, FUSAO_S * 1000 + 80);
    }

    // Sem fusão possível (vídeo muito curto ou aba em segundo plano): volta ao início como o `loop` comum.
    const terminou = (ev: Event) => {
      if (ev.target !== atual || fundindo) return;
      atual.currentTime = 0;
      atual.play().catch(() => setParado(true));
    };
    const tocando = () => {
      parar();
      quadro = requestAnimationFrame(vigiar);
      // O segundo só começa a baixar quando o primeiro já está tocando.
      b.preload = 'auto';
    };
    a.addEventListener('playing', tocando);
    b.addEventListener('playing', tocando);
    a.addEventListener('ended', terminou);
    b.addEventListener('ended', terminou);

    const io = new IntersectionObserver(
      ([e]) => {
        visivel = e.isIntersecting;
        if (visivel) {
          atual.play().catch(() => setParado(true));
          if (fundindo) proximo.play().catch(() => undefined);
        } else {
          a.pause();
          b.pause();
          parar();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(a);
    return () => {
      io.disconnect();
      parar();
      window.clearTimeout(fim);
      a.removeEventListener('playing', tocando);
      b.removeEventListener('playing', tocando);
      a.removeEventListener('ended', terminou);
      b.removeEventListener('ended', terminou);
    };
  }, []);

  return (
    <div className="vfundo" style={{ backgroundImage: `url("${poster}")` }}>
      <video ref={refA} className="on" src={src} poster={poster} muted playsInline preload="metadata" aria-label={alt} onPlaying={() => setParado(false)} />
      <video ref={refB} src={src} poster={poster} muted playsInline preload="none" aria-hidden="true" tabIndex={-1} />
      {parado && (
        <button className="vslide-play" onClick={() => void refA.current?.play()} aria-label="Tocar vídeo">
          <span aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
