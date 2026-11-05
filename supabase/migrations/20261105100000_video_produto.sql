-- Vídeo curto do produto (VID-DEC-001). Aplicar uma única vez no SQL Editor do ar-acessorios-dev.
-- Só cria coisas novas: uma tabela, um bucket de Storage e as regras de acesso deles. Nada existente é alterado.
--
-- product_videos: no máximo um vídeo por produto (a chave é o próprio produto). O vídeo é um MP4 já comprimido no
--                 navegador (sem som, até 30 s) e a capa é uma imagem tirada dele. Só o caminho dos arquivos fica
--                 no banco; os arquivos ficam no bucket "videos-produtos" (leitura pública, envio só do painel).
begin;
set local lock_timeout = '5s';

create table public.product_videos (
  product_id uuid primary key references public.products (id) on delete cascade,
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.mp4$'),
  poster_path text not null unique check (poster_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'),
  duration_ms integer not null check (duration_ms between 500 and 31000),
  size_bytes integer not null check (size_bytes between 1 and 15728640),
  created_at timestamptz not null default now()
);

alter table public.product_videos enable row level security;
revoke all on public.product_videos from public, anon, authenticated;
grant select on public.product_videos to anon, authenticated;
grant insert, update, delete on public.product_videos to authenticated;

-- Mesma regra das fotos: a vitrine só enxerga o vídeo de produto publicado; o painel enxerga todos.
create policy "vitrine lê vídeos de produtos publicados" on public.product_videos for select to anon, authenticated
  using (private.produto_publico(product_id) or (select public.is_admin()));
create policy "painel cria vídeos" on public.product_videos for insert to authenticated
  with check ((select public.is_admin()));
create policy "painel altera vídeos" on public.product_videos for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga vídeos" on public.product_videos for delete to authenticated
  using ((select public.is_admin()));

-- Bucket próprio: leitura pública pelo link; envio e remoção só pelo painel. Limite de 15 MB por arquivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos-produtos', 'videos-produtos', true, 15728640, array['video/mp4', 'image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "painel envia vídeos" on storage.objects for insert to authenticated
  with check (bucket_id = 'videos-produtos' and (select public.is_admin()));
create policy "painel substitui vídeos" on storage.objects for update to authenticated
  using (bucket_id = 'videos-produtos' and (select public.is_admin()))
  with check (bucket_id = 'videos-produtos' and (select public.is_admin()));
-- Ler é necessário para o painel conseguir apagar (o Storage localiza o arquivo antes de remover).
create policy "painel lê vídeos do bucket" on storage.objects for select to authenticated
  using (bucket_id = 'videos-produtos' and (select public.is_admin()));
create policy "painel remove vídeos" on storage.objects for delete to authenticated
  using (bucket_id = 'videos-produtos' and (select public.is_admin()));

commit;
