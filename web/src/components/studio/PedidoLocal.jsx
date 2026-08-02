import React, { useState } from 'react';
import Icon from '../Icon.jsx';
import { Botao, Painel, Rotulo } from '../hud/index.jsx';
import { api } from '../../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// PEDIDO DE LOCALIZAÇÃO
//
// O território muda o plano de verdade: frete, cadeia de fornecedores,
// incentivo estadual, edital regional, poder de compra, bioma. Um plano
// escrito como se o negócio flutuasse no Brasil médio é um plano genérico.
//
// Três decisões de privacidade que valem ser ditas em voz alta:
//
//  · O pedido aparece ONDE É USADO, na hora de gerar o plano, e não como um
//    pop-up na primeira visita. Permissão pedida fora de contexto é negada.
//  · A cidade digitada é o que realmente alimenta a pesquisa. A coordenada do
//    navegador é opcional e chega arredondada: dá a região, não o endereço.
//  · "Prefiro não informar" é gravado. Quem recusou uma vez não é perguntado
//    de novo, e o plano sai igual, só sem o recorte regional.
// ═══════════════════════════════════════════════════════════════════════════

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function PedidoLocal({ onPronto }) {
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [coordenada, setCoordenada] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const usarNavegador = () => {
    if (!navigator.geolocation) {
      setErro('Este navegador não oferece localização. Digite a cidade abaixo.');
      return;
    }
    setBuscando(true); setErro(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Arredondado já aqui: a precisão fina nem sai do aparelho.
        setCoordenada({
          lat: Math.round(pos.coords.latitude * 10) / 10,
          lon: Math.round(pos.coords.longitude * 10) / 10,
        });
        setBuscando(false);
      },
      (e) => {
        const mensagens = {
          1: 'Você negou o acesso à localização. Sem problema: digite a cidade abaixo.',
          2: 'Não consegui determinar a posição agora. Digite a cidade abaixo.',
          3: 'A localização demorou demais. Digite a cidade abaixo.',
        };
        setErro(mensagens[e.code] || 'Não consegui obter a localização.');
        setBuscando(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  };

  const confirmar = async () => {
    setSalvando(true); setErro(null);
    try {
      await api.salvarLocal({ cidade: cidade.trim(), uf, pais: 'Brasil', ...(coordenada || {}) });
      onPronto?.();
    } catch (e) { setErro(e.message); setSalvando(false); }
  };

  const recusar = async () => {
    setSalvando(true);
    try { await api.salvarLocal({ recusado: true }); } catch { /* segue mesmo assim */ }
    onPronto?.();
  };

  const podeConfirmar = cidade.trim().length >= 2 || coordenada;

  return (
    <Painel cor="#a855f7" tamanho="p" className="p-4 text-left">
      <Rotulo cor="#a855f7">antes de escrever, uma pergunta</Rotulo>
      <h4 className="font-heading font-bold text-[13.5px] mt-2">Onde o negócio vai operar?</h4>
      <p className="text-[11.5px] text-white/50 leading-relaxed mt-1.5">
        O território muda o plano: fornecedor, frete, incentivo estadual, edital regional e bioma.
        Os agentes pesquisam a sua região em vez do Brasil em geral.
      </p>

      <div className="flex gap-2 mt-3">
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Cidade"
          className="hud-campo flex-1 px-2.5 py-1.5 text-[12.5px]"
        />
        <select value={uf} onChange={(e) => setUf(e.target.value)}
          aria-label="Estado" className="hud-campo px-2 py-1.5 text-[12.5px] w-[74px]">
          <option value="">UF</option>
          {UFS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <button type="button" onClick={usarNavegador} disabled={buscando}
        className="mt-2 text-[11px] text-white/45 hover:text-[#a855f7] transition-colors flex items-center gap-1.5">
        {buscando
          ? <><Icon nome="atualizar" tam={12} className="animate-spin" /> pedindo permissão…</>
          : coordenada
            ? <><Icon nome="check" tam={12} className="text-[#00ff64]" /> região capturada ({coordenada.lat}, {coordenada.lon})</>
            : <><Icon nome="mapa" tam={12} /> usar a localização do aparelho</>}
      </button>

      {erro && <p className="text-[11px] text-[#ffc531] mt-2">{erro}</p>}

      <div className="flex items-center gap-2 mt-3.5">
        <Botao onClick={confirmar} disabled={!podeConfirmar || salvando} className="px-3.5 py-1.5 text-[11px]">
          {salvando ? <Icon nome="atualizar" tam={12} className="animate-spin" />
                    : <><Icon nome="check" tam={12} /> Confirmar</>}
        </Botao>
        <button type="button" onClick={recusar} disabled={salvando}
          className="text-[11px] text-white/35 hover:text-white/70 transition-colors px-2 py-1.5">
          Prefiro não informar
        </button>
      </div>

      <p className="hud-tec text-[8.5px] text-white/22 mt-3 leading-relaxed">
        A coordenada é gravada com uma casa decimal, o suficiente para a região e insuficiente para o endereço.
        Você pode trocar ou apagar isso em Configurações a qualquer momento.
      </p>
    </Painel>
  );
}
