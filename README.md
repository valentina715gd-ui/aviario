# Aviarii

PWA mobile-first para gestionar un aviario de aves ornamentales y exoticas.

## Requisitos

- Node.js 18 o superior
- Cuenta gratuita de Supabase (opcional para empezar en modo demo)

## Ejecutar

```bash
npm install
npm run dev
```

Luego abre la URL que indique Vite, normalmente `http://localhost:5173`.

## Conectar Supabase

1. Copia `.env.example` como `.env`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. En el SQL Editor de Supabase ejecuta `supabase/schema.sql`.
4. La app puede usar `src/lib/supabase.js` para autenticacion y consultas.

Si al guardar una ave o personalizar el aviario aparece un error de permisos, ejecuta `supabase/repair-permisos.sql` en el SQL Editor. Si aparece `Could not find the table public.aves`, ejecuta `supabase/repair-aves.sql`. Si aparece `Bucket not found`, ejecuta `supabase/repair-storage.sql`. Luego recarga la aplicación.

La pantalla de acceso permite `Iniciar sesion` y `Crear una cuenta`. Supabase Auth identifica al usuario y las politicas RLS hacen que cada cuenta consulte unicamente sus propios registros. Para un proyecto ya creado con el SQL anterior, ejecuta tambien:

```sql
alter table public.aves add column if not exists nombre text not null default 'Sin nombre';
alter table public.aves add column if not exists portador_recesivo text not null default 'Desconocido';
alter table public.aves add column if not exists gen_recesivo text;
```

La interfaz incluye datos de demostracion para revisar el flujo antes de conectar la base de datos. El archivo `public/manifest.webmanifest` y `public/sw.js` habilitan la instalacion como PWA.

## Finanzas y reproduccion

- `Finanzas` separa ingresos por venta de aves y egresos del aviario.
- `Cria` calcula una fecha estimada sumando los dias de incubacion a la fecha del primer huevo.
- La guia incluye cuidados basicos y sugerencias de compatibilidad; son orientativas y no reemplazan asesoramiento veterinario o genetico.

## Publicar gratis e instalar como app

1. Crea un repositorio en GitHub y sube esta carpeta.
2. En Vercel, importa el repositorio y usa los valores por defecto: Vite detectara el proyecto. En `Environment Variables`, agrega las dos variables de `.env.example` cuando conectes Supabase.
3. Abre la URL HTTPS de Vercel desde el celular. En Android usa el menu del navegador y elige `Instalar aplicacion` o `Agregar a pantalla de inicio`. En iPhone usa `Compartir` y `Agregar a pantalla de inicio`.
4. En PC, abre la URL en Chrome o Edge y pulsa el icono de instalacion en la barra de direcciones.

Vercel y Supabase tienen planes gratuitos, pero pueden aplicar limites de uso. La PWA no necesita Play Store ni App Store.
