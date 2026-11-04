# Continuar aqui

**Última atualização:** 04/11/2026. Atualize este arquivo no fim de cada sessão: risque o que terminou e escreva onde parou.

## Fotos reais e biblioteca (04/11/2026)

- [x] Quatro ZIPs e a foto avulsa organizados: 58 arquivos distintos, com SHA-256 e rastreio de origem em `referencias/inventario.json`. Algumas peças se repetem entre os arquivos.
- [x] Miniaturas numeradas em `referencias/galeria.html`; originais preservados em `referencias/originais/`, ignorada pelo Git. Não apagar os ZIPs de Downloads: originais ainda não estão na biblioteca.
- [x] Padrão aprovado: cetim preto acetinado das fotos reais (UI-DEC-004), preservando os detalhes da peça.
- [x] Biblioteca independente aprovada (CAT-DEC-025); plano, arquivos, riscos e testes em `docs/frontend/BIBLIOTECA_FOTOS.md`.
- [x] SQL da base preparado em `supabase/migrations/20261104090000_biblioteca_fotos_base.sql`; **aplicado manualmente pelo responsável**, que informou resultado 2 fotos nos produtos, 2 na biblioteca e 0 sem biblioteca.
- [x] Biblioteca implementada: aba no computador e em Mais no celular; busca/paginação (20), envio, nome/descrição, indicação de produtos em uso e seleção no editor. Retirar foto e apagar rascunho preservam a biblioteca.
- [x] TypeScript e build passaram. Migrações e suíte SQL executadas em Postgres embarcado (PGlite), com Auth/Storage simulados; **52 testes passando**, incluindo acesso, reutilização, limite de 12, preservação e exclusão retomável; acrescentados à suíte da CI.
- [ ] **Aplicar manualmente somente o SQL adicional** `supabase/migrations/20261104091000_biblioteca_fotos_operacoes.sql` (a base 090000 já foi aplicada). Nenhuma aplicação remota feita pelo agente.
- [x] Galeria testada no Chromium com ações/dados simulados: busca, paginação, edição, seleção e bloqueios; temas claro/escuro em 360, 390 e 1440 px sem overflow nem erros JS. Não substitui o teste com Supabase.
- [ ] Testar com login real: aba Biblioteca, envio, editar nome/descrição, selecionar a mesma foto em dois produtos, retirar de um, exclusão bloqueada em uso e exclusão após retirar todos os vínculos. Conferir temas e celular. Concorrência real entre duas sessões ainda precisa ser testada.
- Tipos da biblioteca em `src/lib/database-biblioteca.types.ts` como complemento explícito: `database.types.ts` gerado não foi editado. Regenerar tipos completos no Supabase após aplicar o SQL adicional e substituir o complemento.
- [x] Primeira edição preparada localmente em `referencias/primeira-edicao.json`: referência 021 (par dourado gota), fundo acetinado preto, retirada da cartela, formato 4:5. Modelo planejado `gpt_image_2`, 2K, uma imagem; parâmetros conferidos no catálogo ao vivo.
- Canvas criado e aberto: https://dreamina.capcut.com/ai-tool/ai-canvas/4c77fe33-c1bc-4b7e-8d1b-65f4a31a5882 . Conta Dreamina autenticada; nenhum crédito gasto.
- [x] Responsável autorizou especificamente o envio da foto 021 ao Dreamina. Referência enviada: `node_e49rpw042m` / recurso `27a1eccd-e2f9-4cb0-b049-c54b197c1ff2`.
- [x] Primeira foto gerada com teto aprovado de 105 créditos: `referencias/geradas/021-brincos-gota-cetim-preto.png`. Recurso `d2e78490-f8de-497d-821b-e870b2425524`; submit `d904617c-134e-41b7-88f2-6d003f7a00de` concluído. **Não reenviar essa geração**. Cartela retirada; ainda há reflexos do ambiente/telefone e selo AI discreto no canto. Aguardar avaliação do responsável; não publicada na loja.
- Responsável limitou o lote a **10 fotos no total**, 1K. Seleção local das outras 9 em `referencias/lote-10.json`: 002, 008, 026 (brincos); 005, 025 (anéis); 001 (colar); 043 (pulseiras); 013, 040 (conjuntos). Não foram identificadas tornozeleiras/piercings com segurança.
- **Revisão automática bloqueou o envio dessas nove referências** por exigir autorização específica para esse conjunto de arquivos ao canvas Dreamina. Nenhuma das nove foi enviada/gerada. Pedir autorização conjunta para envio e teto proposto de até 945 créditos (9 × 105), consultar cotação autoritativa depois de salvar os rascunhos e só gerar se coberto. Não criar variantes extras ou repetir geração sem autorização.
- [x] Primeira edição gerada e comparada; pendente avaliação do responsável antes de publicar. Outras nove aguardam autorização específica de envio e teto do lote.
- Combinado com o responsável: commit e push ao concluir cada etapa. Biblioteca integrada à `main` no merge `838cc6c`; branch atual: `main`. `.claude/` já estava não rastreada; não foi incluída.
- Validação desta sessão: Node 22 oficial instalado apenas em `/tmp` (checksum conferido). PGlite e seu ambiente de teste também somente em `/tmp`; dependências do projeto não foram alteradas. Docker/psql indisponíveis.
- Nenhuma geração paga, envio ao Supabase ou alteração de banco foi realizada nesta etapa.

