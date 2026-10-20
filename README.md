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
| Pagos (Wompi o PayU) y factura electrónica | Pendiente |
| Alertas diarias por correo de términos próximos (`/api/cron/alertas`, Resend) | Hecho |
| Límite diario de la orientación gratuita | Pendiente |
| Panel del administrador: métricas y solicitudes | Hecho (aprobar con `aprobar_abogado` en SQL) |

## Cómo correrlo

1. Crea un proyecto en Supabase y ejecuta en orden los archivos de `supabase/migrations/` en el editor SQL.
   Para volverte administrador: ingresa una vez y luego `update perfiles set rol = 'admin' where id = '<tu id>';`.
2. Copia `.env.example` a `.env.local` y llena las claves de Supabase y Anthropic.
3. `npm install` y `npm run dev`; abre http://localhost:3000.

Para desplegar, conecta el repositorio a Vercel y carga las mismas variables de entorno.

## Notas legales para el equipo

- La orientación de la IA es informativa; el concepto pagado lo firma un abogado.
- El administrador ve métricas agregadas, no el contenido de los expedientes.
- La plataforma no cobra porcentaje de honorarios ni paga comisiones por clientes.
- Los festivos y la vacancia judicial deben revisarse cada año contra el calendario oficial.
