# AR Acessórios — Registro de decisões

**Fonte única de decisões do projeto.** Os demais documentos citam os IDs daqui e não repetem nem reinterpretam o texto. Quando uma decisão mudar, altere **esta** linha (o histórico fica no git) e ajuste os documentos que a citam no mesmo commit.

**Estados** (só três):
- **Decidido**: aprovado pelo responsável do projeto. Pode haver detalhes em "Falta definir"; esses detalhes **não** estão decididos.
- **Proposto**: recomendação técnica ou de produto aguardando aprovação. Não implementar como se fosse regra.
- **Em aberto**: ninguém decidiu. Não presumir resposta.

Os IDs antigos foram mantidos para rastreabilidade com o pacote anterior (v2.1, 28/10/2026). Decisões duplicadas foram unificadas e a duplicata aponta para a principal.

---

## 1. Negócio e marca

| ID | Decisão | Estado | Falta definir |
|---|---|---|---|
| D-001 | Loja virtual **própria**, varejo (B2C), **sem vendedores terceiros**. Marketplace multivendedor está fora do escopo. Reconfirmado em 03/11/2026. | Decidido | — |
| D-002 | Segmento: semijoias e acessórios. | Decidido | — |
| D-003 | Estoque próprio. | Decidido | — |
| D-004 | Marca AR Acessórios; logotipo fornecido (monograma AR dourado, emblema circular com pérolas e ramos, fundo preto) usado sem redesenho. | Decidido | Arquivo vetorial (SVG), versões monocromáticas, favicon (ver D-014) |
| D-005 | Desenvolvimento com Claude (principal) e Codex (apoio). | Decidido | — |
| D-006 | Infraestrutura: Supabase e Vercel. | Decidido | — |
| D-016 | **Desenvolvimento próprio**, sem plataforma pronta (Nuvemshop, Shopify etc.). Decidido em 03/11/2026. *(Resolve Q-NEG-01.)* | Decidido | Stack (PR-003) |
| D-018 | Stack: **Next.js (App Router) + React + TypeScript + Supabase** (Postgres, Auth, Storage) na Vercel. Estilos: o CSS do protótipo, sem Tailwind. Decidido em 03/11/2026. *(Aprova PR-003, exceto Tailwind.)* | Decidido | — |
| D-017 | O lançamento inclui **painel de controle para gerenciar o estoque**. Pagamento real pode vir depois; até lá o checkout continua demonstrativo. Decidido em 03/11/2026. | Decidido | — |
| D-019 | Banco de desenvolvimento no Supabase em **São Paulo** (`ar-acessorios-dev`). Decidido em 03/11/2026. | Decidido | — |
| CAT-DEC-001 | Tipos comercializados: Brincos, Colares, Pulseiras, Anéis, Tornozeleiras e Piercings. São tipos de produto, não necessariamente seis categorias fixas. | Decidido | Hierarquia de categorias |

## 2. Catálogo e estoque (detalhes: `modulos/01_CATALOGO_ESTOQUE.md`)

