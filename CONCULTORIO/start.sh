#!/bin/bash
set -e

echo "⚖️  Iniciando Consultorio Digital Legal..."

# Ir a la carpeta de la API
cd "$(dirname "$0")/apps/api"

# Verificar o crear entorno virtual
if [ ! -d ".venv" ]; then
    echo "📦 Creando entorno virtual (.venv)..."
    python3 -m venv .venv
fi

# Activar entorno virtual
echo "🔌 Activando entorno virtual..."
source .venv/bin/activate

# Instalar dependencias esenciales
echo "📥 Instalando dependencias básicas del servidor..."
pip install -r requirements-core.txt

echo "🚀 Servidor listo! Abriendo en http://localhost:8000"
echo "Para detener el servidor presiona Ctrl + C"

# Iniciar servidor
uvicorn main:app --reload --port 8000
