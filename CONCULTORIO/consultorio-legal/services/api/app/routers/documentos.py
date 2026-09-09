"""Router de documentos legales generados por IA."""
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Usuario, Documento, Consulta
from app.schemas import DocumentoCreate, DocumentoResponse
from app.services.auth_service import get_current_user
from app.config import get_settings

router = APIRouter()
settings = get_settings()

DOCUMENT_AGENT_URL = "http://document-agent:8002"


@router.post("/generar", response_model=DocumentoResponse, status_code=201)
async def solicitar_documento(
    data: DocumentoCreate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Solicita la generación de un documento legal al document-agent."""
    # Verificar que la consulta pertenece al usuario
    result = await db.execute(select(Consulta).where(Consulta.id == data.consulta_id))
    consulta = result.scalar_one_or_none()
    if not consulta or consulta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    # Crear registro de documento
    documento = Documento(
        consulta_id=data.consulta_id,
        tipo_documento=data.tipo_documento,
        datos_formulario=data.datos_formulario,
        nombre_archivo=f"{data.tipo_documento.value}_{uuid.uuid4().hex[:8]}.pdf",
    )
    db.add(documento)
    await db.commit()
    await db.refresh(documento)

    # Llamar al document-agent en background
    async def generar_en_background(doc_id: uuid.UUID, tipo: str, datos: dict):
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                await client.post(
                    f"{DOCUMENT_AGENT_URL}/generar-{tipo.replace('_', '-')}",
                    json={"documento_id": str(doc_id), **datos},
                )
        except Exception as e:
            print(f"Error generando documento {doc_id}: {e}")

    background_tasks.add_task(
        generar_en_background,
        documento.id,
        data.tipo_documento.value,
        data.datos_formulario,
    )

    return DocumentoResponse.model_validate(documento)


@router.get("/{documento_id}", response_model=DocumentoResponse)
async def obtener_documento(
    documento_id: uuid.UUID,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene el estado y metadata de un documento."""
    result = await db.execute(select(Documento).where(Documento.id == documento_id))
    documento = result.scalar_one_or_none()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return DocumentoResponse.model_validate(documento)
