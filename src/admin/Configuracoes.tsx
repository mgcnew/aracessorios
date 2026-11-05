'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  alterarSenha,
  carregarConfiguracoes,
  definirImagemSite,
  descreverEspaco,
  restaurarEspaco,
  salvarEmpresa,
} from '../app/admin/configuracoes-acoes';
import { ESPACOS_FIXOS, espacoCategoria, type EspacoSite } from '../data/site-espacos';
import { urlFoto, urlVideo } from '../lib/fotos';
import type { SiteMediaRow } from '../lib/database-biblioteca.types';
import { Biblioteca } from './Biblioteca';
import { confirmar } from './confirmar';
import { type DadosEmpresa, type PaginaConfiguracoes } from './configuracoes';
import { enviarVideoSite } from './enviar-video-site';
import { FiltroOpcoes } from './FiltroOpcoes';
import { useAcao } from './Produtos';
import { mb, suportaVideo } from './video';

type Secao = 'aparencia' | 'empresa' | 'conta';
const SECOES = [
  { value: 'aparencia', label: 'Aparência da loja' },
  { value: 'empresa', label: 'Dados da empresa' },
  { value: 'conta', label: 'Minha conta' },
] as const;

/*
 * Configurações do painel (SET-DEC-001): trocar as imagens e vídeos fixos da vitrine, cadastrar os dados da empresa
 * (que aparecem no rodapé da loja) e cuidar da própria conta.
 */
export function Configuracoes() {
  const [secao, setSecao] = useState<Secao>('aparencia');
  const [dados, setDados] = useState<PaginaConfiguracoes | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const r = await carregarConfiguracoes();
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setDados(r.dados);
  }, []);
  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <div className="top">
        <h1 className="h1">Configurações</h1>
        <p className="sub">Imagens e vídeos da loja, dados da empresa e a sua conta.</p>
      </div>
      {erro && (
        <p className="auth-err" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível carregar as configurações: {erro}
        </p>
      )}
      <div className="bar">
        <FiltroOpcoes rotulo="Seção das configurações" valor={secao} opcoes={SECOES} onChange={setSecao} />
      </div>
      {dados && secao === 'aparencia' && <Aparencia dados={dados} mudou={carregar} />}
      {dados && secao === 'empresa' && <Empresa dados={dados} mudou={carregar} />}
      {dados && secao === 'conta' && <Conta email={dados.email} />}
    </>
  );
}

// Aparência ---------------------------------------------------------------------------------------

function miniaturaDe(e: EspacoSite, m: SiteMediaRow | undefined): string | null {
  if (m?.kind === 'video' && m.poster_path) return urlVideo(m.poster_path);
  if (m) return urlFoto(m.storage_path, 'p');
  return e.padrao.src || null;
}

