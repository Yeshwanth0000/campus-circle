# Database

The Postgres schema lives in the Supabase project `clpfcygjtkjeafvscdwb`
(`campus-circle-marketplace`, region `ap-south-1`).

## Read this first: the history here is incomplete

`migrations/` was started on 11 Sep 2026, well after the database was built.
It contains **only changes made from that date onwards**. Everything created
before it exists *only* inside Supabase and is not reproducible from this
repo.

As of the day this folder was created, the database contained:

| Object | Count | In `migrations/`? |
|---|---|---|
| Tables | 11 | no |
| RLS policies | 29 | no |
| Functions | 19 | 4 of them |
| Triggers | 10 | 1 of them |
| Storage buckets | 2 (`avatars`, `listing-images`) | no |

So roughly 80% of the schema — including **every RLS policy**, which is what
keeps one college's listings and one conversation's messages private — is
currently unversioned. Treat this folder as "new changes are tracked", not as
"the schema is tracked".

## Closing the gap

Generating a true baseline needs the Supabase CLI authenticated against the
project, which also needs the database password:

```bash
npx supabase login
npx supabase link --project-ref clpfcygjtkjeafvscdwb
npx supabase db pull          # writes the full current schema as a migration
```

Commit the file that produces as the earliest migration, renaming it so it
sorts before the ones already here (e.g. `20260101000000_baseline.sql`).
Until that is done, losing access to the Supabase project means rebuilding
the policies by hand.

## Why it matters beyond backups

- **No staging.** There is no second environment to test a migration against,
  because there is no schema to stand one up from.
- **RLS is the security model.** Those 29 policies are what make the app
  college-private. They are the least replaceable thing in the system and the
  least protected.
- **The free plan allows 2 projects and pauses after a week idle.** The other
  project in this org is already paused.

## Conventions

- One file per change, named `<UTC timestamp>_<snake_case>.sql`.
- Written to be re-runnable where practical (`create or replace`,
  `add column if not exists`, `drop ... if exists` before `create`).
- Data repairs live alongside the schema change that caused them, so replaying
  a migration on a fresh database produces the same result as the live one.
- Assertions are welcome as migrations. `..._assert_admin_dashboard_stats_grants.sql`
  changes nothing and exists purely to fail loudly if a security-definer
  function's grants ever drift.
