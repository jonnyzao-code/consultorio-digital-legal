# Consultorio Digital Legal — Makefile
.PHONY: dev down logs db-migrate db-reset test install-web clean

# ─── Docker ───────────────────────────────────────────────────────────────────
dev:
	@echo "🚀 Iniciando Consultorio Digital Legal en modo desarrollo..."
	docker compose up --build -d
	@echo "✅ Servicios disponibles:"
	@echo "   - API:      http://localhost:8000/docs"
	@echo "   - Web:      http://localhost:3000"
	@echo "   - pgAdmin:  http://localhost:5050"

down:
	@echo "🛑 Deteniendo servicios..."
	docker compose down

down-volumes:
	@echo "⚠️  Deteniendo servicios y eliminando volúmenes (se perderán los datos)..."
	docker compose down -v

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-web:
	docker compose logs -f web

logs-agents:
	docker compose logs -f classifier-agent document-agent monitor-agent

# ─── Base de Datos ────────────────────────────────────────────────────────────
db-migrate:
	@echo "🗃️  Corriendo migraciones Alembic..."
	docker compose exec api alembic upgrade head

db-makemigration:
	@echo "🗃️  Creando nueva migración..."
	docker compose exec api alembic revision --autogenerate -m "$(message)"

db-reset:
	@echo "⚠️  Recteando la base de datos..."
	docker compose down postgres
	docker volume rm consultorio-legal_pgdata || true
	docker compose up -d postgres
	@sleep 3
	$(MAKE) db-migrate

db-shell:
	docker compose exec postgres psql -U consultorio -d consultorio_legal

# ─── Tests ────────────────────────────────────────────────────────────────────
test:
	@echo "🧪 Corriendo tests del backend..."
	docker compose exec api pytest services/api/tests/ -v --tb=short

test-local:
	cd services/api && python -m pytest tests/ -v

# ─── Frontend ─────────────────────────────────────────────────────────────────
install-web:
	@echo "📦 Instalando dependencias del frontend..."
	cd apps/web && npm install

dev-web:
	@echo "⚛️  Iniciando Next.js en modo standalone..."
	cd apps/web && npm run dev

build-web:
	cd apps/web && npm run build

# ─── Utilidades ───────────────────────────────────────────────────────────────
clean:
	@echo "🧹 Limpiando archivos temporales..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true

setup:
	@echo "⚙️  Configuración inicial..."
	@cp -n .env.example .env || echo "  → .env ya existe, omitiendo."
	@cp -n apps/web/.env.local.example apps/web/.env.local || echo "  → .env.local ya existe, omitiendo."
	@echo "✅ Copia tus credenciales en .env y apps/web/.env.local, luego corre: make dev"

status:
	docker compose ps

help:
	@echo ""
	@echo "Consultorio Digital Legal — Comandos disponibles:"
	@echo "──────────────────────────────────────────────────"
	@echo "  make setup          Configuración inicial (copia .env)"
	@echo "  make dev            Levanta todos los servicios con Docker"
	@echo "  make down           Detiene los servicios"
	@echo "  make logs           Logs de todos los servicios"
	@echo "  make db-migrate     Corre migraciones Alembic"
	@echo "  make db-reset       Recrea la base de datos"
	@echo "  make test           Corre los tests"
	@echo "  make install-web    Instala dependencias del frontend"
	@echo "  make clean          Limpia archivos temporales"
	@echo ""
