// Complemento das migrações da biblioteca até regenerar os tipos no Supabase.
// O arquivo database.types.ts gerado permanece intacto.
import type { Database } from './database.types';
export type MidiaRow = {
  id: string; name: string; default_alt: string; storage_path: string;
  created_at: string; updated_at: string; deleting: boolean;
}
export type DatabaseComBiblioteca = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Functions'> & {
    Tables: Database['public']['Tables'] & {
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
