
-- Re-grant EXECUTE so RLS policies that reference these helpers keep working
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_has_permission(uuid, text) TO authenticated;

-- Lock down trigger-only helper
REVOKE EXECUTE ON FUNCTION public.prevent_privileged_profile_updates() FROM PUBLIC, anon, authenticated;

-- banned_ips: admin-only access
CREATE POLICY "Admins manage banned ips"
ON public.banned_ips FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

-- Tighten public appeal form
DROP POLICY IF EXISTS "Anyone can submit an appeal" ON public.appeals;
CREATE POLICY "Anyone can submit an appeal"
ON public.appeals FOR INSERT TO anon, authenticated
WITH CHECK (
  length(coalesce(full_name,'')) BETWEEN 1 AND 120
  AND length(coalesce(email,'')) BETWEEN 3 AND 200
  AND length(coalesce(reason,'')) BETWEEN 3 AND 200
  AND length(coalesce(details,'')) BETWEEN 3 AND 4000
  AND status = 'pending'
);
