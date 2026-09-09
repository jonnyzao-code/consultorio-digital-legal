from fastapi import APIRouter
from app.services.bonus_engine import LawyerBonusEngine
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class BonusCalculationInput(BaseModel):
    casos_asignados: int = 15
    casos_resueltos: int = 14
    tiempo_promedio_respuesta_horas: float = 18.5
    calificacion_clientes_promedio: float = 4.8
    auditoria_legal_calidad: float = 4.7

@router.get("/", summary="Listar directorio de abogados disponibles")
async def list_lawyers():
    return [
        {
            "id": 1,
            "nombre": "Dra. Carolina Restrepo",
            "tarjeta_profesional": "TP-345892 CSJ",
            "especialidades": ["laboral", "seguridad_social"],
            "calificacion": 4.9,
            "casos_exitosos": 128,
            "disponible": True
        },
        {
            "id": 2,
            "nombre": "Dr. Andrés Felipe Gómez",
            "tarjeta_profesional": "TP-289410 CSJ",
            "especialidades": ["penal", "constitucional"],
            "calificacion": 4.8,
            "casos_exitosos": 94,
            "disponible": True
        },
        {
            "id": 3,
            "nombre": "Dra. Marcela Valencia",
            "tarjeta_profesional": "TP-412003 CSJ",
            "especialidades": ["familia", "civil"],
            "calificacion": 4.95,
            "casos_exitosos": 210,
            "disponible": True
        }
    ]

@router.post("/calculate-bonus", summary="Calcular bonificación con regla 60% objetivos + 40% cualitativo")
async def calculate_lawyer_bonus(data: BonusCalculationInput):
    return LawyerBonusEngine.calculate_bonus(
        casos_asignados=data.casos_asignados,
        casos_resueltos=data.casos_resueltos,
        tiempo_promedio_respuesta_horas=data.tiempo_promedio_respuesta_horas,
        calificacion_clientes_promedio=data.calificacion_clientes_promedio,
        auditoria_legal_calidad=data.auditoria_legal_calidad
    )
