from fastapi import APIRouter
from app.schemas.schemas import (
    TutelaRequest,
    DerechoPeticionRequest,
    LiquidacionAlimentosRequest,
    ContratoArrendamientoRequest,
    ContratoServiciosRequest,
    OcrExtractRequest,
    PoderEspecialRequest,
    PromesaCompraventaRequest,
    ContratoObraRequest,
    ContratoComodatoRequest,
    AcuerdoConfidencialidadRequest,
    DivorcioMutuoAcuerdoRequest,
    LeasingRequest,
    FactoringRequest,
    FranquiciaRequest,
    OutsourcingRequest,
    JointVentureRequest,
    DocumentOut,
    OcrExtractResponse,
)
from app.services.document_generator import DocumentGeneratorService
from datetime import datetime

router = APIRouter()

@router.post("/tutela", response_model=DocumentOut, summary="Generar Acción de Tutela")
async def generate_tutela(req: TutelaRequest):
    content = DocumentGeneratorService.generate_tutela(req)
    return DocumentOut(
        id=1,
        document_type="tutela",
        title=f"Acción de Tutela contra {req.accionado_nombre}",
        content=content,
        created_at=datetime.utcnow()
    )

@router.post("/derecho-peticion", response_model=DocumentOut, summary="Generar Derecho de Petición")
async def generate_derecho_peticion(req: DerechoPeticionRequest):
    content = DocumentGeneratorService.generate_derecho_peticion(req)
    return DocumentOut(
        id=2,
        document_type="derecho_peticion",
        title=f"Derecho de Petición dirigido a {req.entidad_destinataria}",
        content=content,
        created_at=datetime.utcnow()
    )

@router.post("/arrendamiento", response_model=DocumentOut, summary="Generar Contrato de Arrendamiento (Ley 820/2003)")
async def generate_contrato_arrendamiento(req: ContratoArrendamientoRequest):
    content = DocumentGeneratorService.generate_contrato_arrendamiento(req)
    return DocumentOut(
        id=3,
        document_type="contrato_arrendamiento",
        title=f"Contrato de Arrendamiento - {req.inmueble_direccion}",
        content=content,
        created_at=datetime.utcnow()
    )

@router.post("/prestacion-servicios", response_model=DocumentOut, summary="Generar Contrato de Prestación de Servicios (Art. 34 CST)")
async def generate_contrato_servicios(req: ContratoServiciosRequest):
    content = DocumentGeneratorService.generate_contrato_servicios(req)
    return DocumentOut(
        id=4,
        document_type="contrato_servicios",
        title=f"Contrato de Prestación de Servicios - {req.contratista_nombre}",
        content=content,
        created_at=datetime.utcnow()
    )

@router.post("/liquidacion-alimentos", summary="Calcular Liquidación de Cuota de Alimentos (Ley 1098/2006 e ICBF)")
async def calculate_alimentos(req: LiquidacionAlimentosRequest):
    return DocumentGeneratorService.calculate_cuota_alimentos(req)

@router.post("/ocr-extract", response_model=OcrExtractResponse, summary="Extraer datos jurídicos y riesgos de texto o documento")
async def extract_ocr_data(req: OcrExtractRequest):
    return DocumentGeneratorService.extract_ocr_data(req)


@router.post("/poder-especial", response_model=DocumentOut, summary="Generar Poder Especial")
async def generate_poder(req: PoderEspecialRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_poder_especial(req)
    return {"title": "Poder Especial", "content": content, "disclaimer": "Borrador verificado por abogado antes de uso.", "document_type": "poder_especial"}


@router.post("/promesa-compraventa", response_model=DocumentOut, summary="Generar Promesa de Compraventa")
async def generate_promesa(req: PromesaCompraventaRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_promesa_compraventa(req)
    return {"title": "Promesa de Compraventa", "content": content, "disclaimer": "Borrador verificado por abogado antes de uso.", "document_type": "promesa_compraventa"}


@router.post("/contrato-obra", response_model=DocumentOut, summary="Generar Contrato de Obra")
async def generate_obra(req: ContratoObraRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_contrato_obra(req)
    return {"title": "Contrato de Obra", "content": content, "disclaimer": "Borrador verificado por abogado antes de uso.", "document_type": "contrato_obra"}


@router.post("/contrato-comodato", response_model=DocumentOut, summary="Generar Contrato de Comodato (préstamo de uso)")
async def generate_comodato(req: ContratoComodatoRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_contrato_comodato(req)
    return {"title": "Contrato de Comodato", "content": content, "disclaimer": "Borrador verificado por abogado antes de uso.", "document_type": "contrato_comodato"}


@router.post("/acuerdo-confidencialidad", response_model=DocumentOut, summary="Generar Acuerdo de Confidencialidad (NDA)")
async def generate_nda(req: AcuerdoConfidencialidadRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_acuerdo_confidencialidad(req)
    return {"title": "Acuerdo de Confidencialidad", "content": content, "disclaimer": "Borrador verificado por abogado antes de uso.", "document_type": "acuerdo_confidencialidad"}


@router.post("/divorcio-mutuo-acuerdo", response_model=DocumentOut, summary="Generar Solicitud de Divorcio por Mutuo Acuerdo")
async def generate_divorcio(req: DivorcioMutuoAcuerdoRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_divorcio_mutuo_acuerdo(req)
    return {"title": "Divorcio por Mutuo Acuerdo", "content": content, "disclaimer": "Borrador verificado por abogado antes de uso.", "document_type": "divorcio_mutuo_acuerdo"}


@router.post("/leasing", response_model=DocumentOut, summary="Generar Contrato de Arrendamiento Financiero (Leasing)")
async def generate_leasing(req: LeasingRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_leasing(req)
    return {"title": "Contrato de Leasing", "content": content, "document_type": "leasing", "disclaimer": "Borrador verificado por abogado antes de uso."}


@router.post("/factoring", response_model=DocumentOut, summary="Generar Contrato de Factoring (cesión de cartera)")
async def generate_factoring(req: FactoringRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_factoring(req)
    return {"title": "Contrato de Factoring", "content": content, "document_type": "factoring", "disclaimer": "Borrador verificado por abogado antes de uso."}


@router.post("/franquicia", response_model=DocumentOut, summary="Generar Contrato de Franquicia Comercial")
async def generate_franquicia(req: FranquiciaRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_franquicia(req)
    return {"title": "Contrato de Franquicia", "content": content, "document_type": "franquicia", "disclaimer": "Borrador verificado por abogado antes de uso."}


@router.post("/outsourcing", response_model=DocumentOut, summary="Generar Contrato de Outsourcing (tercerización)")
async def generate_outsourcing(req: OutsourcingRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_outsourcing(req)
    return {"title": "Contrato de Outsourcing", "content": content, "document_type": "outsourcing", "disclaimer": "Borrador verificado por abogado antes de uso."}


@router.post("/joint-venture", response_model=DocumentOut, summary="Generar Acuerdo de Joint Venture sin Sociedad")
async def generate_joint_venture(req: JointVentureRequest):
    from app.services.document_generator import DocumentGeneratorService as D
    content = D.generate_joint_venture(req)
    return {"title": "Joint Venture sin Sociedad", "content": content, "document_type": "joint-venture", "disclaimer": "Borrador verificado por abogado antes de uso."}
