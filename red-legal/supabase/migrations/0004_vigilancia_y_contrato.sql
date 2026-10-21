-- Vigilancia de procesos en la Rama Judicial, aceptación del contrato y límites por plan.

-- Versión del contrato aceptado al registrarse.
alter table solicitudes_abogados add column terminos_version text;

-- Datos de la Consulta de Procesos guardados en el caso.
alter table casos
  add column vigilar boolean not null default true,
  add column rama_id_proceso bigint,
  add column rama_consultado_en timestamptz,
  add column rama_error text,
  add column rama_sujetos text,
  add column rama_clase text;

-- Actuaciones traídas de la Rama: se identifican por su id para no duplicarlas.
alter table actuaciones
  add column anotacion text,
  add column rama_id bigint;
create unique index actuaciones_rama_unica on actuaciones (caso_id, rama_id);

create index casos_vigilados on casos (abogado_id) where vigilar and radicado is not null and estado <> 'cerrado';

-- Límites por plan (en la base para que no se puedan saltar desde el navegador).
create or replace function limite_plan(p plan_abogado, recurso text) returns integer language sql immutable as $$
  select case recurso
    when 'casos' then case p when 'basico' then 10 else null end
    when 'procesos' then case p when 'basico' then 10 when 'profesional' then 60 else 300 end
  end
$$;

create or replace function validar_limites_caso() returns trigger language plpgsql security definer set search_path = public as $$
declare
  pl plan_abogado;
  lim integer;
  usados integer;
begin
  select plan into pl from abogados where id = new.abogado_id;
  if pl is null then return new; end if;
  if tg_op = 'INSERT' and new.estado <> 'cerrado' then
    lim := limite_plan(pl, 'casos');
    select count(*) into usados from casos where abogado_id = new.abogado_id and estado <> 'cerrado';
    if lim is not null and usados >= lim then
      raise exception 'Tu plan permite % casos activos. Cierra uno o cambia de plan.', lim;
    end if;
  end if;
  if new.vigilar and new.radicado is not null and new.estado <> 'cerrado'
     and (tg_op = 'INSERT' or not old.vigilar or old.radicado is null or old.estado = 'cerrado') then
    lim := limite_plan(pl, 'procesos');
    select count(*) into usados from casos
      where abogado_id = new.abogado_id and vigilar and radicado is not null and estado <> 'cerrado' and id <> new.id;
    if usados >= lim then
      raise exception 'Tu plan permite vigilar % procesos. Desactiva la vigilancia de otro o cambia de plan.', lim;
    end if;
  end if;
  return new;
end $$;

create trigger limites_caso before insert or update on casos for each row execute function validar_limites_caso();