| ID | Decisão | Estado | Falta definir |
|---|---|---|---|
| D-011 | Produtos têm variações. Atributos possíveis: banho/acabamento, tamanho, material, cor e modelo. Nem todo atributo vale para todo produto; só existem as combinações cadastradas. | Decidido | Quais atributos se aplicam a cada tipo |
| CAT-DEC-022 | Atributos da variação guardados como lista chave → valor, aceitando só as chaves da D-011 (`banho`, `tamanho`, `material`, `cor`, `modelo`). Decidido em 03/11/2026. | Decidido | — |
| CAT-DEC-023 | Marcadores **Novo** e **Destaque** definidos à mão no painel; alimentam "Lançamentos" e "Mais vendidos" da home até haver vendas reais. Decidido em 03/11/2026. | Decidido | — |
| CAT-DEC-024 | O visitante vê só se a variação está **disponível ou não**, nunca a quantidade. Decidido em 03/11/2026. | Decidido | Mensagem de "últimas unidades" |
| CAT-DEC-002 | Venda por unidade, par ou conjunto, conforme o produto. | Decidido | Unidade de cada produto |
| CAT-DEC-003 | Kits e conjuntos à venda desde o lançamento. | Decidido | — |
| CAT-DEC-004 | Dois modelos de kit: (a) **kit com estoque próprio**; (b) **kit composto**, cuja disponibilidade vem do estoque das peças. | Decidido | Baixa e reposição por modelo; o que fazer quando um componente muda |
| CAT-DEC-005 | Variações do mesmo produto podem ter preços diferentes. | Decidido | — |
| CAT-DEC-006 | Produto/variação sem estoque vendável não pode ser comprado. Sem pré-venda ou encomenda no lançamento. | Decidido | — |
| CAT-DEC-007 | Composição do kit é fixa e definida pela loja. | Decidido | — |
| CAT-DEC-008 | Kit tem preço próprio, sem obrigação de somar o preço das peças. | Decidido | — |
| CAT-DEC-009 | Ver CAT-DEC-019 (unificada). | Decidido | — |
| CAT-DEC-010 | Baixa definitiva do estoque só após **confirmação validada do pagamento**. Criar pedido ou autorizar cartão não é confirmação. | Decidido | — |
| CAT-DEC-011 | Em cancelamento/devolução, repor estoque automaticamente **quando aplicável**, após validar o estado do pedido, do pagamento e das movimentações anteriores, sem duplicar. | Decidido | Quando uma devolução é elegível para voltar ao estoque |
| CAT-DEC-012 | Ajuste manual de estoque permitido com motivo obrigatório, identificação do operador e histórico imutável. | Decidido | — |
| CAT-DEC-013 | Reserva de estoque começa ao iniciar o checkout/pagamento. | Decidido | Evento exato que dispara a reserva |
| CAT-DEC-014 | Reserva dura 15 minutos. | Decidido | Ver proposta PR-001 |
| CAT-DEC-015 | Reserva expirada é liberada automaticamente **só depois de verificar o estado do pagamento**. Estado desconhecido não libera às cegas. | Decidido | Ver Q-PAG-03 (conflito com PAY-DEC-007) |
| CAT-DEC-016 | Um produto pode estar em várias categorias. | Decidido | — |
| CAT-DEC-017 | SKU único por variante vendável, inclusive kits. SKU editável enquanto PR-005 não for aprovada (03/11/2026). | Decidido | Regra de geração e edição do SKU (ver PR-005) |
| CAT-DEC-018 | Estoque controlado por unidade comercial vendável (unidade, par ou conjunto), sem conversão automática entre elas. | Decidido | — |
| CAT-DEC-019 | Kit composto: quantidade fixa de cada peça; disponibilidade = menor valor, entre as peças, de ⌊estoque vendável da peça ÷ quantidade exigida⌋, descontando reservas ativas. Kit com estoque próprio usa só o próprio saldo e não debita as peças. *(Incorpora CAT-DEC-009.)* | Decidido | — |
| CAT-DEC-020 | Preço normal e preço promocional opcional com data de início e fim. | Decidido | Prioridade entre ofertas, limites, exibição |
| CAT-DEC-021 | Estoque mínimo configurável com alerta; contagem manual com ajustes auditáveis. | Decidido | Periodicidade da contagem; quem recebe os alertas |

## 3. Checkout e pagamentos (detalhes: `modulos/02_PEDIDOS_PAGAMENTOS.md`)

| ID | Decisão | Estado | Falta definir |
|---|---|---|---|
| PAY-DEC-001 | Meios no lançamento: Pix e cartão. Boleto fora. | Decidido | — |
| PAY-DEC-002 | Pagamentos tardios e falhas de conciliação são tratados no Módulo 02, sem estorno nem liberação automáticos. | Decidido | — |
| PAY-DEC-003 | Provedor de pagamento. **Reaberto em 03/11/2026:** Mercado Pago é o mais provável, mas ainda não está decidido. | Em aberto | Escolha do provedor; modalidade de integração (Q-PAG-05) |
| PAY-DEC-004 | Compra como visitante permitida; conta não obrigatória. *(Unifica D-008.)* | Decidido | Dados mínimos pedidos ao visitante |
| PAY-DEC-005 | Cartão de crédito e de débito no lançamento. *(Unifica D-009.)* | Decidido | Confirmar que a integração escolhida aceita débito online |
| PAY-DEC-006 | Pagamento confirmado **depois** de a reserva expirar vai para análise administrativa. Nada automático (nem atender, nem reembolsar). | Decidido | Fluxo da análise (Q-PAG-02) |
| PAY-DEC-007 | Se a consulta ao Mercado Pago falhar, o pedido fica "em conciliação" com novas tentativas. | Decidido | Ver PAY-DEC-010 e Q-PAG-03 |
| PAY-DEC-008 | Crédito parcelado em até 6x, conforme o que o Mercado Pago permitir na conta. Débito não parcela. | Decidido | Valor mínimo da parcela |
| PAY-DEC-009 | Validade **desejada** da cobrança Pix: 15 minutos. | Decidido | Confirmar que o Mercado Pago permite esse prazo; relação com a reserva (PR-001) |
| PAY-DEC-010 | Retentativas automáticas de conciliação com limite finito e alerta ao administrador. | Decidido | Quantidade, intervalo, prazo máximo |
| PAY-DEC-011 | Pagamento tardio **sem** estoque disponível: reembolso, mas só após validação administrativa. | Decidido | Prazos, evidências, comunicação ao cliente |
| PAY-DEC-012 | Juros do parcelamento pagos pelo cliente, mostrados claramente antes de confirmar. | Decidido | — |

## 4. Interface

| ID | Decisão | Estado | Falta definir |
|---|---|---|---|
| UI-DEC-001 | Frontend **demonstrativo**: paleta marfim, champagne e rosé dourado, inspirada na referência visual. Logo inalterada. | Decidido (só para a demo) | Paleta do site real (D-014) |
| UI-DEC-002 | A referência visual inspira composição e experiência mobile; não copiar marca, textos, imagens ou preços dela. | Decidido | — |

---

## 5. Em aberto

### 5.1 Bloqueiam o lançamento (resolver antes da Fase 3)

