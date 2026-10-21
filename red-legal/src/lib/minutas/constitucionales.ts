import { c, LUGAR_FECHA, type Minuta } from "./tipos";

const PETICIONARIO = [
  c("nombre", "Nombre completo de quien firma", "texto", "Ana María Pérez Gómez"),
  c("cedula", "Cédula", "texto", "52.123.456"),
  c("direccion", "Dirección de notificación", "texto", "Calle 10 # 20-30, Bogotá"),
  c("correo", "Correo electrónico", "texto", "ana@correo.com"),
  c("telefono", "Celular", "texto", "300 123 4567"),
];

const FIRMA = `Atentamente,



______________________________
{{nombre}}
C.C. {{cedula}}
Dirección: {{direccion}}
Correo: {{correo}} · Celular: {{telefono}}`;

export const CONSTITUCIONALES: Minuta[] = [
  {
    id: "derecho-de-peticion",
    titulo: "Derecho de petición",
    categoria: "peticiones",
    descripcion: "Solicitud respetuosa a una entidad pública o a un particular para obtener información, documentos o una actuación.",
    baseLegal: "Artículo 23 de la Constitución; Ley 1755 de 2015 (arts. 13 a 33 del CPACA).",
    notas: [
      "Plazo general de respuesta: 15 días hábiles. Documentos e información: 10 días. Consultas: 30 días (art. 14).",
      "Si no responden a tiempo o la respuesta no es de fondo, procede la acción de tutela.",
      "Guarde la constancia de radicación (número y fecha).",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("entidad", "Entidad o persona destinataria", "texto", "EPS Salud Total"),
      c("cargo", "Cargo o dependencia (opcional)", "texto", "Gerente / Oficina de atención al usuario"),
      ...PETICIONARIO,
      c("hechos", "Hechos (uno por línea)", "parrafo", "1. El 5 de agosto solicité la autorización de una cirugía.\n2. A la fecha no he recibido respuesta."),
      c("peticiones", "Lo que solicita (uno por línea)", "parrafo", "1. Autorizar la cirugía ordenada por el médico tratante.\n2. Informar la fecha de programación."),
      c("anexos", "Anexos", "parrafo", "Copia de la cédula. Orden médica."),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señores
{{entidad}}
{{cargo}}
E. S. D.

Referencia: Derecho de petición (artículo 23 de la Constitución Política y Ley 1755 de 2015)

{{nombre}}, identificado(a) con cédula de ciudadanía No. {{cedula}}, en ejercicio del derecho fundamental de petición, respetuosamente me dirijo a ustedes con fundamento en los siguientes:

HECHOS

{{hechos}}

PETICIONES

{{peticiones}}

FUNDAMENTOS DE DERECHO

Artículo 23 de la Constitución Política y artículos 13 y siguientes de la Ley 1437 de 2011, sustituidos por la Ley 1755 de 2015. De acuerdo con el artículo 14, la petición debe resolverse de fondo dentro de los quince (15) días hábiles siguientes a su recepción, o dentro de los diez (10) días si se trata de solicitud de documentos o información.

ANEXOS

{{anexos}}

NOTIFICACIONES

Recibiré respuesta en la dirección {{direccion}} y en el correo electrónico {{correo}}.

${FIRMA}`,
  },
  {
    id: "accion-de-tutela",
    titulo: "Acción de tutela",
    categoria: "constitucionales",
    descripcion: "Protección inmediata de derechos fundamentales vulnerados o amenazados por una autoridad o, en ciertos casos, por un particular.",
    baseLegal: "Artículo 86 de la Constitución; Decreto 2591 de 1991; Decreto 333 de 2021 (reparto).",
    notas: [
      "No necesita abogado. El juez debe decidir en 10 días.",
      "Es subsidiaria: procede si no hay otro medio eficaz o para evitar un perjuicio irremediable.",
      "Si pide medida provisional, explique por qué no puede esperar al fallo (art. 7).",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("juez", "Juez (reparto)", "texto", "Juez Municipal de Bogotá (Reparto)"),
      ...PETICIONARIO,
      c("accionado", "Entidad o persona accionada", "texto", "EPS Salud Total"),
      c("derechos", "Derechos fundamentales vulnerados", "texto", "salud, vida digna y petición"),
      c("hechos", "Hechos (uno por línea)", "parrafo", "1. Tengo diagnóstico de ...\n2. El médico ordenó ...\n3. La EPS no ha autorizado ..."),
      c("pretensiones", "Pretensiones (lo que pide al juez)", "parrafo", "1. Tutelar mis derechos fundamentales a la salud y a la vida digna.\n2. Ordenar a la EPS autorizar y realizar la cirugía en 48 horas."),
      c("medida", "Medida provisional (opcional)", "parrafo", "Solicito ordenar de inmediato la autorización de la cirugía, pues la demora agrava mi estado de salud."),
      c("pruebas", "Pruebas y anexos", "parrafo", "Historia clínica. Orden médica. Derecho de petición radicado el 5 de agosto."),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señor(a)
{{juez}}
E. S. D.

Referencia: ACCIÓN DE TUTELA
Accionante: {{nombre}}
Accionado: {{accionado}}

{{nombre}}, mayor de edad, identificado(a) con cédula de ciudadanía No. {{cedula}}, actuando en nombre propio, presento ACCIÓN DE TUTELA contra {{accionado}}, para que se protejan mis derechos fundamentales a {{derechos}}, con fundamento en los siguientes:

I. HECHOS

{{hechos}}

II. DERECHOS FUNDAMENTALES VULNERADOS

Considero vulnerados mis derechos fundamentales a {{derechos}}, por las acciones u omisiones descritas en los hechos.

III. PRETENSIONES

{{pretensiones}}

IV. MEDIDA PROVISIONAL (artículo 7 del Decreto 2591 de 1991)

{{medida}}

V. FUNDAMENTOS DE DERECHO

Artículo 86 de la Constitución Política y Decreto 2591 de 1991. La acción procede porque no dispongo de otro medio de defensa judicial idóneo y eficaz para la protección inmediata de mis derechos, o para evitar un perjuicio irremediable.

VI. PRUEBAS Y ANEXOS

{{pruebas}}

VII. JURAMENTO

Bajo la gravedad del juramento manifiesto que no he presentado otra acción de tutela por los mismos hechos y derechos (artículo 37 del Decreto 2591 de 1991).

VIII. NOTIFICACIONES

Accionante: {{direccion}} · {{correo}} · {{telefono}}.
Accionado: en su domicilio principal o canal judicial registrado.

${FIRMA}`,
  },
  {
    id: "incidente-de-desacato",
    titulo: "Incidente de desacato",
    categoria: "constitucionales",
    descripcion: "Se presenta ante el juez que concedió la tutela cuando la entidad no cumple el fallo.",
    baseLegal: "Artículos 27 y 52 del Decreto 2591 de 1991.",
    notas: [
      "Se presenta ante el juez de primera instancia, aunque el fallo lo haya dado el de segunda.",
      "La sanción puede ser arresto hasta de 6 meses y multa hasta de 20 salarios mínimos.",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("juzgado", "Juzgado que tramitó la tutela", "texto", "Juzgado 15 Civil Municipal de Bogotá"),
      c("radicado", "Radicado de la tutela", "texto", "11001400301520260012300"),
      ...PETICIONARIO,
      c("accionado", "Entidad que no cumple", "texto", "EPS Salud Total"),
      c("fecha_fallo", "Fecha del fallo", "fecha"),
      c("orden", "Qué ordenó el fallo", "parrafo", "Autorizar y practicar la cirugía dentro de las 48 horas siguientes."),
      c("incumplimiento", "Cómo se ha incumplido", "parrafo", "Han pasado 20 días y la cirugía no se ha autorizado."),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señor(a) Juez
{{juzgado}}
E. S. D.

Referencia: INCIDENTE DE DESACATO
Acción de tutela No. {{radicado}}
Accionante: {{nombre}}
Accionado: {{accionado}}

{{nombre}}, identificado(a) con cédula No. {{cedula}}, en mi calidad de accionante, solicito iniciar INCIDENTE DE DESACATO contra {{accionado}} y su representante legal, por incumplir el fallo de tutela del {{fecha_fallo}}.

1. En el fallo se ordenó: {{orden}}

2. A la fecha el accionado no ha cumplido: {{incumplimiento}}

PETICIONES

1. Requerir al superior del responsable para que haga cumplir el fallo y abra el procedimiento disciplinario (artículo 27 del Decreto 2591 de 1991).
2. Declarar en desacato al responsable e imponer las sanciones del artículo 52 del Decreto 2591 de 1991.
3. Ordenar el cumplimiento inmediato de lo dispuesto en el fallo.

${FIRMA}`,
  },
  {
    id: "accion-popular",
    titulo: "Acción popular",
    categoria: "constitucionales",
    descripcion: "Protege derechos e intereses colectivos: espacio público, ambiente sano, moralidad administrativa, servicios públicos, seguridad y salubridad.",
    baseLegal: "Artículo 88 de la Constitución; Ley 472 de 1998 (art. 18, requisitos); artículo 144 del CPACA.",
    notas: [
      "Contra autoridades o particulares que ejercen función administrativa, antes de demandar debe pedirles que adopten las medidas; si no responden en 15 días puede demandar (art. 144 CPACA), salvo perjuicio irremediable.",
      "No requiere abogado. Puede pedir medidas cautelares.",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("juez", "Juez competente", "texto", "Juez Administrativo de Bogotá (Reparto)"),
      ...PETICIONARIO,
      c("demandado", "Responsable (entidad o particular)", "texto", "Alcaldía Local de Suba"),
      c("derechos", "Derechos colectivos amenazados", "texto", "goce del espacio público y seguridad de los peatones"),
      c("hechos", "Hechos, actos u omisiones", "parrafo", "1. Desde marzo, el andén de la Calle 145 está ocupado por ...\n2. El 10 de agosto se pidió a la Alcaldía ..."),
      c("pretensiones", "Pretensiones", "parrafo", "1. Amparar los derechos colectivos al espacio público.\n2. Ordenar a la Alcaldía restituir el andén en 30 días."),
      c("pruebas", "Pruebas", "parrafo", "Fotografías. Solicitud previa radicada el 10 de agosto y su constancia."),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señor(a)
{{juez}}
E. S. D.

Referencia: ACCIÓN POPULAR
Actor popular: {{nombre}}
Demandado: {{demandado}}

{{nombre}}, identificado(a) con cédula No. {{cedula}}, en ejercicio de la acción popular de los artículos 88 de la Constitución y 2 de la Ley 472 de 1998, presento demanda contra {{demandado}}, así:

I. DERECHOS E INTERESES COLECTIVOS AMENAZADOS O VULNERADOS

{{derechos}} (artículo 4 de la Ley 472 de 1998).

II. HECHOS, ACTOS U OMISIONES

{{hechos}}

III. PRETENSIONES

{{pretensiones}}

IV. REQUISITO DE PROCEDIBILIDAD

Se solicitó previamente al demandado la adopción de las medidas necesarias y no las adoptó dentro de los quince (15) días siguientes (artículo 144 del CPACA). Se anexa constancia.

V. PRUEBAS

{{pruebas}}

VI. NOTIFICACIONES

Actor: {{direccion}} · {{correo}}. Demandado: en su sede o canal judicial registrado.

${FIRMA}`,
  },
  {
    id: "accion-de-grupo",
    titulo: "Acción de grupo",
    categoria: "constitucionales",
    descripcion: "Reclama la indemnización de perjuicios causados por una misma causa a un grupo de al menos 20 personas.",
    baseLegal: "Artículo 88 de la Constitución; Ley 472 de 1998 (arts. 46 a 52); artículo 145 del CPACA cuando el demandado es el Estado.",
    notas: [
      "Debe presentarse por medio de abogado (art. 49).",
      "Caducidad: 2 años desde el daño o desde que cesó la acción vulnerante (art. 47).",
      "Contra entidades públicas se tramita ante la jurisdicción contencioso administrativa (art. 145 CPACA).",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("juez", "Juez competente", "texto", "Juez Civil del Circuito de Bogotá (Reparto)"),
      c("apoderado", "Abogado apoderado", "texto", "Carlos Ruiz Díaz"),
      c("tp", "Tarjeta profesional del abogado", "texto", "123.456"),
      c("cedula_apoderado", "Cédula del abogado", "texto", "79.000.000"),
      c("correo", "Correo del abogado (Registro Nacional de Abogados)", "texto", "abogado@correo.com"),
      c("demandantes", "Demandantes identificados (nombre y cédula, uno por línea)", "parrafo", "1. Ana Pérez, C.C. 52.123.456\n2. Luis Gómez, C.C. 80.111.222"),
      c("criterios", "Criterios para identificar a los demás miembros del grupo", "parrafo", "Personas que compraron apartamentos del proyecto Torres del Parque entre 2023 y 2024."),
      c("demandado", "Demandado", "texto", "Constructora XYZ S.A.S., NIT 900.000.000-1"),
      c("hechos", "Hechos (causa común del daño)", "parrafo", "1. La constructora entregó los apartamentos con fallas estructurales ...\n2. ..."),
      c("perjuicios", "Estimación de los perjuicios", "dinero", "1.500.000.000"),
      c("pretensiones", "Pretensiones", "parrafo", "1. Declarar responsable a la demandada.\n2. Condenarla a pagar la indemnización colectiva estimada."),
      c("pruebas", "Pruebas", "parrafo", "Peritaje técnico. Promesas de compraventa. Reclamaciones presentadas."),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señor(a)
{{juez}}
E. S. D.

Referencia: ACCIÓN DE GRUPO
Demandantes: el grupo descrito en esta demanda
Demandado: {{demandado}}

{{apoderado}}, abogado(a) identificado(a) con cédula No. {{cedula_apoderado}} y tarjeta profesional No. {{tp}}, en calidad de apoderado(a) de las personas relacionadas abajo, quienes actúan en nombre propio y del grupo, presento ACCIÓN DE GRUPO contra {{demandado}}.

I. DEMANDANTES Y GRUPO (artículo 52, numerales 2 y 4, Ley 472 de 1998)

{{demandantes}}

Criterios para identificar a los demás integrantes del grupo: {{criterios}}

El grupo está integrado por un número no inferior a veinte (20) personas que reúnen condiciones uniformes respecto de una misma causa que les originó perjuicios individuales (artículo 46).

II. HECHOS

{{hechos}}

III. ESTIMACIÓN DE LOS PERJUICIOS

Se estiman en la suma de $ {{perjuicios}}, sin perjuicio de lo que resulte probado.

IV. PRETENSIONES

{{pretensiones}}

V. PROCEDENCIA Y OPORTUNIDAD

La acción procede porque el daño proviene de una causa común a todo el grupo y se presenta dentro de los dos (2) años previstos en el artículo 47 de la Ley 472 de 1998.

VI. PRUEBAS

{{pruebas}}

VII. ANEXOS

Poderes otorgados por los demandantes. Certificado de existencia y representación del demandado.

VIII. NOTIFICACIONES

Apoderado: {{correo}}. Demandado: en su domicilio o correo de notificaciones judiciales.



______________________________
{{apoderado}}
C.C. {{cedula_apoderado}} · T.P. {{tp}} del C. S. de la J.`,
  },
];
