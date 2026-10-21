-- Pagos con Wompi (checkout web). Cada pago cubre un periodo; la renovación se avisa por correo.
create type tipo_pago as enum ('suscripcion', 'concepto');
create type estado_pago as enum ('pendiente', 'aprobado', 'rechazado', 'anulado', 'error');

create table pagos (
  id uuid primary key default gen_random_uuid(),
  referencia text not null unique,
  tipo tipo_pago not null,
  perfil_id uuid not null references perfiles,
  plan plan_abogado,
  periodicidad text check (periodicidad in ('mensual', 'anual')),
  consulta_id uuid references consultas,
  monto_centavos bigint not null,
  descuento_pct integer not null default 0,
  estado estado_pago not null default 'pendiente',
  wompi_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table pagos enable row level security;
create policy "mis pagos" on pagos for select using (perfil_id = auth.uid() or es_admin());
