from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.entities import UserRole, LawBranch, CaseStatus, PaymentStatus

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    document_type: Optional[str] = "CC"
    document_number: Optional[str] = None
    role: UserRole = UserRole.CLIENT

class UserCreate(UserBase):
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Lawyer Schemas ---
class LawyerProfileCreate(BaseModel):
    professional_card: str
    specialties: List[str]
    hourly_rate: Optional[float] = 150000.0

class LawyerProfileOut(BaseModel):
    id: int
    professional_card: str
    specialties: List[str]
    hourly_rate: float
    bonus_score: float
    cases_assigned_count: int
    cases_resolved_count: int
    is_available: bool

    class Config:
        from_attributes = True

# --- Classification & AI Schemas ---
class CaseClassificationRequest(BaseModel):
    description: str
    user_context: Optional[Dict[str, Any]] = None

# --- Multi-Branch Investigation Schemas ---
class RamaInvestigacionDetail(BaseModel):
    nombre_rama: str
    codigo_rama: str # constitucional, civil_comercial, laboral, penal, administrativo, familia
    icono: str
    viabilidad_score: int # 0 a 100
    nivel_prioridad: str # PREFERENTE, CONCURRENTE, SUBSIDIARIA, NO_APLICA
    fundamento_juridico: str
    normas_especificas: List[str]
    precedentes_altas_cortes: List[Dict[str, str]]
    accion_procesal_concreta: str
    autoridad_competente: str
    requisito_prejudicial: Optional[str] = None
    terminos_prescripcion_caducidad: str
    medidas_cautelares: Optional[str] = None

class ConcurrenciaAcciones(BaseModel):
    acciones_simultaneas_compatibles: List[str]
    acciones_incompatibles_excluyentes: List[str]
    via_preferente: str
    justificacion_prelacion: str

class FaseRutaEstrategica(BaseModel):
    fase: int
    titulo: str
    plazo: str
    acciones: List[str]
    entidad_o_despacho: str

class MultiBranchInvestigationResponse(BaseModel):
    caso_sintesis: str
    sujetos_implicados: List[str]
    ramas_investigadas: List[RamaInvestigacionDetail]
    rama_principal_recomendada: str
    matriz_concurrencia: ConcurrenciaAcciones
    ruta_procesal_fases: List[FaseRutaEstrategica]
    riesgos_y_blindaje: List[Dict[str, str]]
    dictamen_ejecutivo: str

class CaseClassificationResponse(BaseModel):
    branch: LawBranch
    confidence: float
    summary: str
    recommended_action: str
    urgency_level: str # ALTA, MEDIA, BAJA
    applicable_rights: List[str] # Ej: ["Derecho a la salud (Art. 49 C.P.)"]
    suggested_document: Optional[str] = None
    problema_juridico: Optional[str] = None
    marco_normativo: Optional[List[str]] = None
    jurisprudencia_relevante: Optional[List[Dict[str, str]]] = None # [{"sentencia": "T-760/08", "corte": "Corte Constitucional", "tesis": "..."}]
    test_procedibilidad: Optional[Dict[str, str]] = None # {"inmediatez": "...", "subsidiariedad": "..."}
    estrategia_procesal: Optional[Dict[str, Any]] = None # {"accion": "...", "despacho": "...", "pruebas": [...], "medida_cautelar": "..."}
    analisis_factico_detallado: Optional[Dict[str, Any]] = None # {"sujetos": [...], "temporalidades": [...], "hechos_cronologicos": [...], "afectaciones": [...]}
    hechos_desarrollados: Optional[List[Dict[str, Any]]] = None # [{"numero": 1, "titulo": "...", "descripcion_detallada": "...", "fecha_o_tiempo": "...", "sujetos": "...", "impacto_juridico": "..."}]
    pretensiones_partes: Optional[Dict[str, Any]] = None # {"demandante_principales": [...], "demandante_subsidiarias": [...], "demandado_excepciones": [...]}
    normas_sustantivas_especificas: Optional[List[Dict[str, str]]] = None # [{"cuerpo": "Código Civil", "articulos": "Arts. 1546 y 1602", "regla": "...", "aplicacion_caso": "..."}]
    problema_juridico_detallado: Optional[Dict[str, Any]] = None # {"pregunta_principal": "...", "subproblemas": [...], "criterio_decision": "..."}
    investigacion_multirrama: Optional[MultiBranchInvestigationResponse] = None

