"""Generador de documentos legales por plantilla (borradores).

Regla de negocio: genera un BORRADOR que siempre requiere revisión de un
abogado antes de presentarse. El disclaimer viaja en la respuesta de la API,
separado del texto del documento.
"""
from datetime import date


class SafeDict(dict):
    def __missing__(self, key):
        return ""


_MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def _fecha_hoy() -> str:
    hoy = date.today()
    return f"{hoy.day} de {_MESES[hoy.month - 1]} de {hoy.year}"


def _fill(template: str, fields: dict) -> str:
    return template.format_map(SafeDict(fields))


TUTELA_TEMPLATE = """Señor
JUEZ CONSTITUCIONAL (REPARTO)
E. S. D.

REFERENCIA: ACCIÓN DE TUTELA
ACCIONANTE: {nombre_accionante}
ACCIONADO: {entidad_accionada}

{nombre_accionante}, mayor de edad, identificado(a) con cédula de ciudadanía
No. {cedula_accionante}, domiciliado(a) en {direccion_accionante}, correo
electrónico {email_accionante}, teléfono {telefono_accionante}, actuando en
nombre propio, acudo respetuosamente ante su Despacho para interponer ACCIÓN
DE TUTELA en contra de {entidad_accionada}, con el fin de que se protejan mis
derechos fundamentales, conforme a los siguientes:

I. HECHOS

{hechos}

II. DERECHOS FUNDAMENTALES VULNERADOS

Considero vulnerados los siguientes derechos fundamentales:

{derechos}

III. PRETENSIONES

{pretensiones}

IV. FUNDAMENTOS DE DERECHO

Fundamento la presente acción en el artículo 86 de la Constitución Política de
Colombia y en el Decreto 2591 de 1991, así como en las normas concordantes que
amparan los derechos invocados.

V. PRUEBAS

{pruebas}

VI. NOTIFICACIONES

Accionante: {direccion_accionante} — {email_accionante} — {telefono_accionante}
Accionado: {entidad_accionada}

Atentamente,

{nombre_accionante}
C.C. {cedula_accionante}
"""


DERECHO_PETICION_TEMPLATE = """{ciudad}, {fecha}

Señores
{entidad}
{ciudad}

ASUNTO: DERECHO DE PETICIÓN — {tipo}

{nombre}, mayor de edad, identificado(a) con cédula de ciudadanía No. {cedula},
domiciliado(a) en {direccion}, correo electrónico {email}, teléfono {telefono},
en ejercicio del derecho de petición consagrado en el artículo 23 de la
Constitución Política de Colombia y regulado por la Ley 1755 de 2015,
respetuosamente me permito formular la siguiente:

PETICIÓN

{peticion}

FUNDAMENTOS

{fundamentos}

NOTIFICACIONES

Recibiré respuesta en la dirección {direccion}, al correo electrónico {email}
y al teléfono {telefono}.

Atentamente,

{nombre}
C.C. {cedula}
"""


def generate_tutela(fields: dict) -> str:
    return _fill(TUTELA_TEMPLATE, fields)


def generate_derecho_peticion(fields: dict) -> str:
    data = dict(fields)
    data.setdefault("fecha", _fecha_hoy())
    return _fill(DERECHO_PETICION_TEMPLATE, data)
