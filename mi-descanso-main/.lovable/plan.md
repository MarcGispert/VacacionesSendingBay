
# Plan: Configuracion Completa de Supabase para Gestion de Vacaciones

## Resumen

Configurar la base de datos de Supabase con todas las tablas necesarias, funciones de seguridad, triggers y politicas RLS para que la aplicacion funcione con autenticacion real y persistencia de datos.

---

## Paso 1: Crear Enum y Tabla de Roles

Crear el sistema de roles separado (siguiendo las mejores practicas de seguridad):

```sql
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

---

## Paso 2: Crear Funcion Security Definer para Verificar Roles

Funcion que evita recursion infinita en RLS:

```sql
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
```

---

## Paso 3: Crear Tabla de Perfiles

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

## Paso 4: Crear Tabla de Solicitudes de Vacaciones

```sql
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
```

---

## Paso 5: Crear Tablas de Opciones de Navidad

```sql
-- Opciones de Navidad configuradas por admin
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

-- Eleccion de cada usuario
CREATE TABLE public.user_christmas_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    option_label CHAR(1) NOT NULL CHECK (option_label IN ('A', 'B')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, year)
);

ALTER TABLE public.user_christmas_choices ENABLE ROW LEVEL SECURITY;
```

---

## Paso 6: Crear Tabla de Dias de Cumpleanos Seleccionados

```sql
CREATE TABLE public.user_birthday_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    selected_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, year)
);

ALTER TABLE public.user_birthday_days ENABLE ROW LEVEL SECURITY;
```

---

## Paso 7: Crear Trigger para Auto-crear Perfil y Rol

```sql
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
```

---

## Paso 8: Politicas RLS

### Tabla user_roles:
```sql
-- Los usuarios pueden ver su propio rol
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins pueden ver todos los roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins pueden actualizar roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Tabla profiles:
```sql
-- Usuarios pueden ver todos los perfiles (para calendario)
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Tabla vacation_requests:
```sql
-- Usuarios pueden ver todas las vacaciones (para calendario)
CREATE POLICY "Users can view all vacations"
ON public.vacation_requests FOR SELECT
TO authenticated
USING (true);

-- Usuarios pueden crear sus propias solicitudes
CREATE POLICY "Users can create own requests"
ON public.vacation_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuarios pueden eliminar sus propias solicitudes
CREATE POLICY "Users can delete own requests"
ON public.vacation_requests FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### Tabla christmas_options:
```sql
-- Todos los usuarios autenticados pueden ver opciones
CREATE POLICY "Users can view christmas options"
ON public.christmas_options FOR SELECT
TO authenticated
USING (true);

-- Solo admins pueden gestionar opciones
CREATE POLICY "Admins can manage christmas options"
ON public.christmas_options FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Tabla user_christmas_choices:
```sql
-- Usuarios pueden ver todas las elecciones
CREATE POLICY "Users can view all choices"
ON public.user_christmas_choices FOR SELECT
TO authenticated
USING (true);

-- Usuarios pueden gestionar su propia eleccion
CREATE POLICY "Users can manage own choice"
ON public.user_christmas_choices FOR ALL
TO authenticated
USING (user_id = auth.uid());
```

### Tabla user_birthday_days:
```sql
-- Usuarios pueden ver sus propios dias
CREATE POLICY "Users can view own birthday days"
ON public.user_birthday_days FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuarios pueden gestionar sus propios dias
CREATE POLICY "Users can manage own birthday day"
ON public.user_birthday_days FOR ALL
TO authenticated
USING (user_id = auth.uid());
```

---

## Paso 9: Insertar Datos Iniciales

```sql
-- Opciones de Navidad 2026
INSERT INTO public.christmas_options (year, option_label, start_date, end_date)
VALUES 
  (2026, 'A', '2026-12-21', '2026-12-27'),
  (2026, 'B', '2026-12-28', '2027-01-03'),
  (2027, 'A', '2027-12-20', '2027-12-26'),
  (2027, 'B', '2027-12-27', '2028-01-02');
```

---

## Paso 10: Actualizar Codigo Frontend

Despues de crear las tablas, actualizare:

1. **AuthContext.tsx**: Conectar con Supabase Auth real
2. **MyVacations.tsx**: Usar consultas a Supabase en lugar de mock data
3. **TeamCalendar.tsx**: Cargar vacaciones reales de la base de datos
4. **AdminPanel.tsx**: Gestionar usuarios y opciones de Navidad desde Supabase

---

## Seccion Tecnica

### Arquitectura de la Base de Datos

```text
+----------------+     +----------------+     +--------------------+
|   auth.users   |---->|    profiles    |     |    user_roles      |
|                |     | - name         |     | - role (admin/     |
|                |     | - email        |     |   employee)        |
|                |     | - birth_date   |     +--------------------+
+----------------+     +----------------+              |
        |                                              |
        v                                              v
+--------------------+    +---------------------+    has_role()
| vacation_requests  |    | christmas_options   |    (security definer)
| - start_date       |    | - year              |
| - end_date         |    | - option_label      |
| - type             |    | - start/end_date    |
| - status           |    +---------------------+
| - days_count       |              |
+--------------------+              v
        |              +------------------------+
        |              | user_christmas_choices |
        |              +------------------------+
        v
+----------------------+
| user_birthday_days   |
| - year               |
| - selected_date      |
+----------------------+
```

### Flujo de Autenticacion

1. Usuario se registra con email/password
2. Trigger `on_auth_user_created` se ejecuta automaticamente
3. Se crea perfil en `profiles` con datos del usuario
4. Se asigna rol en `user_roles` (admin si es sendingbay.marc@gmail.com)
5. Frontend carga rol y muestra UI correspondiente

### Consideraciones de Seguridad

- Roles en tabla separada (evita privilege escalation)
- Funcion `has_role()` con SECURITY DEFINER (evita recursion RLS)
- RLS habilitado en todas las tablas
- Politicas granulares por operacion (SELECT, INSERT, UPDATE, DELETE)
