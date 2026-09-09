"""Clasificador de consultas jurídicas por rama del derecho.

Regla de negocio: es un clasificador de ORIENTACIÓN (no asesoría).
Siempre devuelve un `confidence < 1` y marca `needs_review` cuando la
confianza es baja, para forzar la revisión de un abogado.
"""
import unicodedata


def _normalize(text: str) -> str:
    """Minúsculas y sin tildes para comparar con las palabras clave."""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text.lower()


RAMAS = {
    "penal": {
        "name": "Derecho Penal",
        "keywords": [
            "robo", "hurto", "homicidio", "asesinato", "lesiones", "estafa",
            "fraude", "denuncia", "fiscalia", "spoa", "captura", "delito",
            "extorsion", "amenaza", "abuso", "acoso", "violencia", "secuestro",
            "injuria", "calumnia", "falsedad", "estupefacientes", "narcotrafico",
            "concierto para delinquir", "violacion", "feminicidio", "porte ilegal",
            "arma", "detencion",
        ],
    },
    "laboral": {
        "name": "Derecho Laboral",
        "keywords": [
            "despido", "despedido", "empleador", "trabajo", "salario",
            "prestaciones", "liquidacion", "horas extra", "contrato de trabajo",
            "contrato laboral", "seguridad social", "pension", "cesantias",
            "prima de servicios", "vacaciones", "indemnizacion", "acoso laboral",
            "renuncia", "sindicato", "arl", "riesgos laborales", "incapacidad laboral",
            "salario minimo", "jornada laboral",
        ],
    },
    "familia": {
        "name": "Derecho de Familia",
        "keywords": [
            "divorcio", "custodia", "alimentos", "cuota alimentaria", "herencia",
            "sucesion", "matrimonio", "union marital", "union libre", "adopcion",
            "paternidad", "filiacion", "patria potestad", "separacion",
            "regimen de visitas", "sociedad conyugal", "pension alimenticia",
            "bienes de la sociedad conyugal", "hijos", "menores",
        ],
    },
    "civil": {
        "name": "Derecho Civil",
        "keywords": [
            "arrendamiento", "contrato", "deuda", "propiedad", "posesion",
            "hipoteca", "incumplimiento", "responsabilidad civil",
            "danos y perjuicios", "servidumbre", "compraventa", "tradicion",
            "prescripcion", "usufructo", "deslinde", "amojonamiento",
        ],
    },
    "administrativo": {
        "name": "Derecho Administrativo / Constitucional",
        "keywords": [
            "tutela", "derecho de peticion", "entidad publica", "eps", "alcaldia",
            "gobernacion", "ministerio", "multa", "impuesto", "dian", "licencia",
            "servicio publico", "accion popular", "nulidad", "reparacion directa",
            "salud", "sistema de salud", "pension estatal", "colpensiones",
            "subsidio", "sic", "superintendencia",
        ],
    },
    "comercial": {
        "name": "Derecho Comercial",
        "keywords": [
            "sociedad", "empresa", "factura", "cobro", "titulo valor", "quiebra",
            "insolvencia", "competencia desleal", "marca", "patente",
            "sociedad anonima", "sas", "camara de comercio", "accionista",
            "socio", "estatutos", "contrato mercantil",
        ],
    },
}


def classify_text(text: str) -> dict:
    """Devuelve el área más probable junto con transparencia del resultado."""
    normalized = _normalize(text)

    scores: dict[str, int] = {}
    matched: dict[str, list[str]] = {}
    for area, data in RAMAS.items():
        hits = [kw for kw in data["keywords"] if kw in normalized]
        scores[area] = len(hits)
        matched[area] = hits

    total = sum(scores.values())
    if total == 0:
        return {
            "area": "otro",
            "name": "Sin clasificar",
            "confidence": 0.0,
            "matched_keywords": [],
            "needs_review": True,
            "scores": {},
        }

    best = max(scores, key=scores.get)
    confidence = round(min(scores[best] / total, 0.95), 2)  # nunca 100% automático

    return {
        "area": best,
        "name": RAMAS[best]["name"],
        "confidence": confidence,
        "matched_keywords": matched[best],
        "needs_review": confidence < 0.5,
        "scores": {k: v for k, v in sorted(scores.items(), key=lambda x: -x[1]) if v > 0},
    }
