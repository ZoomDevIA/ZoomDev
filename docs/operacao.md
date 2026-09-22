# Operação e confiabilidade

## Verificação rápida

- `GET /api/health` é o health check mínimo para Railway, Render e monitores externos.
- `GET /api/status` mostra a situação de configuração; detalhes sensíveis só são retornados para administrador autenticado.
- No produto, abra **Administração → Operação** depois de confirmar a senha. A tela mostra uptime, incidentes das últimas 24 horas, backups e permite gerar uma cópia manual.

## Incidentes e auditoria

Erros internos recebem um código de referência. O código, horário, rota e uma mensagem higienizada são gravados no histórico operacional; corpos de requisição, senhas, tokens e chaves não são registrados.

As ações administrativas continuam na aba **Administração → Auditoria**, com autor, data e origem. Para espelhar as duas trilhas no Postgres, aplique a migration `supabase/migrations/202609210006_observabilidade.sql` no SQL Editor do Supabase.

## Backups

O processo cria uma cópia válida de `db.json` na partida e depois a cada 24 horas. São mantidas as sete mais recentes em `ZOOMDEV_DATA_DIR/backups`.

Isso exige volume persistente na hospedagem. No Railway, monte um Volume em `/app/data` e use `ZOOMDEV_DATA_DIR=/app/data`. O backup manual no painel serve antes de ações administrativas sensíveis; ele não substitui um backup externo periódico do projeto Supabase.

Para recuperar o JSON, pare a aplicação, substitua `db.json` por uma cópia de `backups/`, valide o JSON e inicie novamente. Para dados financeiros, o Supabase continua sendo a fonte adicional de recuperação após a migration de economia.
