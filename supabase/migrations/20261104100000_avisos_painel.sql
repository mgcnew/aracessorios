-- Avisos do painel e aparelhos com notificação push (NOT-DEC-001).
-- Aplicar uma única vez no SQL Editor do ar-acessorios-dev. Só cria tabelas novas; não altera nada existente.
--
-- push_subscriptions : aparelhos (iPhone, computador…) de quem administra a loja que aceitaram receber avisos.
-- admin_notifications: caixa de avisos do painel (o que foi notificado e se já foi lido).
--
-- Quem lê e grava é só admin (is_admin), como nas demais tabelas do painel. O aviso nunca guarda dado
-- pessoal da cliente: só título curto, texto curto e o endereço dentro do painel.
begin;
set local lock_timeout = '5s';

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and length(endpoint) <= 2048),
  p256dh text not null check (length(p256dh) between 20 and 200),
  auth text not null check (length(auth) between 10 and 100),
  user_agent text not null default '' check (length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;
grant select, insert, delete on public.push_subscriptions to authenticated;

-- Qualquer admin lê (o envio avisa todos os aparelhos de admin) e remove (tira aparelho que a Apple/Google
-- já descartou). Cada um só cadastra aparelho em seu próprio nome.
create policy "painel lê aparelhos" on public.push_subscriptions
  for select to authenticated using ((select public.is_admin()));
create policy "painel cadastra o próprio aparelho" on public.push_subscriptions
  for insert to authenticated
  with check ((select public.is_admin()) and user_id = (select auth.uid()));
create policy "painel remove aparelhos" on public.push_subscriptions
  for delete to authenticated using ((select public.is_admin()));

create table public.admin_notifications (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('teste', 'compra')),
  title text not null check (length(trim(title)) between 1 and 120),
  body text not null default '' check (length(body) <= 300),
  url text not null default '/admin' check (url like '/admin%'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index admin_notifications_recentes on public.admin_notifications (created_at desc);

alter table public.admin_notifications enable row level security;
revoke all on public.admin_notifications from public, anon, authenticated;
grant select, insert on public.admin_notifications to authenticated;
grant update (read_at) on public.admin_notifications to authenticated;

create policy "painel lê avisos" on public.admin_notifications
  for select to authenticated using ((select public.is_admin()));
-- Pelo painel só nasce aviso de teste. O aviso de compra (Fase 3) é criado no servidor, por quem confirma o pagamento.
create policy "painel cria aviso de teste" on public.admin_notifications
  for insert to authenticated
  with check ((select public.is_admin()) and kind = 'teste');
create policy "painel marca aviso como lido" on public.admin_notifications
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

commit;
