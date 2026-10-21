// Planes de suscripción de abogados: precio (en wompi.ts), servicios y límites que aplica la app.
export type PlanId = "basico" | "profesional" | "firma";

export type Plan = {
  id: PlanId;
  nombre: string;
  precio: string;
  casosActivos: number | null; // null = ilimitado
  procesosVigilados: number;
  abogados: number;
  minutasMes: number | null; // null = ilimitadas
  servicios: string[];
};

export const PLANES: Plan[] = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "$49.900/mes",
    casosActivos: 10,
    procesosVigilados: 10,
    abogados: 1,
    minutasMes: 5,
    servicios: [
      "Perfil verificado en el directorio",
      "Hasta 10 casos activos",
      "Vigilancia de 10 procesos en la Rama Judicial",
      "Calculadora de términos con festivos y vacancia",
      "5 minutas y formatos al mes",
    ],
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precio: "$99.900/mes",
    casosActivos: null,
    procesosVigilados: 60,
    abogados: 1,
    minutasMes: 30,
    servicios: [
      "Todo lo del plan Básico",
      "Casos ilimitados",
      "Vigilancia diaria de 60 procesos con aviso de actuaciones nuevas",
      "30 minutas y formatos al mes",
      "Alertas por correo de términos por vencer",
      "Prioridad en la remisión de clientes",
      "Revisión de conceptos preliminares pagados",
    ],
  },
  {
    id: "firma",
    nombre: "Firma (hasta 5)",
    precio: "$249.900/mes",
    casosActivos: null,
    procesosVigilados: 300,
    abogados: 5,
    minutasMes: null,
    servicios: [
      "Todo lo del plan Profesional",
      "Hasta 5 abogados de la firma",
      "Vigilancia de 300 procesos",
      "Minutas y formatos ilimitados",
      "Perfil de firma destacado en el directorio",
      "Soporte prioritario",
    ],
  },
];

export const plan = (id: string | null | undefined) => PLANES.find((p) => p.id === id) ?? PLANES[0];
