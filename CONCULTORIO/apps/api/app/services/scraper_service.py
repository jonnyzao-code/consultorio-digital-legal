"""
Servicio Oficial de Consulta y Monitoreo de Procesos Judiciales
Conexión directa con la API CPNU (Consulta de Procesos Nacional Unificada)
Rama Judicial de la República de Colombia
"""
import asyncio
import json
import ssl
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import structlog

from app.schemas.schemas import ProcessQueryResponse, ActuacionRecord

log = structlog.get_logger()

# Diccionario Oficial DANE de Distritos y Circuitos Judiciales de Colombia
DANE_JUDICIAL_MAP = {
    "11001": {"ciudad": "BOGOTÁ, D.C.", "departamento": "BOGOTÁ D.C."},
    "05001": {"ciudad": "MEDELLÍN", "departamento": "ANTIOQUIA"},
    "76001": {"ciudad": "CALI", "departamento": "VALLE DEL CAUCA"},
    "08001": {"ciudad": "BARRANQUILLA", "departamento": "ATLÁNTICO"},
    "68001": {"ciudad": "BUCARAMANGA", "departamento": "SANTANDER"},
    "13001": {"ciudad": "CARTAGENA", "departamento": "BOLÍVAR"},
    "54001": {"ciudad": "CÚCUTA", "departamento": "NORTE DE SANTANDER"},
    "73001": {"ciudad": "IBAGUÉ", "departamento": "TOLIMA"},
    "66001": {"ciudad": "PEREIRA", "departamento": "RISARALDA"},
    "47001": {"ciudad": "SANTA MARTA", "departamento": "MAGDALENA"},
    "52001": {"ciudad": "PASTO", "departamento": "NARIÑO"},
    "17001": {"ciudad": "MANIZALES", "departamento": "CALDAS"},
    "41001": {"ciudad": "NEIVA", "departamento": "HUILA"},
    "50001": {"ciudad": "VILLAVICENCIO", "departamento": "META"},
    "63001": {"ciudad": "ARMENIA", "departamento": "QUINDÍO"},
    "19001": {"ciudad": "POPAYÁN", "departamento": "CAUCA"},
    "20001": {"ciudad": "VALLEDUPAR", "departamento": "CESAR"},
    "23001": {"ciudad": "MONTERÍA", "departamento": "CÓRDOBA"},
    "70001": {"ciudad": "SINCELEJO", "departamento": "SUCRE"},
    "15001": {"ciudad": "TUNJA", "departamento": "BOYACÁ"},
    "44001": {"ciudad": "RIOHACHA", "departamento": "LA GUAJIRA"},
    "18001": {"ciudad": "FLORENCIA", "departamento": "CAQUETÁ"},
    "27001": {"ciudad": "QUIBDÓ", "departamento": "CHOCÓ"},
    "85001": {"ciudad": "YOPAL", "departamento": "CASANARE"}
}

# Códigos de Especialidad Judicial en el Radicado (Dígitos 6 a 10)
ESPECIALIDADES_MAP = {
    "4003": "Juzgado Civil Municipal",
    "4004": "Juzgado Civil del Circuito",
    "4005": "Juzgado de Familia",
    "4006": "Juzgado Laboral del Circuito",
    "4007": "Juzgado Penal Municipal",
    "4008": "Juzgado Penal del Circuito",
    "4009": "Juzgado Penal del Circuito Especializado",
    "3103": "Juzgado Administrativo del Circuito",
    "2208": "Tribunal Superior de Distrito Judicial",
    "2308": "Tribunal Administrativo",
    "1101": "Corte Suprema de Justicia",
    "1102": "Consejo de Estado",
    "1103": "Corte Constitucional"
}

CPNU_API_BASE = "https://consultaprocesos.ramajudicial.gov.co:448/api/v2"


