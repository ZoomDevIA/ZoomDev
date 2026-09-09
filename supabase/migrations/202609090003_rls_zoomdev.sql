-- Acesso direto pelo navegador: cada identidade do Supabase vê somente o seu
-- perfil, os seus projetos e o conteúdo ligado a esses projetos.
-- O backend usa service_role e continua funcionando durante a transição.

drop policy if exists "zoomdev_users_select_own" on public.zoomdev_users;
drop policy if exists "zoomdev_users_update_own" on public.zoomdev_users;
create policy "zoomdev_users_select_own" on public.zoomdev_users
  for select using (auth.uid() = auth_user_id);
create policy "zoomdev_users_update_own" on public.zoomdev_users
  for update using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

drop policy if exists "zoomdev_projects_own" on public.zoomdev_projects;
create policy "zoomdev_projects_own" on public.zoomdev_projects
  for all using (
    exists (
      select 1 from public.zoomdev_users u
      where u.id = zoomdev_projects.user_id and u.auth_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.zoomdev_users u
      where u.id = zoomdev_projects.user_id and u.auth_user_id = auth.uid()
    )
  );

drop policy if exists "zoomdev_project_content_own" on public.zoomdev_project_content;
create policy "zoomdev_project_content_own" on public.zoomdev_project_content
  for all using (
    exists (
      select 1
      from public.zoomdev_projects p
      join public.zoomdev_users u on u.id = p.user_id
      where p.id = zoomdev_project_content.project_id and u.auth_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.zoomdev_projects p
      join public.zoomdev_users u on u.id = p.user_id
      where p.id = zoomdev_project_content.project_id and u.auth_user_id = auth.uid()
    )
  );
