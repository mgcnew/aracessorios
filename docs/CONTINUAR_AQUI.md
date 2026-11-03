# Continuar aqui

**Última atualização:** 03/11/2026. Atualize este arquivo no fim de cada sessão: risque o que terminou e escreva onde parou.

## Onde paramos

| Parte | Situação |
|---|---|
| Documentação e decisões | Consolidadas em `docs/DECISOES.md` (fonte única) |
| Banco `ar-acessorios-dev` (Supabase, São Paulo, ref `pmhipriryqsblhonysay`) | Pronto: 3 migrações, carga de demonstração (19 produtos, 73 variações, 3 kits) e **32 testes passando** |
| Admin do painel | `acess.ar05@gmail.com` criado e liberado em `admin_members` |
| Vitrine (Next.js) | **Testada contra o banco em 03/11/2026**: todos os itens do Passo 2 passaram |
| Login do painel | **Parcialmente testado contra o banco** (falta entrar com a senha real): `/admin/entrar`, proteção de `/admin`, "acesso não autorizado", botão Sair |
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

Observação: o aviso "Promoção ilustrativa · período fictício: 01/11 a 15/11/2026" em `src/views/ProductPage.tsx` é texto fixo; quando houver promoção real, ele precisa vir das datas do banco.

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

- [ ] Entrar com `acess.ar05@gmail.com` abre o painel; recarregar mantém a sessão
- [x] Senha errada mostra "E-mail ou senha incorretos." (testado contra o banco)
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
