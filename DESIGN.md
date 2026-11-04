---
name: AR Acessórios
description: Loja própria de semijoias delicadas para o dia a dia e para presentear.
colors:
  marfim: "#FDF6F0"
  linho: "#FFF9F4"
  champagne: "#EAD9C6"
  campo-areia: "#F4EBE2"
  borda-areia: "#E8DAD0"
  rose-dourado: "#C89F7A"
  caramelo: "#8A5A38"
  cacau: "#38291F"
  cacau-claro: "#6B4E3D"
  cacau-hover: "#4D3A2C"
  carvao: "#100E0D"
  carvao-cartao: "#1F1B19"
  carvao-destaque: "#2D2825"
  carvao-campo: "#2A2522"
  carvao-borda: "#4A423C"
  pergaminho: "#F4ECE3"
  pergaminho-suave: "#C9BDB1"
  ouro-champagne: "#D9B384"
  sobre-ouro: "#1A1511"
  disponivel: "#5E7A4E"
  esgotado: "#9B4A3B"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(46px, 7.4vw, 92px)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(30px, 4.4vw, 46px)"
    fontWeight: 500
    lineHeight: 1.05
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.14em"
rounded:
  campo: "12px"
  miniatura: "14px"
  cartao-produto: "18px"
  cartao: "22px"
  painel: "26px"
  pilula: "999px"
spacing:
  gutter-celular: "20px"
  gutter-computador: "40px"
  container: "1240px"
  secao-celular: "44px"
  secao-computador: "76px"
components:
  button-primary:
    backgroundColor: "{colors.cacau}"
    textColor: "{colors.marfim}"
    rounded: "{rounded.pilula}"
    padding: "0 30px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cacau-hover}"
  button-primary-dark:
    backgroundColor: "{colors.ouro-champagne}"
    textColor: "{colors.sobre-ouro}"
  button-secondary:
    textColor: "{colors.cacau}"
    rounded: "{rounded.pilula}"
    padding: "0 30px"
    height: "48px"
  pill:
    backgroundColor: "{colors.linho}"
    textColor: "{colors.cacau}"
    rounded: "{rounded.pilula}"
    padding: "0 18px"
    height: "44px"
  pill-selected:
    backgroundColor: "{colors.cacau}"
    textColor: "{colors.marfim}"
  input-search:
    backgroundColor: "{colors.linho}"
    textColor: "{colors.cacau}"
    rounded: "{rounded.pilula}"
    padding: "0 18px"
    height: "48px"
  card:
    backgroundColor: "{colors.linho}"
    rounded: "{rounded.cartao}"
    padding: "22px"
  tooltip:
    backgroundColor: "{colors.cacau}"
    textColor: "{colors.marfim}"
    rounded: "8px"
    padding: "7px 11px"
---

# Design System: AR Acessórios

> A paleta é a da demonstração (UI-DEC-001). A identidade definitiva (paleta, fontes licenciadas, logo em SVG) ainda depende da cliente (D-014). Se mudar, atualize este arquivo e `.impeccable/design.json` no mesmo commit.

## Overview

**Creative North Star: "O porta-joias de linho"**

A loja é um porta-joias aberto sobre a mesa: fundo claro e quente como linho cru, luz natural, peças pousadas com cuidado. A cliente deve se sentir **acolhida e confiante**. É um luxo acessível, que não intimida: delicado sem ser frágil, próximo sem ser casual. Quem fala é a peça; a interface fica em volta dela como um forro macio.

A densidade é baixa e o ritmo é calmo. Há muito respiro entre as seções, títulos em serifa clássica que dão o tom de joalheria, e texto de apoio em uma sans geométrica leve, fácil de ler no celular. A cor é quase toda neutra (marfim, areia, cacau), com o dourado reservado para o que importa. No modo noturno o porta-joias fecha: carvão quente no lugar do linho, e o dourado champagne passa a fazer o papel do cacau.

O site é pensado primeiro para o celular, com navegação de baixo, botões grandes e a foto da peça sempre perto do topo. A marca recusa urgência artificial (contadores, "últimas unidades"), selos genéricos e cara de loja de plataforma pronta.

