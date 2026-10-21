import type { AreaId } from "./areas";
import type { Mensaje, Triage } from "./triage";

// Clasificación por palabras clave, sin IA ni costo. Se usa cuando la IA no está disponible.
const CLAVES: Record<AreaId, string[]> = {
  civil: ["contrato", "arriendo", "arrendamiento", "deuda", "prestamo", "pagare", "herencia", "sucesion", "testamento", "daños", "indemnizacion"],
  familia: ["divorcio", "custodia", "alimentos", "cuota alimentaria", "hijo", "hija", "union marital", "esposo", "esposa", "pareja", "visitas", "violencia intrafamiliar"],
  laboral: ["despido", "despidio", "despidieron", "liquidacion", "prestaciones", "empleador", "jefe", "salario", "pension", "incapacidad", "acoso laboral", "contrato de trabajo", "cesantias", "vacaciones"],
  comercial: ["sociedad", "socio", "empresa", "factura", "letra de cambio", "cheque", "insolvencia", "quiebra", "mercantil"],
  penal: ["denuncia", "delito", "robo", "hurto", "estafa", "amenaz", "captur", "fiscalia", "carcel", "agresion", "abuso"],
  administrativo: ["entidad publica", "alcaldia", "gobernacion", "derecho de peticion", "licitacion", "contratacion estatal", "funcionario", "reparacion directa"],
  constitucional: ["tutela", "derecho fundamental", "eps", "salud", "medicamento", "cirugia"],
  tributario: ["dian", "impuesto", "renta", "iva", "sancion tributaria", "predial"],
  consumidor: ["garantia", "producto", "devolucion", "reclamo", "sic", "superintendencia de industria", "tienda", "compra"],
  inmobiliario: ["inmueble", "casa", "apartamento", "lote", "escritura", "propiedad horizontal", "administracion del edificio", "lindero", "compraventa"],
  migratorio: ["visa", "migracion", "pep", "permiso de permanencia", "nacionalidad", "extranjero", "venezolano", "pasaporte"],
  datos_tic: ["datacredito", "centrales de riesgo", "reportado", "habeas data", "datos personales", "internet", "redes sociales"],
};

const URGENTE = ["captur", "desaloj", "lanzamiento", "violen", "amenaz", "golpe", "agredi", "agresi", "menor de edad", "vence", "mañana", "plazo", "termino", "audiencia", "urgente", "riesgo"];
const RIESGO_VIDA = ["violen", "amenaz", "golpe", "agredi", "agresi", "abus", "riesgo"];

const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function orientarBasico(mensajes: Mensaje[]): Triage {
  const texto = normalizar(mensajes.filter((m) => m.role === "user").map((m) => m.content).join(" "));
  const puntajes = (Object.keys(CLAVES) as AreaId[])
    .map((area) => ({ area, puntos: CLAVES[area].filter((c) => texto.includes(normalizar(c))).length }))
    .filter((p) => p.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);
  const areas = puntajes.length ? puntajes.slice(0, 3).map((p) => p.area) : (["civil"] as AreaId[]);
  const urgentes = URGENTE.filter((c) => texto.includes(normalizar(c)));
  const riesgo = RIESGO_VIDA.some((c) => texto.includes(c));
  const nivel = riesgo ? "alta" : urgentes.length >= 2 ? "alta" : urgentes.length === 1 ? "media" : "baja";

  const orientacion = [
    "Reúne y guarda todos los documentos, mensajes y pruebas relacionados con tu caso.",
    "No firmes documentos ni aceptes acuerdos sin revisarlos con un abogado.",
    "Anota fechas importantes: cuándo ocurrió el hecho y cualquier plazo que te hayan indicado.",
  ];
  if (riesgo) orientacion.unshift("Si tu vida o integridad están en riesgo, llama a la línea 123 o acude a la Fiscalía o a la Comisaría de Familia.");

  return {
    areas,
    urgencia: nivel,
    motivo_urgencia: urgentes.length
      ? `Se mencionan situaciones que pueden requerir atención pronta (${urgentes.slice(0, 3).join(", ")}).`
      : "No se identifican plazos inmediatos en la descripción.",
    resumen: "Clasificación automática básica según las palabras de tu consulta. Un abogado revisará los detalles.",
    preguntas_pendientes: [
      "¿Cuándo ocurrieron los hechos?",
      "¿Tienes documentos o pruebas (contratos, mensajes, recibos)?",
      "¿Te han notificado algún plazo, audiencia o proceso?",
    ],
    orientacion_general: orientacion.slice(0, 6),
    requiere_abogado: true,
  };
}
