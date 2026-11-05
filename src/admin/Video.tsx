'use client';

import { useRef, useState } from 'react';
import { apagarVideo } from '../app/admin/video-acoes';
import { urlVideo } from '../lib/fotos';
import { confirmar } from './confirmar';
import { enviarVideo } from './enviar-video';
import { useAcao } from './Produtos';
import type { CatalogoPainel, ProdutoPainel } from './produtos';
import { DURACAO_MAX_S, mb, suportaVideo } from './video';

/** Vídeo curto do produto: um por produto, sem som, comprimido no navegador antes do envio. */
export function Video({ p, aoMudar }: { p: ProdutoPainel; aoMudar: (c: CatalogoPainel) => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const acao = useAcao();
  const ocupado = progresso !== null || acao.pendente;
  const v = p.video;

  async function enviar(arquivo: File) {
    setErro(null);
    setResultado(null);
    try {
      const r = await enviarVideo(arquivo, p.id, setProgresso);
      aoMudar(r.catalogo);
      setResultado(`Vídeo pronto: de ${mb(r.antes)} para ${mb(r.depois)}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErro(/row-level security|Unauthorized|403/i.test(msg) ? 'Sem permissão. Entre de novo com a conta da loja.' : /relation|schema cache|does not exist|Bucket not found/i.test(msg) ? 'O armazenamento de vídeos ainda não existe no banco. Aplique supabase/migrations/20261105100000_video_produto.sql no SQL Editor.' : msg);
    } finally {
      setProgresso(null);
    }
  }

  return (
    <section className="card">
      <div className="card-h">
        <h2>Vídeo</h2>
        <button className="btn auth-btn" disabled={ocupado} onClick={() => entrada.current?.click()}>
          {progresso ?? (v ? 'Trocar vídeo' : 'Adicionar vídeo')}
        </button>
        <input
          ref={entrada}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/*"
          hidden
          onChange={(e) => {
            const arq = e.target.files?.[0];
            e.target.value = '';
            if (arq) void enviar(arq);
          }}
        />
      </div>
      <p className="note" style={{ marginBottom: 10 }}>
        Até {DURACAO_MAX_S} segundos, um por produto. O vídeo é comprimido aqui antes do envio e fica sem som, para ser leve. Na loja ele aparece por último na galeria e toca sozinho quando a pessoa chega nele.
        {!suportaVideo() && ' Este navegador não consegue preparar vídeos: use o Chrome, Edge ou Safari atualizados.'}
      </p>
      {erro && (
        <p className="auth-err" role="alert">
          {erro}
        </p>
      )}
      {acao.erro && (
        <p className="auth-err" role="alert">
          {acao.erro}
        </p>
      )}
      {resultado && (
        <p className="ok-msg" role="status">
          {resultado}
        </p>
      )}
      {v ? (
        <div className="video-i">
          <video src={urlVideo(v.storage_path)} poster={urlVideo(v.poster_path)} controls muted playsInline preload="none" aria-label={`Vídeo de ${p.name}`} />
          <div className="video-meta">
            <span className="note">
              {Math.round(v.duration_ms / 1000)} s · {mb(v.size_bytes)}
            </span>
            <button
              className="pill neg"
              disabled={ocupado}
              onClick={async () => {
                if (!(await confirmar({ titulo: 'Apagar o vídeo deste produto?', texto: 'O arquivo é apagado. Para ter de novo, envie outro.', confirmar: 'Apagar vídeo', perigo: true }))) return;
                acao.rodar(
                  () => apagarVideo(p.id),
                  (c) => {
                    aoMudar(c);
                    if (c.aviso) acao.setErro(c.aviso);
                  },
                );
              }}
            >
              Apagar vídeo
            </button>
          </div>
        </div>
      ) : (
        <p className="sub">Sem vídeo ainda.</p>
      )}
    </section>
  );
}
