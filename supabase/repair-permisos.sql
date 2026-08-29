-- Ejecuta este archivo en Supabase > SQL Editor > New query > Run.
-- Corrige los permisos de aves y del perfil del aviario.
create extension if not exists pgcrypto;

create table if not exists public.aviarios (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null unique references auth.users(id) on delete cascade,
	nombre text not null default 'Mi aviario',
	foto_url text,
	whatsapp text,
	publicar_ventas boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

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
drop policy if exists "Perfil propio: lectura" on public.aviarios;
drop policy if exists "Perfil propio: insertar" on public.aviarios;
drop policy if exists "Perfil propio: actualizar" on public.aviarios;
drop policy if exists "Catalogos publicos visibles" on public.aviarios;

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
