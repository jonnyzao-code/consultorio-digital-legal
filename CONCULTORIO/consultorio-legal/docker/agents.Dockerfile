# ─────────────────────────────────────────────────────────────
#  Consultorio Legal — Agentes IA
#  Contexto de build: services/<agent-name>/
#  (classifier-agent | document-agent | monitor-agent)
# ─────────────────────────────────────────────────────────────

FROM python:3.12-slim

LABEL maintainer="Consultorio Legal"
LABEL description="AI Agent for Consultorio Legal (Gemini-powered)"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python (contexto = services/<agent>/)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar código fuente del agente
COPY . .

# El comando es sobreescrito por docker-compose según el agente
CMD ["uvicorn", "agent:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
