# Módulo 02 — Pedidos, Checkout e Pagamentos

**Atualizado em:** 03/11/2026 · **Decisões:** [`../DECISOES.md`](../DECISOES.md) §3
**Cobre:** checkout, estados do pedido e do pagamento, integração com o Mercado Pago, confirmação, pagamento tardio, conciliação, cancelamento e reembolso.
**Não cobre:** saldo, reserva e movimentações de estoque (Módulo 01). Este módulo **comanda** o estoque ("reserve", "dê baixa", "libere") e o Módulo 01 executa.

## 1. Checkout

- Compra como visitante, sem conta obrigatória (PAY-DEC-004). Quais dados mínimos pedir ainda está em aberto (provavelmente nome, e-mail, telefone, endereço e CPF para nota fiscal e antifraude); depende de D-015 e Q-PAG-06.
- Pagamento: Pix, crédito (até 6x, juros para o cliente: PAY-DEC-008/012) e débito (PAY-DEC-005), provavelmente via Mercado Pago (PAY-DEC-003, em aberto). Sem boleto (PAY-DEC-001).
- Preço, promoção, frete e total são **sempre recalculados no servidor**; o valor enviado pelo navegador é ignorado.
- O pedido guarda uma cópia (snapshot) de nome, SKU, preço e endereço do momento da compra.
- Modalidade de integração (Checkout Pro, Bricks ou API): em aberto (Q-PAG-05). Antes de decidir, confirmar na documentação atual do Mercado Pago: débito online, prazo configurável do Pix (PAY-DEC-009) e parcelamento.

## 2. Linha do tempo de um pedido

```
Cliente inicia pagamento ──► reserva de estoque (Módulo 01, 15 min*)
        │
        ├─ Mercado Pago confirma dentro do prazo ──► baixa definitiva ──► pedido "pago"
        │
        ├─ Reserva expira, pagamento NÃO aprovado (verificado) ──► libera estoque ──► pedido "cancelado" (proposto)
        │
        ├─ Reserva expira, pagamento INDEFINIDO ──► "em conciliação", retentativas (PAY-DEC-007/010)
        │                                            └─ ação no estoque: EM ABERTO (Q-PAG-03 / PR-002)
        │
        └─ Pagamento confirmado DEPOIS da expiração ──► análise administrativa (PAY-DEC-006)
                 ├─ há estoque: decisão do administrador (sem desfecho automático)
                 └─ sem estoque: reembolso após validação administrativa (PAY-DEC-011)
```
\* PR-001 propõe reserva maior que a validade do Pix.

## 3. Estados

Proposta em PR-006: `aguardando_pagamento → (em_conciliacao) → pago → em_separacao → enviado → entregue`, além de `cancelado` e `reembolsado`.

- Só transições previstas são aceitas; o servidor recusa qualquer outra.
- O painel **não** marca pedido como pago, nem altera itens ou valores de pedido pago. A dona só move `pago → em_separacao → enviado → entregue` (conforme a proposta de permissões mostrada no protótipo, pendente de D-013).

## 4. Integridade

- "Pago" só com confirmação do Mercado Pago verificada no servidor (webhook com assinatura validada e/ou consulta à API). O retorno do navegador nunca conta.
- Toda operação sensível tem chave de idempotência; eventos repetidos ou fora de ordem não duplicam pagamento, baixa nem reposição.
- Cada tentativa de pagamento é registrada com o ID externo e o resultado; cada evento recebido é guardado.
- Nunca guardar dados de cartão.

## 5. Em aberto

| ID | Assunto |
|---|---|
| Q-PAG-01 | Validade do Pix × reserva (PR-001) |
| Q-PAG-02 | Fluxo da análise de pagamento tardio: prazo, quem decide, mensagem ao cliente |
| Q-PAG-03 | Estoque durante pagamento indefinido (PR-002). **Conflito real:** CAT-DEC-015 quer liberar após verificar, mas PAY-DEC-007 mantém o pagamento indefinido em conciliação. Sem essa regra o checkout não pode ser implementado. |
| Q-PAG-04 | Cancelamento, estorno e reembolso: quem pode, prazos, efeito no estoque |
| Q-PAG-05 | Modalidade do Mercado Pago, taxas, valor mínimo da parcela |
| Q-PAG-06 | Antifraude |
| D-010 | Frete (necessário para fechar o total) |
| D-015 | Nota fiscal, termos, LGPD |

## 6. Critérios de aceite (para a Fase 3)

1. Redirecionamento do navegador sozinho não muda pedido para "pago".
2. Webhook repetido 3 vezes gera uma única baixa.
3. Webhook com assinatura inválida é rejeitado e registrado.
4. Duas pessoas pagando a última unidade: só uma recebe; a outra segue o fluxo de pagamento tardio.
5. Total cobrado = total recalculado no servidor, mesmo que o navegador envie outro valor.
6. Cada cenário da linha do tempo (§2) tem teste automatizado.
