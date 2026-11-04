'use client';
import { useEffect, useRef, useState } from 'react';
import { carregarBiblioteca, descreverMidia, excluirMidia } from '../app/admin/biblioteca-acoes';
import { FOTOS_POR_PAGINA, type MidiaPainel, type PaginaBiblioteca } from './biblioteca-dados';
import { enviarParaBiblioteca } from './enviar-foto';
import { urlFoto } from '../lib/fotos';
import { confirmar } from './confirmar';

export function Biblioteca({ selecionar, usadas = [], inicial = null }: {
  selecionar?: (id: string) => Promise<void>; usadas?: string[]; inicial?: PaginaBiblioteca | null;
}) {
  const [dados, setDados] = useState<PaginaBiblioteca | null>(inicial);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [carregando, setCarregando] = useState(!inicial);
  const [erro, setErro] = useState('');
  const [progresso, setProgresso] = useState('');
  const entrada = useRef<HTMLInputElement>(null);
  const trava = useRef(false);
  const primeira = useRef(!!inicial);
  const atualizar = () => setVersao(v => v + 1);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    let vivo = true;
    setCarregando(true);
    const timer = setTimeout(() => {
      carregarBiblioteca(pagina, busca).then(r => {
        if (!vivo) return;
        if (r.ok) {
          if (pagina > 1 && !r.dados.fotos.length) { setPagina(pagina - 1); return; }
          setDados(r.dados); setErro('');
        } else { setErro(r.erro); setDados(null); }
        setCarregando(false);
      }).catch(() => { if (vivo) { setErro('Não foi possível carregar as fotos. Tente novamente.'); setCarregando(false); } });
    }, 250);
    return () => { vivo = false; clearTimeout(timer); };
  }, [pagina, busca, versao]);

  async function agir(trabalho: () => Promise<void>) {
    if (trava.current) return;
    trava.current = true; setProgresso('Aguarde…'); setErro('');
    try { await trabalho(); } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao concluir a operação.'); }
    finally { trava.current = false; setProgresso(''); atualizar(); }
  }
  async function enviar(arquivos: File[]) {
    const erros: string[] = [];
    for (const [i, arquivo] of arquivos.entries()) {
      try {
        await enviarParaBiblioteca(arquivo, arquivo.name.replace(/\.[^.]+$/, ''), t => setProgresso(`${i + 1}/${arquivos.length} · ${t}`));
      } catch (e) { erros.push(`${arquivo.name}: ${e instanceof Error ? e.message : 'Falha no envio'}`); }
    }
    if (erros.length) throw new Error(erros.join(' / '));
    setBusca(''); setPagina(1);
  }
  const ocupado = !!progresso;
  const paginas = Math.max(1, Math.ceil((dados?.total ?? 0) / FOTOS_POR_PAGINA));
  return <section aria-label="Biblioteca de fotos" aria-busy={carregando || ocupado}>
    {!selecionar && <div className="top"><h1 className="h1">Biblioteca de fotos</h1><p className="sub">Guarde as fotos e reutilize nos produtos. Elas continuam aqui quando uma peça sai do catálogo.</p></div>}
    <div className="bar">
      <label className="fld"><span>Buscar</span><input type="search" aria-label="Buscar foto pelo nome" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} /></label>
      <button className="btn auth-btn" disabled={ocupado} onClick={() => entrada.current?.click()}>Enviar fotos</button>
      <input ref={entrada} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" onChange={e => {
        const arquivos = Array.from(e.target.files ?? []); e.target.value = '';
        if (arquivos.length) void agir(() => enviar(arquivos));
      }} />
    </div>
    <p className="note">As fotos são reduzidas antes do envio e perdem os dados de localização. Edite o nome para encontrá-las depois.</p>
    <p role="status" aria-live="polite">{progresso || (carregando ? 'Carregando fotos…' : '')}</p>
    {erro && <div className="auth-err" role="alert">{erro} <button className="pill" onClick={atualizar}>Tentar novamente</button></div>}
    {!carregando && dados?.fotos.length === 0 && <p className="sub">{busca ? 'Nenhuma foto encontrada com esse nome.' : 'Sua biblioteca ainda não tem fotos. Envie as primeiras para começar.'}</p>}
    <ul className={`biblioteca-grid${carregando ? ' carregando' : ''}`}>
      {dados?.fotos.map(f => <MidiaCard key={`${f.id}-${f.updated_at}`} foto={f} ocupado={ocupado || carregando}
        selecionar={selecionar ? () => void agir(() => selecionar(f.id)) : undefined}
        usada={usadas.includes(f.storage_path)}
        salvar={(nome, descricao) => void agir(async () => {
          const r = await descreverMidia(f.id, nome, descricao); if (!r.ok) throw new Error(r.erro);
        })}
        excluir={() => void agir(async () => {
          if (!f.deleting && !await confirmar({ titulo: 'Excluir foto da biblioteca?', texto: 'O arquivo será apagado definitivamente. Esta ação não pode ser desfeita.', confirmar: 'Excluir foto', perigo: true })) return;
          const r = await excluirMidia(f.id); if (!r.ok) throw new Error(r.erro);
        })} />)}
    </ul>
    <nav className="pag" aria-label="Páginas da biblioteca"><span className="pag-info">{dados?.total ?? 0} foto(s) · Página {pagina} de {paginas}</span><div className="pag-bts">
      <button className="pill" disabled={pagina <= 1 || carregando || ocupado} onClick={() => setPagina(p => p - 1)}>Anterior</button>
      <button className="pill" disabled={pagina >= paginas || carregando || ocupado} onClick={() => setPagina(p => p + 1)}>Próxima</button>
    </div></nav>
  </section>;
}
function MidiaCard({ foto: f, ocupado, selecionar, usada, salvar, excluir }: {
  foto: MidiaPainel; ocupado: boolean; selecionar?: () => void; usada: boolean;
  salvar: (nome: string, descricao: string) => void; excluir: () => void;
}) {
  const [nome, setNome] = useState(f.name), [alt, setAlt] = useState(f.default_alt);
  return <li className="biblioteca-card">
    <a href={urlFoto(f.storage_path)} target="_blank" rel="noreferrer" aria-label={`Abrir foto: ${f.name}`}><img src={urlFoto(f.storage_path, 'p')} alt={f.default_alt} loading="lazy" /></a>
    {selecionar ? <><h3>{f.name}</h3><button className="pill" disabled={ocupado || usada || f.deleting} onClick={selecionar}>{usada ? 'Já está no produto' : f.deleting ? 'Exclusão pendente' : 'Usar esta foto'}</button></> : <>
      <form onSubmit={e => { e.preventDefault(); salvar(nome, alt); }}>
        <label className="auth-l">Nome<input className="auth-i" required maxLength={200} value={nome} disabled={ocupado || f.deleting} onChange={e => setNome(e.target.value)} /></label>
        <label className="auth-l">Descrição padrão<input className="auth-i" required maxLength={200} value={alt} disabled={ocupado || f.deleting} onChange={e => setAlt(e.target.value)} /></label>
        {(nome !== f.name || alt !== f.default_alt) && <button className="pill" disabled={ocupado || f.deleting}>Salvar descrição</button>}
      </form>
      <p className="note">{f.produtos.length ? 'Usada em:' : 'Sem uso em produtos'}</p>
      {f.produtos.map(p => <a key={p.id} href={`/admin?aba=produtos&produto=${encodeURIComponent(p.id)}`}>{p.name}</a>)}
      <button className="pill neg" disabled={ocupado || f.produtos.length > 0} onClick={excluir}>{f.deleting ? 'Retomar exclusão' : 'Excluir da biblioteca'}</button>
      {f.produtos.length > 0 && <p className="note">Para excluir, retire a foto dos produtos acima.</p>}
    </>}
  </li>;
}