**Key Characteristics:**
- Fundo marfim quente, nunca branco puro; carvão quente no escuro, nunca preto puro.
- Serifa (Cormorant Garamond) para nomes e títulos; sans (Jost) para todo o resto.
- Formas macias: pílulas nos controles, cantos generosos nos cartões, círculos nas categorias.
- Sombras raras e difusas; a profundidade vem de camadas de tom.
- O tema (claro/noturno) vale para tudo, inclusive o que o navegador desenha.

## Colors

Neutros quentes de linho e cacau, com um único acento dourado.

### Primary
- **Cacau** (#38291F): texto principal, botão primário, pílula selecionada, foco. É a "tinta" da marca no claro.
- **Ouro champagne** (#D9B384): o cacau do modo noturno. Botão primário, seleção e contadores no escuro, sempre com texto **Sobre-ouro** (#1A1511), contraste de 9,3:1.

### Secondary
- **Caramelo** (#8A5A38): links, o itálico do título do topo, ícones de destaque. É a versão do dourado que passa contraste AA sobre o marfim.
- **Rosé dourado** (#C89F7A): detalhes finos (traço da navegação ativa, bordas tracejadas). Nunca em texto pequeno.

### Neutral
- **Marfim** (#FDF6F0): fundo da página.
- **Linho** (#FFF9F4): superfícies (cartões, campos de busca, pílulas).
- **Champagne** (#EAD9C6): blocos institucionais, rodapé, hover de botões secundários.
- **Areia** (#F4EBE2) para fundo de campo e **Borda areia** (#E8DAD0) para divisórias e contornos.
- **Cacau claro** (#6B4E3D): texto secundário, rótulos, notas.
- **Carvão** (#100E0D), **Carvão cartão** (#1F1B19), **Carvão destaque** (#2D2825), **Carvão campo** (#2A2522) e **Carvão borda** (#4A423C): os degraus do modo noturno. **Pergaminho** (#F4ECE3) e **Pergaminho suave** (#C9BDB1) são o texto sobre eles.
- **Disponível** (#5E7A4E) e **Esgotado** (#9B4A3B): só no pontinho de situação da peça, sempre com texto ao lado.

### Named Rules
**The Um Só Dourado Rule.** Só existe um acento quente por tela: o caramelo no claro e o ouro champagne no escuro. O resto é neutro. A raridade do dourado é o que o faz parecer joia.

**The Tema Inteiro Rule.** O modo vive em `<html class="dark">` com `color-scheme`. Menus, calendário, caixas de marcar, rolagem, dicas e confirmações seguem o tema; nada pode aparecer com a cara padrão do navegador.

## Typography

**Display Font:** Cormorant Garamond (com Georgia, serif)
**Body Font:** Jost (com system-ui, sans-serif)

**Character:** uma serifa de joalheria clássica, com itálico elegante, ao lado de uma sans geométrica leve. A serifa nomeia; a sans explica e vende.

### Hierarchy
- **Display** (500, clamp(46px, 7.4vw, 92px), 0.98): título do topo da página inicial; uma palavra em itálico caramelo.
- **Headline** (500, clamp(30px, 4.4vw, 46px), 1.05): títulos de seção e de página (até 66px em páginas).
- **Title** (600, 21–28px, 1.1–1.15): nome da peça nos cartões, títulos de cartão e de janela.
- **Body** (400, 16–18px, 1.5): descrições e textos; até 58ch em textos corridos.
- **Label** (500, 11–13px, 0.12–0.16em, maiúsculas): categoria no cartão de produto, nome do atributo da variação, cabeçalhos de tabela e do rodapé.

### Named Rules
**The Título Sem Sobretítulo Rule.** Nenhum texto pequeno em maiúsculas acima de título. O título fala sozinho. Rótulo em maiúsculas só para dado (categoria, atributo, coluna).

## Layout

Contêiner de até 1240px, com margem lateral de 20px no celular e 40px no computador. O ponto de virada principal é 900px: abaixo dele aparecem a navegação de baixo, a barra fixa de "Adicionar à sacola" e as folhas que sobem de baixo. Seções têm 44px de respiro no celular e 76px no computador. Grades de produto: 2 colunas no celular e 4 no computador; categorias em 3 e 6. Na página de produto, a galeria ocupa a largura toda no celular e desliza com o dedo. Toque mínimo de 44px em tudo.

## Elevation & Depth

Quase plano. A profundidade vem das camadas de tom (marfim, linho, champagne; carvão em degraus no escuro) e de bordas finas de 1px. Sombras só aparecem onde algo flutua.

### Shadow Vocabulary
- **Foto do topo** (`box-shadow: 0 30px 60px -30px rgba(56,41,31,.35)`): a foto principal do destaque.
- **Foto flutuante** (`box-shadow: 0 18px 36px -16px rgba(56,41,31,.4)`): as fotos menores sobrepostas no destaque.
- **Elevação ao passar o mouse** (`box-shadow: 0 18px 30px -18px rgba(56,41,31,.45)`): círculos de categoria.
- **Aviso e dica** (`box-shadow: 0 18px 40px -12px rgba(56,41,31,.5)` / `0 8px 20px -8px rgba(30,20,14,.45)`): aviso de "Adicionado à sacola" e dicas.

### Named Rules
**The Plano em Repouso Rule.** Cartões e campos não têm sombra. Sombra só para foto em destaque, elemento flutuante ou resposta ao mouse.

## Shapes

Formas macias e discretas. Pílula (999px) para tudo que se toca em linha: botões, filtros, busca, contadores. Cantos grandes nos blocos: 26px em painéis e galeria, 22px em cartões, 18px no cartão de produto, 14px em miniaturas, 12px em campos de formulário. Círculos para categorias. A foto principal do destaque usa um arco (999px 999px 28px 28px), a assinatura do topo. Bordas sempre de 1px em tom de areia; o selecionado troca a borda para cacau.

## Components

### Buttons
- **Shape:** pílula (999px), 48px de altura, 0 30px de respiro, rótulo 15px/500 com 0.05em.
- **Primary:** cacau com texto marfim; no escuro, ouro champagne com texto sobre-ouro.
- **Hover / Focus:** escurece para #4D3A2C; foco com contorno de 2px na cor do texto, a 2px de distância.
- **Secondary:** contorno de 1px cacau, fundo transparente; hover em champagne.

### Chips / Pílulas
- **Style:** linho com borda areia, 44px de altura.
- **State:** selecionada em cacau (ouro no escuro); combinação esgotada riscada e sem fundo.

### Cards / Containers
- **Corner Style:** 22px (cartões), 26px (painéis, kits, galeria), 18px (foto do produto).
- **Background:** linho; champagne nos blocos institucionais.
- **Shadow Strategy:** nenhuma (ver Elevation).
- **Border:** 1px areia.
- **Internal Padding:** 22–26px.

### Inputs / Fields
- **Style:** busca e filtros em pílula de 48px sobre linho; formulários com 12px de canto sobre areia.
- **Focus:** a borda vira cacau.
- **Foco em campos em pílula:** o anel de foco fica no campo inteiro (borda cacau + 1px extra), nunca no `<input>` de dentro; o input interno não tem contorno próprio (`base.css`).
- **Menus de seleção:** nunca `<select>` nativo (a lista aberta do navegador não aceita o tema). Use `Selecao` (`src/components/Selecao.tsx`): botão com o estilo do campo e seta que gira; lista em linho com cantos de 14px, borda areia, sombra difusa, opção ativa em champagne, ✓ caramelo na escolhida, opções de 40px (46px no toque). Abre para cima quando falta espaço; teclado completo (setas, Home/End, letras, Enter, Esc).
- **Controles nativos:** caixas de marcar (cantos de 6px) e rádios desenhados, em cacau ou ouro quando marcados (`src/styles/base.css`).

### Navigation
- **Computador:** cabeçalho fixo de 76px sobre marfim translúcido, links em pílula (o ativo em champagne), busca em pílula e ícones de 44px com dica.
- **Celular:** cabeçalho de 64px e navegação de baixo com 4 itens (ícone e rótulo de 12px); o ativo ganha um traço rosé acima.

### Logo
A arte oficial (D-004), sem redesenho e sem o fundo preto, como nas embalagens: dourado mais fundo sobre o claro (`src/assets/logo-ar-claro.png`) e o dourado original sobre o escuro (`logo-ar-escuro.png`), trocados pelo tema. Tamanhos: 52px no celular, 62px no cabeçalho do computador e 64–84px no rodapé. Nunca dentro de círculo preto nem com sombra.

### Fotografia de produto
Fundo padrão inspirado no cetim preto acetinado das referências reais recebidas em 04/11/2026 (UI-DEC-004): brilho suave, dobras naturais e luz que revela o acabamento da peça. A direção de fundo substitui a sugestão de linho para fotos de catálogo; as cores da interface continuam iguais. Não alterar banho, pedras, proporções ou fechos. Comparar toda edição com a foto original antes de publicar. Referências numeradas em `referencias/galeria.html`.

### Biblioteca de fotos do painel
Galeria com miniaturas, nomes e busca, seguindo os cartões, campos e temas existentes. Separar a ação de retirar a foto do produto da exclusão definitiva na biblioteca. Mostrar os produtos que usam a foto e impedir sua exclusão enquanto houver vínculo (CAT-DEC-025). No computador, a Biblioteca é uma aba lateral; no celular fica em Mais. O editor abre a seleção em janela, em tela cheia no celular. Exclusão interrompida oferece Retomar exclusão.

### Cartão de produto (assinatura)
Foto 4:5 com cantos de 18px e zoom leve ao passar o mouse; coração de favoritar no canto; selo "Novo"/"Promoção" em pílula; categoria em rótulo, nome em serifa 21px e preço em sans 15px/500, com o preço antigo riscado ao lado. Esgotado ganha um véu e um selo, nunca a quantidade.

### Kits para presentear (assinatura da página inicial)
Foto editorial grande (4:5, cantos de 26px, sombra "foto do topo") ao lado de uma lista de kits: miniatura de 84–104px com cantos de 16px, nome em serifa 24–27px, descrição curta em duas linhas, preço e uma seta que anda 4px ao passar o mouse. Divisórias de 1px areia entre os itens. No celular a foto vai de ponta a ponta (4:3) e a lista vem embaixo.

### Vitrine que desliza (celular)
Na página inicial, Lançamentos e Mais vendidos viram uma faixa horizontal abaixo de 900px: cartões de min(64vw, 250px), encaixe por cartão e o próximo cartão aparecendo pela borda como convite para deslizar. No computador continuam em grade de 4.

## Do's and Don'ts

### Do:
- **Do** usar marfim (#FDF6F0) como fundo e cacau (#38291F) como texto; no escuro, carvão (#100E0D) e pergaminho (#F4ECE3).
- **Do** guardar o dourado (caramelo #8A5A38 no claro, ouro #D9B384 no escuro) para link, seleção e ação principal.
- **Do** manter toque mínimo de 44px e campos com 16px de fonte no celular.
- **Do** aplicar o tema a tudo que o navegador desenha, com `color-scheme` e os estilos de `base.css`.
- **Do** mostrar só "disponível" ou "esgotado" para a cliente, nunca a quantidade (CAT-DEC-024).

### Don't:
- **Don't** colocar sobretítulo em maiúsculas acima de título nem numerar seções (01/02/03).
- **Don't** usar símbolos de texto (←, →, ↗, −, +) como ícone; use os ícones desenhados de `src/components/Icons.tsx`.
- **Don't** usar `window.confirm`/`alert` no painel; use `confirmar()` de `src/admin/confirmar.tsx`.
- **Don't** usar `<select>` nativo; use `Selecao`.
- **Don't** usar urgência artificial (contador, "últimas unidades") nem promessas que a cliente não confirmou; use `[A DEFINIR]` fora da vitrine.
- **Don't** deixar animação de entrada "presa" com `fill-mode: forwards`/`both`: ela quebra os elementos fixos no celular.
- **Don't** usar branco puro, preto puro ou cinza neutro.
