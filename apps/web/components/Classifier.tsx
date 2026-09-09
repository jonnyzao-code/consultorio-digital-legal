"use client";

import { useState } from "react";
import { classify } from "@/lib/api";

const AREA_LABELS: Record<string, string> = {
  penal: "Derecho Penal",
  laboral: "Derecho Laboral",
  familia: "Derecho de Familia",
  civil: "Derecho Civil",
  administrativo: "Derecho Administrativo / Constitucional",
  comercial: "Derecho Comercial",
  otro: "Sin clasificar / requiere revisión",
};

const EXAMPLES = [
  "Me despidieron sin justa causa y no me pagaron las prestaciones sociales ni la liquidación.",
  "Quiero denunciar un robo del que fui víctima en mi barrio.",
  "Necesito pedir la custodia de mis hijos y una cuota de alimentos tras el divorcio.",
  "El arrendatario no paga el canon de arrendamiento desde hace tres meses.",
  "La EPS se niega a autorizar un medicamento y quiero presentar una tutela.",
];

type Result = {
  area: string;
  name: string;
  confidence: number;
  matched_keywords: string[];
  needs_review: boolean;
  disclaimer: string;
  scores?: Record<string, number>;
};

export default function Classifier() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = (await classify(text)) as Result;
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al clasificar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Clasificador por rama del derecho</h2>
      <p className="muted">
        Describe tu situación en lenguaje natural. El sistema la clasifica como{" "}
        <strong>orientación</strong> (no asesoría jurídica).
      </p>

      <form onSubmit={onSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej.: Me despidieron sin justa causa y no me pagaron la liquidación..."
          rows={5}
        />
        <button className="btn" disabled={loading || !text.trim()}>
          {loading ? "Clasificando..." : "Clasificar"}
        </button>
      </form>

      <div className="muted" style={{ marginTop: 12 }}>
        Ejemplos rápidos:
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="btn secondary"
            style={{ marginTop: 0, marginRight: 8, padding: "6px 12px" }}
            onClick={() => setText(ex)}
          >
            {ex.slice(0, 34)}…
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <strong>Clasificación:</strong>{" "}
          <span className="badge ok">{AREA_LABELS[result.area] ?? result.name}</span>
          <span className="badge">
            confianza {(result.confidence * 100).toFixed(0)}%
          </span>
          {result.needs_review && (
            <span className="badge warn">requiere revisión humana</span>
          )}

          {result.matched_keywords?.length > 0 && (
            <p className="muted" style={{ marginBottom: 0 }}>
              Palabras clave detectadas: {result.matched_keywords.join(", ")}
            </p>
          )}

          <div className="disclaimer">{result.disclaimer}</div>
        </div>
      )}
    </div>
  );
}