function Aparencia({ dados, mudou }: { dados: PaginaConfiguracoes; mudou: () => void }) {
  const categorias = dados.categorias.map((c) => espacoCategoria(c.slug, c.name));
  return (
    <>
      <p className="note" style={{ marginBottom: 12 }}>
        Cada espaço mostra a imagem padrão do site até você escolher outra. As imagens vêm da biblioteca de fotos (dá para enviar nova na hora). Em alguns espaços também dá para usar um vídeo curto: sem som, comprimido aqui antes do envio, e toca sozinho na loja.
      </p>
      <section className="card">
        <h2>Página inicial e Sobre</h2>
        <ul className="espacos">
          {ESPACOS_FIXOS.map((e) => (
            <Espaco key={e.slot} e={e} m={dados.midia[e.slot]} mudou={mudou} />
          ))}
        </ul>
      </section>
      {categorias.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>Categorias</h2>
          <ul className="espacos">
            {categorias.map((e) => (
              <Espaco key={e.slot} e={e} m={dados.midia[e.slot]} mudou={mudou} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Espaco({ e, m, mudou }: { e: EspacoSite; m: SiteMediaRow | undefined; mudou: () => void }) {
  const [escolher, setEscolher] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [alt, setAlt] = useState(m?.alt ?? '');
  const entrada = useRef<HTMLInputElement>(null);
  const acao = useAcao();
  const ocupado = progresso !== null || acao.pendente;
  const miniatura = miniaturaDe(e, m);
  const estado = m ? (m.kind === 'video' ? 'Vídeo' : 'Imagem escolhida') : e.padrao.src ? 'Padrão do site' : 'Ilustração';

  useEffect(() => setAlt(m?.alt ?? ''), [m?.alt]);

  async function enviarVideo(arquivo: File) {
    setErro(null);
    setOk(null);
    const descricao = alt.trim() || e.padrao.alt || e.rotulo;
    try {
      const r = await enviarVideoSite(arquivo, e.slot, descricao, setProgresso);
      setOk(`Vídeo pronto: de ${mb(r.antes)} para ${mb(r.depois)}.`);
      mudou();
    } catch (x) {
      const msg = x instanceof Error ? x.message : String(x);
      setErro(/Bucket not found|row-level security|schema cache|does not exist/i.test(msg) ? 'O armazenamento de vídeos ainda não existe no banco. Aplique as migrações de vídeo e de configurações.' : msg);
    } finally {
      setProgresso(null);
    }
  }

  return (
    <li className="espaco">
      <div className="espaco-img" style={{ aspectRatio: e.ratio }}>
        {miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={miniatura} alt="" loading="lazy" />
        ) : (
          <span className="note">Sem foto</span>
        )}
      </div>
      <div className="espaco-txt">
        <strong style={{ fontWeight: 500 }}>{e.rotulo}</strong>
        <div className="sku">{e.onde}</div>
        <span className={`tag ${m ? 't-ok' : 't-info'}`} style={{ alignSelf: 'flex-start' }}>
          {estado}
        </span>
        {m && (
          <form
            className="foto-alt"
            onSubmit={(ev) => {
              ev.preventDefault();
              acao.rodar(() => descreverEspaco(e.slot, alt), mudou, 'Descrição salva.');
            }}
          >
            <label className="auth-l">
              Descrição (para quem não enxerga a imagem)
              <input className="auth-i" value={alt} maxLength={200} onChange={(ev) => setAlt(ev.target.value)} />
            </label>
            {alt.trim() !== m.alt && (
              <button className="pill" type="submit" disabled={ocupado}>
                Salvar descrição
              </button>
            )}
          </form>
        )}
        <div className="espaco-acoes">
          <button className="btn" disabled={ocupado} onClick={() => setEscolher(true)}>
            {m ? 'Trocar imagem' : 'Escolher imagem'}
          </button>
          {e.video && (
            <button className="btn" disabled={ocupado || !suportaVideo()} onClick={() => entrada.current?.click()} title={suportaVideo() ? undefined : 'Este navegador não prepara vídeos'}>
              {progresso ?? (m?.kind === 'video' ? 'Trocar vídeo' : 'Usar vídeo')}
            </button>
          )}
          {m && (
            <button
              className="pill neg"
              disabled={ocupado}
              onClick={async () => {
                const ok2 = await confirmar({
                  titulo: 'Voltar para a imagem padrão?',
                  texto: m.kind === 'video' ? 'O vídeo é apagado. A imagem padrão do site volta a aparecer.' : 'A foto continua na biblioteca. A imagem padrão do site volta a aparecer.',
                  confirmar: 'Voltar ao padrão',
                });
                if (ok2) acao.rodar(() => restaurarEspaco(e.slot), mudou);
              }}
            >
              Voltar ao padrão
            </button>
          )}
        </div>
        {e.video && (
          <input
            ref={entrada}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            hidden
            onChange={(ev) => {
              const arq = ev.target.files?.[0];
              ev.target.value = '';
              if (arq) void enviarVideo(arq);
            }}
          />
        )}
        {(erro || acao.erro) && (
          <p className="auth-err" role="alert">
            {erro ?? acao.erro}
          </p>
        )}
        {(ok || acao.feito) && (
          <p className="ok-msg" role="status">
            {ok ?? acao.feito}
          </p>
        )}
      </div>
      {escolher && <EscolherImagem espaco={e} fechar={() => setEscolher(false)} escolhida={async (id) => {
        const r = await definirImagemSite(e.slot, id, '');
        if (!r.ok) throw new Error(r.erro);
        setEscolher(false);
        mudou();
      }} />}
    </li>
  );
}

function EscolherImagem({ espaco, fechar, escolhida }: { espaco: EspacoSite; fechar: () => void; escolhida: (id: string) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dlg dlg-biblioteca" aria-labelledby="escolher-imagem-t" onClose={fechar}>
      <div className="dlg-h">
        <h2 id="escolher-imagem-t">{espaco.rotulo}</h2>
        <button className="pill" onClick={() => ref.current?.close()}>
          Fechar
        </button>
      </div>
      <p className="note" style={{ marginBottom: 10 }}>
        Escolha uma foto da biblioteca ou envie uma nova. Aparece na proporção {espaco.ratio.replace(' / ', ':')}; o centro da foto é o que fica à vista.
      </p>
      <Biblioteca selecionar={escolhida} />
    </dialog>
  );
}

// Dados da empresa ------------------------------------------------------------------------------

function Empresa({ dados, mudou }: { dados: PaginaConfiguracoes; mudou: () => void }) {
  const e = dados.empresa;
  const [f, setF] = useState<DadosEmpresa>({
    store_name: e.store_name, legal_name: e.legal_name, cnpj: e.cnpj, email: e.email, phone: e.phone,
    whatsapp: e.whatsapp, instagram: e.instagram, address: e.address, hours: e.hours,
  });
  const { pendente, erro, feito, rodar } = useAcao();
  const campo = (k: keyof DadosEmpresa, rotulo: string, extra: { placeholder?: string; max?: number; inputMode?: 'tel' | 'email' | 'numeric' } = {}) => (
    <label className="auth-l">
      {rotulo}
      <input className="auth-i" value={f[k]} maxLength={extra.max} placeholder={extra.placeholder} inputMode={extra.inputMode} onChange={(ev) => setF((x) => ({ ...x, [k]: ev.target.value }))} />
    </label>
  );
  return (
    <section className="card">
      <h2>Dados da empresa</h2>
      <p className="note" style={{ marginBottom: 12 }}>
        O que você preencher aparece no rodapé da loja (nome, razão social, CNPJ e os contatos). Campo vazio não aparece.
      </p>
      <form
        className="auth-form empresa-form"
        onSubmit={(ev) => {
          ev.preventDefault();
          rodar(() => salvarEmpresa(f), mudou, 'Dados salvos. A loja já mostra o que mudou.');
        }}
      >
        {campo('store_name', 'Nome da loja', { max: 80 })}
        {campo('legal_name', 'Razão social', { max: 120 })}
        {campo('cnpj', 'CNPJ', { placeholder: '00.000.000/0000-00', max: 18, inputMode: 'numeric' })}
        {campo('email', 'E-mail de contato', { max: 120, inputMode: 'email' })}
        {campo('phone', 'Telefone', { placeholder: '(11) 3333-4444', max: 30, inputMode: 'tel' })}
        {campo('whatsapp', 'WhatsApp (com DDD, só números)', { placeholder: '11999990000', max: 20, inputMode: 'tel' })}
        {campo('instagram', 'Instagram (nome de usuário)', { placeholder: 'ar.acessorios', max: 40 })}
        {campo('address', 'Endereço', { max: 200 })}
        {campo('hours', 'Horário de atendimento', { placeholder: 'Seg a sex, 9h às 18h', max: 120 })}
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        {feito && (
          <p className="ok-msg" role="status">
            {feito}
          </p>
        )}
        <div className="acoes-fim">
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Salvando…' : 'Salvar dados'}
          </button>
        </div>
      </form>
    </section>
  );
}

// Minha conta -----------------------------------------------------------------------------------

function Conta({ email }: { email: string }) {
  const [nova, setNova] = useState('');
  const [conf, setConf] = useState('');
  const { pendente, erro, feito, rodar } = useAcao();
  return (
    <section className="card">
      <h2>Minha conta</h2>
      <p style={{ marginBottom: 14 }}>
        Você entrou como <strong style={{ fontWeight: 500 }}>{email}</strong>.
      </p>
      <form
        className="auth-form empresa-form"
        onSubmit={(ev) => {
          ev.preventDefault();
          rodar(
            () => alterarSenha(nova, conf),
            () => {
              setNova('');
              setConf('');
            },
            'Senha alterada.',
          );
        }}
      >
        <h3 className="fin-sub">Alterar senha</h3>
        <label className="auth-l">
          Senha nova (mínimo de 8 caracteres)
          <input className="auth-i" type="password" autoComplete="new-password" value={nova} onChange={(ev) => setNova(ev.target.value)} required minLength={8} />
        </label>
        <label className="auth-l">
          Repita a senha nova
          <input className="auth-i" type="password" autoComplete="new-password" value={conf} onChange={(ev) => setConf(ev.target.value)} required minLength={8} />
        </label>
        {erro && (
          <p className="auth-err" role="alert">
            {erro}
          </p>
        )}
        {feito && (
          <p className="ok-msg" role="status">
            {feito}
          </p>
        )}
        <div className="acoes-fim">
          <button className="btn auth-btn" type="submit" disabled={pendente}>
            {pendente ? 'Salvando…' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </section>
  );
}
