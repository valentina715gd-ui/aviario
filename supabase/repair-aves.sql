-- Ejecuta este archivo en Supabase > SQL Editor > New query > Run
-- Sirve para reparar una instalacion donde la tabla aves no se creo.
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
  portador_recesivo text not null default 'Desconocido' check (portador_recesivo in ('Sí', 'No', 'Desconocido')),
  gen_recesivo text,
  sexo text not null default 'indeterminado' check (sexo in ('macho', 'hembra', 'indeterminado')),
  fecha_nacimiento date,
  fecha_ingreso date,
  estado text not null default 'activa' check (estado in ('activa', 'vendida', 'fallecida')),
  madre_id uuid references public.aves(id) on delete set null,
  padre_id uuid references public.aves(id) on delete set null,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anillo_id)
);

alter table public.aves enable row level security;

create index if not exists aves_user_idx on public.aves(user_id);

-- Crea la politica solo si aun no existe.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'aves' and policyname = 'Usuarios gestionan sus propios datos') then
    create policy "Usuarios gestionan sus propios datos" on public.aves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Recarga la cache de tablas de PostgREST.
notify pgrst, 'reload schema';
