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
| Painel `/admin` — Estoque | **Ligado ao banco** (aba Estoque e "Estoque baixo" da visão geral). Falta testar entrando com a conta real |
| Painel `/admin` — Produtos, Pedidos | Ainda demonstração com dados fixos de `src/admin/seed.ts`; não salva nada |
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

- [ ] Aba Estoque lista as 73 variações (as de kit composto com "—" no saldo)
- [ ] Entrada de 3 em uma variação: saldo sobe 3, aparece no histórico com o motivo
- [ ] Ajuste −1: saldo desce 1
- [ ] Ajuste que deixaria o saldo negativo: aparece "Estoque insuficiente…" e nada muda
- [ ] Contagem: saldo passa a ser o número contado
- [ ] A vitrine reflete a mudança (ex.: entrada na Argola Lunar Ródio G faz ela deixar de aparecer esgotada)
- [ ] Teste de dois ajustes simultâneos no mesmo SKU (duas abas)

Depois disso, em outra etapa: cadastro e edição de produtos, variações, kits e fotos (bucket `produtos` já criado).

## Pendências que não são de código

| Item | Onde |
|---|---|
| Questionário para a cliente (frete, trocas, nota fiscal, painel, cores, domínio) | [documento](https://claude.ai/artifact/CZT1SUykPSyvr9Q34EC2Cf); trocar o marcador do link da prévia |
| Prévia publicada do protótipo (versão antiga, igual no visual) | [prévia](https://claude.ai/artifact/KdvjU6JFDRNuDA94YqAcPQ) |
| Propostas PR-001 e PR-002 (reserva × Pix; pagamento indefinido) | `docs/DECISOES.md` §6, decidir antes da Fase 3 |
| Ajustar as cores do modo noturno | pedido do responsável, sem urgência |
| Projeto Supabase antigo em Oregon (vazio, sem uso) | o responsável pode apagar |

## Como pedir na próxima sessão

> Leia o AGENTS.md e o docs/CONTINUAR_AQUI.md e continue do Passo 1 (depois: testar login e estoque com a conta real, Passos 3 e 4).
