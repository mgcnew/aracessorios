// Envio de notificação push (Web Push com chaves VAPID) para os aparelhos de quem administra a loja.
// Só roda no servidor: a chave privada nunca vai ao navegador. Usado pelas ações do painel e, na Fase 3,
// pelo webhook que confirma o pagamento.
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AvisoRow, DatabaseComBiblioteca } from './database-biblioteca.types';

type Db = SupabaseClient<DatabaseComBiblioteca>;

export const chavePublica = () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
export const pushConfigurado = () => Boolean(chavePublica() && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

export interface ResumoEnvio {
  aparelhos: number;
  enviados: number;
  /** Aparelhos que a Apple/Google já descartaram (removidos da lista). */
  removidos: number;
  falhas: number;
}

/**
 * Avisa todos os aparelhos cadastrados. Aparelho que o serviço de push diz que não existe mais (404/410)
 * é apagado. Uma falha num aparelho não impede os outros.
 */
export async function enviarPushAvisos(db: Db, aviso: Pick<AvisoRow, 'id' | 'title' | 'body' | 'url'>, naoLidos: number): Promise<ResumoEnvio> {
  const resumo: ResumoEnvio = { aparelhos: 0, enviados: 0, removidos: 0, falhas: 0 };
  if (!pushConfigurado()) return resumo;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, chavePublica(), process.env.VAPID_PRIVATE_KEY!);

  const { data: aparelhos, error } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (error || !aparelhos) return resumo;
  resumo.aparelhos = aparelhos.length;

  // Sem dado pessoal da cliente: só o que a dona precisa para abrir o painel.
  const mensagem = JSON.stringify({ title: aviso.title, body: aviso.body, url: aviso.url, tag: `aviso-${aviso.id}`, badge: naoLidos });
  const mortos: string[] = [];
  await Promise.all(
    aparelhos.map(async (a) => {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, mensagem, { TTL: 60 * 60 * 24, urgency: 'high' });
        resumo.enviados++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) mortos.push(a.id);
        else resumo.falhas++;
      }
    }),
  );
  if (mortos.length) {
    await db.from('push_subscriptions').delete().in('id', mortos);
    resumo.removidos = mortos.length;
  }
  return resumo;
}
