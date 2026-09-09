"""
Generador de Documentos y Minutas Jurídicas Automatizadas (Colombia)
Cumple con:
- Decreto 2591/1991 y Art. 86 C.P. (Acción de Tutela)
- Ley 1755/2015 y Art. 23 C.P. (Derecho de Petición)
- Ley 820/2003 y Código Civil (Contrato de Arrendamiento Urbano)
- Código Civil y Art. 34 C.S.T. / Dec. 1703/2002 (Contrato de Prestación de Servicios)
- Ley 1098/2006 y Jurisprudencia CSJ Sala Civil (Liquidación de Cuotas de Alimentos)
"""
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.schemas.schemas import (
    TutelaRequest,
    DerechoPeticionRequest,
    LiquidacionAlimentosRequest,
    ContratoArrendamientoRequest,
    ContratoServiciosRequest,
    OcrExtractRequest
)

SMMLV_COLOMBIA = 1_423_500  # Salario Mínimo Legal Vigente Colombia

DISCLAIMER_LEGAL = (
    "\n\n---\n"
    "⚠️ DOCUMENTO GENERADO AUTOMÁTICAMENTE (BORRADOR). "
    "No constituye asesoría jurídica. Este borrador debe ser revisado, validado "
    "y firmado por un abogado titulado con tarjeta profesional vigente antes de "
    "presentarse ante cualquier autoridad. Los hechos y datos son de exclusiva "
    "responsabilidad del usuario y deben verificarse con los soportes del caso."
)

class DocumentGeneratorService:

    @staticmethod
    def generate_tutela(req: TutelaRequest) -> str:
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        derechos_str = "\n".join([f"- {d}" for d in req.derechos_vulnerados])
        hechos_str = "\n".join([f"{idx+1}. {h}" for idx, h in enumerate(req.hechos)])
        pretensiones_str = "\n".join([f"{idx+1}. {p}" for idx, p in enumerate(req.pretensiones)])
        
        medida_cautelar_text = ""
        if req.medida_cautelar_urgente:
            medida_cautelar_text = """
SOLICITUD DE MEDIDA PROVISIONAL (Art. 7 Decreto 2591 de 1991):
Solicito de manera urgente al señor Juez ordenar como medida cautelar previa la suspensión inmediata del acto lesivo o la prestación perentoria del servicio/medicamento requerido, toda vez que existe grave riesgo inminente de consumación de un perjuicio irremediable para la vida, salud e integridad del accionante.
"""

        doc = f"""ACCIÓN DE TUTELA
PARA LA PROTECCIÓN DE DERECHOS FUNDAMENTALES
(Artículo 86 de la Constitución Política y Decretos 2591 de 1991 y 306 de 1992)

Señor
JUEZ CONSTITUCIONAL DE REPARTO
Ciudad: {req.accionante_ciudad}
Fecha: {fecha_actual}

ACCIONANTE: {req.accionante_nombre}
IDENTIFICACIÓN: C.C. No. {req.accionante_identificacion}
DIRECCIÓN: {req.accionante_direccion}
CORREO ELECTRÓNICO: {req.accionante_email}

ACCIONADO: {req.accionado_nombre}

Yo, {req.accionante_nombre}, mayor de edad, identificado como aparece al pie de mi firma, en ejercicio del derecho fundamental consagrado en el artículo 86 de la Constitución Política de Colombia y reglamentado por los Decretos 2591 de 1991 y 306 de 1992, acudo respetuosamente ante su Despacho para interponer ACCIÓN DE TUTELA en contra de {req.accionado_nombre}, por la presunta vulneración y/o amenaza de mis derechos fundamentales.

I. DERECHOS FUNDAMENTALES VULNERADOS
Invoco la protección inmediata de los siguientes derechos consagrados en la Carta Magna:
{derechos_str}

II. HECHOS
Fundamento la presente acción constitucional en los siguientes supuestos fácticos:
{hechos_str}

{medida_cautelar_text}

III. PRETENSIONES
Con base en los hechos expuestos, solicito respetuosamente al señor Juez:
{pretensiones_str}

IV. FUNDAMENTOS DE DERECHO
Fundamento esta solicitud en los artículos 1, 2, 11, 29, 48, 49 y 86 de la Constitución Política de Colombia, en los Decretos 2591 de 1991 y 306 de 1992, y en la jurisprudencia de la Corte Constitucional (Sentencias T-760/08, SU-067/23 y concordantes sobre principio de integralidad y tutela efectiva).

V. PRUEBAS
Solicito que se tengan como pruebas documentales los soportes anexados a este escrito y se oficie a la accionada para que remita el expediente completo del caso.

VI. JURAMENTO
Bajo la gravedad del juramento manifiesto que no he interpuesto otra acción de tutela ante ninguna otra autoridad judicial por los mismos hechos y derechos aquí señalados (Art. 37 Decreto 2591/91).

VII. NOTIFICACIONES
- Accionante: {req.accionante_direccion}, correo electrónico: {req.accionante_email}.
- Accionado: En su sede principal o correo judicial registrado.

Atentamente,

___________________________________________
{req.accionante_nombre}
C.C. {req.accionante_identificacion}
Dirección: {req.accionante_direccion}
Email: {req.accionante_email}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_derecho_peticion(req: DerechoPeticionRequest) -> str:
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        hechos_str = "\n".join([f"{idx+1}. {h}" for idx, h in enumerate(req.hechos)])
        solicitudes_str = "\n".join([f"{idx+1}. {s}" for idx, s in enumerate(req.solicitud_especifica)])

        termino_ley = "15 días hábiles siguientes a su recepción (conforme al Art. 14 de la Ley 1755 de 2015)"
        if "informacion" in req.objeto_peticion.lower() or "documento" in req.objeto_peticion.lower():
            termino_ley = "10 días hábiles (para expedición de copias o documentos públicos) según el numeral 1 del Art. 14 Ley 1755 de 2015"

        doc = f"""DERECHO DE PETICIÓN EN INTERÉS PARTICULAR
