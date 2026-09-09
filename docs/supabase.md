# Supabase no ZoomDev OS

O Supabase fornece Postgres para produção, enquanto o Express continua responsável por IA, pagamentos, exports e regras de negócio. A service role fica somente no servidor.

## Configuração

1. Execute, em ordem, as migrations em `supabase/migrations/` no SQL Editor do projeto Supabase.
2. Copie `server/.env.example` para `server/.env`.
3. Preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env` ou nas variáveis do Railway/Render.
4. Reinicie a API e abra `/api/status`. A verificação **Supabase (Postgres)** deve mostrar conexão autenticada.

Projetos e conteúdo do Studio são lidos primeiro do Supabase; o JSON permanece como cópia de recuperação se houver falha de rede ou uma sincronização pendente. Não exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend, no Git ou em capturas de tela.

## RLS

A migration `202609090003_rls_zoomdev.sql` libera acesso direto apenas ao dono autenticado: perfil, projetos e conteúdo relacionado. O Express usa a service role somente no servidor, para regras de negócio, IA e a transição dos dados legados.

Após aplicar a migration, teste com duas contas: uma não deve conseguir ler nem alterar os projetos da outra.
