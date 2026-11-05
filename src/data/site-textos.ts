// Textos fixos da vitrine que a dona edita em Configurações: padrão, limite de caracteres e onde aparecem.
// A chave é a de `site_texts` (migração 20261105120000). Texto sem linha no banco mostra o padrão daqui.
// Fonte única: a vitrine, o painel e a validação do servidor leem esta lista.

export type GrupoTexto = 'inicio' | 'sobre' | 'produto' | 'rodape';

export interface TextoSite {
  chave: string;
  rotulo: string;
  grupo: GrupoTexto;
  /** Bloco da página onde o texto aparece (id de REGIOES). */
  regiao: string;
  padrao: string;
  max: number;
  /** Campo de várias linhas no painel (o texto continua um parágrafo só). */
  longo?: boolean;
  /** Aceita *palavra* para destacar em itálico dourado. */
  destaque?: boolean;
  /** Dica curta sobre o limite, quando o espaço da loja pede (ex.: título de uma linha). */
  nota?: string;
}

export interface RegiaoTexto {
  id: string;
  rotulo: string;
  /** Endereço na loja para conferir o resultado (sem o domínio). */
  href: string | null;
}

export const GRUPOS: { id: GrupoTexto; titulo: string; descricao: string }[] = [
  { id: 'inicio', titulo: 'Página inicial', descricao: 'Títulos e textos de cada bloco da página inicial.' },
  { id: 'sobre', titulo: 'Página Sobre (“Conheça a marca”)', descricao: 'A história da marca. Os três diferenciais abaixo da história ficam em Página inicial.' },
  { id: 'produto', titulo: 'Página de cada produto', descricao: 'Políticas que aparecem em todos os produtos. Em branco, o bloco não aparece.' },
  { id: 'rodape', titulo: 'Rodapé', descricao: 'Aparece no final de todas as páginas da loja.' },
];

/** Blocos de cada grupo, de cima para baixo, como aparecem na loja (alimenta o mapa do painel). */
export const REGIOES: Record<GrupoTexto, RegiaoTexto[]> = {
  inicio: [
    { id: 'destaque', rotulo: 'Destaque (topo)', href: '/' },
    { id: 'diferenciais', rotulo: 'Três diferenciais', href: '/' },
    { id: 'estilos', rotulo: 'Escolha o seu estilo', href: '/#h-cats' },
    { id: 'lancamentos', rotulo: 'Lançamentos', href: '/#h-new' },
    { id: 'kits', rotulo: 'Kits para presentear', href: '/#h-kits' },
    { id: 'vendidos', rotulo: 'Mais vendidos', href: '/#h-best' },
    { id: 'marca', rotulo: 'Feita para ser presenteada', href: '/#h-inst' },
  ],
  sobre: [{ id: 'historia', rotulo: 'História da marca', href: '/sobre' }],
  produto: [
    { id: 'entrega', rotulo: 'Bloco “Entrega”', href: '/loja' },
    { id: 'trocas', rotulo: 'Bloco “Trocas”', href: '/loja' },
  ],
  rodape: [{ id: 'rodape', rotulo: 'Texto da marca no rodapé', href: '/#rodape' }],
};

const diferencial = (n: number, titulo: string, texto: string): TextoSite[] => [
  { chave: `diferencial-${n}-titulo`, rotulo: `Diferencial ${n}: título`, grupo: 'inicio', regiao: 'diferenciais', padrao: titulo, max: 32 },
  { chave: `diferencial-${n}-texto`, rotulo: `Diferencial ${n}: texto`, grupo: 'inicio', regiao: 'diferenciais', padrao: texto, max: 110, longo: true },
];

