# Consultorio Digital Legal — Contratos de API (REST)

> Convenciones: base `/api/v1`, JSON, autenticación `Authorization: Bearer <JWT>`.
> Errores estándar: `400` validación, `401` no autenticado, `403` sin permiso, `404` no existe, `409` conflicto, `422` regla de negocio (ej. documento sin revisión).
> Todos los `id` son UUID.

---

## 1. Autenticación y usuarios

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/auth/register` | Crear cuenta + consentimientos iniciales | público |
| POST | `/auth/login` | Login (devuelve JWT + refresh) | público |
| POST | `/auth/refresh` | Renovar access token | autenticado |
| POST | `/auth/mfa/setup` · `/auth/mfa/verify` | Habilitar/verificar MFA | autenticado |
| GET | `/users/me` | Perfil propio | autenticado |
| PATCH | `/users/me` | Actualizar perfil | autenticado |
| GET | `/users/me/consents` | Consentimientos vigentes | autenticado |
| POST | `/users/me/data-requests` | Ejercer derecho ARCO | autenticado |

**Ejemplo — registro:**
```json
POST /auth/register
{
  "full_name": "…", "email": "…", "password": "…",
  "document_type": "CC", "document_number": "…",
  "consents": [
    { "purpose": "tratamiento", "granted": true },
    { "purpose": "envio_ia_terceros", "granted": true }
  ]
}
```

---

## 2. Casos y consultas

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/cases` | Crear caso (texto libre → clasificación) | cliente |
| GET | `/cases` | Listar casos del usuario (filtros: status, area) | cliente/abogado/admin |
| GET | `/cases/{id}` | Detalle del caso | dueño o abogado asignado |
| PATCH | `/cases/{id}/status` | Cambiar estado (auditado) | abogado/admin |
| POST | `/cases/{id}/consultations` | Enviar mensaje | dueño o abogado |
| GET | `/cases/{id}/consultations` | Historial | dueño o abogado |

**Ejemplo — crear caso:**
```json
POST /cases
{ "summary": "Me despidieron sin justa causa…", "area_id": null }
→ 201 { "id": "…", "area_id": "…", "classification_confidence": 0.91, "status": "open" }
```

---

## 3. Documentos y revisión

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/cases/{id}/documents` | Solicitar generación de documento | dueño |
| GET | `/documents/{id}` | Obtener documento + estado | dueño/abogado |
| GET | `/documents/{id}/download` | Descargar (solo si `approved`/`delivered`) | dueño |
| GET | `/lawyer/review-queue` | Cola de revisión del abogado | abogado |
| POST | `/documents/{id}/review` | Aprobar/rechazar borrador | abogado revisor |
| POST | `/documents/{id}/sign` | Solicitar firma digital | dueño/abogado |

**Ejemplo — revisión (regla dura):**
```json
POST /documents/{id}/review
{ "decision": "approved", "comments": "Revisado. Art. 86 CP correcto." }
→ 200 { "status": "approved", "reviewed_by": "…", "reviewed_at": "…" }
```
> `decision: rejected` devuelve el borrador a corrección; **no se puede descargar** hasta `approved`.

---

## 4. Abogados y asignación

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/lawyers/apply` | Solicitar alta como abogado (tarjeta profesional) | usuario |
| GET | `/lawyers` | Directorio (solo verificados) | público/autenticado |
| GET | `/lawyers/{id}` | Perfil + especialidades + disponibilidad | autenticado |
| POST | `/admin/lawyers/{id}/verify` | Verificar tarjeta profesional | admin |
| POST | `/cases/{id}/assign` | Asignar caso (solo abogados verificados) | admin/sistema |

---

## 5. Pagos, suscripciones y bonos

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/plans` | Planes disponibles | público |
| POST | `/subscriptions` | Crear suscripción | autenticado |
| POST | `/payments/init` | Iniciar pago (devuelve link/token pasarela) | autenticado |
| POST | `/payments/webhook` | Webhook de la pasarela (firma verificada) | sistema |
| GET | `/payments` · `/invoices` | Historial de pagos/facturas | autenticado |
| GET | `/admin/bonus/calculate` | Calcular bonificaciones del periodo | admin |

**Ejemplo — iniciar pago:**
```json
POST /payments/init
{ "plan_id": "…", "gateway": "wompi" }
→ 201 { "payment_id": "…", "checkout_url": "https://checkout.wompi.co/…" }
```

---

## 6. Monitoreo y alertas

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/cases/{id}/trackings` | Registrar proceso a monitorear (radicado) | abogado |
| GET | `/trackings/{id}` | Estado + historial de novedades | abogado/dueño |
| POST | `/trackings/{id}/check` | Disparar consulta manual | abogado |
| GET | `/alerts` | Alertas del usuario | autenticado |
| PATCH | `/alerts/{id}/read` | Marcar leída | autenticado |

> Endpoint de scraping interno (`/internal/scrape/run`) **no es público**: solo workers autenticados por servicio.

---

## 7. Notas de seguridad del API

- **Webhooks** de pagos verifican firma/secret de la pasarela antes de procesar.
- **Rate-limiting** por IP y por usuario (anti-abuso del scraping y del chatbot).
- **Idempotencia** en pagos (`Idempotency-Key`) para evitar doble cobro.
- Todo acceso a caso/documento valida **pertenencia o rol** (`need-to-know`), y se registra en `audit_logs`.

---

*Con esto queda completa la base de diseño. Siguiente paso natural: prototipo del clasificador por ramas del derecho (o el generador de tutelas/derechos de petición).*
