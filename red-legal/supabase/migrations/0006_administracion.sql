-- Administración: bitácora de acciones del administrador y suspensión de cuentas.
alter table perfiles add column suspendido boolean not null default false;

create table bitacora_admin (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references perfiles,
  accion text not null,
  objetivo text,
  detalle jsonb,
  creado_en timestamptz not null default now()
);
alter table bitacora_admin enable row level security;
create policy "admin lee bitácora" on bitacora_admin for select using (es_admin());

-- Dueño de la plataforma (si ya ingresó alguna vez con estos correos).
update perfiles set rol = 'admin'
where id in (select id from auth.users where lower(email) in ('jonnyzao@gmail.com', 'dominetsas@gmail.com'));
