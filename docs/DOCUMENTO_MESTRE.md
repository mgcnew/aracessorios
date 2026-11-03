# AR Acessórios — Documento Mestre

**Atualizado em:** 03/11/2026 (consolidação do pacote v2.1 de 28/10/2026)
**Papel:** visão geral, escopo, arquitetura e regras de trabalho. **Decisões ficam em [`DECISOES.md`](DECISOES.md)**; este documento só cita os IDs.

## 1. O que é

Loja virtual **própria** da AR Acessórios: semijoias e acessórios, venda ao consumidor final, estoque próprio, sem vendedores terceiros (D-001, D-002, D-003).

**Objetivo do produto:** uma boutique digital com cara premium, fácil de navegar no celular, catálogo visual, checkout confiável e um painel simples para a dona gerir produtos, estoque e pedidos.

## 2. Escopo

### 2.1 Lançamento (MVP)
- Vitrine: início, categorias, busca, página de produto com variações (D-011) e kits (CAT-DEC-003/004).
- Sacola e checkout como visitante (PAY-DEC-004), com endereço, frete (D-010, em aberto) e pagamento por Pix ou cartão (PAY-DEC-001/005); provedor em aberto, provavelmente Mercado Pago (PAY-DEC-003).
- Confirmação do pedido somente após pagamento validado no servidor (CAT-DEC-010).
- Painel: produtos, variações, imagens, categorias, estoque com histórico, pedidos e atualização de separação/envio.
- Páginas legais: termos, privacidade, trocas e devoluções; canal de atendimento.
- E-mails transacionais do pedido.

### 2.2 Fora do lançamento
Marketplace com vendedores terceiros, atacado, programa de pontos, aplicativo nativo, ERP próprio, boleto, pré-venda/encomenda (CAT-DEC-006), IA voltada ao consumidor. Cupons e vale-presente só se aprovados (Q-UX-03).

## 3. Experiência do cliente

**Jornada:** descobrir na home → navegar por categoria ou busca → escolher variação → sacola → dados, endereço e frete → pagar no Mercado Pago → receber confirmação após o pagamento ser validado → acompanhar o pedido.

**Regras de usabilidade:**
- Mobile-first; toques de no mínimo 44 px; navegação inferior fixa no celular.
- Acessível por teclado, foco visível, textos alternativos; meta WCAG 2.2 AA.
- Estados de carregamento, erro, vazio e sucesso nos fluxos críticos.
- Preço, juros de parcelamento (PAY-DEC-012) e frete mostrados antes de confirmar.
- Nunca mostrar estoque, prazo ou preço que o servidor não confirmou.

**Rotas:** proposta única em PR-004.

## 4. Identidade visual

- Logo (D-004): fundo preto, monograma e letras douradas, pérolas e ramos. Sobre fundo claro, aplicar dentro de uma área preta; não recortar o fundo de forma improvisada.
- Embalagens: versões preta e creme, com dourado.
- **Demo:** marfim, champagne e rosé dourado (UI-DEC-001), com tokens em `frontend/BRIEF_FRONTEND.md`.
- **Site real:** paleta definitiva em aberto (D-014). Ponto de partida natural: as cores da embalagem (preto, creme, dourado) combinadas com os tons da demo.
- Fotos reais de produto são o principal recurso de venda; ilustrações da demo são provisórias.
- Evitar texto dourado ou rosé pequeno sobre fundo claro (contraste).

## 5. Arquitetura

**Stack:** desenvolvimento próprio (D-016) com Next.js + React + TypeScript + Supabase na Vercel (D-018).

**Princípios** (valem para qualquer stack):
1. Uma única loja: sem `tenant_id`, sem multi-loja.
2. Domínios separados: catálogo, estoque, sacola, pedidos, pagamentos, clientes e administração.
3. Tipagem estrita e contratos claros entre interface e servidor.
4. Nenhuma regra de preço, estoque ou pagamento depende do navegador.
5. Segredos só no servidor; nunca expor a chave `service_role` ou credenciais do Mercado Pago ao cliente.
6. Migrações SQL versionadas e revisadas antes de aplicar.
7. Ambientes separados: local, preview e produção.
8. Nada de abstração sem caso de uso real.

### 5.1 Dados (esboço, não aprovado)

