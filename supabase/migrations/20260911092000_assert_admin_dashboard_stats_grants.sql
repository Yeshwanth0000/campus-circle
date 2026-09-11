-- Executable invariant, not a schema change.
--
-- admin_dashboard_stats runs as SECURITY DEFINER, so it sees every row in the
-- college regardless of RLS. The only things standing between that and a data
-- leak are its own is_admin check and these grants. This migration fails
-- loudly rather than silently drifting if either is ever wrong.

do $$
begin
  if has_function_privilege('anon', 'public.admin_dashboard_stats()', 'EXECUTE') then
    raise exception 'FAIL: anon can execute admin_dashboard_stats';
  end if;

  if has_function_privilege('public', 'public.admin_dashboard_stats()', 'EXECUTE') then
    raise exception 'FAIL: PUBLIC can execute admin_dashboard_stats';
  end if;

  if not has_function_privilege('authenticated', 'public.admin_dashboard_stats()', 'EXECUTE') then
    raise exception 'FAIL: authenticated cannot execute admin_dashboard_stats';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_dashboard_stats'
      and p.prosecdef
      and p.proconfig @> array['search_path=public, auth, pg_temp']
  ) then
    raise exception 'FAIL: not security definer with a pinned search_path';
  end if;

  raise notice 'PASS: admin_dashboard_stats grants and definer settings are correct';
end $$;
