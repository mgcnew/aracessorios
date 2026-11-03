import type { Metadata } from 'next';
import { About } from '../../../views/About';

export const metadata: Metadata = { title: 'Sobre a AR', description: 'A história e o cuidado por trás das semijoias AR Acessórios.' };

export default function SobrePage() {
  return <About />;
}
