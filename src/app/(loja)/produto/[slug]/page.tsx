import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalogo } from '../../../../data/loja';
import { ProductPage } from '../../../../views/ProductPage';

type Props = { params: Promise<{ slug: string }> };

async function produto(slug: string) {
  return (await getCatalogo()).products.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await produto((await params).slug);
  return p ? { title: p.name, description: p.desc } : {};
}

export default async function ProdutoPage({ params }: Props) {
  const p = await produto((await params).slug);
  if (!p) notFound();
  // key: trocar de produto zera variação, quantidade e galeria.
  return <ProductPage key={p.id} productId={p.id} />;
}
