-- Biblioteca: reutilização, limite transacional e exclusão retomável.
-- Aplicação manual, depois de 20261104090000. Nenhum dado/arquivo é apagado.
begin;
alter table public.media_assets add column deleting boolean not null default false;
-- Troca a unicidade global por unicidade dentro de cada produto, sem perder dados.
alter table public.product_images drop constraint product_images_storage_path_key;
alter table public.product_images add constraint product_images_produto_caminho_key unique (product_id, storage_path);

create or replace function private.registrar_midia_produto() returns trigger
language plpgsql security definer set search_path = '' as $$
declare em_exclusao boolean;
begin
  perform 1 from public.products where id = new.product_id for update;
  if (select count(*) from public.product_images where product_id = new.product_id and id <> new.id) >= 12 then
    raise exception 'Cada produto aceita até 12 fotos' using errcode = '23514';
  end if;
  insert into public.media_assets (name, default_alt, storage_path)
  select left(p.name, 200), left(new.alt, 200), new.storage_path
  from public.products p where p.id = new.product_id
  on conflict (storage_path) do nothing;
  select deleting into em_exclusao from public.media_assets where storage_path = new.storage_path for share;
  if em_exclusao then
    raise exception 'Esta foto está sendo excluída e não pode ser vinculada' using errcode = '23514';
  end if;
  return new;
end;
$$;
-- Inclui a troca de produto para que chamadas diretas não contornem o limite.
drop trigger product_images_registrar_midia on public.product_images;
create trigger product_images_registrar_midia before insert or update of storage_path, product_id
  on public.product_images for each row execute function private.registrar_midia_produto();

create function public.iniciar_exclusao_midia(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare caminho text;
begin
  if not public.is_admin() then raise exception 'Acesso restrito ao painel' using errcode = '42501'; end if;
  select storage_path into caminho from public.media_assets where id = p_id for update;
  if not found then raise exception 'Foto não encontrada' using errcode = 'P0002'; end if;
  if exists (select 1 from public.product_images where storage_path = caminho) then
    raise exception 'Retire esta foto de todos os produtos antes de excluir' using errcode = '23514';
  end if;
  update public.media_assets set deleting = true where id = p_id;
  return caminho;
end;
$$;

create function public.finalizar_exclusao_midia(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare midia public.media_assets;
begin
  if not public.is_admin() then raise exception 'Acesso restrito ao painel' using errcode = '42501'; end if;
  select * into midia from public.media_assets where id = p_id for update;
  if not found then return; end if;
  if not midia.deleting then raise exception 'Inicie a exclusão antes de finalizar' using errcode = '23514'; end if;
  if exists (select 1 from storage.objects where bucket_id = 'produtos' and
    (name = midia.storage_path or name = regexp_replace(midia.storage_path, '(\.[a-zA-Z0-9]+)$', '-p\1'))) then
    raise exception 'Ainda há arquivos no armazenamento. Retome a exclusão' using errcode = '23514';
  end if;
  delete from public.media_assets where id = p_id;
end;
$$;
revoke all on function public.iniciar_exclusao_midia(uuid), public.finalizar_exclusao_midia(uuid) from public, anon, authenticated;
grant execute on function public.iniciar_exclusao_midia(uuid), public.finalizar_exclusao_midia(uuid) to authenticated;

-- Só arquivos de mídia marcada para exclusão podem sair pelo Storage.
create or replace function private.foto_na_biblioteca(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.media_assets m where not m.deleting and
    (p_path = m.storage_path or p_path = regexp_replace(m.storage_path, '(\.[a-zA-Z0-9]+)$', '-p\1')));
$$;
-- Mesmo em exclusão, conteúdo/caminho nunca podem ser substituídos.
create function private.foto_registrada(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.media_assets m where
    p_path = m.storage_path or p_path = regexp_replace(m.storage_path, '(\.[a-zA-Z0-9]+)$', '-p\1'));
$$;
revoke all on function private.foto_registrada(text) from public, anon, authenticated;
grant execute on function private.foto_registrada(text) to authenticated;
alter policy "biblioteca preserva conteúdo" on storage.objects
  using (bucket_id <> 'produtos' or not private.foto_registrada(name))
  with check (bucket_id <> 'produtos' or not private.foto_registrada(name));
commit;
select count(*) as fotos_na_biblioteca from public.media_assets;
