# Publicação da ZoomDev

## Antes do deploy

1. Aplique todas as migrations em `supabase/migrations/`.
2. Confirme em `/api/status` que **Supabase (Postgres)** está `ok`.
3. Faça o build local com `npm run build`.
4. Envie o código para o repositório privado da ZoomDev. Arquivos `.env` nunca entram no Git.

## Railway

Crie um projeto a partir do repositório e mantenha o `Dockerfile` da raiz. Em
**Variables**, defina:

| Variável | Onde é usada |
| --- | --- |
| `SUPABASE_URL` | servidor, conexão com Postgres/Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor somente; segredo |
| `ZOOMDEV_URL` | URL pública final, sem barra no fim |
| `ZOOMDEV_ORIGENS` | mesma URL pública; origens extras separadas por vírgula |
| `ANTHROPIC_API_KEY` | opcional, para IA real |
| `ZOOMDEV_ADMIN_EMAIL` | e-mail do administrador |

Como o Vite incorpora variáveis `VITE_*` durante o build, cadastre também em
**Build Variables** (são públicas, mas não devem usar a service role):

| Variável | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL do Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key do Supabase |

Em **Volumes**, monte um volume em `/app/data`. O Supabase é a persistência
principal, e o volume mantém a cópia de recuperação JSON enquanto a transição
não termina.

## Domínio e Auth

Após gerar ou apontar o domínio no Railway:

1. Defina `ZOOMDEV_URL=https://seu-dominio` e faça novo deploy.
2. Em Supabase → Authentication → Configuração de URL, coloque o domínio em
   **Site URL** e adicione `https://seu-dominio/entrar` nas Redirect URLs.
3. Em Google Cloud, acrescente `https://seu-dominio` nas origens JavaScript
   autorizadas. O callback do Supabase continua o mesmo `/auth/v1/callback`.
4. Em GitHub OAuth (quando habilitar), use o callback mostrado pelo provider
   do Supabase e atualize a Homepage URL para o domínio público.

Valide em janela anônima: cadastro por e-mail, Google, criação de projeto,
abertura do Studio e recarregamento da página.
