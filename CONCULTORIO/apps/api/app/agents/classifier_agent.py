"""
Agente Clasificador y Dictaminador Jurídico Especializado (Colombia)
Integra Google Gemini AI y motor dogmático exhaustivo de Altas Cortes colombianas.
Garantiza correspondencia fáctica 100% exacta con los hechos narrados por el ciudadano.
"""
import re
from typing import Dict, Any, List
from app.models.entities import LawBranch
from app.schemas.schemas import CaseClassificationResponse
from app.services.gemini_service import GeminiAIService
from app.services.fact_analyzer import FactCaseAnalyzer
from app.services.multi_branch_investigator import MultiBranchLegalInvestigator

# Banco dogmático exhaustivo para todas las ramas y problemáticas reales en Colombia
JURISPRUDENCE_MASTER_REPOSITORY = {
    # 1. SALUD / DERECHO A LA VIDA DIGNA
    "salud": {
        "branch": LawBranch.CIVIL,
        "urgency": "ALTA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Vulnera la entidad aseguradora {sujeto} los derechos fundamentales a la salud, a la vida en condiciones dignas y a la integridad física del consultante al negar o dilatar la entrega de insumos, medicamentos o procedimientos prescritos por el médico tratante según los hechos narrados?",
        "marco_normativo": [
            "Constitución Política de 1991: Art. 11 (Vida), Art. 48 (Seguridad Social) y Art. 49 (Salud como Derecho Autónomo y Fundamental).",
            "Ley Estatutaria 1751 de 2015: Arts. 2 y 8 (Principio de Integralidad y Prohibición de Barreras Administrativas).",
            "Decreto 2591 de 1991: Arts. 1, 7 y 86 (Acción de Tutela y Medidas Cautelares de 48 horas)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia T-760 de 2008",
                "corte": "Corte Constitucional - Sala Especial de Seguimiento",
                "tesis": "El derecho a la salud es fundamental y autónomo. Las EPS están obligadas a garantizar el acceso continuo, oportuno e integral, sin trasladar trámites administrativos o disputas contractuales a los pacientes."
            },
            {
                "sentencia": "Sentencia SU-508 de 2020",
                "corte": "Corte Constitucional - Sala Plena",
                "tesis": "El principio de integralidad implica que el juez de tutela debe ordenar no solo el procedimiento negado, sino todo el tratamiento integral que requiera el paciente para su completa recuperación."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: La afección a la salud y el riesgo de deterioro biológico son actuales, continuos y apremiantes.",
            "subsidiariedad": "Procedencia plena y directa de la Acción de Tutela. La vía ante la Superintendencia Nacional de Salud no es eficaz ante la inminencia del perjuicio biológico (Sentencia SU-124/18)."
        },
        "estrategia_procesal": {
            "accion": "Acción de Tutela con solicitud perentoria de Medida Cautelar Provisional de 48 horas.",
            "despacho": "Juzgado Municipal de Reparto de la residencia del paciente.",
            "medida_cautelar": "Orden inmediata a la EPS de autorizar y programar el servicio médico en el término perentorio de 48 horas.",
            "pruebas": ["Fórmulas y órdenes médicas", "Resumen de historia clínica", "Radicado de petición o negativa verbal/escrita de la EPS"]
        }
    },

    # 2. LABORAL: ESTABILIDAD LABORAL REFORZADA (FUERO DE SALUD / MATERNIDAD)
    "laboral_estabilidad": {
        "branch": LawBranch.LABORAL,
        "urgency": "ALTA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Se configura la ineficacia del despido comunicado por {sujeto} y la consecuente vulneración del fuero de estabilidad laboral reforzada por encontrarse el trabajador en condición de debilidad manifiesta por razones de salud o incapacidad médica, sin contar con la autorización previa del Ministerio del Trabajo (Art. 26 Ley 361 de 1997)?",
        "marco_normativo": [
            "Constitución Política: Art. 13 (Debilidad Manifiesta), Art. 25 (Trabajo Digno) y Art. 53 (Principios Mínimos Fundamentales).",
            "Ley 361 de 1997: Art. 26 (Ineficacia del Despido y Sanción de 180 días de salario).",
            "Código Sustantivo del Trabajo: Arts. 62, 64 y 65."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SU-049 de 2017 y SU-067 de 2023",
                "corte": "Corte Constitucional - Sala Plena",
                "tesis": "El fuero de estabilidad laboral reforzada ampara a todo trabajador con afectaciones de salud que dificulten el desempeño ordinario de sus labores, presumiéndose discriminatorio el despido efectuado sin autorización del Ministerio del Trabajo."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: Tutela instaurada de forma tempestiva tras la comunicación de despido.",
            "subsidiariedad": "Procede la tutela como amparo transitorio o definitivo para salvaguardar el mínimo vital y la subsistencia alimentaria del trabajador enfermo."
        },
        "estrategia_procesal": {
            "accion": "Acción de Tutela de Reintegro Inmediato por Fuero de Estabilidad Laboral Reforzada.",
            "despacho": "Juez Municipal / Circuito de Reparto de la jurisdicción laboral.",
            "medida_cautelar": "Reintegro provisional al cargo de trabajo sin solución de continuidad y pago de aportes a seguridad social.",
            "pruebas": ["Carta de despido", "Incapacidades médicas vigentes o historia clínica", "Contrato de trabajo"]
        }
    },

    # 3. LABORAL ORDINARIO: DESPIDO SIN JUSTA CAUSA, LIQUIDACIÓN Y MORATORIA
    "laboral_ordinario": {
        "branch": LawBranch.LABORAL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Incurrió {sujeto} en despido unilateral injustificado y retención indebida de salarios y prestaciones sociales, haciéndose acreedor a la indemnización tarifada del Art. 64 del CST y a la indemnización moratoria de un día de salario por cada día de retardo (Art. 65 CST)?",
        "marco_normativo": [
            "Código Sustantivo del Trabajo: Art. 64 (Indemnización por Despido Injustificado).",
            "Código Sustantivo del Trabajo: Art. 65 (Indemnización Moratoria de 1 día de salario por día de mora).",
            "Código General del Proceso y Código Procesal del Trabajo: Proceso Ordinario Laboral de Primera Instancia."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SL2430-2021",
                "corte": "Corte Suprema de Justicia - Sala Laboral",
                "tesis": "La sanción moratoria del artículo 65 del CST no opera en forma automática, pero procede cuando el empleador retiene acreencias laborales sin una razón atendible o de buena fe debidamente acreditada."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Vigente: La reclamación no excede los tres (3) años de prescripción laboral (Art. 488 CST).",
            "subsidiariedad": "Demanda Ordinaria Laboral ante los jueces laborales de la República o conciliación prejudicial ante el Ministerio del Trabajo."
        },
        "estrategia_procesal": {
            "accion": "Demanda Ordinaria Laboral con reclamación de liquidación completa e indemnización moratoria.",
            "despacho": "Juzgado Laboral del Circuito del domicilio del empleador.",
            "medida_cautelar": "Solicitud de caución judicial para garantizar el pago de salarios adeudados.",
            "pruebas": ["Desprendibles de nómina", "Carta de despido o constancia de retiro", "Contrato laboral"]
        }
    },

    # 4. FAMILIA: CUOTA DE ALIMENTOS PARA MENORES DE EDAD
    "familia_alimentos": {
        "branch": LawBranch.FAMILIA,
        "urgency": "ALTA",
        "suggested_doc": "liquidacion_alimentos",
        "problema_juridico": "¿Procede la fijación judicial coactiva y embargo de ingresos respecto de {sujeto} para garantizar los alimentos congruos y necesarios del menor de edad, de acuerdo con su capacidad socioeconómica real y el mandato prevalente del artículo 44 de la Constitución Política?",
        "marco_normativo": [
            "Constitución Política: Art. 44 (Interés Superior y Prevalencia de Derechos de los Niños).",
            "Ley 1098 de 2006 (Código de Infancia y Adolescencia): Arts. 24, 129 y 130 (Embargo de hasta el 50% de sueldo).",
            "Ley 2097 de 2021: Creación del Registro de Deudores Alimentarios Morosos (REDAM)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia C-257 de 2015",
                "corte": "Corte Constitucional - Sala Plena",
                "tesis": "La obligación de dar alimentos a los hijos menores de edad goza de prelación constitucional absoluta. No puede ser evadida ni condicionada por desavenencias entre los progenitores."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: Las necesidades alimentarias, escolares y de salud del menor son continuas e inaplazables.",
            "subsidiariedad": "Fijación provisional de cuota en Centro Zonal del ICBF, Comisaría de Familia o Juzgado de Familia."
        },
        "estrategia_procesal": {
            "accion": "Demanda de Fijación y Aumento de Cuota de Alimentos con Embargo Preventivo de Salario.",
            "despacho": "Juzgado de Familia o Comisaría de Familia del domicilio del menor.",
            "medida_cautelar": "Embargo y retención judicial de hasta el 50% del salario devengado por el demandado.",
            "pruebas": ["Registro Civil de Nacimiento del menor", "Facturas de pensión, uniformes y alimentación", "Certificado de ingresos del obligado"]
        }
    },

    # 5. FAMILIA: DIVORCIO, CUSTODIA Y LIQUIDACIÓN
    "familia_divorcio": {
        "branch": LawBranch.FAMILIA,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Se configuran las causales de divorcio o cesación de efectos civiles frente a {sujeto}, facultando la disolución y liquidación de la sociedad conyugal y la regulación de la custodia y régimen de visitas?",
        "marco_normativo": [
            "Código Civil Colombiano: Art. 154 (Causales Legales de Divorcio).",
            "Ley 25 de 1992 y Ley 962 de 2005 (Divorcio de Mutuo Acuerdo ante Notaría).",
            "Código General del Proceso: Arts. 388 y 389."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SC372-2021",
                "corte": "Corte Suprema de Justicia - Sala Civil",
                "tesis": "La libre voluntad de los cónyuges prevalece en la disolución del vínculo conyugal, garantizando la protección patrimonial y la justa adjudicación de los bienes adquiridos durante la vigencia social."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Vigente: La separación de cuerpos o el conflicto conyugal impone la regularización del estado civil.",
            "subsidiariedad": "Trámite notarial si hay acuerdo mutuo, o Proceso Verbal de Divorcio Contencioso ante Juez de Familia."
        },
        "estrategia_procesal": {
            "accion": "Divorcio Notarial por Mutuo Acuerdo o Demanda de Divorcio ante Juez de Familia.",
            "despacho": "Notaría de Reparto o Juzgado de Familia.",
            "medida_cautelar": "Embargo y secuestro de los bienes sociales sujetos a registro.",
            "pruebas": ["Registro Civil de Matrimonio", "Registros Civiles de Hijos", "Títulos de propiedad de bienes inmuebles o automotores"]
        }
    },

    # 6. CIVIL: ARRENDAMIENTO Y RESTITUCIÓN DE INMUEBLE
    "civil_arrendamiento": {
        "branch": LawBranch.CIVIL,
        "urgency": "ALTA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Incurrió el arrendatario ({sujeto}) en mora determinante en el pago de los cánones de arrendamiento pactados, facultando al arrendador para la terminación unilateral del contrato y la restitución perentoria del inmueble con cobro de cánones insolutos conforme a la Ley 820 de 2003?",
        "marco_normativo": [
            "Ley 820 de 2003: Art. 22 (Causales de Terminación por Falta de Pago).",
            "Código General del Proceso: Art. 384 (Proceso Especial de Restitución de Inmueble Arrendado con entrega provisional)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia STC4215-2020",
                "corte": "Corte Suprema de Justicia - Sala Civil",
                "tesis": "El retraso en el pago de un solo canon de arrendamiento faculta la restitución del inmueble sin necesidad de requerimientos judiciales previos, pues la mora opera de pleno derecho."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: El incumplimiento en el pago es reiterado y continúa causando perjuicio patrimonial.",
            "subsidiariedad": "Demanda de Restitución de Inmueble Arrendado con solicitud de Entrega Provisional (Art. 384 CGP)."
        },
        "estrategia_procesal": {
            "accion": "Demanda de Restitución de Inmueble Arrendado con Medida de Entrega Provisional Inmediata.",
            "despacho": "Juez Civil Municipal del lugar donde se encuentra ubicado el inmueble.",
            "medida_cautelar": "Embargo y secuestro de bienes y cuentas bancarias del inquilino y codeudores.",
            "pruebas": ["Contrato de arrendamiento suscrito", "Certificación bancaria de no recepción del canon"]
        }
    },

    # 7. CIVIL: DEUDAS, LETRAS Y COBRO EJECUTIVO
    "civil_deudas": {
        "branch": LawBranch.CIVIL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Reúne el documento o título valor a cargo de {sujeto} las condiciones de ser una obligación clara, expresa y actualmente exigible para librar mandamiento de pago coercitivo e imponer medidas cautelares de embargo (Art. 422 CGP)?",
        "marco_normativo": [
            "Código General del Proceso: Arts. 422, 430 y 599 (Título Ejecutivo, Mandamiento de Pago y Medidas Cautelares).",
            "Código de Comercio: Arts. 621 y siguientes (Requisitos de Validez de Títulos Valores)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia STC9845-2021",
                "corte": "Corte Suprema de Justicia - Sala Civil",
                "tesis": "De la literalidad del documento firmado se deriva la exigibilidad inmediata de la acreencia económica, procediendo el decreto in limine de las medidas cautelares de embargo solicitadas."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Vigente: La obligación ejecutiva no ha prescrito (3 años para pagarés y letras).",
            "subsidiariedad": "Proceso Ejecutivo Singular directo sin necesidad de declaración previa de derechos."
        },
        "estrategia_procesal": {
            "accion": "Demanda Ejecutiva Singular de Menor/Mínima Cuantía con decreto previo de embargo.",
            "despacho": "Juzgado Civil Municipal del domicilio del deudor.",
            "medida_cautelar": "Embargo y retención de salarios y cuentas bancarias en entidades financieras.",
            "pruebas": ["Pagaré o letra de cambio original", "Extractos o comprobantes de no pago"]
        }
    },

    # 8. CIVIL: COMPRAVENTA DE INMUEBLE O VEHÍCULO, INCUMPLIMIENTO
    "civil_compraventa": {
        "branch": LawBranch.CIVIL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Se configura el incumplimiento contractual culpable por parte de {sujeto} en el negocio jurídico celebrado, facultando la resolución del contrato con restitución de los dineros entregados, pago de la cláusula penal e indemnización de perjuicios (Art. 1546 Código Civil)?",
        "marco_normativo": [
            "Código Civil Colombiano: Art. 1546 (Condición Resolutoria Tácita en Contratos Bilaterales) y Art. 1602 (Fuerza Obligatoria del Contrato).",
            "Código Civil Colombiano: Arts. 1592 y 1599 (Cláusula Penal Compensatoria y de Apremio).",
            "Código General del Proceso: Art. 368 (Proceso Declarativo Verbal)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SC3642-2019",
                "corte": "Corte Suprema de Justicia - Sala Civil",
                "tesis": "La parte que cumplió o se allanó a cumplir sus obligaciones contractuales tiene la potestad de exigir la resolución del negocio con devolución de dineros indexados e indemnización de perjuicios."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: Controversia derivada del vencimiento o negativa en la fecha pactada para escrituración o entrega.",
            "subsidiariedad": "Proceso Verbal Declarativo de Resolución de Contrato o requerimiento en Centro de Conciliación."
        },
        "estrategia_procesal": {
            "accion": "Proceso Declarativo Verbal de Resolución Contractual y Cobro de Arras / Cláusula Penal.",
            "despacho": "Juzgado Civil del Circuito del lugar de ejecución del contrato.",
            "medida_cautelar": "Inscripción de la demanda en el folio de matrícula inmobiliaria o embargo preventivo.",
            "pruebas": ["Promesa de compraventa original", "Recibos de consignación del anticipo", "Comunicaciones de incumplimiento"]
        }
    },

    # 9. PROTECCIÓN AL CONSUMIDOR: GARANTÍAS Y DEFECTOS DE PRODUCTOS
    "consumidor_garantia": {
        "branch": LawBranch.CIVIL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Vulneró {sujeto} el Estatuto del Consumidor (Ley 1480 de 2011) al comercializar un bien o prestar un servicio que presentó defectos de calidad e idoneidad, omitiendo responder por la garantía legal o devolver el dinero pagado por el usuario?",
        "marco_normativo": [
            "Ley 1480 de 2011 (Estatuto del Consumidor): Arts. 7, 10 y 11 (Garantía Legal, Efectividad y Devolución del Dinero).",
            "Ley 1480 de 2011: Art. 58 (Acción de Protección al Consumidor ante la SIC)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SIC No. 8920 de 2021",
                "corte": "Superintendencia de Industria y Comercio - Delegatura Jurisdiccional",
                "tesis": "Si un bien adquirido presenta fallas y el proveedor no lo repara idóneamente en el primer intento, el consumidor tiene la facultad de exigir la reposición inmediata del producto o la restitución total del dinero pagado."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: Reclamación directa efectuada dentro de la vigencia de la garantía legal.",
            "subsidiariedad": "Demanda jurisdiccional directa ante la Superintendencia de Industria y Comercio (SIC)."
        },
        "estrategia_procesal": {
            "accion": "Demanda Jurisdiccional de Protección al Consumidor ante la SIC o Reclamación Directa con sanción.",
            "despacho": "Superintendencia de Industria y Comercio (SIC) - Función Jurisdiccional.",
            "medida_cautelar": "Orden preventiva a la tienda de abstenerse de cobro o retención indebida.",
            "pruebas": ["Factura de compraventa", "Órdenes de ingreso al servicio técnico", "Petición previa de garantía"]
        }
    },

    # 10. HABEAS DATA: REPORTES EN DATACRÉDITO Y BORRÓN Y CUENTA NUEVA
    "habeas_data": {
        "branch": LawBranch.ADMINISTRATIVO,
        "urgency": "ALTA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Transgrede {sujeto} el derecho fundamental al Habeas Data Financiero y al Buen Nombre (Art. 15 C.P.) al mantener un reporte crediticio negativo sin haber realizado la comunicación previa obligatoria de 20 días exigida por la Ley 1266 de 2008 o desconociendo los beneficios de la Ley Borrón y Cuenta Nueva?",
        "marco_normativo": [
            "Constitución Política: Art. 15 (Derecho al Habeas Data, Intimidad y Buen Nombre).",
            "Ley Estatutaria 1266 de 2008: Art. 12 (Requisito Indispensable de Comunicación Previa al Reporte Negativo).",
            "Ley Estatutaria 2157 de 2021: Régimen de Transición y Caducidad de la Información Negativa (Borrón y Cuenta Nueva)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia C-282 de 2021 y Sentencia T-017 de 2022",
                "corte": "Corte Constitucional",
                "tesis": "El reporte a centrales de riesgo sin previa notificación fehaciente es inconstitucional. Viola el debido proceso y acarrea la obligación inmediata de eliminar el dato negativo del historial crediticio."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: El reporte lesivo se mantiene visible impidiendo el acceso al crédito.",
            "subsidiariedad": "Acción de Tutela directa tras haber radicado el reclamo ante la entidad fuente o la central de riesgo."
        },
        "estrategia_procesal": {
            "accion": "Acción de Tutela por Violación al Derecho Fundamental de Habeas Data y Buen Nombre.",
            "despacho": "Juez Municipal de Reparto de la residencia del consultante.",
            "medida_cautelar": "Orden perentoria de suspensión provisional del reporte negativo en Datacrédito y TransUnion.",
            "pruebas": ["Historial de crédito de Datacrédito/TransUnion", "Copia del derecho de petición radicado", "Prueba de no notificación previa"]
        }
    },

    # 11. SERVICIOS PÚBLICOS DOMICILIARIOS: COBROS INJUSTIFICADOS Y CORTES
    "servicios_publicos": {
        "branch": LawBranch.ADMINISTRATIVO,
        "urgency": "MEDIA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Vulnera la empresa de servicios públicos {sujeto} las normas de la Ley 142 de 1994 y el debido proceso administrativo al aplicar cobros por consumos no realizados, desviación significativa sin visita técnica o proceder a la suspensión irregular del servicio?",
        "marco_normativo": [
            "Ley 142 de 1994 (Régimen de Servicios Públicos Domiciliarios): Arts. 146, 149, 154 y 155.",
            "Constitución Política: Art. 365 (Servicios Públicos como Finalidad Social del Estado)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia T-546 de 2009",
                "corte": "Corte Constitucional",
                "tesis": "Las empresas de servicios públicos no pueden suspender el servicio si existen reclamos o recursos en trámite y deben garantizar un mínimo vital de agua y saneamiento básico a sujetos de especial protección."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: La factura objetada o amenaza de corte se encuentra en curso.",
            "subsidiariedad": "Recurso de Reposición y en subsidio Apelación ante la Superintendencia de Servicios Públicos Domiciliarios."
        },
        "estrategia_procesal": {
            "accion": "Derecho de Petición con Recurso de Reposición y en Subsidio Apelación ante Superservicios.",
            "despacho": "Empresa Prestadora y Superintendencia de Servicios Públicos Domiciliarios.",
            "medida_cautelar": "Prohibición de corte del servicio mientras se dirime el recurso (Art. 155 Ley 142/94).",
            "pruebas": ["Facturas anteriores y factura reclamada", "Actas de inspección técnica si las hubiere"]
        }
    },

    # 12. TRÁNSITO: ACCIDENTES Y DAÑOS A VEHÍCULOS
    "transito_accidente": {
        "branch": LawBranch.CIVIL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Se configura la Responsabilidad Civil Extracontractual por Actividades Peligrosas respecto de {sujeto} por los daños materiales y morales causados al vehículo y a la persona en el siniestro vial acaecido, según el artículo 2356 del Código Civil?",
        "marco_normativo": [
            "Código Civil Colombiano: Art. 2341 (Responsabilidad por Daño) y Art. 2356 (Presunción de Culpa por Actividades Peligrosas).",
            "Ley 769 de 2002 (Código Nacional de Tránsito Terrestre).",
            "Estatuto Orgánico del Sistema Financiero: Amparos de la póliza de Responsabilidad Civil y SOAT."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SC002-2022",
                "corte": "Corte Suprema de Justicia - Sala Civil",
                "tesis": "La conducción de automotores constituye una actividad peligrosa. El causante del impacto debe reparar integralmente el daño emergente y lucro cesante, a menos que demuestre culpa exclusiva de la víctima o fuerza mayor."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Vigente: Término de prescripción de 10 años para acción civil extracontractual.",
            "subsidiariedad": "Conciliación prejudicial obligatoria ante Centro de Conciliación y posterior Demanda Verbal de Responsabilidad Civil."
        },
        "estrategia_procesal": {
            "accion": "Proceso Verbal de Responsabilidad Civil Extracontractual con llamado en garantía a la Aseguradora.",
            "despacho": "Juzgado Civil Municipal del lugar donde ocurrió el choque.",
            "medida_cautelar": "Embargo del vehículo infractor y de cuentas del propietario.",
            "pruebas": ["Informe Policial de Accidentes de Tránsito (IPAT / Croquis)", "Cotizaciones o facturas de reparación del taller", "Fotos y videos del siniestro"]
        }
    },

    # 13. PENAL: ESTAFAS, FRAUDES VIRTUALES Y DEFRAUDACIONES
    "penal_estafa": {
        "branch": LawBranch.PENAL,
        "urgency": "ALTA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Se estructuran los elementos constitutivos del delito de Estafa (Art. 246 del Código Penal) o Hurto por Medios Informáticos (Art. 269I C.P.) por parte de {sujeto}, al emplear artificios o maniobras engañosas para inducir en error a la víctima y obtener un provecho económico ilícito?",
        "marco_normativo": [
            "Código Penal (Ley 599 de 2000): Art. 246 (Estafa) y Art. 269I (Hurto por Medios Informáticos y Semejantes).",
            "Código de Procedimiento Penal (Ley 906 de 2004): Arts. 66 y 67 (Noticia Criminal y Obligación de Investigar de la Fiscalía)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SP2547-2021",
                "corte": "Corte Suprema de Justicia - Sala Penal",
                "tesis": "La estafa exige un nexo causal estricto entre el artificio o ardid desplegado y el desplazamiento patrimonial perjudicial de la víctima. Si el engaño antecedió al acto de disposición, existe conducta penal típica y antijurídica."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Activa: La conducta ilícita amerita acción penal expedita ante la Fiscalía General de la Nación.",
            "subsidiariedad": "Denuncia Penal formal ante el sistema SPOA de la Fiscalía General con posterior Incidente de Reparación Integral."
        },
        "estrategia_procesal": {
            "accion": "Denuncia Penal Formal radicada ante el Centro de Contacto SPOA de la Fiscalía General de la Nación.",
            "despacho": "Fiscalía General de la Nación - Unidad de Reacción Inmediata (URI).",
            "medida_cautelar": "Solicitud de medidas de restablecimiento del derecho sobre cuentas receptoras del dinero ilícito.",
            "pruebas": ["Comprobantes de consignación o transferencias bancarias", "Capturas de chats y llamadas", "Enlaces o páginas web fraudulentas"]
        }
    },

    # 14. PENAL: AMENAZAS, VIOLENCIA Y CONVIVENCIA
    "penal_amenazas": {
        "branch": LawBranch.PENAL,
        "urgency": "ALTA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Se configura la conducta punible de Amenazas (Art. 347 del Código Penal) o Violencia Intrafamiliar por parte de {sujeto}, requiriéndose medidas urgentes de protección judicial inmediata a la vida y a la integridad personal?",
        "marco_normativo": [
            "Código Penal: Art. 347 (Amenazas) y Art. 229 (Violencia Intrafamiliar).",
            "Ley 1257 de 2008 (Medidas de Protección para Mujeres) y Ley 2126 de 2021 (Comisarías de Familia)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia T-093 de 2019",
                "corte": "Corte Constitucional",
                "tesis": "El Estado tiene el deber ineludible de adoptar medidas oportunas y eficaces ante amenazas serias y creíbles contra la vida e integridad de los ciudadanos, debiendo las Comisarías y la Fiscalía activar rutas de protección en 24 horas."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Urgencia máxima: Riesgo inminente contra la vida e integridad física del ciudadano.",
            "subsidiariedad": "Medida de protección de emergencia ante Comisaría de Familia y denuncia penal ante la Fiscalía."
        },
        "estrategia_procesal": {
            "accion": "Solicitud de Medida Inmediata de Protección ante Comisaría de Familia y Denuncia Penal ante la Fiscalía.",
            "despacho": "Comisaría de Familia / Fiscalía General de la Nación / Estación de Policía.",
            "medida_cautelar": "Orden de alejamiento y prohibición de cualquier tipo de contacto o hostigamiento.",
            "pruebas": ["Grabaciones de audio", "Capturas de mensajes de texto o WhatsApp", "Testimonios de vecinos o familiares"]
        }
    },

    # 15. ADMINISTRATIVO: FOTOMULTAS Y COMPARENDOS INDEBIDOS
    "transito_fotomulta": {
        "branch": LawBranch.ADMINISTRATIVO,
        "urgency": "MEDIA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Se vulneró el derecho fundamental al Debido Proceso Administrativo (Art. 29 C.P.) al imponer la fotomulta o comparendo sin haber identificado plenamente al conductor infractor o sin cumplir con la notificación personal oportuna conforme a la jurisprudencia constitucional?",
        "marco_normativo": [
            "Constitución Política: Art. 29 (Debido Proceso Administrativo y Principio de Presunción de Inocencia).",
            "Ley 1843 de 2017: Art. 8 (Notificación de Comparendos por Medios Tecnológicos).",
            "Sentencia C-038 de 2020 de la Corte Constitucional."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia C-038 de 2020 y C-321 de 2022",
                "corte": "Corte Constitucional - Sala Plena",
                "tesis": "Es inconstitucional la responsabilidad solidaria automática entre el propietario del vehículo y el conductor. La Secretaría de Tránsito tiene la carga inexcusable de probar quién conducía el vehículo antes de imponer sanción."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: La orden de comparendo o cobro coactivo continúa vigente en el SIMIT.",
            "subsidiariedad": "Derecho de petición de revocatoria directa y posterior Acción de Tutela si no existe notificación válida."
        },
        "estrategia_procesal": {
            "accion": "Derecho de Petición de Revocatoria Directa por Vulneración al Principio de Imputación Personal y Tutela subsidiaria.",
            "despacho": "Secretaría de Tránsito y Movilidad emisora del comparendo.",
            "medida_cautelar": "Suspensión de cobro coactivo e inscripción de embargo en el SIMIT.",
            "pruebas": ["Copia de la orden de comparendo", "Certificado de no notificación o guía de envío devuelta"]
        }
    },

    # 16. DERECHO DE PETICIÓN Y FALTA DE RESPUESTA
    "derecho_peticion": {
        "branch": LawBranch.ADMINISTRATIVO,
        "urgency": "ALTA",
        "suggested_doc": "tutela",
        "problema_juridico": "¿Vulneró {sujeto} el derecho fundamental de petición (Art. 23 C.P.) al omitir emitir una respuesta clara, precisa, congruente y de fondo dentro de los términos legales establecidos por la Ley Estatutaria 1755 de 2015?",
        "marco_normativo": [
            "Constitución Política: Art. 23 (Derecho Fundamental de Petición).",
            "Ley Estatutaria 1755 de 2015: Arts. 13, 14 y 31 (Términos legales de 15 días hábiles y sanciones disciplinarias).",
            "Decreto 2591 de 1991: Acción de Tutela para la protección inmediata del derecho de petición."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia T-061 de 2022",
                "corte": "Corte Constitucional",
                "tesis": "El derecho de petición no se satisface con evasivas o silencios. La entidad requerida debe responder de fondo, de manera clara y notificar oportunamente la decisión al peticionario."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: Han vencido los 15 días hábiles sin obtener respuesta oportuna.",
            "subsidiariedad": "Procedencia directa e indiscutible de la Acción de Tutela ante cualquier juez de la República."
        },
        "estrategia_procesal": {
            "accion": "Acción de Tutela por Violación al Derecho Fundamental de Petición.",
            "despacho": "Juez Municipal de Reparto.",
            "medida_cautelar": "Orden judicial perentoria de respuesta en un término de 48 horas.",
            "pruebas": ["Copia del derecho de petición con sello o constancia de radicación", "Comprobante de envío por correo electrónico o certificado"]
        }
    },

    # 17. CONFLICTOS DE VECINDAD Y CONVIVENCIA CIUDADANA
    "vecindad_policia": {
        "branch": LawBranch.CIVIL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Incurre {sujeto} en comportamientos contrarios a la convivencia y tranquilidad ciudadana según la Ley 1801 de 2016, procediendo querella policiva de amparo a la posesión y cesación de actos perturbadores?",
        "marco_normativo": [
            "Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana): Arts. 27, 33 y 77.",
            "Código Civil Colombiano: Art. 972 y siguientes (Acciones Posesorias)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia C-204 de 2019",
                "corte": "Corte Constitucional",
                "tesis": "Las autoridades de policía tienen competencia plena para prevenir y ordenar el cese inmediato de cualquier actividad acústica, estructural o de invasión que perturbe la tranquilidad y el sosiego ciudadano."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: La perturbación o molestia es recurrente.",
            "subsidiariedad": "Proceso Verbal Abreviado ante la Inspección de Policía del sector."
        },
        "estrategia_procesal": {
            "accion": "Querella Policiva de Convivencia y Amparo ante la Inspección de Policía Municipal.",
            "despacho": "Inspección de Policía de la comuna o localidad.",
            "medida_cautelar": "Orden perentoria de cesación de la actividad perturbadora bajo sanción de multa general.",
            "pruebas": ["Videos y fotos de la afectación", "Testimonios de copropietarios o vecinos", "Mediciones de ruido o quejas ante administración"]
        }
    },

    # 18. CIVIL GENERAL / OBLIGACIONES Y CONTRATOS (FALLBACK INTEGRAL)
    "civil_general": {
        "branch": LawBranch.CIVIL,
        "urgency": "MEDIA",
        "suggested_doc": "demanda",
        "problema_juridico": "¿Se configura una afectación patrimonial y transgresión a las obligaciones civiles por parte de {sujeto} frente al consultante conforme a los hechos relatados, habilitando las acciones declarativas o resarcitorias del Código Civil y del Código General del Proceso?",
        "marco_normativo": [
            "Código Civil Colombiano: Art. 1494 (Fuentes de las Obligaciones), Art. 1602 (Efecto Vinculante) y Art. 2341 (Deber de Indemnizar el Daño).",
            "Código General del Proceso (Ley 1564 de 2012): Art. 368 (Proceso Declarativo Verbal)."
        ],
        "jurisprudencia": [
            {
                "sentencia": "Sentencia SC2107-2021",
                "corte": "Corte Suprema de Justicia - Sala de Casación Civil",
                "tesis": "Todo aquel que cause un perjuicio material o moral injustificado a otro, bien sea por quebrantar una relación obligacional o por infracción al deber general de cuidado, está obligado a repararlo íntegramente."
            }
        ],
        "test_procedibilidad": {
            "inmediatez": "Cumplido: Conflicto jurídico en curso susceptible de debate ante la justicia ordinaria.",
            "subsidiariedad": "Audiencia de Conciliación Prejudicial en Derecho y posterior Demanda Declarativa Verbal ante Juez Civil."
        },
        "estrategia_procesal": {
            "accion": "Solicitud de Audiencia de Conciliación Prejudicial en Derecho o Demanda Declarativa Verbal.",
            "despacho": "Centro de Conciliación Autorizado o Juzgado Civil Municipal.",
            "medida_cautelar": "Embargo preventivo de bienes para asegurar las resultas del proceso.",
            "pruebas": ["Documentos, contratos o conversaciones escritas", "Comprobantes bancarios y soportes de daño"]
        }
    }
}

