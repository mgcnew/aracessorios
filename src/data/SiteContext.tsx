'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { EMPRESA_PADRAO, type Empresa } from './site';
import { textoDe, type TextosSite } from './site-textos';

const Ctx = createContext<Empresa>(EMPRESA_PADRAO);
const CtxTextos = createContext<TextosSite>({});

/** Entrega aos componentes da loja os dados da empresa e os textos cadastrados em Configurações. */
export function EmpresaProvider({ empresa, textos, children }: { empresa: Empresa; textos: TextosSite; children: ReactNode }) {
  return (
    <Ctx.Provider value={empresa}>
      <CtxTextos.Provider value={textos}>{children}</CtxTextos.Provider>
    </Ctx.Provider>
  );
}

export const useEmpresa = () => useContext(Ctx);

/** `texto('rodape-texto')`: o texto da dona ou o padrão do site. */
export function useTextos(): (chave: string) => string {
  const textos = useContext(CtxTextos);
  return (chave) => textoDe(textos, chave);
}
