import { registrarMidia } from '../app/admin/biblioteca-acoes';
import { BUCKET_FOTOS, caminhoPequeno } from '../lib/fotos';
import { supabaseNavegador } from '../lib/supabase/browser';
import { prepararFoto } from './fotos';

/** Prepara sem EXIF/GPS e envia versões grande/pequena, antes de registrar na biblioteca. */
export async function enviarParaBiblioteca(arquivo: File, nome: string, progresso: (texto: string) => void) {
  progresso('Preparando foto…');
  const f = await prepararFoto(arquivo);
  const caminho = `${crypto.randomUUID()}/${crypto.randomUUID()}.${f.extensao}`;
  const db = supabaseNavegador();
  const storage = db.storage.from(BUCKET_FOTOS);
  const opcoes = { contentType: f.tipo, cacheControl: '31536000', upsert: false };
  progresso('Enviando foto…');
  const grande = await storage.upload(caminho, f.grande, opcoes);
  if (grande.error) throw new Error(grande.error.message);
  const pequena = await storage.upload(caminhoPequeno(caminho), f.pequena, { ...opcoes, contentType: f.pequena.type });
  if (pequena.error) {
    await storage.remove([caminho]);
    throw new Error(pequena.error.message);
  }
  const registro = await registrarMidia(caminho, nome);
  if (!registro.ok) {
    // Arquivos já registrados são protegidos pelas políticas do Storage.
    await storage.remove([caminho, caminhoPequeno(caminho)]);
    throw new Error(registro.erro);
  }
  return registro.dados.id;
}