export const TEXTOS_SITE: TextoSite[] = [
  { chave: 'inicio-titulo', rotulo: 'Título do destaque', grupo: 'inicio', regiao: 'destaque', padrao: 'Brilho *delicado* para os seus dias', max: 60, destaque: true, nota: 'Cabe em até duas linhas.' },
  {
    chave: 'inicio-lead',
    rotulo: 'Texto do destaque',
    grupo: 'inicio',
    regiao: 'destaque',
    padrao: 'Semijoias de acabamento refinado para compor o seu estilo — do básico de todo dia aos presentes que ficam na memória.',
    max: 180,
    longo: true,
  },
  ...diferencial(1, 'Acabamento cuidadoso', 'Peças pensadas para combinar entre si e compor com o seu dia a dia.'),
  ...diferencial(2, 'Embalagem para presente', 'Uma apresentação delicada, pronta para surpreender quem recebe.'),
  ...diferencial(3, 'Atendimento próximo', 'Ajuda na escolha da peça certa para cada ocasião.'),
  { chave: 'inicio-estilos-titulo', rotulo: 'Título do bloco', grupo: 'inicio', regiao: 'estilos', padrao: 'Escolha o seu estilo', max: 40 },
  { chave: 'inicio-lancamentos-titulo', rotulo: 'Título do bloco', grupo: 'inicio', regiao: 'lancamentos', padrao: 'Lançamentos', max: 40 },
  { chave: 'inicio-kits-titulo', rotulo: 'Título do bloco', grupo: 'inicio', regiao: 'kits', padrao: 'Kits para *presentear*', max: 50, destaque: true },
  {
    chave: 'inicio-kits-texto',
    rotulo: 'Texto do bloco',
    grupo: 'inicio',
    regiao: 'kits',
    padrao: 'Conjuntos pensados para combinar entre si, prontos para entregar a quem você gosta.',
    max: 140,
    longo: true,
  },
  { chave: 'inicio-vendidos-titulo', rotulo: 'Título do bloco', grupo: 'inicio', regiao: 'vendidos', padrao: 'Mais vendidos', max: 40 },
  { chave: 'inicio-marca-titulo', rotulo: 'Título do bloco', grupo: 'inicio', regiao: 'marca', padrao: 'Feita para ser presenteada', max: 50 },
  {
    chave: 'inicio-marca-texto',
    rotulo: 'Texto do bloco',
    grupo: 'inicio',
    regiao: 'marca',
    padrao: 'Cada peça é pensada para acompanhar momentos do dia a dia e também os que merecem ser lembrados — com embalagem cuidadosa e acabamento delicado.',
    max: 220,
    longo: true,
  },
  { chave: 'sobre-titulo', rotulo: 'Título da página', grupo: 'sobre', regiao: 'historia', padrao: 'Delicadeza em cada detalhe', max: 50, nota: 'Título grande: cabe em até duas linhas.' },
  {
    chave: 'sobre-texto-1',
    rotulo: 'Primeiro parágrafo',
    grupo: 'sobre',
    regiao: 'historia',
    padrao: 'A AR Acessórios nasceu do desejo de oferecer semijoias que valorizam o estilo de cada pessoa, com acabamento cuidadoso e um olhar atento ao presentear.',
    max: 320,
    longo: true,
  },
  {
    chave: 'sobre-texto-2',
    rotulo: 'Segundo parágrafo',
    grupo: 'sobre',
    regiao: 'historia',
    padrao: 'Das peças de todo dia aos kits pensados para surpreender, cada escolha busca unir elegância, conforto e um toque de brilho.',
    max: 320,
    longo: true,
  },
  { chave: 'produto-entrega', rotulo: 'Texto de entrega', grupo: 'produto', regiao: 'entrega', padrao: '', max: 500, longo: true, nota: 'Prazos, regiões e frete. Só escreva o que a loja realmente pratica.' },
  { chave: 'produto-trocas', rotulo: 'Texto de trocas', grupo: 'produto', regiao: 'trocas', padrao: '', max: 500, longo: true, nota: 'Prazo e condições de troca e devolução.' },
  { chave: 'rodape-texto', rotulo: 'Frase da marca', grupo: 'rodape', regiao: 'rodape', padrao: 'Semijoias delicadas para o dia a dia e para presentear.', max: 100, longo: true },
];

export const TEXTO_POR_CHAVE = Object.fromEntries(TEXTOS_SITE.map((t) => [t.chave, t])) as Record<string, TextoSite>;

export type TextosSite = Record<string, string>;

/** O texto a mostrar: o da dona ou, sem ele, o padrão do site. */
export function textoDe(textos: TextosSite, chave: string): string {
  return textos[chave] ?? TEXTO_POR_CHAVE[chave]?.padrao ?? '';
}

export const pilaresDe = (textos: TextosSite) =>
  [1, 2, 3].map((n) => ({ n: `0${n}`, title: textoDe(textos, `diferencial-${n}-titulo`), text: textoDe(textos, `diferencial-${n}-texto`) }));

/** Texto limpo para guardar: um parágrafo só, sem espaços sobrando e com os *destaques* em ordem. */
export function limparTexto(t: TextoSite, bruto: string): { ok: true; valor: string } | { ok: false; erro: string } {
  const valor = bruto.replace(/\s+/g, ' ').trim();
  if (valor.length > t.max) return { ok: false, erro: `“${t.rotulo}” passa de ${t.max} caracteres (tem ${valor.length}).` };
  const asteriscos = (valor.match(/\*/g) ?? []).length;
  if (!t.destaque && asteriscos) return { ok: false, erro: `“${t.rotulo}” não aceita asteriscos.` };
  if (t.destaque && (asteriscos > 2 || asteriscos % 2 === 1 || valor.includes('**'))) return { ok: false, erro: `“${t.rotulo}”: use um único par de asteriscos em volta da palavra de destaque (ex.: *delicado*).` };
  return { ok: true, valor };
}
