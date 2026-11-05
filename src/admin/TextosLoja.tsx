'use client';

import { useEffect, useMemo, useState } from 'react';
import { salvarTextos } from '../app/admin/configuracoes-acoes';
import { Destaque } from '../components/Destaque';
import { GRUPOS, REGIOES, TEXTOS_SITE, type GrupoTexto, type TextoSite } from '../data/site-textos';
import type { PaginaConfiguracoes } from './configuracoes';
import { useAcao } from './Produtos';

/*
 * Textos fixos da loja (SET-DEC-002): títulos e parágrafos da página inicial, da Sobre, da página de produto e do rodapé.
 * Cada campo diz onde aparece na loja, mostra o limite de caracteres e volta ao texto padrão com um clique.
 * Nada vai para a loja até clicar em "Salvar" no cartão da página.
 */
export function TextosLoja({ dados, mudou }: { dados: PaginaConfiguracoes; mudou: () => void }) {
  if (!dados.textosPronto)
    return (
      <p className="auth-err" role="alert">
        Os textos da loja ainda não existem no banco. Aplique supabase/migrations/20261105120000_textos_site.sql no SQL Editor e recarregue.
      </p>
    );
  return (
    <>
      <p className="note" style={{ marginBottom: 12 }}>
        Edite os textos fixos da loja. O mapa e o título de cada campo mostram <strong style={{ fontWeight: 500 }}>onde</strong> o texto aparece, e o contador mostra quanto ainda cabe: o limite
        evita que o layout fique torto. Texto em branco, ou igual ao padrão, volta ao texto original do site.
      </p>
      {GRUPOS.map((g) => (
        <GrupoTextos key={g.id} grupo={g.id} titulo={g.titulo} descricao={g.descricao} salvos={dados.textos} mudou={mudou} />
      ))}
    </>
  );
}

const valorSalvo = (t: TextoSite, salvos: Record<string, string>) => salvos[t.chave] ?? t.padrao;

