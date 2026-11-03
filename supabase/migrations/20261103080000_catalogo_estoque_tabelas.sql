-- Catálogo e estoque — tabelas e regras de integridade.
-- Plano: docs/database/PLANO_SCHEMA_CATALOGO_ESTOQUE.md · Decisões: docs/DECISOES.md

-- Funções internas ficam fora do schema exposto pela API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.product_status as enum ('rascunho', 'ativo', 'arquivado');
create type public.product_kind as enum ('simples', 'kit_estoque_proprio', 'kit_composto'); -- CAT-DEC-004
create type public.sale_unit as enum ('unidade', 'par', 'conjunto'); -- CAT-DEC-002
-- reserva, liberacao, baixa e reposicao são usados a partir da Fase 3 (Módulo 02).
create type public.movement_type as enum ('entrada', 'ajuste', 'contagem', 'reserva', 'liberacao', 'baixa', 'reposicao');

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Categorias -----------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Produtos -------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  short_description text not null default '',
  description text not null default '',
  material text not null default '',
  care_info text not null default '',
  status public.product_status not null default 'rascunho',
  kind public.product_kind not null default 'simples',
  sale_unit public.sale_unit not null default 'unidade',
  is_new boolean not null default false,       -- CAT-DEC-023
  is_featured boolean not null default false,  -- CAT-DEC-023
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products (status);

-- Produto em várias categorias (CAT-DEC-016).
create table public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_idx on public.product_categories (category_id);

-- Variações (SKU) --------------------------------------------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique check (sku ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'), -- CAT-DEC-017
  -- CAT-DEC-022: só as chaves da D-011.
  attributes jsonb not null default '{}'::jsonb check (
    jsonb_typeof(attributes) = 'object'
    and (attributes - array['banho', 'tamanho', 'material', 'cor', 'modelo']) = '{}'::jsonb
  ),
  price_cents integer not null check (price_cents > 0), -- CAT-DEC-005
  -- CAT-DEC-020: promoção opcional, menor que o preço normal, com início e fim.
  promo_price_cents integer check (promo_price_cents > 0),
  promo_starts_at timestamptz,
  promo_ends_at timestamptz,
  min_stock integer not null default 0 check (min_stock >= 0), -- CAT-DEC-021
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_promo_valida check (
    (promo_price_cents is null and promo_starts_at is null and promo_ends_at is null)
    or (promo_price_cents < price_cents and promo_starts_at is not null and promo_ends_at > promo_starts_at)
  ),
  constraint product_variants_combinacao_unica unique (product_id, attributes)
);
create index product_variants_product_idx on public.product_variants (product_id);

-- Peças de kit composto (CAT-DEC-019) ----------------------------------------
create table public.kit_components (
  kit_variant_id uuid not null references public.product_variants (id) on delete cascade,
  component_variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  primary key (kit_variant_id, component_variant_id),
  check (kit_variant_id <> component_variant_id)
);
create index kit_components_component_idx on public.kit_components (component_variant_id);

-- Fotos ----------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique,
  alt text not null check (length(trim(alt)) > 0),
  position integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id);
create unique index product_images_uma_capa on public.product_images (product_id) where is_cover;

-- Saldo por SKU ----------------------------------------------------------------
-- Kit composto não tem saldo: a disponibilidade vem das peças (CAT-DEC-019).
create table public.inventory_balances (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now(),
  constraint inventory_balances_reservado_ate_saldo check (reserved <= on_hand)
);

-- Histórico imutável (CAT-DEC-012) ------------------------------------------
create table public.inventory_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  type public.movement_type not null,
  on_hand_delta integer not null default 0,
  reserved_delta integer not null default 0,
  on_hand_after integer not null check (on_hand_after >= 0),
  reason text not null check (length(trim(reason)) > 0),
  -- Sem chave estrangeira: o histórico continua intacto mesmo se o usuário for removido.
  actor_id uuid,
  reference text, -- Fase 3: identificador do pedido
  created_at timestamptz not null default now(),
  check (type = 'contagem' or on_hand_delta <> 0 or reserved_delta <> 0)
);
create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

-- Acesso ao painel -------------------------------------------------------------
-- Um papel só até a cliente responder D-013.
create table public.admin_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- Gatilhos -------------------------------------------------------------------
create trigger categories_updated_at before update on public.categories
  for each row execute function private.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function private.set_updated_at();

-- Toda variação de produto com estoque próprio ganha uma linha de saldo zerada.
create function private.criar_saldo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select kind from public.products where id = new.product_id) <> 'kit_composto' then
    insert into public.inventory_balances (variant_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger product_variants_criar_saldo after insert on public.product_variants
  for each row execute function private.criar_saldo();

-- Variação não troca de produto; tipo do produto não muda depois de ter variações.
create function private.proteger_variacao() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.product_id <> old.product_id then
    raise exception 'Uma variação não pode mudar de produto' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger product_variants_proteger before update on public.product_variants
  for each row execute function private.proteger_variacao();

create function private.proteger_tipo_produto() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.kind <> old.kind and exists (select 1 from public.product_variants where product_id = new.id) then
    raise exception 'O tipo do produto não pode mudar depois de cadastrar variações' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger products_proteger_tipo before update on public.products
  for each row execute function private.proteger_tipo_produto();

-- Kit composto: o kit precisa ser kit composto, e a peça não pode ser.
create function private.validar_peca_kit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select p.kind from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = new.kit_variant_id) <> 'kit_composto' then
    raise exception 'Só variações de kit composto têm peças' using errcode = '23514';
  end if;
  if (select p.kind from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = new.component_variant_id) = 'kit_composto' then
    raise exception 'Uma peça de kit não pode ser outro kit composto' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger kit_components_validar before insert or update on public.kit_components
  for each row execute function private.validar_peca_kit();

-- Histórico: ninguém edita nem apaga.
create function private.historico_imutavel() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'O histórico de estoque não pode ser alterado nem apagado' using errcode = '42501';
end $$;
create trigger inventory_movements_imutavel before update or delete on public.inventory_movements
  for each row execute function private.historico_imutavel();
