"""
Motor de Bonificaciones y Evaluación de Abogados
Implementa la regla de negocio: 60% objetivos cuantitativos + 40% desempeño cualitativo
"""

class LawyerBonusEngine:
    @staticmethod
    def calculate_bonus(
        casos_asignados: int,
        casos_resueltos: int,
        tiempo_promedio_respuesta_horas: float,
        calificacion_clientes_promedio: float, # Escala 1.0 a 5.0
        auditoria_legal_calidad: float # Escala 1.0 a 5.0 (revisión de demandas y escritos)
    ) -> dict:
        """
        Calcula el score ponderado y el porcentaje de bonificación aplicable.
        """
        # 1. OBJETIVOS CUANTITATIVOS (60%)
        # a) Tasa de éxito/resolución (35%)
        tasa_resolucion = (casos_resueltos / max(1, casos_asignados)) if casos_asignados > 0 else 1.0
        score_resolucion = min(100.0, tasa_resolucion * 100.0)

        # b) Celeridad de respuesta (meta < 24 hrs = 100%, hasta 72 hrs) (25%)
        if tiempo_promedio_respuesta_horas <= 24.0:
            score_celeridad = 100.0
        elif tiempo_promedio_respuesta_horas <= 48.0:
            score_celeridad = 80.0
        elif tiempo_promedio_respuesta_horas <= 72.0:
            score_celeridad = 60.0
        else:
            score_celeridad = 30.0

        score_cuantitativo = (score_resolucion * 0.35) + (score_celeridad * 0.25)
        # Normalizado sobre base 60%:
        componente_cuantitativo_60 = (score_cuantitativo / 60.0) * 60.0

        # 2. EVALUACIÓN CUALITATIVA (40%)
        # a) Satisfacción de clientes (NPS / Calificación de 1 a 5) (20%)
        score_clientes = (calificacion_clientes_promedio / 5.0) * 100.0
        
        # b) Auditoría interna de calidad de documentos jurídicos (20%)
        score_auditoria = (auditoria_legal_calidad / 5.0) * 100.0

        score_cualitativo = (score_clientes * 0.20) + (score_auditoria * 0.20)
        componente_cualitativo_40 = (score_cualitativo / 40.0) * 40.0

        # TOTAL GLOBAL (0 - 100 puntos)
        score_total = round(componente_cuantitativo_60 + componente_cualitativo_40, 2)

        # Escala de bonificación sobre honorarios base
        if score_total >= 90.0:
            porcentaje_bono = 25.0 # 25% de bono extra
            nivel = "Excelente (Nivel Oro)"
        elif score_total >= 80.0:
            porcentaje_bono = 15.0 # 15% de bono
            nivel = "Sobresaliente (Nivel Plata)"
        elif score_total >= 70.0:
            porcentaje_bono = 10.0 # 10% de bono
            nivel = "Satisfactorio (Nivel Bronce)"
        else:
            porcentaje_bono = 0.0
            nivel = "En Plan de Mejora"

        return {
            "score_total": score_total,
            "nivel_desempeno": nivel,
            "porcentaje_bono_aplicable": porcentaje_bono,
            "desglose": {
                "componente_cuantitativo_60": round(componente_cuantitativo_60, 2),
                "componente_cualitativo_40": round(componente_cualitativo_40, 2),
                "tasa_resolucion_pct": round(tasa_resolucion * 100, 1),
                "tiempo_respuesta_promedio_hrs": tiempo_promedio_respuesta_horas,
                "satisfaccion_usuario_estrellas": calificacion_clientes_promedio,
                "auditoria_calidad_tecnica": auditoria_legal_calidad
            }
        }
