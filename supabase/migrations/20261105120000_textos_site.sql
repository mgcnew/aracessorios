-- Textos fixos da vitrine editáveis em Configurações (SET-DEC-002). Aplicar uma única vez no SQL Editor do
-- ar-acessorios-dev, DEPOIS de 20261105110000_configuracoes_site.sql.
--
-- site_texts: um texto por linha (chave → valor). Chave sem linha = a loja usa o texto padrão do site, então a tabela
--             nasce vazia. A lista de chaves e o limite de cada uma ficam em src/data/site-textos.ts; aqui o banco
--             só garante o formato e um teto de 600 caracteres.
-- Leitura pública (a vitrine precisa); escrita só admin. Só cria coisas novas.
begin;
set local lock_timeout = '5s';

create table public.site_texts (
  key text primary key check (key ~ '^[a-z0-9-]{1,40}$'),
  value text not null check (length(trim(value)) between 1 and 600),
  updated_at timestamptz not null default now()
);
create trigger site_texts_updated_at before update on public.site_texts
  for each row execute function private.set_updated_at();

alter table public.site_texts enable row level security;
revoke all on public.site_texts from public, anon, authenticated;
grant select on public.site_texts to anon, authenticated;
grant insert, update, delete on public.site_texts to authenticated;

create policy "vitrine lê textos" on public.site_texts for select to anon, authenticated using (true);
create policy "painel cria textos" on public.site_texts for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera textos" on public.site_texts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga textos" on public.site_texts for delete to authenticated using ((select public.is_admin()));

commit;
