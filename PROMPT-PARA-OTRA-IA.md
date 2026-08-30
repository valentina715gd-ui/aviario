# Prompt completo para continuar Aviarii

Actua como ingeniero senior de React, Vite, TailwindCSS, Supabase y PWA. Trabaja sobre el repositorio `valentina715gd-ui/aviario`, una aplicacion web mobile-first para administrar un aviario de aves ornamentales y exoticas.

## Objetivo

La app debe permitir que cada usuario cree una cuenta con email y contrasena, vea solo sus propios datos y gestione aves, genetica, reproduccion, alimentacion, gastos, ingresos por ventas, tareas y un catalogo publico opcional.

## Stack obligatorio

- React + Vite
- TailwindCSS
- Supabase Postgres, Auth y Storage
- Vercel para despliegue
- PWA con manifest y service worker
- No introducir servicios de pago ni secretos en el frontend

## Reglas de seguridad

- Cada registro debe tener `user_id = auth.uid()`.
- Mantener RLS habilitado.
- Nunca usar `service_role` en el navegador.
- Las funciones RPC deben ser `security definer`, tener `set search_path = public`, validar `auth.uid() is not null` y conceder ejecucion solo a `authenticated`.
- Fotos en Storage deben guardarse dentro de una carpeta con el UUID del usuario.
- No mostrar datos demo ni datos de otro usuario.

## Funciones existentes

- Login y registro con Supabase Auth.
- Confirmacion de correo con retorno a la URL de la aplicacion.
- Dashboard mobile-first.
- Aves con nombre, anillo, especie, mutacion, sexo y genetica recesiva.
- Seleccion de foto desde camara o galeria.
- Catalogo publico opcional y consulta por WhatsApp.
- Personalizacion del aviario: nombre, foto, WhatsApp y publicar ventas.
- Calculadora de eclosion por fecha del huevo y dias de incubacion.
- PWA instalable.

## Problemas que debes resolver

1. El registro de aves debe guardar siempre mediante una RPC segura y no fallar por RLS.
2. Personalizar aviario debe guardar mediante otra RPC segura.
3. Debe existir un unico SQL idempotente de instalacion que cree tablas, columnas, indices, funciones, grants, politicas RLS y buckets.
4. Crear ave debe permitir elegir foto, previsualizarla, guardar el ave, subir la foto y actualizar `foto_url`.
5. Una ave creada debe poder editarse y eliminarse, siempre validando que pertenezca al usuario.
6. Finanzas debe separar ingresos por venta y egresos.
7. Reproduccion debe registrar parejas, puestas, huevos, crias y fecha estimada de nacimiento.
8. El dashboard debe consultar datos reales y mostrar estados vacios, nunca numeros inventados.
9. El catalogo publico debe mostrar solo aviarios con `publicar_ventas = true` y aves activas con `en_venta = true`.
10. La configuracion debe explicar errores en espanol simple, sin mostrar terminos como RLS, JWT o `TU_ID` a usuarios comunes.

## UX

- Mobile-first.
- Botones visibles y accesibles.
- Formularios cortos.
- Modal con scroll y boton guardar siempre visible.
- Saludo segun la hora local.
- Mensajes de confirmacion claros.
- Estados vacios utiles.
- No borrar datos existentes sin confirmacion.

## Archivos importantes

- `src/App.jsx`
- `src/lib/supabase.js`
- `src/index.css`
- `supabase/schema.sql`
- `supabase/repair-aves-definitivo.sql`
- `supabase/repair-aviario-definitivo.sql`
- `supabase/repair-storage.sql`
- `public/manifest.webmanifest`
- `public/sw.js`

## Validacion obligatoria

Antes de terminar:

```bash
npm install
npm run build
```

Probar manualmente:

1. Crear cuenta.
2. Confirmar correo.
3. Iniciar sesion.
4. Recargar la pagina.
5. Crear ave sin foto.
6. Crear ave con foto.
7. Editar ave.
8. Eliminar ave.
9. Guardar perfil del aviario.
10. Activar catalogo.
11. Abrir catalogo en ventana anonima.
12. Confirmar que no aparecen datos de otros usuarios.

Explica todos los cambios en espanol sencillo y no inventes resultados de pruebas.
