# Migrar la app a tu propio Supabase (recomendado)

> El proyecto actual (`hvhlbfoffzxulyvwosuv`) lo creó y administra **Lovable Cloud**;
> por eso no aparece en tu dashboard ni puedes cambiar su configuración. Con este
> guion queda bajo tu control: confirmación de correo, Google OAuth y SMTP.

## Paso 1 — Crear el proyecto (3 min, gratis)

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Nombre: `consultorio-vigilancia` · Contraseña: una fuerte y **guárdala en un gestor de contraseñas**.
3. Región: la más cercana (p. ej. `US East (N. Virginia)` si no hay Suramérica).
4. **Save** y espera 1-2 min a que esté listo.

## Paso 2 — Correr el esquema

1. En el nuevo proyecto: **SQL Editor → New query**.
2. Pega TODO el contenido de:
   `lovable-juridico/supabase/schema-consolidado.sql`
   (ya está consolidado: tablas, RLS, trigger de perfil y permisos).
3. **Run** → debe decir *Success. No results returned*.

## Paso 3 — Quitar la confirmación de correo (opción A)

**Authentication → Sign In → Providers → Email** → apaga **"Confirm email"** → **Save**.

Con esto el registro inicia sesión al instante y el panel funciona sin correos.

## Paso 4 — Enviarme las credenciales del nuevo proyecto

Desde **Settings → API** del nuevo proyecto, cópia y pégame aquí:

- **Project URL** (p. ej. `https://xxxxxxxx.supabase.co`)
- **anon / publishable key** (`sb_publishable_…` o `eyJhbGci…`)

> Esas dos son de **uso público** (diseñadas para ir en el frontend), así que puedes
> pegarlas sin riesgo. Yo actualizo `lovable-juridico/.env` (las 6 variables),
> reinicio la app y verifico que el registro + login funcionan de punta a punta.

## Paso 5 (opcional, cuando quieras) — Google OAuth

Una vez el proyecto es tuyo, en **Authentication → Sign In → Providers → Google**:
pegamos el Client ID + Client Secret (los de Google Cloud Console) y en
**URL Configuration → Additional Redirect URLs** añadimos `http://localhost:9501/**`.
Con el PAT que ahora sí puedes generar, yo lo configuro y lo verifico.

## Notas

- Los **usuarios y procesos actuales** quedan en el proyecto de Lovable; el nuevo
  arranca limpio (para desarrollo es ideal). Si luego quieres traer datos, exporta
  desde el proyecto viejo (necesita que Lovable te dé acceso) o cárgalos de nuevo.
- El `.env` del proyecto viejo queda como respaldo en `lovable-juridico/.env` —
  no lo borres hasta que el nuevo esté verificado.
- Para producción, deja **Confirm email activo** y configura **SMTP** real
  (Authentication → SMTP) con tu dominio.
