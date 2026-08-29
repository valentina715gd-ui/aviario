-- Ejecuta este archivo en Supabase > SQL Editor > New query > Run.
-- Corrige los permisos de aves y del perfil del aviario.
alter table public.aves enable row level security;
alter table public.aviarios enable row level security;

drop policy if exists "Usuarios gestionan sus propios datos" on public.aves;
drop policy if exists "Usuarios gestionan sus aves" on public.aves;
drop policy if exists "Aves propias: lectura" on public.aves;
drop policy if exists "Aves propias: insertar" on public.aves;
drop policy if exists "Aves propias: actualizar" on public.aves;
drop policy if exists "Aves propias: borrar" on public.aves;

drop policy if exists "Usuarios gestionan sus propios datos" on public.aviarios;
drop policy if exists "Usuarios gestionan su aviario" on public.aviarios;

create policy "Aves propias: lectura" on public.aves for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Aves propias: insertar" on public.aves for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Aves propias: actualizar" on public.aves for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Aves propias: borrar" on public.aves for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Perfil propio: lectura" on public.aviarios for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Perfil propio: insertar" on public.aviarios for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Perfil propio: actualizar" on public.aviarios for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Catalogos publicos visibles" on public.aviarios for select
using (publicar_ventas = true);

notify pgrst, 'reload schema';
