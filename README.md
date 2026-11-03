# AR Acessórios — loja demonstrativa

> **Documentação do projeto:** comece por [`docs/DECISOES.md`](docs/DECISOES.md) (decisões) e [`docs/DOCUMENTO_MESTRE.md`](docs/DOCUMENTO_MESTRE.md) (visão e plano). Agentes de IA seguem [`AGENTS.md`](AGENTS.md).

Loja de semijoias AR Acessórios (Next.js + React + TypeScript), hoje com dados de demonstração, feito a partir do design "AR Acessórios — Protótipo". Produtos, preços, pedidos e endereços são fictícios: nenhuma compra é realizada.

```bash
npm install
npm run dev
```

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Início |
| `/loja`, `/loja/[categoria]` | Catálogo; busca, ordem e disponibilidade no endereço (`?q=`, `?ordem=`, `?disponiveis=1`) |
| `/produto/[slug]` | Produto, com variações e kits |
| `/favoritos`, `/sacola`, `/checkout` | Favoritos, sacola e prévia do checkout |
| `/sobre` | Institucional |
| `/admin` | Painel (demonstração; ainda não salva) |

O site está fora dos buscadores (`noindex`) até o lançamento.

## Estrutura

Veja [`AGENTS.md`](AGENTS.md).

A logo é a oficial (`src/assets/logo-ar.jpg`).
