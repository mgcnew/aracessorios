import { getCatalogo } from '../../data/loja';
import { getSite } from '../../data/site';
import { Home } from '../../views/Home';

export default async function HomePage() {
  const [catalogo, site] = await Promise.all([getCatalogo(), getSite()]);
  return <Home catalogo={catalogo} site={site} />;
}
