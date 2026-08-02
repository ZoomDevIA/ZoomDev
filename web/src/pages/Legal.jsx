import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLockup from '../components/BrandLockup.jsx';
import Icon from '../components/Icon.jsx';
import { Painel, Rotulo } from '../components/hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// TERMOS E PRIVACIDADE — páginas públicas, uma rota cada.
//
// Escritas para serem lidas, não para atravessar. Cada afirmação descreve o
// que o sistema realmente faz: se o texto e o código discordarem, o texto está
// errado e precisa mudar junto com a versão.
// ═══════════════════════════════════════════════════════════════════════════

export const VERSAO = '2026-08-01';

const TERMOS = [
  ['O que a ZoomDev OS é', [
    'Uma plataforma que ajuda quem tem uma ideia a transformá-la em negócio: estrutura o plano, constrói um MVP navegável, encontra editais de fomento compatíveis e mede o impacto ambiental do projeto.',
    'O trabalho é feito por agentes de inteligência artificial. O resultado é um ponto de partida qualificado, não uma consultoria assinada por profissional habilitado.',
  ]],
  ['O que você mantém', [
    'A ideia é sua. O plano, o MVP e os documentos gerados a partir dela também são seus, para usar como quiser, inclusive comercialmente.',
    'Publicar um projeto na vitrine da comunidade é ato voluntário e reversível: você liga e desliga quando quiser, na página do projeto.',
  ]],
  ['Sobre os números gerados', [
    'Toda estimativa carrega um selo de evidência que diz de onde ela veio: laudo, campo, pesquisa, estratégia ou hipótese. Estimativa nunca é apresentada como medição.',
    'Cálculos de carbono seguem o GHG Protocol e declaram a faixa de incerteza. Não substituem inventário verificado por auditor credenciado, e a plataforma diz isso em cada resultado.',
    'Comunicamos sempre "emissões compensadas com créditos verificados", nunca "carbono neutro" genérico.',
  ]],
  ['Créditos e planos', [
    'A seiva é o crédito interno que paga a geração de plano e a construção de MVP. Quando a IA falha no meio de uma geração, a seiva é estornada automaticamente.',
    'Planos pagos são cobrados por assinatura mensal e podem ser cancelados a qualquer momento, com acesso até o fim do período já pago.',
  ]],
  ['O que não é permitido', [
    'Usar a plataforma para gerar conteúdo que viole a lei, direitos de terceiros ou a dignidade de alguém.',
    'Tentar contornar os limites técnicos, extrair a base de dados ou automatizar acesso sem autorização.',
    'Publicar na vitrine projeto que não é seu, ou conteúdo que exponha dados pessoais de terceiros.',
  ]],
  ['Encerramento', [
    'Você pode excluir sua conta a qualquer momento em Configurações, sem falar com ninguém.',
    'Podemos encerrar uma conta que descumpra estes termos, avisando por e-mail e permitindo a exportação dos dados antes.',
  ]],
];

const PRIVACIDADE = [
  ['Quais dados coletamos', [
    'De cadastro: nome, e-mail e senha. A senha é guardada como hash scrypt com sal único, nunca em texto claro, e nem o administrador consegue lê-la.',
    'Do uso: os projetos que você cria, os planos gerados, os cálculos de carbono, as conversas com os agentes e os registros de acesso (data, hora e endereço IP).',
    'De pagamento: identificador da transação e situação. Dados de cartão nunca passam pela ZoomDev, ficam com o processador.',
  ]],
  ['Para que usamos', [
    'Para operar a plataforma: gerar seu plano, encontrar seus editais, calcular seu carbono, manter sua sessão aberta.',
    'Para segurança: detectar abuso, limitar tentativas de força bruta e manter a trilha de auditoria das ações administrativas.',
    'Não vendemos dados. Não usamos seu conteúdo para treinar modelos.',
  ]],
  ['Com quem compartilhamos', [
    'Com a Anthropic, que processa o texto enviado aos agentes para gerar as respostas.',
    'Com o processador de pagamento, quando você assina um plano.',
    'Com o provedor de e-mail, para enviar recuperação de senha e avisos de conta.',
    'Com mais ninguém, salvo ordem judicial.',
  ]],
  ['Seus direitos (LGPD, artigo 18)', [
    'Acessar e exportar tudo o que temos sobre você, em JSON legível, na página de Configurações.',
    'Corrigir seus dados de perfil, na mesma página.',
    'Excluir sua conta. A exclusão anonimiza o registro: nome, e-mail e senha são apagados. Projetos privados vão junto; um projeto que você publicou na vitrine permanece, mas sem qualquer vínculo com você (a escolha de removê-lo também é sua, na hora da exclusão).',
    'Transações financeiras permanecem sem identificação, porque têm prazo de guarda próprio na legislação fiscal.',
  ]],
  ['Por quanto tempo guardamos', [
    'Enquanto sua conta existir. Depois da exclusão, o que resta já não identifica você.',
    'Registros de auditoria administrativa: as 500 ações mais recentes.',
    'Cópias de segurança do banco: sete dias.',
  ]],
  ['Contato', [
    'Para exercer qualquer direito ou tirar dúvida sobre este documento, fale com o administrador da plataforma pelo canal de suporte da sua conta.',
  ]],
];

export default function Legal() {
  const { pathname } = useLocation();
  const ehPrivacidade = pathname.includes('privacidade');
  const secoes = ehPrivacidade ? PRIVACIDADE : TERMOS;

  return (
    <div className="min-h-screen zd-bg zd-circuit-bg hud-grade hud-scan">
      <header className="border-b border-[#00e5ff1f]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/"><BrandLockup symbolSize={32} wordmarkHeight={25} /></Link>
          <div className="flex gap-1.5">
            <Link to="/termos"
              className={`hud-aba hud-caps px-3 py-1.5 text-[10px] ${!ehPrivacidade ? 'ativa' : ''}`}>Termos</Link>
            <Link to="/privacidade"
              className={`hud-aba hud-caps px-3 py-1.5 text-[10px] ${ehPrivacidade ? 'ativa' : ''}`}>Privacidade</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 md:py-14 relative z-10">
        <Rotulo>{ehPrivacidade ? 'POLÍTICA DE PRIVACIDADE' : 'TERMOS DE USO'}</Rotulo>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mt-2.5">
          {ehPrivacidade ? 'Como tratamos seus dados' : 'As regras da plataforma'}
        </h1>
        <p className="text-white/45 text-sm mt-2">
          Versão {VERSAO}. Escrito para ser lido: cada afirmação descreve o que o sistema faz de fato.
        </p>

        <div className="space-y-4 mt-8">
          {secoes.map(([titulo, itens], i) => (
            <Painel key={titulo} className="p-5">
              <div className="flex items-baseline gap-3">
                <span className="hud-tec text-[#00e5ff] text-xs shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="font-heading font-bold text-[15px]">{titulo}</h2>
              </div>
              <ul className="mt-3 space-y-2.5">
                {itens.map((texto, j) => (
                  <li key={j} className="text-[13px] text-white/65 leading-relaxed flex gap-2.5">
                    <span className="text-[#00e5ff] shrink-0 mt-1">▸</span>{texto}
                  </li>
                ))}
              </ul>
            </Painel>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="hud-botao-vazio px-5 py-2.5 text-sm inline-flex items-center gap-2">
            <Icon nome="home" tam={14} /> voltar para a plataforma
          </Link>
        </div>
      </main>
    </div>
  );
}
