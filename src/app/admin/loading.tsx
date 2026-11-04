// Painel: retorno imediato enquanto confere a sessão e carrega a primeira página da aba.
export default function Carregando() {
  return (
    <div className="adm auth" aria-busy="true">
      <p className="sub">Carregando o painel…</p>
    </div>
  );
}
