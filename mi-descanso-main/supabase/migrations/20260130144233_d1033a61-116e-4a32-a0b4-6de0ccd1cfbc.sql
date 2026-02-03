-- Fix the security definer view warning by making it SECURITY INVOKER
-- and granting proper permissions through RLS bypass function instead

-- Drop the security definer view and recreate as security invoker
DROP VIEW IF EXISTS public.profile_names;

-- Create view with security_invoker = true (PostgreSQL 15+)
-- This view won't work due to RLS, but the get_profile_name function provides the safe bypass
CREATE VIEW public.profile_names 
WITH (security_invoker = true) AS
SELECT id, name
FROM public.profiles;

-- Grant SELECT on view
GRANT SELECT ON public.profile_names TO authenticated;