# --- Legal Case Schemas ---
class LegalCaseCreate(BaseModel):
    title: str
    description: str
    branch: LawBranch
    radicado_number: Optional[str] = None
    court_city: Optional[str] = None

class LegalCaseOut(BaseModel):
    id: int
    title: str
    description: str
    branch: LawBranch
    status: CaseStatus
    client_id: int
    assigned_lawyer_id: Optional[int]
    radicado_number: Optional[str]
    court_city: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Document Generation Schemas ---
class TutelaRequest(BaseModel):
    accionante_nombre: str
    accionante_identificacion: str
    accionante_ciudad: str
    accionante_direccion: str
    accionante_email: str
    accionado_nombre: str # Ej: EPS Sanitas, Secretaría de Salud
    derechos_vulnerados: List[str]
    hechos: List[str]
    pretensiones: List[str]
    medida_cautelar_urgente: Optional[bool] = False

class DerechoPeticionRequest(BaseModel):
    solicitante_nombre: str
    solicitante_identificacion: str
    solicitante_direccion: str
    solicitante_email: str
    entidad_destinataria: str
    objeto_peticion: str
    hechos: List[str]
    solicitud_especifica: List[str]
    fundamentos_legales: Optional[List[str]] = None

class LiquidacionAlimentosRequest(BaseModel):
    hijos_menores_cantidad: int
    ingreso_mensual_alimentante: float # Ingreso de quien debe cuota
    gastos_educacion: float = 0.0
    gastos_salud: float = 0.0
    gastos_alimentacion_vivienda: float = 0.0
    otros_gastos: float = 0.0
    tiene_otros_hijos: bool = False
    cantidad_otros_hijos: int = 0
    edades_hijos: Optional[List[int]] = None
    nombre_alimentante: Optional[str] = "El Alimentante"
    nombre_beneficiario: Optional[str] = "El Beneficiario / Menor"
    ciudad: Optional[str] = "Bogotá D.C."

class ContratoArrendamientoRequest(BaseModel):
    arrendador_nombre: str
    arrendador_identificacion: str
    arrendador_domicilio: str
    arrendatario_nombre: str
    arrendatario_identificacion: str
    arrendatario_domicilio: str
    inmueble_direccion: str
    inmueble_descripcion: str
    ciudad: str = "Bogotá D.C."
    canon_mensual: float
    deposito: Optional[float] = 0.0
    duracion_meses: int = 12
    fecha_inicio: str
    uso: str = "habitacional" # habitacional o comercial
    incluye_administracion: bool = False
    valor_administracion: Optional[float] = 0.0
    codeudor_nombre: Optional[str] = None
    codeudor_identificacion: Optional[str] = None

class ContratoServiciosRequest(BaseModel):
    contratante_nombre: str
    contratante_identificacion: str
    contratante_domicilio: str
    contratista_nombre: str
    contratista_identificacion: str
    contratista_domicilio: str
    objeto: str
    honorarios_mensuales: float
    duracion_meses: int
    lugar_ejecucion: str
    entregables: List[str]
    tiene_propiedad_intelectual: bool = True
    ciudad: str = "Bogotá D.C."

class OcrExtractRequest(BaseModel):
    document_text: Optional[str] = None
    image_base64: Optional[str] = None
    document_type: str = "generico" # cedula, contrato, acta, radicado, generico

class OcrExtractResponse(BaseModel):
    document_type: str
    extracted_data: Dict[str, Any]
    summary: str
    legal_risk_flags: Optional[List[str]] = []

class DocumentOut(BaseModel):
    id: Optional[int] = None
    document_type: str
    title: str
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Monitoring & Scraping Schemas ---
class ProcessQueryRequest(BaseModel):
    radicado: str = Field(..., min_length=15, max_length=35, description="Número de radicado judicial (23 dígitos, con o sin guiones)")

class ActuacionRecord(BaseModel):
    fecha: str
    actuacion: str
    anotacion: Optional[str] = None
    fecha_registro: Optional[str] = None
    fecha_inicial: Optional[str] = None
    fecha_final: Optional[str] = None
    es_reciente: bool = False

