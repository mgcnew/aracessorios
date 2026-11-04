// Complemento das migrações da biblioteca até regenerar os tipos no Supabase.
// O arquivo database.types.ts gerado permanece intacto.
import type { Database } from './database.types';
export type MidiaRow = {
  id: string; name: string; default_alt: string; storage_path: string;
  created_at: string; updated_at: string; deleting: boolean;
}
// Avisos do painel (migração 20261104100000_avisos_painel.sql): também aqui até regenerar os tipos.
export type AparelhoRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; user_agent: string; created_at: string };
export type AvisoRow = {
  id: number; kind: 'teste' | 'compra'; title: string; body: string; url: string; created_at: string; read_at: string | null;
};
export type DatabaseComBiblioteca = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Functions'> & {
    Tables: Database['public']['Tables'] & {
      push_subscriptions: {
        Row: AparelhoRow;
        Insert: Pick<AparelhoRow, 'user_id' | 'endpoint' | 'p256dh' | 'auth'> & Partial<Pick<AparelhoRow, 'id' | 'user_agent' | 'created_at'>>;
        Update: never;
        Relationships: [];
      };
      admin_notifications: {
        Row: AvisoRow;
        Insert: Pick<AvisoRow, 'kind' | 'title'> & Partial<Pick<AvisoRow, 'body' | 'url'>>;
        Update: Pick<AvisoRow, 'read_at'>;
        Relationships: [];
      };
      media_assets: {
        Row: MidiaRow;
        Insert: Pick<MidiaRow, 'name' | 'default_alt' | 'storage_path'> & Partial<Pick<MidiaRow, 'id' | 'created_at' | 'updated_at' | 'deleting'>>;
        Update: Partial<MidiaRow>;
        Relationships: [];
      };
    };
    Functions: Database['public']['Functions'] & {
      iniciar_exclusao_midia: { Args: { p_id: string }; Returns: string };
      finalizar_exclusao_midia: { Args: { p_id: string }; Returns: undefined };
    };
  };
};
