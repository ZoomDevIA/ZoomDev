import React, { useCallback, useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { Botao, Etiqueta, Painel, Rotulo } from '../hud/index.jsx';
import { api } from '../../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// PUBLICAÇÃO E CONTATOS
//
// O construtor entregava um ZIP. Entre "tenho um ZIP" e "mandei o link no
// WhatsApp" existe um abismo de fricção, e é nele que a maioria dos projetos
// para. Este painel é a ponte: um endereço, um botão, e o link na mão.
//
// A segunda metade importa tanto quanto a primeira. O formulário do MVP
// gerado guardava o lead no navegador do visitante, o que equivale a jogar
// fora. Agora o contato chega no servidor e no e-mail do fundador, e aparece
// aqui, com o que a pessoa preencheu.
// ═══════════════════════════════════════════════════════════════════════════

export default function Publicacao({ projeto, onFechar, onAviso }) {
  const [estado, setEstado] = useState(null);
  const [slug, setSlug] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [aba, setAba] = useState('endereco');

  const carregar = useCallback(async () => {
    try {
      const r = await api.site(projeto.id);
      setEstado(r);
      setSlug(r.site?.slug || r.sugestao || '');
    } catch (e) { onAviso?.(e.message); }
  }, [projeto?.id, onAviso]);

  useEffect(() => { carregar(); }, [carregar]);

  const publicar = async () => {
    setOcupado(true);
    try {
      await api.publicarSite(projeto.id, slug.trim() || undefined);
      await carregar();
    } catch (e) { onAviso?.(e.message); } finally { setOcupado(false); }
  };

  const despublicar = async () => {
    setOcupado(true);
    try { await api.despublicarSite(projeto.id); await carregar(); }
    catch (e) { onAviso?.(e.message); } finally { setOcupado(false); }
  };

  // O endereço completo é montado aqui, no navegador: o servidor só conhece o
  // domínio quando ZOOMDEV_URL está definida, e o link precisa funcionar antes
  // disso.
  const enderecoCheio = estado?.site ? `${window.location.origin}${estado.site.caminho}` : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enderecoCheio);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch { onAviso?.('Não consegui copiar. Selecione o endereço e copie à mão.'); }
  };

  if (!estado) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: '#04100b' }}>
        <Icon nome="atualizar" tam={20} className="text-white/30 animate-spin" />
      </div>
    );
  }

  const leads = estado.leads || [];

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto p-5"
      style={{ background: '#04100b', backdropFilter: 'blur(4px)' }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="hud-caps text-[9px] text-[#00ff64] mb-1">seu produto no ar</div>
            <h3 className="font-heading font-bold text-[15px]">
              {estado.publicado ? 'Site publicado' : 'Publicar o site'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {estado.publicado && (
              <>
                <button onClick={() => setAba('endereco')}
                  className={`hud-aba hud-caps px-2.5 py-1 text-[9px] ${aba === 'endereco' ? 'ativa' : ''}`}>
                  Endereço
                </button>
                <button onClick={() => setAba('contatos')}
                  className={`hud-aba hud-caps px-2.5 py-1 text-[9px] flex items-center gap-1 ${aba === 'contatos' ? 'ativa' : ''}`}>
                  Contatos {leads.length > 0 && <span className="text-[#00ff64]">{leads.length}</span>}
                </button>
              </>
            )}
            <button onClick={onFechar} title="Fechar" className="text-white/40 hover:text-white p-1">
              <Icon nome="fechar" tam={16} />
            </button>
          </div>
        </div>

        {aba === 'endereco' && (
          <>
            {estado.desatualizado && (
              <Painel cor="#ffc531" tamanho="p" className="p-3">
                <div className="flex gap-2.5">
                  <Icon nome="alerta" tam={14} className="text-[#ffc531] shrink-0 mt-0.5" />
                  <div className="text-[12px] text-white/70 leading-relaxed">
                    Você editou o código depois de publicar. O que está no ar ainda é a versão
                    anterior: publique de novo para atualizar.
                  </div>
                </div>
              </Painel>
            )}

            <Painel tamanho="p" className="p-4">
              <Rotulo cor="#00ff64">endereço do site</Rotulo>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="hud-tec text-[11px] text-white/30 shrink-0">
                  {window.location.host}/s/
                </span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="meu-produto"
                  className="hud-campo flex-1 min-w-0 px-2.5 py-1.5 text-[12.5px] hud-tec"
                />
              </div>
              <p className="text-[10.5px] text-white/35 mt-2 leading-relaxed">
                Letras, números e hífen. Trocar o endereço libera o anterior, e quem tiver o link
                antigo vai cair numa página de endereço não encontrado.
              </p>

              <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                <Botao onClick={publicar} disabled={ocupado || slug.trim().length < 3}
                  className="px-4 py-2 text-[11.5px]">
                  {ocupado ? <Icon nome="atualizar" tam={13} className="animate-spin" />
                    : <><Icon nome="foguete" tam={13} /> {estado.publicado ? 'Atualizar o site' : 'Publicar'}</>}
                </Botao>
                {estado.publicado && (
                  <button onClick={despublicar} disabled={ocupado}
                    className="text-[11px] text-white/35 hover:text-[#ff4d8d] transition-colors px-2 py-1.5">
                    tirar do ar
                  </button>
                )}
              </div>
            </Painel>

            {estado.publicado && (
              <Painel cor="#00ff64" tamanho="p" className="p-4">
                <Rotulo cor="#00ff64">o link para mandar</Rotulo>
                <div className="flex items-center gap-2 mt-2.5">
                  <code className="hud-tec text-[12px] text-[#00ff64] break-all flex-1 min-w-0">
                    {enderecoCheio}
                  </code>
                  <button onClick={copiar} title="Copiar o endereço"
                    className="p-1.5 text-white/40 hover:text-[#00ff64] transition-colors shrink-0">
                    <Icon nome={copiado ? 'check' : 'copiar'} tam={15} />
                  </button>
                  <a href={enderecoCheio} target="_blank" rel="noreferrer noopener" title="Abrir o site"
                    className="p-1.5 text-white/40 hover:text-[#00ff64] transition-colors shrink-0">
                    <Icon nome="externo" tam={15} />
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Numero valor={estado.site.visitas || 0} rotulo="visitas" cor="#00e5ff" />
                  <Numero valor={leads.length} rotulo="contatos" cor="#00ff64" />
                  <Numero valor={(estado.site.paginas || []).length} rotulo="páginas" cor="#a855f7" />
                </div>

                {(estado.site.paginas || []).length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {estado.site.paginas.map(p => (
                      <a key={p} href={`${enderecoCheio}/${p}`} target="_blank" rel="noreferrer noopener">
                        <Etiqueta cor="#00e5ff">{p}</Etiqueta>
                      </a>
                    ))}
                  </div>
                )}
              </Painel>
            )}

            <p className="hud-tec text-[8.5px] text-white/22 leading-relaxed">
              O site vai ao ar isolado da plataforma, numa origem própria: o código gerado não
              alcança sua sessão nem seus dados. O formulário dele entrega os contatos aqui e no
              seu e-mail.
            </p>
          </>
        )}

        {aba === 'contatos' && (
          leads.length === 0 ? (
            <Painel tamanho="p" className="p-6 text-center">
              <Icon nome="usuarios" tam={26} className="text-white/20 mx-auto mb-3" />
              <p className="text-[13px] text-white/45 leading-relaxed max-w-sm mx-auto">
                Nenhum contato ainda. Todo formulário do seu site entrega aqui, e uma cópia vai
                para o seu e-mail assim que alguém preencher.
              </p>
            </Painel>
          ) : (
            <div className="space-y-2">
              {leads.map(l => (
                <Painel key={l.id} tamanho="p" className="p-3.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px] font-bold">{l.nome || 'Sem nome'}</span>
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="text-[11.5px] text-[#00e5ff] hover:underline">
                        {l.email}
                      </a>
                    )}
                    <span className="hud-tec text-[9px] text-white/25 ml-auto">
                      {new Date(l.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {Object.entries(l.dados || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-[11.5px]">
                        <span className="hud-caps text-[8.5px] text-white/30 w-24 shrink-0 pt-0.5">{k}</span>
                        <span className="text-white/65 break-words min-w-0">{v}</span>
                      </div>
                    ))}
                  </div>
                </Painel>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Numero({ valor, rotulo, cor }) {
  return (
    <div className="hud-corte p-2.5 text-center"
      style={{ '--c': '5px', background: `${cor}0f`, boxShadow: `inset 0 0 0 1px ${cor}2e` }}>
      <div className="hud-tec font-bold text-[17px]" style={{ color: cor }}>{valor}</div>
      <div className="hud-caps text-[8.5px] text-white/35 mt-0.5">{rotulo}</div>
    </div>
  );
}
