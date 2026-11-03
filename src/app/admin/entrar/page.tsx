import type { Metadata } from 'next';
import { Entrar } from '../../../admin/Entrar';

export const metadata: Metadata = { title: 'Entrar no painel' };

export default function EntrarPage() {
  return <Entrar />;
}
