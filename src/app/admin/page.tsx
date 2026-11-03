import type { Metadata } from 'next';
import { Admin } from '../../admin/Admin';

export const metadata: Metadata = { title: 'Painel' };

export default function AdminPage() {
  return <Admin />;
}
