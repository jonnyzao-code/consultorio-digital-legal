#!/usr/bin/env bash
# Arranca los servicios de la plataforma. Ctrl+C detiene todos.
set -e
cd "$(dirname "$0")"
trap 'kill 0' EXIT

echo "▶ Portal Web (Next.js)                 → http://localhost:9500"
(cd apps/web && pnpm dev) &

echo "▶ Vigilancia de Procesos (Lovable)     → http://localhost:9501"
(cd lovable-juridico && npm run dev) &

echo "▶ CONSULTORIO (BASE: FastAPI + Web)    → http://localhost:9504  (docs: /docs)"
(cd CONCULTORIO/apps/api && .venv/bin/python -m uvicorn main:app --reload --port 9504) &

wait
