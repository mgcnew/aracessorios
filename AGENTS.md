# Instruções para agentes (Claude, Codex)

Projeto: loja virtual **própria** da AR Acessórios (semijoias, B2C, estoque próprio, sem vendedores terceiros).

## Antes de qualquer tarefa
0. Leia [`docs/CONTINUAR_AQUI.md`](docs/CONTINUAR_AQUI.md): diz onde a última sessão parou e o próximo passo. Atualize-o no fim da sessão.
1. Leia [`docs/DECISOES.md`](docs/DECISOES.md). É a **única** fonte de decisões.
2. Leia o documento da área afetada:
   - visão, escopo, arquitetura: [`docs/DOCUMENTO_MESTRE.md`](docs/DOCUMENTO_MESTRE.md)
   - catálogo e estoque: [`docs/modulos/01_CATALOGO_ESTOQUE.md`](docs/modulos/01_CATALOGO_ESTOQUE.md)
   - pedidos e pagamentos: [`docs/modulos/02_PEDIDOS_PAGAMENTOS.md`](docs/modulos/02_PEDIDOS_PAGAMENTOS.md)
   - protótipo visual: [`docs/frontend/BRIEF_FRONTEND.md`](docs/frontend/BRIEF_FRONTEND.md)
   - sistema visual (cores, fontes, formas, componentes e regras): [`DESIGN.md`](DESIGN.md); qualquer mudança visual segue e atualiza esse arquivo

## Regras
- **Decidido** é regra. **Proposto** e **Em aberto** não são: não implemente como se fossem.
- Achou contradição entre documentos, ou entre documento e código? **Pare e pergunte.** Não escolha um lado.
- Não invente dados reais da cliente (preços, endereços, políticas). Use marcadores como `[A DEFINIR]`.
- Decisão nova ou alterada: edite a linha em `docs/DECISOES.md` e os documentos que a citam **no mesmo commit**. Não crie arquivos com versão no nome (`_v2.md`) nem anexe seções "Atualização" no fim do documento; o histórico é o git.
- Antes de mexer em schema, RLS, estoque ou pagamento: apresente o plano, os arquivos afetados, os riscos e os testes.
- Nunca: migração destrutiva, deploy de produção, segredos no repositório, chave `service_role` no cliente.

## Fase atual
**Fase 1 — Fundação** (autorizada em 03/11/2026): site em Next.js, projeto Supabase com banco, login do painel, schema de catálogo e estoque (Módulo 01) e CI.
**Fase 2 — Catálogo e painel** (autorizada em 03/11/2026 pelo responsável): painel de estoque, cadastro de produtos, variações, kits e fotos, vitrine lendo do banco. Pendentes da cliente: Q-CAT-01 (atributos por tipo) e fotos reais; até lá, catálogo de demonstração.
**Não autorizado:** pagamento real (Fase 3), deploy de produção.

## Estado atual (03/11/2026)
- Banco `ar-acessorios-dev` (Supabase, São Paulo, ref `pmhipriryqsblhonysay`) montado com as migrações de `supabase/migrations/`, a carga de `supabase/seed.sql` e os 35 testes de `supabase/tests/catalogo_estoque.sql` passando (`bash scripts/testar-banco.sh` no banco local; a CI roda a cada envio).
- Admin do painel: `acess.ar05@gmail.com` (em `admin_members`).
- A vitrine lê o catálogo do banco (`src/data/loja.ts` → `CatalogoProvider`), gerada a cada visita. Testada no navegador contra o banco em 03/11/2026.
- Login do painel (`/admin/entrar`, `src/proxy.ts`, `src/app/admin/acoes.ts`) e aba Estoque ligada ao banco (`src/admin/Estoque.tsx`, `src/app/admin/estoque-acoes.ts`) cadastro de produtos (`src/admin/Produtos.tsx`, `src/admin/ProdutoEditor.tsx`, `src/app/admin/produtos-acoes.ts`) e fotos (`src/admin/Fotos.tsx`, `src/app/admin/fotos-acoes.ts`; vitrine em `src/components/Midia.tsx`). Falta testar entrando com a conta real. Pedidos do painel ainda são demonstração (`src/admin/seed.ts`).
- Ambiente: `cp .env.example .env.local`. A rede da sessão precisa permitir `pmhipriryqsblhonysay.supabase.co`, e na nuvem o servidor roda com `NODE_USE_ENV_PROXY=1` (senão o Node não usa o proxy e as páginas dão 500).
- Regras que a interface deve respeitar: o visitante vê só disponível sim/não, nunca quantidade (CAT-DEC-024); kit composto não tem saldo próprio (CAT-DEC-019).

## Estrutura
- `src/app/` — rotas do Next.js. `(loja)/` agrupa as páginas da vitrine; `admin/` é o painel.
- `src/views/` — conteúdo de cada página (não use `src/pages/`: o Next.js reserva esse nome).
- `src/components/` — peças reutilizáveis. `src/store.tsx` — sacola, favoritos e tema.
- `src/data/` — `catalog.ts` (tipos e funções de apoio), `loja.ts` (catálogo lido do banco, só no servidor), `CatalogoContext.tsx` (entrega o catálogo às telas), `catalogQuery.ts` (filtros), `demo-catalog.ts` (dados fictícios, usado só por `scripts/gerar-seed.ts`).
- `src/lib/` — cliente do Supabase e tipos do banco (`database.types.ts`, gerado: atualize depois de cada migração).
- `src/styles/` — CSS da loja (escopo `.ar`) e do painel (escopo `.adm`).

## Comandos
```bash
npm install
npm run dev        # servidor local (http://localhost:3000)
npm run typecheck
npm run build      # build de produção, gera as páginas estáticas
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
