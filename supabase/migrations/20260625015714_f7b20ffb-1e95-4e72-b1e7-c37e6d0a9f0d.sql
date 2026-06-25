DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;

DROP SCHEMA IF EXISTS app_private CASCADE;

DELETE FROM auth.users;