## Onde paramos

| Parte | Situação |
|---|---|
| Documentação e decisões | Consolidadas em `docs/DECISOES.md` (fonte única) |
| Banco `ar-acessorios-dev` (Supabase, São Paulo, ref `pmhipriryqsblhonysay`) | Pronto: 4 migrações, carga de demonstração (19 produtos, 73 variações, 3 kits) e **35 testes passando** |
| Admin do painel | `acess.ar05@gmail.com` criado e liberado em `admin_members` |
| Vitrine (Next.js) | **Testada contra o banco em 03/11/2026**: todos os itens do Passo 2 passaram |
| Login do painel | **Testado com a conta real em 04/11/2026** (entrar, sessão ao recarregar). Faltam: conta fora de `admin_members`, botão Sair e conferir cadastro público desligado |
| Painel `/admin` — Estoque | **Testado com a conta real em 04/11/2026**. Falta só o teste de dois ajustes simultâneos |
| Painel `/admin` — Produtos | **Cadastro e fotos testados com a conta real em 04/11/2026**. Faltam: reordenar com 3+ fotos e envio pelo celular |
| Painel `/admin` — Pedidos | Ainda demonstração com dados fixos de `src/admin/seed.ts`; não salva nada |
| CI (GitHub Actions) | `.github/workflows/ci.yml`: build e tipos; banco local com migrações, carga e os testes (`scripts/testar-banco.sh`) |
| Fases | Fase 1 e Fase 2 autorizadas em 03/11/2026 (ver `AGENTS.md`) |
| Pagamento, frete, pedidos | Fase 3, não autorizada |

## Passo 1 — Preparar a sessão (5 min)

```bash
npm install
```

```bash
cp .env.example .env.local
```

