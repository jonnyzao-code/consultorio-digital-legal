"use client";

import { useState } from "react";
import { analyze } from "@/lib/api";

const AREA_LABELS: Record<string, string> = {
  penal: "Derecho Penal",
  laboral: "Derecho Laboral",
  familia: "Derecho de Familia",
  civil: "Derecho Civil",
  administrativo: "Derecho Administrativo / Constitucional",
  comercial: "Derecho Comercial",
  otro: "Sin clasificar",
};

type Norm = {
  id: number;
  tipo: string;
  numero: string | null;
  anio: number | null;
  nombre: string;
  epigrafe: string;
  fuente_url: string;
};

type Constitucional = {
  numero: string;
  titulo: string;
  texto: string;
  norma: string;
};

type Sentencia = {
  id: number;
  corte: string;
  tipo: string;
  numero: string;
  anio: number;
  ratio: string;
  fuente_url: string;
};

type Analysis = {
  consultation_id: number;
  area: string;
  name: string;
  confidence: number;
  matched_keywords: string[];
  normas: Norm[];
  articulos_constitucionales: Constitucional[];
  sentencias: Sentencia[];
  disclaimer: string;
};

const EXAMPLES = [
  "Me despidieron sin justa causa y no me pagaron la liquidación.",
  "La EPS se niega a autorizar un medicamento, quiero una tutela.",
  "Quiero denunciar un robo, fui víctima de hurto.",
  "Necesito la custodia de mis hijos y cuota de alimentos.",
];

export default function NormativeAnalysis() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = (await analyze(text)) as Analysis;
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Análisis normativo colombiano</h2>
      <p className="muted">
        Clasifica tu caso y devuelve <strong>normas aplicables</strong>,{" "}
        <strong>artículos constitucionales</strong> y{" "}
        <strong>jurisprudencia (sentencias)</strong> de soporte.
      </p>

      <form onSubmit={onSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe tu situación jurídica…"
          rows={4}
        />
        <button className="btn" disabled={loading || !text.trim()}>
          {loading ? "Analizando…" : "Analizar"}
        </button>
      </form>

      <div className="muted" style={{ marginTop: 12 }}>
        Ejemplos:
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="btn secondary"
            style={{ marginTop: 0, marginRight: 8, padding: "6px 12px" }}
            onClick={() => setText(ex)}
          >
            {ex.slice(0, 36)}…
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <strong>Análisis:</strong>{" "}
          <span className="badge ok">{AREA_LABELS[result.area] ?? result.name}</span>
          <span className="badge">
            confianza {(result.confidence * 100).toFixed(0)}%
          </span>

          {result.normas.length > 0 && (
            <>
              <h3 style={{ marginBottom: 6 }}>📚 Normas aplicables</h3>
              {result.normas.map((n) => (
                <div key={n.id} style={{ marginBottom: 10 }}>
                  <strong>{n.nombre}</strong>
                  <div className="muted">{n.epigrafe}</div>
                  {n.fuente_url && (
                    <a href={n.fuente_url} target="_blank" rel="noreferrer">
                      Fuente oficial ↗
                    </a>
                  )}
                </div>
              ))}
            </>
          )}

          {result.articulos_constitucionales.length > 0 && (
            <>
              <h3 style={{ marginBottom: 6 }}>
                🏛️ Artículos constitucionales
              </h3>
              {result.articulos_constitucionales.map((a) => (
                <div
                  key={a.numero}
                  style={{
                    marginBottom: 10,
                    borderLeft: "3px solid var(--accent-2)",
                    paddingLeft: 12,
                  }}
                >
                  <strong>Art. {a.numero} — {a.titulo}</strong>
                  <div className="muted">{a.texto}</div>
                </div>
              ))}
            </>
          )}

          {result.sentencias.length > 0 && (
            <>
              <h3 style={{ marginBottom: 6 }}>⚖️ Jurisprudencia de soporte</h3>
              {result.sentencias.map((s) => (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <strong>
                    {s.corte} — {s.tipo}-{s.numero}/{s.anio}
                  </strong>
                  <div className="muted">{s.ratio}</div>
                  {s.fuente_url && (
                    <a href={s.fuente_url} target="_blank" rel="noreferrer">
                      Relatoría oficial ↗
                    </a>
                  )}
                </div>
              ))}
            </>
          )}

          {result.sentencias.length === 0 && (
            <p className="muted">
              No hay jurisprudencia de soporte registrada aún para esta rama.
            </p>
          )}

          <div className="disclaimer">{result.disclaimer}</div>
        </div>
      )}
    </div>
  );
}
