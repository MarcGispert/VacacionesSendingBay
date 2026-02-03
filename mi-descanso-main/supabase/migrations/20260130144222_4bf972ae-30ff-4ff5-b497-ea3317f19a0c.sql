-- Fix profiles table exposure: restrict full access but allow limited data for calendar

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create proper SELECT policies
-- Users can see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can see all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create a limited view for calendar that only exposes id and name (no email/birth_date)
CREATE OR REPLACE VIEW public.profile_names AS
SELECT id, name
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profile_names TO authenticated;

-- Enable RLS bypass for the view using a security definer function
-- This allows all authenticated users to see names without accessing full profiles
CREATE OR REPLACE FUNCTION public.get_profile_name(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name FROM public.profiles WHERE id = _user_id
$$;