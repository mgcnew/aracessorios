-- Catálogo e estoque — quem vê e quem altera (RLS) e fotos no Storage.
-- Visitante: lê só o que está ativo, sem saldo nem histórico (CAT-DEC-024).
-- Admin: lê tudo e altera o catálogo; o saldo só muda pelas funções registrar_*.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.kit_components enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.admin_members enable row level security;

-- Privilégios explícitos: começa sem nada e libera só o necessário.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.categories, public.products, public.product_categories,
  public.kit_components, public.product_images to anon, authenticated;
-- Estoque mínimo fica fora da leitura direta; o painel o recebe por painel_estoque().
grant select (id, product_id, sku, attributes, price_cents, promo_price_cents, promo_starts_at,
  promo_ends_at, position, active, created_at, updated_at) on public.product_variants to anon, authenticated;

grant insert, update, delete on public.categories, public.products, public.product_categories,
  public.product_variants, public.kit_components, public.product_images to authenticated;
grant select on public.inventory_balances, public.inventory_movements, public.admin_members to authenticated;

-- Produto visível ao público?
create function private.produto_publico(p_product_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.products where id = p_product_id and status = 'ativo');
$$;
create function private.variacao_publica(p_variant_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = p_variant_id and v.active and p.status = 'ativo'
  );
$$;
grant usage on schema private to anon, authenticated;
grant execute on function private.produto_publico(uuid), private.variacao_publica(uuid) to anon, authenticated;

-- Leitura
create policy "vitrine lê categorias ativas" on public.categories for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "vitrine lê produtos ativos" on public.products for select to anon, authenticated
  using (status = 'ativo' or (select public.is_admin()));
create policy "vitrine lê categorias de produtos ativos" on public.product_categories for select to anon, authenticated
  using (private.produto_publico(product_id) or (select public.is_admin()));
create policy "vitrine lê variações ativas" on public.product_variants for select to anon, authenticated
  using (private.variacao_publica(id) or (select public.is_admin()));
create policy "vitrine lê peças de kits ativos" on public.kit_components for select to anon, authenticated
  using (private.variacao_publica(kit_variant_id) or (select public.is_admin()));
create policy "vitrine lê fotos de produtos ativos" on public.product_images for select to anon, authenticated
  using (private.produto_publico(product_id) or (select public.is_admin()));
create policy "painel lê saldos" on public.inventory_balances for select to authenticated
  using ((select public.is_admin()));
create policy "painel lê histórico" on public.inventory_movements for select to authenticated
  using ((select public.is_admin()));
create policy "painel lê acessos" on public.admin_members for select to authenticated
  using ((select public.is_admin()));

-- Escrita no catálogo: só admin.
create policy "painel cria categorias" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera categorias" on public.categories for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga categorias" on public.categories for delete to authenticated using ((select public.is_admin()));

create policy "painel cria produtos" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera produtos" on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- Produto com histórico é arquivado, nunca apagado (Documento Mestre §5.1).
create policy "painel apaga só rascunhos" on public.products for delete to authenticated
  using ((select public.is_admin()) and status = 'rascunho');

create policy "painel cria vínculos de categoria" on public.product_categories for insert to authenticated with check ((select public.is_admin()));
create policy "painel apaga vínculos de categoria" on public.product_categories for delete to authenticated using ((select public.is_admin()));

create policy "painel cria variações" on public.product_variants for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera variações" on public.product_variants for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga variações" on public.product_variants for delete to authenticated using ((select public.is_admin()));

create policy "painel cria peças de kit" on public.kit_components for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera peças de kit" on public.kit_components for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga peças de kit" on public.kit_components for delete to authenticated using ((select public.is_admin()));

create policy "painel cria fotos" on public.product_images for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera fotos" on public.product_images for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga fotos" on public.product_images for delete to authenticated using ((select public.is_admin()));

-- Fotos dos produtos: leitura pública pelo link; envio e remoção só pelo painel.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "painel envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and (select public.is_admin()));
create policy "painel substitui fotos" on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and (select public.is_admin()))
  with check (bucket_id = 'produtos' and (select public.is_admin()));
create policy "painel remove fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and (select public.is_admin()));
