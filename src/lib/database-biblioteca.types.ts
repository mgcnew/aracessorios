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
// Financeiro do painel (migração 20261105090000_financeiro_painel.sql).
export type DespesaFixaRow = { id: string; name: string; amount_cents: number; due_day: number; category: string; active: boolean; created_at: string };
export type LancamentoRow = {
  id: string; kind: 'entrada' | 'saida'; amount_cents: number; occurred_on: string; category: string; description: string;
  fixed_expense_id: string | null; competence: string | null; created_at: string;
};
// Vídeo do produto (migração 20261105100000_video_produto.sql).
export type VideoRow = { product_id: string; storage_path: string; poster_path: string; duration_ms: number; size_bytes: number; created_at: string };
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
      finance_fixed_expenses: {
        Row: DespesaFixaRow;
        Insert: Pick<DespesaFixaRow, 'name' | 'amount_cents' | 'due_day'> & Partial<Pick<DespesaFixaRow, 'id' | 'category' | 'active' | 'created_at'>>;
        Update: Partial<DespesaFixaRow>;
        Relationships: [];
      };
      finance_entries: {
        Row: LancamentoRow;
        Insert: Pick<LancamentoRow, 'kind' | 'amount_cents' | 'occurred_on'> & Partial<Omit<LancamentoRow, 'kind' | 'amount_cents' | 'occurred_on'>>;
        Update: Partial<LancamentoRow>;
        Relationships: [];
      };
      product_videos: {
        Row: VideoRow;
        Insert: Omit<VideoRow, 'created_at'> & Partial<Pick<VideoRow, 'created_at'>>;
        Update: Partial<VideoRow>;
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
      financeiro_resumo: { Args: { p_inicio: string; p_fim: string }; Returns: { entradas: number; saidas: number }[] };
      iniciar_exclusao_midia: { Args: { p_id: string }; Returns: string };
      finalizar_exclusao_midia: { Args: { p_id: string }; Returns: undefined };
    };
  };
};
