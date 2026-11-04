-- Biblioteca de fotos — etapa 1: base aditiva (CAT-DEC-025).
-- Aplicar uma única vez no SQL Editor do ar-acessorios-dev.
-- Não move/apaga arquivos; preserva o contrato atual de product_images.
-- Exclusão definitiva e reutilização entre produtos vêm na próxima etapa.
begin;
set local lock_timeout = '5s';

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  default_alt text not null check (length(trim(default_alt)) between 1 and 200),
  storage_path text not null unique check (length(trim(storage_path)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select, insert on public.media_assets to authenticated;
grant update (name, default_alt) on public.media_assets to authenticated;

create policy "painel lê biblioteca" on public.media_assets
  for select to authenticated using ((select public.is_admin()));
create policy "painel cadastra mídia" on public.media_assets
  for insert to authenticated with check ((select public.is_admin()));
create policy "painel descreve mídia" on public.media_assets
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- Sem DELETE nesta etapa: exclusão definitiva terá fluxo próprio.

create trigger media_assets_updated_at before update on public.media_assets
  for each row execute function private.set_updated_at();

-- Evita alterações concorrentes nos vínculos durante a cópia inicial.
lock table public.product_images in share row exclusive mode;
insert into public.media_assets (name, default_alt, storage_path, created_at)
select left(p.name, 200), left(i.alt, 200), i.storage_path, i.created_at
from public.product_images i
join public.products p on p.id = i.product_id;

-- Caminho é a chave de compatibilidade: nenhum cadastro atual precisa mudar.
alter table public.product_images
  add constraint product_images_media_path_fk
  foreign key (storage_path) references public.media_assets (storage_path)
  on update restrict on delete restrict;

-- Envios do painel atual também passam a entrar na biblioteca.
create function private.registrar_midia_produto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.media_assets (name, default_alt, storage_path)
  select left(p.name, 200), left(new.alt, 200), new.storage_path
  from public.products p where p.id = new.product_id
  on conflict (storage_path) do nothing;
  return new;
end;
$$;
revoke all on function private.registrar_midia_produto() from public, anon, authenticated;
create trigger product_images_registrar_midia
  before insert or update of storage_path on public.product_images
  for each row execute function private.registrar_midia_produto();

-- Consulta interna: funciona mesmo quando a RLS oculta a biblioteca do chamador.
create function private.foto_na_biblioteca(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.media_assets m
    where p_path = m.storage_path
       or p_path = regexp_replace(m.storage_path, '(\.[a-zA-Z0-9]+)$', '-p\1')
  );
$$;
revoke all on function private.foto_na_biblioteca(text) from public, anon, authenticated;
grant execute on function private.foto_na_biblioteca(text) to authenticated;

-- Políticas RESTRITIVAS somam proteção às permissivas já existentes.
-- Retirar vínculo/apagar rascunho não permite ao cliente apagar o arquivo.
create policy "biblioteca preserva arquivos" on storage.objects as restrictive
  for delete to authenticated
  using (bucket_id <> 'produtos' or not private.foto_na_biblioteca(name));
create policy "biblioteca preserva conteúdo" on storage.objects as restrictive
  for update to authenticated
  using (bucket_id <> 'produtos' or not private.foto_na_biblioteca(name))
  with check (bucket_id <> 'produtos' or not private.foto_na_biblioteca(name));

commit;

-- Conferência: fotos_sem_biblioteca precisa ser 0.
select
  (select count(*) from public.product_images) as fotos_nos_produtos,
  (select count(*) from public.media_assets) as fotos_na_biblioteca,
  (select count(*) from public.product_images i
   where not exists (select 1 from public.media_assets m
                     where m.storage_path = i.storage_path)) as fotos_sem_biblioteca;
