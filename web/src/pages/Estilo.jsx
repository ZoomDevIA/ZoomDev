import React, { useState } from 'react';
import Icon, { ICONES } from '../components/Icon.jsx';
import {
  Painel, Cantoneira, Rotulo, Divisor, Etiqueta, Barra, Anel,
  Abas, Botao, Campo, Estatistica, Pulso, Secao,
} from '../components/hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// GUIA DE ESTILO — a referência viva do sistema HUD.
//
// Existe para responder duas perguntas sem abrir o código: que peças a
// plataforma tem, e como cada uma se comporta. Quem for desenhar uma tela
// nova começa por aqui em vez de inventar uma borda própria.
// ═══════════════════════════════════════════════════════════════════════════

const CORES = [
  ['Ciano estrutural', '#00e5ff', 'Bordas, linhas-guia, hachura e rótulos técnicos'],
  ['Verde ZoomDev', '#00ff64', 'Marca, confirmação, estado saudável'],
  ['Âmbar', '#ffc531', 'Seleção ativa, atenção, prazo se aproximando'],
  ['Magenta', '#ff4d8d', 'Erro, bloqueio, risco crítico'],
  ['Roxo', '#a855f7', 'Ciência e evidência'],
];

export default function Estilo() {
  const [aba, setAba] = useState('formas');
  const [copiado, setCopiado] = useState(null);

  const copiar = (texto) => {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(texto);
      setTimeout(() => setCopiado(null), 1400);
    }).catch(() => {});
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Rotulo>SISTEMA DE DESIGN</Rotulo>
        <h1 className="font-heading text-2xl font-bold mt-2">
          Camada <span className="zd-gradient-text">HUD</span>
        </h1>
        <p className="text-white/50 text-sm mt-1.5 max-w-2xl">
          Chanfro no lugar de raio, borda de um pixel luminosa, hachura como textura e
          medidores segmentados. Toda tela nova monta a partir daqui.
        </p>
      </div>

      <Abas
        itens={[
          { id: 'formas', label: 'Formas', icone: <Icon nome="grid" tam={13} /> },
          { id: 'icones', label: `Ícones (${ICONES.length})`, icone: <Icon nome="cubo" tam={13} /> },
          { id: 'cores', label: 'Cores', icone: <Icon nome="gota" tam={13} /> },
        ]}
        ativo={aba}
        onMudar={setAba}
      />

      {aba === 'formas' && (
        <div className="space-y-8">
          <Secao rotulo="PAINEL" titulo="Blocos" descricao="A moldura base, em três intensidades.">
            <div className="grid sm:grid-cols-3 gap-4">
              <Painel className="p-4">
                <div className="hud-caps text-[10px] text-white/40">padrão</div>
                <p className="text-sm text-white/70 mt-1.5">Borda discreta, fundo translúcido.</p>
              </Painel>
              <Painel aceso className="p-4">
                <div className="hud-caps text-[10px] text-white/40">aceso</div>
                <p className="text-sm text-white/70 mt-1.5">Borda forte e halo. Para o que está em foco.</p>
              </Painel>
              <Painel quatroCantos cor="#a855f7" vivo className="p-4">
                <div className="hud-caps text-[10px] text-white/40">quatro cantos · vivo</div>
                <p className="text-sm text-white/70 mt-1.5">Passe o mouse: sobe e acende.</p>
              </Painel>
            </div>
          </Secao>

          <Secao rotulo="MOLDURA" titulo="Cantoneiras" descricao="Marcação de canto sem fechar a moldura.">
            <Cantoneira className="p-6" tam={18}>
              <div className="text-center">
                <div className="hud-tec text-xs text-white/50">ÁREA DEMARCADA</div>
                <p className="text-sm text-white/70 mt-1">Quatro cantos em L, nada no meio.</p>
              </div>
            </Cantoneira>
          </Secao>

          <Secao rotulo="MEDIDORES" titulo="Progresso" descricao="Sempre em blocos, nunca em gradiente contínuo.">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[['Ideação concluída', 100, '#00ff64'], ['Validação', 62, '#00e5ff'],
                  ['MVP', 24, '#ffc531'], ['Tração', 0, '#ff4d8d']].map(([r, v, c]) => (
                  <div key={r}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="hud-caps text-white/45">{r}</span>
                      <span className="hud-tec" style={{ color: c }}>{v}%</span>
                    </div>
                    <Barra valor={v} cor={c} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-around">
                {[[82, '#00ff64'], [47, '#ffc531'], [15, '#ff4d8d']].map(([v, c]) => (
                  <div key={v} className="text-center">
                    <Anel valor={v} cor={c} tam={84} />
                    <div className="hud-caps text-[9px] text-white/35 mt-2">score</div>
                  </div>
                ))}
              </div>
            </div>
          </Secao>

          <Secao rotulo="CONTROLES" titulo="Ações e entradas">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Botao className="px-5 py-2.5 text-sm"><Icon nome="raio" tam={15} />Ação primária</Botao>
                <Botao variante="vazio" className="px-5 py-2.5 text-sm"><Icon nome="download" tam={15} />Secundária</Botao>
                <Botao className="px-5 py-2.5 text-sm" disabled>Desabilitada</Botao>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Campo className="px-4 py-2.5 text-sm w-full" placeholder="Campo de texto" />
                <Campo className="px-4 py-2.5 text-sm w-full" placeholder="Outro campo" />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Etiqueta>padrão</Etiqueta>
                <Etiqueta cor="#00ff64">ativo</Etiqueta>
                <Etiqueta cor="#ffc531">atenção</Etiqueta>
                <Etiqueta cor="#ff4d8d">crítico</Etiqueta>
                <span className="flex items-center gap-2 text-[11px] text-white/50 ml-2">
                  <Pulso cor="#00ff64" /> em campo
                </span>
                <span className="flex items-center gap-2 text-[11px] text-white/35">
                  <Pulso ativo={false} /> em reserva
                </span>
              </div>
            </div>
          </Secao>

          <Secao rotulo="ESTATÍSTICA" titulo="Números do ecossistema">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Estatistica valor="128" rotulo="projetos nascidos" cor="#00ff64" icone={<Icon nome="foguete" tam={16} />} />
              <Estatistica valor="94" rotulo="planos gerados" cor="#00e5ff" icone={<Icon nome="documento" tam={16} />} />
              <Estatistica valor="31" rotulo="MVPs no ar" cor="#ffc531" icone={<Icon nome="cubo" tam={16} />} />
              <Estatistica valor="4.2k" rotulo="tCO2e medidas" cor="#a855f7" icone={<Icon nome="folha" tam={16} />} />
            </div>
          </Secao>

          <Secao rotulo="SEPARADOR" titulo="Divisor angular">
            <Divisor>SEÇÃO</Divisor>
          </Secao>
        </div>
      )}

      {aba === 'icones' && (
        <Secao rotulo="BIBLIOTECA" titulo={`${ICONES.length} glifos`}
          descricao="Grade de 24 por 24, forma cheia, herdando a cor do contexto. Clique para copiar o nome.">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2.5">
            {ICONES.map(n => (
              <button key={n} onClick={() => copiar(n)}
                className="hud-painel hud-p hud-vivo p-3 flex flex-col items-center gap-2 text-center">
                <Icon nome={n} tam={24} className="text-[#00e5ff]" />
                <span className="hud-tec text-[8.5px] text-white/40 break-all leading-tight">
                  {copiado === n ? 'copiado' : n}
                </span>
              </button>
            ))}
          </div>
        </Secao>
      )}

      {aba === 'cores' && (
        <Secao rotulo="PALETA" titulo="Cinco cores, cinco papéis"
          descricao="Cada cor carrega um significado fixo. Nenhuma é escolhida por gosto.">
          <div className="space-y-2.5">
            {CORES.map(([nome, hex, uso]) => (
              <Painel key={hex} cor={hex} className="p-4 flex items-center gap-4 flex-wrap">
                <span className="w-12 h-12 shrink-0 hud-corte" style={{ background: hex, '--c': '8px' }} />
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-bold text-sm">{nome}</div>
                  <div className="text-[12px] text-white/45 mt-0.5">{uso}</div>
                </div>
                <button onClick={() => copiar(hex)}
                  className="hud-tec text-xs shrink-0" style={{ color: hex }}>
                  {copiado === hex ? 'copiado' : hex}
                </button>
              </Painel>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}
