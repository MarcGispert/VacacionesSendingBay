-- =============================================
-- PASO 1: Crear Enum y Tabla de Roles
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 2: Función Security Definer para Roles
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- PASO 3: Tabla de Perfiles
-- =============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 4: Tabla de Solicitudes de Vacaciones
-- =============================================

CREATE TYPE public.vacation_type AS ENUM ('regular', 'birthday', 'holiday', 'christmas');
CREATE TYPE public.vacation_status AS ENUM ('approved', 'pending', 'rejected');

CREATE TABLE public.vacation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type vacation_type NOT NULL DEFAULT 'regular',
    status vacation_status NOT NULL DEFAULT 'approved',
    days_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 5: Tablas de Opciones de Navidad
-- =============================================

CREATE TABLE public.christmas_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    option_label CHAR(1) NOT NULL CHECK (option_label IN ('A', 'B')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (year, option_label)
);

ALTER TABLE public.christmas_options ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_christmas_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    option_label CHAR(1) NOT NULL CHECK (option_label IN ('A', 'B')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, year)
);

ALTER TABLE public.user_christmas_choices ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 6: Tabla de Días de Cumpleaños
-- =============================================

CREATE TABLE public.user_birthday_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    selected_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, year)
);

ALTER TABLE public.user_birthday_days ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 7: Trigger para Auto-crear Perfil y Rol
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Determinar rol basado en email
  IF NEW.email = 'sendingbay.marc@gmail.com' THEN
    user_role := 'admin';
  ELSE
    user_role := 'employee';
  END IF;

  -- Crear perfil
  INSERT INTO public.profiles (id, email, name, birth_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'birth_date')::DATE 
      ELSE NULL 
    END
  );

  -- Crear rol
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PASO 8: Políticas RLS
-- =============================================

-- Tabla user_roles
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabla profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabla vacation_requests
CREATE POLICY "Users can view all vacations"
ON public.vacation_requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own requests"
ON public.vacation_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own requests"
ON public.vacation_requests FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabla christmas_options
CREATE POLICY "Users can view christmas options"
ON public.christmas_options FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert christmas options"
ON public.christmas_options FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update christmas options"
ON public.christmas_options FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete christmas options"
ON public.christmas_options FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabla user_christmas_choices
CREATE POLICY "Users can view all choices"
ON public.user_christmas_choices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own choice"
ON public.user_christmas_choices FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own choice"
ON public.user_christmas_choices FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own choice"
ON public.user_christmas_choices FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabla user_birthday_days
CREATE POLICY "Users can view own birthday days"
ON public.user_birthday_days FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own birthday day"
ON public.user_birthday_days FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own birthday day"
ON public.user_birthday_days FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own birthday day"
ON public.user_birthday_days FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- PASO 9: Datos Iniciales de Navidad
-- =============================================

INSERT INTO public.christmas_options (year, option_label, start_date, end_date)
VALUES 
  (2026, 'A', '2026-12-21', '2026-12-27'),
  (2026, 'B', '2026-12-28', '2027-01-03'),
  (2027, 'A', '2027-12-20', '2027-12-26'),
  (2027, 'B', '2027-12-27', '2028-01-02');