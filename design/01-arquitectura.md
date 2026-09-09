# Consultorio Digital Legal — Arquitectura de Software

> Diseño técnico de base (v1). Complementa al documento de revisión.
> Principio rector: **humano en el circuito** para todo documento/acción con efecto jurídico, y **cumplimiento desde el día 1**.

---

## 1. Decisiones de stack (con justificación)

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript + Tailwind** | SSR/SEO, una sola base web que luego se empaqueta como **PWA** (evita app nativa en fase 1). Reemplaza el "React/Vue suelto" del plan. |
| API principal (BFF) | **Node.js + NestJS** | Tipado, módulos, inyección de dependencias, fácil de auditar; ideal para lógica transaccional y RBAC. |
| Servicio de IA | **Python 3.12 + FastAPI** | Ecosistema de NLP/OCR/generación (LangChain, transformers, PaddleOCR, DocxTemplate). |
| Servicio de scraping | **Python + Playwright** | Más robusto que Selenium/Puppeteer frente a anti-bot y cambios de DOM; con colas. |
| Mensajería / colas | **Redis + BullMQ (Node) / Celery (Python)** | Trabajos asíncronos (scraping, generación, notificaciones). RabbitMQ si se necesita garantía de entrega dura. |
| Base de datos | **PostgreSQL 16** (transaccional) | Integridad referencial para usuarios, casos, pagos y auditoría. |
| Caché / sesiones | **Redis** | Sesiones, rate-limiting, caché de clasificación. |
| Almacenamiento de archivos | **S3-compatible** (documentos) con **AES-256** | Documentos generados, plantillas, evidencia; cifrado en reposo + URL firmadas. |
| Notificaciones | **SendGrid** (correo) · **Twilio** (WhatsApp/SMS) · **Firebase** (push) | Multlicanal; **sin datos sensibles en el cuerpo del mensaje**. |
| Pagos | **Wompi** (PSE/Nequi/tarjeta) + **Stripe** (internacional) | Tokenización; **no almacenar PAN**. |
| Firma digital | Proveedor certificado (entidad de certificación acreditada ONAC) | Validez y no repudio para contratos/demandas/poderes. |
| Facturación electrónica | Proveedor **habilitado por la DIAN** | CUFE, XML, validación previa; no desarrollar a medida. |
| Observabilidad | **OpenTelemetry + Grafana + Loki + Sentry** | Métricas, logs estructurados, trazabilidad y errores. |
| CI/CD | **GitHub Actions + Docker** | Despliegue reproducible; pruebas automatizadas y regresión de scraping. |
| Infraestructura | Cloud (AWS o GCP) con cifrado en reposo | Escalado por servicio, sin sobreaprovisionar el MVP. |

---

## 2. Diagrama de componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Web / PWA)                           │
│  Next.js · clasificador · chatbot (orientación) · formularios          │
│  pasarela (tokenizada) · gestor de turnos                              │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ HTTPS (TLS 1.3)
┌───────────────────────────────┴────────────────────────────────────────┐
│                       API GATEWAY / BFF (NestJS)                       │
│  Auth (JWT + MFA) · RBAC · rate-limiting · validación de entrada       │
└───────┬───────────────┬────────────────┬───────────────┬───────────────┘
        │               │                │               │
        ▼               ▼                ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Identidad /  │ │  Casos / CRM │ │  Documentos  │ │  Pagos /     │
│ Accesos      │ │  legal       │ │  (plantillas │ │  Facturación │
│ (usuarios,   │ │ (estados,    │ │  + revisión  │ │  electrónica │
│  abogados,   │ │  historia)   │ │  humana)     │ │  + bonos)    │
│  RBAC)       │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │               │                │               │
        └───────────────┼────────────────┼───────────────┘
                        │  Eventos / colas (Redis + BullMQ/Celery)
        ┌───────────────┼────────────────┼───────────────┐
        ▼               ▼                ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Servicio IA  │ │ Scraping     │ │ Notificación │ │ Auditoría /  │
