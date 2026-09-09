# Análisis de Falencias — CONCULTORIO (Base Adoptada)

> Documento consolidado del análisis e integración del proyecto `CONCULTORIO/`,
> adoptado como **modelo base** de la plataforma (reemplaza al prototipo anterior).
> Basado en revisión de los 3 submódulos (API, consultorio-legal, infraestructura)
> + verificación en ejecución real.

---

## 1. Decisión de adopción

**Base adoptada:** `CONCULTORIO/apps/api` (monolito FastAPI) — es la pieza con
valor real: agentes dogmáticos con 18 categorías jurídicas, análisis con Gemini,
generador de minutas (tutela, derecho de petición, contratos, liquidación de
alimentos), scraper CPNU Rama Judicial, pagos Wompi y motor de bonos.

**No adoptado (duplicado roto):** `consultorio-legal/` (variante microservicios
con Next.js y 3 agentes Docker) — login roto (422), frontend que no compila
(Tailwind), rutas inexistentes, agentes desconectados, pagos stub. Contiene
piezas reutilizables a futuro (frontend Next.js, document-agent tipado); se
documenta su portación como tarea del backlog.

**Descarte parcial:** los `packages/` (ai-agents, doc-generator, scraper,
shared), `apps/admin`, `docs` y `tests/` estaban **vacíos** (skeletons). El
mapa turbo del monorepo era declarativo, no operativo.

---

## 2. Falencias CRÍTICAS detectadas (y estado)

| # | Falencia | Impacto | Estado |
|---|---|---|---|
| 1 | **Secretos de PRODUCCIÓN hardcodeados** en `config.py` (Gemini, Wompi `prv_prod_`, `prod_integrity_`, `prod_events_`) y fallback en `payment_service.py` | Cualquiera con el repo firma pagos reales y consume la API Gemini | ✅ **Corregido** (defaults vacíos; solo `.env`). **⚠️ Rotar las 4 claves** |
| 2 | **Bypass de pagos**: `/register-transfer` y `/simulate-approval` aprobaban sin verificar; `/webhook` sin validar firma | Servicios desbloqueados sin pagar | ✅ **Corregido** (firma HMAC verificada en webhook → 401 sin firma; simulación bloqueada en producción) |
| 3 | **Cero autenticación** (ningún endpoint con `Depends` de auth) + datos bancarios reales expuestos en `GET /payments/banking-details` | Anónimos generan documentos legales y leen datos financieros | ✅ **Corregido** (auth JWT + bcrypt: `/auth/register`, `/auth/login`, `/auth/me`; `banking-details` protegido) |
| 4 | **BD no usada**: casos en memoria (`_CASES_DB`), `aiosqlite` ausente, driver `None` | Cero persistencia; datos perdidos al reiniciar | ✅ **Corregido** (aiosqlite + greenlet, `init_db()` + `create_all`, casos persistidos y verificados) |
| 5 | **Scraper fabricaba datos judiciales**: al no responder CPNU inventaba actuación con fecha de hoy, fecha de radicación falsa y `es_consulta_real=True` | Usuario actúa sobre "datos oficiales" inventados | ✅ **Corregido** (fallback honesto: `es_consulta_real=False`, sin actuaciones fabricadas, verificación oficial recomendada) |
| 6 | **Modelo SQLAlchemy roto** (`LawyerProfile.assigned_cases` sin FK válida) — latente hasta conectar la BD | La capa ORM fallaba al primer uso | ✅ **Corregido** (relación eliminada; no se usaba) |
| 7 | **TLS deshabilitado** (`CERT_NONE`) contra la API de la Rama Judicial | MITM sobre datos judiciales | ✅ **Corregido** (verificación TLS completa) |
| 8 | **Gemini muerto en silencio**: modelo `gemini-1.5-flash` retirado, clave en query string, errores tragados con `pass`, timeout 2.5s | La IA nunca respondía (el motor dogmático enmascaraba el fallo) | ✅ **Corregido** (modelo `gemini-2.0-flash`, header `x-goog-api-key`, timeout 15s, errores logueados) |