Confira se a rede chega ao banco. Tem que responder `200`; `000` ou erro 403 significa que a rede do ambiente ainda bloqueia `pmhipriryqsblhonysay.supabase.co` (liberar em Network access → Allowed domains):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://pmhipriryqsblhonysay.supabase.co/rest/v1/categories?select=slug" -H "apikey: $(grep PUBLISHABLE .env.local | cut -d= -f2)"
```

## Passo 2 — Testar a vitrine contra o banco ✅ (03/11/2026)

Nas sessões na nuvem o Node não usa o proxy de rede sozinho: rode o servidor com `NODE_USE_ENV_PROXY=1` (sem isso, toda página dá erro 500 com "fetch failed"):

```bash
npm run build && NODE_USE_ENV_PROXY=1 npm run start
```

Conferido no navegador (computador e 390 px), sem erros no console:

- [x] Início mostra categorias, Lançamentos, Mais vendidos e os 3 kits
- [x] `/loja` lista 19 peças; `/loja/brincos` filtra; busca funciona
- [x] Brinco Argola Lunar mostra R$ 69,90 com R$ 89,90 riscado (promoção até 15/11/2026)
- [x] Argola Lunar Ródio G aparece esgotada e o botão fica "Indisponível"
- [x] Conjunto Noite Estrelada aparece **esgotado**; Conjunto Aurora, disponível
- [x] "O que vem no conjunto" mostra só a composição (1 par, 1 un.), nunca o estoque
- [x] Sacola e favoritos persistem ao recarregar
- [x] Sem rolagem lateral no celular

A página do produto mostra "Promoção válida até dd/mm/aaaa" com a data de fim cadastrada no banco.

## Passo 3 — Testar o login do painel

Já feito (sessão de 03/11/2026, sem acesso ao banco):

- `src/lib/supabase/server.ts`: cliente no servidor com cookies (`@supabase/ssr`).
- `src/proxy.ts`: renova a sessão em `/admin/*`; sem sessão vai para `/admin/entrar`; com sessão, `/admin/entrar` volta para `/admin`.
- `src/app/admin/acoes.ts`: ações de servidor `entrar` e `sair`.
- `/admin/entrar` (`src/admin/Entrar.tsx`): e-mail e senha, sem cadastro.
- `src/app/admin/page.tsx`: confere de novo com `getUser()` e `is_admin()`; quem não é admin vê `src/admin/SemAcesso.tsx`.
- Botão "Sair" e e-mail de quem entrou na barra lateral do painel.

Conferido: `/admin` sem sessão redireciona para o login; a tela funciona a 390 px e no computador; build e typecheck passam.

Falta conferir com a rede liberada:

- [x] Entrar com `acess.ar05@gmail.com` abre o painel; recarregar mantém a sessão (04/11/2026)
- [x] Senha errada mostra "E-mail ou senha incorretos." (testado contra o banco)
- [ ] Conta que não está em `admin_members` vê "Acesso não autorizado"
- [ ] "Sair" volta para o login e `/admin` deixa de abrir
- [ ] No Supabase (Authentication → Sign In / Providers), **cadastro público desligado** ("Allow new users to sign up")

## Passo 4 — Painel de estoque ✅ escrito (03/11/2026)

Feito, sem nenhuma mudança no banco:

| Tela | Onde | Fonte no banco |
|---|---|---|
| Aba **Estoque**: lista por variação (saldo, reservado, disponível, mínimo, situação), busca e filtro "só no mínimo ou esgotado" | `src/admin/Estoque.tsx` | `painel_estoque()` |
| Janela **Movimentar**: Entrada, Ajuste (aceita −), Contagem; motivo obrigatório; prévia do saldo; mensagem do banco quando ele recusa | `src/admin/Estoque.tsx` → `src/app/admin/estoque-acoes.ts` | `registrar_entrada/ajuste/contagem()` |
| Histórico das últimas 30 movimentações da variação | idem | `inventory_movements` (só leitura) |
| Visão geral: indicador e lista "Estoque baixo" reais | `src/admin/Admin.tsx` | `painel_estoque()` |

- Kit composto mostra só a disponibilidade calculada ("—" no saldo) e não tem botão de movimentar (CAT-DEC-019).
- A aba Produtos perdeu o "+/−" de estoque: o estoque só muda pela aba Estoque.
- Observação: para kit composto, `painel_estoque()` devolve saldo e reservado **nulos**, mas `database.types.ts` os declara como `number`. A tela trata o caso; ao gerar os tipos de novo, isso continua igual (limitação do gerador).

Conferido nesta sessão (página de teste temporária com dados copiados do banco, já apagada): lista, filtro, busca, prévia, validações, janela no celular (390 px) e no computador, sem rolagem lateral e sem erros no console. Tentativa de ajuste **sem login** foi recusada pelo banco ("Acesso restrito ao painel"), como deve.

Falta conferir entrando com `acess.ar05@gmail.com` (precisa da senha, então fica com o responsável):

- [x] Aba Estoque lista as 73 variações (as de kit composto com "—" no saldo)
- [x] Entrada de 3 em uma variação: saldo sobe 3, aparece no histórico com o motivo
- [x] Ajuste −1: saldo desce 1
- [x] Ajuste que deixaria o saldo negativo: aparece "Estoque insuficiente…" e nada muda
- [x] Contagem: saldo passa a ser o número contado
- [x] A vitrine reflete a mudança (ex.: entrada na Argola Lunar Ródio G faz ela deixar de aparecer esgotada)
- [ ] Teste de dois ajustes simultâneos no mesmo SKU (duas abas)

## Passo 5 — Cadastro de produtos ✅ escrito (03/11/2026), sem fotos

Feito, sem nenhuma mudança no banco (usa as regras de acesso que já existiam):

| O quê | Onde |
|---|---|
| Lista de produtos (todos os status), busca, filtro por status | `src/admin/Produtos.tsx` |
| Novo produto: nome, endereço (slug sugerido), tipo, unidade; nasce **rascunho** | idem |
| Edição: dados, Novo/Destaque, categorias (só as existentes), variações (atributos, SKU, preço, promoção com datas, mínimo, ativa), status (ativar, tirar da loja, arquivar, apagar rascunho) | `src/admin/ProdutoEditor.tsx` |
| Peças do kit composto, **só em rascunho** (Q-CAT-03) | idem |
| Ações de servidor e mensagens do banco em português | `src/app/admin/produtos-acoes.ts`, `src/admin/produtos.ts` |

- Cada bloco salva sozinho (não há "salvar tudo"). Para ativar, o produto precisa de ao menos uma variação ativa e, se for kit composto, peças em toda variação ativa.
- Variação nova nasce com saldo 0 (o banco cria a linha); a quantidade entra pela aba Estoque.
- Criar categoria nova ficou de fora (Q-CAT-02 em aberto).
- A aba Produtos de demonstração e `SEED_PRODUCTS` foram removidos.

Conferido nesta sessão, numa página de teste temporária já apagada (produtos ativos lidos com a chave pública e um rascunho fictício): lista, filtros, slug sugerido, validações (promoção maior que o preço, SKU inválido), pendências para ativar, peças travadas em kit ativo, computador e 390 px sem rolagem lateral, sem erros no console. Criar produto **sem login** foi recusado pelo banco.

Falta conferir entrando com `acess.ar05@gmail.com`:

- [x] Criar "Produto Teste" (rascunho): não aparece em `/loja`
- [x] Marcar uma categoria e salvar; editar descrição e salvar
- [x] Criar variação: aparece na aba Estoque com saldo 0
- [x] SKU repetido (ex.: `AR-BRC002-OURO-P`) mostra "Esse SKU já está em uso…"
- [x] Ativar: aparece na vitrine como esgotado; dar entrada no Estoque: fica disponível
- [x] Promoção com datas de hoje: vitrine mostra preço riscado e "Promoção válida até…"
- [x] Kit composto em rascunho: escolher peças, salvar, ativar; depois de ativo, peças travadas
- [x] Arquivar: some da vitrine
- [x] Apagar um rascunho sem movimentação de estoque (variação com entrada registrada não deixa apagar: arquive)
- [x] Ao final, arquivar ou apagar os produtos de teste

## Passo 6 — Fotos dos produtos ✅ escrito (03/11/2026)

Sem mudança no banco (tabela `product_images` e bucket `produtos` já existiam).

| O quê | Onde |
|---|---|
| Bloco **Fotos** na edição do produto: enviar várias, descrição (texto alternativo), capa, ordem, apagar | `src/admin/Fotos.tsx` |
| Preparo no navegador: versão grande (até 1400 px, orçamento de ~220 KB) e pequena (600 px, ~60 KB), WebP (JPEG se o navegador não gerar WebP), rotação corrigida, **dados escondidos e GPS removidos**; recusa imagem com menos de 400 px | `src/admin/fotos.ts` |
| Envio direto ao Storage com a sessão de admin (`src/lib/supabase/browser.ts`); registro, capa, ordem e remoção no servidor; foto órfã apagada se o registro falhar | `src/app/admin/fotos-acoes.ts` |
| Vitrine: capa pequena nos cartões, sacola e kits; galeria grande na página do produto; sem foto, continua a ilustração | `src/components/Midia.tsx`, `src/data/loja.ts`, `src/lib/fotos.ts` |

- Caminho no bucket: `<id do produto>/<código aleatório>.webp`; a versão pequena tem `-p` antes da extensão.
- A capa fica sempre em primeiro. "Usar como capa" leva a foto para o início; as setas ordenam as demais. Máximo de 12 fotos por produto.
- Apagar um produto em rascunho também apaga os arquivos das fotos.

Conferido nesta sessão (páginas de teste temporárias, já apagadas; imagens servidas pelo navegador de teste):
- Foto 4000×3000 com GPS e rotação → 1200×1600 (64 KB) e 450×600 (19 KB), sem EXIF; foto de 300 px recusada.
- Painel: capa marcada, setas corretas, 390 px sem rolagem lateral. Sem login, envio e troca de capa são recusados com mensagem em português.
- Vitrine: cartões pedem só a versão pequena; página do produto mostra a grande e troca pelas miniaturas.

Falta conferir entrando com `acess.ar05@gmail.com`:

- [x] Enviar 2 fotos num produto: aparecem no painel, a primeira vira capa
- [x] A vitrine mostra a capa no cartão e as duas na página do produto
- [x] Trocar a capa e editar a descrição
- [ ] Reordenar (as setas só funcionam com 3 fotos ou mais)
- [x] Apagar uma foto: some da vitrine **e do Storage** (conferir no painel do Supabase → Storage → produtos)
- [ ] Enviar pelo celular (foto da câmera)

## Teste de ponta a ponta no Supabase local (03/11/2026)

Supabase local completo (`npx supabase start`), contas de teste só no banco local, site compilado apontando para ele. **39 de 39 verificações passaram**: login (senha errada, conta sem permissão, sessão, sair), estoque (entrada, ajuste recusado, contagem, histórico, vitrine sem quantidade), cadastro (rascunho, dados, categoria, SKU repetido, variação com saldo 0, ativar, arquivar, apagar), kit composto (peças, trava depois de ativo) e fotos (envio, capa, descrição, galeria; arquivos em WebP sem EXIF/GPS).

Defeitos encontrados:
- Confirmação "Variação criada" sumia — corrigido.
- Apagar foto não apagava os arquivos do Storage: o Storage precisa **ler** o arquivo antes de apagar e não havia regra de leitura para o admin — **corrigido** com a migração `20261103090000_fotos_leitura_painel.sql` (aplicada no `ar-acessorios-dev` em 03/11/2026), testes 32–34 e aviso no painel quando sobrar arquivo. Depois disso, o roteiro passou com as verificações de armazenamento (foto apagada e rascunho com foto não deixam arquivo solto).

Como repetir: `npx supabase start`, criar um usuário pelo Auth local e inseri-lo em `admin_members`, rodar o site com `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` do `npx supabase status`.

## Painel no celular (03/11/2026)

O painel será muito usado no telefone. Até 899 px de largura:
- Barra de cima compacta (56 px) e **navegação de baixo** (Início, Estoque, Produtos, Pedidos); Permissões, Ver a loja, Modo noturno e Sair ficam em **"Mais"** (folha que abre de baixo).
- Aba e produto aberto ficam no endereço (`?aba=estoque`, `&produto=…`, `src/admin/url.ts`): o "voltar" do aparelho funciona dentro do painel e recarregar mantém o lugar.
- Tabelas viram **cartões** (até 699 px); no Estoque, Produtos e Variações o cartão inteiro é tocável.
- Janelas em **tela cheia** (até 599 px), com cabeçalho e botão de salvar fixos; "Apagar variação" fica fora da barra fixa.
- Ajuste de estoque com **Tirar/Somar** e campo numérico com − e + (o teclado numérico do celular não tem "−").
- Campos com 16 px (sem zoom do iPhone) e áreas de toque ≥ 44 px.

Conferido em 360 e 390 px: sem rolagem lateral, nenhuma tabela rolando, sem campo que dá zoom; o roteiro de ponta a ponta (41 verificações) passou no computador e no celular. No computador o painel não mudou.

## Modo noturno (04/11/2026)

Tokens novos em `.ar.dark` (vitrine) e `.adm.dark` (painel): base carvão quente com degraus visíveis (página `#100E0D`, cartão `#1F1B19`, destaque `#2D2825`, campo `#2A2522`, borda `#4A423C`). O que no claro é cacau invertido vira dourado champagne `#D9B384` com texto `#1A1511` (9,3:1). Todo texto ≥ 5:1. A faixa de aviso deixou de ser creme. A paleta definitiva continua pendente (D-014).

## Sem aviso de protótipo na navegação (04/11/2026, UI-DEC-003)

A pedido do responsável, saíram a faixa do topo, a frase do rodapé, "demonstração" no hero e no produto e "Promoção ilustrativa". Também saiu "(dados demonstrativos)" do campo Material dos 19 produtos (banco `ar-acessorios-dev`, `supabase/seed.sql` e `src/data/demo-catalog.ts`). **Continuam:** os avisos na sacola e no checkout (compra travada, D-017) e a nota de texto ilustrativo na página Sobre. O site segue fora dos buscadores (`robots: noindex`).

## Teste do painel com a conta real (04/11/2026)

Roteiro dos Passos 3 a 6 feito no `ar-acessorios-dev`, entrando com `acess.ar05@gmail.com` (marcado acima). Dados de teste:
- Argola Lunar Ródio G: entrada +3, ajuste −1, ajuste −5 recusado, contagem 0. O saldo voltou ao original (0), e as três movimentações ficam no histórico.
- "Produto Teste Claude" (`AR-TST999-OURO`): **arquivado** (tem movimentação, não pode ser apagado), saldo zerado, sem fotos e sem arquivos no Storage.
- "Kit Teste Claude" (kit composto): apagado.

Observações do teste:
- ~~Mensagem "Ajuste registrada"~~: corrigida para "Ajuste registrado" (04/11/2026).
- Promoção em variação esgotada: a vitrine mostra o preço promocional, mas esconde o preço riscado e "Promoção válida até…" (`cur.avail` em `src/views/ProductPage.tsx`). Está assim desde o primeiro commit. **Em aberto:** decidir se fica assim.
- Kit composto: voltar para rascunho ("Tirar da loja") libera de novo as peças. A mensagem do painel agora diz exatamente isso (04/11/2026). **Em aberto (Q-CAT-03):** isso deixa mudar a composição de um kit que já esteve à venda.
- ~~Produto arquivado continua na aba Estoque~~: agora fica escondido por padrão, com o botão "Mostrar arquivados (n)"; a visão geral também ignora arquivados (04/11/2026).
- ~~"Arquivar" não pede confirmação~~: agora pede (04/11/2026).

## Auditoria visual (04/11/2026, skill impeccable)

- **Tema na raiz:** a classe `dark` agora fica no `<html>`, aplicada por um script antes da primeira pintura (`src/app/layout.tsx`), sem piscar claro. Ela vem junto com `color-scheme`, para que menus abertos, calendário, barras de rolagem e preenchimento automático sigam o tema, e com a cor da barra do celular. O CSS usa `html.dark .ar` / `html.dark .adm`.
- **Controles do navegador no tema** (`src/styles/base.css`): menus de seleção com seta própria, caixas de marcar e rádios desenhados (no escuro os nativos sumiam no fundo), ícone do calendário, campo de busca sem o "x" cinza, preenchimento automático, seleção de texto e barras de rolagem.
- **Dicas (tooltips) no tema:** `data-dica` nos botões só com ícone (cabeçalho, favoritar no cartão, setas das fotos). Só aparecem com mouse ou teclado.
- **Confirmações do painel:** `window.confirm`/`alert` trocados por `src/admin/confirmar.tsx` (apagar foto, variação e rascunho).
- **Defeito corrigido:** no celular, a barra fixa "Adicionar à sacola" da página de produto ficava fora da tela, porque a animação de entrada (`.fade`, fill `both`) deixava um `transform` aplicado. Agora a animação usa `backwards`.
- **Vitrine:**
  - saíram os sobretítulos em maiúsculas antes dos títulos e os números 01/02/03 da página Sobre;
  - os cartões de kit não mostram mais "Kit com estoque próprio"/"Kit composto" (termos internos);
  - a categoria foi para a trilha do produto (Início / Loja / Brincos / peça);
  - no celular, os botões do destaque ficam lado a lado e a foto aparece na primeira tela;
  - entrou uma faixa com os três compromissos que já estavam na página Sobre;
  - os símbolos de texto usados como ícone (←, →, ↗, −, +) viraram ícones desenhados.
- **Página de produto (04/11/2026):**
  - no celular, a galeria ocupa a largura toda, desliza com o dedo e mostra pontos de posição;
  - no computador, tem miniaturas e zoom que acompanha o mouse nas fotos;
  - os blocos "Cuidados com a peça" (campo Cuidados do cadastro, hoje vazio em todos os produtos), "Entrega" e "Trocas" abrem e fecham e só aparecem com texto. Os textos de entrega e trocas ficam em `src/data/infoLoja.ts`, vazios até a cliente responder (D-010, D-015).
- **Painel conferido com login (04/11/2026):** no escuro, menus, datas e caixas de marcar seguem o tema; a confirmação abre no tema no computador e no celular (pequena, centrada), e "Cancelar" e Esc não apagam nada.
- **Rodapé público (04/11/2026):** sem "Limpar sacola e favoritos" e "Painel da loja". A opção de limpar foi para a sacola e para os favoritos; o painel continua em `/admin`.
- **`DESIGN.md` (04/11/2026):** sistema visual registrado com o impeccable (estrela-guia "O porta-joias de linho"; acolhida e confiante; componentes macios e discretos), com `.impeccable/design.json` ao lado. O `AGENTS.md` manda segui-lo. A paleta continua provisória (D-014).
- **Página inicial com composição nova (04/11/2026):** Lançamentos e Mais vendidos deslizam no celular; entre eles entrou "Kits para presentear", com foto editorial (`/marca/sobre.webp`) e os kits em lista, no lugar dos três cartões grandes com ilustração de caixa. As duas vitrines de produto deixaram de ficar coladas.
- **Fotos mais leves e campo de busca (04/11/2026):** o preparo das fotos agora tem orçamento de bytes: tenta qualidade 0,82 e só desce (até 0,6) se passar de ~220 KB (grande, 1400 px) ou ~60 KB (pequena, 600 px). Numa foto pesada de 3000×4000, a versão grande foi de 224 KB para 146 KB. Vale para todo envio (direto ou pela biblioteca). **Fotos já enviadas não mudam.** O campo de busca (loja e painel) deixou de mostrar uma borda quadrada dentro da pílula ao receber foco: o anel agora fica no campo inteiro (`base.css`). Esta correção **não foi vista na tela** (a janela do app estava minimizada); conferir ao clicar na busca.
- **Desempenho (04/11/2026):**
  - **Vitrine:** o catálogo agora fica em cache no servidor. Antes, cada página e cada clique esperavam o banco; num build de produção, as páginas caíram de 150–300 ms para 10–35 ms e a navegação entre páginas para 1–2 ms. O painel expira o cache a cada mudança (conferido: uma entrada de estoque apareceu na vitrine no clique seguinte), e ele também se renova a cada 60 s. Há esqueleto de carregamento na hora do clique (`src/app/(loja)/loading.tsx`) e no painel.
  - **Painel:** não carrega mais tudo de uma vez. Estoque e produtos vêm em páginas de 20, com busca (nome ou SKU) e filtros no banco. A visão geral busca só o estoque baixo. O editor carrega só o produto aberto, e a lista de peças do kit só quando se edita um kit. Ao salvar, o servidor devolve só o produto alterado. Abrir o painel direto numa aba já desenha a aba certa.
  - **A conferir:** a busca do estoque não procura mais pelos atributos (ex.: "Ródio"), só por produto e SKU.
- **Foto no hover e filtros ativos (04/11/2026):** os cartões de produto mostram a **segunda foto** ao passar o mouse (só é baixada na primeira intenção, nunca no toque) e a loja mostra os **filtros ativos como etiquetas** removíveis, com "Limpar tudo" e a contagem "5 de 19 peças". Conferido no computador e no celular; remover cada etiqueta atualiza a URL e a contagem. **Atenção:** hoje o banco tem uma foto só (no Anel Duo Entrelaçado), então o efeito do hover só aparecerá quando houver produtos com 2+ fotos; foi testado com uma segunda foto temporária, já removida.
- **Painel sem rolagem lateral (04/11/2026):** a faixa de filtros que deslizava para o lado (e cortava "Em separação") saiu. Nos filtros de status (Pedidos e Produtos), as pílulas ficam só no computador; abaixo de 900 px vira um menu de seleção de largura total (`src/admin/FiltroOpcoes.tsx`). As tabelas viram cartões quando a **própria área da tabela** tem menos de 700 px (container query em `.tw`), e não mais só pela largura da janela: entre 900 e ~1100 px, com a barra lateral, elas rolavam para o lado. Medido em 320, 360, 410, 768, 900 e 1280 px, em todas as abas e nas janelas de estoque, novo produto e variação: nenhuma rolagem lateral. A seta "›" dos cartões deixou de ser texto e virou um traço desenhado.
- **Menus de seleção próprios (04/11/2026):** a lista aberta do `<select>` nativo continuava com a cara do navegador (caixa quadrada, realce azul), porque o CSS não alcança essa lista. Os cinco menus (ordenação da loja; "Vendido por" no novo produto e no editor; peças do kit; status do pedido) agora usam `src/components/Selecao.tsx`, no tema, com teclado completo. Conferido no claro e no escuro, dentro de janela, dentro de tabela e no celular.
- **Logo sem o fundo preto (04/11/2026):** a mesma arte (D-004, sem redesenho), sem o círculo preto, como nas embalagens: dourado mais fundo no claro e o original no escuro (`src/assets/logo-ar-claro.png` e `logo-ar-escuro.png`, geradas do JPG original com ffmpeg). Maior no cabeçalho (62px) e no rodapé. O SVG oficial continua pendente (D-014).
- **Fotos das peças:** a maioria das peças ainda aparece como ilustração em traço. É o que mais deixa cara de protótipo. Opções: fotos reais da cliente ou fotos ilustrativas por IA (Kairogen; gasta créditos e precisa de aprovação).
- **Dado ruim no banco de desenvolvimento:** a foto do "Anel Duo Entrelaçado" é um folheto de Natal ("Por apenas R$ 42,99") e aparece em primeiro em Lançamentos e na loja. Trocar ou apagar pelo painel.

## Pendências que não são de código

| Item | Onde |
|---|---|
| Questionário para a cliente (frete, trocas, nota fiscal, painel, cores, domínio) | [documento](https://claude.ai/artifact/CZT1SUykPSyvr9Q34EC2Cf); trocar o marcador do link da prévia |
| Prévia publicada do protótipo (versão antiga, igual no visual) | [prévia](https://claude.ai/artifact/KdvjU6JFDRNuDA94YqAcPQ) |
| Propostas PR-001 e PR-002 (reserva × Pix; pagamento indefinido) | `docs/DECISOES.md` §6, decidir antes da Fase 3 |
| Projeto Supabase antigo em Oregon (vazio, sem uso) | o responsável pode apagar |

## Como pedir na próxima sessão

> Leia o AGENTS.md e o docs/CONTINUAR_AQUI.md e continue do Passo 1 (depois: decidir as observações do teste de 04/11/2026; itens restantes dos Passos 3, 4 e 6; depois enviar fotos de demonstração).
