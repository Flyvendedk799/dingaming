-- =====================================================================
-- Grant the standard Supabase API roles access to the public schema.
--
-- On hosted Supabase these grants are applied automatically at project
-- creation, so the original migrations relied on them implicitly. When the
-- project is run locally they are missing, which makes PostgREST return
-- "permission denied for table ..." for every request. Row Level Security
-- (enabled on every table) is what actually restricts access — these grants
-- only let the roles attempt it.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Ensure objects created by future migrations inherit the same grants.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
