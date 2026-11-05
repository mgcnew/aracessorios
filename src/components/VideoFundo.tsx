'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Vídeo decorativo da vitrine (destaque, kits, embalagem, sobre): mudo, em repetição, toca sozinho assim que carrega.
 * A repetição é feita aqui (sem o `loop` do navegador): nos últimos instantes o vídeo esmaece até a capa e volta suave do começo,
 * em vez de saltar do último quadro para o primeiro.
 * Com economia de dados ou movimento reduzido ligados, fica só a capa (e um botão de play). Pausa quando sai da tela.
 */
/** Duração do esmaecer, em segundos (igual à transição de `.vfundo video` no CSS). */
const FADE_S = 0.7;

export function VideoFundo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [parado, setParado] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const poupar = conexao?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (poupar) {
      setParado(true);
      return;
    }
    // Confere o tempo a cada quadro: o evento timeupdate é lento demais para começar o esmaecer na hora certa.
    let quadro = 0;
    const vigiar = () => {
      if (v.duration > 2 && v.duration - v.currentTime <= FADE_S) setSaindo(true);
      quadro = requestAnimationFrame(vigiar);
    };
    const comecou = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(vigiar);
    };
    const parou = () => cancelAnimationFrame(quadro);
    const terminou = () => {
      parou();
      v.currentTime = 0;
      v.play().catch(() => setParado(true));
    };
    const voltou = () => setSaindo(false);
    v.addEventListener('playing', comecou);
    v.addEventListener('pause', parou);
    v.addEventListener('ended', terminou);
    v.addEventListener('seeked', voltou);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => setParado(true));
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => {
      io.disconnect();
      parou();
      v.removeEventListener('playing', comecou);
      v.removeEventListener('pause', parou);
      v.removeEventListener('ended', terminou);
      v.removeEventListener('seeked', voltou);
    };
  }, []);

  return (
    <div className="vfundo" style={{ backgroundImage: `url("${poster}")` }}>
      <video ref={ref} className={saindo ? 'saindo' : undefined} src={src} poster={poster} muted playsInline preload="metadata" aria-label={alt} onPlaying={() => setParado(false)} />
      {parado && (
        <button className="vslide-play" onClick={() => void ref.current?.play()} aria-label="Tocar vídeo">
          <span aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
