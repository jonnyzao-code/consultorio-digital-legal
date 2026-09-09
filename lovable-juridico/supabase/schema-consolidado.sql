-- =============================================================================
-- CONSULTORIO / VIGILANCIA DE PROCESOS — Esquema completo consolidado
-- Paste esto en: Supabase → SQL Editor → New query → Run
-- (Equivale a las 3 migraciones del proyecto, en orden y sin pasos manuales)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tipos y tablas
-- ----------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.plan_tipo AS ENUM ('free','pago');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nombre_completo text NOT NULL DEFAULT '',
  tipo_documento text NOT NULL DEFAULT 'CC',
  documento text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  ciudad text NOT NULL DEFAULT '',
  tarjeta_profesional text NOT NULL DEFAULT '',
  despacho text NOT NULL DEFAULT '',
  plan public.plan_tipo NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "perfil propio visible" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "crear perfil propio" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "actualizar perfil propio" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "ver roles propios" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.procesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  demandante text NOT NULL DEFAULT '',
  demandado text NOT NULL DEFAULT '',
  clasificacion text NOT NULL DEFAULT 'civil',
  notas text NOT NULL DEFAULT '',
  ultima_vista text,
  ultima_actuacion text,
  ultima_verificacion timestamptz,
  vigente_hasta timestamptz NOT NULL DEFAULT now() + interval '1 day',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.procesos TO authenticated;
GRANT ALL ON public.procesos TO service_role;
ALTER TABLE public.procesos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "procesos propios" ON public.procesos FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proceso_id uuid REFERENCES public.procesos(id) ON DELETE SET NULL,
  referencia text NOT NULL UNIQUE,
  monto_centavos integer NOT NULL DEFAULT 1000000,
  estado text NOT NULL DEFAULT 'PENDIENTE',
  transaccion_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pagos TO authenticated;
GRANT ALL ON public.pagos TO service_role;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagos propios" ON public.pagos FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "crear pago propio" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. Trigger: crea perfil y rol al registrarse un usuario
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, tipo_documento, documento, telefono, ciudad, tarjeta_profesional, despacho)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo_documento', 'CC'),
    COALESCE(NEW.raw_user_meta_data->>'documento', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    COALESCE(NEW.raw_user_meta_data->>'ciudad', ''),
    COALESCE(NEW.raw_user_meta_data->>'tarjeta_profesional', ''),
    COALESCE(NEW.raw_user_meta_data->>'despacho', '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. Seguridad de funciones
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. (OPCIONAL) Marcar un usuario como ADMIN.
--    Reemplaza el UUID por el id del usuario que quieras administrador
--    (lo tomas de Authentication → Users tras registrarlo) y ejecuta:
-- ----------------------------------------------------------------------------
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('TU-UUID-DEL-USUARIO', 'admin') ON CONFLICT (user_id, role) DO NOTHING;
-- UPDATE public.profiles SET plan = 'pago' WHERE id = 'TU-UUID-DEL-USUARIO';

-- =============================================================================
-- Listo. El esquema queda creado y protegido por RLS.
-- =============================================================================
