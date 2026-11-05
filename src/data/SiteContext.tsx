'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { EMPRESA_PADRAO, type Empresa } from './site';

const Ctx = createContext<Empresa>(EMPRESA_PADRAO);

/** Entrega aos componentes da loja os dados da empresa cadastrados em Configurações. */
export function EmpresaProvider({ empresa, children }: { empresa: Empresa; children: ReactNode }) {
  return <Ctx.Provider value={empresa}>{children}</Ctx.Provider>;
}

export const useEmpresa = () => useContext(Ctx);
