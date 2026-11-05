// Espaços fixos da vitrine que a dona pode trocar em Configurações: o que são, onde aparecem e a imagem padrão
// que vale enquanto nada for escolhido. O slot é a chave em `site_media` (migração 20261105110000).

export interface EspacoSite {
  slot: string;
  rotulo: string;
  onde: string;
  padrao: { src: string; alt: string };
  /** Aceita vídeo curto no lugar da imagem. Categorias só aceitam imagem. */
  video: boolean;
  /** Proporção em que o espaço aparece na loja (para a miniatura e a dica de enquadramento). */
  ratio: string;
}

export const ESPACOS_FIXOS: EspacoSite[] = [
  {
    slot: 'hero-principal',
    rotulo: 'Destaque da página inicial',
    onde: 'Imagem grande no topo da página inicial.',
    padrao: { src: '/hero/pulseira.webp', alt: 'Pulseira dourada fina com pontos de brilho no pulso, sobre linho claro' },
    video: true,
    ratio: '4 / 5',
  },
  {
    slot: 'hero-brincos',
    rotulo: 'Destaque: foto pequena 1',
    onde: 'Foto pequena que acompanha o destaque da página inicial.',
    padrao: { src: '/hero/brincos.webp', alt: 'Par de brincos em ouro rosé com pérolas em gota, sobre seda champagne' },
    video: false,
    ratio: '1 / 1',
  },
  {
    slot: 'hero-anel',
    rotulo: 'Destaque: foto pequena 2',
    onde: 'Segunda foto pequena que acompanha o destaque.',
    padrao: { src: '/hero/anel.webp', alt: 'Anel solitário dourado com zircônia, em um pratinho de cerâmica' },
    video: false,
    ratio: '1 / 1',
  },
  {
    slot: 'presentes',
    rotulo: 'Kits para presentear',
    onde: 'Imagem ao lado dos kits, na página inicial.',
    padrao: { src: '/marca/sobre.webp', alt: 'Colar, brincos de pérola e anel dourados sobre linho, com flores secas' },
    video: true,
    ratio: '4 / 5',
  },
  {
    slot: 'embalagem',
    rotulo: 'Embalagem para presente',
    onde: 'Imagem da faixa de embalagem, na página inicial.',
    padrao: { src: '/marca/embalagem.webp', alt: 'Caixa de presente clara com laço rosé e colar dourado, ao lado de um cartão' },
    video: true,
    ratio: '6 / 5',
  },
  {
    slot: 'sobre',
    rotulo: 'Página Sobre a AR',
    onde: 'Imagem ao lado do texto da página Sobre.',
    padrao: { src: '/marca/sobre.webp', alt: 'Colar, brincos de pérola e anel dourados sobre linho, com flores secas' },
    video: true,
    ratio: '1 / 1.05',
  },
];

/** Fotos padrão das categorias; categoria nova sem foto mostra a ilustração até a dona escolher uma. */
export const PADRAO_CATEGORIA: Record<string, string> = {
  brincos: 'Brincos em ouro rosé com pérolas',
  colares: 'Colar dourado fino com ponto de luz',
  pulseiras: 'Pulseira dourada fina no pulso',
  aneis: 'Anel solitário dourado',
  tornozeleiras: 'Tornozeleira dourada com pingentes de concha',
  piercings: 'Piercings dourados em um pratinho de cerâmica',
};

export const slotCategoria = (slug: string) => `categoria-${slug}`;

/** Espaço de uma categoria, com a foto padrão quando existe. */
export function espacoCategoria(slug: string, nome: string): EspacoSite {
  const alt = PADRAO_CATEGORIA[slug];
  return {
    slot: slotCategoria(slug),
    rotulo: `Categoria: ${nome}`,
    onde: 'Cartão da categoria na página inicial.',
    padrao: { src: alt ? `/categorias/${slug}.webp` : '', alt: alt ?? nome },
    video: false,
    ratio: '1 / 1',
  };
}