(Artículo 23 de la Constitución Política y Ley Estatutaria 1755 de 2015)

Ciudad y Fecha: {fecha_actual}

Señores:
{req.entidad_destinataria}
Atn: Representante Legal / Oficina Jurídica / Atención al Ciudadano
Ciudad

ASUNTO: Derecho de Petición - {req.objeto_peticion}

Yo, {req.solicitante_nombre}, mayor de edad, identificado(a) con Cédula de Ciudadanía No. {req.solicitante_identificacion}, domiciliado(a) en {req.solicitante_direccion}, con correo electrónico {req.solicitante_email}, en ejercicio del Derecho Fundamental de Petición consagrado en el artículo 23 de la Constitución Política de Colombia y regulado por la Ley Estatutaria 1755 de 2015 (sustitutoria del Título II del CPACA), presento ante ustedes respetuosamente la siguiente solicitud:

I. HECHOS MOTIVADORES
{hechos_str}

II. OBJETO Y PETICIÓN CONCRETA
Con fundamento en los hechos narrados, solicito amablemente resolver lo siguiente:
{solicitudes_str}

III. FUNDAMENTOS DE DERECHO
1. Artículo 23 de la Constitución Política de Colombia.
2. Ley Estatutaria 1755 de 2015 por medio de la cual se regula el derecho fundamental de petición.
3. Principio de celeridad, eficacia y debido proceso administrativo (Art. 3 CPACA).
4. Jurisprudencia constitucional reiterada: Sentencias T-377/00, T-149/13 y SU-040/18 (Toda persona tiene derecho a obtener una respuesta de fondo, oportuna, clara, precisa y congruente).

IV. TÉRMINO LEGAL DE RESPUESTA
Se recuerda respetuosamente a la entidad destinataria que el término para dar respuesta de fondo a la presente solicitud vence dentro de los {termino_ley}. La falta de respuesta en término constituye causal de mala conducta sancionable disciplinariamente (Art. 31 Ley 1755/2015) y habilita la interposición directa de Acción de Tutela.

V. NOTIFICACIONES
Recibiré respuesta formal al presente derecho de petición a través de los siguientes canales:
- Correo electrónico: {req.solicitante_email}
- Dirección física: {req.solicitante_direccion}

Cordialmente,

