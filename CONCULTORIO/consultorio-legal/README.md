# ⚖️ Consultorio Legal — Plataforma de Acceso a la Justicia

> Plataforma digital impulsada por inteligencia artificial para democratizar el acceso a servicios jurídicos en Colombia.

---

## 📋 Descripción

**Consultorio Legal** es una plataforma SaaS que conecta ciudadanos con abogados especializados, automatiza la generación de documentos legales (tutelas, derechos de petición, contratos), monitorea procesos judiciales en tiempo real y gestiona pagos a través de Wompi. Los agentes de IA basados en **Google Gemini** clasifican consultas, redactan documentos y envían alertas por WhatsApp o correo electrónico.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                │
│              Web Browser  ·  WhatsApp  ·  Email                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Next.js 14 (Frontend)                        │
│              App Router · TailwindCSS · ShadcnUI                │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                   FastAPI (Backend API)                         │
│          JWT Auth · Pydantic · SQLAlchemy Async                 │
└──────┬──────────────┬─────────────────┬───────────────────────-─┘
       │              │                 │
┌──────▼──────┐ ┌─────▼──────┐ ┌───────▼──────────┐
│  Agente     │ │  Agente    │ │  Agente          │
│  Documentos │ │  Monitor   │ │  Clasificador    │
│  (Gemini)   │ │  Procesos  │ │  Legal (Gemini)  │
└──────┬──────┘ └─────┬──────┘ └───────┬──────────┘
       │              │                 │
┌──────▼──────────────▼─────────────────▼──────────┐
│              Redis (Queue / Cache)               │
└──────────────────────┬────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────┐
│              PostgreSQL 16 (Base de Datos)        │
└───────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Capa             | Tecnología                                    |
|------------------|-----------------------------------------------|
| **Frontend**     | Next.js 14, TypeScript, TailwindCSS, ShadcnUI |
| **Backend API**  | FastAPI, Python 3.12, SQLAlchemy 2.0 Async    |
| **Agentes IA**   | Google Gemini 1.5 Pro, LangGraph              |
| **Base de datos**| PostgreSQL 16                                 |
| **Cache/Queue**  | Redis 7                                       |
| **Pagos**        | Wompi (Colombia)                              |
| **Notificaciones**| Twilio (WhatsApp/SMS), SendGrid (Email)      |
| **Almacenamiento**| Google Cloud Storage                         |
| **Contenedores** | Docker, Docker Compose                        |

---

## 🚀 Instalación con Docker

### Prerrequisitos
- [Docker](https://www.docker.com/) >= 24.0
- [Docker Compose](https://docs.docker.com/compose/) >= 2.20
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/consultorio-legal.git
cd consultorio-legal

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales

# 3. Levantar todos los servicios
docker compose up --build -d

# 4. Verificar que todos los servicios están corriendo
docker compose ps
```

### URLs de acceso local

| Servicio   | URL                          |
|------------|------------------------------|
| Web App    | http://localhost:3000        |
| API Docs   | http://localhost:8000/docs   |
| PgAdmin    | http://localhost:5050        |
| API Health | http://localhost:8000/health |

### Comandos útiles

```bash
# Ver logs de un servicio específico
docker compose logs -f api

# Reiniciar un servicio
docker compose restart api

# Detener todo
docker compose down

# Detener y eliminar volúmenes (¡borra datos!)
docker compose down -v
```

---

## 📁 Estructura de Carpetas

```
consultorio-legal/
├── api/                        # Backend FastAPI
│   ├── app/
│   │   ├── core/               # Configuración, seguridad, DB
│   │   ├── models/             # Modelos SQLAlchemy
│   │   ├── schemas/            # Esquemas Pydantic
│   │   ├── routers/            # Endpoints REST
│   │   └── services/           # Lógica de negocio
│   └── requirements.txt
│
├── web/                        # Frontend Next.js
│   ├── app/                    # App Router
│   ├── components/             # Componentes reutilizables
│   ├── lib/                    # Utilidades y clientes API
│   └── public/
│
├── agents/                     # Agentes de IA
│   ├── document_agent.py       # Generación de documentos legales
│   ├── monitor_agent.py        # Monitoreo de procesos judiciales
│   ├── classifier_agent.py     # Clasificación de consultas
│   └── requirements.txt
│
├── infrastructure/
│   └── init.sql                # Esquema inicial de base de datos
│
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── agents.Dockerfile
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

### ✅ Fase 1 — Infraestructura Base (Actual)
- [x] Docker Compose con todos los servicios
- [x] Esquema de base de datos PostgreSQL
- [x] Dockerfiles optimizados
- [x] Variables de entorno estructuradas

### 🔄 Fase 2 — API Core
- [ ] Autenticación JWT con refresh tokens
- [ ] CRUD de usuarios, abogados, consultas
- [ ] Integración Wompi para pagos
- [ ] Endpoints de documentos

### 🔄 Fase 3 — Agentes IA
- [ ] Agente clasificador de consultas legales (Gemini)
- [ ] Agente generador de documentos (tutelas, peticiones)
- [ ] Agente monitor de procesos judiciales
- [ ] Integración WhatsApp via Twilio

### 🔄 Fase 4 — Frontend
- [ ] Dashboard ciudadano
- [ ] Panel de abogados
- [ ] Flujo de pagos
- [ ] Notificaciones en tiempo real

### 🔄 Fase 5 — Producción
- [ ] Despliegue en Google Cloud Run
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Sentry y Grafana
- [ ] Pruebas de carga

---

## 🤝 Contribución

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

MIT © 2024 Consultorio Legal

---

> Construido con ❤️ para democratizar el acceso a la justicia en Colombia 🇨🇴
