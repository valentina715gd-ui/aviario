create extension if not exists pgcrypto;

create table public.aviarios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  nombre text not null default 'Mi aviario', foto_url text, whatsapp text, publicar_ventas boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.aves (
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
  cria_id uuid,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anillo_id)
);

create table public.parejas (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  macho_id uuid not null references public.aves(id) on delete restrict, hembra_id uuid not null references public.aves(id) on delete restrict,
  fecha_inicio date not null default current_date, fecha_fin date, estado text not null default 'activa' check (estado in ('activa', 'inactiva')),
  ubicacion text, notas text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (macho_id <> hembra_id)
);

create unique index parejas_activas_unicas on public.parejas (user_id, macho_id, hembra_id) where estado = 'activa';

create table public.puestas (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  pareja_id uuid not null references public.parejas(id) on delete cascade, fecha_puesta date not null default current_date,
  fecha_primer_huevo date, dias_incubacion integer not null default 14 check (dias_incubacion > 0),
  cantidad_huevos integer not null default 0 check (cantidad_huevos >= 0), fecha_estimada_eclosion date,
  estado text not null default 'en_curso' check (estado in ('en_curso', 'finalizada', 'perdida')), notas text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.huevos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  puesta_id uuid not null references public.puestas(id) on delete cascade, numero integer not null check (numero > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'fertil', 'no_fertil', 'eclosionado', 'perdido')),
  fecha_eclosion date, notas text, created_at timestamptz not null default now(), unique (puesta_id, numero)
);

create table public.crias (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  puesta_id uuid references public.puestas(id) on delete set null, pareja_id uuid references public.parejas(id) on delete set null,
  madre_id uuid references public.aves(id) on delete set null, padre_id uuid references public.aves(id) on delete set null,
  fecha_nacimiento date not null, cantidad integer not null default 1 check (cantidad > 0), notas text,
  created_at timestamptz not null default now()
);

alter table public.aves add constraint aves_cria_fk foreign key (cria_id) references public.crias(id) on delete set null;

create table public.tratamientos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  ave_id uuid not null references public.aves(id) on delete cascade, fecha_inicio date not null default current_date, fecha_fin date,
  tipo text not null, producto text, dosis text, frecuencia text, motivo text, veterinario text,
  estado text not null default 'activo' check (estado in ('activo', 'finalizado', 'cancelado')), notas text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.alimentos_stock (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null, categoria text not null default 'alimento', unidad text not null default 'kg', cantidad_actual numeric(12,2) not null default 0 check (cantidad_actual >= 0),
  stock_minimo numeric(12,2) not null default 0 check (stock_minimo >= 0), ubicacion text, activo boolean not null default true, notas text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.compras (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  alimento_id uuid references public.alimentos_stock(id) on delete set null, producto text not null, cantidad numeric(12,2) not null check (cantidad > 0),
  unidad text not null default 'kg', precio numeric(12,2) not null default 0 check (precio >= 0), fecha date not null default current_date, proveedor text, notas text,
  created_at timestamptz not null default now()
);

create table public.gastos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'otros', descripcion text not null, importe numeric(12,2) not null check (importe >= 0), fecha date not null default current_date,
  proveedor text, comprobante_url text, notas text, created_at timestamptz not null default now()
);

create table public.ingresos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  ave_id uuid references public.aves(id) on delete set null, descripcion text not null, importe numeric(12,2) not null check (importe >= 0),
  fecha date not null default current_date, comprador text, metodo_pago text, notas text, created_at timestamptz not null default now()
);

create table public.recordatorios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null, descripcion text, fecha_vencimiento date not null, prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completado', 'cancelado')), ave_id uuid references public.aves(id) on delete set null,
  pareja_id uuid references public.parejas(id) on delete set null, puesta_id uuid references public.puestas(id) on delete set null,
  tratamiento_id uuid references public.tratamientos(id) on delete set null, completado_at timestamptz, created_at timestamptz not null default now()
);

create index aves_user_idx on public.aves(user_id);
create index recordatorios_fecha_idx on public.recordatorios(user_id, fecha_vencimiento);
create index gastos_fecha_idx on public.gastos(user_id, fecha);
create index ingresos_fecha_idx on public.ingresos(user_id, fecha);
create index puestas_estado_idx on public.puestas(user_id, estado);

alter table public.aves enable row level security;
alter table public.aviarios enable row level security;
alter table public.parejas enable row level security;
alter table public.puestas enable row level security;
alter table public.huevos enable row level security;
alter table public.crias enable row level security;
alter table public.tratamientos enable row level security;
alter table public.alimentos_stock enable row level security;
alter table public.compras enable row level security;
alter table public.gastos enable row level security;
alter table public.ingresos enable row level security;
alter table public.recordatorios enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['aves','aviarios','parejas','puestas','huevos','crias','tratamientos','alimentos_stock','compras','gastos','ingresos','recordatorios'] loop
    execute format('create policy "Usuarios gestionan sus propios datos" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
  end loop;
end $$;

create policy "Catalogos publicos visibles" on public.aviarios for select using (publicar_ventas = true);
create policy "Aves publicadas visibles" on public.aves for select using (
  en_venta = true and exists (select 1 from public.aviarios where aviarios.user_id = aves.user_id and aviarios.publicar_ventas = true)
);

insert into storage.buckets (id, name, public) values ('fotos-aves', 'fotos-aves', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false) on conflict (id) do nothing;

create policy "Usuarios pueden subir fotos" on storage.objects for insert to authenticated with check (bucket_id = 'fotos-aves' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Fotos visibles para usuarios autenticados" on storage.objects for select to authenticated using (bucket_id = 'fotos-aves' and (storage.foldername(name))[1] = auth.uid()::text);
