# 🚀 Despliegue en línea (Render — plan gratuito real)

El portal base (FastAPI + web + pagos) se publica con **Render**: web service +
**PostgreSQL gratis (1 GB, expira a los 30 días)**, sin tarjeta de crédito.
Las apps Next.js/Vigilancia tienen sus propios despliegues (Vercel / Lovable Cloud).

## Pasos (≈10 minutos)

1. Sube este commit a GitHub (ya está el repo `consultorio-digital-legal`).
2. Crea cuenta en [render.com](https://render.com) con tu GitHub (sign up with GitHub).
3. Dashboard → **New → Blueprint** → conecta el repo `consultorio-digital-legal`.
4. Render lee **`render.yaml`** (ya incluido): crea `consultorio-db` (PostgreSQL gratis)
   y `consultorio-digital-legal` (web) con todo cableado (`DATABASE_URL` automático,
   `API_SECRET_KEY` autogenerado, `ENVIRONMENT=production` → oculta `/docs`).
5. **Apply** → espera el build (~2 min).
6. En el servicio web → **Environment** → pega los valores reales (las claves en
   el `.env` local; NUNCA se subieron al repo):
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`
   - `SMTP_HOST/PORT/USER/PASSWORD` y `EMAIL_FROM` (para confirmación de correo y reset reales)
7. **Deploy** de nuevo (para que tome las env). Ready → abre la URL que te da Render (HTTPS).
8. Registra tu primera cuenta → confirma correo (si SMTP no está, en producción el
   enlace no se muestra: configura SMTP o usa la pestaña de desarrollo local).

## Notas honestas (plan gratuito)

- **PostgreSQL gratis expira a los 30 días** (14 días de gracia para pagar si quieres conservar datos). Para el demo está bien; después migra a Neon (también gratis, sin expiración) cambiando solo la env `DATABASE_URL`.
- **La web se duerme a los 15 min sin tráfico** y el primer request tarda ~1 min en despertar.
- La URL de producción cambia el `_base_url()` de los correos automáticamente (config ya lo maneja).
- El `redirect-url` de Wompi se omite (bloqueo CloudFront con localhost): tras pagar usa "Ya pagué — verificar".
- El token de Render se configura sin tarjeta; los límites pueden cambiar: verifica [render.com/docs/free](https://render.com/docs/free).

## Alternativa DB sin expiración

Neon (PostgreSQL gratis): creas proyecto → copias la connection string → la pegas
en `DATABASE_URL` en Render (en vez de usar el built-in). El código ya normaliza la URL.
