'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Guarda um valor do painel no endereço (?aba=estoque, ?produto=…), para o botão
 * "voltar" do celular funcionar dentro do painel e recarregar manter o lugar.
 */
export function useParamUrl(nome: string, padrao: string) {
  const [valor, setValor] = useState(padrao);

  useEffect(() => {
    const ler = () => setValor(new URLSearchParams(window.location.search).get(nome) ?? padrao);
    ler();
    window.addEventListener('popstate', ler);
    return () => window.removeEventListener('popstate', ler);
  }, [nome, padrao]);

  const mudar = useCallback(
    (novo: string, outros: Record<string, string | null> = {}) => {
      const u = new URL(window.location.href);
      if (novo === padrao) u.searchParams.delete(nome);
      else u.searchParams.set(nome, novo);
      for (const [k, v] of Object.entries(outros)) {
        if (v === null) u.searchParams.delete(k);
        else u.searchParams.set(k, v);
      }
      if (u.href !== window.location.href) window.history.pushState(window.history.state, '', u);
      setValor(novo);
    },
    [nome, padrao],
  );

  return [valor, mudar] as const;
}
