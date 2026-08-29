-- Ejecuta en Supabase > SQL Editor > New query > Run
-- Crea el almacenamiento para fotos del aviario y de las aves.
insert into storage.buckets (id, name, public)
values ('fotos-aves', 'fotos-aves', true)
on conflict (id) do update set public = true;

drop policy if exists "Usuarios pueden subir fotos" on storage.objects;
drop policy if exists "Fotos visibles para usuarios autenticados" on storage.objects;
drop policy if exists "Usuarios pueden actualizar fotos" on storage.objects;
drop policy if exists "Usuarios pueden borrar fotos" on storage.objects;

create policy "Usuarios pueden subir fotos" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'fotos-aves'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Fotos visibles para usuarios autenticados" on storage.objects
for select to authenticated
using (
  bucket_id = 'fotos-aves'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Usuarios pueden actualizar fotos" on storage.objects
for update to authenticated
using (
  bucket_id = 'fotos-aves'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'fotos-aves'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Usuarios pueden borrar fotos" on storage.objects
for delete to authenticated
using (
  bucket_id = 'fotos-aves'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
