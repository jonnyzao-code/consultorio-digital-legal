# ⚖️ Consultorio Digital Legal (Colombia)

Plataforma SaaS legal-tech colombiana orientada a la democratización del acceso a la justicia y la optimización de despachos jurídicos mediante IA generativa, automatización de documentos y monitoreo judicial.

---

## 🏛️ Estructura del Proyecto (Monorepo)

```text
CONCULTORIO/
├── apps/
│   ├── api/                     # Backend FastAPI (Python 3.11+)
│   │   ├── app/
│   │   │   ├── agents/          # Agente Clasificador por Ramas del Derecho
│   │   │   ├── api/v1/          # Endpoints REST (casos, docs, monitoreo, bonos, pagos)
│   │   │   ├── core/            # Configuración, variables y motor SQLAlchemy
│   │   │   ├── models/          # Entidades de BD (Usuarios, Casos, Documentos, Pagos)
│   │   │   ├── schemas/         # Validaciones Pydantic v2
│   │   │   └── services/        # Generador de tutelas, liquidador alimentos, bonos
│   │   ├── requirements.txt     # Dependencias Python
│   │   └── main.py              # Punto de entrada FastAPI + Servidor Web
│   └── web/
│       └── index.html           # Portal Web Interactivo (MVP con Tailwind CSS)
├── infrastructure/
│   └── docker-compose.yml       # Orquestación de PostgreSQL 16 y Redis
├── packages/
│   ├── ai-agents/               # Reglas de inferencia y prompts jurisprudenciales
│   ├── doc-generator/           # Plantillas legales (Decreto 2591/91, Ley 1755/15)
│   ├── scraper/                 # Monitoreo de radicados (Justicia XXI / TYBA)
│   └── shared/                  # Tipos y contratos compartidos
├── .env.example                 # Variables de entorno modelo
├── package.json                 # Configuración Monorepo
└── turbo.json                   # Pipeline de tareas Turborepo
```

---

## 🚀 Puesta en Marcha Rápida

### Opción 1: Ejecución directa con Python

1. **Instalar dependencias:**
   ```bash
   cd apps/api
   pip install -r requirements.txt
   ```

2. **Iniciar el servidor API + Web UI:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

3. **Acceder:**
   - 🌐 **Portal Web Interactivo:** [http://localhost:8000/](http://localhost:8000/)
   - 📑 **Swagger API Docs interactivo:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧩 Módulos Implementados

1. **Inteligencia Artificial con Google Gemini:**
   - Conectado a la API de Gemini (`gemini-1.5-flash`) mediante la clave oficial configurada.
   - Clasificación jurídica semántica de casos ciudadanos en Colombia.
   - Enriquecimiento de citas jurisprudenciales de la Corte Constitucional (Sentencias T y SU).
   - Modo de alta disponibilidad con fallback automático jurisprudencial.

2. **Pasarela de Pagos & Monetización (Wompi Colombia):**
   - Integración nativa con **Wompi** (Bancolombia) para cobros en pesos colombianos (COP).
   - Métodos soportados: **PSE** (todos los bancos de Colombia), **Nequi** (push directo), **Tarjetas de Crédito/Débito** y **Botón Bancolombia / QR**.
   - Generación de firma de integridad criptográfica **SHA-256** según especificaciones de Wompi.
   - Catálogo oficial tarifario:
     * Consulta Exprés (IA + Abogado): $35.000 COP
     * Acción de Tutela con Medida Cautelar: $55.000 COP
     * Derecho de Petición Prioritario: $30.000 COP
     * Liquidación Judicial de Alimentos: $40.000 COP
     * Plan Suscripción Mensual: $120.000 COP/mes
   - Simulador de aprobación instantánea para pruebas locales y webhook receptor.

3. **Generador Automatizado de Documentos:**
   - **Acción de Tutela:** Formato judicial con solicitud de Medida Cautelar Provisional (Decreto 2591 de 1991).
   - **Derecho de Petición:** Conforme a la Ley 1755 de 2015.
   - **Liquidador de Cuota de Alimentos:** Aplica tope máximo legal del 50% inembargable y proporcionalidad (Ley 1098 de 2006).

3. **Monitoreo de Procesos Judiciales:**
   - Búsqueda por número único nacional de radicado (23 dígitos).
   - Detección de novedades en actuaciones (Auto admisorio, fijación en lista, traslados).

4. **Motor de Bonificaciones a Abogados:**
   - Evaluación 60% objetivos cuantitativos (resolución y celeridad) + 40% evaluación cualitativa (satisfacción y auditoría jurídica).
   - Cálculo automático de escalafón (Oro, Plata, Bronce).

5. **Pasarela de Pagos (Wompi Colombia):**
   - Soporte para PSE, Nequi, Bancolombia QR y Tarjetas de Crédito.
