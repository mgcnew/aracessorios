// Configurações da loja lidas do banco para a vitrine: imagens/vídeos dos espaços fixos e dados da empresa.
// Só roda no servidor. Em cache com a mesma etiqueta do catálogo (o painel expira ao salvar).

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { TAG_CATALOGO } from '../lib/cache';
import { urlFoto, urlVideo } from '../lib/fotos';
import { supabasePublico } from '../lib/supabase/public';
import type { Foto } from './catalog';
import { ESPACOS_FIXOS, PADRAO_CATEGORIA } from './site-espacos';
import { TEXTO_POR_CHAVE, type TextosSite } from './site-textos';

export interface MidiaFixa {
  kind: 'imagem' | 'video';
  src: string;
  thumb: string;
  /** Só vídeo: a capa mostrada antes de tocar. */
  poster?: string;
  alt: string;
}

export interface Empresa {
  storeName: string;
  legalName: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  hours: string;
}

export interface Site {
  midia: Record<string, MidiaFixa>;
  empresa: Empresa;
  /** Só os textos que a dona alterou; o que falta usa o padrão (`textoDe`). */
  textos: TextosSite;
}

export const EMPRESA_PADRAO: Empresa = { storeName: 'AR Acessórios', legalName: '', cnpj: '', email: '', phone: '', whatsapp: '', instagram: '', address: '', hours: '' };

async function lerSite(): Promise<Site> {
  const db = supabasePublico();
  const [midia, empresa, textos] = await Promise.all([
    db.from('site_media').select('slot, kind, storage_path, poster_path, alt'),
    db.from('site_settings').select('store_name, legal_name, cnpj, email, phone, whatsapp, instagram, address, hours').maybeSingle(),
    db.from('site_texts').select('key, value'),
  ]);
  // Sem a migração das configurações as tabelas não existem: a loja segue com as imagens padrão.
  const linhas = midia.error ? [] : (midia.data ?? []);
  const e = empresa.error ? null : empresa.data;
  return {
    midia: Object.fromEntries(
      linhas.map((m) => [
        m.slot,
        m.kind === 'video' && m.poster_path
          ? { kind: 'video' as const, src: urlVideo(m.storage_path), thumb: urlVideo(m.poster_path), poster: urlVideo(m.poster_path), alt: m.alt }
          : { kind: 'imagem' as const, src: urlFoto(m.storage_path, 'g'), thumb: urlFoto(m.storage_path, 'p'), alt: m.alt },
      ]),
    ),
    textos: Object.fromEntries((textos.error ? [] : (textos.data ?? [])).filter((t) => t.key in TEXTO_POR_CHAVE).map((t) => [t.key, t.value])),
    empresa: e
      ? { storeName: e.store_name, legalName: e.legal_name, cnpj: e.cnpj, email: e.email, phone: e.phone, whatsapp: e.whatsapp, instagram: e.instagram, address: e.address, hours: e.hours }
      : EMPRESA_PADRAO,
  };
}

const siteEmCache = unstable_cache(lerSite, ['site'], { tags: [TAG_CATALOGO], revalidate: 60 });
export const getSite = cache(() => siteEmCache());

/** O que mostrar num espaço fixo: a escolha da dona ou, sem ela, a imagem padrão do site (ou nada, para categoria nova). */
export function midiaDoEspaco(site: Site, slot: string): MidiaFixa | null {
  const escolhida = site.midia[slot];
  if (escolhida) return escolhida;
  const fixo = ESPACOS_FIXOS.find((x) => x.slot === slot);
  if (fixo) return { kind: 'imagem', src: fixo.padrao.src, thumb: fixo.padrao.src, alt: fixo.padrao.alt };
  const slug = slot.replace(/^categoria-/, '');
  if (slug in PADRAO_CATEGORIA) {
    const src = `/categorias/${slug}.webp`;
    return { kind: 'imagem', src, thumb: src, alt: PADRAO_CATEGORIA[slug] };
  }
  return null;
}

export const comoFoto = (m: MidiaFixa | null): Foto | null => (m ? { src: m.src, thumb: m.thumb, alt: m.alt } : null);
