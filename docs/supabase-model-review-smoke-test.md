# Model Review Supabase smoke test

This opt-in integration test exercises the authenticated application RPC flow:

```text
begin_model_review_scan
→ complete_model_review_scan
→ clear_model_review_scan_results
```

It is intentionally excluded from `npm test`. The default suite is deterministic
and does not need credentials or write remote data; this smoke test authenticates
to a real, explicitly configured Supabase target and leaves persistent history.

## Safety warning

Use a dedicated smoke-test Supabase project, user, and ModelScope project record.
Do not point this command at the normal shared demo or any production project.
Every successful completion permanently appends one `scan_completed` row to
`review_history_events`. Repeated runs therefore accumulate history events.
The script does not delete history because doing so through an elevated or
destructive test-only path would exceed the application boundary.

The command also updates `model_review_scan_states`. After successful cleanup,
that row remains with `status = 'not_scanned'` and
`pending_scan_token = null`; its actor/timestamps are updated and
`last_completed_at` retains the completion time. If the row did not exist,
`begin_model_review_scan` creates it and cleanup leaves it in that reset state.
Seeded scan runs and findings are read but not changed.

## Required environment variables

Configure every value only in the shell or a local, uncommitted secrets manager:

| Variable                                             | Purpose                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `MODELSCOPE_SUPABASE_SMOKE_URL`                      | URL of the dedicated Supabase smoke-test project.                          |
| `MODELSCOPE_SUPABASE_SMOKE_ANON_KEY`                 | Anon or publishable client key. Secret and service-role keys are rejected. |
| `MODELSCOPE_SUPABASE_SMOKE_EMAIL`                    | Email of the dedicated authenticated smoke-test user.                      |
| `MODELSCOPE_SUPABASE_SMOKE_PASSWORD`                 | Password of that user.                                                     |
| `MODELSCOPE_SUPABASE_SMOKE_PROJECT_ID`               | Explicit ModelScope project ID reserved for this test.                     |
| `MODELSCOPE_SUPABASE_SMOKE_CONFIRM_DEDICATED_TARGET` | Must equal `I_UNDERSTAND_THIS_WRITES_HISTORY`.                             |

The script never prints the key, password, session, user ID, or generated scan
token.

## Database prerequisites

The dedicated target must already contain the existing ModelScope schema and
RPCs. No migration is applied by this command. It must also contain:

1. An Auth user matching the configured email/password.
2. A matching `demo_users` profile.
3. Membership for that profile in the explicitly configured project.
4. A `model_review_scan_states` row, or permission for the begin RPC to create
   one.
5. At least one `ai_scan_runs` row for that project with `status = 'completed'`
   and `source` equal to `seed` or `mock`.
6. At least one `ai_findings` row belonging to that completed scan run.
7. RLS visibility and authenticated execute access matching the application.

The repository seed migration provides completed seeded runs with findings for
`residential-tower-a`, `civic-center-east`, and `transit-hub-02`, but a shared
seeded demo target is not automatically safe. Reserve a separate target/user
for repeated smoke runs.

## Run

After explicitly checking the target and exporting all variables:

```sh
npm run test:supabase-smoke
```

The script fails before creating a client if configuration is missing, the
confirmation value is absent, or an elevated key is detected. It authenticates
with the same email/password and anon-key boundary used by the frontend,
preflights the completed run and finding, verifies each RPC response, and always
attempts the clear RPC in `finally` after begin succeeds.

This is not an isolated or rollback test: after a fully successful run, exactly
one new review-history event remains, along with the updated/reset scan-state
row described above.
