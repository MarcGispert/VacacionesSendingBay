-- Reassign admin user and keep role assignment logic consistent for future signups.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Admin account by email
  IF NEW.email = 'manu@sendingbay.com' THEN
    user_role := 'admin';
  ELSE
    user_role := 'employee';
  END IF;

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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- Promote manu@sendingbay.com to admin (single role row).
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'manu@sendingbay.com'
);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'manu@sendingbay.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove admin from sendingbay.marc@gmail.com and keep as employee.
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'sendingbay.marc@gmail.com'
);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employee'::public.app_role
FROM auth.users
WHERE email = 'sendingbay.marc@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