class ProcessQueryResponse(BaseModel):
    radicado: str
    despacho: str
    sujetos_procesales: str
    tipo_proceso: str
    actuaciones: List[ActuacionRecord]
    ultima_actuacion: Optional[ActuacionRecord] = None
    alerta_novedad: bool = False
    id_proceso: Optional[int] = None
    fecha_radicacion: Optional[str] = None
    fecha_ultima_actuacion: Optional[str] = None
    departamento: Optional[str] = None
    ciudad: Optional[str] = None
    es_consulta_real: bool = True
    estado_proceso: Optional[str] = "Activo en Despacho"
    desglose_radicado: Optional[Dict[str, Any]] = None
    resumen_juridico: Optional[str] = None
    total_actuaciones: int = 0


# --- Nuevas minutas (amplio espectro + contratos atípicos) ---
class PoderEspecialRequest(BaseModel):
    otorgante: str = ""
    otorgante_cc: str = ""
    otorgante_direccion: str = ""
    apoderado: str = ""
    apoderado_cc: str = ""
    apoderado_tarjeta: str = ""
    asunto: str = ""

class PromesaCompraventaRequest(BaseModel):
    vendedor: str = ""
    vendedor_cc: str = ""
    comprador: str = ""
    comprador_cc: str = ""
    inmueble_direccion: str = ""
    inmueble_matricula: str = ""
    precio: int = 0
    forma_pago: str = ""
    plazo_meses: int = 6
    arras: int = 0

class ContratoObraRequest(BaseModel):
    contratante: str = ""
    contratante_cc: str = ""
    contratista: str = ""
    contratista_cc: str = ""
    obra_descripcion: str = ""
    obra_ubicacion: str = ""
    valor: int = 0
    plazo_meses: int = 3
    anticipo_pct: float = 30.0

class ContratoComodatoRequest(BaseModel):
    comodante: str = ""
    comodante_cc: str = ""
    comodatario: str = ""
    comodatario_cc: str = ""
    bien_descripcion: str = ""
    uso_permitido: str = ""
    plazo_meses: int = 12

class AcuerdoConfidencialidadRequest(BaseModel):
    revelador: str = ""
    revelador_cc: str = ""
    receptor: str = ""
    receptor_cc: str = ""
    objeto: str = ""
    duracion_anios: int = 2

class DivorcioMutuoAcuerdoRequest(BaseModel):
    conyuge1: str = ""
    conyuge1_cc: str = ""
    conyuge2: str = ""
    conyuge2_cc: str = ""
    matrimonio_fecha: str = ""
    matrimonio_notaria: str = ""
    hijos: str = ""
    sociedad_conyugal: str = ""
    acuerdo_visitas: str = ""


# --- Contratos atípicos avanzados ---
class LeasingRequest(BaseModel):
    arrendador: str = ""
    arrendador_cc: str = ""
    arrendatario: str = ""
    arrendatario_cc: str = ""
    bien_descripcion: str = ""
    canon_mensual: int = 0
    plazo_meses: int = 36
    valor_opcion_compra: int = 0

class FactoringRequest(BaseModel):
    cedente: str = ""
    cedente_cc: str = ""
    factor: str = ""
    factor_cc: str = ""
    cartera_descripcion: str = ""
    valor_cartera: int = 0
    anticipo_pct: float = 80.0
    descuento_pct: float = 1.5

class FranquiciaRequest(BaseModel):
    franquiciante: str = ""
    franquiciante_cc: str = ""
    franquiciado: str = ""
    franquiciado_cc: str = ""
    marca: str = ""
    canon_inicial: int = 0
    regalias_pct: float = 5.0
    plazo_anios: int = 5
    territorio: str = ""

class OutsourcingRequest(BaseModel):
    contratante: str = ""
    contratante_cc: str = ""
    proveedor: str = ""
    proveedor_cc: str = ""
    servicios: str = ""
    sede: str = ""
    valor_mensual: int = 0
    plazo_meses: int = 12

class JointVentureRequest(BaseModel):
    parte1: str = ""
    parte1_cc: str = ""
    parte2: str = ""
    parte2_cc: str = ""
    proyecto: str = ""
    aporte1_pct: float = 50.0
    duracion_meses: int = 24