| Entidade | Para quê |
|---|---|
| `categories`, `product_categories` | Categorias e relação muitos-para-muitos (CAT-DEC-016) |
| `products` | Página comercial: nome, descrição, status (`rascunho`, `ativo`, `arquivado`) |
| `product_variants` | Unidade vendável: SKU (CAT-DEC-017), atributos, preço, preço promocional e validade (CAT-DEC-005/020), unidade comercial (CAT-DEC-002/018) |
| `kit_components` | Peças e quantidades de kits compostos (CAT-DEC-019) |
| `product_images` | Fotos no Supabase Storage, ordem, texto alternativo, capa |
| `inventory_balances` | Saldo e reservado por SKU |
| `inventory_movements` | Toda entrada, saída, reserva, liberação e ajuste, com motivo e operador (CAT-DEC-012) |
| `stock_reservations` | Reservas com expiração (CAT-DEC-013/014/015) |
| `orders`, `order_items`, `order_addresses` | Pedido com valores congelados (nome, SKU e preço no momento da compra) |
| `payments`, `payment_events` | Tentativas, IDs do Mercado Pago, eventos recebidos com deduplicação |
| `shipments` | Envio e rastreio |
| `admin_members` | Quem acessa o painel e com que papel (D-013) |

**Convenções:** UUID; `created_at`/`updated_at`; dinheiro em **centavos inteiros** (BRL); `UNIQUE`, `CHECK` e chaves estrangeiras protegendo a consistência; produto com histórico é arquivado, nunca apagado; pedido nunca é apagado.

## 6. Segurança

- RLS ligado em toda tabela exposta pela API do Supabase.
- Leitura pública só do que é vitrine (produtos ativos, imagens, categorias).
- Escrita de estoque, pedidos e pagamentos só por operações no servidor, validadas e transacionais.
- Painel com autorização verificada no servidor e no banco; ninguém altera o próprio papel.
- Visitante acompanha pedido por link com token impossível de adivinhar.
- Webhooks do Mercado Pago com assinatura validada; nunca considerar "pago" só porque o navegador voltou da página de pagamento.
- Nunca guardar dados de cartão.
- Rate limiting, logs sem segredos, validação de upload, LGPD (D-015).

## 7. Qualidade e entrega

- Em todo PR: lint, typecheck, testes; preview automático na Vercel.
- Testes unitários: preço, promoção, disponibilidade de kit, transições de estado.
- Testes de integração: RLS por perfil, estoque concorrente (duas compras da última unidade), webhooks repetidos e fora de ordem.
- E2E: catálogo → sacola → checkout → confirmação.
- **Critérios para lançar:** pagamento de teste ponta a ponta; estoque consistente sob concorrência; RLS testado; páginas legais e atendimento no ar; logs e alertas básicos; nenhuma vulnerabilidade crítica conhecida.

## 8. Fases

| Fase | Entrega | Pré-requisito |
|---|---|---|
| 0 — Base | Documentação consolidada ✅; protótipo apresentado à cliente; respostas de D-010, D-013, D-014, D-015, Q-NEG-02 | — |
| 1 — Fundação | Projeto Next.js, Supabase (local + produção), login do painel, schema do catálogo com RLS, CI | D-018 ✅ |
| 2 — Catálogo e painel | Produtos, variações, kits, imagens, estoque com histórico, vitrine com dados reais | Q-CAT-01, fotos reais |
| 3 — Checkout | Sacola, frete, reserva de estoque, Mercado Pago, webhooks, pedidos | D-010, Q-PAG-01/03/05, PR-001/002 |
| 4 — Lançamento | E-mails, acompanhamento do pedido, páginas legais, SEO, acessibilidade, testes E2E | D-015, Q-NEG-02, Q-NEG-03 |
| 5 — Pós-lançamento | Ajustes com base em vendas reais | — |

Cada fase só termina com critérios de aceite cumpridos e testes passando.

## 9. Como trabalhar com IA (Claude e Codex)

Regras completas em [`../AGENTS.md`](../AGENTS.md). Em resumo:
1. Ler `DECISOES.md` antes de qualquer tarefa; tratar **Proposto** e **Em aberto** como não decididos.
2. Encontrou contradição? Parar e perguntar; não escolher um lado.
3. Decisão nova ou alterada: editar a linha em `DECISOES.md` e os documentos afetados **no mesmo commit**. Não criar arquivo "v2", não anexar "Atualização" no fim do documento.
4. Mudanças em schema, RLS, estoque ou pagamento: apresentar plano, arquivos afetados e testes antes de codificar.
5. Nada de migração destrutiva ou deploy de produção sem autorização explícita.
