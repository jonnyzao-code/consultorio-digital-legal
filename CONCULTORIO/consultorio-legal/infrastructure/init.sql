-- ─────────────────────────────────────────────────────────────
--  Consultorio Legal — Esquema Inicial de Base de Datos
--  PostgreSQL 16 · UUID · JSONB · Particionado por estado
-- ─────────────────────────────────────────────────────────────

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tipos ENUM ───────────────────────────────────────────────

CREATE TYPE tipo_usuario AS ENUM (
  'ciudadano',
  'abogado',
  'admin'
);

CREATE TYPE rama_derecho AS ENUM (
  'penal',
  'civil',
  'laboral',
  'familia',
  'administrativo',
  'otro'
);

CREATE TYPE estado_consulta AS ENUM (
  'pendiente',
  'en_proceso',
  'completada',
  'cancelada'
);

CREATE TYPE estado_pago AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'reembolsado'
);

CREATE TYPE tipo_documento AS ENUM (
  'tutela',
  'derecho_peticion',
  'contrato_arrendamiento',
  'contrato_prestacion',
  'liquidacion_alimentos',
  'demanda'
);

-- ─── Tabla: usuarios ─────────────────────────────────────────

CREATE TABLE usuarios (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            VARCHAR(255)  NOT NULL,
  email             VARCHAR(255)  UNIQUE NOT NULL,
  hashed_password   VARCHAR(255),
  telefono          VARCHAR(20),
  cedula            VARCHAR(20)   UNIQUE,
  tipo_usuario      tipo_usuario  NOT NULL DEFAULT 'ciudadano',
  activo            BOOLEAN       DEFAULT TRUE,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── Tabla: abogados ─────────────────────────────────────────

CREATE TABLE abogados (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id          UUID          UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidades      rama_derecho[] DEFAULT '{}',
  disponible          BOOLEAN       DEFAULT TRUE,
  tarifa_consulta     DECIMAL(10,2),
  tarjeta_profesional VARCHAR(50),
  rating              DECIMAL(3,2)  DEFAULT 0.00,
  total_consultas     INTEGER       DEFAULT 0,
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── Tabla: consultas ────────────────────────────────────────

CREATE TABLE consultas (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id        UUID          REFERENCES usuarios(id) ON DELETE CASCADE,
  abogado_id        UUID          REFERENCES abogados(id),
  rama_derecho      rama_derecho,
  descripcion       TEXT          NOT NULL,
  datos_adicionales JSONB         DEFAULT '{}',
  estado            estado_consulta DEFAULT 'pendiente',
  prioridad         INTEGER       DEFAULT 1,
  pro_bono          BOOLEAN       DEFAULT FALSE,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── Tabla: documentos ───────────────────────────────────────

CREATE TABLE documentos (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id      UUID           REFERENCES consultas(id) ON DELETE CASCADE,
  tipo_documento   tipo_documento NOT NULL,
  nombre_archivo   VARCHAR(255),
  url_storage      VARCHAR(500),
  datos_formulario JSONB          DEFAULT '{}',
  generado_at      TIMESTAMPTZ    DEFAULT NOW()
);

-- ─── Tabla: procesos_monitoreados ────────────────────────────

CREATE TABLE procesos_monitoreados (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id         UUID         REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_radicado    VARCHAR(100) NOT NULL,
  tipo_proceso       VARCHAR(100),
  entidad            VARCHAR(100),
  ultimo_estado      TEXT,
  ultima_novedad_at  TIMESTAMPTZ,
  activo             BOOLEAN      DEFAULT TRUE,
  created_at         TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Tabla: pagos ────────────────────────────────────────────

CREATE TABLE pagos (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id          UUID          REFERENCES usuarios(id) ON DELETE CASCADE,
  consulta_id         UUID          REFERENCES consultas(id),
  monto               DECIMAL(10,2) NOT NULL,
  moneda              VARCHAR(3)    DEFAULT 'COP',
  estado              estado_pago   DEFAULT 'pendiente',
  referencia_wompi    VARCHAR(255),
  referencia_interna  VARCHAR(255)  UNIQUE DEFAULT uuid_generate_v4()::text,
  metadatos           JSONB         DEFAULT '{}',
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── Tabla: alertas ──────────────────────────────────────────

CREATE TABLE alertas (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID         REFERENCES usuarios(id) ON DELETE CASCADE,
  proceso_id  UUID         REFERENCES procesos_monitoreados(id),
  tipo_alerta VARCHAR(50),
  mensaje     TEXT,
  enviada     BOOLEAN      DEFAULT FALSE,
  canal       VARCHAR(20),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Índices para rendimiento ─────────────────────────────────

CREATE INDEX idx_consultas_usuario  ON consultas(usuario_id);
CREATE INDEX idx_consultas_estado   ON consultas(estado);
CREATE INDEX idx_pagos_usuario      ON pagos(usuario_id);
CREATE INDEX idx_procesos_usuario   ON procesos_monitoreados(usuario_id);
CREATE INDEX idx_usuarios_email     ON usuarios(email);

-- ─── Fin del script ───────────────────────────────────────────
