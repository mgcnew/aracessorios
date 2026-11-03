# Continuar aqui

**Última atualização:** 03/11/2026. Atualize este arquivo no fim de cada sessão: risque o que terminou e escreva onde parou.

## Onde paramos

| Parte | Situação |
|---|---|
| Documentação e decisões | Consolidadas em `docs/DECISOES.md` (fonte única) |
| Banco `ar-acessorios-dev` (Supabase, São Paulo, ref `pmhipriryqsblhonysay`) | Pronto: 3 migrações, carga de demonstração (19 produtos, 73 variações, 3 kits) e **32 testes passando** |
| Admin do painel | `acess.ar05@gmail.com` criado e liberado em `admin_members` |
| Vitrine (Next.js) | **Lê do banco, mas não foi testada no navegador**: a rede da sessão anterior bloqueava o Supabase |
| Login do painel | **Escrito, não testado contra o banco** (rede bloqueada de novo): `/admin/entrar`, proteção de `/admin`, "acesso não autorizado", botão Sair |
| Painel `/admin` | Atrás do login, mas o conteúdo ainda é a demonstração com dados fixos de `src/admin/seed.ts`; não salva nada |
| Pagamento, frete, pedidos | Fora da fase atual |

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

## Passo 2 — Testar a vitrine contra o banco

```bash
npm run build && npm run start
```

Conferir em http://localhost:3000, no computador e no celular (390 px):

- [ ] Início mostra categorias, Lançamentos, Mais vendidos e os 3 kits
- [ ] `/loja` lista 19 peças; `/loja/brincos` filtra; busca e ordenação funcionam
- [ ] Brinco Argola Lunar mostra preço promocional só até 15/11/2026 (depois disso, preço normal)
- [ ] Variação esgotada aparece riscada e não vai para a sacola (ex.: Argola Lunar Ródio G)
- [ ] Conjunto Noite Estrelada aparece **esgotado** (a pulseira da composição está zerada)
- [ ] Página de kit composto mostra "O que vem no conjunto" **sem nenhuma quantidade** (CAT-DEC-024)
- [ ] Sacola e favoritos continuam funcionando e persistem ao recarregar
- [ ] Nenhum erro no console do navegador

Se algo falhar, a leitura está em `src/data/loja.ts`.

## Passo 3 — Testar o login do painel

Já feito (sessão de 03/11/2026, sem acesso ao banco):

- `src/lib/supabase/server.ts`: cliente no servidor com cookies (`@supabase/ssr`).
- `src/proxy.ts`: renova a sessão em `/admin/*`; sem sessão vai para `/admin/entrar`; com sessão, `/admin/entrar` volta para `/admin`.
- `src/app/admin/acoes.ts`: ações de servidor `entrar` e `sair`.
- `/admin/entrar` (`src/admin/Entrar.tsx`): e-mail e senha, sem cadastro.
- `src/app/admin/page.tsx`: confere de novo com `getUser()` e `is_admin()`; quem não é admin vê `src/admin/SemAcesso.tsx`.
- Botão "Sair" e e-mail de quem entrou na barra lateral do painel.

Conferido sem banco: `/admin` sem sessão redireciona para o login; a tela funciona a 390 px e no computador; build e typecheck passam.

Falta conferir com a rede liberada:

- [ ] Entrar com `acess.ar05@gmail.com` abre o painel; recarregar mantém a sessão
- [ ] Senha errada mostra "E-mail ou senha incorretos."
- [ ] Conta que não está em `admin_members` vê "Acesso não autorizado"
- [ ] "Sair" volta para o login e `/admin` deixa de abrir
- [ ] No Supabase (Authentication → Sign In / Providers), **cadastro público desligado** ("Allow new users to sign up")

## Passo 4 — Painel de estoque de verdade

Substituir os dados fixos de `src/admin/seed.ts` pelas funções do banco:

| Tela | Fonte no banco |
|---|---|
| Lista de estoque por variação, com alerta de mínimo | `painel_estoque()` |
| Entrada de mercadoria | `registrar_entrada(variação, quantidade, motivo)` |
| Ajuste (avaria, correção) | `registrar_ajuste(variação, diferença, motivo)` |
| Contagem física | `registrar_contagem(variação, contado, motivo)` |
| Histórico de uma variação | tabela `inventory_movements` (só leitura) |

Regras: motivo obrigatório; mostrar a mensagem de erro do banco quando ele recusar (ex.: "Estoque insuficiente"); kit composto não tem estoque próprio, então o painel mostra a disponibilidade calculada e manda movimentar as peças.

Depois disso, em outra etapa: cadastro e edição de produtos, variações, kits e fotos (bucket `produtos` já criado).

## Pendências que não são de código

| Item | Onde |
|---|---|
| Questionário para a cliente (frete, trocas, nota fiscal, painel, cores, domínio) | [documento](https://claude.ai/artifact/CZT1SUykPSyvr9Q34EC2Cf); trocar o marcador do link da prévia |
| Prévia publicada do protótipo (versão antiga, igual no visual) | [prévia](https://claude.ai/artifact/KdvjU6JFDRNuDA94YqAcPQ) |
| Propostas PR-001 e PR-002 (reserva × Pix; pagamento indefinido) | `docs/DECISOES.md` §6, decidir antes da Fase 3 |
| Ajustar as cores do modo noturno | pedido do responsável, sem urgência |
| Teste de dois ajustes simultâneos no mesmo SKU | fazer quando o painel estiver ligado ao banco |
| Projeto Supabase antigo em Oregon (vazio, sem uso) | o responsável pode apagar |

## Como pedir na próxima sessão

> Leia o AGENTS.md e o docs/CONTINUAR_AQUI.md e continue do Passo 1 (depois Passos 2 e 3: testar vitrine e login contra o banco).