│ (FastAPI)    │ │ (Playwright) │ │ (SendGrid/   │ │ Observ.      │
│  clasificar  │ │  colas +     │ │  Twilio/     │ │ (logs+métricas│
│  extraer/OCR │ │  fallback)   │ │  Firebase)   │ │ +trazas)     │
│  generar     │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                        │
┌───────────────────────┴──────────────────────────────────────────────┐
│              HUMANO EN EL CIRCUITO (obligatorio)                      │
│  Cola de revisión de abogados → aprueba/rechaza antes de entregar     │
│  Verificación de tarjeta profesional (Registro Nacional de Abogados)  │
└───────────────────────┬──────────────────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────────────────────┐
│                    CAPA DE DATOS Y CUMPLIMIENTO                       │
│  PostgreSQL 16 · Redis · S3 (AES-256) · KMS · Backup + DR · Ley 1581  │
│  Auditoría de accesos · Cifrado en tránsito (TLS 1.3) y reposo        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Límites y responsabilidades de los servicios

| Servicio | Responsabilidad | No debe hacer |
|---|---|---|
| **API/BFF** | Orquestar casos de uso, autorizar, validar, exponer REST. | Lógica de NLP/OCR, scraping directo. |
| **Identidad/Accesos** | Registro, login, MFA, RBAC, verificación de abogados. | Lógica de negocio legal. |
| **Casos/CRM legal** | Ciclo de vida del caso, estados, asignación, historia. | Generar documentos. |
| **Documentos** | Plantillas versionadas, generación, **flujo de revisión**. | Entregar sin aprobación humana. |
| **Servicio IA** | Clasificar por rama, extraer datos (OCR/NLP), generar borradores. | Tomar decisiones legales finales; decidir entregar. |
| **Scraping** | Consultar fuentes, cachear, emitir eventos de novedad. | Ser fuente autoritativa; acceder a SPOA de terceros. |
| **Notificación** | Enviar correo/WA/push por colas, con reintentos. | Incluir datos sensibles en el mensaje. |
| **Pagos/Facturación** | Cobrar, tokenizar, emitir factura electrónica, calcular bonos. | Almacenar datos de tarjeta. |
| **Auditoría/Observ.** | Logs inmutables, métricas, trazabilidad. | Exponer datos personales en dashboards públicos. |

---

## 4. Patrones de comunicación

- **Síncrono (REST/JSON)** para: autenticación, CRUD de casos, consulta de estado, generación de borrador iniciada por usuario.
- **Asíncrono (colas/eventos)** para: scraping programado, generación de documentos pesados, envío de notificaciones, cálculo de bonificaciones, facturación.
- **Eventos clave** (nombre → consumidores):
  - `case.created` → clasificación IA, asignación inicial.
  - `document.draft_ready` → cola de revisión de abogados.
  - `document.approved` → firma (si aplica) + notificación + entrega.
  - `scrape.change_detected` → alertas multicanal + actualización de estado.
  - `payment.succeeded` → activación de suscripción + factura + bono.

---

## 5. Seguridad por capa (controles concretos)

| Capa | Control |
|---|---|
| Perímetro | TLS 1.3, WAF, rate-limiting, protección DDoS. |
| Identidad | JWT de corta vida + refresh, MFA (TOTP), bloqueo por intentos fallidos. |
| Autorización | RBAC por rol (usuario, abogado, revisor, admin, auditor) y **acceso por caso** (need-to-know). |
| Datos | Cifrado en reposo (AES-256) y tránsito; KMS para llaves; minimización y anonimización antes de IA de terceros. |
| Aplicación | Validación de entrada, OWASP Top 10, manejo de secretos, pentest periódico. |
| Pagos | Tokenización; PCI-DSS delegado a la pasarela. |
| Auditoría | Logs inmutables de accesos y acciones (quién, qué, cuándo, sobre qué). |
| Continuidad | Backup cifrado diario + pruebas de restauración + DR. |

---

## 6. Despliegue (fase MVP → escalamiento)

- **MVP:** contenedores Docker en un PaaS/managed (Cloud Run / Fly.io / ECS) + PostgreSQL y Redis managed + S3. Menos operación, más velocidad.
- **Escalamiento:** separar scraping y IA en workers dedicados con autoescalado; introducir RabbitMQ si las colas crecen.
- **Entornos:** `dev`, `staging` (con datos anonimizados), `prod` (con cifrado y auditoría completos).
- **CI/CD:** lint → tests unitarios/integración → tests de regresión de scraping → build → deploy por entorno.

---

*Próximo documento: `02-modelo-de-datos.md` (esquema PostgreSQL + ERD).*