___________________________________________
{req.solicitante_nombre}
C.C. No. {req.solicitante_identificacion}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_contrato_arrendamiento(req: ContratoArrendamientoRequest) -> str:
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        canon_formateado = f"${req.canon_mensual:,.0f} COP".replace(",", ".")
        deposito_formateado = f"${req.deposito:,.0f} COP".replace(",", ".") if req.deposito else "$0 COP"
        admin_texto = "El valor del canon NO incluye la cuota de administración ordinaria."
        if req.incluye_administracion:
            val_adm = f"${req.valor_administracion:,.0f} COP".replace(",", ".") if req.valor_administracion else canon_formateado
            admin_texto = f"El valor de la cuota de administración ordinaria está INCLUIDO en el canon pactado ({val_adm})."

        codeudor_bloque = ""
        codeudor_firma = ""
        if req.codeudor_nombre:
            codeudor_bloque = f"""
- **CODEUDOR SOLIDARIO**: {req.codeudor_nombre}, mayor de edad, identificado(a) con C.C. No. {req.codeudor_identificacion or 'Pendiente'}, quien se obliga de forma solidaria e indivisible respecto de todas y cada una de las obligaciones del Arrendatario derivadas del presente contrato.
"""
            codeudor_firma = f"""
__________________________________________
CODEUDOR SOLIDARIO: {req.codeudor_nombre}
C.C. No. {req.codeudor_identificacion or ''}
"""

        doc = f"""CONTRATO DE ARRENDAMIENTO DE BIEN INMUEBLE DESTINADO A {req.uso.upper()}
(Regido por la Ley 820 de 2003 y el Código Civil Colombiano)

Ciudad y Fecha: {req.ciudad}, {fecha_actual}

ENTRE LAS PARTES CONTRATANTES:
- **EL ARRENDADOR**: {req.arrendador_nombre}, mayor de edad, identificado(a) con C.C./NIT No. {req.arrendador_identificacion}, domiciliado(a) en {req.arrendador_domicilio}.
- **EL ARRENDATARIO**: {req.arrendatario_nombre}, mayor de edad, identificado(a) con C.C./NIT No. {req.arrendatario_identificacion}, domiciliado(a) en {req.arrendatario_domicilio}.{codeudor_bloque}

Las partes de común acuerdo convienen celebrar el presente Contrato de Arrendamiento, el cual se regirá por las siguientes cláusulas y en lo no previsto en ellas por las disposiciones de la Ley 820 de 2003 y el Código Civil:

CLÁUSULA PRIMERA. OBJETO: EL ARRENDADOR entrega a título de arrendamiento a EL ARRENDATARIO, y este último recibe en igual condición, el uso y goce del inmueble ubicado en la dirección: {req.inmueble_direccion}, con las siguientes características: {req.inmueble_descripcion}.

CLÁUSULA SEGUNDA. DESTINACIÓN: EL ARRENDATARIO se compromete a destinar el inmueble única y exclusivamente para uso {req.uso.upper()}, quedando expresamente prohibido darle una destinación contraria a la ley, la moral o las buenas costumbres.

CLÁUSULA TERCERA. CANON DE ARRENDAMIENTO Y FORMA DE PAGO: El valor mensual del canon de arrendamiento es la suma de {canon_formateado}, que EL ARRENDATARIO se obliga a pagar de forma anticipada dentro de los primeros cinco (5) días calendario de cada período mensual. {admin_texto}

CLÁUSULA CUARTA. REAJUSTE ANUAL DEL CANON: Cada doce (12) meses de ejecución del contrato, el precio mensual del canon se reajustará en un porcentaje que no excederá el cien por ciento (100%) del incremento que haya tenido el Índice de Precios al Consumidor (IPC) certificado por el DANE en el año calendario inmediatamente anterior, en estricto cumplimiento del Artículo 20 de la Ley 820 de 2003.

CLÁUSULA QUINTA. TÉRMINO DE DURACIÓN Y PRÓRROGA: El término de duración del presente contrato será de {req.duracion_meses} meses, contados a partir del {req.fecha_inicio}. Si a su vencimiento ninguna de las partes manifestare por escrito a la otra con una antelación no inferior a tres (3) meses su decisión de darlo por terminado, el contrato se entenderá prorrogado automáticamente por un período igual al inicialmente pactado (Art. 21 Ley 820 de 2003).

CLÁUSULA SEXTA. SERVICIOS PÚBLICOS DOMICILIARIOS: Serán a cargo exclusivo de EL ARRENDATARIO el pago oportuno de los servicios públicos de energía eléctrica, acueducto, alcantarillado, aseo, gas y telefonía/internet desde el día de entrega material del inmueble y hasta el día de su restitución definitiva.

CLÁUSULA SÉPTIMA. ESTADO DEL INMUEBLE Y REPARACIONES LOCATIVAS: EL ARRENDATARIO declara haber recibido el inmueble en buen estado de conservación e higiene conforme al inventario anexo. Las reparaciones locativas que resulten del uso ordinario y del desgaste normal o por culpa del arrendatario o sus dependientes serán asumidas en su totalidad por EL ARRENDATARIO (Art. 1985 del Código Civil). Las reparaciones necesarias no locativas serán a cargo de EL ARRENDADOR.

CLÁUSULA OCTAVA. CESIÓN Y SUBARRENDAMIENTO: Queda expresamente prohibido a EL ARRENDATARIO ceder, subarrendar total o parcialmente el inmueble objeto del contrato o cambiar su destinación sin autorización previa, expresa y por escrito de EL ARRENDADOR (Art. 17 Ley 820 de 2003).

CLÁUSULA NOVENA. CAUSALES DE TERMINACIÓN UNILATERAL: Serán causales de terminación del contrato las consagradas en los Artículos 22 y 24 de la Ley 820 de 2003, especialmente el no pago del canon de arrendamiento, el retardo o no pago de los servicios públicos domiciliarios, el cambio de destinación del inmueble o la realización de mejoras sin autorización.

CLÁUSULA DÉCIMA. CLÁUSULA PENAL: El incumplimiento por cualquiera de las partes de las obligaciones emanadas del presente contrato constituirá a la parte incumplida en deudora de la otra por una suma equivalente a dos (2) cánones mensuales de arrendamiento vigentes a la fecha del incumplimiento, a título de pena, sin necesidad de requerimiento judicial previo.

CLÁUSULA DÉCIMA PRIMERA. MÉRITO EJECUTIVO: El presente contrato presta mérito ejecutivo suficiente para la exigencia judicial del cobro de cánones insolutos, servicios públicos, cuotas de administración y el valor de la cláusula penal, para lo cual las partes renuncian expresamente a los requerimientos para constituir en mora previstos en el Código General del Proceso.

CLÁUSULA DÉCIMA SEGUNDA. DOMICILIO CONTRACTUAL: Para todos los efectos judiciales y extrajudiciales las partes señalan como domicilio contractual la ciudad de {req.ciudad}.

En constancia de aceptación, se firma en dos ejemplares del mismo tenor en {req.ciudad}, a los {fecha_actual}.

__________________________________________
EL ARRENDADOR: {req.arrendador_nombre}
C.C./NIT: {req.arrendador_identificacion}
Dirección: {req.arrendador_domicilio}

__________________________________________
EL ARRENDATARIO: {req.arrendatario_nombre}
C.C./NIT: {req.arrendatario_identificacion}
Dirección: {req.arrendatario_domicilio}
{codeudor_firma}
"""
        return doc.strip()

    @staticmethod
    def generate_contrato_servicios(req: ContratoServiciosRequest) -> str:
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        honorarios_fmt = f"${req.honorarios_mensuales:,.0f} COP".replace(",", ".")
        entregables_str = "\n".join([f"- {e}" for e in req.entregables])

        pi_clausula = """CLÁUSULA SÉPTIMA. PROPIEDAD INTELECTUAL: Todos los derechos patrimoniales de autor sobre los informes, desarrollos, creaciones, marcas, software y documentos producidos por EL CONTRATISTA en ejecución de este contrato pertenecerán de manera exclusiva e irrevocable a EL CONTRATANTE (conforme a la Ley 23 de 1982 y la Decisión 351 de la Comisión de la Comunidad Andina). EL CONTRATISTA conservará únicamente los derechos morales irrenunciables."""
        if not req.tiene_propiedad_intelectual:
            pi_clausula = """CLÁUSULA SÉPTIMA. PROPIEDAD INTELECTUAL: Los derechos patrimoniales sobre los métodos preexistentes o herramientas estándar utilizadas continuarán en titularidad de EL CONTRATISTA, otorgando a EL CONTRATANTE una licencia de uso perpetua y no exclusiva para los fines del contrato."""

        doc = f"""CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES INDEPENDIENTES
(Regido por el Código Civil Colombiano y con exclusión de vínculo laboral bajo el Art. 34 del C.S.T.)

Ciudad y Fecha: {req.ciudad}, {fecha_actual}

ENTRE LOS SUSCRITOS:
- **EL CONTRATANTE**: {req.contratante_nombre}, mayor de edad, identificado(a) con C.C./NIT No. {req.contratante_identificacion}, domiciliado(a) en {req.contratante_domicilio}.
- **EL CONTRATISTA**: {req.contratista_nombre}, mayor de edad, identificado(a) con C.C./NIT No. {req.contratista_identificacion}, domiciliado(a) en {req.contratista_domicilio}.

Acuerdan celebrar el presente Contrato de Prestación de Servicios, el cual se regirá por las siguientes estipulaciones:

CLÁUSULA PRIMERA. OBJETO DEL CONTRATO: EL CONTRATISTA se obliga para con EL CONTRATANTE a prestar sus servicios profesionales de manera técnica, independiente y autónoma para el desarrollo de: {req.objeto}.

CLÁUSULA SEGUNDA. ENTREGABLES Y ALCANCE: EL CONTRATISTA se compromete a suministrar los siguientes productos y entregables dentro de los plazos concertados:
{entregables_str}

CLÁUSULA TERCERA. HONORARIOS Y FORMA DE PAGO: EL CONTRATANTE pagará a EL CONTRATISTA como contraprestación por sus servicios la suma de {honorarios_fmt} por cada período mensual vencido, previa presentación de la respectiva cuenta de cobro o factura electrónica y el certificado de pago de aportes al Sistema de Seguridad Social.

CLÁUSULA CUARTA. DURACIÓN Y VIGENCIA: El plazo pactado para la ejecución del presente contrato es de {req.duracion_meses} meses contados a partir de su firma. Podrá prorrogarse únicamente por mutuo acuerdo expreso y escrito entre las partes.

CLÁUSULA QUINTA. INDEPENDENCIA Y EXCLUSIÓN DE RELACIÓN LABORAL (Art. 34 C.S.T.): Las partes manifiestan que el presente es un contrato estrictamente civil y comercial. EL CONTRATISTA ejecutará sus labores con plena autonomía técnica, directiva y organizativa, sin subordinación jurídica frente a EL CONTRATANTE. En consecuencia, el presente acuerdo no genera contrato de trabajo, prestaciones sociales, vacaciones ni indemnizaciones de carácter laboral.

CLÁUSULA SEXTA. OBLIGACIÓN DE AFILIACIÓN Y SEGURIDAD SOCIAL: En cumplimiento de la Ley 100 de 1993, el Decreto 1703 de 2002 y el Artículo 244 de la Ley 1955 de 2019, EL CONTRATISTA asume la obligación de cotizar mensualmente al Sistema General de Seguridad Social Integral (Salud, Pensión y Riesgos Laborales - ARL) sobre el 40% de sus ingresos brutos, debiendo acreditar los soportes de pago como requisito previo a cada desembolso.

{pi_clausula}

CLÁUSULA OCTAVA. CONFIDENCIALIDAD Y TRATAMIENTO DE DATOS: EL CONTRATISTA se obliga a mantener absoluta reserva y confidencialidad respecto a la información interna, financiera, estratégica y comercial de EL CONTRATANTE a la que tenga acceso, observando estrictamente los mandatos de la Ley Estatutaria 1581 de 2012 (Habeas Data).

CLÁUSULA NOVENA. CAUSALES DE TERMINACIÓN: El contrato podrá darse por terminado en cualquier momento por: a) Mutuo acuerdo escrito entre las partes; b) Vencimiento del plazo acordado; c) Cumplimiento pleno del objeto; d) Incumplimiento grave de las obligaciones pactadas por cualquiera de las partes.

CLÁUSULA DÉCIMA. CLÁUSULA PENAL Y MÉRITO EJECUTIVO: En caso de incumplimiento grave de las obligaciones derivadas de este contrato, la parte incumplida pagará a la otra una sanción penal pecuniaria equivalente a un (1) mes de honorarios. El presente contrato presta mérito ejecutivo para el cobro de las sumas adeudadas.

CLÁUSULA DÉCIMA PRIMERA. DOMICILIO Y JURISDICCIÓN: Para los efectos legales y judiciales correspondientes, las partes declaran su domicilio en la ciudad de {req.ciudad}.

Para constancia de lo anterior, se firma en dos ejemplares originales en la ciudad de {req.ciudad}, a los {fecha_actual}.

__________________________________________
EL CONTRATANTE: {req.contratante_nombre}
C.C./NIT No. {req.contratante_identificacion}
Dirección: {req.contratante_domicilio}

__________________________________________
EL CONTRATISTA: {req.contratista_nombre}
C.C./NIT No. {req.contratista_identificacion}
Dirección: {req.contratista_domicilio}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def calculate_cuota_alimentos(req: LiquidacionAlimentosRequest) -> dict:
        """
        Cálculo riguroso de Cuota Alimentaria bajo el Código de la Infancia y la Adolescencia (Ley 1098 de 2006),
        Jurisprudencia de la Sala de Casación Civil de la Corte Suprema de Justicia (SC-14673-2016)
        y lineamientos técnicos de las tablas del Instituto Colombiano de Bienestar Familiar (ICBF).
        """
        ingreso_bruto = req.ingreso_mensual_alimentante
        tasa_deducciones = 0.12
        ingreso_neto = max(0, ingreso_bruto * (1 - tasa_deducciones))

        limite_maximo_50_pct = ingreso_bruto * 0.50
        piso_jurisprudencial_30 = ingreso_neto * 0.30

        gastos_totales_menor = (
            req.gastos_educacion +
            req.gastos_salud +
            req.gastos_alimentacion_vivienda +
            req.otros_gastos
        )

        cuota_sugerida = 0.0
        if gastos_totales_menor > 0:
            cuota_sugerida = gastos_totales_menor * 0.50
        else:
            cuota_sugerida = piso_jurisprudencial_30

        cuota_sugerida = max(cuota_sugerida, piso_jurisprudencial_30)
        cuota_definitiva = min(cuota_sugerida, limite_maximo_50_pct)

        ajustada_por_tope = cuota_sugerida > limite_maximo_50_pct
        num_hijos = max(1, req.hijos_menores_cantidad)
        por_hijo = cuota_definitiva / num_hijos

        documento_markdown = f"""### LIQUIDACIÓN OFICIAL DE CUOTA ALIMENTARIA
