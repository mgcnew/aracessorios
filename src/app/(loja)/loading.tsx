// Mostrado na hora do clique enquanto a próxima página chega: a navegação nunca parece travada.
export default function Carregando() {
  return (
    <div className="wrap esq" aria-busy="true" aria-label="Carregando">
      <div className="esq-titulo" />
      <div className="esq-linha" />
      <div className="pgrid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="esq-card">
            <div className="esq-foto" />
            <div className="esq-linha curta" />
            <div className="esq-linha" />
          </div>
        ))}
      </div>
    </div>
  );
}
