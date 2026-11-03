-- Catálogo e estoque — permissão, disponibilidade e movimentação de estoque.

-- Quem está logado é admin do painel?
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_members where user_id = (select auth.uid()));
$$;

-- Quantidade disponível de uma variação (uso interno; nunca exposta ao visitante, CAT-DEC-024).
-- SKU comum: saldo − reservado. Kit composto: menor ⌊disponível da peça ÷ quantidade⌋ (CAT-DEC-019).
create function private.disponivel(p_variant_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select case
    when p.kind = 'kit_composto' then coalesce((
      select min(floor((b.on_hand - b.reserved)::numeric / k.quantity))::integer
      from public.kit_components k
      join public.inventory_balances b on b.variant_id = k.component_variant_id
      where k.kit_variant_id = v.id
    ), 0)
    else coalesce((select b.on_hand - b.reserved from public.inventory_balances b where b.variant_id = v.id), 0)
  end
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.id = p_variant_id;
$$;

-- Vitrine: só disponível sim/não, e só de variações ativas de produtos ativos (CAT-DEC-024).
create function public.disponibilidade(p_variant_ids uuid[])
returns table (variant_id uuid, disponivel boolean)
language sql stable security definer set search_path = '' as $$
  select v.id, private.disponivel(v.id) > 0
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.id = any (p_variant_ids) and v.active and p.status = 'ativo';
$$;

-- Painel: estoque completo de todas as variações.
create function public.painel_estoque()
returns table (
  variant_id uuid, product_id uuid, product_name text, product_kind public.product_kind,
  sku text, attributes jsonb, on_hand integer, reserved integer, disponivel integer,
  min_stock integer, abaixo_do_minimo boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel' using errcode = '42501';
  end if;
  return query
    select v.id, p.id, p.name, p.kind, v.sku, v.attributes,
           b.on_hand, b.reserved, private.disponivel(v.id), v.min_stock,
           private.disponivel(v.id) <= v.min_stock
    from public.product_variants v
    join public.products p on p.id = v.product_id
    left join public.inventory_balances b on b.variant_id = v.id
    order by p.name, v.position, v.sku;
end $$;

-- Núcleo das movimentações manuais (CAT-DEC-012/021).
-- A atualização condicional trava a linha do saldo: duas operações simultâneas
-- no mesmo SKU acontecem uma depois da outra, e o saldo nunca fica abaixo do reservado.
create function private.movimentar(
  p_variant_id uuid, p_tipo public.movement_type, p_delta integer, p_motivo text
) returns public.inventory_balances
language plpgsql security definer set search_path = '' as $$
declare
  v_saldo public.inventory_balances;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel' using errcode = '42501';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Informe o motivo da movimentação' using errcode = '22023';
  end if;
  if not exists (select 1 from public.inventory_balances where variant_id = p_variant_id) then
    if exists (select 1 from public.product_variants where id = p_variant_id) then
      raise exception 'Kit composto não tem estoque próprio: movimente as peças' using errcode = '22023';
    end if;
    raise exception 'Variação não encontrada' using errcode = 'P0002';
  end if;

  update public.inventory_balances
     set on_hand = on_hand + p_delta, updated_at = now()
   where variant_id = p_variant_id and on_hand + p_delta >= reserved
  returning * into v_saldo;

  if not found then
    raise exception 'Estoque insuficiente: o saldo ficaria negativo ou abaixo do reservado' using errcode = '23514';
  end if;

  insert into public.inventory_movements (variant_id, type, on_hand_delta, on_hand_after, reason, actor_id)
  values (p_variant_id, p_tipo, p_delta, v_saldo.on_hand, trim(p_motivo), (select auth.uid()));

  return v_saldo;
end $$;

create function public.registrar_entrada(p_variant_id uuid, p_quantidade integer, p_motivo text)
returns public.inventory_balances
language plpgsql security definer set search_path = '' as $$
begin
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade de entrada deve ser maior que zero' using errcode = '22023';
  end if;
  return private.movimentar(p_variant_id, 'entrada', p_quantidade, p_motivo);
end $$;

create function public.registrar_ajuste(p_variant_id uuid, p_diferenca integer, p_motivo text)
returns public.inventory_balances
language plpgsql security definer set search_path = '' as $$
begin
  if p_diferenca is null or p_diferenca = 0 then
    raise exception 'O ajuste precisa somar ou subtrair ao menos uma unidade' using errcode = '22023';
  end if;
  return private.movimentar(p_variant_id, 'ajuste', p_diferenca, p_motivo);
end $$;

-- Contagem física: iguala o saldo ao contado e registra a diferença (pode ser zero).
create function public.registrar_contagem(p_variant_id uuid, p_contado integer, p_motivo text)
returns public.inventory_balances
language plpgsql security definer set search_path = '' as $$
declare
  v_atual integer;
begin
  if p_contado is null or p_contado < 0 then
    raise exception 'A quantidade contada não pode ser negativa' using errcode = '22023';
  end if;
  -- Trava a linha antes de calcular a diferença.
  select on_hand into v_atual from public.inventory_balances where variant_id = p_variant_id for update;
  return private.movimentar(p_variant_id, 'contagem', p_contado - coalesce(v_atual, 0), p_motivo);
end $$;

-- Só o que a API deve chamar fica liberado.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function public.disponibilidade(uuid[]) to anon, authenticated;
-- As regras de acesso (RLS) chamam is_admin() também para o visitante; para ele, responde falso.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.painel_estoque() to authenticated;
grant execute on function public.registrar_entrada(uuid, integer, text) to authenticated;
grant execute on function public.registrar_ajuste(uuid, integer, text) to authenticated;
grant execute on function public.registrar_contagem(uuid, integer, text) to authenticated;
