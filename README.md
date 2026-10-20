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
| Inicio de sesión, tablero del abogado, expediente | Pendiente |
| Pagos (Wompi o PayU) y factura electrónica | Pendiente |
| Correos de alerta y límite diario de la orientación gratuita | Pendiente |
| Panel del administrador | Pendiente (la vista `metricas_abogados` ya existe) |

## Cómo correrlo

1. Crea un proyecto en Supabase y ejecuta `supabase/migrations/0001_esquema_inicial.sql` en el editor SQL.
2. Copia `.env.example` a `.env.local` y llena las claves de Supabase y Anthropic.
3. `npm install` y `npm run dev`; abre http://localhost:3000.

Para desplegar, conecta el repositorio a Vercel y carga las mismas variables de entorno.

## Notas legales para el equipo

- La orientación de la IA es informativa; el concepto pagado lo firma un abogado.
- El administrador ve métricas agregadas, no el contenido de los expedientes.
- La plataforma no cobra porcentaje de honorarios ni paga comisiones por clientes.
- Los festivos y la vacancia judicial deben revisarse cada año contra el calendario oficial.
