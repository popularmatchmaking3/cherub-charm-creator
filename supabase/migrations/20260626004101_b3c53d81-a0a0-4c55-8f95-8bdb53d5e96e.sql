
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.any_admin_exists() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_has_permission(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_admin_role_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_last_seen() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

DROP POLICY IF EXISTS "Receiver updates status, sender can cancel" ON public.interests;
CREATE POLICY "Receiver updates status, sender can cancel"
ON public.interests FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id OR auth.uid() = sender_id)
WITH CHECK (
  (auth.uid() = receiver_id)
  OR (auth.uid() = sender_id AND status = 'pending'::interest_status)
);

CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF app_private.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.review_status IS DISTINCT FROM OLD.review_status
     OR NEW.membership_tier IS DISTINCT FROM OLD.membership_tier
     OR NEW.membership_expires_at IS DISTINCT FROM OLD.membership_expires_at
     OR NEW.is_banned_permanent IS DISTINCT FROM OLD.is_banned_permanent
     OR NEW.ban_reason IS DISTINCT FROM OLD.ban_reason
     OR NEW.banned_until IS DISTINCT FROM OLD.banned_until
     OR NEW.report_disabled IS DISTINCT FROM OLD.report_disabled
     OR NEW.block_disabled IS DISTINCT FROM OLD.block_disabled
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.disability_verified IS DISTINCT FROM OLD.disability_verified
     OR NEW.id_verification_status IS DISTINCT FROM OLD.id_verification_status
     OR NEW.disability_verification_status IS DISTINCT FROM OLD.disability_verification_status
     OR NEW.daily_message_limit_override IS DISTINCT FROM OLD.daily_message_limit_override
     OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
     OR NEW.review_decided_at IS DISTINCT FROM OLD.review_decided_at
     OR NEW.review_decided_by IS DISTINCT FROM OLD.review_decided_by
     OR NEW.review_notes IS DISTINCT FROM OLD.review_notes
  THEN
    RAISE EXCEPTION 'Not allowed to modify admin-controlled fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privileged_profile_updates ON public.profiles;
CREATE TRIGGER trg_prevent_privileged_profile_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_profile_updates();

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view photos of any profile" ON storage.objects;
CREATE POLICY "Users can view profile photos with permission"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND COALESCE(p.photos_private, false) = false
    )
    OR EXISTS (
      SELECT 1 FROM public.photo_access_requests par
      WHERE par.requester_id = auth.uid()
        AND par.owner_id::text = (storage.foldername(name))[1]
        AND par.status = 'approved'
    )
  )
);

CREATE POLICY "Admins view login history"
ON public.login_history FOR SELECT TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view user ip log"
ON public.user_ip_log FOR SELECT TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view user reports"
ON public.user_reports FOR SELECT TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update user reports"
ON public.user_reports FOR UPDATE TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));
