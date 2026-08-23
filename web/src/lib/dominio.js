// ── Papéis dos domínios, vistos do navegador ────────────────────────────────
// O mesmo pacote é servido em dois endereços com papéis diferentes:
//   zoomdev.io           o principal: vitrine pública (home, legais, passaporte)
//   www.zoomdev.app      o aplicativo (sessão, Google OAuth, tudo logado)
// (o zoomdev.com.br não chega aqui: o servidor o redireciona ao principal)
// Quando o SPA percebe que foi servido pela vitrine, todo ponto de entrada do
// app vira URL absoluta para o domínio canônico: sessão e origem registrada
// no Google só existem lá. Em qualquer outro host (o app, a Railway,
// localhost), os mesmos pontos seguem rotas internas do SPA.

export const APP_URL = 'https://www.zoomdev.app';

// O rascunho da ideia sobrevive ao cadastro via sessionStorage, que não
// atravessa domínios: quem parte da vitrine leva o rascunho na URL e o Login
// o replanta aqui do lado do app (a chave é a mesma que a Home lê).
export const CHAVE_RASCUNHO = 'zd_rascunho_ideia';

export function emVitrine() {
  // O .com.br fica na lista por segurança: se algum dia voltar a ser servido
  // em vez de redirecionado, os pontos de entrada continuam apontando certo.
  return typeof window !== 'undefined'
    && /(^|\.)(zoomdev\.io|zoomdev\.com\.br)$/.test(window.location.hostname);
}

export function urlDoApp(caminho) {
  return emVitrine() ? APP_URL + caminho : caminho;
}
