import type { Metadata } from 'next';
import { Checkout } from '../../../views/Cart';

export const metadata: Metadata = { title: 'Checkout (demonstração)' };

export default function CheckoutPage() {
  return <Checkout />;
}
