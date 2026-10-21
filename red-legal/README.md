# Red Legal DOMINET

Plataforma web que conecta clientes con abogados inscritos en Colombia: orientación preliminar con IA, concepto firmado por abogado, gestión de casos con términos y alertas, suscripciones de abogados y referidos de un solo nivel.

Producto separado del consultorio jurídico académico (Q10) de dominetsas.com.

## Estado (fase 1, en construcción)

| Pieza | Estado |
| --- | --- |
| Inicio público y áreas del derecho | Hecho |
| Orientación con IA (`/orientacion`, `POST /api/orientacion`) | Hecho |
| Solicitud de vinculación de abogados (`/abogados/registro`) | Hecho |
| Esquema de base de datos con seguridad por fila (`supabase/migrations`) | Hecho |
| Cálculo de términos en días hábiles con festivos y vacancia judicial (`src/lib/terminos.ts`) | Hecho |
| Inicio de sesión por enlace al correo (`/ingresar`) | Hecho |
| Panel del abogado, expediente con actuaciones y términos (`/panel`) | Hecho |
| Pagos con Wompi: suscripciones (mensual o anual, promo fundadores) y concepto preliminar; confirmación por evento firmado (`/api/wompi/eventos`) | Hecho |
| Cobro recurrente automático (tokenización Wompi) y factura electrónica DIAN | Pendiente |
| Alertas diarias por correo de términos próximos (`/api/cron/alertas`, Resend) | Hecho |
| Planes con servicios y límites (`/planes`, `src/lib/planes.ts`; límites aplicados en la base) | Hecho |
| Contrato de vinculación de abogados y política de datos (`/terminos/abogados`, `/terminos/datos`) | Hecho |
| Vigilancia de procesos en la Rama Judicial: consulta por radicado, actuaciones nuevas, términos del despacho (`src/lib/rama.ts`, `/api/cron/procesos`) | Hecho |
| Minutas de pago: precio por documento con Wompi (acceso 30 días) o cupo mensual del plan; el texto completo solo sale del servidor con acceso (migración 0005) | Hecho |
| Biblioteca de minutas: peticiones, tutela, desacato, acción popular y de grupo, contratos, títulos valores, poder, recurso, garantía (`/minutas`) | Hecho |
| Límite diario de la orientación gratuita | Pendiente |
| Panel del administrador: métricas y solicitudes | Hecho (aprobar con `aprobar_abogado` en SQL) |

## Cómo correrlo

1. Crea un proyecto en Supabase y ejecuta en orden los archivos de `supabase/migrations/` en el editor SQL.
   Para volverte administrador: ingresa una vez y luego `update perfiles set rol = 'admin' where id = '<tu id>';`.
2. Copia `.env.example` a `.env.local` y llena las claves de Supabase y Anthropic.
3. `npm install` y `npm run dev`; abre http://localhost:3000.

En el panel de Wompi, configura la URL de eventos como `https://<tu dominio>/api/wompi/eventos`.

Para desplegar, conecta el repositorio a Vercel y carga las mismas variables de entorno.

## Notas legales para el equipo

- La orientación de la IA es informativa; el concepto pagado lo firma un abogado.
- El administrador ve métricas agregadas, no el contenido de los expedientes.
- La plataforma no cobra porcentaje de honorarios ni paga comisiones por clientes.
- Los festivos y la vacancia judicial deben revisarse cada año contra el calendario oficial.

## Publicar en Cloudflare (principal)

Se usa el adaptador OpenNext (`wrangler.jsonc`, `open-next.config.ts`).

1. `npx wrangler login` (una vez).
2. Las variables `NEXT_PUBLIC_*` se incrustan al compilar: defínelas en `.env.local` o en el entorno antes de compilar.
3. `npm run cf:deploy` compila y publica el Worker `red-legal`.
4. En el panel de Cloudflare (Workers → red-legal → Settings → Variables and Secrets) carga como **secretos**: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` y, cuando apliquen, `ANTHROPIC_API_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`.
5. Dominio propio: Workers → red-legal → Settings → Domains & Routes → `abogados.dominetsas.com` (el dominio debe estar en Cloudflare).

`npm run cf:preview` prueba el Worker localmente.

## Respaldo en el NUC

- **App de reserva:** `npm ci && npm run build && npm start` con el mismo `.env.local`, expuesta con un túnel de Cloudflare (`cloudflared`) en un subdominio de respaldo.
- **Alertas diarias:** cron del NUC que llama `curl -H "Authorization: Bearer $CRON_SECRET" https://abogados.dominetsas.com/api/cron/alertas`.
- **Vigilancia de procesos:** cron del NUC cada 15 minutos a `https://abogados.dominetsas.com/api/cron/procesos?lote=3` (mismo encabezado). Revisa por lotes los procesos no consultados en 20 horas y avisa por correo las actuaciones nuevas. La API de la Rama solo responde en el puerto 448.
- **Copia de la base:** `pg_dump` diario de Supabase a una carpeta local del NUC.
