'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { carregarAvisos, enviarTeste, marcarLidos, registrarAparelho, removerAparelho, type EstadoAvisos } from '../app/admin/avisos-acoes';
import { CompartilharIcon, SinoIcon } from '../components/Icons';
import { useInstalar } from '../components/useInstalar';
import { ehIos, estaInstalado } from '../lib/pwa';

/*
 * Avisos do painel (NOT-DEC-001): a dona recebe uma notificação no celular quando há uma compra.
 * No iPhone o push só existe com o painel instalado na tela inicial (iOS 16.4+): sem isso, o Safari
 * nem oferece a API. Por isso a tela primeiro descobre em que situação este aparelho está.
 */
type Situacao = 'carregando' | 'instalar' | 'sem-suporte' | 'pedir' | 'negado' | 'ativo' | 'sem-chaves';

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

const temPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function chaveParaBytes(base64: string): Uint8Array<ArrayBuffer> {
  const s = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function Avisos({ versao, aoMudarNaoLidos }: { versao: number; aoMudarNaoLidos: (n: number) => void }) {
  const [estado, setEstado] = useState<EstadoAvisos | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [situacao, setSituacao] = useState<Situacao>('carregando');
  const [ios, setIos] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const app = useInstalar();

  const carregar = useCallback(async () => {
    const r = await carregarAvisos();
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setEstado(r.dados);
    aoMudarNaoLidos(r.dados.naoLidos);
  }, [aoMudarNaoLidos]);

  // Lista de avisos: ao abrir e quando o painel avisa que chegou um novo.
  useEffect(() => {
    void carregar();
  }, [carregar, versao]);

  // Situação deste aparelho em relação aos avisos push.
  useEffect(() => {
    if (!estado) return;
    let vivo = true;
    (async () => {
      const iphone = ehIos();
      setIos(iphone);
      const s: Situacao = !estado.configurado
        ? 'sem-chaves'
        : iphone && !estaInstalado()
          ? 'instalar'
          : !temPush()
            ? 'sem-suporte'
            : Notification.permission === 'denied'
              ? 'negado'
              : 'pedir';
      if (s !== 'pedir') return vivo && setSituacao(s);
      // Já deu permissão e já tem inscrição neste aparelho?
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (vivo) setSituacao(sub && Notification.permission === 'granted' ? 'ativo' : 'pedir');
      } catch {
        if (vivo) setSituacao('pedir');
      }
    })();
    return () => {
      vivo = false;
    };
  }, [estado]);

  const ativar = () =>
    iniciar(async () => {
      setErro(null);
      setFeito(null);
      try {
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') {
          setSituacao(permissao === 'denied' ? 'negado' : 'pedir');
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(estado!.chavePublica) }));
        const j = sub.toJSON();
        const r = await registrarAparelho({ endpoint: sub.endpoint, keys: { p256dh: j.keys?.p256dh ?? '', auth: j.keys?.auth ?? '' } }, navigator.userAgent);
        if (!r.ok) return setErro(r.erro);
        setSituacao('ativo');
        setFeito('Avisos ativados neste aparelho. Toque em "Enviar aviso de teste" para conferir.');
        void carregar();
      } catch (e) {
        setErro(e instanceof Error ? `Não foi possível ativar os avisos: ${e.message}` : 'Não foi possível ativar os avisos.');
      }
    });

  const desativar = () =>
    iniciar(async () => {
      setErro(null);
      setFeito(null);
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removerAparelho(sub.endpoint);
          await sub.unsubscribe();
        }
        setSituacao('pedir');
        setFeito('Avisos desativados neste aparelho.');
        void carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível desativar.');
      }
    });

  const testar = () =>
    iniciar(async () => {
      setErro(null);
      setFeito(null);
      const r = await enviarTeste();
      if (!r.ok) return setErro(r.erro);
      const { resumo } = r.dados;
      if (resumo.aparelhos === 0) setFeito('Aviso criado aqui, mas nenhum aparelho está cadastrado para receber no celular. Ative os avisos primeiro.');
      else if (resumo.enviados === 0) setErro(`O envio falhou em ${resumo.aparelhos} aparelho(s). Tente de novo; se continuar, desative e ative os avisos.`);
      else
        setFeito(
          `Aviso enviado para ${resumo.enviados} aparelho${resumo.enviados === 1 ? '' : 's'}${resumo.removidos ? ` (${resumo.removidos} antigo(s) removido(s))` : ''}. Deve chegar em instantes.`,
        );
      void carregar();
    });

  const lerTodos = () =>
    iniciar(async () => {
      const r = await marcarLidos();
      if (r.ok) void carregar();
      else setErro(r.erro);
    });
  const lerUm = (id: number) =>
    iniciar(async () => {
      const r = await marcarLidos([id]);
      if (r.ok) void carregar();
    });

  const avisos = estado?.avisos ?? [];

  return (
    <>
      <div className="top">
        <h1 className="h1">Avisos</h1>
        <p className="sub">Quando entrar uma compra, o aviso chega aqui e no celular da dona, mesmo com o painel fechado.</p>
      </div>

      {erro && (
        <p className="auth-err" role="alert" style={{ marginBottom: 16 }}>
          {erro}
        </p>
      )}
      {feito && (
        <p className="ok-msg" role="status">
          {feito}
        </p>
      )}

      <section className="card" aria-labelledby="h-aparelho">
        <div className="card-h">
          <h2 id="h-aparelho">Neste aparelho</h2>
          {situacao === 'ativo' && <span className="tag t-ok">Ativado</span>}
        </div>

        {situacao === 'carregando' && !erro && <p className="note">Verificando…</p>}

        {app.podeInstalar && (
          <div className="avisos-acoes" style={{ marginBottom: 14 }}>
            <button className="btn" onClick={() => void app.instalar()}>
              Instalar o painel neste aparelho
            </button>
          </div>
        )}

        {situacao === 'sem-chaves' && (
          <p className="note">As chaves de envio (VAPID) ainda não estão configuradas neste ambiente, então não dá para ativar os avisos aqui.</p>
        )}

        {situacao === 'instalar' && (
          <div className="avisos-passos">
            <p>No iPhone, os avisos só funcionam com o painel instalado na tela inicial (precisa do iOS 16.4 ou mais novo). Leva um minuto:</p>
            <ol>
              <li>Abra esta página no <strong>Safari</strong>.</li>
              <li>
                Toque em <strong>Compartilhar</strong> <CompartilharIcon className="avisos-ic" /> na barra do Safari.
              </li>
              <li>
                Escolha <strong>“Adicionar à Tela de Início”</strong> e toque em <strong>Adicionar</strong>.
              </li>
              <li>Abra o painel pelo <strong>novo ícone</strong> e volte a esta tela para ativar os avisos.</li>
            </ol>
          </div>
        )}

        {situacao === 'sem-suporte' && (
          <p className="note">
            {ios
              ? 'Este iPhone precisa do iOS 16.4 ou mais novo para receber avisos do painel.'
              : 'Este navegador não recebe avisos push. Use o Chrome, o Edge ou o Safari atualizados.'}
          </p>
        )}

        {situacao === 'negado' && (
          <p className="note">
            Os avisos estão bloqueados para este painel. Para liberar, abra os ajustes do {ios ? 'iPhone (Notificações › Painel AR)' : 'navegador (permissões do site)'} e permita as
            notificações; depois volte aqui.
          </p>
        )}

        {(situacao === 'pedir' || situacao === 'ativo') && (
          <>
            <p className="note" style={{ marginBottom: 12 }}>
              {situacao === 'ativo'
                ? `Este aparelho vai receber um aviso a cada compra. ${estado?.aparelhos ?? 0} aparelho(s) cadastrado(s) no total.`
                : 'Ative para este aparelho receber um aviso a cada compra. O aviso mostra só o número e o valor do pedido, nunca dados da cliente.'}
            </p>
            <div className="avisos-acoes">
              {situacao === 'pedir' ? (
                <button className="btn auth-btn" onClick={ativar} disabled={ocupado}>
                  {ocupado ? 'Ativando…' : 'Ativar avisos'}
                </button>
              ) : (
                <button className="btn" onClick={desativar} disabled={ocupado}>
                  Desativar neste aparelho
                </button>
              )}
              <button className="btn" onClick={testar} disabled={ocupado}>
                {ocupado ? 'Enviando…' : 'Enviar aviso de teste'}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card" style={{ marginTop: 18 }} aria-labelledby="h-lista">
        <div className="card-h">
          <h2 id="h-lista">Últimos avisos</h2>
          {(estado?.naoLidos ?? 0) > 0 && (
            <button className="pill" onClick={lerTodos} disabled={ocupado}>
              Marcar todos como lidos
            </button>
          )}
        </div>
        {estado && avisos.length === 0 ? (
          <p className="note">Nenhum aviso ainda. Quando alguém comprar, aparece aqui e no celular.</p>
        ) : (
          <ul className="avisos-lista">
            {avisos.map((a) => (
              <li key={a.id} className={a.read_at ? '' : 'novo'}>
                <button className="aviso" onClick={() => !a.read_at && lerUm(a.id)} aria-label={`${a.title}${a.read_at ? '' : ' (não lido)'}`}>
                  <SinoIcon size={20} className="aviso-ic" />
                  <span className="aviso-t">
                    <strong>{a.title}</strong>
                    {a.body && <span>{a.body}</span>}
                    <small>
                      {dataHora.format(new Date(a.created_at))} · {a.kind === 'teste' ? 'Teste' : 'Compra'}
                    </small>
                  </span>
                  {!a.read_at && <i className="aviso-ponto" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
