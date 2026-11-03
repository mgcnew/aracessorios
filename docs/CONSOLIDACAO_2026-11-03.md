# Consolidação da documentação — 03/11/2026

Origem: pacote `AR_ACESSORIOS_frontend_definitivo_v1.0_mestre_v2.1` (28/10/2026): Documento Mestre v2.1, Módulo 01 v0.8, Módulo 02 v0.4, briefs de frontend v0.1 e v1.0. Os 26 arquivos conferiram com o `MANIFEST_SHA256.json`.

**Nenhuma decisão foi criada, removida ou alterada.** Foram corrigidas referências, removidas duplicações e separadas as decisões das propostas. O que é sugestão nova está em `DECISOES.md` §6 com o estado **Proposto**.

## O que mudou na estrutura

| Antes | Agora |
|---|---|
| Decisões espalhadas: tabela do Mestre + anexos "Atualização v1.7…v2.1" + listas nos módulos | Uma tabela única em `DECISOES.md` |
| 9 estados ("CONFIRMADO PARCIAL", "PREFERÊNCIA CONFIRMADA", "DIRETRIZ CONFIRMADA"…) | 3 estados: Decidido, Proposto, Em aberto; ressalvas na coluna "Falta definir" |
| Versão no nome do arquivo (`_v0.8.md`) e 20 cópias antigas | Um arquivo por assunto; histórico no git. O zip original continua com o responsável |
| Dois briefs de frontend | `frontend/BRIEF_FRONTEND.md` |
| Regras para IA no Mestre §14/§18 | `AGENTS.md` na raiz (lido automaticamente por Claude e Codex) |

## Conflitos encontrados e como foram resolvidos

| # | Conflito | Resolução |
|---|---|---|
| 1 | Mestre apontava para "Módulo 02 v0.3" em D-008, D-009, PAY-DEC-003/004/005 e no anexo v1.9; o vigente era v0.4 | Referências por ID, sem versão |
| 2 | PAY-DEC-006 a 012 e UI-DEC-001/002 fora da tabela de decisões | Incluídas em `DECISOES.md` |
| 3 | Mestre §17 perguntava "comprar sem conta?" e "qual provedor?", já decididos (PAY-DEC-004/003) | Lista de perguntas refeita só com o que está em aberto |
| 4 | Parágrafo da reserva de 15 min duplicado no Mestre §8 | Regra só no Módulo 01 §4 |
| 5 | Duas identidades visuais (§4.2 preto/creme/dourado × UI-DEC-001 marfim/rosé) sem dizer qual vale para o site real | UI-DEC-001 marcada "só para a demo"; site real virou D-014 (em aberto) |
| 6 | Módulo 01 §3.2 dizia que preço por SKU "não aprova preços distintos", contra a CAT-DEC-005 | Removido; CAT-DEC-005 prevalece |
| 7 | Módulo 01 listava SKU, quantidades de kit e reserva como pendentes, já resolvidos por CAT-DEC-017/019 e D-012 | Pendências reais mantidas em Q-CAT-03 |
| 8 | Módulo 01 citava como documento pai o Mestre v1.7 | Referências sem versão |
| 9 | Requisitos EST-02, EST-05, CAT-04 como "PROPOSTO", já decididos | Incorporados às regras com o ID da decisão |
| 10 | Pendências do Módulo 02 repetidas 3 vezes com estados diferentes (PAY-P04 pendente × parcial) | Uma lista (Módulo 02 §5); IDs antigos entre parênteses em `DECISOES.md` |
| 11 | Rotas diferentes no Mestre, no brief e no protótipo | Proposta única PR-004 |
| 12 | Favoritos "PENDENTE" no Mestre, mas exigidos pelo brief | Na demo, sim; no site real, Q-UX-01 |
| 13 | Stack proposta Next.js; protótipo em Vite | Registrado no brief §5; migração na Fase 1 se PR-003 for aprovado |

## Duplicatas unificadas
- D-008 → PAY-DEC-004 · D-009 → PAY-DEC-001/003/005 · D-012 → CAT-DEC-013/014/015 · CAT-DEC-009 → CAT-DEC-019 · D-007 → PR-003 (era proposta, não decisão)

## Lacunas apontadas (não existiam nos documentos)
- Construir do zero × plataforma pronta (Q-NEG-01).
- Direito de arrependimento de 7 dias (CDC, art. 49) na política de trocas (Q-NEG-02).
- Validade do Pix igual à da reserva gera pagamentos tardios frequentes (PR-001).
- Estado "em conciliação" ausente da lista de estados do pedido (PR-006).
