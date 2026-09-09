# ⚖️ Consultorio Digital Legal — Plataforma

Portal de herramientas jurídicas + **base de servicios basada en el proyecto CONCULTORIO** (análisis jurídico con IA, generación de minutas, monitoreo judicial y pagos).

| Servicio | Carpeta | Tecnología | Puerto |
|---|---|---|---|
| **CONSULTORIO (BASE)** — API + Web + Docs | `CONCULTORIO/apps/api` | FastAPI + SQLAlchemy + Gemini + Wompi | `9504` |
| **Portal Web** (hub) | `apps/web` | Next.js | `9500` |
| **Vigilancia de Procesos** | `lovable-juridico` | TanStack Start + Supabase | `9501` |
| PostgreSQL (Docker) | `docker-compose.yml` | Postgres 16 | `5432` |

> ⚠️ Las herramientas generan **orientación y borradores**. Ningún documento debe
> presentarse sin revisión y firma de un abogado titulado.

---

## 1. Requisitos

- Node.js ≥ 18.18, `pnpm` + `npm`
- Python ≥ 3.11 (proyecto probado con 3.14)
- Docker (PostgreSQL)

## 2. Instalación (una sola vez)

```bash
# Dependencias del monorepo (portal)
pnpm install

# Dependencias de la app de Vigilancia (npm, con caché local)
pnpm run setup:legal

# Entorno Python + dependencias de CONSULTORIO (la base)
cd CONCULTORIO/apps/api
python3 -m venv .venv && .venv/bin/python -m pip install -r requirements.txt
cd ../..
```

> La base usa `SQLite` por defecto (`.env` en `CONCULTORIO/apps/api`). Para
> PostgreSQL: ajusta `DATABASE_URL` en ese `.env` y levanta `docker compose up -d db`.

## 3. Ejecutar

```bash
./dev.sh          # portal (9500) + vigilancia (9501) + CONSULTORIO (9504)
```

O por separado:

```bash
pnpm run dev:consultorio   # base (9504)
pnpm run dev:web           # portal (9500)
pnpm run dev:legal         # vigilancia (9501)
```

## 4. Probar

- **CONSULTORIO (base):** http://localhost:9504 — Swagger: http://localhost:9504/docs
- **Portal:** http://localhost:9500
- **Vigilancia:** http://localhost:9501

### Endpoints principales de la base

```bash
# Auth (JWT)
curl -X POST http://localhost:9504/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@b.co","password":"secreto123","full_name":"Ana"}'

# Clasificación con IA (Gemini + motor dogmático - 18 categorías jurídicas)
curl -X POST http://localhost:9504/api/v1/cases/classify -H 'Content-Type: application/json' \
  -d '{"description":"La EPS negó el medicamento, riesgo para mi vida","user_context":{}}'

# Generar tutela (con medida cautelar + disclaimer legal)
curl -X POST http://localhost:9504/api/v1/documents/tutela -H 'Content-Type: application/json' \
  -d '{"accionante_nombre":"Ana","accionante_identificacion":"123","accionante_ciudad":"Bogotá","accionante_direccion":"Calle 1","accionante_email":"a@b.co","accionado_nombre":"EPS","derechos_vulnerados":["Salud"],"hechos":["Negó medicamento"],"pretensiones":["Autorizar"],"medida_cautelar_urgente":true}'

# Catálogo de precios (Wompi)
curl http://localhost:9504/api/v1/payments/catalog
```

---

## 5. Estructura

```
.
├── CONCULTORIO/            # BASE adoptada (FastAPI monolítico)
│   ├── apps/api/           #   app/{agents,services,models,schemas,api}/ + web index.html
│   │   └── app/core/       #   config, database, security (auth JWT)
│   ├── consultorio-legal/  #   variante microservicios (para portar UI Next.js — backlog)
│   └── infrastructure/     #   docker-compose (Postgres + Redis)
├── apps/web/               # Portal Next.js (hub de herramientas)
├── lovable-juridico/       # Vigilancia de Procesos (TanStack + Supabase)
├── design/                 # Análisis, arquitectura y plan (05-falencias-consultorio-base.md)
├── docker-compose.yml      # PostgreSQL 16
├── dev.sh                  # Arranca los tres servicios
└── package.json            # Workspace raíz (pnpm)
```

## 6. Notas de adopción

- El análisis completo de falencias y las correcciones aplicadas están en
  `design/05-falencias-consultorio-base.md`.
- **Correcciones aplicadas a la base:** secretos fuera del código, auth JWT +
  bcrypt, webhook Wompi con verificación HMAC, persistencia real (SQLite/Postgres),
  scraper sin datos fabricados, TLS verificado, Gemini v2 con errores logueados,
  disclaimers legales, enums corregidos.
- **Pendiente (ver backlog del documento):** rotar claves expuestas, revisión
  humana obligatoria, consentimiento Ley 1581, rate-limiting, login en el frontend.