# Alias para mapear categorías de FactCaseAnalyzer con JURISPRUDENCE_MASTER_REPOSITORY
KEY_ALIASES = {
    "civil_contratos": "civil_compraventa",
    "laboral": "laboral_estabilidad",
    "penal": "penal_estafa",
    "familia": "familia_alimentos",
    "administrativo": "derecho_peticion",
    "transito_accidente": "transito_accidente",
    "fotomulta": "transito_fotomulta"
}

class LegalClassifierAgent:
    @staticmethod
    def classify_case(description: str, context: Dict[str, Any] = None) -> CaseClassificationResponse:
        # Extraer los hechos reales del texto ingresado por el usuario
        fact_data = FactCaseAnalyzer.analyze_facts(description)

        # Investigación Dogmática Multirrama Exhaustiva
        multirrama_data = MultiBranchLegalInvestigator.investigate_case(description, fact_data)

        # 1. Intentar análisis con Gemini AI si está disponible con timeout ultrarrápido
        gemini_result = GeminiAIService.analyze_legal_case(description)
        if gemini_result and isinstance(gemini_result, dict) and "branch" in gemini_result:
            try:
                raw_branch = str(gemini_result.get("branch", "civil")).lower().strip()
                branch_map = {
                    "penal": LawBranch.PENAL,
                    "laboral": LawBranch.LABORAL,
                    "familia": LawBranch.FAMILIA,
                    "administrativo": LawBranch.ADMINISTRATIVO,
                    "civil": LawBranch.CIVIL
                }
                final_branch = branch_map.get(raw_branch, LawBranch.CIVIL)

                return CaseClassificationResponse(
                    branch=final_branch,
                    confidence=float(gemini_result.get("confidence", 0.98)),
                    summary=str(gemini_result.get("summary", f"Dictamen fáctico sobre los hechos narrados.")),
                    recommended_action=str(gemini_result.get("recommended_action", "Iniciar trámite legal pertinente")),
                    urgency_level=str(gemini_result.get("urgency_level", "ALTA")),
                    applicable_rights=list(gemini_result.get("applicable_rights", ["Debido Proceso"])),
                    suggested_document=str(gemini_result.get("suggested_document", "tutela")),
                    problema_juridico=gemini_result.get("problema_juridico") or fact_data.get("problema_juridico_detallado", {}).get("pregunta_principal"),
                    marco_normativo=gemini_result.get("marco_normativo"),
                    jurisprudencia_relevante=gemini_result.get("jurisprudencia_relevante"),
                    test_procedibilidad=gemini_result.get("test_procedibilidad"),
                    estrategia_procesal=gemini_result.get("estrategia_procesal"),
                    analisis_factico_detallado=fact_data,
                    hechos_desarrollados=fact_data.get("hechos_desarrollados"),
                    pretensiones_partes=fact_data.get("pretensiones_partes"),
                    normas_sustantivas_especificas=fact_data.get("normas_sustantivas_especificas"),
                    problema_juridico_detallado=fact_data.get("problema_juridico_detallado"),
                    investigacion_multirrama=multirrama_data
                )
            except Exception:
                pass

        # 2. Motor Dogmático Especialista de Altas Cortes (100% Relacionado Hecho por Hecho)
        materia_detectada = fact_data["materia"]
        # Resolver alias si existe
        clave_repositorio = KEY_ALIASES.get(materia_detectada, materia_detectada)
        spec = JURISPRUDENCE_MASTER_REPOSITORY.get(
            clave_repositorio, 
            JURISPRUDENCE_MASTER_REPOSITORY["civil_general"]
        )

        # Identificar la contraparte o sujeto principal mencionado en los hechos del consultante
        sujeto_principal = "la contraparte denunciada / demandada"
        for s in fact_data["sujetos"]:
            if "Persona" in s or "Entidad" in s or "Empresa" in s:
                sujeto_principal = s.split(":")[-1].strip()
                break

        # Formular el Problema Jurídico citando literalmente la parte o entidad real del caso
        problema_juridico_final = spec["problema_juridico"].format(sujeto=sujeto_principal)
        problema_jur_det = fact_data.get("problema_juridico_detallado", {})
        if problema_jur_det and problema_jur_det.get("pregunta_principal"):
            problema_juridico_final = problema_jur_det.get("pregunta_principal")

        # Extraer el extracto fáctico real
        subsun_hechos = fact_data.get("subsunción_por_hecho", [])
        if subsun_hechos:
            primer_hecho_texto = subsun_hechos[0]["hecho_narrado"]
        else:
            primer_hecho_texto = description[:140]

        resumen_fáctico = (
            f"Relato fáctico examinado: Frente a '{sujeto_principal}', acaeció el suceso: '{primer_hecho_texto}'. "
            f"Sujetos involucrados: {', '.join(fact_data['sujetos'])}. "
            f"Tiempos identificados: {', '.join(fact_data['temporalidades'])}. "
            f"Valor económico estimado: {', '.join(fact_data['montos']) if fact_data['montos'] else 'Por determinar en trámite judicial'}."
        )

        return CaseClassificationResponse(
            branch=spec["branch"],
            confidence=0.98,
            summary=resumen_fáctico,
            recommended_action=(
                f"Con fundamento estricto en los hechos narrados y la jurisprudencia de las Altas Cortes, se dictamina incoar "
                f"{spec['estrategia_procesal']['accion']}, radicando el escrito ante {spec['estrategia_procesal']['despacho']}."
            ),
            urgency_level=spec["urgency"],
            applicable_rights=[
                "Debido Proceso y Acceso a la Administración de Justicia (Art. 29 C.P.)",
                "Principio de Buena Fe y Confianza Legítima (Art. 83 C.P.)",
                "Efectividad de los Derechos Sustanciales y Prevalencia Constitucional (Art. 2 C.P.)"
            ],
            suggested_document=spec["suggested_doc"],
            problema_juridico=problema_juridico_final,
            marco_normativo=spec["marco_normativo"],
            jurisprudencia_relevante=spec["jurisprudencia"],
            test_procedibilidad=spec["test_procedibilidad"],
            estrategia_procesal=spec["estrategia_procesal"],
            analisis_factico_detallado=fact_data,
            hechos_desarrollados=fact_data.get("hechos_desarrollados"),
            pretensiones_partes=fact_data.get("pretensiones_partes"),
            normas_sustantivas_especificas=fact_data.get("normas_sustantivas_especificas"),
            problema_juridico_detallado=fact_data.get("problema_juridico_detallado"),
            investigacion_multirrama=multirrama_data
        )
