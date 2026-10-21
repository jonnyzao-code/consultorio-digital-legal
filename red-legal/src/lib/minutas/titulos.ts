import { c, LUGAR_FECHA, type Minuta } from "./tipos";

export const TITULOS: Minuta[] = [
  {
    id: "letra-de-cambio",
    titulo: "Letra de cambio",
    categoria: "titulos",
    descripcion: "Orden de pagar una suma de dinero a una persona en una fecha determinada.",
    baseLegal: "Código de Comercio, arts. 621 (requisitos comunes), 671 (requisitos de la letra) y 673 (vencimientos).",
    notas: [
      "Debe contener: la orden incondicional de pagar una suma determinada, el nombre del girado, la forma del vencimiento, si es a la orden o al portador y la firma del creador.",
      "Los intereses no pueden superar la tasa de usura certificada por la Superintendencia Financiera.",
      "Si queda con espacios en blanco, firme también una carta de instrucciones (art. 622).",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("numero", "Número de la letra", "texto", "001"),
      c("valor", "Valor", "dinero", "10.000.000"),
      c("valor_letras", "Valor en letras", "texto", "diez millones de pesos"),
      c("vencimiento", "Fecha de vencimiento", "fecha"),
      c("beneficiario", "A la orden de (beneficiario)", "texto", "Ana María Pérez Gómez, C.C. 52.123.456"),
      c("girado", "Girado (quien debe pagar)", "texto", "Luis Gómez Arias, C.C. 80.111.222"),
      c("direccion_girado", "Dirección del girado", "texto", "Carrera 7 # 45-10, Bogotá"),
      c("lugar_pago", "Lugar de pago", "texto", "Bogotá D.C."),
      c("interes", "Interés mensual de plazo", "texto", "uno por ciento (1%)"),
      c("girador", "Girador (quien crea la letra)", "texto", "Ana María Pérez Gómez, C.C. 52.123.456"),
    ],
    texto: `LETRA DE CAMBIO No. {{numero}}                                   POR $ {{valor}}

Ciudad y fecha de creación: {{ciudad}}, {{fecha}}

Señor(a) {{girado}}, con domicilio en {{direccion_girado}}:

El día {{vencimiento}} se servirá usted pagar incondicionalmente, en {{lugar_pago}}, a la orden de {{beneficiario}}, la suma de {{valor_letras}} ($ {{valor}}) moneda legal colombiana, más intereses de plazo del {{interes}} mensual y, en caso de mora, intereses moratorios a la tasa máxima legal permitida.



______________________________
GIRADOR: {{girador}}



ACEPTADA.
______________________________
GIRADO / ACEPTANTE: {{girado}}
Fecha de aceptación: ____________`,
  },
  {
    id: "pagare",
    titulo: "Pagaré",
    categoria: "titulos",
    descripcion: "Promesa del deudor de pagar una suma de dinero, con cláusula aceleratoria.",
    baseLegal: "Código de Comercio, arts. 621, 709 a 711 y 884 (intereses).",
    notas: [
      "Debe contener: la promesa incondicional de pagar una suma determinada, el nombre de quien recibe el pago, si es a la orden o al portador, la forma del vencimiento y la firma del otorgante.",
      "Intereses moratorios máximos: una y media veces el interés bancario corriente (art. 884), sin superar la usura.",
    ],
    campos: [
      ...LUGAR_FECHA,
      c("numero", "Número del pagaré", "texto", "001"),
      c("valor", "Valor", "dinero", "20.000.000"),
      c("valor_letras", "Valor en letras", "texto", "veinte millones de pesos"),
      c("deudor", "Deudor u otorgante (nombre y cédula)", "texto", "Luis Gómez Arias, C.C. 80.111.222"),
      c("acreedor", "A la orden de (acreedor)", "texto", "Ana María Pérez Gómez, C.C. 52.123.456"),
      c("forma_pago", "Forma de pago", "parrafo", "diez (10) cuotas mensuales de $2.000.000 cada una, la primera el 1 de diciembre de 2026 y las siguientes el mismo día de cada mes"),
      c("lugar_pago", "Lugar de pago", "texto", "Bogotá D.C."),
      c("interes", "Interés mensual de plazo", "texto", "uno por ciento (1%)"),
      c("codeudor", "Codeudor o avalista (opcional)", "texto", "María Arias, C.C. 41.222.333"),
    ],
    texto: `PAGARÉ No. {{numero}}                                            POR $ {{valor}}

Yo, {{deudor}}, mayor de edad, actuando en nombre propio, prometo pagar incondicionalmente a la orden de {{acreedor}}, en {{lugar_pago}}, la suma de {{valor_letras}} ($ {{valor}}) moneda legal colombiana, así: {{forma_pago}}.

INTERESES. Sobre el capital pagaré intereses de plazo del {{interes}} mensual. En caso de mora pagaré intereses moratorios a la tasa máxima legal permitida, sin superar el límite de usura.

CLÁUSULA ACELERATORIA. El tenedor podrá declarar vencido el plazo y exigir de inmediato el pago total del saldo, con sus intereses, si incumplo el pago de una o más cuotas, si soy embargado o si inicio un proceso de insolvencia.

GASTOS. Serán de mi cargo los gastos de cobranza judicial y extrajudicial, incluidos los honorarios de abogado.

Se suscribe en {{ciudad}}, el {{fecha}}.



______________________________
OTORGANTE: {{deudor}}
Huella:



______________________________
CODEUDOR / AVALISTA: {{codeudor}}`,
  },
  {
    id: "carta-de-instrucciones",
    titulo: "Carta de instrucciones para pagaré con espacios en blanco",
    categoria: "titulos",
    descripcion: "Autoriza al acreedor a llenar los espacios en blanco de un título valor según instrucciones precisas.",
    baseLegal: "Artículo 622 del Código de Comercio.",
    notas: ["El título solo puede llenarse siguiendo estrictamente estas instrucciones antes de presentarlo para el cobro."],
    campos: [
      ...LUGAR_FECHA,
      c("deudor", "Deudor (nombre y cédula)", "texto", "Luis Gómez Arias, C.C. 80.111.222"),
      c("acreedor", "Acreedor (nombre y cédula o NIT)", "texto", "Inversiones Delta S.A.S., NIT 900.000.000-1"),
      c("numero", "Número del pagaré", "texto", "001"),
      c("obligaciones", "Obligaciones que respalda", "parrafo", "todas las sumas que deba al acreedor por el contrato de suministro del 1 de octubre de 2026"),
    ],
    texto: `CARTA DE INSTRUCCIONES

{{ciudad}}, {{fecha}}

Señores
{{acreedor}}

Yo, {{deudor}}, en los términos del artículo 622 del Código de Comercio, autorizo de manera irrevocable a {{acreedor}}, o a cualquier tenedor legítimo, para llenar los espacios en blanco del pagaré No. {{numero}}, que he firmado en la fecha, de acuerdo con las siguientes instrucciones:

1. El pagaré respalda {{obligaciones}}.
2. El valor será el de todas las sumas que le adeude el día en que se llene, incluidos capital, intereses de plazo y moratorios, y gastos de cobranza.
3. La fecha de vencimiento será el día en que se llene el pagaré.
4. Podrá llenarse cuando incurra en mora en cualquiera de las obligaciones respaldadas.
5. El lugar de pago será la ciudad de {{ciudad}}.

Declaro que recibí copia de esta carta y del pagaré.



______________________________
{{deudor}}
Huella:`,
  },
];
