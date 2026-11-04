'use client';

import { useEffect, useRef, useState } from 'react';
import { apagarFoto, definirCapa, ordenarFotos, vincularMidia, salvarAlt } from '../app/admin/fotos-acoes';
import { urlFoto } from '../lib/fotos';
import { enviarParaBiblioteca } from './enviar-foto';
import { Biblioteca } from './Biblioteca';
import { useAcao } from './Produtos';
import type { CatalogoPainel, FotoPainel, ProdutoPainel } from './produtos';
import { confirmar } from './confirmar';
import { SetaIcon } from '../components/Icons';

const MAX_FOTOS = 12;

export function Fotos({ p, aoMudar }: { p: ProdutoPainel; aoMudar: (c: CatalogoPainel) => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [biblioteca, setBiblioteca] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string[]>([]);
  const acao = useAcao();
  const ocupado = progresso !== null || acao.pendente;
  const cabe = MAX_FOTOS - p.fotos.length;

  async function enviar(arquivos: File[]) {
    setErroEnvio([]);
    if (arquivos.length > cabe) {
      setErroEnvio([`Cabem mais ${cabe} foto(s) neste produto (máximo de ${MAX_FOTOS}).`]);
      arquivos = arquivos.slice(0, Math.max(0, cabe));
    }
    const erros: string[] = [];
    for (const [i, arq] of arquivos.entries()) {
      const n = arquivos.length > 1 ? ` ${i + 1} de ${arquivos.length}` : '';
      try {
        const midiaId = await enviarParaBiblioteca(arq, p.name, texto => setProgresso(`${texto}${n}`));
        const r = await vincularMidia(p.id, midiaId);
        if (!r.ok) throw new Error(`${r.erro} A foto está guardada na biblioteca.`);
        aoMudar(r.dados);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        erros.push(/row-level security|Unauthorized|403/i.test(msg) ? `${arq.name}: sem permissão. Entre de novo com a conta da loja.` : `${arq.name}: ${msg}`);
      }
    }
    setProgresso(null);
    setErroEnvio(erros);
  }

  const mover = (i: number, d: -1 | 1) => {
    const ids = p.fotos.map((f) => f.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    acao.rodar(() => ordenarFotos(p.id, ids), aoMudar);
  };

  return (
    <section className="card">
      <div className="card-h">
        <h2>Fotos</h2>
        <button className="btn auth-btn" disabled={ocupado || cabe <= 0} onClick={() => entrada.current?.click()}>
          {progresso ?? 'Adicionar fotos'}
        </button>
        <button className="pill" disabled={ocupado || cabe <= 0} onClick={() => setBiblioteca(true)}>Escolher da biblioteca</button>
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
          multiple
          hidden
          onChange={(e) => {
            const arquivos = [...(e.target.files ?? [])];
            e.target.value = '';
            if (arquivos.length) void enviar(arquivos);
          }}
        />
      </div>
      <p className="note" style={{ marginBottom: 10 }}>
        A primeira é a capa (cartões e sacola). As fotos são reduzidas antes do envio e perdem os dados escondidos, como a localização.
        Foto quadrada ou em pé (4:5) fica melhor nos cartões.
      </p>

      {biblioteca && <EscolherFoto fechar={() => setBiblioteca(false)} p={p} aoMudar={aoMudar} />}
      {erroEnvio.length > 0 && (
        <div className="auth-err" role="alert">
          {erroEnvio.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
      {acao.erro && (
        <p className="auth-err" role="alert">
          {acao.erro}
        </p>
      )}

      {p.fotos.length === 0 ? (
        <p className="sub" style={{ marginTop: 10 }}>
          Sem fotos ainda: a loja mostra uma ilustração no lugar.
        </p>
      ) : (
        <ul className="fotos">
          {p.fotos.map((f, i) => (
            <FotoItem
              key={f.id}
              f={f}
              i={i}
              total={p.fotos.length}
              ocupado={ocupado}
              mover={mover}
              capa={() => acao.rodar(() => definirCapa(f.id), aoMudar)}
              apagar={async () => {
                if (await confirmar({ titulo: 'Retirar foto do produto?', texto: 'Ela sai deste produto e continua guardada na biblioteca.', confirmar: 'Retirar foto' }))
                  acao.rodar(
                    () => apagarFoto(f.id),
                    (c) => {
                      aoMudar(c);
                      if (c.aviso) acao.setErro(c.aviso);
                    },
                  );
              }}
              aoMudar={aoMudar}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FotoItem({
  f,
  i,
  total,
  ocupado,
  mover,
  capa,
  apagar,
  aoMudar,
}: {
  f: FotoPainel;
  i: number;
  total: number;
  ocupado: boolean;
  mover: (i: number, d: -1 | 1) => void;
  capa: () => void;
  apagar: () => void;
  aoMudar: (c: CatalogoPainel) => void;
}) {
  const [alt, setAlt] = useState(f.alt);
  const { pendente, erro, feito, rodar } = useAcao();

  return (
    <li className="foto-i">
      <div className="art foto" style={{ aspectRatio: '1 / 1' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlFoto(f.storage_path, 'p')} alt={f.alt} loading="lazy" />
        {f.is_cover && <span className="tag t-ok foto-capa">Capa</span>}
      </div>
      <form
        className="foto-alt"
        onSubmit={(e) => {
          e.preventDefault();
          rodar(() => salvarAlt(f.id, alt), aoMudar, 'Descrição salva.');
        }}
      >
        <label className="auth-l">
          Descrição da foto
          <input className="auth-i" value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} />
        </label>
        {alt.trim() !== f.alt && (
          <button className="pill" type="submit" disabled={pendente}>
            Salvar descrição
          </button>
        )}
      </form>
      {erro && <p className="auth-err">{erro}</p>}
      {feito && <p className="ok-msg">{feito}</p>}
      <div className="foto-acoes">
        {/* A capa fica sempre em primeiro; as setas ordenam as demais. */}
        {i > 0 && (
          <>
            <button
              className="pill dica-cima"
              disabled={ocupado || i === 1}
              onClick={() => mover(i, -1)}
              aria-label="Mover para a esquerda"
              data-dica="Mover para a esquerda"
            >
              <SetaIcon dir="esq" />
            </button>
            <button
              className="pill dica-cima"
              disabled={ocupado || i === total - 1}
              onClick={() => mover(i, 1)}
              aria-label="Mover para a direita"
              data-dica="Mover para a direita"
            >
              <SetaIcon />
            </button>
          </>
        )}
        {!f.is_cover && (
          <button className="pill" disabled={ocupado} onClick={capa}>
            Usar como capa
          </button>
        )}
        <button className="pill neg" disabled={ocupado} onClick={apagar}>
          Retirar do produto
        </button>
      </div>
    </li>
  );
}

function EscolherFoto({ fechar, p, aoMudar }: { fechar: () => void; p: ProdutoPainel; aoMudar: (c: CatalogoPainel) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  return <dialog ref={ref} className="dlg dlg-biblioteca" aria-labelledby="titulo-escolher-foto" onClose={fechar}>
    <div className="dlg-h"><h2 id="titulo-escolher-foto">Escolher foto</h2><button className="pill" onClick={() => ref.current?.close()}>Fechar</button></div>
    <Biblioteca usadas={p.fotos.map(f => f.storage_path)} selecionar={async id => {
      const r = await vincularMidia(p.id, id);
      if (!r.ok) throw new Error(r.erro);
      aoMudar(r.dados); ref.current?.close();
    }} />
  </dialog>;
}
