-- Reparacion final para poder guardar aves.
-- Ejecuta todo en Supabase > SQL Editor > New > Run.

alter table public.aves enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.aves to authenticated;

drop policy if exists "Usuarios gestionan sus propios datos" on public.aves;
drop policy if exists "Usuarios gestionan sus aves" on public.aves;
drop policy if exists "Aves propias: lectura" on public.aves;
drop policy if exists "Aves propias: insertar" on public.aves;
drop policy if exists "Aves propias: actualizar" on public.aves;
drop policy if exists "Aves propias: borrar" on public.aves;
drop policy if exists "Aves owner select" on public.aves;
drop policy if exists "Aves owner insert" on public.aves;
drop policy if exists "Aves owner update" on public.aves;
drop policy if exists "Aves owner delete" on public.aves;

create policy "Aves owner select" on public.aves
for select to authenticated
using (user_id = auth.uid());

create policy "Aves owner insert" on public.aves
for insert to authenticated
with check (user_id = auth.uid());

create policy "Aves owner update" on public.aves
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Aves owner delete" on public.aves
for delete to authenticated
using (user_id = auth.uid());

notify pgrst, 'reload schema';
