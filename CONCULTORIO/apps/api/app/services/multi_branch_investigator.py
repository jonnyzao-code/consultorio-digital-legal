"""
Servicio de Investigación Jurídica Multirrama Exhaustiva
Analiza controversias fácticas a través de las 6 ramas fundamentales del Derecho Colombiano:
1. Constitucional & Derechos Fundamentales
2. Civil & Comercial (Obligaciones, Contratos, Títulos Valores, Daño)
3. Laboral & Seguridad Social (Contratos, Fueros, Prestaciones)
4. Penal & Fiscalía General de la Nación (Delitos, Tipicidad, Querellas)
5. Administrativo & Autoridades de Vigilancia (SIC, SuperFinanciera, SuperSalud, Tránsito)
6. Familia & Protección de Menores
"""
import re
from typing import Dict, Any, List, Optional
from app.schemas.schemas import (
    RamaInvestigacionDetail, ConcurrenciaAcciones,
    FaseRutaEstrategica, MultiBranchInvestigationResponse
)
from app.services.fact_analyzer import FactCaseAnalyzer


class MultiBranchLegalInvestigator:
    @classmethod
    def investigate_case(cls, text: str, fact_data: Optional[Dict[str, Any]] = None) -> MultiBranchInvestigationResponse:
        """
        Realiza una investigación dogmática minuciosa y cruzada entre las ramas del derecho colombiano.
        """
        if not fact_data:
            fact_data = FactCaseAnalyzer.analyze_facts(text)

        materia = fact_data.get("materia", "civil_general")
        sujetos = fact_data.get("sujetos", [])
        montos = fact_data.get("montos", [])
        text_lower = text.lower()

        # Identificar contraparte principal
        sujeto_principal = "la contraparte denunciada / demandada"
        for s in sujetos:
            if any(k in s for k in ["Persona", "Entidad", "Empresa"]):
                sujeto_principal = s.split(":")[-1].strip()
                break

        monto_str = f"${montos[0]} COP" if montos else "monto a determinar pericialmente"

        # 1. Investigar cada rama
        ram_const = cls._investigate_constitucional(text_lower, materia, sujeto_principal, fact_data)
        ram_civil = cls._investigate_civil_comercial(text_lower, materia, sujeto_principal, monto_str, fact_data)
        ram_laboral = cls._investigate_laboral(text_lower, materia, sujeto_principal, fact_data)
        ram_penal = cls._investigate_penal(text_lower, materia, sujeto_principal, monto_str, fact_data)
        ram_admin = cls._investigate_administrativo_vigilancia(text_lower, materia, sujeto_principal, fact_data)
        ram_familia = cls._investigate_familia(text_lower, materia, sujeto_principal, fact_data)

        ramas = [ram_const, ram_civil, ram_laboral, ram_penal, ram_admin, ram_familia]

        # Ordenar ramas por viabilidad descendente
        ramas_ordenadas = sorted(ramas, key=lambda r: r.viabilidad_score, reverse=True)
        rama_top = ramas_ordenadas[0].nombre_rama

        # 2. Matriz de Concurrencia de Acciones
        concurrencia = cls._build_concurrence_matrix(ramas_ordenadas, sujeto_principal, materia)

        # 3. Ruta Estratégica Procesal (Fases)
        ruta_fases = cls._build_strategic_route(ramas_ordenadas, sujeto_principal, materia)

        # 4. Riesgos Procesales y Blindaje
        riesgos = cls._build_risk_safeguards(materia, sujeto_principal)

        # 5. Dictamen Ejecutivo
        dictamen = (
            f"Dictamen de Investigación Jurídica Cruzada: El caso fáctico compromete de forma principal la órbita de "
            f"'{rama_top}' (Viabilidad del {ramas_ordenadas[0].viabilidad_score}%), existiendo concurrencia procesal viable "
            f"con '{ramas_ordenadas[1].nombre_rama}' (Viabilidad del {ramas_ordenadas[1].viabilidad_score}%). "
            f"Se dictamina activar de inmediato la Fase I de reclamación prejudicial y medidas cautelares preventivas."
        )

        return MultiBranchInvestigationResponse(
            caso_sintesis=fact_data.get("texto_original", text)[:250] + "...",
            sujetos_implicados=sujetos,
            ramas_investigadas=ramas_ordenadas,
            rama_principal_recomendada=rama_top,
            matriz_concurrencia=concurrencia,
            ruta_procesal_fases=ruta_fases,
            riesgos_y_blindaje=riesgos,
            dictamen_ejecutivo=dictamen
        )

    @classmethod
    def _investigate_constitucional(cls, text_lower: str, materia: str, sujeto: str, facts: Dict[str, Any]) -> RamaInvestigacionDetail:
        score = 45
        prioridad = "SUBSIDIARIA"
        fundamento = "El ordenamiento constitucional colombiano consagra la Acción de Tutela (Art. 86 C.P.) bajo estricto principio de subsidiariedad."

        derechos = ["Debido Proceso (Art. 29 C.P.)", "Acceso a la Administración de Justicia (Art. 229 C.P.)", "Buena Fe (Art. 83 C.P.)"]
        sentencias = [
            {"sentencia": "Sentencia C-590/05", "corte": "Corte Constitucional", "tesis": "La procedibilidad de la tutela exige superar los requisitos generales de inmediatez y subsidiariedad."}
        ]

        if any(w in text_lower for w in ["salud", "eps", "medicamento", "cirug", "tratamiento", "enfermo", "urgencia"]):
            score = 98
            prioridad = "PREFERENTE"
            fundamento = f"Vulneración flagrante al derecho fundamental autónomo a la salud y a la vida en condiciones dignas frente a {sujeto}."
            derechos.extend(["Derecho a la Salud (Art. 49 C.P.)", "Vida en Condiciones Dignas (Art. 11 C.P.)"])
            sentencias = [
                {"sentencia": "Sentencia T-760/08", "corte": "Corte Constitucional", "tesis": "La salud es un derecho fundamental tutelable de manera inmediata sin que procedan trabas administrativas de las EPS."},
                {"sentencia": "Sentencia SU-508/20", "corte": "Corte Constitucional", "tesis": "Procede el suministro y tratamiento médico integral para evitar revictimización."}
            ]
        elif any(w in text_lower for w in ["despid", "incapacidad", "embarazo", "maternidad", "fuero", "cirugia"]):
            score = 92
            prioridad = "PREFERENTE"
            fundamento = f"Configuración de presunción de discriminación y vulneración del Fuero de Estabilidad Laboral Reforzada frente a {sujeto}."
            derechos.extend(["Derecho al Trabajo (Art. 25 C.P.)", "Estabilidad Laboral Reforzada (Art. 53 C.P.)", "Mínimo Vital (Art. 1 C.P.)"])
            sentencias = [
                {"sentencia": "Sentencia SU-067/23", "corte": "Corte Constitucional", "tesis": "Todo despido de persona con afectación de salud sin permiso ministerial se presume discriminatorio y habilita tutela directa."}
            ]
        elif any(w in text_lower for w in ["datacredito", "cifin", "reporte", "centrales", "banco", "report"]):
            score = 94
            prioridad = "PREFERENTE"
            fundamento = f"Vulneración al Habeas Data Financiero por reporte indebido o falta de comunicación previa obligatoria de 20 días."
            derechos.extend(["Habeas Data y Buen Nombre (Art. 15 C.P.)"])
            sentencias = [
                {"sentencia": "Sentencia C-282/21", "corte": "Corte Constitucional", "tesis": "La caducidad del dato negativo y la doble comunicación previa son de orden público constitucional."}
            ]
        elif any(w in text_lower for w in ["peticion", "reclamo", "solicitud", "responde", "silencio"]):
            score = 88
            prioridad = "CONCURRENTE"
            fundamento = f"Transgresión al núcleo esencial del Derecho Fundamental de Petición por vencimiento de términos legales de respuesta."
            derechos.extend(["Derecho de Petición (Art. 23 C.P. y Ley 1755 de 2015)"])
            sentencias = [
                {"sentencia": "Sentencia T-487/17", "corte": "Corte Constitucional", "tesis": "La respuesta al derecho de petición debe ser de fondo, clara, congruente y notificada efectivamente."}
            ]

        return RamaInvestigacionDetail(
            nombre_rama="Derecho Constitucional & Derechos Fundamentales",
            codigo_rama="constitucional",
            icono="🏛️",
            viabilidad_score=score,
            nivel_prioridad=prioridad,
            fundamento_juridico=fundamento,
            normas_especificas=["Constitución Política de Colombia (Arts. 11, 23, 29, 49, 86)", "Decreto 2591 de 1991 (Reglamentario de la Tutela)", "Ley 1755 de 2015 (Estatutaria de Petición)"],
            precedentes_altas_cortes=sentencias,
            accion_procesal_concreta=f"Acción de Tutela con solicitud de Medida Cautelar Provisional de Urgencia en contra de {sujeto}",
            autoridad_competente="Juzgado Municipal / Circuito de Reparto (Juez Constitucional)",
            requisito_prejudicial="No exige conciliación previa ni apoderado judicial; inmediatez acreditada dentro de los 6 meses.",
            terminos_prescripcion_caducidad="Término perentorio judicial de fallo en 10 días hábiles (Art. 86 C.P.). Inmediatez: 6 meses.",
            medidas_cautelares="Medida Cautelar Provisional de Urgencia en 48 horas (Art. 7 Decreto 2591 de 1991)."
        )

    @classmethod
    def _investigate_civil_comercial(cls, text_lower: str, materia: str, sujeto: str, monto: str, facts: Dict[str, Any]) -> RamaInvestigacionDetail:
        score = 60
        prioridad = "CONCURRENTE"
        fundamento = "El régimen de las obligaciones civiles y comerciales impone el cumplimiento estricto de lo pactado y el deber de indemnizar el daño antijurídico."

        if any(w in text_lower for w in ["compra", "carro", "vehiculo", "garantia", "falla", "danado", "vicio", "concesionario", "producto"]):
            score = 96
            prioridad = "PREFERENTE"
            fundamento = f"Responsabilidad civil contractual objetiva por garantía legal y vicios ocultos preexistentes atribuibles a {sujeto} (Ley 1480 de 2011 y Art. 1914 Código Civil)."
        elif any(w in text_lower for w in ["arriendo", "arrendatario", "inquilino", "canon", "local", "inmueble", "apartamento"]):
            score = 95
            prioridad = "PREFERENTE"
            fundamento = f"Incumplimiento contractual por mora continuada en el pago de cánones y causal de terminación judicial con restitución de inmueble arrendado."
        elif any(w in text_lower for w in ["debe", "prestamo", "letra", "pagare", "titulo", "plata", "deuda", "cobro"]):
            score = 94
            prioridad = "PREFERENTE"
            fundamento = f"Exigibilidad judicial de obligación dineraria insatisfecha clara, expresa y actualmente exigible en mora a cargo de {sujeto}."
        elif any(w in text_lower for w in ["accidente", "choque", "transito", "atropell", "estrell"]):
            score = 91
            prioridad = "PREFERENTE"
            fundamento = f"Responsabilidad civil extracontractual por actividad peligrosa de conducción vehicular (Art. 2356 Código Civil)."

        return RamaInvestigacionDetail(
            nombre_rama="Derecho Civil & Comercial (Obligaciones y Contratos)",
            codigo_rama="civil_comercial",
            icono="📜",
            viabilidad_score=score,
            nivel_prioridad=prioridad,
            fundamento_juridico=fundamento,
            normas_especificas=[
                "Código Civil Colombiano (Arts. 1494, 1546, 1602, 1613, 1614, 1914 y 2341)",
                "Código General del Proceso - Ley 1564 de 2012 (Arts. 82, 368, 384, 422 y 590)",
                "Código de Comercio (Arts. 822 y 870)",
                "Estatuto del Consumidor - Ley 1480 de 2011 (Arts. 5, 7, 8, 10, 11 y 58)"
            ],
            precedentes_altas_cortes=[
                {"sentencia": "Sentencia SC2107-2021", "corte": "Corte Suprema de Justicia - Sala Civil", "tesis": "El contratante cumplido tiene derecho irrenunciable a la resolución del negocio con indemnización integral de daño emergente y lucro cesante."},
                {"sentencia": "Sentencia SC-1230-2020", "corte": "Corte Suprema de Justicia - Sala Civil", "tesis": "En vicios redhibitorios la mala fe del vendedor se presume si por su profesión u oficio conocía los defectos del bien."}
            ],
            accion_procesal_concreta=f"Demanda Declarativa Verbal de Resolución Contractual o Proceso Ejecutivo de Cobro contra {sujeto}",
            autoridad_competente="Juzgado Civil Municipal o del Circuito (según cuantía del proceso)",
            requisito_prejudicial="Audiencia de Conciliación Prejudicial en Derecho obligatoria (Ley 2220 de 2022) o Reclamación Directa previa.",
            terminos_prescripcion_caducidad="Títulos valores: 3 años (Art. 789 C.Co.). Ordinaria civil: 5 años contractual / 10 años extracontractual (Art. 2536 C.C.).",
            medidas_cautelares="Embargo y secuestro preventivo de bienes muebles, inmuebles, vehículos y cuentas bancarias (Art. 590 CGP)."
        )

    @classmethod
    def _investigate_laboral(cls, text_lower: str, materia: str, sujeto: str, facts: Dict[str, Any]) -> RamaInvestigacionDetail:
        score = 25
        prioridad = "NO_APLICA"
        fundamento = "No se aprecian elementos típicos de subordinación laboral directa en la controversia primaria."

        if any(w in text_lower for w in ["trabaj", "empleo", "jefe", "empresa", "despid", "salario", "sueldo", "prestaciones", "liquidac", "contratista", "cst", "laboral"]):
            score = 93
            prioridad = "PREFERENTE"
            fundamento = f"Configuración de los tres elementos esenciales del contrato de trabajo frente a {sujeto} (subordinación, prestación personal y remuneración), operando el Principio de Primacía de la Realidad sobre las Formas (Art. 53 C.P. y Art. 23 C.S.T.)."

        return RamaInvestigacionDetail(
            nombre_rama="Derecho Laboral Individual & Seguridad Social",
            codigo_rama="laboral",
            icono="💼",
            viabilidad_score=score,
            nivel_prioridad=prioridad,
            fundamento_juridico=fundamento,
            normas_especificas=[
                "Código Sustantivo del Trabajo (Arts. 22, 23, 24, 64, 65, 127 y 186)",
                "Ley 361 de 1997 (Art. 26 - Fuero de Estabilidad de Salud)",
                "Código Procesal del Trabajo y de la Seguridad Social - CPTSS",
                "Ley 100 de 1993 y Decreto 1295 de 1994 (Sistema de Seguridad Social Integral)"
            ],
            precedentes_altas_cortes=[
                {"sentencia": "Sentencia SL1148-2022", "corte": "Corte Suprema de Justicia - Sala Laboral", "tesis": "La denominación dada por las partes a un contrato es irrelevante si en la práctica existió subordinación continuada y cumplimiento de horario."},
                {"sentencia": "Sentencia SL4480-2021", "corte": "Corte Suprema de Justicia - Sala Laboral", "tesis": "La sanción moratoria del Art. 65 del CST no es automática pero exige al empleador probar motivos serios de buena fe para exonerarse."}
            ],
            accion_procesal_concreta=f"Demanda Ordinaria Laboral de Primera Instancia en contra de {sujeto}",
            autoridad_competente="Juez Laboral del Circuito / Juzgado Municipal de Pequeñas Causas Laborales",
            requisito_prejudicial="Agotamiento facultativo de audiencia de conciliación ante Inspector de Trabajo del Ministerio del Trabajo.",
            terminos_prescripcion_caducidad="Prescripción trienal estricta: 3 años contados desde que la obligación laboral se hizo exigible (Art. 488 CST).",
            medidas_cautelares="Medida cautelar nominada de embargo de cuentas de la empresa demandada si se acredita insolvencia inminente."
        )

    @classmethod
    def _investigate_penal(cls, text_lower: str, materia: str, sujeto: str, monto: str, facts: Dict[str, Any]) -> RamaInvestigacionDetail:
        score = 20
        prioridad = "NO_APLICA"
        fundamento = "El conflicto fáctico se circunscribe inicialmente a un debate de incumplimiento civil o comercial, no punible penalmente (principio de ultima ratio)."

        delito_nom = "Delito contra el Patrimonio Económico"
        art_penal = "Art. 246 (Estafa)"

        if any(w in text_lower for w in ["estafa", "engano", "falso", "mentira", "ardid", "artificio", "fraude", "tumbaron", "plataforma falsa"]):
            score = 90
            prioridad = "CONCURRENTE"
            delito_nom = "Estafa Agravada por la Cuantía"
            art_penal = "Código Penal Art. 246"
            fundamento = f"Despliegue de artificios y maquinaciones fraudulentas por parte de {sujeto} con el propósito deliberado de inducir en error para obtener provecho patrimonial ilícito."
        elif any(w in text_lower for w in ["abuso de confianza", "se quedo", "no me devolvio", "se apropio"]):
            score = 85
            prioridad = "CONCURRENTE"
            delito_nom = "Abuso de Confianza Calificado"
            art_penal = "Código Penal Art. 249 y 250"
            fundamento = f"Apropiación indebida de bien mueble o dinero entregado por título no traslaticio de dominio a {sujeto}."
        elif any(w in text_lower for w in ["falsific", "firma falsa", "documento falso", "suplanto"]):
            score = 92
            prioridad = "PREFERENTE"
            delito_nom = "Falsedad Material o Ideológica en Documento Privado / Público"
            art_penal = "Código Penal Arts. 287 y 289"
            fundamento = f"Adulteración dolosa de documentos o falsedad de firma para defraudar la fe pública y el patrimonio del consultante."
        elif any(w in text_lower for w in ["hacker", "clonaron", "transferencia no autorizada", "cuenta vacia", "banca movil"]):
            score = 88
            prioridad = "PREFERENTE"
            delito_nom = "Hurto por Medios Informáticos y Transferencia No Consentida"
            art_penal = "Ley 1273 de 2009 (Código Penal Art. 269I)"
            fundamento = "Acceso abusivo a sistema informático y sustracción no autorizada de fondos de cuentas bancarias."
        elif any(w in text_lower for w in ["amenaz", "muerte", "extorsion", "vacuna"]):
            score = 95
            prioridad = "PREFERENTE"
            delito_nom = "Extorsión o Amenazas"
            art_penal = "Código Penal Art. 244 y 347"
            fundamento = "Constreñimiento ilegal mediante amenazas para exigir provecho ilícito económico."

        return RamaInvestigacionDetail(
            nombre_rama="Derecho Penal & Fiscalía General de la Nación",
            codigo_rama="penal",
            icono="⚖️",
            viabilidad_score=score,
            nivel_prioridad=prioridad,
            fundamento_juridico=fundamento,
            normas_especificas=[
                f"Código Penal Colombiano - Ley 599 de 2000 ({art_penal})",
                "Código de Procedimiento Penal - Ley 906 de 2004 (Arts. 66, 74, 102 y 137)",
                "Ley 1273 de 2009 (Delitos Informáticos y Protección de Datos)"
            ],
            precedentes_altas_cortes=[
                {"sentencia": "Sentencia SP289-2022", "corte": "Corte Suprema de Justicia - Sala de Casación Penal", "tesis": "En el delito de estafa el ardid o engaño debe ser antecedente o concomitante al negocio jurídico para distinguirlo del simple incumplimiento contractual civil."},
                {"sentencia": "Sentencia SP4121-2020", "corte": "Corte Suprema de Justicia - Sala de Casación Penal", "tesis": "La víctima tiene derecho irrestricto a la verdad, justicia y reparación integral en sede penal mediante incidente de reparación."}
            ],
            accion_procesal_concreta=f"Denuncia o Querella Penal formal ante la Fiscalía General de la Nación (SPOA / Plataforma 'A Denunciar') contra {sujeto}",
            autoridad_competente="Fiscalía General de la Nación (Unidad de Reacción Inmediata URI / Fiscalías Locales y Seccionales)",
            requisito_prejudicial="En delitos querellables (Art. 74 CPP): Audiencia de conciliación preprocesal ante Fiscal o Centro de Conciliación.",
            terminos_prescripcion_caducidad="Querella penal: Caducidad estricta de 6 meses desde el hecho. Delitos de oficio: Prescripción igual al máximo de la pena (Art. 83 CP).",
            medidas_cautelares="Medidas cautelares reales de comiso, embargo y suspensión del poder dispositivo sobre bienes muebles e inmuebles (Art. 97 CPP)."
        )

    @classmethod
    def _investigate_administrativo_vigilancia(cls, text_lower: str, materia: str, sujeto: str, facts: Dict[str, Any]) -> RamaInvestigacionDetail:
        score = 35
        prioridad = "SUBSIDIARIA"
        fundamento = "Procedencia de mecanismos administrativos de inspección, vigilancia y control ante entidades reguladoras del Estado."

        entidad = "Superintendencia de Industria y Comercio (SIC)"
        accion = f"Demanda Jurisdiccional de Protección al Consumidor ante la SIC contra {sujeto}"

        if any(w in text_lower for w in ["compra", "garantia", "producto", "carro", "vehiculo", "almacen", "concesionario", "falla"]):
            score = 95
            prioridad = "PREFERENTE"
            entidad = "Superintendencia de Industria y Comercio - Delegatura para Asuntos Jurisdiccionales (SIC)"
            accion = f"Demanda de Protección al Consumidor (Ley 1480/11) ante la SIC para ordenar devolución del dinero e imponer multas sucesivas a {sujeto}."
        elif any(w in text_lower for w in ["fotomulta", "comparendo", "transito", "simit", "camara", "infraccion"]):
            score = 96
            prioridad = "PREFERENTE"
            entidad = "Secretaría de Movilidad / Tránsito y Juzgados Administrativos"
            accion = f"Solicitud de Audiencia de Impugnación y Revocatoria Directa por violación al Principio de Responsabilidad Personal (Sentencia C-038/20)."
        elif any(w in text_lower for w in ["salud", "eps", "medicamento"]):
            score = 90
            prioridad = "CONCURRENTE"
            entidad = "Superintendencia Nacional de Salud (SuperSalud)"
            accion = f"Queja preferente ante SuperSalud para sanción pecuniaria institucional a {sujeto} por barreras de acceso."
        elif any(w in text_lower for w in ["banco", "tarjeta", "interes", "usura", "cuota de manejo"]):
            score = 88
            prioridad = "CONCURRENTE"
            entidad = "Superintendencia Financiera de Colombia (SFC)"
            accion = f"Queja formal ante la Delegatura del Consumidor Financiero de la SFC."

        return RamaInvestigacionDetail(
            nombre_rama="Derecho Administrativo & Vía de Vigilancia (Superintendencias)",
            codigo_rama="administrativo",
            icono="🏢",
            viabilidad_score=score,
            nivel_prioridad=prioridad,
            fundamento_juridico=f"Potestad sancionatoria e inspección del Estado a través de {entidad}.",
            normas_especificas=[
                "Código de Procedimiento Administrativo y de lo Contencioso Administrativo - CPACA (Ley 1437 de 2011)",
                "Ley 1480 de 2011 (Estatuto del Consumidor - Facultades Jurisdiccionales SIC)",
                "Ley 1843 de 2017 y Decreto 019 de 2012 (Régimen de Tránsito y Cámaras Salvavidas)"
            ],
            precedentes_altas_cortes=[
                {"sentencia": "Sentencia C-038 de 2020", "corte": "Corte Constitucional", "tesis": "La fotomulta no puede imponerse objetivamente al propietario del vehículo sin identificar plenamente al conductor infractor."},
                {"sentencia": "Sentencia C-114 de 2017", "corte": "Corte Constitucional", "tesis": "Las facultades judiciales de las Superintendencias garantizan tutela judicial efectiva célere y especializada."}
            ],
            accion_procesal_concreta=accion,
            autoridad_competente=entidad,
            requisito_prejudicial="Reclamación directa previa por escrito al proveedor o entidad con constancia de radicación (15 días hábiles).",
            terminos_prescripcion_caducidad="Acción de protección al consumidor SIC: 1 año tras vencimiento de garantía. Medio de control de nulidad y restablecimiento: 4 meses.",
            medidas_cautelares="Medidas cautelares preventivas de retiro del bien del mercado o suspensión provisional de cobro."
        )

    @classmethod
    def _investigate_familia(cls, text_lower: str, materia: str, sujeto: str, facts: Dict[str, Any]) -> RamaInvestigacionDetail:
        score = 15
        prioridad = "NO_APLICA"
        fundamento = "El asunto fáctico no compromete relaciones del orden conyugal, parental ni de protección prioritaria de menores de edad."

        if any(w in text_lower for w in ["hijo", "alimento", "cuota alimentaria", "icbf", "menor", "custodia", "visitas", "divorcio", "separacion", "patria potestad"]):
            score = 96
            prioridad = "PREFERENTE"
            fundamento = f"Transgresión al Principio del Interés Superior del Menor de edad y deber alimentario indelegable de {sujeto} (Ley 1098 de 2006)."

        return RamaInvestigacionDetail(
            nombre_rama="Derecho de Familia & Protección Integral de Niños y Adolescentes",
            codigo_rama="familia",
            icono="👶",
            viabilidad_score=score,
            nivel_prioridad=prioridad,
            fundamento_juridico=fundamento,
            normas_especificas=[
                "Código de la Infancia y la Adolescencia - Ley 1098 de 2006 (Arts. 24, 129 y 130)",
                "Código Civil Colombiano (Arts. 411 y siguientes - De los Alimentos que se Deben por Ley)",
                "Ley 2097 de 2021 (Registro de Deudores Alimentarios Morosos - REDAM)",
                "Código General del Proceso (Art. 390 - Fijación de Alimentos Verbal Sumario)"
            ],
            precedentes_altas_cortes=[
                {"sentencia": "Sentencia SC-14673-2016", "corte": "Corte Suprema de Justicia - Sala Civil y de Familia", "tesis": "La cuota de alimentos comprende sustento, habitación, vestido, asistencia médica, recreación, educación e instrucción básica."},
                {"sentencia": "Sentencia C-257/15", "corte": "Corte Constitucional", "tesis": "El embargo preventivo para alimentos tiene prelación sobre cualquier otro crédito y puede afectar hasta el 50% de ingresos brutos."}
            ],
            accion_procesal_concreta=f"Demanda de Fijación y Aumento de Cuota Alimentaria y Medidas Cautelares contra {sujeto}",
            autoridad_competente="Juzgado de Familia / Juzgado Promiscuo Municipal / Defensoría de Familia del ICBF",
            requisito_prejudicial="Audiencia de Conciliación previa obligatoria ante Comisaría de Familia, Centro Zonal ICBF o Centro de Conciliación.",
            terminos_prescripcion_caducidad="Imprescriptible en el derecho al reclamo futuro. Cuotas alimentarias causadas y no pagadas: 5 años.",
            medidas_cautelares="Embargo y retención de hasta el 50% de salarios, cesantías y primas, e impedimento de salida del país (Art. 130 Ley 1098/06)."
        )

    @classmethod
    def _build_concurrence_matrix(cls, ramas_ordenadas: List[RamaInvestigacionDetail], sujeto: str, materia: str) -> ConcurrenciaAcciones:
        compatibles = []
        excluyentes = []

        top_rama = ramas_ordenadas[0]
        second_rama = ramas_ordenadas[1]

        # Reglas dogmáticas de concurrencia en Colombia
        if top_rama.codigo_rama == "constitucional":
            compatibles.append("Acción de Tutela para frenar el perjuicio irremediable (vía rápida de 10 días).")
            compatibles.append(f"Reclamación directa por escrito y queja sancionatoria ante Superintendencia correspondiente contra {sujeto}.")
            excluyentes.append("Demandar simultáneamente la misma pretensión económica definitiva en Tutela si existe proceso ordinario sin acreditar perjuicio irremediable.")
        elif top_rama.codigo_rama == "civil_comercial":
            compatibles.append("Audiencia de Conciliación Prejudicial en Derecho (Ley 2220 de 2022).")
            compatibles.append("Solicitud de Medidas Cautelares Previas de Embargo de Cuentas y Bienes (Art. 590 CGP).")
            if second_rama.codigo_rama == "penal" and second_rama.viabilidad_score >= 70:
                compatibles.append("Denuncia Penal simultánea por Estafa o Fraude Procesal ante la Fiscalía General de la Nación.")
            excluyentes.append("Pretender cobro ejecutivo coactivo sin tener un título valor que reúna los requisitos de ser claro, expreso y actualmente exigible (Art. 422 CGP).")
        elif top_rama.codigo_rama == "laboral":
            compatibles.append("Acción de Tutela Transitoria para reintegro inmediato por Fuero de Salud / Debilidad Manifiesta.")
            compatibles.append("Demanda Ordinaria Laboral para cobro de salarios caídos, prestaciones sociales e indemnizaciones sancionatorias.")
            excluyentes.append("Aceptar conciliación laboral por debajo de los derechos ciertos e indiscutibles (Art. 53 C.P.).")
        else:
            compatibles.append("Reclamación previa y agotamiento de la vía gubernativa o de conciliación.")
            compatibles.append("Demanda judicial de fondo ante la jurisdicción competente.")
            excluyentes.append("Interponer recursos extemporáneos que convaliden la decisión administrativa.")

        return ConcurrenciaAcciones(
            acciones_simultaneas_compatibles=compatibles,
            acciones_incompatibles_excluyentes=excluyentes,
            via_preferente=f"{top_rama.nombre_rama} ({top_rama.accion_procesal_concreta})",
            justificacion_prelacion=(
                f"La vía de '{top_rama.nombre_rama}' ostenta la mayor solidez probatoria y celeridad procesal ({top_rama.viabilidad_score}%), "
                f"permitiendo medidas cautelares efectivas y la protección de los derechos sustanciales de la parte consultante."
            )
        )

    @classmethod
    def _build_strategic_route(cls, ramas_ordenadas: List[RamaInvestigacionDetail], sujeto: str, materia: str) -> List[FaseRutaEstrategica]:
        top = ramas_ordenadas[0]
        return [
            FaseRutaEstrategica(
                fase=1,
                titulo="Fase I: Diligenciamiento Prejudicial, Reclamación Formal y Blindaje Probatorio",
                plazo="Día 1 a Día 10",
                acciones=[
                    f"Remisión de Reclamación Directa / Derecho de Petición certificado a {sujeto} constituyendo en mora formal.",
                    "Recolección, custodia e indexación de evidencias documentales, chats certificados, comprobantes bancarios e historias clínicas.",
                    f"Solicitud de Audiencia de Conciliación Prejudicial en Derecho ante Centro Autorizado (requisito de procedibilidad)."
                ],
                entidad_o_despacho="Centro de Conciliación en Derecho o Domicilio de la Contraparte"
            ),
            FaseRutaEstrategica(
                fase=2,
                titulo="Fase II: Interposición de Medidas Cautelares de Urgencia y Radicación Judicial",
                plazo="Día 11 a Día 25",
                acciones=[
                    f"Solicitud e imposición de Medidas Cautelares preventivas de embargo de cuentas y bienes de {sujeto} para evitar alzamiento de bienes.",
                    f"Radicación formal de la {top.accion_procesal_concreta}.",
                    "Seguimiento al reparto judicial electrónico para vigilar el auto admisorio de la demanda o auto de tutela."
                ],
                entidad_o_despacho=top.autoridad_competente
            ),
            FaseRutaEstrategica(
                fase=3,
                titulo="Fase III: Debate Probatorio, Sentencia Judicial y Cobro Coactivo",
                plazo="Día 26 en adelante",
                acciones=[
                    "Comparecencia a audiencia inicial y de juzgamiento (Art. 372 y 373 del CGP o trámite de tutela).",
                    "Interrogatorio de parte a la contraparte y práctica de dictámenes periciales sobre los perjuicios materiales.",
                    "Ejecución coactiva de la sentencia judicial y remate de bienes embargados para pago efectivo de la condena."
                ],
                entidad_o_despacho="Juez de Conocimiento en audiencia pública"
            )
        ]

    @classmethod
    def _build_risk_safeguards(cls, materia: str, sujeto: str) -> List[Dict[str, str]]:
        return [
            {
                "riesgo": f"Excepción de Fuerza Mayor, Caso Fortuito o Culpa Exclusiva alegada por {sujeto}",
                "impacto": "Pretensión de la contraparte de exonerarse de toda responsabilidad contractual o patrimonial.",
                "estrategia_blindaje": "Acreditar con documentos y contratos que el evento era previsible dentro del riesgo del negocio o que el consultante obró con estricta diligencia de buen padre de familia."
            },
            {
                "riesgo": "Excepción de Inexistencia de Título Ejecutivo o Falta de Exigibilidad",
                "impacto": "Rechazo del mandamiento de pago si se tramita como ejecutivo sin cumplir los presupuestos del Art. 422 CGP.",
                "estrategia_blindaje": "Incoar subsidiariamente la acción declarativa verbal para que el juez declare la existencia de la obligación si el título presenta deficiencias formales."
            },
            {
                "riesgo": "Prescripción Extintiva o Caducidad de la Acción",
                "impacto": "Pérdida definitiva del derecho a demandar judicialmente por el paso del tiempo.",
                "estrategia_blindaje": "Interrumpir legalmente la prescripción por una sola vez mediante requerimiento escrito privado o radicación de la solicitud de conciliación prejudicial (Art. 2544 C.C. y Ley 2220 de 2022)."
            }
        ]

