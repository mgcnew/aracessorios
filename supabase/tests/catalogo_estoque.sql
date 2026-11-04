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
  delete from storage.objects where bucket_id='produtos' and name=caminho;
  begin
    perform public.finalizar_exclusao_midia(mid);
    insert into resultados(teste,ok) values ('falha parcial preserva registro para retomar',false);
  exception when check_violation then
    insert into resultados(teste,ok) values ('falha parcial preserva registro para retomar',true);
  end;
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

select n, teste, ok, detalhe from resultados order by n;
rollback;
