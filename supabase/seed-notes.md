# ModelScope Supabase Seed Notes

The app-data seed migration expects one demo Supabase Auth user to exist before
`20260629000005_seed_app_data.sql` runs.

Create the demo Auth user manually with email `demo@modelscope.local` using one
of these trusted admin paths:

- Supabase Dashboard: Authentication -> Users -> Add user
- Supabase CLI/Auth admin workflow for the target environment

Do not commit the demo password, Supabase project URL, anon key, elevated keys,
or any local `.env` file. The seed migration only reads the Auth user's UUID and
then creates `demo_users`, the three demo projects, memberships, seeded scan
runs, and seeded AI findings in application tables.

The seed SQL never inserts directly into `auth.users`.
