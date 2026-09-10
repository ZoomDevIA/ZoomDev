-- Arquivos originais do Studio. O bucket é privado: o caminho começa pelo
-- id do projeto e as policies confirmam que o projeto pertence ao auth.uid().
insert into storage.buckets (id, name, public, file_size_limit)
values ('zoomdev-anexos', 'zoomdev-anexos', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

drop policy if exists "zoomdev_anexos_select_own" on storage.objects;
drop policy if exists "zoomdev_anexos_insert_own" on storage.objects;
drop policy if exists "zoomdev_anexos_update_own" on storage.objects;
drop policy if exists "zoomdev_anexos_delete_own" on storage.objects;

create policy "zoomdev_anexos_select_own" on storage.objects for select to authenticated
using (
  bucket_id = 'zoomdev-anexos' and exists (
    select 1 from public.zoomdev_projects p
    join public.zoomdev_users u on u.id = p.user_id
    where p.id = (storage.foldername(name))[1] and u.auth_user_id = auth.uid()
  )
);

create policy "zoomdev_anexos_insert_own" on storage.objects for insert to authenticated
with check (
  bucket_id = 'zoomdev-anexos' and exists (
    select 1 from public.zoomdev_projects p
    join public.zoomdev_users u on u.id = p.user_id
    where p.id = (storage.foldername(name))[1] and u.auth_user_id = auth.uid()
  )
);

create policy "zoomdev_anexos_update_own" on storage.objects for update to authenticated
using (
  bucket_id = 'zoomdev-anexos' and exists (
    select 1 from public.zoomdev_projects p join public.zoomdev_users u on u.id = p.user_id
    where p.id = (storage.foldername(name))[1] and u.auth_user_id = auth.uid()
  )
) with check (
  bucket_id = 'zoomdev-anexos' and exists (
    select 1 from public.zoomdev_projects p join public.zoomdev_users u on u.id = p.user_id
    where p.id = (storage.foldername(name))[1] and u.auth_user_id = auth.uid()
  )
);

create policy "zoomdev_anexos_delete_own" on storage.objects for delete to authenticated
using (
  bucket_id = 'zoomdev-anexos' and exists (
    select 1 from public.zoomdev_projects p join public.zoomdev_users u on u.id = p.user_id
    where p.id = (storage.foldername(name))[1] and u.auth_user_id = auth.uid()
  )
);