| ID | Pergunta | Quem responde |
|---|---|---|
| D-010 | Frete: CEP de origem, regiões atendidas, transportadoras/serviço de cálculo, frete grátis, retirada local, prazo de postagem. | Cliente |
| D-015 | Fiscal e legal: CNPJ, emissão de nota fiscal, termos de compra, política de privacidade (LGPD). | Cliente |
| Q-NEG-02 | Trocas, devoluções e garantia das semijoias. **Obs.:** o direito de arrependimento em 7 dias para compras online (CDC, art. 49) é obrigação legal, não opção. | Cliente |
| D-013 | Quem opera o painel e com quais permissões (só a dona? ajudante só com pedidos e estoque?). Quem pode cancelar pedido. | Cliente |
| D-014 | Identidade do site real: paleta definitiva (a da demo ou preto/creme/dourado da embalagem?), fontes licenciadas, logo em SVG, favicon. | Cliente |
| Q-NEG-03 | Domínio. | Cliente |

### 5.2 Pagamentos

| ID | Pergunta |
|---|---|
| Q-PAG-01 | *(antigo PAY-P04)* Como casar validade do Pix com a reserva. Ver PR-001. |
| Q-PAG-02 | *(antigo PAY-P05)* Fluxo da análise de pagamento tardio: prazo, decisão, comunicação ao cliente. |
| Q-PAG-03 | *(antigo PAY-P06; conflito CAT-DEC-015 × PAY-DEC-007)* O que fazer com o estoque reservado enquanto o pagamento está indefinido. Ver PR-002. |
| Q-PAG-04 | *(antigo PAY-P07)* Quando e como cancelar, estornar e reembolsar. |
| Q-PAG-05 | *(antigo PAY-P11/P03)* Modalidade do Mercado Pago (Checkout Pro, Bricks ou API), meios habilitados na conta, taxas, valor mínimo de parcela. |
| Q-PAG-06 | *(antigo PAY-P10)* Antifraude. |

### 5.3 Catálogo

| ID | Pergunta |
|---|---|
| Q-CAT-01 | Atributos e unidade de venda aplicáveis a cada tipo (tabela no Módulo 01, §4). |
| Q-CAT-02 | Hierarquia de categorias (só os seis tipos? subcategorias? coleções sazonais?). |
| Q-CAT-03 | Baixa/reposição de cada modelo de kit; efeito de alterar componentes de um kit já vendido. Até a resposta, o painel só deixa mudar a composição de kit **em rascunho** (escolha do responsável em 03/11/2026; não responde a questão). |

### 5.4 Experiência do cliente

| ID | Pergunta |
|---|---|
| Q-UX-01 | Favoritos no lançamento? (a demo mostra; não foi aprovado para o site real) |
| Q-UX-02 | Conta de cliente opcional (para acompanhar pedidos)? |
| Q-UX-03 | Cupons, vale-presente, avaliações, recuperação de carrinho abandonado, integração com WhatsApp. |
| Q-UX-04 | Metas numéricas: conversão, ticket médio, volume de pedidos, prazo de expedição. |

---

## 6. Propostas aguardando aprovação

Recomendações para destravar o que está em aberto. **Nenhuma vale até ser aprovada.**

| ID | Proposta | Motivo |
|---|---|---|
| PR-001 | Reserva de estoque **mais longa que a cobrança Pix** (ex.: Pix 15 min, reserva 30 min). **Altera CAT-DEC-014.** | Com os dois em 15 min, quem paga no último minuto cai sempre em "pagamento tardio" (PAY-DEC-006), e a exceção vira rotina. |
| PR-002 | Pagamento indefinido: manter a reserva por até **N horas** (ex.: 24 h) com as retentativas da PAY-DEC-010; ao fim, liberar o estoque e marcar o pedido para revisão manual. | Resolve Q-PAG-03 sem bloquear estoque indefinidamente nem liberar às cegas. |
| PR-003 | ~~Stack~~ Aprovada como D-018. *(Antigo D-007.)* | Encaixa com Vercel e Supabase (D-006). Desenvolvimento próprio já decidido (D-016). |
| PR-004 | Rotas em português, únicas para demo e site real: `/`, `/loja`, `/loja/[categoria]`, `/produto/[slug]`, `/favoritos`, `/sacola`, `/checkout`, `/pedido/[codigo]`, `/sobre`, `/contato`, `/trocas-e-devolucoes`, `/privacidade`, `/termos`, `/admin`. | Hoje Mestre, brief e protótipo usam rotas diferentes. |
| PR-005 | SKU no formato `AR-<TIPO><NNN>-<ATRIBUTOS>` (ex.: `AR-BRC002-OURO-P`), imutável depois da primeira movimentação ou pedido. | Já usado no protótipo; dá rastreabilidade. |
| PR-006 | Estados do pedido: `aguardando_pagamento`, `em_conciliacao`, `pago`, `em_separacao`, `enviado`, `entregue`, `cancelado`, `reembolsado`. Estados do pagamento seguem os do Mercado Pago. | Inclui o estado "em conciliação" exigido pela PAY-DEC-007, que faltava na lista anterior. |
