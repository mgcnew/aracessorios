# Biblioteca de fotos do painel

Estado: **migração da base preparada, não aplicada nem validada em Postgres; interface não implementada**. Autorizada em 04/11/2026 (CAT-DEC-025). Direção fotográfica: UI-DEC-004. A aplicação do SQL será manual pelo responsável, conforme solicitado.

## Comportamento esperado

A biblioteca guarda as fotos independentemente dos produtos. O painel permite buscar pelo nome, visualizar miniaturas, enviar fotos e escolher imagens existentes no editor. Cada foto informa quais produtos a usam. Retirar uma foto do produto remove somente o vínculo; arquivar ou apagar um rascunho não exclui o arquivo. A exclusão definitiva é uma ação separada, com confirmação, bloqueada no banco se houver qualquer vínculo.

Os produtos arquivados já preservam suas fotos hoje. A mudança acrescenta a reutilização e também a preservação ao remover vínculos ou apagar rascunhos.

## Plano antes de alterar schema e RLS

1. Acrescentar uma tabela de mídia independente, com ID, nome, descrição padrão, caminho único e datas. Manter texto alternativo, capa e ordem por vínculo em `product_images`. Preencher a biblioteca a partir dos caminhos existentes, sem mover ou apagar arquivos. Adicionar referência da foto do produto à biblioteca; impedir exclusão de mídia com vínculos usando chave estrangeira.
2. Dar acesso à biblioteca somente ao admin com RLS. A vitrine continua lendo as fotos dos produtos ativos. O bucket atual é público por URL: biblioteca administrativa não torna os arquivos privados. Alterar a política de remoção de arquivos para impedir que o cliente apague mídia ainda vinculada; definir fluxo de exclusão que possa ser retomado após falha de Storage.
3. Separar envio, vínculo e exclusão. Adaptar o envio atual para registrar a mídia e depois associá-la; se a associação falhar, manter na biblioteca. Remover a exclusão automática de arquivos ao apagar rascunho ou retirar foto. Validar autorização no servidor e no banco. Invalidar `TAG_CATALOGO` quando mudar a vitrine.
4. Adicionar aba Biblioteca e acesso no menu Mais do celular; seleção da biblioteca no editor de produto. Usar busca/paginação no servidor, cartões e temas existentes, controles de 44 px, estados vazio/erro/carregando e confirmação própria do painel.
5. Atualizar tipos a partir do Supabase local e executar os testes antes de considerar a biblioteca pronta. Aplicar no desenvolvimento somente depois da validação; sem deploy de produção.

## Arquivos previstos

- Nova migração aditiva em `supabase/migrations/` e testes de acesso/integridade em `supabase/tests/`.
- `src/lib/database.types.ts` (gerado), `src/lib/fotos.ts` e novas ações de biblioteca em `src/app/admin/`.
- `src/app/admin/fotos-acoes.ts` e `produtos-acoes.ts` (vínculos e preservação dos arquivos).
- `src/admin/Fotos.tsx`, novo componente da biblioteca, `src/admin/Admin.tsx`, carregamento inicial em `src/app/admin/page.tsx` e CSS do painel.
- Documentação de decisões, catálogo, design e continuidade no mesmo commit de cada mudança correspondente.

## Riscos e verificações obrigatórias

- **Perda de fotos antigas:** conferir contagem e caminhos antes/depois da migração; nenhum arquivo existente deve ser apagado ou renomeado.
- **Exclusão concorrente ao vínculo:** testar no banco, com duas sessões, que uma mídia usada não pode ser excluída e um vínculo não aponta para mídia excluída.
- **Falha entre banco e Storage:** prever estado recuperável; não declarar exclusão completa se sobra arquivo ou registro.
- **Acesso indevido:** testar visitante, usuário autenticado sem permissão e admin, incluindo chamadas diretas ao Storage.
- **Reutilização:** associar a mesma foto a dois produtos; retirar de um preserva o outro; apagar rascunho preserva a biblioteca; arquivar e reativar mantém fotos.
- **Regressão:** manter capa/ordem/descrições por produto e limite de 12 fotos; conferir vitrine e cache.
- **Interface:** validar busca, paginação, teclado e celular nos temas claro/escuro; rodar typecheck, build e suíte SQL.

## Fotos recebidas

Inventário e miniaturas em `referencias/`. Originais locais ignorados pelo Git. Antes de gerar um lote: selecionar referência de acetinado, consultar orçamento Dreamina, obter aprovação dos créditos e validar uma primeira edição contra a peça real. Sem nome, preço ou composição presumidos a partir da imagem.

## Aplicação manual da base

SQL versionado: `supabase/migrations/20261104090000_biblioteca_fotos_base.sql`. Aplicar uma vez no SQL Editor do banco de desenvolvimento, com o painel sem uso durante a execução. Não executar no banco de produção. Se houver erro, não continuar comandos separados; a migração usa transação.

A base cria `media_assets`, registra as fotos já vinculadas e usa o caminho como chave estrangeira, preservando os contratos atuais. Novos registros em `product_images` alimentam a biblioteca por gatilho. A unicidade antiga de `product_images.storage_path` fica intacta: reutilização em vários produtos ainda não está liberada nesta etapa. Nenhum arquivo é enviado ou apagado. Arquivos soltos no bucket sem vínculo não são importados automaticamente.

Políticas restritivas impedem remoção/substituição dos arquivos registrados pelas APIs com sessão autenticada. O painel antigo ainda tentará apagar arquivos ao retirar fotos ou apagar rascunhos: o vínculo sairá, a biblioteca preservará os arquivos e poderá aparecer o aviso de arquivo remanescente. Isso só ficará com o texto e a experiência finais quando as ações do painel forem adaptadas. O bucket continua público por URL.

Validação pendente: execução em Postgres/Supabase e testes de RLS, novos envios e preservação. A consulta final precisa mostrar `fotos_sem_biblioteca = 0`. Conferir também capa/ordem/URLs antigas, envio de uma foto nova e que conta fora de `admin_members` não lê nem escreve em `media_assets`. Antes da interface, preparar o fluxo de exclusão definitiva com concorrência e recuperação de falha do Storage, liberar reutilização e gerar os tipos. Não considerar esta base a biblioteca completa.
