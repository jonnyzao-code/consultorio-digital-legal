import { c, LUGAR_FECHA, type Minuta } from "./tipos";

export const PROCESALES: Minuta[] = [
  {
    id: "recurso-de-reposicion",
    titulo: "Recurso de reposición y en subsidio apelación",
    categoria: "procesales",
    descripcion: "Pide al juez que revoque o reforme un auto y, si no lo hace, que lo envíe al superior.",
    baseLegal: "Código General del Proceso, arts. 318, 320, 321 y 322.",
    notas: [
      "Plazo: 3 días siguientes a la notificación del auto por estado (art. 318).",
      "La apelación subsidiaria solo procede contra los autos enumerados en el artículo 321 o en norma especial.",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("juzgado", "Juzgado", "texto", "Juzgado 20 Civil Municipal de Bogotá"),
      c("proceso", "Clase de proceso", "texto", "Ejecutivo singular"),
      c("radicado", "Radicado", "texto", "11001400302020260012300"),
      c("demandante", "Demandante", "texto", "Ana María Pérez Gómez"),
      c("demandado", "Demandado", "texto", "Luis Gómez Arias"),
      c("auto", "Auto recurrido (fecha y decisión)", "texto", "auto del 10 de octubre de 2026 que negó el mandamiento de pago"),
      c("razones", "Razones del recurso", "parrafo", "1. El título cumple los requisitos de los artículos 621 y 671 del Código de Comercio ...\n2. ..."),
      c("peticion", "Lo que solicita", "parrafo", "Revocar el auto recurrido y, en su lugar, librar mandamiento de pago."),
      c("firmante", "Nombre del apoderado o parte", "texto", "Carlos Ruiz Díaz"),
      c("identificacion", "Cédula y tarjeta profesional", "texto", "C.C. 79.000.000 · T.P. 123.456"),
      c("correo", "Correo para notificaciones", "texto", "abogado@correo.com"),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señor(a) Juez
{{juzgado}}
E. S. D.

Referencia: {{proceso}}
Radicado: {{radicado}}
Demandante: {{demandante}}
Demandado: {{demandado}}

Asunto: RECURSO DE REPOSICIÓN Y EN SUBSIDIO DE APELACIÓN

{{firmante}}, en la calidad reconocida en el proceso, dentro del término legal interpongo recurso de reposición y, en subsidio, de apelación contra el {{auto}}, con fundamento en las siguientes:

RAZONES DE INCONFORMIDAD

{{razones}}

PETICIÓN

{{peticion}}

En caso de no reponerse la decisión, solicito conceder el recurso de apelación ante el superior, conforme a los artículos 320 a 322 del Código General del Proceso.

Recibo notificaciones en {{correo}}.

Atentamente,



______________________________
{{firmante}}
{{identificacion}}`,
  },
  {
    id: "reclamo-garantia",
    titulo: "Reclamación por garantía (consumidor)",
    categoria: "consumidor",
    descripcion: "Reclamo directo al vendedor o productor por un producto defectuoso o un servicio mal prestado.",
    baseLegal: "Ley 1480 de 2011 (Estatuto del Consumidor), arts. 7, 10, 11 y 58.",
    notas: [
      "La reclamación directa es requisito antes de demandar ante la Superintendencia de Industria y Comercio (art. 58).",
      "El proveedor debe responder dentro de los 15 días hábiles siguientes.",
      "Si el producto vuelve a fallar después de la reparación, puede pedir el cambio o la devolución del dinero (art. 11).",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("empresa", "Empresa vendedora o productora", "texto", "Electrohogar S.A.S."),
      c("nombre", "Nombre del consumidor", "texto", "Ana María Pérez Gómez"),
      c("cedula", "Cédula", "texto", "52.123.456"),
      c("correo", "Correo", "texto", "ana@correo.com"),
      c("telefono", "Celular", "texto", "300 123 4567"),
      c("producto", "Producto o servicio y factura", "texto", "nevera marca X, referencia Y, factura No. 4567 del 3 de junio de 2026"),
      c("falla", "Descripción de la falla", "parrafo", "Desde el 1 de octubre la nevera no enfría. Fue reparada el 10 de agosto por la misma falla."),
      c("solicitud", "Qué solicita", "texto", "el cambio del producto por uno nuevo de iguales características, o la devolución del dinero pagado"),
    ],
    texto: `{{ciudad}}, {{fecha}}

Señores
{{empresa}}
Servicio al cliente

Referencia: Reclamación por garantía (Ley 1480 de 2011)

{{nombre}}, identificado(a) con cédula No. {{cedula}}, en calidad de consumidor(a), presento reclamación directa por la garantía del producto: {{producto}}.

HECHOS

{{falla}}

SOLICITUD

Con fundamento en los artículos 7, 10 y 11 de la Ley 1480 de 2011, solicito {{solicitud}}.

Les recuerdo que deben dar respuesta dentro de los quince (15) días hábiles siguientes a la recepción de esta reclamación. De no ser atendida, acudiré a la Superintendencia de Industria y Comercio mediante la acción de protección al consumidor (artículo 58).

Anexo copia de la factura y de las órdenes de servicio.

Recibo respuesta en {{correo}} · {{telefono}}.

Atentamente,



______________________________
{{nombre}}
C.C. {{cedula}}`,
  },
];
