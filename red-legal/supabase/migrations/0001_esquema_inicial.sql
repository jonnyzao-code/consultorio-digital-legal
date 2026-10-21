-- Red Legal DOMINET: esquema inicial (fase 1)
-- Principio: el administrador ve métricas, no el contenido de los expedientes (secreto profesional).

create type rol_usuario as enum ('cliente', 'abogado', 'admin');
create type plan_abogado as enum ('basico', 'profesional', 'firma');
create type estado_solicitud as enum ('pendiente', 'aprobada', 'rechazada');
create type urgencia as enum ('alta', 'media', 'baja');
create type estado_caso as enum ('nuevo', 'en_curso', 'en_espera', 'cerrado');

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  rol rol_usuario not null default 'cliente',
  nombre text not null,
  telefono text,
  codigo_referido text unique default substr(md5(random()::text), 1, 8),
  autoriza_datos_en timestamptz not null default now(),
  creado_en timestamptz not null default now()
);

create or replace function es_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
$$;

-- Solicitudes públicas de vinculación (se insertan desde el servidor con service role).
create table solicitudes_abogados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  telefono text not null,
  ciudad text not null,
  tarjeta_profesional text not null unique,
  areas text[] not null,
  plan plan_abogado not null,
  codigo_referido text,
  estado estado_solicitud not null default 'pendiente',
  verificado_sirna_en timestamptz,
  creado_en timestamptz not null default now()
);

create table abogados (
  id uuid primary key references perfiles on delete cascade,
  tarjeta_profesional text not null unique,
  ciudad text not null,
  areas text[] not null,
  plan plan_abogado not null,
  bio text,
  tarifa_referencia integer,
  activo boolean not null default false,
  verificado_en timestamptz,
  referido_por uuid references perfiles
);

create table suscripciones (
  id uuid primary key default gen_random_uuid(),
  abogado_id uuid not null references abogados on delete cascade,
  plan plan_abogado not null,
  periodicidad text not null check (periodicidad in ('mensual', 'anual')),
  valor_cop integer not null,
  descuento_pct integer not null default 0,
  vigente_hasta date not null,
  referencia_pasarela text,
  creado_en timestamptz not null default now()
);

create table consultas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references perfiles on delete set null,
  areas text[] not null,
  urgencia urgencia not null,
  resumen text not null,
  orientacion jsonb not null,
  concepto_pagado boolean not null default false,
  abogado_revisor uuid references abogados,
  concepto_firmado text,
  firmado_en timestamptz,
  creado_en timestamptz not null default now()
);

create table casos (
  id uuid primary key default gen_random_uuid(),
  consulta_id uuid references consultas,
  cliente_id uuid references perfiles,
  abogado_id uuid not null references abogados,
  area text not null,
  titulo text not null,
  radicado text,
  despacho text,
  estado estado_caso not null default 'nuevo',
  abierto_en timestamptz not null default now(),
  primera_respuesta_en timestamptz,
  cerrado_en timestamptz
);

create table actuaciones (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos on delete cascade,
  fecha date not null,
  descripcion text not null,
  fuente text not null default 'manual' check (fuente in ('manual', 'rama_judicial')),
  creado_en timestamptz not null default now()
);

create table terminos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos on delete cascade,
  descripcion text not null,
  vence date not null,
  urgente boolean not null default false,
  cumplido boolean not null default false,
  ultimo_aviso_en timestamptz
);

create table calificaciones (
  caso_id uuid primary key references casos on delete cascade,
  estrellas smallint not null check (estrellas between 1 and 5),
  comentario text,
  creado_en timestamptz not null default now()
);

-- Referidos de un solo nivel: se premian con meses gratis o cupones, nunca dinero.
create table referidos (
  id uuid primary key default gen_random_uuid(),
  referente_id uuid not null references perfiles,
  referido_id uuid not null unique references perfiles,
  recompensa text not null check (recompensa in ('mes_gratis', 'cupon_20')),
  otorgada_en timestamptz,
  creado_en timestamptz not null default now(),
  check (referente_id <> referido_id)
);

-- Seguridad por fila
alter table perfiles enable row level security;
alter table solicitudes_abogados enable row level security;
alter table abogados enable row level security;
alter table suscripciones enable row level security;
alter table consultas enable row level security;
alter table casos enable row level security;
alter table actuaciones enable row level security;
alter table terminos enable row level security;
alter table calificaciones enable row level security;
alter table referidos enable row level security;

create policy "perfil propio" on perfiles for select using (id = auth.uid() or es_admin());
create policy "editar perfil propio" on perfiles for update using (id = auth.uid()) with check (rol = (select rol from perfiles where id = auth.uid()));
create policy "admin revisa solicitudes" on solicitudes_abogados for all using (es_admin());
create policy "abogados activos son públicos" on abogados for select using (activo or id = auth.uid() or es_admin());
create policy "abogado edita su perfil" on abogados for update using (id = auth.uid());
create policy "suscripción propia" on suscripciones for select using (abogado_id = auth.uid() or es_admin());
create policy "consulta del cliente o revisor" on consultas for select using (cliente_id = auth.uid() or abogado_revisor = auth.uid());
create policy "revisor firma" on consultas for update using (abogado_revisor = auth.uid());
-- Casos y sus hijos: solo cliente y abogado del caso. El admin usa la vista de métricas.
create policy "partes del caso" on casos for select using (cliente_id = auth.uid() or abogado_id = auth.uid());
create policy "abogado gestiona caso" on casos for update using (abogado_id = auth.uid());
create policy "abogado gestiona actuaciones" on actuaciones for all using (exists (select 1 from casos c where c.id = caso_id and c.abogado_id = auth.uid()));
create policy "cliente ve actuaciones" on actuaciones for select using (exists (select 1 from casos c where c.id = caso_id and c.cliente_id = auth.uid()));
create policy "términos del abogado" on terminos for all using (exists (select 1 from casos c where c.id = caso_id and c.abogado_id = auth.uid()));
create policy "cliente califica" on calificaciones for insert with check (exists (select 1 from casos c where c.id = caso_id and c.cliente_id = auth.uid() and c.estado = 'cerrado'));
create policy "ver calificaciones" on calificaciones for select using (true);
create policy "mis referidos" on referidos for select using (referente_id = auth.uid() or es_admin());

-- Métricas para el administrador sin acceso al contenido de los casos.
create view metricas_abogados with (security_invoker = false) as
select
  a.id as abogado_id,
  p.nombre,
  count(c.id) filter (where c.estado <> 'cerrado') as casos_activos,
  count(c.id) filter (where c.estado = 'cerrado') as casos_cerrados,
  round(avg(extract(epoch from c.primera_respuesta_en - c.abierto_en) / 3600)::numeric, 1) as horas_primera_respuesta,
  round(avg(extract(epoch from c.cerrado_en - c.abierto_en) / 86400)::numeric, 1) as dias_solucion,
  (select count(*) from terminos t join casos c2 on c2.id = t.caso_id where c2.abogado_id = a.id and not t.cumplido and t.vence < current_date) as terminos_vencidos,
  round(avg(q.estrellas)::numeric, 2) as calificacion
from abogados a
join perfiles p on p.id = a.id
left join casos c on c.abogado_id = a.id
left join calificaciones q on q.caso_id = c.id
where es_admin()
group by a.id, p.nombre;
