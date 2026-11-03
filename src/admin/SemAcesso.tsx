import Link from 'next/link';
import { sair } from '../app/admin/acoes';
import { LogoMark } from '../components/ui';

/** Pessoa entrou, mas não está em admin_members (is_admin() falso). */
export function SemAcesso({ email }: { email: string | null }) {
  return (
    <div className="adm auth">
      <main className="auth-box">
        <div className="brand">
          <LogoMark />
          <small>Painel</small>
        </div>
        <h1 className="h1">Acesso não autorizado</h1>
        <p className="sub">
          {email ? <>A conta <strong>{email}</strong> não tem permissão para o painel.</> : 'Esta conta não tem permissão para o painel.'}{' '}
          Se isso for um engano, fale com a dona da loja.
        </p>
        <form action={sair}>
          <button className="btn auth-btn" type="submit">
            Sair e entrar com outra conta
          </button>
        </form>
        <Link className="sl auth-back" href="/">
          Voltar para a loja
        </Link>
      </main>
    </div>
  );
}
