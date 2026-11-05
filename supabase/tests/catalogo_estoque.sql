-- Testes de segurança e estoque do catálogo (plano §8).
-- Rodam numa transação desfeita no fim: o banco não guarda nada.
-- Requer os dados de supabase/seed.sql. Resultado: uma linha por teste, com ok = true/false.

begin;

create temp table resultados (n serial, teste text, ok boolean, detalhe text);
grant all on resultados to anon, authenticated;
grant usage on sequence resultados_n_seq to anon, authenticated;

-- Usuários de teste (somem no rollback)
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin-teste@exemplo.invalid'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'cliente-teste@exemplo.invalid');
insert into public.admin_members (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.products (slug, name, status) values ('rascunho-de-teste', 'Rascunho de teste', 'rascunho');

-- 1. Visitante anônimo ---------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int; d text;
begin
  select count(*) into n from public.products;
  insert into resultados (teste, ok, detalhe) values ('visitante vê só produtos ativos', n = 19, n || ' produtos');

  begin
    perform 1 from public.inventory_balances;
    insert into resultados (teste, ok) values ('visitante não lê saldo', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('visitante não lê saldo', true);
  end;

  begin
    perform 1 from public.inventory_movements;
    insert into resultados (teste, ok) values ('visitante não lê histórico', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('visitante não lê histórico', true);
  end;

  begin
    perform min_stock from public.product_variants;
    insert into resultados (teste, ok) values ('visitante não lê estoque mínimo', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('visitante não lê estoque mínimo', true);
  end;

  begin
    insert into public.products (slug, name) values ('invasao', 'Invasão');
    insert into resultados (teste, ok) values ('visitante não cria produto', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('visitante não cria produto', true);
  end;

  begin
    perform public.registrar_entrada((select id from public.product_variants where sku = 'AR-BRC001-OURO'), 10, 'tentativa');
    insert into resultados (teste, ok) values ('visitante não movimenta estoque', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('visitante não movimenta estoque', true);
  end;

  select count(*) filter (where disponivel), count(*) into n, d
  from public.disponibilidade(array(select id from public.product_variants));
  insert into resultados (teste, ok, detalhe) values ('visitante vê disponível sim/não', d::int = 73 and n = 65, n || ' disponíveis de ' || d);
end $$;
reset role;

-- 2. Cliente logado (não é admin) ---------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.products;
  insert into resultados (teste, ok, detalhe) values ('cliente vê só produtos ativos', n = 19, n || ' produtos');

  select count(*) into n from public.inventory_balances;
  insert into resultados (teste, ok, detalhe) values ('cliente não vê saldos', n = 0, n || ' linhas');

  begin
    insert into public.products (slug, name) values ('invasao', 'Invasão');
    insert into resultados (teste, ok) values ('cliente não cria produto', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('cliente não cria produto', true);
  end;

  update public.products set name = 'Alterado' where slug = 'brinco-gota-aurora';
  get diagnostics n = row_count;
  insert into resultados (teste, ok, detalhe) values ('cliente não altera produto', n = 0, n || ' linhas alteradas');

  begin
    perform public.registrar_ajuste((select id from public.product_variants where sku = 'AR-BRC001-OURO'), 5, 'tentativa');
    insert into resultados (teste, ok) values ('cliente não movimenta estoque', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('cliente não movimenta estoque', true);
  end;

  begin
    perform * from public.painel_estoque();
    insert into resultados (teste, ok) values ('cliente não abre o painel de estoque', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('cliente não abre o painel de estoque', true);
  end;

  begin
    insert into public.admin_members (user_id) values ('22222222-2222-2222-2222-222222222222');
    insert into resultados (teste, ok) values ('cliente não se torna admin', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('cliente não se torna admin', true);
  end;
end $$;
reset role;

-- 3. Admin --------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}', true);
do $$
declare
  n int;
  brinco uuid := (select id from public.product_variants where sku = 'AR-BRC001-OURO');
  colar uuid := (select id from public.product_variants where sku = 'AR-COL001-OURO-40CM');
  aurora uuid := (select id from public.product_variants where sku = 'AR-KIT002-OURO');
  saldo public.inventory_balances;
begin
  select count(*) into n from public.products;
  insert into resultados (teste, ok, detalhe) values ('admin vê rascunhos', n = 20, n || ' produtos');

  select count(*) into n from public.painel_estoque();
  insert into resultados (teste, ok, detalhe) values ('admin abre o painel de estoque', n = 73, n || ' variações');

  begin
    update public.inventory_balances set on_hand = 999 where variant_id = brinco;
    insert into resultados (teste, ok) values ('admin não altera saldo direto', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('admin não altera saldo direto', true);
  end;

  saldo := public.registrar_entrada(brinco, 3, 'Chegada de mercadoria');
  select count(*) into n from public.inventory_movements
   where variant_id = brinco and type = 'entrada' and on_hand_delta = 3 and actor_id = '11111111-1111-1111-1111-111111111111';
  insert into resultados (teste, ok, detalhe) values ('entrada soma ao saldo e registra quem fez', saldo.on_hand = 9 and n = 1, 'saldo ' || saldo.on_hand);

  begin
    perform public.registrar_ajuste(brinco, -100, 'Avaria');
    insert into resultados (teste, ok) values ('ajuste não deixa saldo negativo', false);
  exception when check_violation then
    insert into resultados (teste, ok) values ('ajuste não deixa saldo negativo', true);
  end;

  begin
    perform public.registrar_ajuste(brinco, -1, '   ');
    insert into resultados (teste, ok) values ('ajuste exige motivo', false);
  exception when invalid_parameter_value then
    insert into resultados (teste, ok) values ('ajuste exige motivo', true);
  end;

  saldo := public.registrar_contagem(brinco, 4, 'Contagem mensal');
  select count(*) into n from public.inventory_movements where variant_id = brinco and type = 'contagem' and on_hand_delta = -5;
  insert into resultados (teste, ok, detalhe) values ('contagem iguala o saldo e registra a diferença', saldo.on_hand = 4 and n = 1, 'saldo ' || saldo.on_hand);

  select disponivel into n from public.painel_estoque() where variant_id = aurora;
  insert into resultados (teste, ok, detalhe) values ('kit composto = menor peça (brinco 4, colar 3)', n = 3, n::text);
  perform public.registrar_contagem(colar, 1, 'Contagem');
  select disponivel into n from public.painel_estoque() where variant_id = aurora;
  insert into resultados (teste, ok, detalhe) values ('kit composto acompanha a peça que acabou de mudar', n = 1, n::text);

  begin
    perform private.disponivel(aurora);
    insert into resultados (teste, ok) values ('funções internas não são chamáveis pelo site', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('funções internas não são chamáveis pelo site', true);
  end;

  begin
    perform public.registrar_entrada(aurora, 5, 'Tentativa');
    insert into resultados (teste, ok) values ('kit composto não tem saldo próprio', false);
  exception when invalid_parameter_value then
    insert into resultados (teste, ok) values ('kit composto não tem saldo próprio', true);
  end;

  begin
    update public.inventory_movements set reason = 'adulterado' where variant_id = brinco;
    insert into resultados (teste, ok) values ('histórico não pode ser editado', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('histórico não pode ser editado', true);
  end;

  delete from public.products where slug = 'brinco-gota-aurora';
  get diagnostics n = row_count;
  insert into resultados (teste, ok, detalhe) values ('produto ativo não é apagado', n = 0, n || ' apagados');

  delete from public.products where slug = 'rascunho-de-teste';
  get diagnostics n = row_count;
  insert into resultados (teste, ok, detalhe) values ('rascunho pode ser apagado', n = 1, n || ' apagados');

  begin
    insert into public.product_variants (product_id, sku, attributes, price_cents)
    values ((select id from public.products where slug = 'colar-elo-fino'), 'AR-TESTE-1', '{"peso":"10g"}', 1000);
    insert into resultados (teste, ok) values ('atributo fora da lista é recusado', false);
  exception when check_violation then
    insert into resultados (teste, ok) values ('atributo fora da lista é recusado', true);
  end;

  begin
    insert into public.product_variants (product_id, sku, attributes, price_cents, promo_price_cents, promo_starts_at, promo_ends_at)
    values ((select id from public.products where slug = 'colar-elo-fino'), 'AR-TESTE-2', '{"banho":"Prata"}', 1000, 1200, now(), now() + interval '1 day');
    insert into resultados (teste, ok) values ('promoção maior que o preço é recusada', false);
  exception when check_violation then
    insert into resultados (teste, ok) values ('promoção maior que o preço é recusada', true);
  end;

  begin
    insert into public.kit_components (kit_variant_id, component_variant_id, quantity)
    values (aurora, (select id from public.product_variants where sku = 'AR-KIT003-OURO'), 1);
    insert into resultados (teste, ok) values ('kit não pode ser peça de outro kit', false);
  exception when check_violation then
    insert into resultados (teste, ok) values ('kit não pode ser peça de outro kit', true);
  end;
end $$;
reset role;

-- Fotos: o admin lê os arquivos do bucket (necessário para apagar); visitante e cliente não listam.
insert into storage.objects (bucket_id, name) values ('produtos', 'teste/arquivo-de-teste.webp');
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
insert into resultados (teste, ok, detalhe)
  select 'visitante não lista arquivos de fotos', count(*) = 0, count(*) || ' arquivos' from storage.objects where bucket_id = 'produtos' and name = 'teste/arquivo-de-teste.webp';
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}', true);
insert into resultados (teste, ok, detalhe)
  select 'cliente não lista arquivos de fotos', count(*) = 0, count(*) || ' arquivos' from storage.objects where bucket_id = 'produtos' and name = 'teste/arquivo-de-teste.webp';
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}', true);
insert into resultados (teste, ok, detalhe)
  select 'admin lê os arquivos de fotos (para poder apagá-los)', count(*) = 1, count(*) || ' arquivos' from storage.objects where bucket_id = 'produtos' and name = 'teste/arquivo-de-teste.webp';
reset role;

-- Histórico também é imutável para o dono do banco.
do $$
begin
  begin
    delete from public.inventory_movements;
    insert into resultados (teste, ok) values ('histórico não pode ser apagado nem pelo dono do banco', false);
  exception when insufficient_privilege then
    insert into resultados (teste, ok) values ('histórico não pode ser apagado nem pelo dono do banco', true);
  end;
end $$;

-- Biblioteca: acesso, reutilização, preservação e exclusão retomável.
insert into public.media_assets(name,default_alt,storage_path) values ('Privada','Foto privada','biblioteca-teste/privada.webp');
set local role anon;
do $$ begin
  begin
    perform 1 from public.media_assets;
    insert into resultados(teste,ok) values ('visitante não lê biblioteca', false);
  exception when insufficient_privilege then
    insert into resultados(teste,ok) values ('visitante não lê biblioteca', true);
  end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}', true);
do $$ begin
  begin
    insert into public.media_assets(name,default_alt,storage_path) values ('Invasão','Invasão','invasao/teste.webp');
    insert into resultados(teste,ok) values ('cliente não cadastra mídia',false);
  exception when insufficient_privilege then
    insert into resultados(teste,ok) values ('cliente não cadastra mídia',true);
  end;
  insert into resultados(teste,ok) select 'cliente não lê biblioteca existente', count(*)=0 from public.media_assets;
  begin
    update public.media_assets set deleting=true;
    insert into resultados(teste,ok) values ('cliente não altera estado de exclusão',false);
  exception when insufficient_privilege then
    insert into resultados(teste,ok) values ('cliente não altera estado de exclusão',true);
  end;
  begin
    perform public.iniciar_exclusao_midia(gen_random_uuid());
    insert into resultados(teste,ok) values ('cliente não inicia exclusão',false);
  exception when insufficient_privilege then
    insert into resultados(teste,ok) values ('cliente não inicia exclusão',true);
  end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}', true);
do $$
declare p1 uuid; p2 uuid; mid uuid; caminho text := 'biblioteca-teste/foto.webp'; n integer; j integer;
begin
  insert into public.products(name,slug) values ('Foto teste 1','foto-teste-1') returning id into p1;
  insert into public.products(name,slug) values ('Foto teste 2','foto-teste-2') returning id into p2;
  insert into public.product_images(product_id,storage_path,alt,is_cover) values (p1,caminho,'Detalhe real',true);
  select id into mid from public.media_assets where storage_path=caminho;
  insert into resultados(teste,ok) values ('foto do produto entra na biblioteca',mid is not null);
  insert into public.product_images(product_id,storage_path,alt,is_cover) values (p2,caminho,'Outra descrição',true);
  select count(*) into n from public.product_images where storage_path=caminho;
  insert into resultados(teste,ok) values ('mesma mídia pode ser usada em dois produtos',n=2);
  begin
    perform public.iniciar_exclusao_midia(mid);
    insert into resultados(teste,ok) values ('foto em uso não pode ser excluída',false);
  exception when check_violation then
    insert into resultados(teste,ok) values ('foto em uso não pode ser excluída',true);
  end;
  insert into storage.objects(bucket_id,name) values ('produtos',caminho),('produtos','biblioteca-teste/foto-p.webp');
  -- O Storage real bloqueia delete direto em storage.objects (trigger protect_delete); libera só neste teste.
  perform set_config('storage.allow_delete_query','true',true);
  delete from storage.objects where bucket_id='produtos' and name in (caminho,'biblioteca-teste/foto-p.webp');
  get diagnostics n=row_count;
  insert into resultados(teste,ok) values ('Storage preserva grande e pequena registradas',n=0);
  begin
    update storage.objects set name='biblioteca-teste/adulterada.webp' where bucket_id='produtos' and name=caminho;
    get diagnostics n=row_count;
    insert into resultados(teste,ok) values ('Storage não substitui mídia registrada',n=0);
  exception when insufficient_privilege then
    insert into resultados(teste,ok) values ('Storage não substitui mídia registrada',true);
  end;
  delete from public.product_images where product_id=p1;
  delete from public.products where id=p2;
  select count(*) into n from public.media_assets where id=mid;
  insert into resultados(teste,ok) values ('retirar vínculo e apagar rascunho preservam biblioteca',n=1);
  perform public.iniciar_exclusao_midia(mid);
  perform public.iniciar_exclusao_midia(mid);
  insert into resultados(teste,ok) values ('iniciar exclusão aceita retomada',true);
  begin
    insert into public.product_images(product_id,storage_path,alt) values (p1,caminho,'Tentativa');
    insert into resultados(teste,ok) values ('mídia em exclusão não recebe vínculo',false);
  exception when check_violation then
    insert into resultados(teste,ok) values ('mídia em exclusão não recebe vínculo',true);
  end;
  begin
    perform public.finalizar_exclusao_midia(mid);
    insert into resultados(teste,ok) values ('não finaliza enquanto houver arquivo',false);
  exception when check_violation then
    insert into resultados(teste,ok) values ('não finaliza enquanto houver arquivo',true);
  end;
  -- O Storage real bloqueia delete direto em storage.objects (trigger protect_delete); libera só neste teste.
  perform set_config('storage.allow_delete_query','true',true);
  delete from storage.objects where bucket_id='produtos' and name=caminho;
  begin
    perform public.finalizar_exclusao_midia(mid);
    insert into resultados(teste,ok) values ('falha parcial preserva registro para retomar',false);
  exception when check_violation then
    insert into resultados(teste,ok) values ('falha parcial preserva registro para retomar',true);
  end;
  -- O Storage real bloqueia delete direto em storage.objects (trigger protect_delete); libera só neste teste.
  perform set_config('storage.allow_delete_query','true',true);
  delete from storage.objects where bucket_id='produtos' and name='biblioteca-teste/foto-p.webp';
  perform public.finalizar_exclusao_midia(mid);
  perform public.finalizar_exclusao_midia(mid);
  select count(*) into n from public.media_assets where id=mid;
  insert into resultados(teste,ok) values ('finaliza só sem arquivos e aceita repetição',n=0);
  for j in 1..12 loop
    insert into public.product_images(product_id,storage_path,alt) values (p1,'limite/'||j||'.webp','Foto '||j);
  end loop;
  begin
    insert into public.product_images(product_id,storage_path,alt) values (p1,'limite/13.webp','Foto excedente');
    insert into resultados(teste,ok) values ('banco impede mais de 12 fotos',false);
  exception when check_violation then
    insert into resultados(teste,ok) values ('banco impede mais de 12 fotos',true);
  end;
end $$;
reset role;

-- Avisos do painel e aparelhos push (NOT-DEC-001) ------------------------------------------
-- Admin: cadastra o próprio aparelho, cria aviso de teste, marca como lido; não cria aviso de compra,
-- não cadastra aparelho em nome de outro nem altera o texto de um aviso.
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}', true);
do $$
declare n int; lido timestamptz;
begin
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values ('11111111-1111-1111-1111-111111111111', 'https://web.push.apple.com/teste-aparelho', repeat('p', 87), repeat('a', 22), 'iPhone de teste');
  select count(*) into n from public.push_subscriptions;
  insert into resultados(teste, ok) values ('admin cadastra o próprio aparelho para avisos', n = 1);

  begin
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values ('22222222-2222-2222-2222-222222222222', 'https://web.push.apple.com/em-nome-de-outro', repeat('p', 87), repeat('a', 22));
    insert into resultados(teste, ok) values ('admin não cadastra aparelho em nome de outro usuário', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('admin não cadastra aparelho em nome de outro usuário', true);
  end;

  begin
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values ('11111111-1111-1111-1111-111111111111', 'http://inseguro.exemplo.invalid/x', repeat('p', 87), repeat('a', 22));
    insert into resultados(teste, ok) values ('aparelho só aceita endereço https', false);
  exception when check_violation then
    insert into resultados(teste, ok) values ('aparelho só aceita endereço https', true);
  end;

  insert into public.admin_notifications (kind, title, body) values ('teste', 'Aviso de teste', 'Funcionando.');
  select count(*) into n from public.admin_notifications where read_at is null;
  insert into resultados(teste, ok) values ('admin cria aviso de teste, que nasce não lido', n = 1);

  begin
    insert into public.admin_notifications (kind, title, body) values ('compra', 'Nova compra', '#1');
    insert into resultados(teste, ok) values ('admin não cria aviso de compra pelo painel', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('admin não cria aviso de compra pelo painel', true);
  end;

  begin
    insert into public.admin_notifications (kind, title, url) values ('teste', 'Fora do painel', 'https://exemplo.invalid');
    insert into resultados(teste, ok) values ('aviso só aponta para dentro do painel', false);
  exception when check_violation then
    insert into resultados(teste, ok) values ('aviso só aponta para dentro do painel', true);
  end;

  begin
    update public.admin_notifications set title = 'Adulterado';
    insert into resultados(teste, ok) values ('admin não altera o texto de um aviso', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('admin não altera o texto de um aviso', true);
  end;

  update public.admin_notifications set read_at = now() where read_at is null;
  select count(*) into n from public.admin_notifications where read_at is null;
  insert into resultados(teste, ok) values ('admin marca avisos como lidos', n = 0);
end $$;
reset role;

-- Cliente logado (não é admin): não enxerga nem grava nada.
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.push_subscriptions;
  insert into resultados(teste, ok, detalhe) values ('cliente não vê aparelhos de avisos', n = 0, n || ' linhas');
  select count(*) into n from public.admin_notifications;
  insert into resultados(teste, ok, detalhe) values ('cliente não vê os avisos do painel', n = 0, n || ' linhas');

  begin
    insert into public.admin_notifications (kind, title) values ('teste', 'Invasão');
    insert into resultados(teste, ok) values ('cliente não cria aviso', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('cliente não cria aviso', true);
  end;

  begin
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values ('22222222-2222-2222-2222-222222222222', 'https://web.push.apple.com/cliente', repeat('p', 87), repeat('a', 22));
    insert into resultados(teste, ok) values ('cliente não cadastra aparelho para avisos', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('cliente não cadastra aparelho para avisos', true);
  end;

  delete from public.push_subscriptions;
  get diagnostics n = row_count;
  insert into resultados(teste, ok) values ('cliente não remove aparelhos', n = 0);
end $$;
reset role;

-- Visitante anônimo: sem acesso algum às duas tabelas.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform 1 from public.push_subscriptions;
    insert into resultados(teste, ok) values ('visitante não lê aparelhos de avisos', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('visitante não lê aparelhos de avisos', true);
  end;
  begin
    perform 1 from public.admin_notifications;
    insert into resultados(teste, ok) values ('visitante não lê os avisos do painel', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('visitante não lê os avisos do painel', true);
  end;
end $$;
reset role;

-- Financeiro do painel (FIN-DEC-001) ---------------------------------------------------------
-- Admin lança entrada e saída, cadastra despesa fixa e a paga uma vez por mês; o banco recusa valor
-- zerado, pagamento em dobro no mesmo mês e pagamento de despesa fixa como entrada. Cliente e visitante não acessam.
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}', true);
do $$
declare n int; fixa uuid; r boolean;
begin
  insert into public.finance_entries (kind, amount_cents, occurred_on, category, description)
  values ('entrada', 15990, '2026-11-03', 'venda', 'Venda no balcão'), ('saida', 4500, '2026-11-04', 'embalagem', 'Caixinhas');
  select count(*) into n from public.finance_entries;
  insert into resultados(teste, ok) values ('admin lança entrada e saída', n = 2);

  insert into public.finance_fixed_expenses (name, amount_cents, due_day, category)
  values ('Aluguel', 120000, 5, 'aluguel') returning id into fixa;
  insert into public.finance_entries (kind, amount_cents, occurred_on, category, fixed_expense_id, competence)
  values ('saida', 120000, '2026-11-05', 'aluguel', fixa, '2026-11-01');
  insert into resultados(teste, ok) values ('admin paga despesa fixa do mês', true);

  begin
    insert into public.finance_entries (kind, amount_cents, occurred_on, fixed_expense_id, competence)
    values ('saida', 120000, '2026-11-06', fixa, '2026-11-01');
    insert into resultados(teste, ok) values ('banco impede pagar a mesma despesa fixa duas vezes no mês', false);
  exception when unique_violation then
    insert into resultados(teste, ok) values ('banco impede pagar a mesma despesa fixa duas vezes no mês', true);
  end;
  insert into public.finance_entries (kind, amount_cents, occurred_on, fixed_expense_id, competence)
  values ('saida', 120000, '2026-12-05', fixa, '2026-12-01');
  insert into resultados(teste, ok) values ('a mesma despesa fixa pode ser paga em outro mês', true);

  begin
    insert into public.finance_entries (kind, amount_cents, occurred_on) values ('entrada', 0, '2026-11-04');
    insert into resultados(teste, ok) values ('banco recusa valor zerado', false);
  exception when check_violation then
    insert into resultados(teste, ok) values ('banco recusa valor zerado', true);
  end;
  begin
    insert into public.finance_entries (kind, amount_cents, occurred_on, fixed_expense_id, competence)
    values ('entrada', 100, '2026-10-05', fixa, '2026-10-01');
    insert into resultados(teste, ok) values ('pagamento de despesa fixa não pode ser entrada', false);
  exception when check_violation then
    insert into resultados(teste, ok) values ('pagamento de despesa fixa não pode ser entrada', true);
  end;
  begin
    insert into public.finance_entries (kind, amount_cents, occurred_on, fixed_expense_id, competence)
    values ('saida', 100, '2026-10-05', fixa, '2026-10-15');
    insert into resultados(teste, ok) values ('mês de referência é sempre o dia 1', false);
  exception when check_violation then
    insert into resultados(teste, ok) values ('mês de referência é sempre o dia 1', true);
  end;

  select entradas = 15990 and saidas = 124500 into strict r from public.financeiro_resumo('2026-11-01', '2026-11-30');
  insert into resultados(teste, ok) values ('resumo do mês soma entradas e saídas no banco', r);

  -- Apagar a despesa fixa preserva o dinheiro já lançado.
  delete from public.finance_fixed_expenses where id = fixa;
  select count(*) into n from public.finance_entries where occurred_on in ('2026-11-05', '2026-12-05');
  insert into resultados(teste, ok, detalhe) values ('apagar despesa fixa mantém os lançamentos pagos', n = 2, n || ' lançamentos');
end $$;
reset role;

-- Cliente logado (não admin): não vê nem grava nada do financeiro.
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.finance_entries;
  insert into resultados(teste, ok, detalhe) values ('cliente não vê lançamentos', n = 0, n || ' linhas');
  select count(*) into n from public.finance_fixed_expenses;
  insert into resultados(teste, ok, detalhe) values ('cliente não vê despesas fixas', n = 0, n || ' linhas');
  begin
    insert into public.finance_entries (kind, amount_cents, occurred_on) values ('entrada', 100, '2026-11-04');
    insert into resultados(teste, ok) values ('cliente não lança entrada', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('cliente não lança entrada', true);
  end;
  delete from public.finance_entries;
  get diagnostics n = row_count;
  insert into resultados(teste, ok) values ('cliente não apaga lançamentos', n = 0);
  select entradas + saidas into n from public.financeiro_resumo('2026-01-01', '2026-12-31');
  insert into resultados(teste, ok, detalhe) values ('cliente não enxerga valores pelo resumo', n = 0, n || ' centavos');
end $$;
reset role;

-- Visitante anônimo: sem acesso.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform 1 from public.finance_entries;
    insert into resultados(teste, ok) values ('visitante não lê lançamentos', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('visitante não lê lançamentos', true);
  end;
  begin
    perform 1 from public.finance_fixed_expenses;
    insert into resultados(teste, ok) values ('visitante não lê despesas fixas', false);
  exception when insufficient_privilege then
    insert into resultados(teste, ok) values ('visitante não lê despesas fixas', true);
  end;
end $$;
reset role;

select n, teste, ok, detalhe from resultados order by n;
rollback;