---

## 3. Falencias ALTO detectadas (estado)

| # | Falencia | Estado |
|---|---|---|
| 9 | **Sin disclaimers legales** en documentos generados (riesgo de ejercicio ilegal de la abogacía, Ley 1123/2007) | ✅ **Corregido** (disclaimer obligatorio en toda minuta) |
| 10 | Enums SQLAlchemy persistían nombres (`"CLIENT"`) en vez de valores (`"client"`) | ✅ **Corregido** (`values_callable`) |
| 11 | CORS/entornos: `apps/api/.env` en desarrollo con claves de **producción** | ⚠️ Parcial (CORS ampliado a 9500/9501/9504). Separar entornos y rotar claves |
| 12 | `/gemini-status` filtra prefijo de la clave; sin rate-limiting en `/classify` (coste abierto) | ⏳ Backlog (rate limiting por IP) |
| 13 | Revisión humana ausente en el flujo (los dictámenes se entregan con confianza 0.98 sin abogado revisor) | ⏳ Backlog (regla de revisión + firma de abogado) |
| 14 | Cumplimiento Ley 1581 (datos personales en minutas sin aviso/consentimiento) | ⏳ Backlog (aviso de privacidad + consentimiento) |
| 15 | Frontend `index.html` sin login/rollo de sesión (la API ya tiene auth; el UI no lo usa) | ⏳ Backlog (integrar login en el index.html o portar Next.js) |
| 16 | `/monitoring/alerts` con datos mock; `/ocr-extract` promete OCR sin implementarlo; deps sin uso (playwright, twilio, sendgrid, celery, docxtpl) | ⏳ Backlog (implementar o podar) |

---

## 4. Verificación en ejecución (puerto 9504)

```
GET  /health                        → 200 ok
POST /auth/register                 → 200 access_token (bcrypt + JWT)
GET  /auth/me (Bearer)              → 200 email + rol (client)
GET  /payments/banking-details      → 401 sin token / 200 con token
POST /payments/webhook (sin firma)  → 401 "Firma de webhook inválida"
POST /cases/ (crear)                → 201 id=1 branch=LABORAL (persistido SQLite)
GET  /cases/                        → 1 caso en BD (persistencia real)
POST /cases/classify                → motor dogmático (18 categorías, jurisprudencia real)
POST /documents/tutela              → minuta + disclaimer legal
GET  /                              → index.html (portal web one-page)
GET  /docs                          → Swagger interactivo
```

---

## 5. Backlog priorizado (siguientes iteraciones)

1. **Rotar claves** Gemini + Wompi (por la exposición histórica) y separar `.env` por entorno.
2. **Revisión humana obligatoria** en el flujo de documentos (estado `draft → reviewed` por abogado con tarjeta profesional).
3. **Consentimiento Ley 1581** al capturar datos personales en los formularios.
4. **Rate-limiting** por IP en `/classify` y `/documents/*` (protege el coste de Gemini).
5. **Integrar auth en el frontend** (login en `index.html` o portar el Next.js de `consultorio-legal` arreglado).
6. **Implementar/podar** OCR real, alertas reales (colas + Twilio/SendGrid), pagos persistidos en BD (tabla `payments` ya existe).
7. **Migraciones Alembic** reales (en lugar de `create_all`) para producción.
8. **Supabase/JWT** si se mantiene la integración con la app de Vigilancia.

---

## 6. Ubicación en la plataforma (puertos 9500+)

| Servicio | Puerto |
|---|---|
| Portal Web (hub) | 9500 |
| Vigilancia de Procesos (Lovable) | 9501 |
| **CONSULTORIO (base: API + Web + Docs)** | **9504** |
| PostgreSQL (Docker) | 5432 |
