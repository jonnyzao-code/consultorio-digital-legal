// Áreas del derecho usadas para clasificar consultas y especialidades de abogados.
export const AREAS = [
  { id: "civil", nombre: "Civil", ejemplos: "contratos, arrendamientos, deudas, responsabilidad, sucesiones" },
  { id: "familia", nombre: "Familia", ejemplos: "divorcio, custodia, alimentos, unión marital, violencia intrafamiliar" },
  { id: "laboral", nombre: "Laboral y seguridad social", ejemplos: "despidos, liquidaciones, pensiones, incapacidades, acoso laboral" },
  { id: "comercial", nombre: "Comercial y societario", ejemplos: "sociedades, títulos valores, contratos mercantiles, insolvencia" },
  { id: "penal", nombre: "Penal", ejemplos: "denuncias, defensa, víctimas, delitos" },
  { id: "administrativo", nombre: "Administrativo", ejemplos: "entidades públicas, derechos de petición, contratación estatal, reparación directa" },
  { id: "constitucional", nombre: "Constitucional", ejemplos: "tutelas, derechos fundamentales" },
  { id: "tributario", nombre: "Tributario", ejemplos: "DIAN, impuestos, sanciones tributarias" },
  { id: "consumidor", nombre: "Consumidor", ejemplos: "garantías, reclamos a empresas, SIC" },
  { id: "inmobiliario", nombre: "Inmobiliario y propiedad horizontal", ejemplos: "compraventa de inmuebles, propiedad horizontal, linderos" },
  { id: "migratorio", nombre: "Migratorio", ejemplos: "visas, permisos de permanencia, nacionalidad" },
  { id: "datos_tic", nombre: "Datos personales y TIC", ejemplos: "habeas data, centrales de riesgo, comercio electrónico" },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];
export const AREA_IDS = AREAS.map((a) => a.id) as [AreaId, ...AreaId[]];
