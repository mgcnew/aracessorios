import type { Metadata } from 'next';
import { Cart } from '../../../views/Cart';

export const metadata: Metadata = { title: 'Sacola' };

export default function SacolaPage() {
  return <Cart />;
}
