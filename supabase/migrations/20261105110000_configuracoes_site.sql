-- Configurações da loja (SET-DEC-001). Aplicar uma única vez no SQL Editor do ar-acessorios-dev,
-- DEPOIS de 20261105100000_video_produto.sql (os vídeos fixos usam o bucket "videos-produtos").
--
-- site_media   : imagem ou vídeo de cada espaço fixo da vitrine (destaque da home, kits, embalagem, sobre, categorias).
--                Espaço sem linha aqui continua com a imagem padrão que já vem no site.
-- site_settings: dados da empresa (uma linha só). Tudo que for preenchido pode aparecer no rodapé da loja.
--
-- Leitura pública (a vitrine precisa); escrita só admin. Só cria coisas novas, exceto o reforço de
-- public.iniciar_exclusao_midia, que passa a recusar a exclusão de foto usada nas configurações.
begin;
set local lock_timeout = '5s';

create table public.site_media (
  slot text primary key check (slot ~ '^(hero-principal|hero-brincos|hero-anel|presentes|embalagem|sobre|categoria-[a-z0-9-]{1,40})$'),
  kind text not null check (kind in ('imagem', 'video')),
  storage_path text not null,
  poster_path text,
  alt text not null check (length(trim(alt)) between 1 and 200),
  updated_at timestamptz not null default now(),
  -- Imagem vem da biblioteca de fotos (bucket "produtos"); vídeo e capa ficam em "videos-produtos/site/".
  check (
    (kind = 'imagem' and poster_path is null and storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$')
    or
    (kind = 'video' and slot !~ '^categoria-' and storage_path ~ '^site/[0-9a-f-]{36}\.mp4$'
      and poster_path ~ '^site/[0-9a-f-]{36}\.(webp|jpg)$')
  )
);
create trigger site_media_updated_at before update on public.site_media
  for each row execute function private.set_updated_at();

create table public.site_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'AR Acessórios' check (length(trim(store_name)) between 1 and 80),
  legal_name text not null default '' check (length(legal_name) <= 120),
  cnpj text not null default '' check (cnpj = '' or cnpj ~ '^[0-9./-]{14,18}$'),
  email text not null default '' check (email = '' or (length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text not null default '' check (length(phone) <= 30),
  whatsapp text not null default '' check (whatsapp = '' or whatsapp ~ '^[0-9]{10,15}$'),
  instagram text not null default '' check (instagram = '' or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  address text not null default '' check (length(address) <= 200),
  hours text not null default '' check (length(hours) <= 120),
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function private.set_updated_at();
insert into public.site_settings (id) values (true);

alter table public.site_media enable row level security;
alter table public.site_settings enable row level security;
revoke all on public.site_media, public.site_settings from public, anon, authenticated;
grant select on public.site_media, public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_media to authenticated;
grant update on public.site_settings to authenticated;

create policy "vitrine lê mídia fixa" on public.site_media for select to anon, authenticated using (true);
create policy "painel cria mídia fixa" on public.site_media for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera mídia fixa" on public.site_media for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga mídia fixa" on public.site_media for delete to authenticated using ((select public.is_admin()));

create policy "vitrine lê dados da empresa" on public.site_settings for select to anon, authenticated using (true);
create policy "painel altera dados da empresa" on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Foto usada numa configuração da loja não pode ser excluída da biblioteca (os arquivos sumiriam da vitrine).
create or replace function public.iniciar_exclusao_midia(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare caminho text;
begin
  if not public.is_admin() then raise exception 'Acesso restrito ao painel' using errcode = '42501'; end if;
  select storage_path into caminho from public.media_assets where id = p_id for update;
  if not found then raise exception 'Foto não encontrada' using errcode = 'P0002'; end if;
  if exists (select 1 from public.product_images where storage_path = caminho) then
    raise exception 'Retire esta foto de todos os produtos antes de excluir' using errcode = '23514';
  end if;
  if exists (select 1 from public.site_media where storage_path = caminho) then
    raise exception 'Esta foto está nas configurações da loja. Troque a imagem lá antes de excluir' using errcode = '23514';
  end if;
  update public.media_assets set deleting = true where id = p_id;
  return caminho;
end;
$$;

commit;
