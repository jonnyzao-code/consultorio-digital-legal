-- Minutas de pago: cada compra (o uso del cupo del plan) da acceso a una minuta por 30 días.
alter type tipo_pago add value if not exists 'minuta';
alter table pagos add column minuta_id text;

create table accesos_minutas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles on delete cascade,
  minuta_id text not null,
  origen text not null check (origen in ('pago', 'plan')),
  pago_id uuid references pagos,
  vence date not null,
  creado_en timestamptz not null default now()
);
create index accesos_minutas_perfil on accesos_minutas (perfil_id, minuta_id, vence);

alter table accesos_minutas enable row level security;
create policy "mis minutas" on accesos_minutas for select using (perfil_id = auth.uid() or es_admin());

-- Cupo mensual de minutas por plan (null = ilimitado).
create or replace function cupo_minutas(p plan_abogado) returns integer language sql immutable as $$
  select case p when 'basico' then 5 when 'profesional' then 30 else null end
$$;

-- Usa el cupo del plan vigente del abogado para abrir una minuta. Devuelve un mensaje si no puede.
create or replace function usar_cupo_minuta(minuta text) returns text language plpgsql security definer set search_path = public as $$
declare
  pl plan_abogado;
  lim integer;
  usados integer;
begin
  select a.plan into pl from abogados a
    where a.id = auth.uid() and a.activo
      and exists (select 1 from suscripciones s where s.abogado_id = a.id and s.vigente_hasta >= current_date);
  if pl is null then return 'Necesitas una suscripción vigente de abogado.'; end if;
  if exists (select 1 from accesos_minutas where perfil_id = auth.uid() and minuta_id = minuta and vence >= current_date) then
    return null;
  end if;
  lim := cupo_minutas(pl);
  select count(*) into usados from accesos_minutas
    where perfil_id = auth.uid() and origen = 'plan' and creado_en >= date_trunc('month', now());
  if lim is not null and usados >= lim then
    return format('Usaste las %s minutas de tu plan este mes. Puedes comprarla o cambiar de plan.', lim);
  end if;
  insert into accesos_minutas (perfil_id, minuta_id, origen, vence) values (auth.uid(), minuta, 'plan', current_date + 30);
  return null;
end $$;
