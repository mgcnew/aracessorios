# Brief — Frontend demonstrativo

**Atualizado em:** 03/11/2026 (substitui os briefs demo v0.1 e definitivo v1.0)
**Autorizado:** apenas protótipo visual com dados fictícios, para apresentar à cliente.
**Não autorizado:** backend, Supabase, SQL, Mercado Pago real, webhooks, processamento de pedidos, deploy de produção.

## 1. Objetivo

Protótipo navegável, mobile-first e convincente para a cliente avaliar: identidade, cores, legibilidade da logo, home, cards, categorias, clareza de preços, navegação no celular, produto e sacola. O feedback dela altera este brief, não as regras funcionais.

## 2. Visual (UI-DEC-001/002)

| Token | Valor | Uso |
|---|---|---|
| Fundo | `#FDF6F0` | Página |
| Superfície | `#FFF9F4` | Cards, painéis |
| Champagne | `#EAD9C6` | Destaques, rodapé |
| Rosé dourado | `#C89F7A` | Detalhes, nunca texto pequeno |
| Texto | `#38291F` | Corpo, botões |
| Texto secundário | `#6B4E3D` | Rótulos, notas |
| Acento de texto | `#8A5A38` | Links, sobretítulos (contraste AA) |
| Borda | `#E8DAD0` | Divisórias |
| Preto da logo | `#141414` | Só a área por trás da logo |

Tipografia: Cormorant Garamond (títulos) + Jost (texto, preços, formulários). Ambas são Google Fonts de uso livre. Há modo noturno com tokens próprios.

Referência visual (`../assets/referencia_visual.png`): inspira hierarquia, cards, hero e barra inferior mobile. Não copiar marca, textos, fotos nem preços dela (UI-DEC-002).

## 3. Telas

| Tela | O que tem | Interação de demonstração |
|---|---|---|
| Início | Hero, 6 categorias, lançamentos, mais vendidos, kits, bloco institucional | Navegação, favoritos |
| Loja | Grade, filtro por categoria, "só disponíveis", busca, ordenação | Filtro local, estado vazio, limpar filtros |
| Produto | Galeria, preço normal/promocional, variações, quantidade, detalhes, bloco do kit | Variação esgotada bloqueada, adicionar à sacola |
| Favoritos | Peças marcadas | Marcar/desmarcar, estado vazio |
| Sacola | Itens, quantidade, remover, subtotal **ilustrativo** | Alterações locais |
| Checkout | Prévia não operacional: endereço fictício, Pix/crédito/débito, resumo | Nenhum envio; botão final desabilitado |
| Sobre | Texto institucional ilustrativo | — |
| Painel (extra) | Visão geral, produtos, pedidos, proposta de permissões | Edição local; nada salvo |

**Checkout:** selo fixo "Demonstração — nenhuma compra ou pagamento será realizado"; sem campos de cartão, CPF ou telefone reais; botão final desabilitado com "Compras indisponíveis nesta demonstração"; sem tela de pedido concluído; sem QR code Pix; sem frete real.

## 4. Dados fictícios

- 12 a 18 produtos entre os seis tipos; ao menos 1 kit com estoque próprio e 1 kit composto.
- Cada variação com SKU único; preços podem variar entre variações; unidade comercial por produto.
- Alguns itens esgotados, com compra bloqueada. Promoção só com período fictício explícito; sem contador de urgência.
- Aviso de demonstração na sacola e no checkout, onde há tentativa de compra; as páginas de navegação não têm aviso de protótipo (UI-DEC-003).
- Sacola e favoritos podem ficar no `localStorage` (só IDs, variações e quantidades), com opção de limpar.
- Reserva de 15 min e baixa após pagamento são regras do backend futuro: **não simular**.

## 5. Estado atual do protótipo (repositório `ar-acessorios`)

| Item | Brief | Protótipo | Ação |
|---|---|---|---|
| Stack | Next.js + Tailwind sugerido | Next.js + React + TypeScript + CSS próprio | Migrado em 03/11/2026 (D-018) |
| Rotas | `/catalogo`, `/checkout-demo` | `/loja`, `/loja/[categoria]`, `/produto/[slug]`, `/checkout` | Alinhado com PR-004; filtros no endereço (`?q=`, `?ordem=`, `?disponiveis=1`) |
| Produtos | 12–18 | 19 (incl. 3 kits), lidos do banco de desenvolvimento | Ok |
| Fotos | Próprias ou placeholders | Ilustrações vetoriais por tipo | Trocar por fotos reais quando houver |
| Logo | Original | Logo oficial sem o fundo preto, como nas embalagens: dourado fundo no claro, dourado original no escuro (`src/assets/logo-ar-*.png`, geradas de `docs/assets/logo_ar_original.jpg`) | Trocar pelo SVG quando houver (D-014) |
| Painel admin | Fora do brief | Incluído | Serve para validar D-013 com a cliente |
| Favoritos | Incluído | Incluído | Aprovação para o site real: Q-UX-01 |

## 6. Qualidade

- Testar em 360, 375, 768, 1024 e 1440 px, sem rolagem horizontal.
- Toques ≥ 44 px, foco visível, teclado, textos alternativos, `prefers-reduced-motion`.
- Typecheck e build sem erros; capturas de tela mobile e desktop para a cliente.
