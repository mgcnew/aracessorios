'use client';

import { Selecao, type OpcaoSelecao } from '../components/Selecao';

/**
 * Filtro de uma escolha só (status de pedido ou de produto). No computador são pílulas em linha;
 * abaixo de 900px vira um menu de seleção, porque várias pílulas não cabem e rolar para o lado
 * corta o texto. As duas formas mostram o mesmo valor e usam as mesmas opções.
 */
export function FiltroOpcoes<V extends string>({
  valor,
  opcoes,
  onChange,
  rotulo,
}: {
  valor: V;
  opcoes: readonly OpcaoSelecao<V>[];
  onChange: (v: V) => void;
  rotulo: string;
}) {
  return (
    <>
      <div className="filtro-pills" role="group" aria-label={rotulo}>
        {opcoes.map((o) => (
          <button key={o.value} className={`pill${valor === o.value ? ' on' : ''}`} aria-pressed={valor === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="filtro-sel">
        <Selecao className="sel" aria-label={rotulo} value={valor} opcoes={opcoes} onChange={onChange} />
      </div>
    </>
  );
}