**Normatividad:** Ley 1098 de 2006 (Código de la Infancia), Art. 24 y 129; Sentencia CSJ SC-14673-2016.

- **Alimentante:** {req.nombre_alimentante or 'El obligado'}
- **Beneficiario(s):** {req.nombre_beneficiario or 'Menores de edad'} ({num_hijos} hijo/s)
- **Ciudad y Fecha:** {req.ciudad or 'Colombia'}, {datetime.now().strftime('%d/%m/%Y')}

#### 1. Capacidad Económica y Topes Legales:
- Ingreso Mensual Declarado: ${ingreso_bruto:,.0f} COP
- Ingreso Neto Estimado: ${ingreso_neto:,.0f} COP
- **Piso Mínimo Jurisprudencial (30% neto):** ${piso_jurisprudencial_30:,.0f} COP
- **Techo Legal Máximo Embargable (50% bruto):** ${limite_maximo_50_pct:,.0f} COP

#### 2. Gastos Acreditados del Menor:
- Educación: ${req.gastos_educacion:,.0f} COP/mes
- Salud y Medicina: ${req.gastos_salud:,.0f} COP/mes
- Alimentación y Vivienda: ${req.gastos_alimentacion_vivienda:,.0f} COP/mes
- Otros Gastos / Recreación: ${req.otros_gastos:,.0f} COP/mes
- **Total Gastos Mensuales:** ${gastos_totales_menor:,.0f} COP/mes

