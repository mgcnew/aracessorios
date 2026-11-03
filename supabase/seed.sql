-- Gerado por scripts/gerar-seed.ts. Não edite à mão.
-- Catálogo de DEMONSTRAÇÃO: produtos, preços e estoques fictícios.
begin;
do $$ begin
  if exists (select 1 from public.products) then
    raise exception 'O banco já tem produtos: carga de demonstração não aplicada';
  end if;
end $$;

-- Categorias
insert into public.categories (slug, name, position) values
  ('brincos', 'Brincos', 0),
  ('colares', 'Colares', 1),
  ('pulseiras', 'Pulseiras', 2),
  ('aneis', 'Anéis', 3),
  ('tornozeleiras', 'Tornozeleiras', 4),
  ('piercings', 'Piercings', 5);

-- Produtos
insert into public.products (slug, name, short_description, description, material, status, kind, sale_unit, is_new, is_featured) values
  ('brinco-gota-aurora', 'Brinco Gota Aurora', '', 'Gota delicada com pérola ao centro, leve para usar do trabalho à noite.', 'Semijoia com banho, pérola sintética (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'par'::public.sale_unit, true, true),
  ('brinco-argola-lunar', 'Brinco Argola Lunar', '', 'Argola lisa de linhas suaves, em três tamanhos para compor com qualquer visual.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'par'::public.sale_unit, false, true),
  ('brinco-perola-classica', 'Brinco Pérola Clássica', '', 'Ponto de luz clássico, para usar sozinho ou em composição com outros brincos.', 'Semijoia com banho, pérola sintética (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'par'::public.sale_unit, false, false),
  ('colar-ponto-de-luz', 'Colar Ponto de Luz', '', 'Corrente fina com um pingente brilhante, discreta e fácil de combinar.', 'Semijoia com banho, zircônia (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, false),
  ('colar-gotas-de-orvalho', 'Colar Gotas de Orvalho', '', 'Pingente em gota com acabamento luminoso, para dar leveza ao decote.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, true, false),
  ('colar-elo-fino', 'Colar Elo Fino', '', 'Corrente de elos finos, ideal para o uso diário e para sobreposição.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, true),
  ('pulseira-riviera-delicada', 'Pulseira Riviera Delicada', '', 'Fio de pontos brilhantes que acompanha o pulso com leveza.', 'Semijoia com banho, zircônia (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, true),
  ('pulseira-elos-suaves', 'Pulseira Elos Suaves', '', 'Elos arredondados em design contínuo, para usar sozinha ou em pilha.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, true, false),
  ('pulseira-perolas-e-ouro', 'Pulseira Pérolas e Ouro', '', 'Pérolas alternadas com detalhes dourados. Peça esgotada na demonstração.', 'Semijoia com banho, pérola sintética (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, false),
  ('anel-solitario-brilho', 'Anel Solitário Brilho', '', 'Solitário clássico com pedra central em destaque.', 'Semijoia com banho, zircônia (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, true),
  ('anel-duo-entrelacado', 'Anel Duo Entrelaçado', '', 'Dois fios que se entrelaçam em um desenho contemporâneo.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, true, false),
  ('anel-fio-de-ouro', 'Anel Fio de Ouro', '', 'Aro fino e liso, perfeito para empilhar.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, false),
  ('tornozeleira-mare', 'Tornozeleira Maré', '', 'Corrente ondulada e leve para os dias de sol.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, false),
  ('tornozeleira-coracao-dourado', 'Tornozeleira Coração Dourado', '', 'Corrente fina com um pequeno coração como detalhe.', 'Semijoia com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, true, false),
  ('piercing-argola-segmento', 'Piercing Argola Segmento', '', 'Argola segmentada com esfera, discreta e moderna.', 'Aço com banho (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, false),
  ('piercing-pontinho-de-luz', 'Piercing Pontinho de Luz', '', 'Pequeno brilho para compor orelhas e destaques.', 'Aço com banho, zircônia (dados demonstrativos)', 'ativo', 'simples'::public.product_kind, 'unidade'::public.sale_unit, false, false),
  ('kit-presente-luz', 'Kit Presente Luz', 'Brincos, colar e anel em embalagem de presente.', 'Conjunto pensado para presentear, com peças que combinam entre si.', 'Conjunto de semijoias com banho (dados demonstrativos)', 'ativo', 'kit_estoque_proprio'::public.product_kind, 'conjunto'::public.sale_unit, false, false),
  ('conjunto-aurora', 'Conjunto Aurora', 'Brinco Gota Aurora + Colar Ponto de Luz.', 'Brincos e colar que se completam, reunidos em um único conjunto.', 'Conjunto de semijoias com banho (dados demonstrativos)', 'ativo', 'kit_composto'::public.product_kind, 'conjunto'::public.sale_unit, false, false),
  ('conjunto-noite-estrelada', 'Conjunto Noite Estrelada', 'Brinco Pérola Clássica + Pulseira Pérolas e Ouro.', 'Conjunto de pérolas para ocasiões especiais.', 'Conjunto de semijoias com banho (dados demonstrativos)', 'ativo', 'kit_composto'::public.product_kind, 'conjunto'::public.sale_unit, false, false);

-- Produto × categoria
insert into public.product_categories (product_id, category_id)
select p.id, c.id from (values
  ('brinco-gota-aurora', 'brincos'),
  ('brinco-argola-lunar', 'brincos'),
  ('brinco-perola-classica', 'brincos'),
  ('colar-ponto-de-luz', 'colares'),
  ('colar-gotas-de-orvalho', 'colares'),
  ('colar-elo-fino', 'colares'),
  ('pulseira-riviera-delicada', 'pulseiras'),
  ('pulseira-elos-suaves', 'pulseiras'),
  ('pulseira-perolas-e-ouro', 'pulseiras'),
  ('anel-solitario-brilho', 'aneis'),
  ('anel-duo-entrelacado', 'aneis'),
  ('anel-fio-de-ouro', 'aneis'),
  ('tornozeleira-mare', 'tornozeleiras'),
  ('tornozeleira-coracao-dourado', 'tornozeleiras'),
  ('piercing-argola-segmento', 'piercings'),
  ('piercing-pontinho-de-luz', 'piercings'),
  ('kit-presente-luz', 'brincos'),
  ('kit-presente-luz', 'colares'),
  ('conjunto-aurora', 'brincos'),
  ('conjunto-aurora', 'colares'),
  ('conjunto-noite-estrelada', 'brincos'),
  ('conjunto-noite-estrelada', 'pulseiras')
) as x(produto, categoria)
join public.products p on p.slug = x.produto
join public.categories c on c.slug = x.categoria;

-- Variações. No protótipo, "compare" era o preço "de"; aqui vira preço normal + promocional.
insert into public.product_variants (product_id, sku, attributes, price_cents, promo_price_cents, promo_starts_at, promo_ends_at, min_stock, position)
select p.id, x.sku, x.attrs::jsonb, x.preco, x.promo,
  case when x.promo is not null then '2026-11-01 00:00:00-03'::timestamptz end,
  case when x.promo is not null then '2026-11-15 23:59:59-03'::timestamptz end,
  2, x.pos
from (values
  ('brinco-gota-aurora', 'AR-BRC001-OURO', '{"banho":"Ouro 18k"}', 8990, null, 0),
  ('brinco-gota-aurora', 'AR-BRC001-ROSE', '{"banho":"Rosé"}', 8990, null, 1),
  ('brinco-gota-aurora', 'AR-BRC001-RODI', '{"banho":"Ródio"}', 8990, null, 2),
  ('brinco-argola-lunar', 'AR-BRC002-OURO-P', '{"banho":"Ouro 18k","tamanho":"P"}', 8990, 6990, 0),
  ('brinco-argola-lunar', 'AR-BRC002-OURO-M', '{"banho":"Ouro 18k","tamanho":"M"}', 9990, 7990, 1),
  ('brinco-argola-lunar', 'AR-BRC002-OURO-G', '{"banho":"Ouro 18k","tamanho":"G"}', 10990, 8990, 2),
  ('brinco-argola-lunar', 'AR-BRC002-RODI-P', '{"banho":"Ródio","tamanho":"P"}', 8990, 6990, 3),
  ('brinco-argola-lunar', 'AR-BRC002-RODI-M', '{"banho":"Ródio","tamanho":"M"}', 9990, 7990, 4),
  ('brinco-argola-lunar', 'AR-BRC002-RODI-G', '{"banho":"Ródio","tamanho":"G"}', 10990, 8990, 5),
  ('brinco-perola-classica', 'AR-BRC003-OURO', '{"banho":"Ouro 18k"}', 7490, null, 0),
  ('brinco-perola-classica', 'AR-BRC003-RODI', '{"banho":"Ródio"}', 7490, null, 1),
  ('colar-ponto-de-luz', 'AR-COL001-OURO-40CM', '{"banho":"Ouro 18k","tamanho":"40 cm"}', 11990, null, 0),
  ('colar-ponto-de-luz', 'AR-COL001-OURO-45CM', '{"banho":"Ouro 18k","tamanho":"45 cm"}', 11990, null, 1),
  ('colar-ponto-de-luz', 'AR-COL001-RODI-40CM', '{"banho":"Ródio","tamanho":"40 cm"}', 11990, null, 2),
  ('colar-ponto-de-luz', 'AR-COL001-RODI-45CM', '{"banho":"Ródio","tamanho":"45 cm"}', 11990, null, 3),
  ('colar-gotas-de-orvalho', 'AR-COL002-OURO-40CM', '{"banho":"Ouro 18k","tamanho":"40 cm"}', 12990, null, 0),
  ('colar-gotas-de-orvalho', 'AR-COL002-OURO-45CM', '{"banho":"Ouro 18k","tamanho":"45 cm"}', 12990, null, 1),
  ('colar-gotas-de-orvalho', 'AR-COL002-RODI-40CM', '{"banho":"Ródio","tamanho":"40 cm"}', 12990, null, 2),
  ('colar-gotas-de-orvalho', 'AR-COL002-RODI-45CM', '{"banho":"Ródio","tamanho":"45 cm"}', 12990, null, 3),
  ('colar-elo-fino', 'AR-COL003-OURO', '{"banho":"Ouro 18k"}', 9990, null, 0),
  ('colar-elo-fino', 'AR-COL003-ROSE', '{"banho":"Rosé"}', 9990, null, 1),
  ('pulseira-riviera-delicada', 'AR-PUL001-OURO-16CM', '{"banho":"Ouro 18k","tamanho":"16 cm"}', 15990, 13990, 0),
  ('pulseira-riviera-delicada', 'AR-PUL001-OURO-18CM', '{"banho":"Ouro 18k","tamanho":"18 cm"}', 15990, 13990, 1),
  ('pulseira-riviera-delicada', 'AR-PUL001-OURO-20CM', '{"banho":"Ouro 18k","tamanho":"20 cm"}', 15990, 13990, 2),
  ('pulseira-riviera-delicada', 'AR-PUL001-ROSE-16CM', '{"banho":"Rosé","tamanho":"16 cm"}', 15990, 13990, 3),
  ('pulseira-riviera-delicada', 'AR-PUL001-ROSE-18CM', '{"banho":"Rosé","tamanho":"18 cm"}', 15990, 13990, 4),
  ('pulseira-riviera-delicada', 'AR-PUL001-ROSE-20CM', '{"banho":"Rosé","tamanho":"20 cm"}', 15990, 13990, 5),
  ('pulseira-riviera-delicada', 'AR-PUL001-RODI-16CM', '{"banho":"Ródio","tamanho":"16 cm"}', 15990, 13990, 6),
  ('pulseira-riviera-delicada', 'AR-PUL001-RODI-18CM', '{"banho":"Ródio","tamanho":"18 cm"}', 15990, 13990, 7),
  ('pulseira-riviera-delicada', 'AR-PUL001-RODI-20CM', '{"banho":"Ródio","tamanho":"20 cm"}', 15990, 13990, 8),
  ('pulseira-elos-suaves', 'AR-PUL002-OURO', '{"banho":"Ouro 18k"}', 10990, null, 0),
  ('pulseira-elos-suaves', 'AR-PUL002-ROSE', '{"banho":"Rosé"}', 10990, null, 1),
  ('pulseira-perolas-e-ouro', 'AR-PUL003-OURO', '{"banho":"Ouro 18k"}', 9490, null, 0),
  ('pulseira-perolas-e-ouro', 'AR-PUL003-ROSE', '{"banho":"Rosé"}', 9490, null, 1),
  ('anel-solitario-brilho', 'AR-ANE001-OURO-14', '{"banho":"Ouro 18k","tamanho":"14"}', 8990, null, 0),
  ('anel-solitario-brilho', 'AR-ANE001-OURO-16', '{"banho":"Ouro 18k","tamanho":"16"}', 8990, null, 1),
  ('anel-solitario-brilho', 'AR-ANE001-OURO-18', '{"banho":"Ouro 18k","tamanho":"18"}', 8990, null, 2),
  ('anel-solitario-brilho', 'AR-ANE001-ROSE-14', '{"banho":"Rosé","tamanho":"14"}', 8990, null, 3),
  ('anel-solitario-brilho', 'AR-ANE001-ROSE-16', '{"banho":"Rosé","tamanho":"16"}', 8990, null, 4),
  ('anel-solitario-brilho', 'AR-ANE001-ROSE-18', '{"banho":"Rosé","tamanho":"18"}', 8990, null, 5),
  ('anel-solitario-brilho', 'AR-ANE001-RODI-14', '{"banho":"Ródio","tamanho":"14"}', 8990, null, 6),
  ('anel-solitario-brilho', 'AR-ANE001-RODI-16', '{"banho":"Ródio","tamanho":"16"}', 8990, null, 7),
  ('anel-solitario-brilho', 'AR-ANE001-RODI-18', '{"banho":"Ródio","tamanho":"18"}', 8990, null, 8),
  ('anel-duo-entrelacado', 'AR-ANE002-OURO-14', '{"banho":"Ouro 18k","tamanho":"14"}', 7990, null, 0),
  ('anel-duo-entrelacado', 'AR-ANE002-OURO-16', '{"banho":"Ouro 18k","tamanho":"16"}', 7990, null, 1),
  ('anel-duo-entrelacado', 'AR-ANE002-OURO-18', '{"banho":"Ouro 18k","tamanho":"18"}', 7990, null, 2),
  ('anel-duo-entrelacado', 'AR-ANE002-ROSE-14', '{"banho":"Rosé","tamanho":"14"}', 7990, null, 3),
  ('anel-duo-entrelacado', 'AR-ANE002-ROSE-16', '{"banho":"Rosé","tamanho":"16"}', 7990, null, 4),
  ('anel-duo-entrelacado', 'AR-ANE002-ROSE-18', '{"banho":"Rosé","tamanho":"18"}', 7990, null, 5),
  ('anel-fio-de-ouro', 'AR-ANE003-OURO-14', '{"banho":"Ouro 18k","tamanho":"14"}', 5990, null, 0),
  ('anel-fio-de-ouro', 'AR-ANE003-OURO-16', '{"banho":"Ouro 18k","tamanho":"16"}', 5990, null, 1),
  ('anel-fio-de-ouro', 'AR-ANE003-OURO-18', '{"banho":"Ouro 18k","tamanho":"18"}', 5990, null, 2),
  ('anel-fio-de-ouro', 'AR-ANE003-RODI-14', '{"banho":"Ródio","tamanho":"14"}', 5990, null, 3),
  ('anel-fio-de-ouro', 'AR-ANE003-RODI-16', '{"banho":"Ródio","tamanho":"16"}', 5990, null, 4),
  ('anel-fio-de-ouro', 'AR-ANE003-RODI-18', '{"banho":"Ródio","tamanho":"18"}', 5990, null, 5),
  ('tornozeleira-mare', 'AR-TOR001-OURO-22CM', '{"banho":"Ouro 18k","tamanho":"22 cm"}', 7490, null, 0),
  ('tornozeleira-mare', 'AR-TOR001-OURO-25CM', '{"banho":"Ouro 18k","tamanho":"25 cm"}', 7490, null, 1),
  ('tornozeleira-mare', 'AR-TOR001-ROSE-22CM', '{"banho":"Rosé","tamanho":"22 cm"}', 7490, null, 2),
  ('tornozeleira-mare', 'AR-TOR001-ROSE-25CM', '{"banho":"Rosé","tamanho":"25 cm"}', 7490, null, 3),
  ('tornozeleira-coracao-dourado', 'AR-TOR002-OURO', '{"banho":"Ouro 18k"}', 6990, null, 0),
  ('tornozeleira-coracao-dourado', 'AR-TOR002-ROSE', '{"banho":"Rosé"}', 6990, null, 1),
  ('piercing-argola-segmento', 'AR-PIE001-OURO-8MM', '{"banho":"Ouro 18k","tamanho":"8 mm"}', 4990, null, 0),
  ('piercing-argola-segmento', 'AR-PIE001-OURO-10MM', '{"banho":"Ouro 18k","tamanho":"10 mm"}', 4990, null, 1),
  ('piercing-argola-segmento', 'AR-PIE001-RODI-8MM', '{"banho":"Ródio","tamanho":"8 mm"}', 4990, null, 2),
  ('piercing-argola-segmento', 'AR-PIE001-RODI-10MM', '{"banho":"Ródio","tamanho":"10 mm"}', 4990, null, 3),
  ('piercing-pontinho-de-luz', 'AR-PIE002-OURO-HAST', '{"banho":"Ouro 18k","modelo":"Haste"}', 3990, null, 0),
  ('piercing-pontinho-de-luz', 'AR-PIE002-OURO-PRES', '{"banho":"Ouro 18k","modelo":"Pressão"}', 3990, null, 1),
  ('piercing-pontinho-de-luz', 'AR-PIE002-RODI-HAST', '{"banho":"Ródio","modelo":"Haste"}', 3990, null, 2),
  ('piercing-pontinho-de-luz', 'AR-PIE002-RODI-PRES', '{"banho":"Ródio","modelo":"Pressão"}', 3990, null, 3),
  ('kit-presente-luz', 'AR-KIT001-OURO', '{"banho":"Ouro 18k"}', 29990, 24990, 0),
  ('kit-presente-luz', 'AR-KIT001-ROSE', '{"banho":"Rosé"}', 29990, 24990, 1),
  ('conjunto-aurora', 'AR-KIT002-OURO', '{"banho":"Ouro 18k"}', 19990, null, 0),
  ('conjunto-noite-estrelada', 'AR-KIT003-OURO', '{"banho":"Ouro 18k"}', 18990, null, 0)
) as x(produto, sku, attrs, preco, promo, pos)
join public.products p on p.slug = x.produto;

-- Peças dos kits compostos (primeira variação de cada peça)
insert into public.kit_components (kit_variant_id, component_variant_id, quantity)
select k.id, c.id, x.qtd from (values
  ('AR-KIT002-OURO', 'AR-BRC001-OURO', 1),
  ('AR-KIT002-OURO', 'AR-COL001-OURO-40CM', 1),
  ('AR-KIT003-OURO', 'AR-BRC003-OURO', 1),
  ('AR-KIT003-OURO', 'AR-PUL003-OURO', 1)
) as x(kit, peca, qtd)
join public.product_variants k on k.sku = x.kit
join public.product_variants c on c.sku = x.peca;

-- Estoque inicial, com histórico
create temporary table carga_saldo (sku text primary key, qtd integer) on commit drop;
insert into carga_saldo values
  ('AR-BRC001-OURO', 6),
  ('AR-BRC001-ROSE', 6),
  ('AR-BRC001-RODI', 6),
  ('AR-BRC002-OURO-P', 5),
  ('AR-BRC002-OURO-M', 5),
  ('AR-BRC002-OURO-G', 5),
  ('AR-BRC002-RODI-P', 5),
  ('AR-BRC002-RODI-M', 5),
  ('AR-BRC003-OURO', 12),
  ('AR-BRC003-RODI', 12),
  ('AR-COL001-OURO-40CM', 3),
  ('AR-COL001-OURO-45CM', 3),
  ('AR-COL001-RODI-40CM', 3),
  ('AR-COL002-OURO-40CM', 5),
  ('AR-COL002-OURO-45CM', 5),
  ('AR-COL002-RODI-40CM', 5),
  ('AR-COL002-RODI-45CM', 5),
  ('AR-COL003-OURO', 5),
  ('AR-COL003-ROSE', 5),
  ('AR-PUL001-OURO-16CM', 5),
  ('AR-PUL001-OURO-18CM', 5),
  ('AR-PUL001-OURO-20CM', 5),
  ('AR-PUL001-ROSE-16CM', 5),
  ('AR-PUL001-ROSE-18CM', 5),
  ('AR-PUL001-RODI-16CM', 5),
  ('AR-PUL001-RODI-18CM', 5),
  ('AR-PUL001-RODI-20CM', 5),
  ('AR-PUL002-OURO', 5),
  ('AR-PUL002-ROSE', 5),
  ('AR-ANE001-OURO-14', 5),
  ('AR-ANE001-OURO-16', 5),
  ('AR-ANE001-OURO-18', 5),
  ('AR-ANE001-ROSE-14', 5),
  ('AR-ANE001-ROSE-16', 5),
  ('AR-ANE001-ROSE-18', 5),
  ('AR-ANE001-RODI-14', 5),
  ('AR-ANE001-RODI-16', 5),
  ('AR-ANE001-RODI-18', 5),
  ('AR-ANE002-OURO-14', 5),
  ('AR-ANE002-OURO-16', 5),
  ('AR-ANE002-OURO-18', 5),
  ('AR-ANE002-ROSE-14', 5),
  ('AR-ANE002-ROSE-16', 5),
  ('AR-ANE002-ROSE-18', 5),
  ('AR-ANE003-OURO-14', 5),
  ('AR-ANE003-OURO-16', 5),
  ('AR-ANE003-OURO-18', 5),
  ('AR-ANE003-RODI-14', 5),
  ('AR-ANE003-RODI-18', 5),
  ('AR-TOR001-OURO-22CM', 5),
  ('AR-TOR001-OURO-25CM', 5),
  ('AR-TOR001-ROSE-22CM', 5),
  ('AR-TOR001-ROSE-25CM', 5),
  ('AR-TOR002-OURO', 5),
  ('AR-TOR002-ROSE', 5),
  ('AR-PIE001-OURO-8MM', 5),
  ('AR-PIE001-OURO-10MM', 5),
  ('AR-PIE001-RODI-8MM', 5),
  ('AR-PIE001-RODI-10MM', 5),
  ('AR-PIE002-OURO-HAST', 5),
  ('AR-PIE002-OURO-PRES', 5),
  ('AR-PIE002-RODI-HAST', 5),
  ('AR-KIT001-OURO', 8),
  ('AR-KIT001-ROSE', 8);
update public.inventory_balances b set on_hand = s.qtd
from carga_saldo s join public.product_variants v on v.sku = s.sku where b.variant_id = v.id;
insert into public.inventory_movements (variant_id, type, on_hand_delta, on_hand_after, reason)
select v.id, 'entrada', s.qtd, s.qtd, 'Carga inicial de demonstração'
from carga_saldo s join public.product_variants v on v.sku = s.sku;
commit;
