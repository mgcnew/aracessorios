import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCatalogo } from '../../../../data/loja';
import { Catalog } from '../../../../views/Catalog';

type Props = { params: Promise<{ categoria: string }> };

async function categoria(slug: string) {
  return (await getCatalogo()).categories.find((c) => c.id === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await categoria((await params).categoria);
  return c ? { title: c.name, description: `${c.name} em semijoias da AR Acessórios.` } : {};
}

export default async function CategoriaPage({ params }: Props) {
  const c = await categoria((await params).categoria);
  if (!c) notFound();
  return (
    <Suspense>
      <Catalog cat={c.id} />
    </Suspense>
  );
}