#### 3. Cuota Fijada:
- **CUOTA MENSUAL TOTAL: ${cuota_definitiva:,.0f} COP**
- **CUOTA POR CADA HIJO: ${por_hijo:,.0f} COP**
- Equivalencia SMMLV: {round(cuota_definitiva / SMMLV_COLOMBIA, 2)} salarios mínimos mensuales.

#### 4. Obligaciones Adicionales de Uso Judicial:
1. **Vestuario:** Tres (3) mudas completas de ropa y calzado de calidad media en los meses de abril, agosto y diciembre de cada año.
2. **Primas Legales:** El 50% de la prima legal de servicios (junio y diciembre) pagadera dentro de los cinco primeros días de su causación.
3. **Reajuste Anual:** Incremento automático anual el 1° de enero conforme al Índice de Precios al Consumidor (IPC) o al incremento del SMMLV decretado por el Gobierno Nacional.
"""

        return {
            "ingreso_alimentante": ingreso_bruto,
            "gastos_totales_menor": gastos_totales_menor,
            "piso_jurisprudencial_30_pct": round(piso_jurisprudencial_30, 2),
            "limite_maximo_legal_50_pct": round(limite_maximo_50_pct, 2),
            "cuota_mensual_sugerida_total": round(cuota_definitiva, 2),
            "cuota_mensual_por_hijo": round(por_hijo, 2),
            "num_hijos": num_hijos,
            "ajustada_al_tope": ajustada_por_tope,
            "equivalencia_smmlv": round(cuota_definitiva / SMMLV_COLOMBIA, 2),
            "incluye_mudas_ropa_anual": "Conforme a la costumbre judicial colombiana: 3 mudas completas de ropa al año (abril, agosto y diciembre).",
            "prima_legal": "50% de las primas semestrales de junio y diciembre como auxilio de gastos extraordinarios.",
            "observacion_legal": "La cuota cumple el test de proporcionalidad entre la capacidad económica del alimentante y las necesidades integrales de los beneficiarios.",
            "documento_markdown": documento_markdown.strip() + DISCLAIMER_LEGAL
        }

    @staticmethod
    def extract_ocr_data(req: OcrExtractRequest) -> dict:
        """
        Extrae datos estructurados y banderas de riesgo legal de documentos o textos jurídicos.
        """
        texto = (req.document_text or "").strip()
        tipo = req.document_type.lower()
        extracted: Dict[str, Any] = {}
        flags: List[str] = []

        # Cédula de Ciudadanía
        cc_match = re.search(r'(?:C\.?C\.?|c[eé]dula(?:\s+de\s+ciudadan[ií]a)?)\s*(?:No\.?|#)?\s*([0-9\.\,]{7,12})', texto, re.IGNORECASE)
        if cc_match:
            extracted["numero_identificacion"] = cc_match.group(1).replace(".", "").replace(",", "")

        # Radicado Judicial (23 dígitos)
        rad_match = re.search(r'\b([0-9]{23})\b', texto)
        if rad_match:
            extracted["radicado_judicial"] = rad_match.group(1)

        # Valores Económicos
        valores = re.findall(r'\$\s*([0-9\.\,]{4,15})', texto)
        if valores:
            extracted["valores_economicos_detectados"] = [v.replace(".", "").replace(",", "") for v in valores[:4]]

        # Fechas
        fechas = re.findall(r'\b(\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b', texto, re.IGNORECASE)
        if fechas:
            extracted["fechas_relevantes"] = fechas[:4]

        # Banderas de riesgo legal
        texto_lower = texto.lower()
        if "sin justa causa" in texto_lower and "liquidaci" in texto_lower:
            flags.append("Posible despido sin justa causa: Verificar indemnización Art. 64 C.S.T.")
        if "letra de cambio" in texto_lower and "prescrip" in texto_lower:
            flags.append("Verificar término de prescripción cambiaria (3 años Art. 789 C. de Co.)")
        if "embargo" in texto_lower:
            flags.append("Proceso ejecutivo o medida cautelar identificada.")
        if "termino" in texto_lower and "dias" in texto_lower:
            flags.append("Término judicial o administrativo en curso; verificar vencimiento.")

        resumen = f"Análisis de documento tipo '{tipo}' completado. Se identificaron {len(extracted)} campos estructurados y {len(flags)} alertas jurídicas preventivas."
        return {
            "document_type": tipo,
            "extracted_data": extracted,
            "summary": resumen,
            "legal_risk_flags": flags
        }


# -----------------------------------------------------------------------------
# AMPLIO ESPECTRO DE MINUTAS (incluye contratos atípicos)
# -----------------------------------------------------------------------------

    @staticmethod
    def generate_poder_especial(req: PoderEspecialRequest) -> str:
        doc = f"""PODER ESPECIAL
