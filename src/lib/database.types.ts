// Gerado pelo Supabase a partir do banco ar-acessorios-dev. Não edite à mão:
// depois de cada migração, gere de novo (Supabase → generate_typescript_types).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      admin_members: {
        Row: { created_at: string; role: string; user_id: string };
        Insert: { created_at?: string; role?: string; user_id: string };
        Update: { created_at?: string; role?: string; user_id?: string };
        Relationships: [];
      };
      categories: {
        Row: { active: boolean; created_at: string; id: string; name: string; position: number; slug: string; updated_at: string };
        Insert: { active?: boolean; created_at?: string; id?: string; name: string; position?: number; slug: string; updated_at?: string };
        Update: { active?: boolean; created_at?: string; id?: string; name?: string; position?: number; slug?: string; updated_at?: string };
        Relationships: [];
      };
      inventory_balances: {
        Row: { on_hand: number; reserved: number; updated_at: string; variant_id: string };
        Insert: { on_hand?: number; reserved?: number; updated_at?: string; variant_id: string };
        Update: { on_hand?: number; reserved?: number; updated_at?: string; variant_id?: string };
        Relationships: [
          {
            foreignKeyName: 'inventory_balances_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: true;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_movements: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: number;
          on_hand_after: number;
          on_hand_delta: number;
          reason: string;
          reference: string | null;
          reserved_delta: number;
          type: Database['public']['Enums']['movement_type'];
          variant_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          on_hand_after: number;
          on_hand_delta?: number;
          reason: string;
          reference?: string | null;
          reserved_delta?: number;
          type: Database['public']['Enums']['movement_type'];
          variant_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          on_hand_after?: number;
          on_hand_delta?: number;
          reason?: string;
          reference?: string | null;
          reserved_delta?: number;
          type?: Database['public']['Enums']['movement_type'];
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_movements_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      kit_components: {
        Row: { component_variant_id: string; kit_variant_id: string; quantity: number };
        Insert: { component_variant_id: string; kit_variant_id: string; quantity: number };
        Update: { component_variant_id?: string; kit_variant_id?: string; quantity?: number };
        Relationships: [
          {
            foreignKeyName: 'kit_components_component_variant_id_fkey';
            columns: ['component_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kit_components_kit_variant_id_fkey';
            columns: ['kit_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: { category_id: string; product_id: string };
        Insert: { category_id: string; product_id: string };
        Update: { category_id?: string; product_id?: string };
        Relationships: [
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: { alt: string; created_at: string; id: string; is_cover: boolean; position: number; product_id: string; storage_path: string };
        Insert: { alt: string; created_at?: string; id?: string; is_cover?: boolean; position?: number; product_id: string; storage_path: string };
        Update: { alt?: string; created_at?: string; id?: string; is_cover?: boolean; position?: number; product_id?: string; storage_path?: string };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          active: boolean;
          attributes: Json;
          created_at: string;
          id: string;
          min_stock: number;
          position: number;
          price_cents: number;
          product_id: string;
          promo_ends_at: string | null;
          promo_price_cents: number | null;
          promo_starts_at: string | null;
          sku: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          attributes?: Json;
          created_at?: string;
          id?: string;
          min_stock?: number;
          position?: number;
          price_cents: number;
          product_id: string;
          promo_ends_at?: string | null;
          promo_price_cents?: number | null;
          promo_starts_at?: string | null;
          sku: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          attributes?: Json;
          created_at?: string;
          id?: string;
          min_stock?: number;
          position?: number;
          price_cents?: number;
          product_id?: string;
          promo_ends_at?: string | null;
          promo_price_cents?: number | null;
          promo_starts_at?: string | null;
          sku?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          care_info: string;
          created_at: string;
          description: string;
          id: string;
          is_featured: boolean;
          is_new: boolean;
          kind: Database['public']['Enums']['product_kind'];
          material: string;
          name: string;
          sale_unit: Database['public']['Enums']['sale_unit'];
          short_description: string;
          slug: string;
          status: Database['public']['Enums']['product_status'];
          updated_at: string;
        };
        Insert: {
          care_info?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_featured?: boolean;
          is_new?: boolean;
          kind?: Database['public']['Enums']['product_kind'];
          material?: string;
          name: string;
          sale_unit?: Database['public']['Enums']['sale_unit'];
          short_description?: string;
          slug: string;
          status?: Database['public']['Enums']['product_status'];
          updated_at?: string;
        };
        Update: {
          care_info?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_featured?: boolean;
          is_new?: boolean;
          kind?: Database['public']['Enums']['product_kind'];
          material?: string;
          name?: string;
          sale_unit?: Database['public']['Enums']['sale_unit'];
          short_description?: string;
          slug?: string;
          status?: Database['public']['Enums']['product_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      disponibilidade: {
        Args: { p_variant_ids: string[] };
        Returns: { disponivel: boolean; variant_id: string }[];
      };
      is_admin: { Args: never; Returns: boolean };
      painel_estoque: {
        Args: never;
        Returns: {
          abaixo_do_minimo: boolean;
          attributes: Json;
          disponivel: number;
          min_stock: number;
          on_hand: number;
          product_id: string;
          product_kind: Database['public']['Enums']['product_kind'];
          product_name: string;
          reserved: number;
          sku: string;
          variant_id: string;
        }[];
      };
      registrar_ajuste: {
        Args: { p_diferenca: number; p_motivo: string; p_variant_id: string };
        Returns: { on_hand: number; reserved: number; updated_at: string; variant_id: string };
        SetofOptions: { from: '*'; to: 'inventory_balances'; isOneToOne: true; isSetofReturn: false };
      };
      registrar_contagem: {
        Args: { p_contado: number; p_motivo: string; p_variant_id: string };
        Returns: { on_hand: number; reserved: number; updated_at: string; variant_id: string };
        SetofOptions: { from: '*'; to: 'inventory_balances'; isOneToOne: true; isSetofReturn: false };
      };
      registrar_entrada: {
        Args: { p_motivo: string; p_quantidade: number; p_variant_id: string };
        Returns: { on_hand: number; reserved: number; updated_at: string; variant_id: string };
        SetofOptions: { from: '*'; to: 'inventory_balances'; isOneToOne: true; isSetofReturn: false };
      };
    };
    Enums: {
      movement_type: 'entrada' | 'ajuste' | 'contagem' | 'reserva' | 'liberacao' | 'baixa' | 'reposicao';
      product_kind: 'simples' | 'kit_estoque_proprio' | 'kit_composto';
      product_status: 'rascunho' | 'ativo' | 'arquivado';
      sale_unit: 'unidade' | 'par' | 'conjunto';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
