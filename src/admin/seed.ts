// Dados fictícios do painel administrativo de demonstração.

export const ORDER_STATUSES = ['Aguardando pagamento', 'Pago', 'Em separação', 'Enviado', 'Entregue', 'Cancelado'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Status que a dona pode escolher manualmente (fluxo de separação e envio). */
export const EDITABLE_STATUSES: OrderStatus[] = ['Pago', 'Em separação', 'Enviado', 'Entregue'];

export interface AdminProduct {
  id: number;
  name: string;
  cat: string;
  sku: string;
  price: string;
  stock: number;
  active: boolean;
  kindText: string;
  derived: boolean;
}

export interface AdminOrder {
  id: number;
  date: string;
  customer: string;
  items: number;
  total: number; // centavos
  status: OrderStatus;
}

export const SEED_PRODUCTS: AdminProduct[] = (
  [
    ['Brinco Gota Aurora', 'Brincos', 'AR-BRC001', '89,90', 6, true, 'Simples'],
    ['Brinco Argola Lunar', 'Brincos', 'AR-BRC002', '69,90', 9, true, 'Simples'],
    ['Brinco Pérola Clássica', 'Brincos', 'AR-BRC003', '74,90', 12, true, 'Simples'],
    ['Colar Ponto de Luz', 'Colares', 'AR-COL001', '119,90', 3, true, 'Simples'],
    ['Colar Gotas de Orvalho', 'Colares', 'AR-COL002', '129,90', 5, true, 'Simples'],
    ['Pulseira Riviera Delicada', 'Pulseiras', 'AR-PUL001', '139,90', 2, true, 'Simples'],
    ['Pulseira Pérolas e Ouro', 'Pulseiras', 'AR-PUL003', '94,90', 0, true, 'Simples'],
    ['Anel Solitário Brilho', 'Anéis', 'AR-ANE001', '89,90', 7, true, 'Simples'],
    ['Anel Fio de Ouro', 'Anéis', 'AR-ANE003', '59,90', 1, true, 'Simples'],
    ['Tornozeleira Maré', 'Tornozeleiras', 'AR-TOR001', '74,90', 4, false, 'Simples'],
    ['Piercing Pontinho de Luz', 'Piercings', 'AR-PIE002', '39,90', 0, true, 'Simples'],
    ['Kit Presente Luz', 'Kits', 'AR-KIT001', '249,90', 8, true, 'Kit com estoque próprio'],
    ['Conjunto Aurora', 'Kits', 'AR-KIT002', '199,90', 3, true, 'Kit composto · derivado'],
  ] as const
).map(([name, cat, sku, price, stock, active, kindText], id) => ({
  id,
  name,
  cat,
  sku,
  price,
  stock,
  active,
  kindText,
  derived: kindText.includes('composto'),
}));

export const SEED_ORDERS: AdminOrder[] = (
  [
    [1048, '28/10', 'Camila R.', 3, 31970, 'Aguardando pagamento'],
    [1047, '28/10', 'Juliana M.', 1, 8990, 'Pago'],
    [1046, '27/10', 'Fernanda S.', 2, 18980, 'Em separação'],
    [1045, '27/10', 'Beatriz L.', 4, 42960, 'Enviado'],
    [1044, '26/10', 'Patrícia A.', 1, 11990, 'Entregue'],
    [1043, '25/10', 'Larissa C.', 2, 14980, 'Entregue'],
    [1042, '24/10', 'Renata P.', 1, 24990, 'Cancelado'],
    [1041, '23/10', 'Mariana T.', 2, 20980, 'Pago'],
  ] as const
).map(([id, date, customer, items, total, status]) => ({ id, date, customer, items, total, status }));

type Item = { t: string; d: string };
const items = (rows: [string, string][]): Item[] => rows.map(([t, d]) => ({ t, d }));

export const CAN_LIST = items([
  ['Cadastrar e editar produtos', 'Nome, descrição, fotos, categorias, variantes e SKUs.'],
  ['Mostrar ou ocultar peças na loja', 'Sem apagar o histórico do produto.'],
  ['Ajustar preços e criar promoções', 'Com período definido; o preço antigo aparece riscado.'],
  ['Ajustar estoque manualmente', 'Com um motivo registrado (contagem, avaria, entrada de mercadoria).'],
  ['Montar kits', 'Kit com estoque próprio ou composto por outros produtos.'],
  ['Acompanhar pedidos e atualizar separação e envio', 'Pago → em separação → enviado → entregue.'],
  ['Organizar a home', 'Categorias, destaques, lançamentos e textos institucionais.'],
]);

export const CANT_LIST = items([
  ['Marcar um pedido como pago à mão', 'O pagamento vem confirmado pelo provedor; nada de baixa manual.'],
  ['Dar baixa no estoque de pedido pago', 'A baixa é automática após o pagamento (regra do sistema final).'],
  ['Alterar itens ou valores de pedido já pago', 'Mudanças só por cancelamento ou estorno, seguindo o fluxo de pagamento.'],
  ['Editar o estoque de um kit composto', 'A disponibilidade é calculada a partir dos componentes.'],
  ['Excluir produto que já teve pedido', 'Pode apenas ocultar ou arquivar, para preservar o histórico.'],
  ['Ver dados de cartão', 'Nunca são guardados pela loja.'],
  ['Mexer em integrações e configurações técnicas', 'Fica com quem mantém o sistema.'],
]);

export const ASK_LIST = items([
  ['Vai existir mais de um usuário no painel?', 'Por exemplo, uma ajudante só com acesso a pedidos e estoque.'],
  ['Quem pode cancelar um pedido?', 'Só a dona ou também quem separa os pedidos.'],
  ['Quais status de pedido ela quer acompanhar?', 'A lista mostrada aqui é apenas ilustrativa.'],
]);
