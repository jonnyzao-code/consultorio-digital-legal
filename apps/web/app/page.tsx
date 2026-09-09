"use client";

const CONSULTORIO_URL =
  process.env.NEXT_PUBLIC_CONSULTORIO_URL || "http://localhost:9504";
const VIGILANCIA_URL =
  process.env.NEXT_PUBLIC_LEGAL_APP_URL || "http://localhost:9501";

type Tool = {
  icon: string;
  title: string;
  desc: string;
  url: string;
  badge: string;
};

const TOOLS: Tool[] = [
  {
    icon: "⚖️",
    title: "Consultorio Digital Legal",
    desc: "Plataforma principal. Análisis jurídico con IA (Gemini), dictámenes con normativa y jurisprudencia colombiana, generación de minutas (tutela, derecho de petición, contratos, liquidación de alimentos), consulta de radicados en la Rama Judicial y pagos con Wompi.",
    url: CONSULTORIO_URL,
    badge: "Base del sistema",
  },
  {
    icon: "🛰️",
    title: "Vigilancia de Procesos",
    desc: "Registra tus procesos y recibe alertas automáticas de nuevas actuaciones en la Rama Judicial, las publicaciones procesales y el SPOA de la Fiscalía. Auth, pagos y panel incluidos.",
    url: VIGILANCIA_URL,
    badge: "Monitoreo judicial",
  },
];

export default function Home() {
  return (
    <div className="container">
      <div className="header">
        <h1>⚖️ Consultorio Digital Legal</h1>
        <p>
          Portal de herramientas jurídicas. Orientación informativa, no
          asesoría jurídica.
        </p>
      </div>

      <div className="tool-grid">
        {TOOLS.map((tool) => (
          <a
            key={tool.title}
            href={tool.url}
            target="_blank"
            rel="noreferrer"
            className="tool-card tool-card-link"
          >
            <div className="tool-icon">{tool.icon}</div>
            <h2>{tool.title}</h2>
            <span className="badge ok" style={{ margin: "0 0 10px" }}>
              {tool.badge}
            </span>
            <p>{tool.desc}</p>
            <span className="tool-cta">Abrir herramienta ↗</span>
          </a>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 16 }}>
        Documentación de la API del Consultorio:{" "}
        <a href={`${CONSULTORIO_URL}/docs`} target="_blank" rel="noreferrer">
          Swagger /docs ↗
        </a>
      </p>
    </div>
  );
}
