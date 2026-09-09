"""Modelos SQLAlchemy para la base de datos."""
import enum
import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Column, String, Boolean, DateTime, Numeric,
    Integer, Enum, Text, ForeignKey, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


# ─── Enums ───────────────────────────────────────────────────────────────────
class TipoUsuario(str, enum.Enum):
    ciudadano = "ciudadano"
    abogado   = "abogado"
    admin     = "admin"


class RamaDerecho(str, enum.Enum):
    penal          = "penal"
    civil          = "civil"
    laboral        = "laboral"
    familia        = "familia"
    administrativo = "administrativo"
    otro           = "otro"


class EstadoConsulta(str, enum.Enum):
    pendiente   = "pendiente"
    en_proceso  = "en_proceso"
    completada  = "completada"
    cancelada   = "cancelada"


class EstadoPago(str, enum.Enum):
    pendiente   = "pendiente"
    aprobado    = "aprobado"
    rechazado   = "rechazado"
    reembolsado = "reembolsado"


class TipoDocumento(str, enum.Enum):
    tutela                 = "tutela"
    derecho_peticion       = "derecho_peticion"
    contrato_arrendamiento = "contrato_arrendamiento"
    contrato_prestacion    = "contrato_prestacion"
    liquidacion_alimentos  = "liquidacion_alimentos"
    demanda                = "demanda"


# ─── Modelos ─────────────────────────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre           = Column(String(255), nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255))
    telefono         = Column(String(20))
    cedula           = Column(String(20), unique=True)
    tipo_usuario     = Column(Enum(TipoUsuario), nullable=False, default=TipoUsuario.ciudadano)
    activo           = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    consultas        = relationship("Consulta", back_populates="usuario", foreign_keys="Consulta.usuario_id")
    abogado          = relationship("Abogado", back_populates="usuario", uselist=False)
    pagos            = relationship("Pago", back_populates="usuario")
    procesos         = relationship("ProcesoMonitoreado", back_populates="usuario")


class Abogado(Base):
    __tablename__ = "abogados"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id          = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True)
    especialidades      = Column(ARRAY(String), default=[])
    disponible          = Column(Boolean, default=True)
    tarifa_consulta     = Column(Numeric(10, 2))
    tarjeta_profesional = Column(String(50))
    rating              = Column(Numeric(3, 2), default=0.00)
    total_consultas     = Column(Integer, default=0)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    usuario   = relationship("Usuario", back_populates="abogado")
    consultas = relationship("Consulta", back_populates="abogado", foreign_keys="Consulta.abogado_id")


class Consulta(Base):
    __tablename__ = "consultas"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id       = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"))
    abogado_id       = Column(UUID(as_uuid=True), ForeignKey("abogados.id"), nullable=True)
    rama_derecho     = Column(Enum(RamaDerecho))
    descripcion      = Column(Text, nullable=False)
    datos_adicionales = Column(JSONB, default={})
    estado           = Column(Enum(EstadoConsulta), default=EstadoConsulta.pendiente)
    prioridad        = Column(Integer, default=1)
    pro_bono         = Column(Boolean, default=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    usuario    = relationship("Usuario", back_populates="consultas", foreign_keys=[usuario_id])
    abogado    = relationship("Abogado", back_populates="consultas", foreign_keys=[abogado_id])
    documentos = relationship("Documento", back_populates="consulta")
    pagos      = relationship("Pago", back_populates="consulta")


class Documento(Base):
    __tablename__ = "documentos"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consulta_id      = Column(UUID(as_uuid=True), ForeignKey("consultas.id", ondelete="CASCADE"))
    tipo_documento   = Column(Enum(TipoDocumento), nullable=False)
    nombre_archivo   = Column(String(255))
    url_storage      = Column(String(500))
    datos_formulario = Column(JSONB, default={})
    generado_at      = Column(DateTime(timezone=True), server_default=func.now())

    consulta = relationship("Consulta", back_populates="documentos")


class Pago(Base):
    __tablename__ = "pagos"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id          = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"))
    consulta_id         = Column(UUID(as_uuid=True), ForeignKey("consultas.id"), nullable=True)
    monto               = Column(Numeric(10, 2), nullable=False)
    moneda              = Column(String(3), default="COP")
    estado              = Column(Enum(EstadoPago), default=EstadoPago.pendiente)
    referencia_wompi    = Column(String(255))
    referencia_interna  = Column(String(255), unique=True, default=lambda: str(uuid.uuid4()))
    metadatos           = Column(JSONB, default={})
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    usuario  = relationship("Usuario", back_populates="pagos")
    consulta = relationship("Consulta", back_populates="pagos")


class ProcesoMonitoreado(Base):
    __tablename__ = "procesos_monitoreados"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id        = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"))
    numero_radicado   = Column(String(100), nullable=False)
    tipo_proceso      = Column(String(100))
    entidad           = Column(String(100))
    ultimo_estado     = Column(Text)
    ultima_novedad_at = Column(DateTime(timezone=True))
    activo            = Column(Boolean, default=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    usuario  = relationship("Usuario", back_populates="procesos")
    alertas  = relationship("Alerta", back_populates="proceso")


class Alerta(Base):
    __tablename__ = "alertas"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"))
    proceso_id = Column(UUID(as_uuid=True), ForeignKey("procesos_monitoreados.id"), nullable=True)
    tipo_alerta = Column(String(50))
    mensaje    = Column(Text)
    enviada    = Column(Boolean, default=False)
    canal      = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    proceso = relationship("ProcesoMonitoreado", back_populates="alertas")