function GrupoTextos({
  grupo,
  titulo,
  descricao,
  salvos,
  mudou,
}: {
  grupo: GrupoTexto;
  titulo: string;
  descricao: string;
  salvos: Record<string, string>;
  mudou: () => void;
}) {
  const textos = useMemo(() => TEXTOS_SITE.filter((t) => t.grupo === grupo), [grupo]);
  const regioes = REGIOES[grupo];
  const [edit, setEdit] = useState<Record<string, string>>(() => Object.fromEntries(textos.map((t) => [t.chave, valorSalvo(t, salvos)])));
  const [ativa, setAtiva] = useState<string | null>(null);
  const [recemSalvos, setRecemSalvos] = useState<string[]>([]);
  const { pendente, erro, feito, rodar } = useAcao();

  // O que já está salvo pode mudar por fora (recarga depois de salvar): campo sem edição acompanha.
  useEffect(() => {
    setEdit((e) => Object.fromEntries(textos.map((t) => [t.chave, e[t.chave] !== undefined && e[t.chave] !== valorSalvo(t, salvos) ? e[t.chave] : valorSalvo(t, salvos)])));
  }, [salvos, textos]);

  const alterados = textos.filter((t) => (edit[t.chave] ?? '').replace(/\s+/g, ' ').trim() !== valorSalvo(t, salvos));
  const sujo = alterados.length > 0;

  // Fechar a aba com texto não salvo pede confirmação do navegador.
  useEffect(() => {
    if (!sujo) return;
    const aviso = (ev: BeforeUnloadEvent) => ev.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [sujo]);

  const salvar = () =>
    rodar(
      () => salvarTextos(alterados.map((t) => ({ chave: t.chave, valor: edit[t.chave] ?? '' }))),
      () => {
        setRecemSalvos(alterados.map((t) => t.chave));
        mudou();
      },
      alterados.length === 1 ? 'Texto salvo. A loja já mostra o que mudou.' : `${alterados.length} textos salvos. A loja já mostra o que mudou.`,
    );

  const descartar = () => {
    setEdit(Object.fromEntries(textos.map((t) => [t.chave, valorSalvo(t, salvos)])));
    setRecemSalvos([]);
  };

  const ir = (id: string) => {
    const primeiro = textos.find((t) => t.regiao === id);
    if (primeiro) document.getElementById(`txt-${primeiro.chave}`)?.focus();
  };

  return (
    <section className="card textos-card" aria-labelledby={`g-${grupo}`}>
      <div className="textos-cab">
        <div>
          <h2 id={`g-${grupo}`}>{titulo}</h2>
          <p className="note">{descricao}</p>
        </div>
        {sujo ? (
          <span className="tag t-warn" role="status">
            {alterados.length === 1 ? '1 alteração não salva' : `${alterados.length} alterações não salvas`}
          </span>
        ) : (
          feito && (
            <span className="tag t-ok" role="status">
              Salvo
            </span>
          )
        )}
      </div>

      <div className={`textos-corpo${regioes.length > 1 ? ' com-mapa' : ''}`}>
        {regioes.length > 1 && (
          <nav className="mapa" aria-label={`Blocos de “${titulo}”, de cima para baixo`}>
            <span className="mapa-t">Como aparece na loja</span>
            {regioes.map((r) => {
              const mudados = alterados.some((t) => t.regiao === r.id);
              return (
                <button key={r.id} type="button" className={`mapa-r${ativa === r.id ? ' on' : ''}${mudados ? ' mudou' : ''}`} onClick={() => ir(r.id)} aria-label={`Editar ${r.rotulo}`}>
                  <span>{r.rotulo}</span>
                  {mudados && <i aria-hidden="true" />}
                </button>
              );
            })}
          </nav>
        )}

        <div className="textos-campos">
          {regioes.map((r) => (
            <fieldset key={r.id} className={`regiao${ativa === r.id ? ' on' : ''}`}>
              <legend>
                <span className="regiao-onde">Onde aparece</span>
                {r.rotulo}
              </legend>
              {r.href && (
                <a className="regiao-ver" href={r.href} target="_blank" rel="noopener noreferrer">
                  Ver na loja
                  <span className="vh"> (abre em outra aba)</span>
                </a>
              )}
              {textos
                .filter((t) => t.regiao === r.id)
                .map((t) => (
                  <Campo
                    key={t.chave}
                    t={t}
                    valor={edit[t.chave] ?? ''}
                    salvo={valorSalvo(t, salvos)}
                    personalizado={t.chave in salvos}
                    recemSalvo={recemSalvos.includes(t.chave) && !alterados.includes(t)}
                    mudar={(v) => {
                      setEdit((e) => ({ ...e, [t.chave]: v }));
                      setRecemSalvos((s) => s.filter((c) => c !== t.chave));
                    }}
                    foco={() => setAtiva(r.id)}
                    desfoco={() => setAtiva((a) => (a === r.id ? null : a))}
                    desabilitado={pendente}
                  />
                ))}
            </fieldset>
          ))}
        </div>
      </div>

      {erro && (
        <p className="auth-err" role="alert">
          {erro}
        </p>
      )}
      {feito && !sujo && (
        <p className="ok-msg" role="status">
          {feito}
        </p>
      )}
      <div className="acoes-fim">
        {sujo && (
          <button className="btn" type="button" onClick={descartar} disabled={pendente}>
            Descartar alterações
          </button>
        )}
        <button className="btn auth-btn" type="button" onClick={salvar} disabled={!sujo || pendente}>
          {pendente ? 'Salvando…' : 'Salvar textos'}
        </button>
      </div>
    </section>
  );
}

function Campo({
  t,
  valor,
  salvo,
  personalizado,
  recemSalvo,
  mudar,
  foco,
  desfoco,
  desabilitado,
}: {
  t: TextoSite;
  valor: string;
  salvo: string;
  personalizado: boolean;
  recemSalvo: boolean;
  mudar: (v: string) => void;
  foco: () => void;
  desfoco: () => void;
  desabilitado: boolean;
}) {
  const id = `txt-${t.chave}`;
  const tam = valor.length;
  const perto = tam >= t.max * 0.9;
  const alterado = valor.replace(/\s+/g, ' ').trim() !== salvo;
  const naoPadrao = valor.replace(/\s+/g, ' ').trim() !== t.padrao;
  const comum = { id, className: 'auth-i texto-i', value: valor, maxLength: t.max, disabled: desabilitado, onFocus: foco, onBlur: desfoco, 'aria-describedby': `${id}-d` };
  const estado = alterado ? { rotulo: 'Alterado, não salvo', cls: 't-warn' } : recemSalvo ? { rotulo: 'Salvo agora', cls: 't-ok' } : personalizado ? { rotulo: 'Personalizado', cls: 't-info' } : { rotulo: 'Texto padrão', cls: 't-neutro' };
  return (
    <div className={`texto${alterado ? ' mudou' : ''}${recemSalvo ? ' salvou' : ''}`}>
      <div className="texto-cab">
        <label htmlFor={id}>{t.rotulo}</label>
        <span className={`tag ${estado.cls}`}>{estado.rotulo}</span>
      </div>
      {t.longo ? <textarea {...comum} rows={t.max > 200 ? 4 : 3} onChange={(ev) => mudar(ev.target.value)} /> : <input {...comum} onChange={(ev) => mudar(ev.target.value)} />}
      <div className="texto-pe" id={`${id}-d`}>
        <span className="texto-dica">
          {t.destaque ? 'Use *asteriscos* em volta da palavra para destacá-la em dourado. ' : ''}
          {t.nota ?? ''}
          {!t.padrao && !valor ? ' Em branco, este bloco não aparece na loja.' : ''}
        </span>
        <span className={`contador${perto ? ' perto' : ''}${tam >= t.max ? ' cheio' : ''}`} aria-label={`${tam} de ${t.max} caracteres`}>
          {tam}/{t.max}
        </span>
      </div>
      {t.destaque && valor.trim() && (
        <p className="texto-previa" aria-label="Prévia">
          <span className="previa-l">Prévia</span>
          <span className="previa-t">
            <Destaque texto={valor.trim()} />
          </span>
        </p>
      )}
      {naoPadrao && (
        <button type="button" className="pill texto-rest" disabled={desabilitado} onClick={() => mudar(t.padrao)}>
          {t.padrao ? 'Voltar ao texto padrão' : 'Limpar (sem texto)'}
        </button>
      )}
    </div>
  );
}
