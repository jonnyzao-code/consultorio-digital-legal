-- =============================================================================
-- Consultorio Digital Legal — Esquema (PostgreSQL)
-- Módulo normativo: ramas, normas, artículos, sentencias (jurisprudencia),
-- consultas, análisis y documentos.
-- =============================================================================

-- Ramas del derecho (alineadas con el clasificador)
CREATE TABLE IF NOT EXISTS legal_areas (
  id   SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- Normas: Constitución, leyes, decretos, códigos, resoluciones…
CREATE TABLE IF NOT EXISTS norms (
  id          SERIAL PRIMARY KEY,
  tipo        TEXT NOT NULL,            -- Constitucion | Ley | Decreto | Codigo | Resolucion | ...
  numero      TEXT,                     -- número de la ley/decreto (NULL para la Constitución)
  anio        INT,
  slug        TEXT UNIQUE NOT NULL,     -- clave estable p. ej. "constitucion-1991", "ley-1755-2015"
  nombre      TEXT NOT NULL,            -- título oficial
  epigrafe    TEXT,                     -- síntesis corta de lo que regula
  tema        TEXT,                     -- palabras clave (búsqueda)
  area_code   TEXT,                     -- rama principal (NULL = transversal)
  vigencia    TEXT DEFAULT 'vigente',
  fuente_url  TEXT,                     -- enlace a fuente oficial
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_norms_area ON norms(area_code);

-- Artículos de las normas
CREATE TABLE IF NOT EXISTS norm_articles (
  id      SERIAL PRIMARY KEY,
  norm_id INT  NOT NULL REFERENCES norms(id) ON DELETE CASCADE,
  numero  TEXT NOT NULL,                -- "86", "23", "1A"…
  titulo  TEXT,
  texto   TEXT NOT NULL,                -- texto o síntesis verificada del artículo
  tema    TEXT,                         -- palabras clave (para análisis)
  UNIQUE (norm_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_articles_norm ON norm_articles(norm_id);

-- Sentencias (jurisprudencia) como soporte
CREATE TABLE IF NOT EXISTS sentencias (
  id                  SERIAL PRIMARY KEY,
  corte               TEXT NOT NULL,    -- Corte Constitucional | Corte Suprema de Justicia | Consejo de Estado | ...
  tipo                TEXT NOT NULL,    -- T, C, SU, A, SL, STL, CE…
  numero              TEXT NOT NULL,    -- radicado/número (p. ej. "760")
  anio                INT  NOT NULL,
  magistrado_ponente  TEXT,
  fecha               DATE,
  tema                TEXT,             -- palabras clave
  area_code           TEXT,             -- rama principal
  ratio               TEXT,             -- ratio decidendi / doctrina resumida (curada)
  fuente_url          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (corte, tipo, numero, anio)
);

CREATE INDEX IF NOT EXISTS idx_sentencias_area ON sentencias(area_code);

-- Relación N:M sentencia <-> norma (qué normas aplica/interpreta cada sentencia)
CREATE TABLE IF NOT EXISTS sentencia_norms (
  sentencia_id INT NOT NULL REFERENCES sentencias(id) ON DELETE CASCADE,
  norm_id      INT NOT NULL REFERENCES norms(id)      ON DELETE CASCADE,
  PRIMARY KEY (sentencia_id, norm_id)
);

-- Consultas persistidas (clasificación)
CREATE TABLE IF NOT EXISTS consultations (
  id           SERIAL PRIMARY KEY,
  text         TEXT NOT NULL,
  area_code    TEXT,
  confidence   REAL,
  needs_review BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resultado del análisis normativo por consulta (snapshot)
CREATE TABLE IF NOT EXISTS consultation_analysis (
  id              SERIAL PRIMARY KEY,
  consultation_id INT  NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  area_code       TEXT,
  result          JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documentos generados (persistencia)
CREATE TABLE IF NOT EXISTS documents (
  id         SERIAL PRIMARY KEY,
  tipo       TEXT NOT NULL,             -- tutela | derecho-peticion
  fields     JSONB NOT NULL,
  content    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'draft', -- draft | pending_review | approved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
