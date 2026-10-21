import { c, LUGAR_FECHA, type Minuta } from "./tipos";

const parte = (rol: string, ejemplo: string) => [
  c(`${rol}_nombre`, `Nombre del ${rol}`, "texto", ejemplo),
  c(`${rol}_cedula`, `Cédula o NIT del ${rol}`, "texto", "C.C. 52.123.456"),
  c(`${rol}_direccion`, `Dirección del ${rol}`, "texto", "Calle 10 # 20-30, Bogotá"),
];

const firmas = (a: string, b: string) => `


______________________________          ______________________________
{{${a}_nombre}}                          {{${b}_nombre}}
{{${a}_cedula}}                          {{${b}_cedula}}
${a.toUpperCase()}                       ${b.toUpperCase()}`;

export const CONTRATOS: Minuta[] = [
  {
    id: "arrendamiento-vivienda",
    titulo: "Contrato de arrendamiento de vivienda urbana",
    categoria: "contratos",
    descripcion: "Arriendo de casa o apartamento para vivienda, con las reglas obligatorias de la ley de arrendamientos.",
    baseLegal: "Ley 820 de 2003.",
    notas: [
      "El canon se puede reajustar cada 12 meses hasta el IPC del año anterior (art. 20).",
      "Están prohibidos los depósitos en dinero (art. 16); se pueden pedir codeudores o pólizas.",
      "El arrendador puede terminar al vencimiento avisando con 3 meses y pagando la indemnización legal (art. 22 y 23).",
    ],
    campos: [
      ...LUGAR_FECHA,
      ...parte("arrendador", "Pedro Ramírez"),
      ...parte("arrendatario", "Laura Torres"),
      c("inmueble", "Dirección e identificación del inmueble", "texto", "Apartamento 302, Carrera 15 # 80-20, Bogotá, matrícula 50C-123456"),
      c("linderos", "Descripción o linderos", "parrafo", "Apartamento de 65 m², 2 habitaciones, 1 baño, cocina, sala comedor y parqueadero 12."),
      c("canon", "Canon mensual", "dinero", "1.800.000"),
      c("pago", "Forma y lugar de pago", "texto", "transferencia a la cuenta de ahorros No. 000-000000 del Banco X, dentro de los 5 primeros días de cada mes"),
      c("inicio", "Fecha de inicio", "fecha"),
      c("duracion", "Duración", "texto", "doce (12) meses"),
      c("servicios", "Servicios públicos a cargo del arrendatario", "texto", "energía, acueducto, gas, internet y administración"),
      c("codeudor", "Codeudor (nombre y cédula, opcional)", "texto", "Jorge Torres, C.C. 80.555.666"),
    ],
    texto: `CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA

Entre {{arrendador_nombre}}, identificado(a) con {{arrendador_cedula}}, domiciliado(a) en {{arrendador_direccion}}, quien en adelante se llamará EL ARRENDADOR, y {{arrendatario_nombre}}, identificado(a) con {{arrendatario_cedula}}, quien en adelante se llamará EL ARRENDATARIO, se celebra el presente contrato de arrendamiento de vivienda urbana, regido por la Ley 820 de 2003 y por las siguientes cláusulas:

PRIMERA. OBJETO. EL ARRENDADOR entrega a título de arrendamiento a EL ARRENDATARIO el inmueble ubicado en {{inmueble}}, con la siguiente descripción: {{linderos}}. El inmueble se destinará exclusivamente a vivienda de EL ARRENDATARIO y su familia.

SEGUNDA. CANON. El canon mensual es de $ {{canon}}, que EL ARRENDATARIO pagará por anticipado mediante {{pago}}. El canon se reajustará cada doce (12) meses en una proporción que no exceda el ciento por ciento (100%) del incremento del índice de precios al consumidor del año calendario anterior (artículo 20 de la Ley 820 de 2003).

TERCERA. TÉRMINO. El término del contrato es de {{duracion}}, contados desde el {{inicio}}. Si ninguna de las partes avisa su terminación en la forma prevista en la ley, el contrato se prorrogará automáticamente por un término igual (artículo 6).

CUARTA. SERVICIOS. Estarán a cargo de EL ARRENDATARIO los siguientes servicios y cuotas: {{servicios}}.

QUINTA. ENTREGA E INVENTARIO. El inmueble se entrega en buen estado, según el inventario firmado por las partes, que hace parte de este contrato. EL ARRENDATARIO lo restituirá en el mismo estado, salvo el deterioro por el uso normal.

SEXTA. OBLIGACIONES. Las partes cumplirán las obligaciones de los artículos 8 y 9 de la Ley 820 de 2003. EL ARRENDATARIO no podrá subarrendar ni ceder el contrato sin autorización escrita de EL ARRENDADOR.

SÉPTIMA. MEJORAS. EL ARRENDATARIO no hará mejoras sin autorización escrita. Las autorizadas quedarán a favor del inmueble, salvo pacto en contrario.

OCTAVA. TERMINACIÓN. El contrato termina por las causales de los artículos 21 a 25 de la Ley 820 de 2003. La mora en el pago del canon es causal para que EL ARRENDADOR pida la restitución del inmueble.

NOVENA. CODEUDOR. Se obliga solidariamente con EL ARRENDATARIO por todas las obligaciones de este contrato: {{codeudor}}.

DÉCIMA. NOTIFICACIONES. Las partes recibirán notificaciones en las direcciones indicadas; EL ARRENDATARIO, en el inmueble arrendado (artículo 12).

Se firma en {{ciudad}}, el {{fecha}}, en dos ejemplares del mismo tenor.
${firmas("arrendador", "arrendatario")}


______________________________
{{codeudor}}
CODEUDOR`,
  },
  {
    id: "prestacion-de-servicios",
    titulo: "Contrato de prestación de servicios",
    categoria: "contratos",
    descripcion: "Servicios independientes, sin subordinación ni horario, pagados por honorarios.",
    baseLegal: "Código Civil (arts. 1495 y siguientes, 2063 y siguientes) y Código de Comercio; Decreto 1273 de 2018 (seguridad social del independiente).",
    notas: [
      "Si hay subordinación, horario y salario, en realidad es un contrato de trabajo y genera prestaciones sociales.",
      "El contratista independiente cotiza a seguridad social sobre el 40% del valor mensual.",
    ],
    campos: [
      ...LUGAR_FECHA,
      ...parte("contratante", "Comercializadora Andina S.A.S."),
      ...parte("contratista", "Julián Méndez"),
      c("objeto", "Servicio contratado", "parrafo", "Diseño y mantenimiento de la página web de EL CONTRATANTE."),
      c("entregables", "Entregables u obligaciones específicas", "parrafo", "1. Entregar el diseño en 15 días.\n2. Hacer dos actualizaciones al mes.\n3. Presentar informe mensual."),
      c("valor", "Valor total", "dinero", "6.000.000"),
      c("forma_pago", "Forma de pago", "texto", "seis (6) pagos mensuales de $1.000.000 previa presentación de cuenta de cobro y pago de seguridad social"),
      c("duracion", "Duración", "texto", "seis (6) meses"),
      c("inicio", "Fecha de inicio", "fecha"),
    ],
    texto: `CONTRATO DE PRESTACIÓN DE SERVICIOS

Entre {{contratante_nombre}}, identificado(a) con {{contratante_cedula}}, domiciliado(a) en {{contratante_direccion}}, en adelante EL CONTRATANTE, y {{contratista_nombre}}, identificado(a) con {{contratista_cedula}}, domiciliado(a) en {{contratista_direccion}}, en adelante EL CONTRATISTA, se celebra este contrato de prestación de servicios, que se rige por las siguientes cláusulas:

PRIMERA. OBJETO. EL CONTRATISTA prestará con sus propios medios, autonomía técnica y administrativa el siguiente servicio: {{objeto}}

SEGUNDA. OBLIGACIONES ESPECÍFICAS. {{entregables}}

TERCERA. VALOR Y FORMA DE PAGO. El valor total es de $ {{valor}}, pagadero así: {{forma_pago}}.

CUARTA. DURACIÓN. El contrato dura {{duracion}} desde el {{inicio}} y puede prorrogarse por escrito.

QUINTA. AUTONOMÍA. EL CONTRATISTA actúa con plena independencia, sin subordinación ni horario. Este contrato no genera relación laboral ni prestaciones sociales.

SEXTA. SEGURIDAD SOCIAL. EL CONTRATISTA se afiliará y cotizará como independiente a salud, pensión y riesgos laborales, y acreditará el pago para recibir cada desembolso.

SÉPTIMA. CONFIDENCIALIDAD. EL CONTRATISTA guardará reserva de la información que conozca por causa del contrato, durante su vigencia y dos (2) años más.

OCTAVA. TERMINACIÓN. El contrato termina por vencimiento del plazo, mutuo acuerdo, o por incumplimiento grave de cualquiera de las partes, avisado por escrito.

NOVENA. SOLUCIÓN DE CONTROVERSIAS. Las diferencias se intentarán resolver directamente; si no es posible, ante un centro de conciliación de {{ciudad}}.

Se firma en {{ciudad}}, el {{fecha}}.
${firmas("contratante", "contratista")}`,
  },
  {
    id: "compraventa-vehiculo",
    titulo: "Contrato de compraventa de vehículo",
    categoria: "contratos",
    descripcion: "Venta de carro o moto entre particulares, con las obligaciones de traspaso.",
    baseLegal: "Código Civil (arts. 1849 y siguientes) y Código de Comercio; Ley 769 de 2002 (traspaso ante el organismo de tránsito y RUNT).",
    notas: [
      "La propiedad solo cambia con el registro del traspaso en el organismo de tránsito.",
      "Verifique en el RUNT y en SIMIT que el vehículo no tenga multas, embargos ni prendas.",
    ],
    campos: [
      ...LUGAR_FECHA,
      ...parte("vendedor", "Ricardo Silva"),
      ...parte("comprador", "Natalia Ríos"),
      c("vehiculo", "Clase, marca, línea y modelo", "texto", "Automóvil Mazda 2 Touring, modelo 2021"),
      c("placa", "Placa", "texto", "ABC123"),
      c("motor", "Número de motor", "texto", "P5123456"),
      c("chasis", "Número de chasis o VIN", "texto", "3MDDJ2SA1MM123456"),
      c("transito", "Organismo de tránsito donde está matriculado", "texto", "Secretaría de Movilidad de Bogotá"),
      c("precio", "Precio", "dinero", "58.000.000"),
      c("forma_pago", "Forma de pago", "texto", "transferencia bancaria a la firma de este contrato"),
      c("entrega", "Fecha de entrega", "fecha"),
    ],
    texto: `CONTRATO DE COMPRAVENTA DE VEHÍCULO

Entre {{vendedor_nombre}}, identificado(a) con {{vendedor_cedula}}, en adelante EL VENDEDOR, y {{comprador_nombre}}, identificado(a) con {{comprador_cedula}}, en adelante EL COMPRADOR, se celebra el siguiente contrato:

PRIMERA. OBJETO. EL VENDEDOR transfiere a EL COMPRADOR el derecho de dominio sobre el vehículo {{vehiculo}}, placa {{placa}}, motor No. {{motor}}, chasis No. {{chasis}}, matriculado en {{transito}}.

SEGUNDA. PRECIO. El precio es de $ {{precio}}, que EL COMPRADOR paga mediante {{forma_pago}}.

TERCERA. ENTREGA. El vehículo se entregará el {{entrega}}, con sus documentos, llaves y accesorios, en el estado en que EL COMPRADOR declara conocerlo y aceptarlo.

CUARTA. LIBERTAD Y SANEAMIENTO. EL VENDEDOR garantiza que el vehículo es de su exclusiva propiedad y está libre de prendas, embargos, multas, comparendos e impuestos pendientes hasta la fecha de entrega, y saldrá al saneamiento conforme a la ley.

QUINTA. TRASPASO. Las partes firmarán el formulario de solicitud de trámite y realizarán el traspaso ante el organismo de tránsito dentro de los diez (10) días hábiles siguientes. Los gastos del traspaso se pagarán por partes iguales, salvo acuerdo distinto.

SEXTA. RESPONSABILIDAD. Desde la entrega, EL COMPRADOR responde por el uso del vehículo, las infracciones y los daños que cause. EL VENDEDOR responde por los hechos anteriores a la entrega.

Se firma en {{ciudad}}, el {{fecha}}.
${firmas("vendedor", "comprador")}`,
  },
  {
    id: "promesa-de-compraventa",
    titulo: "Promesa de compraventa de inmueble",
    categoria: "contratos",
    descripcion: "Compromiso de firmar más adelante la escritura de venta de una casa, apartamento o lote.",
    baseLegal: "Artículo 1611 del Código Civil (modificado por el art. 89 de la Ley 153 de 1887).",
    notas: [
      "Para ser válida debe constar por escrito y fijar la notaría, la fecha y la hora para firmar la escritura.",
      "Revise antes el certificado de tradición y libertad (no más de 30 días).",
    ],
    campos: [
      ...LUGAR_FECHA,
      ...parte("prometiente_vendedor", "Sofía Herrera"),
      ...parte("prometiente_comprador", "Andrés Castro"),
      c("inmueble", "Inmueble (dirección, matrícula y cédula catastral)", "texto", "Casa en la Calle 50 # 30-10, Medellín, matrícula 001-123456"),
      c("linderos", "Linderos y área", "parrafo", "Por el norte con ..., por el sur con ...; área de 120 m²."),
      c("titulo", "Cómo lo adquirió el vendedor", "texto", "compra según escritura 1234 del 5 de mayo de 2015 de la Notaría 10 de Medellín"),
      c("precio", "Precio", "dinero", "350.000.000"),
      c("forma_pago", "Forma de pago", "parrafo", "a) $35.000.000 a la firma de esta promesa como arras.\nb) $315.000.000 el día de la firma de la escritura."),
      c("notaria", "Notaría", "texto", "Notaría 20 de Medellín"),
      c("fecha_escritura", "Fecha para la escritura", "fecha"),
      c("hora", "Hora", "texto", "10:00 a.m."),
      c("arras", "Valor de las arras o cláusula penal", "dinero", "35.000.000"),
    ],
    texto: `PROMESA DE COMPRAVENTA DE INMUEBLE

Entre {{prometiente_vendedor_nombre}}, identificado(a) con {{prometiente_vendedor_cedula}}, en adelante EL PROMITENTE VENDEDOR, y {{prometiente_comprador_nombre}}, identificado(a) con {{prometiente_comprador_cedula}}, en adelante EL PROMITENTE COMPRADOR, se celebra el presente contrato de promesa de compraventa:

PRIMERA. OBJETO. EL PROMITENTE VENDEDOR promete vender y EL PROMITENTE COMPRADOR promete comprar el inmueble {{inmueble}}, con los siguientes linderos y área: {{linderos}}.

SEGUNDA. TRADICIÓN. EL PROMITENTE VENDEDOR adquirió el inmueble por {{titulo}}, y garantiza que está libre de embargos, hipotecas, demandas, limitaciones al dominio y deudas de impuestos, valorización y servicios.

TERCERA. PRECIO Y FORMA DE PAGO. El precio es de $ {{precio}}, que se pagará así:
{{forma_pago}}

CUARTA. ESCRITURA. La escritura pública de compraventa se firmará en la {{notaria}}, el {{fecha_escritura}} a las {{hora}}.

QUINTA. ENTREGA. El inmueble se entregará real y materialmente el día de la firma de la escritura, a paz y salvo por todo concepto.

SEXTA. ARRAS / CLÁUSULA PENAL. La parte que incumpla pagará a la otra, a título de pena, la suma de $ {{arras}}, sin perjuicio de exigir el cumplimiento del contrato.

SÉPTIMA. GASTOS. Los gastos notariales se pagarán por partes iguales; la retención en la fuente estará a cargo del vendedor y los gastos de beneficencia y registro, del comprador.

Para constancia se firma en {{ciudad}}, el {{fecha}}, en dos ejemplares.
${firmas("prometiente_vendedor", "prometiente_comprador")}`,
  },
  {
    id: "contrato-trabajo-termino-fijo",
    titulo: "Contrato de trabajo a término fijo",
    categoria: "contratos",
    descripcion: "Contrato laboral con fecha de terminación, con salario y prestaciones sociales.",
    baseLegal: "Código Sustantivo del Trabajo, arts. 22, 46 y 78.",
    notas: [
      "Debe constar por escrito y no puede pasar de 3 años, aunque es renovable.",
      "Para no renovarlo hay que avisar por escrito con 30 días de anticipación.",
      "El periodo de prueba no puede exceder la quinta parte del término ni 2 meses.",
    ],
    campos: [
      ...LUGAR_FECHA,
      ...parte("empleador", "Restaurante El Fogón S.A.S."),
      ...parte("trabajador", "Camila Ortiz"),
      c("cargo", "Cargo", "texto", "Auxiliar de cocina"),
      c("funciones", "Funciones principales", "parrafo", "Preparar alimentos, mantener el orden y aseo de la cocina, ..."),
      c("salario", "Salario mensual", "dinero", "1.750.905"),
      c("jornada", "Jornada", "texto", "de lunes a sábado, dentro de la jornada máxima legal"),
      c("lugar", "Lugar de trabajo", "texto", "Calle 85 # 12-30, Bogotá"),
      c("inicio", "Fecha de inicio", "fecha"),
      c("duracion", "Duración", "texto", "seis (6) meses"),
      c("prueba", "Periodo de prueba", "texto", "treinta y seis (36) días"),
    ],
    texto: `CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO

Empleador: {{empleador_nombre}}, {{empleador_cedula}}, domicilio {{empleador_direccion}}.
Trabajador(a): {{trabajador_nombre}}, {{trabajador_cedula}}, domicilio {{trabajador_direccion}}.
Cargo: {{cargo}}. Salario mensual: $ {{salario}}. Lugar de trabajo: {{lugar}}.
Fecha de inicio: {{inicio}}. Duración: {{duracion}}.

Entre las partes se celebra el presente contrato de trabajo a término fijo, regido por las siguientes cláusulas:

PRIMERA. OBJETO. EL EMPLEADOR contrata los servicios personales de EL TRABAJADOR para desempeñar el cargo de {{cargo}}, con las siguientes funciones: {{funciones}}, y las demás afines que le asigne EL EMPLEADOR.

SEGUNDA. SALARIO. EL EMPLEADOR pagará un salario mensual de $ {{salario}}, en periodos quincenales o mensuales. Además pagará el auxilio de transporte cuando corresponda, las prestaciones sociales de ley y los aportes a seguridad social y parafiscales.

TERCERA. JORNADA. EL TRABAJADOR cumplirá la jornada {{jornada}}. El trabajo suplementario solo se causará cuando sea autorizado.

CUARTA. TÉRMINO. El contrato tiene una duración de {{duracion}} desde el {{inicio}}. Si ninguna de las partes avisa por escrito su decisión de no prorrogarlo con al menos treinta (30) días de anticipación, se renovará por un período igual (artículo 46 del CST).

QUINTA. PERIODO DE PRUEBA. Las partes pactan un periodo de prueba de {{prueba}}, durante el cual cualquiera puede terminar el contrato sin previo aviso ni indemnización (artículo 78 del CST).

SEXTA. OBLIGACIONES. EL TRABAJADOR cumplirá el reglamento interno, las órdenes e instrucciones de EL EMPLEADOR y las normas de seguridad y salud en el trabajo, y guardará reserva sobre la información de la empresa.

SÉPTIMA. JUSTAS CAUSAS. Son justas causas para terminar el contrato las de los artículos 62 y 63 del CST.

Se firma en {{ciudad}}, el {{fecha}}, en dos ejemplares.
${firmas("empleador", "trabajador")}`,
  },
  {
    id: "poder-especial",
    titulo: "Poder especial",
    categoria: "procesales",
    descripcion: "Autoriza a un abogado para representar a una persona en un proceso o trámite determinado.",
    baseLegal: "Artículo 74 del Código General del Proceso; artículo 5 de la Ley 2213 de 2022 (poder por mensaje de datos).",
    notas: [
      "El asunto debe quedar determinado y claramente identificado.",
      "Puede enviarse por correo electrónico sin firma manuscrita ni presentación personal, indicando el correo del abogado inscrito en el Registro Nacional de Abogados.",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("destinatario", "Autoridad o juez", "texto", "Juez Civil Municipal de Bogotá (Reparto)"),
      c("poderdante", "Nombre de quien otorga el poder", "texto", "Ana María Pérez Gómez"),
      c("cedula", "Cédula del poderdante", "texto", "52.123.456"),
      c("apoderado", "Nombre del abogado", "texto", "Carlos Ruiz Díaz"),
      c("cedula_apoderado", "Cédula del abogado", "texto", "79.000.000"),
      c("tp", "Tarjeta profesional", "texto", "123.456"),
      c("correo_apoderado", "Correo del abogado (Registro Nacional de Abogados)", "texto", "abogado@correo.com"),
      c("asunto", "Asunto para el que se otorga", "parrafo", "inicie y lleve hasta su terminación proceso ejecutivo contra Luis Gómez, C.C. 80.111.222, para el cobro de la letra de cambio del 1 de marzo de 2026 por $10.000.000"),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señor(a)
{{destinatario}}
E. S. D.

Referencia: PODER ESPECIAL

{{poderdante}}, mayor de edad, identificado(a) con cédula de ciudadanía No. {{cedula}}, confiero PODER ESPECIAL, amplio y suficiente a {{apoderado}}, abogado(a) identificado(a) con cédula No. {{cedula_apoderado}} y tarjeta profesional No. {{tp}} del Consejo Superior de la Judicatura, correo electrónico {{correo_apoderado}}, inscrito en el Registro Nacional de Abogados, para que en mi nombre y representación {{asunto}}.

Mi apoderado(a) queda facultado(a) para recibir, conciliar, transigir, desistir, sustituir, reasumir, presentar recursos y, en general, para todo lo necesario en defensa de mis intereses, conforme al artículo 77 del Código General del Proceso.

Otorgo este poder por mensaje de datos, en los términos del artículo 5 de la Ley 2213 de 2022.

Atentamente,



______________________________
{{poderdante}}
C.C. {{cedula}}

Acepto,



______________________________
{{apoderado}}
C.C. {{cedula_apoderado}} · T.P. {{tp}}`,
  },
  {
    id: "acuerdo-de-pago",
    titulo: "Acuerdo de pago",
    categoria: "contratos",
    descripcion: "Reconocimiento de una deuda y plan de cuotas para pagarla.",
    baseLegal: "Código Civil, arts. 1495, 1602 y 2469; artículo 422 del Código General del Proceso (título ejecutivo).",
    notas: ["Si la obligación es clara, expresa y exigible, este documento sirve para cobrar por la vía ejecutiva si no se paga."],
    campos: [
      ...LUGAR_FECHA,
      ...parte("acreedor", "Inversiones Delta S.A.S."),
      ...parte("deudor", "Mario Vargas"),
      c("origen", "Origen de la deuda", "texto", "facturas de venta No. 101 a 105 por suministro de materiales"),
      c("total", "Valor total reconocido", "dinero", "4.800.000"),
      c("cuotas", "Plan de pagos", "parrafo", "Seis (6) cuotas mensuales de $800.000, pagaderas el día 10 de cada mes, desde el 10 de noviembre de 2026."),
      c("cuenta", "Cuenta para los pagos", "texto", "cuenta de ahorros No. 000-000000 del Banco X"),
    ],
    texto: `ACUERDO DE PAGO

Entre {{acreedor_nombre}}, identificado(a) con {{acreedor_cedula}}, en adelante EL ACREEDOR, y {{deudor_nombre}}, identificado(a) con {{deudor_cedula}}, domiciliado(a) en {{deudor_direccion}}, en adelante EL DEUDOR, se celebra el siguiente acuerdo:

PRIMERA. RECONOCIMIENTO. EL DEUDOR reconoce deber a EL ACREEDOR la suma de $ {{total}}, por concepto de {{origen}}.

SEGUNDA. PLAN DE PAGOS. EL DEUDOR pagará esa suma así: {{cuotas}} Los pagos se harán en {{cuenta}}.

TERCERA. MORA Y ACELERACIÓN. Si EL DEUDOR no paga una cuota en la fecha pactada, EL ACREEDOR podrá declarar vencido el plazo y exigir el saldo total, con intereses moratorios a la tasa máxima legal, sin necesidad de requerimiento.

CUARTA. MÉRITO EJECUTIVO. Este documento contiene una obligación clara, expresa y exigible, y presta mérito ejecutivo (artículo 422 del Código General del Proceso).

QUINTA. PAZ Y SALVO. Pagada la totalidad, EL ACREEDOR expedirá paz y salvo dentro de los cinco (5) días hábiles siguientes.

Se firma en {{ciudad}}, el {{fecha}}.
${firmas("acreedor", "deudor")}`,
  },
];