class JudicialScraperService:
    @staticmethod
    def _create_ssl_context():
        # Verificación TLS completa: deshabilitar la verificación permitiría
        # intercepción man-in-the-middle sobre datos judiciales de terceros.
        return ssl.create_default_context()

    @staticmethod
    def decode_radicado_structure(radicado: str) -> Dict[str, Any]:
        """
        Decodifica la estructura oficial de 23 dígitos de la Rama Judicial de Colombia.
        """
        clean = radicado.strip().replace("-", "").replace(" ", "")
        if len(clean) != 23:
            return {
                "valido": False,
                "mensaje": f"El radicado tiene {len(clean)} caracteres. El estándar nacional exige 23 dígitos."
            }

        dane = clean[:5]
        entidad = clean[5:7]
        especialidad_cod = clean[5:9]
        despacho_num = clean[9:12]
        ano = clean[12:16]
        consecutivo = clean[16:21]
        recurso = clean[21:23]

        geo = DANE_JUDICIAL_MAP.get(dane, {"ciudad": f"Circuito DANE {dane}", "departamento": "Territorio Nacional"})
        especialidad_nom = ESPECIALIDADES_MAP.get(especialidad_cod, f"Despacho Judicial Especialidad {especialidad_cod}")

        return {
            "valido": True,
            "radicado_limpio": clean,
            "dane": dane,
            "ciudad": geo["ciudad"],
            "departamento": geo["departamento"],
            "entidad_codigo": entidad,
            "especialidad": especialidad_nom,
            "numero_despacho": despacho_num,
            "ano_radicacion": ano,
            "consecutivo_proceso": consecutivo,
            "instancia_recurso": recurso
        }

    @classmethod
    async def query_process(cls, radicado: str) -> ProcessQueryResponse:
        """
        Consulta en tiempo real la API oficial del CPNU de la Rama Judicial de Colombia.
        """
        clean_radicado = radicado.strip().replace("-", "").replace(" ", "")
        desglose = cls.decode_radicado_structure(clean_radicado)

        proceso_encontrado = None
        actuaciones_reales = []
        error_conexion = None

        try:
            proceso_encontrado, actuaciones_reales = await asyncio.to_thread(
                cls._query_cpnu_sync, clean_radicado
            )
        except Exception as e:
            error_conexion = str(e)
            log.warning("cpnu_query_error", error=str(e), radicado=clean_radicado)

        if proceso_encontrado:
            despacho_nom = proceso_encontrado.get("despacho", "").strip() or f"{desglose.get('especialidad', 'Juzgado')} {desglose.get('numero_despacho', '')} de {desglose.get('ciudad', '')}"
            sujetos_nom = proceso_encontrado.get("sujetosProcesales", "").strip() or "Sujetos en reserva legal o notificación en curso"
            tipo_proc = "PROCESO JUDICIAL EN TRÁMITE (CPNU)"
            if "tutela" in despacho_nom.lower() or "tutela" in sujetos_nom.lower():
                tipo_proc = "CONSTITUCIONAL / ACCIÓN DE TUTELA"
            elif "civil" in despacho_nom.lower():
                tipo_proc = "JURISDICCIÓN ORDINARIA CIVIL (CGP)"
            elif "laboral" in despacho_nom.lower():
                tipo_proc = "JURISDICCIÓN ORDINARIA LABORAL (CST / CPT)"
            elif "penal" in despacho_nom.lower():
                tipo_proc = "JURISDICCIÓN PENAL (LEY 906 DE 2004)"
            elif "administrativo" in despacho_nom.lower():
                tipo_proc = "CONTENCIOSO ADMINISTRATIVO (CPACA)"

            records = []
            hoy = datetime.now()
            alerta_novedad = False

            for act in actuaciones_reales:
                raw_fecha = act.get("fechaActuacion") or act.get("fechaRegistro") or ""
                fecha_fmt = raw_fecha[:10] if len(raw_fecha) >= 10 else raw_fecha
                if "T" in fecha_fmt:
                    fecha_fmt = fecha_fmt.split("T")[0]
                try:
                    dt = datetime.strptime(fecha_fmt, "%Y-%m-%d")
                    fecha_fmt = dt.strftime("%d/%m/%Y")
                    if (hoy - dt).days <= 10:
                        alerta_novedad = True
                except Exception:
                    pass

                act_nombre = (act.get("actuacion") or "Actuación en Despacho").strip()
                anot = (act.get("anotacion") or "").strip() or "Sin anotación registrada en el sistema."
                
                f_ini = act.get("fechaInicial") or ""
                f_fin = act.get("fechaFinal") or ""
                if f_ini and "T" in f_ini:
                    f_ini = f_ini.split("T")[0]
                if f_fin and "T" in f_fin:
                    f_fin = f_fin.split("T")[0]

                if any(w in act_nombre.lower() for w in ["auto", "sentencia", "fallo", "traslado", "mandamiento", "embargo"]):
                    alerta_novedad = True

                records.append(
                    ActuacionRecord(
                        fecha=fecha_fmt,
                        actuacion=act_nombre,
                        anotacion=anot,
                        fecha_registro=act.get("fechaRegistro", "")[:10],
                        fecha_inicial=f_ini if f_ini else None,
                        fecha_final=f_fin if f_fin else None,
                        es_reciente=alerta_novedad
                    )
                )

            ultima = records[0] if records else None

            resumen_jur = (
                f"Expediente judicial ID {proceso_encontrado.get('idProceso')} radicado formalmente ante {despacho_nom}. "
                f"Cuenta con {len(records)} actuaciones procesales registradas en el CPNU. "
                f"Última actuación: '{ultima.actuacion if ultima else 'En radicación'}'. "
                f"{'⚠️ ATENCIÓN: Se detecta término procesal o decisión reciente que requiere revisión inmediata del apoderado.' if alerta_novedad else 'Expediente al despacho para trámite ordinario.'}"
            )

            return ProcessQueryResponse(
                radicado=clean_radicado,
                despacho=despacho_nom,
                sujetos_procesales=sujetos_nom,
                tipo_proceso=tipo_proc,
                actuaciones=records,
                ultima_actuacion=ultima,
                alerta_novedad=alerta_novedad,
                id_proceso=proceso_encontrado.get("idProceso"),
                fecha_radicacion=proceso_encontrado.get("fechaProceso", "")[:10],
                fecha_ultima_actuacion=proceso_encontrado.get("fechaUltimaActuacion", "")[:10],
                departamento=proceso_encontrado.get("departamento") or desglose.get("departamento"),
                ciudad=desglose.get("ciudad"),
                es_consulta_real=True,
                estado_proceso="Activo en CPNU - Rama Judicial",
                desglose_radicado=desglose,
                resumen_juridico=resumen_jur,
                total_actuaciones=len(records)
            )

        # Si no se encontraron registros públicos indexados en CPNU para este radicado
        ciudad_nom = desglose.get("ciudad", "Juzgado de Circuito")
        especialidad_nom = desglose.get("especialidad", "Juzgado Municipal")
        num_despacho = desglose.get("numero_despacho", "01")
        ano_rad = desglose.get("ano_radicacion", "2024")
        despacho_esperado = f"{especialidad_nom.upper()} {num_despacho} DE {ciudad_nom.upper()}"

        resumen_info = (
            f"El radicado de 23 dígitos '{clean_radicado}' fue decodificado y consultado en la infraestructura CPNU de la Rama Judicial. "
            f"El servidor CPNU NO reportó actuaciones públicas para este radicado en el momento de la consulta. "
            f"Esto puede ocurrir por reparto preliminar, procesos con reserva legal (menores/penal) o mantenimiento del portal. "
            f"⚠️ Este resultado NO es una confirmación oficial: debe verificarse directamente en el portal de la Rama Judicial. "
            f"No se presentan actuaciones inventadas; la información pública es la única fuente."
        )

        return ProcessQueryResponse(
            radicado=clean_radicado,
            despacho=despacho_esperado,
            sujetos_procesales="No reportados por el portal en este momento",
            tipo_proceso="No confirmado — sin registro público en CPNU",
            actuaciones=[],
            ultima_actuacion=None,
            alerta_novedad=False,
            id_proceso=None,
            fecha_radicacion=None,
            fecha_ultima_actuacion=None,
            departamento=desglose.get("departamento"),
            ciudad=desglose.get("ciudad"),
            es_consulta_real=False,
            estado_proceso="Sin actuaciones públicas registradas en CPNU — verificar en el portal oficial",
            desglose_radicado=desglose,
            resumen_juridico=resumen_info,
            total_actuaciones=0
        )

    @classmethod
    def _query_cpnu_sync(cls, clean_radicado: str):
        """
        Realiza la consulta HTTP síncrona al API oficial de la Rama Judicial de Colombia.
        """
        ctx = cls._create_ssl_context()
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion"
        }

        url_proceso = f"{CPNU_API_BASE}/Procesos/Consulta/NumeroRadicacion?numero={clean_radicado}&SoloActivos=false&pagina=1"
        req = urllib.request.Request(url_proceso, headers=headers)

        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            if resp.status != 200:
                return None, []
            raw_body = resp.read().decode("utf-8")
            data = json.loads(raw_body)

        procesos = data.get("procesos", [])
        if not procesos:
            return None, []

        proceso = procesos[0]
        id_proceso = proceso.get("idProceso")
        if not id_proceso:
            return proceso, []

        url_actuaciones = f"{CPNU_API_BASE}/Proceso/Actuaciones/{id_proceso}?pagina=1"
        req_act = urllib.request.Request(url_actuaciones, headers=headers)
        actuaciones = []

        try:
            with urllib.request.urlopen(req_act, timeout=12, context=ctx) as resp_act:
                if resp_act.status == 200:
                    raw_act = resp_act.read().decode("utf-8")
                    data_act = json.loads(raw_act)
                    actuaciones = data_act.get("actuaciones", [])
        except Exception as e:
            log.warning("cpnu_actuaciones_fetch_warning", error=str(e), id_proceso=id_proceso)

        return proceso, actuaciones

