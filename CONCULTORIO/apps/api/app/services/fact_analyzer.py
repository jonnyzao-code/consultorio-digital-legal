"""
Motor de Análisis Fáctico y Subsunción Dogmática Especializada (Colombia)
Extrae hechos reales, personas, empresas, entidades, fechas, sumas de dinero,
y genera un análisis de subsunción hecho por hecho con fundamento en la normatividad colombiana.
"""
import re
from typing import Dict, Any, List

class FactCaseAnalyzer:
    @staticmethod
    def analyze_facts(text: str) -> Dict[str, Any]:
        text_clean = text.strip()
        
        # 1. Separar en oraciones significativas preservando el orden fáctico
        raw_sentences = [
            s.strip() for s in re.split(r'[\.\n;]+', text_clean) 
            if len(s.strip()) > 8
        ]
        if not raw_sentences:
            raw_sentences = [text_clean]

        # 2. Extracción de Nombres Propios de Personas (ej. Pedro Pérez, Carlos Gómez)
        personas = []
        persona_matches = re.findall(
            r'\b(?:a|con|de|señor|señora|don|doña|por|hacia|contra|ciudadano|empleado|trabajador)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})',
            text
        )
        for p in persona_matches:
            p_clean = p.strip()
            if not any(stop in p_clean.lower() for stop in [
                "colombia", "bogot", "medell", "cali", "barranquilla", "bucaramanga", "pereira",
                "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", 
                "septiembre", "octubre", "noviembre", "diciembre", "constituci", "codigo", "juzgado",
                "fiscalia", "corte", "tutela", "tribunal", "ley", "decreto"
            ]):
                personas.append(p_clean)

        # 3. Extracción de Empresas, Entidades y Bancos
        empresas = []
        # Empresas comerciales con sufijo societario
        emp_matches = re.findall(
            r'([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]{3,35}\s+(?:S\.?A\.?S\.?|S\.?A\.?|LTDA\.?|E\.?U\.?|INC\.?))', 
            text, re.IGNORECASE
        )
        for emp in emp_matches:
            empresas.append(emp.strip())

        # Entidades públicas, de salud y financieras frecuentes en Colombia
        entidades_conocidas = [
            ("EPS Sanitas", ["sanitas"]),
            ("Nueva EPS", ["nueva eps"]),
            ("Sura EPS", ["sura"]),
            ("Compensar", ["compensar"]),
            ("Salud Total", ["salud total"]),
            ("Famisanar", ["famisanar"]),
            ("Bancolombia", ["bancolombia"]),
            ("Banco de Bogotá", ["banco de bogot"]),
            ("Davivienda", ["davivienda"]),
            ("Banco Falabella", ["falabella"]),
            ("Datacrédito (Experian)", ["datacredito", "datacrédito"]),
            ("TransUnion (Cifin)", ["transunion", "cifin"]),
            ("Fiscalía General de la Nación", ["fiscalia", "fiscalía", "uri", "spoa"]),
            ("Ministerio del Trabajo", ["ministerio de trabajo", "ministerio del trabajo", "mintrabajo"]),
            ("Superintendencia de Industria y Comercio (SIC)", ["sic", "superintendencia de industria"]),
            ("Superintendencia de Servicios Públicos", ["superservicios", "superintendencia de servicios"]),
            ("Secretaría de Movilidad / Tránsito", ["transito", "tránsito", "movilidad", "fotomulta"]),
            ("Alcaldía Municipal", ["alcaldia", "alcaldía"]),
            ("DIAN", ["dian", "impuestos nacionales"]),
            ("Instituto Colombiano de Bienestar Familiar (ICBF)", ["icbf", "bienestar familiar"]),
            ("Comisaría de Familia", ["comisaria", "comisaría de familia"])
        ]
        text_lower_search = text.lower()
        for ent_name, tokens in entidades_conocidas:
            if any(tok in text_lower_search for tok in tokens):
                empresas.append(ent_name)

        # 4. Extracción de Fechas y Tiempos
        tiempos = []
        tiempo_patterns = [
            r'(\d{1,2}\s+de\s+[A-Za-z]+\s*(?:de\s+\d{4})?)',
            r'(\d+\s*(?:d[ií]as|meses|a[ñn]os|semanas|horas))',
            r'\b(ayer|hoy|anoche|la semana pasada|el mes pasado|hace\s+[0-9A-Za-z\s]+)\b',
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})'
        ]
        for pat in tiempo_patterns:
            matches = re.findall(pat, text, re.IGNORECASE)
            for m in matches:
                if len(m.strip()) > 2 and m.strip().lower() not in ["de", "la", "el", "un", "una"]:
                    tiempos.append(m.strip())

        # 5. Extracción de Montos Económicos
        montos = re.findall(
            r'(?:[\$]|pesos|cop)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:\s*(?:millones|mil|pesos|cop))?|\d+\s*millones)', 
            text, re.IGNORECASE
        )
        montos_limpios = [
            m.strip() for m in montos 
            if any(c.isdigit() for c in m) and len(m.strip()) >= 3 and m.strip() not in ["1991", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]
        ]

        # 6. Detección Inteligente de Materia y Submateria Fáctica
        desc_lower = text.lower()

        # Ponderación por palabras clave en el contexto jurídico colombiano
        scores = {
            "salud": sum(1 for w in ["salud", "eps", "ips", "cirug", "medicamento", "cita", "especialista", "tratamiento", "enfermedad", "diagnostico", "medico", "urgencia", "clinica", "hospital", "biopsia", "quimio"] if w in desc_lower) * 2,
            "laboral_estabilidad": sum(1 for w in ["despido", "despidieron", "echaron", "terminaron el contrato"] if w in desc_lower) * 2 + sum(1 for w in ["incapacidad", "incapacitado", "enfermo", "embarazo", "embarazada", "prepensionado", "accidente de trabajo", "arl"] if w in desc_lower) * 3,
            "laboral_ordinario": sum(1 for w in ["laboral", "empleador", "patron", "jefe", "empresa", "trabajo", "sueldo", "salario", "liquidaci", "cesant", "prima", "horas extras", "acoso laboral", "sin justa causa"] if w in desc_lower) * 2,
            "familia_alimentos": sum(1 for w in ["alimento", "cuota", "hijo", "hija", "menor", "niño", "niña", "manutencion", "gasto escolar", "comida"] if w in desc_lower) * 3,
            "familia_divorcio": sum(1 for w in ["divorcio", "separacion", "conyuge", "esposo", "esposa", "custodia", "visitas", "patria potestad", "bienes conyugales"] if w in desc_lower) * 2,
            "civil_arrendamiento": sum(1 for w in ["arriendo", "arrendamiento", "inquilino", "arrendador", "canon", "alquiler", "restitucion", "desalojo", "inmueble", "apartamento", "local"] if w in desc_lower) * 3,
            "civil_deudas": sum(1 for w in ["pagar", "pagare", "letra", "deuda", "debe", "prestamo", "preste", "titulo valor", "cheque", "intereses", "cobro", "embargo de sueldo", "le preste"] if w in desc_lower) * 3,
            "civil_compraventa": sum(1 for w in ["compraventa", "promesa", "compre", "vendi", "comprador", "vendedor", "escritura", "notaria", "arras", "clausula penal", "carro", "vehiculo", "lote", "casa"] if w in desc_lower) * 2,
            "consumidor_garantia": sum(1 for w in ["garantia", "garantía", "defecto", "dañado", "descompuesto", "almacen", "tienda", "factura", "producto", "electrodomestico", "reparacion", "sic", "devolucion de dinero"] if w in desc_lower) * 3,
            "habeas_data": sum(1 for w in ["datacredito", "datacrédito", "cifin", "transunion", "reporte negativo", "centrales de riesgo", "score", "credito rechazado", "borron y cuenta nueva", "suplantacion"] if w in desc_lower) * 4,
            "servicios_publicos": sum(1 for w in ["recibo", "factura de la luz", "energia", "acueducto", "agua", "gas", "cobro excesivo", "corte del servicio", "suspension del servicio", "empresas publicas"] if w in desc_lower) * 3,
            "transito_accidente": sum(1 for w in ["accidente de transito", "choque", "estrellaron", "soat", "croquis", "ipat", "fotomulta", "comparendo", "simit", "transito", "movilidad"] if w in desc_lower) * 3,
            "penal_estafa": sum(1 for w in ["estafa", "robo", "hurto", "engañaron", "fraude", "transferencia no autorizada", "consigne", "ficticio", "consignacion", "piramide"] if w in desc_lower) * 3,
            "penal_amenazas": sum(1 for w in ["amenaza", "amenazaron", "violencia", "golpe", "lesiones", "miedo", "fiscalia", "denuncia penal"] if w in desc_lower) * 3,
            "derecho_peticion": sum(1 for w in ["derecho de peticion", "peticion", "no me responden", "carta", "solicitud", "silencio", "radicado", "no contestan"] if w in desc_lower) * 3,
            "vecindad_policia": sum(1 for w in ["vecino", "ruido", "musica alta", "humedad", "perro", "mascota", "insultos", "codigo de policia", "inspeccion de policia"] if w in desc_lower) * 3
        }

        # Determinar la categoría con mayor puntaje
        materia = max(scores, key=scores.get)
        if scores[materia] == 0:
            materia = "civil_general"

        # 7. Conformación de Sujetos Procesales
        sujetos_finales = []
        if personas:
            sujetos_finales.extend([f"Persona: {p}" for p in sorted(list(set(personas)))[:3]])
        if empresas:
            sujetos_finales.extend([f"Entidad/Empresa: {e}" for e in sorted(list(set(empresas)))[:3]])
        if not sujetos_finales:
            sujetos_finales = ["Parte Solicitante / Víctima", "Contraparte mencionada en los hechos"]

        # 8. ANÁLISIS DE SUBSUNCIÓN FÁCTICA INDIVIDUAL (HECHO POR HECHO)
        # Relaciona cada frase narrada por el ciudadano con su valor probatorio y norma legal
        subsunción_por_hecho = []
        for i, sentence in enumerate(raw_sentences[:6]):
            s_clean = sentence.strip()
            s_low = s_clean.lower()
            
            # Calificación jurídica automática de cada hecho particular
            if any(w in s_low for w in ["datacredito", "datacrédito", "cifin", "centrales", "reporte negativo", "score"]):
                calificacion = "Vulneración al Habeas Data Financiero y debido proceso de reporte previo"
                norma = "Ley Estatutaria 1266 de 2008 y Ley 2157 de 2021 (Borrón y Cuenta Nueva)"
                prueba = "Consulta de historial crediticio y derecho de petición previo"
            elif any(w in s_low for w in ["garantia", "garantía", "dañado", "defectuoso", "calidad", "no sirve", "fundi"]):
                calificacion = "Falla de calidad e idoneidad del bien o servicio prestado (Estatuto del Consumidor)"
                norma = "Estatuto del Consumidor (Ley 1480 de 2011 Art. 7 y 11)"
                prueba = "Factura de compra y constancias de reporte ante servicio técnico o vendedor"
            elif any(w in s_low for w in ["despido", "echaron", "terminaron el contrato", "notificaron carta"]):
                calificacion = "Ruptura unilateral del vínculo contractual laboral"
                norma = "CST Art. 64 / Ley 361 de 1997 Art. 26"
                prueba = "Carta de terminación / Notificación de despido"
            elif any(w in s_low for w in ["incapacidad", "diagnostico", "medico", "salud", "enfermo", "cirug", "insulina", "medicamento"]):
                calificacion = "Condición de debilidad manifiesta y vulneración del derecho a la salud"
                norma = "Art. 49 C.P. y Ley Estatutaria de Salud 1751 de 2015"
                prueba = "Historia clínica y certificaciones médicas expedidas por médico tratante"
            elif any(w in s_low for w in ["hijo", "menor", "niño", "niña", "alimento", "colegio", "pensión"]):
                calificacion = "Garantía de derechos prevalentes de menores y mínimo vital de alimentos"
                norma = "Código de Infancia y Adolescencia (Ley 1098 de 2006 Art. 24 y 129)"
                prueba = "Registro Civil de Nacimiento y relación detallada de gastos del menor"
            elif any(w in s_low for w in ["arriendo", "inquilino", "canon", "arrendatario", "desalojo", "desocup"]):
                calificacion = "Incumplimiento de las obligaciones contractuales de tenencia y pago"
                norma = "Ley 820 de 2003 Art. 22"
                prueba = "Contrato de arrendamiento y certificación de no pago del canon"
            elif any(w in s_low for w in ["estafa", "engañ", "falso", "mentira", "fraude"]):
                calificacion = "Despliegue de artificios y ardides constitutivos de defraudación patrimonial"
                norma = "Código Penal Colombiano Art. 246 (Estafa)"
                prueba = "Comprobantes de transferencia y capturas de conversaciones"
            elif any(w in s_low for w in ["fotomulta", "comparendo", "transito", "simit"]):
                calificacion = "Vulneración al principio de responsabilidad personal del conductor"
                norma = "Sentencia C-038 de 2020 y C-321 de 2022 de la Corte Constitucional"
                prueba = "Orden de comparendo y certificación de no conducción personal"
            elif any(w in s_low for w in ["debe", "plata", "pesos", "prest", "pagar", "letra", "titulo valor"]):
                calificacion = "Exigibilidad de obligación dineraria insatisfecha en mora"
                norma = "Código General del Proceso Art. 422 y Código Civil Art. 1608"
                prueba = "Título valor, pagaré, extracto bancario o recibo de transferencia"
            else:
                calificacion = "Circunstancia fáctica configurativa de afectación a derecho sustantivo"
                norma = "Constitución Política de Colombia (Arts. 2, 29 y 83)"
                prueba = "Documentos, comunicaciones escritas o testimonios presenciales"

            subsunción_por_hecho.append({
                "numero": i + 1,
                "hecho_narrado": s_clean,
                "calificacion_juridica": calificacion,
                "norma_aplicable": norma,
                "medio_probatorio": prueba
            })

        hechos_cronologicos = [
            f"Hecho {item['numero']}: {item['hecho_narrado']}." 
            for item in subsunción_por_hecho
        ]

        # Extraer sujeto principal
        sujeto_principal = "la contraparte demandada"
        for s in sujetos_finales:
            if "Persona" in s or "Entidad" in s or "Empresa" in s:
                sujeto_principal = s.split(":")[-1].strip()
                break

        # 9. CONSTRUCCIÓN DE LOS 4 PILARES JURÍDICOS EXIGIDOS
        hechos_desarrollados = FactCaseAnalyzer._build_developed_facts(
            raw_sentences=raw_sentences,
            sujetos=sujetos_finales,
            tiempos=tiempos,
            montos=montos_limpios,
            materia=materia,
            sujeto_principal=sujeto_principal
        )

        pretensiones_partes = FactCaseAnalyzer._build_party_pretensions(
            materia=materia,
            sujeto_principal=sujeto_principal,
            montos=montos_limpios
        )

        normas_sustantivas = FactCaseAnalyzer._build_substantive_rules(materia=materia)

        problema_juridico_detallado = FactCaseAnalyzer._build_detailed_legal_problem(
            materia=materia,
            sujeto_principal=sujeto_principal,
            montos=montos_limpios,
            primer_hecho=raw_sentences[0] if raw_sentences else text_clean[:120]
        )

        return {
            "materia": materia,
            "sujetos": sujetos_finales,
            "temporalidades": list(set(tiempos[:4])) if tiempos else ["Situación jurídica actual y continua"],
            "hechos_cronologicos": hechos_cronologicos,
            "subsunción_por_hecho": subsunción_por_hecho,
            "hechos_desarrollados": hechos_desarrollados,
            "pretensiones_partes": pretensiones_partes,
            "normas_sustantivas_especificas": normas_sustantivas,
            "problema_juridico_detallado": problema_juridico_detallado,
            "montos": list(set(montos_limpios[:3])),
            "texto_original": text_clean
        }

    @staticmethod
    def _build_developed_facts(raw_sentences: List[str], sujetos: List[str], tiempos: List[str], montos: List[str], materia: str, sujeto_principal: str) -> List[Dict[str, Any]]:
        """
        Construye una relación fáctica pormenorizada, cronológica y desarrollada
        conforme al estándar formal de demandas y acciones judiciales en Colombia.
        """
        tiempo_str = tiempos[0] if tiempos else "En fecha precedente determinada"
        monto_str = f"${montos[0]} COP" if montos else "la suma y condiciones económicas pactadas"
        
        developed = []

        # Hecho 1: Nacimiento de la relación jurídica
        hecho_1_desc = f"En {tiempo_str}, se trabó una relación jurídica obligacional y directa entre las partes ({sujeto_principal}), con fundamento en la confianza legítima y los acuerdos verbales o documentales sostenidos para el objeto del negocio o servicio."
        if "consumidor" in materia or "compraventa" in materia:
            hecho_1_desc = f"En {tiempo_str}, el consultante adquirió de buena fe un bien/producto comercializado por {sujeto_principal} por valor de {monto_str}, bajo la garantía legal de calidad, idoneidad y buen funcionamiento consagrada en el Estatuto del Consumidor."
        elif "deudas" in materia:
            hecho_1_desc = f"En {tiempo_str}, se constituyó a favor del consultante y a cargo de {sujeto_principal} una obligación crediticia dineraria por valor de {monto_str}, respaldada en título valor/documento con fecha cierta de vencimiento."
        elif "arrendamiento" in materia:
            hecho_1_desc = f"En {tiempo_str}, se celebró contrato de arrendamiento urbano con {sujeto_principal}, entregándose la tenencia del bien inmueble a cambio de un canon mensual estipulado en {monto_str}."
        elif "laboral" in materia:
            hecho_1_desc = f"El consultante prestó sus servicios personales de manera subordinada y remunerada a favor de {sujeto_principal}, mediando contrato de trabajo y observando a cabalidad sus deberes laborales."
        elif "salud" in materia:
            hecho_1_desc = f"El consultante se encuentra válidamente afiliado al Sistema General de Seguridad Social en Salud a través de la entidad promotora {sujeto_principal}, con derecho a la cobertura integral de prestaciones médicas y asistenciales."

        developed.append({
            "numero": 1,
            "titulo": "Nacimiento del Vínculo Jurídico y Acuerdos Iniciales",
            "descripcion_desarrollada": hecho_1_desc,
            "fecha_o_tiempo": tiempo_str,
            "sujetos": f"Consultante y {sujeto_principal}",
            "impacto_juridico": "Generación de obligaciones bilaterales exigibles y deberes de conducta recíprocos.",
            "medio_probatorio": "Contrato, factura de compraventa, título valor o certificado de afiliación."
        })

        # Hecho 2: Ejecución y cumplimiento inicial
        frase_2 = raw_sentences[1] if len(raw_sentences) > 1 else raw_sentences[0]
        developed.append({
            "numero": 2,
            "titulo": "Cumplimiento de la Parte Afectada y Ejecución de Buena Fe",
            "descripcion_desarrollada": f"El consultante honró oportunamente sus cargas y compromisos, cancelando las sumas debidas o poniendo a disposición de {sujeto_principal} lo convenido, acaeciendo el hecho fáctico: '{frase_2}'.",
            "fecha_o_tiempo": tiempos[1] if len(tiempos) > 1 else "Posterior a la celebración",
            "sujetos": "Parte consultante",
            "impacto_juridico": "Acreditación de la condición de contratante cumplido conforme al Art. 1546 del Código Civil.",
            "medio_probatorio": "Comprobantes de pago, transferencias, entrega de mercancía o registro de asistencia."
        })

        # Hecho 3: La conducta antijurídica o incumplimiento de la contraparte
        frase_3 = raw_sentences[2] if len(raw_sentences) > 2 else (raw_sentences[1] if len(raw_sentences) > 1 else raw_sentences[0])
        hecho_3_desc = f"De manera unilateral y contraria a la ley o al contrato, {sujeto_principal} incurrió en omisión o incumplimiento grave de sus deberes legales, presentándose la siguiente afectación fáctica: '{frase_3}'."
        if "consumidor" in materia:
            hecho_3_desc = f"El bien comercializado por {sujeto_principal} presentó fallas mecánicas, defectos de fabricación o vicios ocultos de gravedad ('{frase_3}'), impidiendo su uso normal y defraudando las expectativas legítimas del consumidor."
        elif "deudas" in materia:
            hecho_3_desc = f"Llegada la fecha perentoria de vencimiento, {sujeto_principal} se abstuvo de realizar el pago total o parcial de {monto_str}, constituyéndose en mora culpable y rehusando satisfacer la deuda insatisfecha."
        elif "salud" in materia:
            hecho_3_desc = f"La entidad {sujeto_principal} dilató o negó injustificadamente el suministro del medicamento, procedimiento o cita prioritaria ordenada por el médico tratante, configurando barrera de acceso que amenaza la vida y salud."
        elif "laboral_estabilidad" in materia:
            hecho_3_desc = f"La empresa {sujeto_principal} comunicó la desvinculación laboral encontrándose el trabajador en situación de debilidad manifiesta por incapacidad médica o afectación de salud, omitiendo tramitar el permiso previo obligatorio del Ministerio del Trabajo."

        developed.append({
            "numero": 3,
            "titulo": "Incumplimiento Contractual o Afectación de Derechos por la Contraparte",
            "descripcion_desarrollada": hecho_3_desc,
            "fecha_o_tiempo": "Fecha de exigibilidad o mora",
            "sujetos": sujeto_principal,
            "impacto_juridico": "Configuración del nexo causal entre la conducta de la contraparte y el daño antijurídico.",
            "medio_probatorio": "Dictamen pericial, historial de chats, constancia de rechazo médico o carta de despido."
        })

        # Hecho 4: Consumación del daño y perjuicio patrimonial o extrapatrimonial
        developed.append({
            "numero": 4,
            "titulo": "Consumación del Daño Emergente, Lucro Cesante o Perjuicio Moral",
            "descripcion_desarrollada": f"A consecuencia directa de la conducta desplegada por {sujeto_principal}, el consultante ha padecido un perjuicio real y cuantificable en su patrimonio ({monto_str}), así como afectación a su estabilidad personal, familiar o física que amerita resarcimiento integral.",
            "fecha_o_tiempo": "Actualidad procesal continua",
            "sujetos": "Afectado y su núcleo familiar",
            "impacto_juridico": "Causación de perjuicios indemnizables según los Arts. 1613 y 1614 del Código Civil.",
            "medio_probatorio": "Extractos bancarios, facturas de gastos conexos, certificaciones laborales o historias clínicas."
        })

        # Hecho 5: Reclamación directa y falta de solución
        developed.append({
            "numero": 5,
            "titulo": "Reclamación Directa, Negativa o Silencio Administrativo",
            "descripcion_desarrollada": f"El consultante acudió ante {sujeto_principal} en búsqueda de arreglo directo, reparación, cumplimiento o restitución, recibiendo evasivas, negativa rotunda o silencio indolente, agotando la vía directa y haciendo imperiosa la intervención de la jurisdicción competente.",
            "fecha_o_tiempo": "Etapa prejudicial reciente",
            "sujetos": f"Consultante frente a {sujeto_principal}",
            "impacto_juridico": "Cumplimiento del requisito de procedibilidad de reclamación previa y agotamiento de la vía directa.",
            "medio_probatorio": "Copia de radicados de petición, mensajes certificados o acta de no acuerdo en conciliación."
        })

        return developed

    @staticmethod
    def _build_party_pretensions(materia: str, sujeto_principal: str, montos: List[str]) -> Dict[str, Any]:
        """
        Formula las pretensiones de cada parte en la controversia:
        - Parte demandante / afectada (principales y subsidiarias/indemnizatorias).
        - Parte demandada / contraparte (excepciones de mérito y defensas probables).
        """
        monto_num = f"${montos[0]} COP" if montos else "el monto que resulte probado en el proceso"

        if "consumidor" in materia:
            return {
                "demandante_principales": [
                    f"Declarar que {sujeto_principal} vulneró los derechos del consumidor consagrados en los Arts. 7, 10 y 11 de la Ley 1480 de 2011 al comercializar un bien que carece de idoneidad, calidad y seguridad.",
                    f"Ordenar a {sujeto_principal} a título de efectividad de la garantía legal, la resolución de la compraventa con la devolución total de la suma pagada ({monto_num}), debidamente indexada con base en el IPC."
                ],
                "demandante_subsidiarias": [
                    f"En subsidio, ordenar el cambio o sustitución del bien por otro idéntico o de mejores especificaciones técnicas totalmente nuevo de paquete.",
                    f"Condenar al pago de los perjuicios materiales y daño emergente causados por concepto de reparaciones fallidas y transporte.",
                    "Condenar en costas procesales y agencias en derecho a la contraparte."
                ],
                "demandado_excepciones": [
                    "Excepción de fuerza mayor o caso fortuito en el funcionamiento del bien.",
                    "Excepción de uso indebido o manipulación no autorizada del producto por parte del usuario o de talleres terceros.",
                    "Excepción de culpa exclusiva de la víctima al no reportar en los términos de la garantía técnica.",
                    "Excepción de inexistencia de falla de calidad o vicio imputable al fabricante/distribuidor."
                ],
                "demandado_estrategia_defensiva": f"{sujeto_principal} buscará desvirtuar el nexo causal argumentando que el defecto se produjo por desgaste natural, maltrato o intervención de terceros no autorizados."
            }
        elif "deudas" in materia:
            return {
                "demandante_principales": [
                    f"Librar mandamiento ejecutivo de pago en contra de {sujeto_principal} por la suma de {monto_num} por concepto de capital insoluto incorporado en el título valor.",
                    f"Condenar a {sujeto_principal} al pago de los intereses moratorios liquidados a la tasa máxima legal certificada por la Superintendencia Financiera desde que se constituyó en mora y hasta el pago total efectivo."
                ],
                "demandante_subsidiarias": [
                    "Decretar el embargo y secuestro preventivo de los bienes muebles, inmuebles, vehículos y cuentas bancarias del deudor demandado.",
                    "Condenar al demandado al pago de los honorarios de abogado, agencias en derecho y costas del proceso ejecutivo."
                ],
                "demandado_excepciones": [
                    "Excepción de prescripción extintiva de la acción cambiaria (3 años según Art. 789 del Código de Comercio).",
                    "Excepción de pago total o parcial no abonado a la liquidación del crédito.",
                    "Excepción de alteración o llenado indebido del título valor contrario a la carta de instrucciones (Art. 622 C.Co.).",
                    "Excepción de cobro de intereses usurarios que exceden el límite penal y civil legal."
                ],
                "demandado_estrategia_defensiva": f"{sujeto_principal} intentará alegar falta de claridad en el título, prescripción del derecho de cobro o amortizaciones en efectivo no reconocidas."
            }
        elif "arrendamiento" in materia:
            return {
                "demandante_principales": [
                    f"Declarar la terminación judicial del contrato de arrendamiento celebrado con {sujeto_principal} por causal de mora en el pago de los cánones de arrendamiento (Art. 22 Ley 820 de 2003).",
                    f"Ordenar a {sujeto_principal} la restitución material y entrega inmediata del bien inmueble arrendado totalmente desocupado y en el estado recibido."
                ],
                "demandante_subsidiarias": [
                    f"Condenar a {sujeto_principal} y a su codeudor solidario al pago de los cánones causados y los que se sigan causando hasta la entrega real, sumados a la cláusula penal pactada.",
                    "Decretar el embargo preventivo sobre bienes y salarios de los demandados para garantizar las acreencias insolutas."
                ],
                "demandado_excepciones": [
                    "Excepción de contrato no cumplido (Art. 1609 Código Civil) por vicios de habitabilidad o reparaciones necesarias no hechas por el arrendador.",
                    "Excepción de compensación por mejoras o reparaciones urgentes costeadas por el inquilino.",
                    "Excepción de falta de legitimación o inexistencia de requerimiento legal de mora previo."
                ],
                "demandado_estrategia_defensiva": f"{sujeto_principal} argumentará que el no pago se debió al mal estado del inmueble o a la falta de entrega de recibos de pago por parte del propietario."
            }
        elif "laboral" in materia:
            return {
                "demandante_principales": [
                    f"Declarar la ineficacia del despido comunicado por {sujeto_principal} por vulneración al fuero de estabilidad laboral reforzada de salud o por terminación unilateral sin justa causa comprobada.",
                    f"Ordenar a {sujeto_principal} el reintegro inmediato del trabajador al cargo que venía desempeñando o a uno de superior jerarquía compatible con sus condiciones de salud."
                ],
                "demandante_subsidiarias": [
                    f"Condenar a {sujeto_principal} al pago de todos los salarios, prestaciones sociales y aportes pensionales dejados de percibir desde la fecha del despido hasta el reintegro efectivo.",
                    "Condenar al pago de la sanción de 180 días de salario prevista en el Art. 26 de la Ley 361 de 1997 o la indemnización tarifada del Art. 64 del CST.",
                    "Condenar a la sanción moratoria de un día de salario por día de retardo (Art. 65 CST) y costas del juicio."
                ],
                "demandado_excepciones": [
                    "Excepción de terminación por justa causa legal comprobada imputable al trabajador.",
                    "Excepción de inexistencia de limitación física o desconocimiento del estado de salud al momento del despido.",
                    "Excepción de buena fe del empleador que exonera de la sanción moratoria del Art. 65 del CST.",
                    "Excepción de prescripción trienal de los derechos laborales (Art. 488 CST)."
                ],
                "demandado_estrategia_defensiva": f"{sujeto_principal} defenderá que el despido obedeció a causales objetivas de rendimiento o reestructuración, negando móvil discriminatorio."
            }
        elif "salud" in materia:
            return {
                "demandante_principales": [
                    f"Tutelar como mecanismo principal y definitivo los derechos fundamentales a la salud, a la vida en condiciones dignas y a la integridad física del accionante frente a {sujeto_principal}.",
                    f"Ordenar a {sujeto_principal} autorizar, programar y suministrar en un término perentorio de 48 horas el procedimiento médico, insumo o medicamento prescrito por el médico tratante."
                ],
                "demandante_subsidiarias": [
                    f"Ordenar a {sujeto_principal} brindar tratamiento médico integral sin dilaciones ni copagos para todas las atenciones derivadas de la patología diagnosticada.",
                    "Decretar Medida Cautelar Provisional de Urgencia (Art. 7 Dec. 2591/91) para frenar perjuicio irremediable inminente."
                ],
                "demandado_excepciones": [
                    "Excepción de falta de agotamiento de instancias administrativas internas o comités técnicos (MIPRES).",
                    "Excepción de no estar incluido en el Plan de Beneficios en Salud (PBS) o exclusión explícita.",
                    "Excepción de inexistencia de orden médica emitida por profesional adscrito a su red de prestadores.",
                    "Excepción de subsidiariedad ante la existencia de facultades jurisdiccionales de la Superintendencia de Salud."
                ],
                "demandado_estrategia_defensiva": f"{sujeto_principal} alegará trámites de autorización de red o desabastecimiento nacional de moléculas para justificar el retardo."
            }
        else: # Civil General y demás
            return {
                "demandante_principales": [
                    f"Declarar el incumplimiento culpable de las obligaciones a cargo de {sujeto_principal} derivadas del negocio jurídico sostenido con el consultante.",
                    f"Condenar a {sujeto_principal} al pago íntegro del daño patrimonial causado ({monto_num}) con sus respectivos intereses legales y actualización monetaria."
                ],
                "demandante_subsidiarias": [
                    "En subsidio, decretar la resolución contractual con restitución mutua de las prestaciones recibidas y condena en daños y perjuicios.",
                    "Condenar en costas y gastos procesales a la parte demandada."
                ],
                "demandado_excepciones": [
                    "Excepción de cumplimiento de las obligaciones contractuales asumidas.",
                    "Excepción de culpa compartida o asunción del riesgo por parte del demandante.",
                    "Excepción de inexistencia de perjuicios directos demostrados.",
                    "Excepción de falta de título ejecutivo o requerimiento previo en mora."
                ],
                "demandado_estrategia_defensiva": f"{sujeto_principal} intentará demostrar que cumplió con sus obligaciones o que el daño no le es jurídicamente imputable a título de culpa."
            }

    @staticmethod
    def _build_substantive_rules(materia: str) -> List[Dict[str, str]]:
        """
        Entrega las normas sustantivas específicas aplicables al caso (Código Civil, Estatuto del Consumidor, CST, etc.)
        con número de artículos exactos y aplicación fáctica.
        """
        if "consumidor" in materia or "compraventa" in materia:
            return [
                {
                    "cuerpo": "Estatuto del Consumidor (Ley 1480 de 2011)",
                    "articulos": "Artículos 7, 10 y 11",
                    "regla": "Obligación de Garantía Legal: Los productores y proveedores responden solidariamente por la calidad, idoneidad, seguridad y buen estado de los bienes. Ante la reincidencia de la falla o defecto irreparable, el consumidor tiene derecho a elegir entre una nueva reparación, la sustitución del bien o la devolución total del dinero pagado.",
                    "aplicacion_caso": "El vendedor está obligado a responder por las fallas del bien y no puede desentenderse trasladando el problema al comprador."
                },
                {
                    "cuerpo": "Estatuto del Consumidor (Ley 1480 de 2011)",
                    "articulos": "Artículos 23 y 29",
                    "regla": "Información Veraz y Publicidad Engañosa: Los proveedores están obligados a suministrar información completa, veraz, transparente y verificable sobre las características y condiciones reales de los bienes ofrecidos.",
                    "aplicacion_caso": "Si se ocultaron fallas preexistentes o se prometieron condiciones inexistentes, se configura infracción administrativa y contractual."
                },
                {
                    "cuerpo": "Código Civil Colombiano",
                    "articulos": "Artículos 1546 y 1602",
                    "regla": "Condición Resolutoria Tácita y Ley del Contrato: En los contratos bilaterales va envuelta la condición resolutoria en caso de no cumplirse por uno de los contratantes lo pactado, pudiendo el otro pedir a su arbitrio la resolución o el cumplimiento del contrato con indemnización de perjuicios.",
                    "aplicacion_caso": "Faculta judicialmente al comprador a rescindir el negocio y demandar la restitución del precio más perjuicios económicos."
                },
                {
                    "cuerpo": "Código Civil Colombiano",
                    "articulos": "Artículos 1914 y 1915",
                    "regla": "Acción Redhibitoria por Vicios Ocultos: Acción rescisoria de la venta por vicios redhibitorios que existían al tiempo de la venta y que hacen que el bien no sirva para su uso natural.",
                    "aplicacion_caso": "Ampara el reclamo por desperfectos mecánicos o estructurales no visibles al momento de celebrar la compraventa."
                }
            ]
        elif "deudas" in materia:
            return [
                {
                    "cuerpo": "Código General del Proceso (Ley 1564 de 2012)",
                    "articulos": "Artículo 422",
                    "regla": "Título Ejecutivo y Exigibilidad: Pueden demandarse ejecutivamente las obligaciones expresas, claras y exigibles que consten en documentos que provengan del deudor o de su causante, y constituyan plena prueba contra él.",
                    "aplicacion_caso": "Permite formular demanda ejecutiva para solicitar mandamiento coercitivo de pago inmediato sin dilaciones probatorias."
                },
                {
                    "cuerpo": "Código Civil Colombiano",
                    "articulos": "Artículos 1608 y 1617",
                    "regla": "Constitución en Mora e Intereses Moratorios: El deudor está en mora cuando no ha cumplido la obligación dentro del término estipulado. Si la obligación es de pagar una suma de dinero, la indemnización de perjuicios por la mora comprende los intereses legales moratorios.",
                    "aplicacion_caso": "Habilita la liquidación de intereses moratorios a la tasa máxima certificada por la Superintendencia Financiera."
                },
                {
                    "cuerpo": "Código de Comercio Colombiano",
                    "articulos": "Artículos 789 y 790",
                    "regla": "Prescripción de la Acción Cambiaria: La acción cambiaria directa derivada de una letra de cambio o pagaré prescribe en tres (3) años a partir del día del vencimiento.",
                    "aplicacion_caso": "Define la vigencia temporal para ejecutar el cobro forzoso del título valor ante los despachos judiciales."
                },
                {
                    "cuerpo": "Código General del Proceso",
                    "articulos": "Artículo 599",
                    "regla": "Embargo y Secuestro en Procesos Ejecutivos: Desde la presentación de la demanda ejecutiva el acreedor tiene derecho a solicitar medidas cautelares preventivas de embargo sobre dineros, salarios y bienes del deudor.",
                    "aplicacion_caso": "Permite congelar cuentas bancarias y bienes del deudor para asegurar que no se insolvente antes de pagar."
                }
            ]
        elif "laboral" in materia:
            return [
                {
                    "cuerpo": "Código Sustantivo del Trabajo (C.S.T.)",
                    "articulos": "Artículos 23 y 24",
                    "regla": "Elementos Esenciales del Contrato de Trabajo y Primacía de la Realidad: La prestación personal de servicios bajo continuada subordinación y mediante remuneración configura contrato de trabajo, cualquiera que sea la denominación que las partes le hayan dado.",
                    "aplicacion_caso": "Desvirtúa contratos civiles ficticios garantizando plenos derechos prestacionales al trabajador."
                },
                {
                    "cuerpo": "Ley 361 de 1997",
                    "articulos": "Artículo 26",
                    "regla": "Fuero de Salud e Ineficacia del Despido: En ningún caso la limitación de una persona podrá ser motivo para obstaculizar una vinculación laboral o terminarla, a menos que dicho despido sea autorizado por la Oficina del Trabajo. Quienes fueren despedidos sin autorización tienen derecho a una indemnización equivalente a ciento ochenta (180) días de salario, más reintegro.",
                    "aplicacion_caso": "Declara nulo el despido de trabajadores con incapacidades o tratamientos médicos y ordena su reintegro obligatorio."
                },
                {
                    "cuerpo": "Código Sustantivo del Trabajo",
                    "articulos": "Artículos 64 y 65",
                    "regla": "Indemnización por Despido Injusto y Moratoria: El despido unilateral sin justa causa comprobada obliga al pago de indemnización tarifada según la antigüedad. Si a la terminación el empleador no paga salarios y prestaciones debidas, debe cancelar un día de salario por cada día de mora.",
                    "aplicacion_caso": "Sanciona económicamente al empleador que retiene liquidaciones o despide arbitrariamente."
                }
            ]
        elif "salud" in materia:
            return [
                {
                    "cuerpo": "Constitución Política de Colombia",
                    "articulos": "Artículos 11, 48 y 49",
                    "regla": "Fundamentalidad del Derecho a la Salud: La atención de la salud y el saneamiento ambiental son servicios públicos a cargo del Estado. Se garantiza a todas las personas el acceso a los servicios de promoción, protección y recuperación de la salud como derecho autónomo e irrenunciable.",
                    "aplicacion_caso": "Prioridad jurídica superior frente a controversias presupuestales o administrativas de las aseguradoras."
                },
                {
                    "cuerpo": "Ley Estatutaria de Salud (Ley 1751 de 2015)",
                    "articulos": "Artículos 2 y 8",
                    "regla": "Principio de Integralidad del Sistema de Salud: Los servicios y tecnologías de salud deberán ser suministrados de manera completa para prevenir, paliar o curar la enfermedad, con independencia del origen de la enfermedad o condición de salud, sistema de provisión o plan prestacional.",
                    "aplicacion_caso": "Prohíbe a las EPS fraccionar tratamientos o negar insumos ordenados por el médico tratante."
                },
                {
                    "cuerpo": "Decreto 2591 de 1991",
                    "articulos": "Artículos 7 y 86",
                    "regla": "Acción de Tutela y Medidas Cautelares Provisionales: El juez constitucional puede ordenar como medida cautelar la suspensión de actos lesivos o la práctica urgente de atenciones médicas para evitar un perjuicio irremediable en salud.",
                    "aplicacion_caso": "Garantiza orden judicial vinculante en un plazo máximo de 48 horas para procedimientos de urgencia."
                }
            ]
        elif "familia" in materia:
            return [
                {
                    "cuerpo": "Código de la Infancia y la Adolescencia (Ley 1098 de 2006)",
                    "articulos": "Artículos 24 y 129",
                    "regla": "Derecho de Alimentos de los Niños, Niñas y Adolescentes: Los menores de edad tienen derecho a los alimentos y demás medios para su desarrollo físico, psicológico, espiritual, moral, cultural y social. La obligación comprende sustento, habitación, vestido, asistencia médica, recreación y educación.",
                    "aplicacion_caso": "Fija la obligación imperativa de manutención a cargo de los progenitores según sus ingresos."
                },
                {
                    "cuerpo": "Código de la Infancia y la Adolescencia",
                    "articulos": "Artículo 130",
                    "regla": "Embargo Preventivo de Salarios por Alimentos: En los procesos de alimentos, las medidas cautelares de embargo sobre sueldos y prestaciones sociales pueden extenderse judicialmente hasta el cincuenta por ciento (50%) de los mismos.",
                    "aplicacion_caso": "Permite descontar de nómina o cuentas del demandado hasta la mitad de sus ingresos para los hijos."
                },
                {
                    "cuerpo": "Código Penal Colombiano (Ley 599 de 2000)",
                    "articulos": "Artículo 233",
                    "regla": "Delito de Inasistencia Alimentaria: El que se sustraiga sin justa causa a la prestación de alimentos legalmente debidos a sus ascendientes, descendientes, adoptante o cónyuge incurrirá en prisión de 16 a 54 meses.",
                    "aplicacion_caso": "Responsabilidad penal independiente ante la Fiscalía General de la Nación por mora continuada."
                }
            ]
        elif "arrendamiento" in materia:
            return [
                {
                    "cuerpo": "Ley 820 de 2003 (Régimen de Arrendamiento de Vivienda Urbana)",
                    "articulos": "Artículo 20",
                    "regla": "Reajuste Legal del Canon de Arrendamiento: Cada doce (12) meses de ejecución del contrato el canon podrá incrementarse hasta en un porcentaje que no supere el 100% del IPC del año inmediatamente anterior, previo aviso escrito.",
                    "aplicacion_caso": "Impide aumentos desmedidos o abusivos no autorizados por la ley colombiana."
                },
                {
                    "cuerpo": "Ley 820 de 2003",
                    "articulos": "Artículos 22 y 24",
                    "regla": "Causales de Terminación Unilateral: La no cancelación del canon de arrendamiento o de los servicios públicos domiciliarios dentro de los términos acordados faculta al arrendador para dar por terminado de pleno derecho el contrato y exigir restitución.",
                    "aplicacion_caso": "Fundamento legal taxativo para incoar proceso judicial de restitución de inmueble arrendado."
                },
                {
                    "cuerpo": "Código General del Proceso",
                    "articulos": "Artículo 384",
                    "regla": "Trámite de Restitución de Inmueble Arrendado: Para ser oído en el proceso, el demandado por falta de pago debe consignar a órdenes del juzgado los cánones que se afirmen adeudados.",
                    "aplicacion_caso": "Carga procesal estricta que protege al propietario contra dilaciones del arrendatario en mora."
                }
            ]
        else: # Civil General
            return [
                {
                    "cuerpo": "Código Civil Colombiano",
                    "articulos": "Artículos 1494 y 1546",
                    "regla": "Fuentes de las Obligaciones y Condición Resolutoria: Las obligaciones nacen del concurso real de voluntades o del hecho voluntario de la persona. Ante el incumplimiento contractual, la parte cumplida puede exigir el cumplimiento forzoso o la resolución con indemnización.",
                    "aplicacion_caso": "Base jurídica para exigir judicialmente la satisfacción del acuerdo o la reparación del daño."
                },
                {
                    "cuerpo": "Código Civil Colombiano",
                    "articulos": "Artículos 1602 y 1613",
                    "regla": "Fuerza Obligatoria del Contrato y Daño Indemnizable: Todo contrato legalmente celebrado es una ley para los contratantes. La indemnización de perjuicios comprende el daño emergente y el lucro cesante.",
                    "aplicacion_caso": "Obligatoriedad de reparar de manera integral todo perjuicio derivado de la culpa o dolo contractual."
                },
                {
                    "cuerpo": "Código General del Proceso",
                    "articulos": "Artículo 590",
                    "regla": "Medidas Cautelares Innominadas en Procesos Declarativos: El juez podrá decretar cualquier medida cautelar que considere razonable para proteger el derecho objeto del litigio y prevenir daños.",
                    "aplicacion_caso": "Protección preventiva del patrimonio en disputa antes de que se profiera sentencia definitiva."
                }
            ]

    @staticmethod
    def _build_detailed_legal_problem(materia: str, sujeto_principal: str, montos: List[str], primer_hecho: str) -> Dict[str, Any]:
        """
        Formula el Problema Jurídico con la técnica formal y rigurosa de las Altas Cortes colombianas.
        """
        monto_str = f"por la suma de ${montos[0]} COP" if montos else ""

        if "consumidor" in materia or "compraventa" in materia:
            pregunta = f"¿Le asiste derecho al consultante frente a {sujeto_principal} para exigir la efectividad de la garantía legal y la resolución del contrato de compraventa con devolución total del dinero pagado {monto_str} más la indemnización de perjuicios, al haberse acreditado la existencia de fallas de idoneidad, calidad y vicios ocultos preexistentes en el bien (Arts. 7 y 11 de la Ley 1480 de 2011 y Art. 1914 del Código Civil), o por el contrario, procede la exoneración de responsabilidad del vendedor por culpa exclusiva del usuario o fuerza mayor?"
            subproblemas = [
                f"1. ¿Se acreditó el nexo de causalidad entre el defecto presentado en el bien y la falla de calidad imputable al vendedor/distribuidor {sujeto_principal}?",
                "2. ¿Procedió el consumidor a notificar y poner a disposición el bien dentro de los términos legales de la garantía?",
                "3. ¿Procede la devolución total del precio o se justifica una nueva reparación técnica según la reiteración de la falla?"
            ]
            criterio = "La Corte Suprema de Justicia (SC-1999-2022) y la Superintendencia de Industria y Comercio reiteran que en relaciones de consumo opera la inversión de la carga de la prueba en favor del adquirente cuando el bien presenta fallas tempranas en su funcionalidad esencial."
        elif "deudas" in materia:
            pregunta = f"¿Reúne la obligación dineraria {monto_str} a cargo de {sujeto_principal} los presupuestos sustanciales y procesales de ser una obligación expresa, clara y actualmente exigible para librar mandamiento ejecutivo de pago y decretar medidas cautelares de embargo (Art. 422 del CGP), o por el contrario ha operado el fenómeno extintivo de prescripción de la acción cambiaria o pago no reconocido alegable por el deudor ejecutado?"
            subproblemas = [
                "1. ¿Se encuentra vigente la acción cambiaria o ejecutiva sin que hayan transcurrido los 3 años de prescripción del Art. 789 del Código de Comercio?",
                f"2. ¿Constituye el documento soporte plena prueba de la obligación a cargo de {sujeto_principal}?",
                "3. ¿Procede la liquidación de intereses moratorios a la tasa máxima certificada por la Superintendencia Financiera de Colombia?"
            ]
            criterio = "La Sala de Casación Civil de la Corte Suprema ha sostenido de forma pacífica que quien ostenta un título ejecutivo formalmente idóneo no requiere probar la causa del negocio subyacente, correspondiéndole al deudor la carga probatoria de demostrar el pago o la extinción de la deuda."
        elif "laboral" in materia:
            pregunta = f"¿Se configuró una terminación unilateral del contrato de trabajo de carácter ineficaz o discriminatoria por parte de {sujeto_principal} al haberse desvinculado al trabajador durante estado de afectación a la salud sin contar con la autorización previa del Ministerio del Trabajo (Art. 26 Ley 361 de 1997 y Sentencia SU-067/23), acarreando la orden de reintegro laboral y sanción de 180 días de salario, o por el contrario, medió una justa causa objetiva debidamente comprobada por el empleador?"
            subproblemas = [
                f"1. ¿Tenía conocimiento el empleador {sujeto_principal} del estado de salud o incapacidades del trabajador al momento de ordenar el despido?",
                "2. ¿Se acreditó que el despido obedeció a razones objetivas y no a una presunción de discriminación?",
                "3. ¿Procede la sanción moratoria del Art. 65 del CST por la retención o no pago de la liquidación definitiva de salarios y prestaciones?"
            ]
            criterio = "La Corte Constitucional en Sentencias SU-049 de 2017 y SU-067 de 2023 fijó la regla según la cual todo despido de una persona con afectación de salud sin permiso ministerial se presume discriminatorio, operando el reintegro y la sanción legal."
        elif "salud" in materia:
            pregunta = f"¿Vulnera la entidad promotora de salud {sujeto_principal} los derechos fundamentales a la salud, a la vida en condiciones dignas y a la integridad personal del consultante al dilatar o negar la entrega oportuna de medicamentos, citas especializadas o procedimientos ordenados por el médico tratante, o existe justificación constitucional válida para imponer barreras administrativas de acceso al servicio médico?"
            subproblemas = [
                "1. ¿Existe concepto u orden emitida por médico tratante que demuestre la necesidad médica imperiosa del servicio solicitado?",
                "2. ¿Se configura la inminencia de un perjuicio irremediable que amerite el decreto de Medida Cautelar Provisional de 48 horas (Art. 7 Dec. 2591/91)?",
                "3. ¿Debe ordenarse a la EPS la cobertura del tratamiento médico integral para evitar que el paciente deba volver a tutelar por cada orden sucesiva?"
            ]
            criterio = "En Sentencias T-760 de 2008 y SU-508 de 2020 la Corte Constitucional reiteró que la salud es un derecho fundamental autónomo y las EPS no pueden oponer trabas burocráticas o presupuestales frente a órdenes de médicos tratantes."
        elif "familia" in materia:
            pregunta = f"¿Procede la fijación y embargo coactivo de hasta el 50% de los ingresos devengados por {sujeto_principal} para asegurar los alimentos congruos y necesarios del menor de edad, atendiendo a su capacidad económica demostrada y a la proporcionalidad de las necesidades escolares, de salud y vivienda (Ley 1098 de 2006 y Sentencia CSJ SC-14673-2016)?"
            subproblemas = [
                "1. ¿Cuáles son los gastos mínimos acreditados para la subsistencia y desarrollo integral del menor de edad?",
                f"2. ¿Cuál es la capacidad patrimonial real del alimentante {sujeto_principal} y su margen de ingresos inembargables?",
                "3. ¿Debe incluirse en la cuota fijada el vestuario reglamentario de 3 mudas anuales y el 50% de las primas de servicios?"
            ]
            criterio = "La jurisprudencia de la Sala de Casación Civil de la Corte Suprema y la Corte Constitucional (Sentencia C-257/15) establece la prevalencia absoluta del interés superior del menor y el piso judicial del 30% del ingreso neto del obligado."
        elif "arrendamiento" in materia:
            pregunta = f"¿Se encuentra plenamente configurada la causal de terminación judicial de contrato y restitución del inmueble frente a {sujeto_principal} por mora continuada en el pago de los cánones de arrendamiento (Art. 22 Ley 820 de 2003), o proceden las excepciones de contrato no cumplido o mejoras invocadas por la parte arrendataria?"
            subproblemas = [
                f"1. ¿Demostró el arrendador el incumplimiento del arrendatario {sujeto_principal} en el pago oportuno dentro de los 5 primeros días del período?",
                "2. ¿Cumplió el arrendatario con el requisito procesal del Art. 384 del CGP de consignar para poder ser oído en el juicio de restitución?",
                "3. ¿Procede la condena al pago de la cláusula penal pecuniaria pactada en el contrato de arrendamiento?"
            ]
            criterio = "La ley 820 de 2003 y el Código General del Proceso establecen un régimen probatorio estricto donde el impago del canon habilita la restitución inmediata del bien sin lugar a prórrogas tácitas."
        else:
            pregunta = f"¿Se configuró un incumplimiento antijurídico y culpable atribuible a {sujeto_principal} respecto de las obligaciones pactadas o exigibles legalmente frente al consultante, derivando en la obligación de indemnizar el daño emergente y perjuicios consecuenciales (Art. 1613 del Código Civil), o existe causal eximente de responsabilidad que deba declarar el juez?"
            subproblemas = [
                f"1. ¿Cuáles fueron las obligaciones concretas contraídas por {sujeto_principal} y cuál fue el hecho que materializó la inejecución?",
                "2. ¿Qué perjuicios materiales directos se encuentran respaldados con evidencia documental en el expediente?",
                "3. ¿Cuál es la vía procesal idónea ante la jurisdicción ordinaria para hacer efectivo el derecho reclamado?"
            ]
            criterio = "Conforme al régimen general de responsabilidad civil colombiano (Art. 1604 C.C.), en obligaciones de resultado corresponde al deudor demostrar la diligencia debida o la fuerza mayor para exonerarse de la condena judicial."

        return {
            "pregunta_principal": pregunta,
            "subproblemas": subproblemas,
            "criterio_decision": criterio
        }
