import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    CLIENT = "client"
    LAWYER = "lawyer"
    ADMIN = "admin"

class LawBranch(str, enum.Enum):
    CIVIL = "civil"
    PENAL = "penal"
    LABORAL = "laboral"
    FAMILIA = "familia"
    ADMINISTRATIVO = "administrativo"
    COMERCIAL = "comercial"

class CaseStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    document_type = Column(String(20), default="CC")
    document_number = Column(String(50), unique=True, index=True, nullable=True)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.CLIENT, nullable=False)
    email_verified = Column(Boolean, default=False)      # confirmación de correo (profesional)
    confirmation_token = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    cases_as_client = relationship("LegalCase", back_populates="client", foreign_keys="LegalCase.client_id")
    lawyer_profile = relationship("LawyerProfile", back_populates="user", uselist=False)
    payments = relationship("Payment", back_populates="user")

class LawyerProfile(Base):
    __tablename__ = "lawyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    professional_card = Column(String(50), unique=True, nullable=False) # Tarjeta profesional
    specialties = Column(JSON, default=list) # Ej: ["penal", "familia"]
    hourly_rate = Column(Float, default=150000.0) # COP
    bonus_score = Column(Float, default=100.0) # 60% objetivos + 40% cualitativo
    cases_assigned_count = Column(Integer, default=0)
    cases_resolved_count = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    rating_sum = Column(Float, default=0.0)      # sumatoria de valoraciones de clientes
    rating_count = Column(Integer, default=0)    # número de valoraciones recibidas

    user = relationship("User", back_populates="lawyer_profile")

class LegalCase(Base):
    __tablename__ = "legal_cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    branch = Column(Enum(LawBranch, values_callable=lambda x: [e.value for e in x]), nullable=False)
    status = Column(Enum(CaseStatus, values_callable=lambda x: [e.value for e in x]), default=CaseStatus.PENDING, nullable=False)
    
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_lawyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    radicado_number = Column(String(50), index=True, nullable=True) # Radicado Rama Judicial (23 dígitos)
    court_city = Column(String(100), nullable=True)
    case_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("User", back_populates="cases_as_client", foreign_keys=[client_id])
    assigned_lawyer = relationship("User", foreign_keys=[assigned_lawyer_id])
    documents = relationship("LegalDocument", back_populates="case")
    monitoring_records = relationship("ProcessMonitoring", back_populates="case")

class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.id"), nullable=True)
    document_type = Column(String(100), nullable=False) # tutela, derecho_peticion, contrato, liquidacion_alimentos
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False) # Texto o Markdown generado
    file_url = Column(String(500), nullable=True) # S3 o Supabase Storage path
    is_signed = Column(Boolean, default=False)
    signature_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("LegalCase", back_populates="documents")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reference = Column(String(100), unique=True, index=True, nullable=False)
    amount_in_cents = Column(Integer, nullable=False) # en centavos COP
    currency = Column(String(10), default="COP")
    status = Column(Enum(PaymentStatus, values_callable=lambda x: [e.value for e in x]), default=PaymentStatus.PENDING, nullable=False)
    payment_method = Column(String(50), nullable=True) # PSE, CARD, NEQUI
    wompi_transaction_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payments")

class ProcessMonitoring(Base):
    __tablename__ = "process_monitoring"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.id"), nullable=False)
    radicado = Column(String(50), index=True, nullable=False)
    last_actuacion_date = Column(DateTime, nullable=True)
    last_actuacion_text = Column(Text, nullable=True)
    anotacion = Column(Text, nullable=True)
    history_json = Column(JSON, default=list)
    has_alert = Column(Boolean, default=False)
    last_checked_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("LegalCase", back_populates="monitoring_records")

class UserHistory(Base):
    """Historial del usuario: procesos, alertas, sugerencias, documentos,
    recordatorios y asistencia (reposa la información del afiliado)."""
    __tablename__ = "user_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    kind = Column(String(50), nullable=False)   # proceso | alerta | sugerencia | documento | recordatorio | asistencia | pago
    title = Column(String(255), nullable=False)
    detail = Column(Text, nullable=True)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

