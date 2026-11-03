import { getCatalogo } from '../../data/loja';
import { Home } from '../../views/Home';

export default async function HomePage() {
  return <Home catalogo={await getCatalogo()} />;
}
