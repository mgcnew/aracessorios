-- Financeiro do painel: entradas, saídas e despesas fixas (FIN-DEC-001).
-- Aplicar uma única vez no SQL Editor do ar-acessorios-dev. Só cria tabelas novas; não altera nada existente.
--
-- finance_fixed_expenses: despesas que se repetem todo mês (aluguel, internet…), com valor e dia de vencimento.
-- finance_entries       : lançamentos de dinheiro (entrada ou saída). A saída que paga uma despesa fixa guarda
--                         qual é (fixed_expense_id) e de que mês (competence, sempre dia 1): no máximo uma por mês.
--
-- Quem lê e grava é só admin (is_admin), como nas demais tabelas do painel. Valores em centavos, sempre positivos;
-- o tipo (entrada ou saída) diz o sinal. Nada aqui guarda dado pessoal de cliente.
begin;
set local lock_timeout = '5s';

create table public.finance_fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 100000000),
  due_day smallint not null check (due_day between 1 and 31),
  category text not null default 'outros' check (length(category) between 1 and 40),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('entrada', 'saida')),
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 100000000),
  occurred_on date not null,
  category text not null default 'outros' check (length(category) between 1 and 40),
  description text not null default '' check (length(description) <= 160),
  fixed_expense_id uuid references public.finance_fixed_expenses (id) on delete set null,
  competence date check (competence is null or extract(day from competence) = 1),
  created_at timestamptz not null default now(),
  -- Pagamento de despesa fixa é sempre saída e sempre diz o mês a que se refere.
  check (fixed_expense_id is null or (kind = 'saida' and competence is not null))
);
create index finance_entries_por_data on public.finance_entries (occurred_on desc, created_at desc);
-- Uma despesa fixa só pode ser paga uma vez por mês.
create unique index finance_entries_fixa_do_mes on public.finance_entries (fixed_expense_id, competence)
  where fixed_expense_id is not null;

alter table public.finance_fixed_expenses enable row level security;
alter table public.finance_entries enable row level security;
revoke all on public.finance_fixed_expenses, public.finance_entries from public, anon, authenticated;
grant select, insert, update, delete on public.finance_fixed_expenses to authenticated;
grant select, insert, update, delete on public.finance_entries to authenticated;

create policy "painel lê despesas fixas" on public.finance_fixed_expenses
  for select to authenticated using ((select public.is_admin()));
create policy "painel cria despesas fixas" on public.finance_fixed_expenses
  for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera despesas fixas" on public.finance_fixed_expenses
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga despesas fixas" on public.finance_fixed_expenses
  for delete to authenticated using ((select public.is_admin()));

create policy "painel lê lançamentos" on public.finance_entries
  for select to authenticated using ((select public.is_admin()));
create policy "painel cria lançamentos" on public.finance_entries
  for insert to authenticated with check ((select public.is_admin()));
create policy "painel altera lançamentos" on public.finance_entries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "painel apaga lançamentos" on public.finance_entries
  for delete to authenticated using ((select public.is_admin()));

-- Totais do período no banco (a lista pagina em 20; a API devolve no máximo 1000 linhas por consulta).
-- security invoker: vale a RLS de quem chama, então só admin enxerga valores.
create function public.financeiro_resumo(p_inicio date, p_fim date)
returns table (entradas bigint, saidas bigint)
language sql stable security invoker set search_path = public
as $$
  select coalesce(sum(amount_cents) filter (where kind = 'entrada'), 0)::bigint,
         coalesce(sum(amount_cents) filter (where kind = 'saida'), 0)::bigint
  from public.finance_entries
  where occurred_on >= p_inicio and occurred_on <= p_fim;
$$;
revoke all on function public.financeiro_resumo(date, date) from public, anon;
grant execute on function public.financeiro_resumo(date, date) to authenticated;

commit;
