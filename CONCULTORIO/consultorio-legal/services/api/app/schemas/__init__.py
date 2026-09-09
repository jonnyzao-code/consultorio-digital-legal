"""Schemas Pydantic para validación y serialización."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models import TipoUsuario, RamaDerecho, EstadoConsulta, EstadoPago, TipoDocumento


# ─── Auth / Usuario ──────────────────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    cedula: Optional[str] = None
    tipo_usuario: TipoUsuario = TipoUsuario.ciudadano

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class UsuarioResponse(BaseModel):
    id: uuid.UUID
    nombre: str
    email: str
    telefono: Optional[str]
    cedula: Optional[str]
    tipo_usuario: TipoUsuario
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UsuarioResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


# ─── Consulta ────────────────────────────────────────────────────────────────
class ConsultaCreate(BaseModel):
    descripcion: str
    rama_derecho: Optional[RamaDerecho] = None
    datos_adicionales: dict = {}
    pro_bono: bool = False


class ConsultaUpdate(BaseModel):
    estado: Optional[EstadoConsulta] = None
    abogado_id: Optional[uuid.UUID] = None
    rama_derecho: Optional[RamaDerecho] = None


class ConsultaResponse(BaseModel):
    id: uuid.UUID
    descripcion: str
    rama_derecho: Optional[RamaDerecho]
    estado: EstadoConsulta
    pro_bono: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ClasificarRequest(BaseModel):
    texto: str


class ClasificarResponse(BaseModel):
    rama: RamaDerecho
    confianza: float
    descripcion_rama: str
    acciones_recomendadas: list[str]
    documentos_sugeridos: list[str]


# ─── Documento ───────────────────────────────────────────────────────────────
class DocumentoCreate(BaseModel):
    consulta_id: uuid.UUID
    tipo_documento: TipoDocumento
    datos_formulario: dict = {}


class DocumentoResponse(BaseModel):
    id: uuid.UUID
    consulta_id: uuid.UUID
    tipo_documento: TipoDocumento
    nombre_archivo: Optional[str]
    url_storage: Optional[str]
    generado_at: datetime

    model_config = {"from_attributes": True}


# ─── Pago ────────────────────────────────────────────────────────────────────
class PagoCreate(BaseModel):
    consulta_id: uuid.UUID
    monto: float
    moneda: str = "COP"


class PagoResponse(BaseModel):
    id: uuid.UUID
    monto: float
    moneda: str
    estado: EstadoPago
    referencia_interna: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WompiWebhook(BaseModel):
    event: str
    data: dict
    environment: str
    signature: dict


# ─── Alertas ─────────────────────────────────────────────────────────────────
class ProcesoCreate(BaseModel):
    numero_radicado: str
    tipo_proceso: Optional[str] = None
    entidad: Optional[str] = None


class ProcesoResponse(BaseModel):
    id: uuid.UUID
    numero_radicado: str
    tipo_proceso: Optional[str]
    entidad: Optional[str]
    ultimo_estado: Optional[str]
    ultima_novedad_at: Optional[datetime]
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
