// ═══════════════════════════════════════════════════════════════════════════
// ENVIO DE E-MAIL — o canal de saída da plataforma.
//
// Três modos, escolhidos pelo ambiente e nesta ordem:
//   RESEND   com RESEND_API_KEY, envia de verdade pela API HTTP
//   SMTP     com SMTP_URL, entrega por servidor próprio
//   REGISTRO sem nenhum dos dois, grava a mensagem no log e na fila em
//            memória, para que o desenvolvimento e o modo demo continuem
//            funcionando sem depender de provedor
//
// O modo REGISTRO é honesto sobre o que faz: quem chamar sabe pela resposta
// que a mensagem não saiu, e a rota de recuperação de senha usa esse retorno
// para decidir se pode mostrar o link na tela (só fora de produção).
// ═══════════════════════════════════════════════════════════════════════════
import { config } from '../config.js';

const REMETENTE = process.env.EMAIL_REMETENTE || 'ZoomDev OS <nao-responda@zoomdev.app>';
const CHAVE_RESEND = process.env.RESEND_API_KEY || '';
const SMTP_URL = process.env.SMTP_URL || '';

// Últimas mensagens do modo registro, para inspeção em desenvolvimento
const registro = [];

export function modoEmail() {
  if (CHAVE_RESEND) return 'resend';
  if (SMTP_URL) return 'smtp';
  return 'registro';
}

export function emailConfigurado() {
  return modoEmail() !== 'registro';
}

export function ultimasMensagens(limite = 20) {
  return registro.slice(0, limite);
}

async function enviarPorResend({ para, assunto, html, texto }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CHAVE_RESEND}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: REMETENTE, to: [para], subject: assunto, html, text: texto }),
  });
  if (!r.ok) {
    const detalhe = await r.text().catch(() => '');
    throw Object.assign(new Error(`Resend recusou o envio (${r.status}): ${detalhe.slice(0, 200)}`), { status: 502 });
  }
  return { entregue: true, modo: 'resend' };
}

async function enviarPorSmtp({ para, assunto, html, texto }) {
  // nodemailer é opcional: só é exigido de quem realmente configurou SMTP.
  let nodemailer;
  try {
    ({ default: nodemailer } = await import('nodemailer'));
  } catch {
    throw Object.assign(new Error('SMTP_URL definido mas o pacote nodemailer não está instalado.'), { status: 500 });
  }
  const transporte = nodemailer.createTransport(SMTP_URL);
  await transporte.sendMail({ from: REMETENTE, to: para, subject: assunto, html, text: texto });
  return { entregue: true, modo: 'smtp' };
}

/**
 * Envia uma mensagem. Nunca lança por falta de provedor: sem provedor, a
 * mensagem entra no registro e a resposta diz `entregue: false`.
 */
export async function enviar({ para, assunto, html, texto }) {
  const modo = modoEmail();
  const mensagem = { para, assunto, texto, em: new Date().toISOString(), modo };

  try {
    if (modo === 'resend') return { ...await enviarPorResend({ para, assunto, html, texto }), ...mensagem };
    if (modo === 'smtp') return { ...await enviarPorSmtp({ para, assunto, html, texto }), ...mensagem };
  } catch (e) {
    console.error('email: falha no envio', e.message);
    registro.unshift({ ...mensagem, erro: e.message });
    if (registro.length > 50) registro.length = 50;
    return { ...mensagem, entregue: false, erro: e.message };
  }

  registro.unshift(mensagem);
  if (registro.length > 50) registro.length = 50;
  console.log(`email [registro] para=${para} assunto="${assunto}"`);
  return { ...mensagem, entregue: false };
}

// ── Modelos ───────────────────────────────────────────────────────────────
// HTML de e-mail é território de cliente antigo: tabela, estilo em linha e
// nenhuma dependência de CSS externo.
function moldura(titulo, corpo, botao) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#04100a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04100a;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#06140d;border:1px solid rgba(0,229,255,.24)">
    <tr><td style="padding:28px 28px 0">
      <div style="font-size:11px;letter-spacing:.18em;color:#00e5ff;font-weight:700">ZOOMDEV OS</div>
      <h1 style="margin:12px 0 0;font-size:21px;line-height:1.25;color:#ffffff">${titulo}</h1>
    </td></tr>
    <tr><td style="padding:16px 28px 0;font-size:14px;line-height:1.65;color:#c7d8ce">${corpo}</td></tr>
    ${botao ? `<tr><td style="padding:24px 28px 0">
      <a href="${botao.url}" style="display:inline-block;background:#00ff64;color:#04140a;font-weight:700;font-size:14px;padding:13px 26px;text-decoration:none">${botao.texto}</a>
    </td></tr>` : ''}
    <tr><td style="padding:26px 28px 28px">
      <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:16px;font-size:11px;line-height:1.6;color:#7c8f84">
        Você recebeu esta mensagem porque existe uma conta na ZoomDev OS com este endereço.
        Se não foi você, ignore: nada muda sem que o link seja aberto.
      </div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export function modeloRecuperacao({ nome, url, minutos }) {
  return {
    assunto: 'Redefinir sua senha na ZoomDev OS',
    html: moldura(
      `Vamos redefinir sua senha, ${nome}`,
      `<p style="margin:0">Alguém pediu a redefinição da senha desta conta. O link abaixo vale por
       <b style="color:#fff">${minutos} minutos</b> e só pode ser usado uma vez.</p>
       <p style="margin:14px 0 0;font-size:12px;color:#7c8f84">Se o botão não abrir, copie este endereço:<br>
       <span style="color:#00e5ff;word-break:break-all">${url}</span></p>`,
      { url, texto: 'Definir nova senha' },
    ),
    texto: `Vamos redefinir sua senha, ${nome}.\n\nAbra o link a seguir dentro de ${minutos} minutos:\n${url}\n\nSe não foi você, ignore esta mensagem.`,
  };
}

export function modeloBoasVindas({ nome, url }) {
  return {
    assunto: 'Sua conta na ZoomDev OS está pronta',
    html: moldura(
      `Bem-vindo, ${nome}`,
      `<p style="margin:0">Sua conta foi criada e você já tem <b style="color:#00ff64">${config.credits.initial} de seiva</b>
       para gerar seu primeiro plano de negócios completo com os agentes.</p>
       <p style="margin:14px 0 0">Descreva sua ideia em uma frase na home e o resto acontece a partir dali.</p>`,
      { url, texto: 'Começar a construir' },
    ),
    texto: `Bem-vindo, ${nome}.\n\nSua conta na ZoomDev OS está pronta, com ${config.credits.initial} de seiva para o primeiro plano.\n\n${url}`,
  };
}

export function modeloSenhaAlterada({ nome, quando }) {
  return {
    assunto: 'Sua senha da ZoomDev OS foi alterada',
    html: moldura(
      'Sua senha foi alterada',
      `<p style="margin:0">${nome}, a senha desta conta foi alterada em <b style="color:#fff">${quando}</b>
       e todas as sessões abertas foram encerradas.</p>
       <p style="margin:14px 0 0;color:#ff9f43">Se não foi você, redefina a senha imediatamente e fale com o administrador.</p>`,
      null,
    ),
    texto: `${nome}, a senha da sua conta ZoomDev OS foi alterada em ${quando}. Se não foi você, redefina a senha imediatamente.`,
  };
}
