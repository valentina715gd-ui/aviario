-- Ejecuta en Supabase SQL Editor si aparece row-level security al guardar aves.
-- Esta politica permite insertar, consultar, editar y borrar solo los registros del usuario activo.
alter table public.aves enable row level security;

drop policy if exists "Usuarios gestionan sus aves" on public.aves;
drop policy if exists "Usuarios gestionan sus propios datos" on public.aves;

create policy "Aves propias: lectura" on public.aves
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Aves propias: insertar" on public.aves
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Aves propias: actualizar" on public.aves
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Aves propias: borrar" on public.aves
for delete to authenticated
using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
