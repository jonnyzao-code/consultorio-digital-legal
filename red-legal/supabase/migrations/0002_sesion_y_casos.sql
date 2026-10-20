-- Crea el perfil al registrarse y habilita la gestión de casos por el abogado.

create or replace function crear_perfil() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre) values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger al_crear_usuario after insert on auth.users for each row execute function crear_perfil();

create policy "abogado crea casos" on casos for insert with check (abogado_id = auth.uid() and exists (select 1 from abogados where id = auth.uid() and activo));

-- Al aprobar una solicitud, el admin vincula el usuario existente con este procedimiento.
create or replace function aprobar_abogado(solicitud uuid, usuario uuid) returns void language plpgsql security definer set search_path = public as $$
declare s solicitudes_abogados;
begin
  if not es_admin() then raise exception 'Solo el administrador puede aprobar'; end if;
  select * into s from solicitudes_abogados where id = solicitud;
  update solicitudes_abogados set estado = 'aprobada', verificado_sirna_en = now() where id = solicitud;
  update perfiles set rol = 'abogado', nombre = s.nombre, telefono = s.telefono where id = usuario;
  insert into abogados (id, tarjeta_profesional, ciudad, areas, plan, activo, verificado_en)
  values (usuario, s.tarjeta_profesional, s.ciudad, s.areas, s.plan, true, now());
end $$;
