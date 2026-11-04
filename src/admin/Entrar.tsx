'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { entrar, type EstadoEntrar } from '../app/admin/acoes';
import { LogoMark } from '../components/ui';

const INICIAL: EstadoEntrar = { erro: null, email: '' };

export function Entrar() {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL);

  return (
    <div className="adm auth">
      <main className="auth-box">
        <div className="brand">
          <LogoMark />
          <small>Painel</small>
        </div>
        <h1 className="h1">Entrar</h1>
        <p className="sub">Acesso só para quem administra a loja.</p>
        <form action={acao} className="auth-form" noValidate>
          <label className="auth-l">
            E-mail
            <input
              className="auth-i"
              type="email"
              name="email"
              autoComplete="username"
              required
              defaultValue={estado.email}
            />
          </label>
          <label className="auth-l">
            Senha
            <input className="auth-i" type="password" name="senha" autoComplete="current-password" required />
          </label>
          {estado.erro && (
            <p className="auth-err" role="alert">
              {estado.erro}
            </p>
          )}
          <button className="btn auth-btn" type="submit" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <Link className="sl auth-back" href="/">
          Voltar para a loja
        </Link>
      </main>
    </div>
  );
}
