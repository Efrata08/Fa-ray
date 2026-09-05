-- The initial schema enabled RLS and added isolation policies on every table,
-- but never granted the underlying table privileges to anon/authenticated —
-- so PostgREST was rejecting all requests with 42501 before RLS was even
-- evaluated. New tables in `public` are supposed to inherit these grants
-- automatically on a Supabase project; re-asserting them explicitly here (and
-- via ALTER DEFAULT PRIVILEGES for anything created after this point) so it
-- doesn't silently regress again.
--
-- Row-level access is still enforced entirely by the *_isolation RLS
-- policies from the initial schema — these grants only unlock table-level
-- access, matching Supabase's standard default-privilege setup.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
