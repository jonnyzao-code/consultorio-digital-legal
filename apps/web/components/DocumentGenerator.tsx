"use client";

import { useState } from "react";
import { generateDocument } from "@/lib/api";

type DocType = "tutela" | "derecho-peticion";

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
  full?: boolean;
};

const FIELDS: Record<DocType, FieldDef[]> = {
  tutela: [
    { key: "nombre_accionante", label: "Nombre del accionante" },
    { key: "cedula_accionante", label: "Cédula" },
    { key: "direccion_accionante", label: "Dirección" },
    { key: "email_accionante", label: "Correo electrónico" },
    { key: "telefono_accionante", label: "Teléfono" },
    { key: "entidad_accionada", label: "Entidad accionada" },
    { key: "derechos", label: "Derechos vulnerados", type: "textarea", full: true },
    { key: "hechos", label: "Hechos", type: "textarea", full: true },
    { key: "pretensiones", label: "Pretensiones", type: "textarea", full: true },
    { key: "pruebas", label: "Pruebas", type: "textarea", full: true },
  ],
  "derecho-peticion": [
    { key: "nombre", label: "Nombre del peticionario" },
    { key: "cedula", label: "Cédula" },
    { key: "direccion", label: "Dirección" },
    { key: "email", label: "Correo electrónico" },
    { key: "telefono", label: "Teléfono" },
    { key: "ciudad", label: "Ciudad" },
    { key: "entidad", label: "Entidad destinataria" },
    {
      key: "tipo",
      label: "Tipo de petición",
      type: "select",
      options: [
        "Información",
        "Documentos",
        "Copias",
        "Consulta",
        "Petición general",
      ],
    },
    { key: "peticion", label: "Petición (lo que solicita)", type: "textarea", full: true },
    { key: "fundamentos", label: "Fundamentos", type: "textarea", full: true },
  ],
};

type Result = {
  title: string;
  content: string;
  disclaimer: string;
};

export default function DocumentGenerator() {
  const [type, setType] = useState<DocType>("tutela");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  function setField(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function switchType(t: DocType) {
    setType(t);
    setResult(null);
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = (await generateDocument(type, values)) as Result;
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h2>Generador de documentos</h2>
      <p className="muted">
        Genera un <strong>borrador</strong>. Todo documento debe ser revisado y
        firmado por un abogado antes de presentarse.
      </p>

      <div className="tabs" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className={type === "tutela" ? "active" : ""}
          onClick={() => switchType("tutela")}
        >
          Acción de Tutela
        </button>
        <button
          type="button"
          className={type === "derecho-peticion" ? "active" : ""}
          onClick={() => switchType("derecho-peticion")}
        >
          Derecho de Petición
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="row">
          {FIELDS[type].map((f) =>
            f.type === "textarea" ? (
              <div key={f.key} style={{ gridColumn: "1 / -1" }}>
                <label>{f.label}</label>
                <textarea
                  value={values[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </div>
            ) : f.type === "select" ? (
              <div key={f.key}>
                <label>{f.label}</label>
                <select
                  value={values[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div key={f.key}>
                <label>{f.label}</label>
                <input
                  value={values[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </div>
            ),
          )}
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Generando..." : "Generar documento"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <strong>{result.title}</strong>
          <div className="disclaimer">{result.disclaimer}</div>
          <div className="doc-output">{result.content}</div>
          <button type="button" className="btn secondary" onClick={download}>
            Descargar .txt
          </button>
        </div>
      )}
    </div>
  );
}
