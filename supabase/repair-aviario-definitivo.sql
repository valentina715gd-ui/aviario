-- Ejecuta todo este archivo en Supabase > SQL Editor > New > Run.
-- Soluciona el error de politicas de seguridad al guardar Personalizar aviario.
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

alter table public.aviarios enable row level security;
grant usage on schema public to authenticated;
grant select, insert, update on public.aviarios to authenticated;

drop policy if exists "Usuarios gestionan sus propios datos" on public.aviarios;
drop policy if exists "Usuarios gestionan su aviario" on public.aviarios;
drop policy if exists "Perfil propio: lectura" on public.aviarios;
drop policy if exists "Perfil propio: insertar" on public.aviarios;
drop policy if exists "Perfil propio: actualizar" on public.aviarios;
drop policy if exists "Catalogos publicos visibles" on public.aviarios;
drop policy if exists "Perfil owner select" on public.aviarios;
drop policy if exists "Perfil owner insert" on public.aviarios;
drop policy if exists "Perfil owner update" on public.aviarios;

create policy "Perfil owner select" on public.aviarios for select to authenticated using (user_id = auth.uid());
create policy "Perfil owner insert" on public.aviarios for insert to authenticated with check (user_id = auth.uid());
create policy "Perfil owner update" on public.aviarios for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Catalogos publicos visibles" on public.aviarios for select using (publicar_ventas = true);

drop function if exists public.guardar_aviario(text, text, text, boolean);
create or replace function public.guardar_aviario(
  p_nombre text,
  p_foto_url text default null,
  p_whatsapp text default null,
  p_publicar_ventas boolean default false
)
returns public.aviarios
language plpgsql
security definer
set search_path = public
as $$
declare resultado public.aviarios;
begin
  if auth.uid() is null then raise exception 'Usuario no autenticado'; end if;
  insert into public.aviarios (user_id, nombre, foto_url, whatsapp, publicar_ventas)
  values (auth.uid(), coalesce(nullif(trim(p_nombre), ''), 'Mi aviario'), p_foto_url, p_whatsapp, p_publicar_ventas)
  on conflict (user_id) do update set nombre = excluded.nombre, foto_url = excluded.foto_url, whatsapp = excluded.whatsapp, publicar_ventas = excluded.publicar_ventas, updated_at = now()
  returning * into resultado;
  return resultado;
end;
$$;

grant execute on function public.guardar_aviario(text, text, text, boolean) to authenticated;
notify pgrst, 'reload schema';
