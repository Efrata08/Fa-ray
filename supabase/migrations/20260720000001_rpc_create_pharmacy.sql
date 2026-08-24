-- RPC called immediately after Supabase signUp to create the pharmacy row and
-- the caller's user_profile in one atomic transaction. SECURITY DEFINER lets it
-- bypass RLS — on a brand-new account auth_pharmacy_id() returns NULL, so the
-- normal INSERT policies would reject both writes.
CREATE OR REPLACE FUNCTION create_pharmacy_and_profile(
  pharmacy_name  TEXT,
  sort_pref      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_pharmacy_id UUID;
BEGIN
  INSERT INTO pharmacies (name, sort_preference)
  VALUES (pharmacy_name, sort_pref)
  RETURNING id INTO new_pharmacy_id;

  INSERT INTO user_profiles (id, pharmacy_id, role)
  VALUES (auth.uid(), new_pharmacy_id, 'owner');

  RETURN new_pharmacy_id;
END;
$$;
