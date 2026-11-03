import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Catalog } from '../../../views/Catalog';

export const metadata: Metadata = { title: 'Loja', description: 'Brincos, colares, pulseiras, anéis, tornozeleiras, piercings e kits.' };

export default function LojaPage() {
  return (
    <Suspense>
      <Catalog cat="all" />
    </Suspense>
  );
}
