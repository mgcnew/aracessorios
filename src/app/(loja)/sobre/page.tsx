import type { Metadata } from 'next';
import { getSite } from '../../../data/site';
import { About } from '../../../views/About';

export const metadata: Metadata = { title: 'Sobre a AR', description: 'A história e o cuidado por trás das semijoias AR Acessórios.' };

export default async function SobrePage() {
  return <About site={await getSite()} />;
}
