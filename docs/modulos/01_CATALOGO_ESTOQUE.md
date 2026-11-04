# Módulo 01 — Catálogo e Estoque

**Atualizado em:** 03/11/2026 · **Decisões:** [`../DECISOES.md`](../DECISOES.md) §2
**Cobre:** produtos, variações, kits, categorias, imagens, saldo e movimentações de estoque.
**Não cobre:** quando um pagamento conta como confirmado, cancelamentos e reembolsos (Módulo 02); frete; permissões gerais (Documento Mestre §6).

## 1. Produto, variação e SKU

- **Produto** = página comercial: nome, descrição, cuidados, categorias (CAT-DEC-016), status `rascunho | ativo | arquivado`.
- **Variação** = o que de fato se vende. Tem SKU único (CAT-DEC-017), atributos, preço próprio (CAT-DEC-005), preço promocional opcional com validade (CAT-DEC-020) e unidade comercial: unidade, par ou conjunto (CAT-DEC-002).
- Produto sem opções visíveis tem uma variação padrão, para que todo estoque passe pelo mesmo caminho.
- Só existem as variações **cadastradas**. Nunca gerar todas as combinações automaticamente (D-011).
- Regras de publicação (proposto): produto ativo precisa de ao menos uma variação com preço válido e uma imagem de capa. Arquivar não apaga histórico.
- Formato do SKU: PR-005 (proposto).

## 2. Atributos por tipo — em aberto (Q-CAT-01)

Atributos possíveis: banho/acabamento, tamanho, material, cor, modelo (D-011). Não presumir que anel sempre tem tamanho, que todo piercing tem banho ou que "modelo" sempre gera SKU distinto.

| Tipo | Atributos que se aplicam | Unidade de venda |
|---|---|---|
| Brincos | a definir | a definir (provável: par) |
| Colares | a definir | a definir |
| Pulseiras | a definir | a definir |
| Anéis | a definir | a definir |
| Tornozeleiras | a definir | a definir |
| Piercings | a definir | a definir |

## 3. Kits

| | Kit com estoque próprio | Kit composto |
|---|---|---|
| Decisões | CAT-DEC-004, 007, 008, 017 | CAT-DEC-004, 007, 008, 017, 019 |
| Saldo | O próprio, como qualquer SKU | Calculado: menor ⌊saldo vendável da peça ÷ quantidade exigida⌋, descontando reservas |
| Na venda | Debita só o kit; **não** debita as peças | Debita/reserva cada peça na quantidade exigida |
| Preço | Próprio, definido pela loja | Próprio, definido pela loja |

Em aberto (Q-CAT-03): reposição de cada modelo em devoluções; o que acontece com kits já vendidos quando a composição muda. Até a resposta, o painel só permite mudar a composição de kit em rascunho.

Exigência para a implementação: reservar as peças do kit composto sem contá-las duas vezes, e nunca deixar estoque vendável negativo.

## 4. Estoque

**Estoque vendável** = saldo − reservas ativas.

| Movimento | Quando | Regra |
|---|---|---|
| Entrada | Chegada de mercadoria | Quantidade, motivo, operador e data obrigatórios |
| Reserva | Início do checkout/pagamento | CAT-DEC-013; dura 15 min (CAT-DEC-014; ver PR-001) |
| Liberação | Reserva expirou | Só após verificar o pagamento (CAT-DEC-015); pagamento indefinido segue Q-PAG-03 / PR-002 |
| Baixa definitiva | Pagamento confirmado e validado | CAT-DEC-010 |
| Reposição | Cancelamento/devolução validados | CAT-DEC-011; nunca repor o que não foi baixado |
| Ajuste manual | Contagem, avaria, correção | CAT-DEC-012: motivo, operador e histórico imutável |

**Regras de integridade:**
- Saldo nunca é alterado pelo navegador; só por operação no servidor, autorizada e transacional.
- Nada de "ler e depois gravar" sem trava: duas compras simultâneas da última unidade não podem deixar saldo negativo.
- Bloquear compra sem estoque vendável; sem pré-venda (CAT-DEC-006).
- Eventos repetidos não duplicam baixa nem reposição.
- Estoque mínimo com alerta e contagem manual (CAT-DEC-021).

## 5. Imagens

Arquivos no Supabase Storage, com ordem, texto alternativo e marcação de capa. Validar tipo, tamanho e permissão no servidor. Servir versões comprimidas e responsivas. Só apagar o arquivo quando nada mais o referenciar.

Biblioteca independente do produto: CAT-DEC-025. Retirar a foto de um produto ou apagar um rascunho preserva a imagem para reutilização. Exclusão definitiva fica na biblioteca, somente sem vínculos e com confirmação. Direção dos fundos e fidelidade das edições: UI-DEC-004. Implementação, SQL manual e verificações em [`../frontend/BIBLIOTECA_FOTOS.md`](../frontend/BIBLIOTECA_FOTOS.md).

## 6. Segurança

- Leitura pública só de produtos ativos e dados de vitrine.
- Nunca expor custo, histórico de estoque ou operadores na API pública.
- Toda escrita exige login do painel, autorização no servidor e RLS coerente.

## 7. Critérios de aceite

1. Produto em rascunho não aparece na vitrine.
2. Produto ativo só aparece com dados mínimos e variação válida.
3. Variação sem estoque vendável aparece como indisponível e não pode ir para a sacola.
4. Entrada e ajuste sempre geram registro no histórico.
5. Duas operações simultâneas não deixam saldo negativo.
6. Visitante não consegue criar produto nem mexer em estoque.
7. Arquivar ou editar produto não altera pedidos antigos.
8. Disponibilidade do kit composto bate com a fórmula da CAT-DEC-019, inclusive com reservas ativas.