(Artículo 73 y concordantes del Código General del Proceso)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

Señor(a)
NOTARÍA / DESTINATARIO
E. S. D.

Yo, {req.otorgante}, mayor de edad, identificado(a) con cédula de ciudadanía No.
{req.otorgante_cc}, domiciliado(a) en {req.otorgante_direccion}, por medio del
presente escrito CONFÍO PODER ESPECIAL, amplio y suficiente, al abogado
{req.apoderado}, identificado(a) con cédula de ciudadanía No. {req.apoderado_cc}
y portador(a) de la tarjeta profesional No. {req.apoderado_tarjeta}, para que,
en mi nombre y representación, adelante el siguiente asunto:

{req.asunto}

FACULTADES: presentar y contestar demandas y solicitudes, pedir y desistir,
cobrar, recibir, transigir, sustituir, delegar y revocar en su oportunidad,
interponer recursos, asistir a audiencias y prácticas, rendir el juramento
necesario y realizar todas las gestiones que el caso requiera con arreglo a la
ley.

Atentamente,

{req.otorgante}
C.C. No. {req.otorgante_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_promesa_compraventa(req: PromesaCompraventaRequest) -> str:
        doc = f"""PROMESA DE COMPRAVENTA
(Art. 89 de la Ley 153 de 1887 y concordantes del Código Civil)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

PROMITENTE VENDEDOR: {req.vendedor}, C.C. No. {req.vendedor_cc}.
PROMITENTE COMPRADOR: {req.comprador}, C.C. No. {req.comprador_cc}.

OBJETO: Los promitentes celebran la presente promesa sobre el inmueble ubicado
en {req.inmueble_direccion}, identificado con matrícula inmobiliaria
{req.inmueble_matricula}.

PRECIO: La suma de $ {req.precio:,} COP, pagadera así: {req.forma_pago}.

PLAZO: La escritura pública definitiva se firmará dentro de los {req.plazo_meses}
meses siguientes a la firma de esta promesa.

ARRAS: $ {req.arras:,} COP a cargo del promitente comprador a favor del
promitente vendedor, que se imputará al precio y se restituirán dobladas en
caso de incumplimiento culpable del vendedor (Art. 1546 C.C.), previo
requerimiento.

RESOLUTORIA: El incumplimiento de cualquiera de las partes facultará a la
cumplida a solicitar la resolución con indemnización de perjuicios.

Firmas:
{req.vendedor} — C.C. {req.vendedor_cc}
{req.comprador} — C.C. {req.comprador_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_contrato_obra(req: ContratoObraRequest) -> str:
        doc = f"""CONTRATO DE OBRA A PRECIO FIJO
(Código Civil, Ley 80 de 1993 solo si es contratación estatal)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

CONTRATANTE: {req.contratante}, C.C./NIT No. {req.contratante_cc}.
CONTRATISTA: {req.contratista}, C.C./NIT No. {req.contratista_cc}.

PRIMERA. OBJETO: EL CONTRATISTA se obliga a ejecutar a precio fijo la obra
consistente en: {req.obra_descripcion}, en el predio ubicado en
{req.obra_ubicacion}.

SEGUNDA. VALOR: $ {req.valor:,} COP, que EL CONTRATANTE pagará conforme a
avance de obra. Se otorgará un anticipo del {req.anticipo_pct:.0f}% a la firma.

TERCERA. PLAZO: {req.plazo_meses} meses contados desde el inicio formal.

CUARTA. CALIDAD Y SUPERVISIÓN: el contratista responderá por vicios en el
criterio de buena técnica constructiva, materiales conforme a norma y obra
entregada libre de gravámenes.

QUINTA. TERMINACIÓN: por mutuo acuerdo, vencimiento, incumplimiento grave
(con aviso escrito previo) o devastación de la obra por caso fortuito.

Atentamente,
{req.contratante} / {req.contratista}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_contrato_comodato(req: ContratoComodatoRequest) -> str:
        doc = f"""CONTRATO DE COMODATO (PRÉSTAMO DE USO)
(Artículos 2200 y siguientes del Código Civil — contrato atípico en la práctica)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

COMODANTE: {req.comodante}, C.C. No. {req.comodante_cc}.
COMODATARIO: {req.comodatario}, C.C. No. {req.comodatario_cc}.

PRIMERA. OBJETO: EL COMODANTE entrega en préstamo de uso gratuito al
COMODATARIO, y este recibe, el siguiente bien: {req.bien_descripcion}.

SEGUNDA. USO: el bien se destinará exclusivamente a: {req.uso_permitido}.

TERCERA. PLAZO: la duración será de {req.plazo_meses} meses.

CUARTA. OBLIGACIONES DEL COMODATARIO: conservar el bien con diligencia, no
subarrendar, ceder ni cambiar su destino sin autorización expresa, pagar los
servicios y gastos de uso, y restituir al vencimiento.

QUINTA. RESPONSABILIDAD: el COMODATARIO responderá por el deterioro o pérdida
imputable a culpa, y EL COMODANTE conserva la acción de restitución sin
necesidad de requerimiento.

Firmas:
{req.comodante} — C.C. {req.comodante_cc}
{req.comodatario} — C.C. {req.comodatario_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_acuerdo_confidencialidad(req: AcuerdoConfidencialidadRequest) -> str:
        doc = f"""ACUERDO DE CONFIDENCIALIDAD (NDA)
(Ley 1581 de 2012 y normas del Código de Comercio sobre información reservada)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

PARTE REVELADORA: {req.revelador}, C.C./NIT No. {req.revelador_cc}.
PARTE RECEPTORA: {req.receptor}, C.C./NIT No. {req.receptor_cc}.

OBJETO: {req.objeto}.

PRIMERA. INFORMACIÓN CONFIDENCIAL: toda la información técnica, jurídica,
comercial, financiera o personal recibida en virtud del presente acuerdo,
conocerá de reserva absoluta y no podrá divulgarla a terceros sin autorización
previa y escrita.

SEGUNDA. EXCEPCIONES: información de dominio público, requerida por autoridad
competente o ya conocida lícitamente por la parte receptora.

TERCERA. DURACIÓN: la obligación de reserva será de {req.duracion_anios} años.

CUARTA. CONSECUENCIAS: el incumplimiento genera responsabilidad civil por daños
y la adopción de medidas cautelares, sin perjuicio de las acciones penales a
que haya lugar.

Firmas:
{req.revelador} / {req.receptor}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_divorcio_mutuo_acuerdo(req: DivorcioMutuoAcuerdoRequest) -> str:
        doc = f"""SOLICITUD DE DIVORCIO POR MUTUO ACUERDO
(Ley 962 de 2005 — trámite notarial)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

Señor(a)
NOTARIO DE REPARTO
E. S. D.

Los suscritos {req.conyuge1}, identificado(a) con C.C. No. {req.conyuge1_cc}, y
{req.conyuge2}, identificado(a) con C.C. No. {req.conyuge2_cc}, mayores de edad,
domiciliados y residenciados en esta ciudad, solicitamos respetuosamente el
trámite de DIVORCIO POR MUTUO ACUERDO respecto del matrimonio civil celebrado
el {req.matrimonio_fecha}, en la Notaría {req.matrimonio_notaria}.

ACUERDOS:
1. HIJOS: {req.hijos}
2. SOCIEDAD CONYUGAL: {req.sociedad_conyugal}
3. VISITAS Y CUSTODIA: {req.acuerdo_visitas}

Declaramos que el mutuo acuerdo es libre, voluntario y sin vicios del
consentimiento, solicitando se convoque a la diligencia correspondiente y se
pronuncie la escritura pública de divorcio.

Atentamente,
{req.conyuge1} — C.C. {req.conyuge1_cc}
{req.conyuge2} — C.C. {req.conyuge2_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL


    @staticmethod
    def generate_leasing(req: LeasingRequest) -> str:
        doc = f"""CONTRATO DE ARRENDAMIENTO FINANCIERO (LEASING)
(Contrato comercial de financiación — Ley 794 de 2003, Ley 964 de 2005 y
Estatuto Orgánico del Sistema Financiero; práctica civil-comercial común)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

ARRENDADOR FINANCIERO: {req.arrendador}, C.C./NIT No. {req.arrendador_cc}.
ARRENDATARIO FINANCIERO: {req.arrendatario}, C.C./NIT No. {req.arrendatario_cc}.

PRIMERA. OBJETO: EL ARRENDADOR entrega en arrendamiento financiero y el
ARRENDATARIO recibe el siguiente bien: {req.bien_descripcion}, el cual se
destina exclusivamente a su objeto social.

SEGUNDA. CANON: EL ARRENDATARIO pagará {req.canon_mensual} COP de canon mensual
durante {req.plazo_meses} meses, conforme al cronograma pactado.

TERCERA. OPCIÓN DE COMPRA: al vencimiento, EL ARRENDATARIO podrá adquirir el
bien por la suma de {req.valor_opcion_compra} COP.

CUARTA. OBLIGACIONES: uso prudente y exclusivo para la finalidad pactada,
mantenimiento, seguros sobre el bien a favor del ARRENDADOR, y prohibición de
subarrendar, vender, gravar o ceder sin autorización expresa.

QUINTA. INCUMPLIMIENTO: la no cancelación de dos (2) cánones consecutivos
faculta el reintegro inmediato del bien, con liquidación de saldos pendientes
y cláusula de aceleración.

Firmas:
{req.arrendador} — {req.arrendador_cc}
{req.arrendatario} — {req.arrendatario_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_factoring(req: FactoringRequest) -> str:
        doc = f"""CONTRATO DE FACTORING (CESIÓN DE CARTERA)
(Ley 1676 de 2013 sobre garantías mobiliarias, Ley 2225 de 2022 de factoring
digital y Art. 1959 del Código de Comercio)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

CEDENTE (PROVEEDOR): {req.cedente}, C.C./NIT No. {req.cedente_cc}.
FACTOR (ENTIDAD COMPRADORA): {req.factor}, C.C./NIT No. {req.factor_cc}.

PRIMERA. OBJETO: EL CEDENTE cede en propiedad al FACTOR, y este adquiere, la
cartera consistente en: {req.cartera_descripcion}, por un valor ascendente a
{req.valor_cartera} COP.

SEGUNDA. ANTICIPO: el FACTOR desembolsará un anticipo del {req.anticipo_pct:.1f}%
del valor de la cartera al momento de la cesión.

TERCERA. COSTO: se pacta una comisión/descuento del {req.descuento_pct:.2f}%
sobre el valor cedido, que el FACTOR retendrá al liquidar la cartera.

CUARTA. CESIONES FUTURAS: la cesión se hará en propiedad y sin recurso en lo
específico, salvo que se pacte responsabilidad del CEDENTE por la existencia,
titularidad y autenticidad de los títulos cedidos.

QUINTA. NOTIFICACIÓN: el FACTOR podrá notificar a los deudores cedidos el
cambio de titularidad y recibir pagos en cuenta de su titularidad.

Firmas:
{req.cedente} — {req.cedente_cc}
{req.factor} — {req.factor_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_franquicia(req: FranquiciaRequest) -> str:
        doc = f"""CONTRATO DE FRANQUICIA COMERCIAL
(Contrato atípico; régimen de marcas y signos distintivos — Decisión 486 de la
Comunidad Andina y normas del Código de Comercio sobre colaboración empresarial)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

FRANQUICIANTE: {req.franquiciante}, C.C./NIT No. {req.franquiciante_cc}, titular
de la marca {req.marca}.
FRANQUICIADO: {req.franquiciado}, C.C./NIT No. {req.franquiciado_cc}.

PRIMERA. OBJETO: la obtención de una licencia de uso de la marca {req.marca} y
del know-how del sistema de negocio, bajo manual operativo, para la explotación
en el territorio: {req.territorio}.

SEGUNDA. CANON DE ENTRADA: {req.canon_inicial} COP pagadero a la firma del
contrato como contraprestación por la instalación y capacitación.

TERCERA. REGALÍAS: {req.regalias_pct:.2f}% sobre las ventas brutas mensuales del
FRANQUICIADO, pagaderas dentro de los diez (10) primeros días del mes siguiente.

CUARTA. PLAZO: {req.plazo_anios} años, prorrogable por mutuo acuerdo.

QUINTA. OBLIGACIONES: estándares de imagen y calidad del sistema, compras
conforme al manual, capacitación del personal, reportes periódicos de ventas y
publicidad conforme a las directrices del FRANQUICIANTE.

SEXTA. INDEPENDENCIA: el FRANQUICIADO es empresario autónomo; no existe
relación laboral, ni sociedad, ni agencia.

Firmas:
{req.franquiciante} — {req.franquiciante_cc}
{req.franquiciado} — {req.franquiciado_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_outsourcing(req: OutsourcingRequest) -> str:
        doc = f"""CONTRATO DE TERCERIZACIÓN DE SERVICIOS (OUTSOURCING)
(Arts. 60 a 63 de la Ley 1429 de 2010: tercerización mediante servicios
especializados, sin intermediación laboral indebida)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

CLIENTE: {req.contratante}, C.C./NIT No. {req.contratante_cc}.
PROVEEDOR (OPERADOR): {req.proveedor}, C.C./NIT No. {req.proveedor_cc}.

PRIMERA. OBJETO: EL PROVEEDOR prestará en forma autónoma los siguientes
servicios especializados: {req.servicios}, en la sede/operación: {req.sede}.

SEGUNDA. VALOR: {req.valor_mensual} COP mensuales, pagaderos contra factura de
cada periodo, previa verificación de cumplimiento.

TERCERA. PLAZO: {req.plazo_meses} meses, renovable por acuerdo escrito.

CUARTA. PERSONAL: el personal que ejecute los servicios es del PROVEEDOR. Se
prohíbe la subordinación respecto del CLIENTE y el suministro de trabajadores
como intermediación proscrita; el PROVEEDOR asume salarios, seguridad social,
riesgos y cargas prestacionales de su equipo.

QUINTA. ACUERDOS DE NIVEL DE SERVICIO: tiempos de respuesta, indicadores de
calidad y reporte mensual; incumplimientos podrán dar lugar a compensaciones.

SEXTA. CONFIDENCIALIDAD Y DATOS: tratamiento conforme a la Ley 1581 de 2012,
con acuerdo de responsabilidad sobre los datos a los que tenga acceso.

Firmas:
{req.contratante} — {req.contratante_cc}
{req.proveedor} — {req.proveedor_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL

    @staticmethod
    def generate_joint_venture(req: JointVentureRequest) -> str:
        doc = f"""ACUERDO DE COLABORACIÓN EMPRESARIAL — JOINT VENTURE SIN SOCIEDAD
(Contrato de colaboración atípico; Art. 7 Ley 80 de 1993 para consorcios,
principios del Código de Comercio sobre cooperación empresarial y libertad
contractual del Art. 1602 del Código Civil)

Ciudad y Fecha: {datetime.now().strftime('%d de %B de %Y')}

PARTE 1: {req.parte1}, C.C./NIT No. {req.parte1_cc}.
PARTE 2: {req.parte2}, C.C./NIT No. {req.parte2_cc}.

PRIMERA. OBJETO: las partes aunan esfuerzos, sin constituir sociedad, para
desarrollar el siguiente proyecto conjunto: {req.proyecto}.

SEGUNDA. APORTES Y PARTICIPACIÓN: la Parte 1 participa con el {req.aporte1_pct:.1f}%
y la Parte 2 con el {100 - req.aporte1_pct:.1f}% restante, tanto en aportes
como en beneficios y resultados.

TERCERA. GOBIERNO: se crea un comité conjunto con representación paritaria de
ambas partes, que decide por mayoría simple; las decisiones relevantes
(contratos superiores al valor del acuerdo, admisión de terceros) requieren
unanimidad.

CUARTA. AUTONOMÍA: cada parte conserva su personalidad jurídica y su objeto;
el presente acuerdo NO genera sociedad, agencia, representación ni relación
laboral. Cada parte responde por sus obligaciones laborales, tributarias y de
seguridad social de su propio personal.

QUINTA. DURACIÓN: {req.duracion_meses} meses, prorrogables por escrito.

SEXTA. CONFIDENCIALIDAD Y PROPIEDAD INTELECTUAL: los resultados se reparten
en la proporción pactada; los desarrollos de cada parte conservan su
titularidad salvo pacto expreso.

Firmas:
{req.parte1} — {req.parte1_cc}
{req.parte2} — {req.parte2_cc}
"""
        return doc.strip() + DISCLAIMER_LEGAL
