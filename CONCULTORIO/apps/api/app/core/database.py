"""
Configuración de base de datos con SQLAlchemy async
Soporta PostgreSQL (asyncpg), SQLite y modo seguro sin bloquear el inicio de la app.
"""
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import structlog

log = structlog.get_logger()

class Base(DeclarativeBase):
    pass

engine = None
AsyncSessionLocal = None

db_url = settings.DATABASE_URL

# Intentar inicializar asyncpg o SQLite de forma segura
try:
    if "postgresql" in db_url:
        try:
            import asyncpg
            from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
            engine = create_async_engine(
                db_url,
                echo=settings.LOG_LEVEL == "debug",
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
            )
            AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        except ImportError:
            log.warning("⚠️ 'asyncpg' no está instalado. Los endpoints funcionarán en modo memoria/demostración.")
    elif "sqlite" in db_url:
        try:
            import aiosqlite
            from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
            engine = create_async_engine(db_url, connect_args={"check_same_thread": False})
            AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        except ImportError:
            log.warning("⚠️ 'aiosqlite' no está instalado. Ejecutando en modo memoria.")
except Exception as e:
    log.warning(f"No se pudo conectar a la base de datos externa: {e}. Modo seguro activo.")

async def get_db():
    """Dependency para inyectar sesión de base de datos en endpoints."""
    if AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Crea las tablas si no existen (uso en desarrollo).

    En producción se deben aplicar migraciones reales (Alembic).
    """
    if engine is None:
        log.warning("⚠️ Sin motor de BD configurado; no se crean tablas.")
        return
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("✅ Tablas de base de datos verificadas/creadas.")
