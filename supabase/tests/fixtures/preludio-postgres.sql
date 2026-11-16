-- Preludio para aplicar esquema-produccion.sql en un Postgres sin Supabase (por ejemplo postgres:17.6).
-- En el stack local de Supabase no hace falta: esos esquemas, roles y auth.uid() ya existen.
create schema if not exists extensions;
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
do $$ begin
  if to_regprocedure('auth.uid()') is null then
    execute 'create function auth.uid() returns uuid language sql stable as $f$ select null::uuid $f$';
  end if;
end $$;
