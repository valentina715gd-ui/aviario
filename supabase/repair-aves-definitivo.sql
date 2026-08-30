
-- SOLUCION DEFINITIVA PARA GUARDAR AVES
-- Ejecuta todo este archivo en Supabase > SQL Editor > New > Run.
create extension if not exists pgcrypto;

create table if not exists public.aves (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	nombre text not null,
	anillo_id text not null,
	en_venta boolean not null default false,
	precio_venta numeric(12,2),
	descripcion_publica text,
	foto_url text,
	especie text not null,
	mutacion text,
	portador_recesivo text not null default 'Desconocido',
	gen_recesivo text,
	sexo text not null default 'indeterminado',
	fecha_nacimiento date,
	fecha_ingreso date,
	estado text not null default 'activa',
	madre_id uuid references public.aves(id) on delete set null,
	padre_id uuid references public.aves(id) on delete set null,
	notas text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, anillo_id)
);

alter table public.aves enable row level security;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.aves to authenticated;

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

create policy "Aves owner select" on public.aves for select to authenticated
using (user_id = auth.uid());
create policy "Aves owner insert" on public.aves for insert to authenticated
with check (user_id = auth.uid());
create policy "Aves owner update" on public.aves for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Aves owner delete" on public.aves for delete to authenticated
using (user_id = auth.uid());

drop function if exists public.crear_ave(text, text, text, text, text, text, text, boolean);
create or replace function public.crear_ave(
	p_nombre text,
	p_anillo_id text,
	p_especie text,
	p_mutacion text default null,
	p_sexo text default 'indeterminado',
	p_portador_recesivo text default 'Desconocido',
	p_gen_recesivo text default null,
	p_en_venta boolean default false
)
returns public.aves
language plpgsql
security definer
set search_path = public
as $$
declare nueva_ave public.aves;
begin
	if auth.uid() is null then raise exception 'Usuario no autenticado'; end if;
	insert into public.aves (user_id, nombre, anillo_id, especie, mutacion, sexo, portador_recesivo, gen_recesivo, en_venta)
	values (auth.uid(), p_nombre, p_anillo_id, p_especie, p_mutacion, p_sexo, p_portador_recesivo, p_gen_recesivo, p_en_venta)
	returning * into nueva_ave;
	return nueva_ave;
end;
$$;

grant execute on function public.crear_ave(text, text, text, text, text, text, text, boolean) to authenticated;
notify pgrst, 'reload schema';
