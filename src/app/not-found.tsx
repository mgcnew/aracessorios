import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="ar" style={{ display: 'grid', placeItems: 'center', padding: '20vh 20px' }}>
      <div className="empty">
        <h2>Página não encontrada</h2>
        <p>O endereço pode ter mudado ou a peça não está mais no catálogo.</p>
        <Link className="btn btn-p" href="/loja">
          Explorar a loja
        </Link>
      </div>
    </div>
  );
}
