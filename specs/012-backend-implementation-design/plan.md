# Plan: Backend Implementation Design

## Purpose

This plan began as the documentation-only implementation design for a future
Supabase backend slice that persists the existing Model Review issue workflow.
It now also records the implemented status of later, narrowly scoped backend
integration slices where the repository provides direct evidence.

The current `fix/model-review-scan-state-persistence` branch persists stable
Model Review scan-result visibility. Broader backend, auth, seeding, and
frontend-integration tasks remain future work unless separately evidenced.

## Documents and Source Reviewed

- `docs/10-backend-auth-issue-persistence.md`
- `specs/011-backend-auth-issue-persistence/spec.md`
- `specs/011-backend-auth-issue-persistence/plan.md`
- `specs/011-backend-auth-issue-persistence/tasks.md`
- `.specify/memory/constitution.md`
- `src/types.ts`
- `src/data/projects.ts`
- `supabase/migrations/20260705000003_model_review_scan_state.sql`
- `src/data/modelReviewPersistence.ts`
- `src/data/modelReviewPersistence.test.ts`
- `src/hooks/useAiReviewState.ts`
- `src/hooks/useAiReviewStateUtils.ts`
- `src/hooks/useAiReviewStateUtils.test.ts`

## Summary

Use Supabase for the first backend implementation phase:

```text
Supabase Auth seeded demo user
  -> demo_users profile
  -> project_memberships RLS
  -> projects
  -> ai_scan_runs
  -> ai_findings
  -> model_review_scan_states
  -> ai_finding_decisions
  -> model_review_issues
  -> issue_status_history
  -> review_history_events
```

The original design is intentionally narrow. It documents Supabase Auth, app
profile identity, table shapes, role permissions, RLS, seed data, RPC
functions, transaction behavior, optimistic failure behavior, and frontend
integration boundaries.

Subsequent implementation work has added approved Supabase and frontend
persistence slices. This branch adds only Model Review scan-state persistence;
it does not add auth UI, change renderer logic, change Drawing Triage behavior,
or expand the issue lifecycle.

## Technical Context

| Area | Decision |
| --- | --- |
| Backend platform | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth seeded email/password demo user |
| Browser database access | Supabase client constrained by RLS; the scan-state read boundary is implemented. |
| Elevated access | `service_role` for migrations/seeds/admin only; never browser |
| Multi-table writes | Supabase RPC/Postgres functions |
| Runtime status | Incremental Supabase persistence is present; this branch adds stable Model Review scan-state persistence. |
| Project IDs | Existing fixture IDs exactly |
| Permanent issue identity | Backend UUID plus backend-generated display `issue_code` |

## Constitution Check

- **Spec-driven development**: Pass. The backend design preceded implementation,
  and the current branch stays within its documented persistence boundaries.
- **Viewport as source of truth**: Pass. Source lineage remains tied to model
  context through findings, issues, and scan runs; no viewport behavior changes.
- **Prototype honesty**: Pass. The current branch adds explicit Supabase-backed
  scan visibility but does not claim upload, parsing, real AI, or broader
  collaboration capabilities.
- **Separation of concerns**: Pass. Auth, RLS, schema, RPC, seed data, frontend
  integration, and product scope boundaries are separated.
- **Controlled AI assistance**: Pass. AI findings remain provisional review
  inputs, and explicit user decisions are required before issue creation.

This design does not introduce capabilities beyond the documented scope. No
constitution exception is required.

## Planning Decisions

### 1. Choose Supabase

Supabase gives ModelScope a credible backend without overbuilding:

- Postgres supports relational lineage and append-only history.
- RLS supports project membership access.
- Supabase Auth gives real browser sessions without custom credential logic.
- RPC functions support atomic multi-table writes.
- Seed scripts can create deterministic demo data for the portfolio workflow.

This choice is for the seeded demo backend slice only. It does not add public
signup, upload, storage, realtime collaboration, real AI, OCR, BIM parsing, or
full issue management.

### 2. Use Seeded Email/Password Demo Auth

Evaluated options:

| Option | Decision |
| --- | --- |
| Anonymous sign-in | Not recommended first because project memberships and review history need a deterministic demo actor across sessions and devices. |
| Seeded email/password demo user | Recommended because it creates a stable Supabase Auth user for memberships and attribution without public signup. |
| `service_role` access | Admin/seed only. It must never be exposed to browser code. |

Supabase Auth is the identity source of truth. `demo_users` is an app profile
linked to `auth.users.id`; it must not store an independent password or become
a parallel credential system.

### 3. Enforce Project Membership With RLS

Every project-scoped table must include `project_id`. RLS policies should use a
membership helper equivalent to:

```text
app_is_project_member(row.project_id)
```

The helper resolves the current `demo_users` profile from `auth.uid()` and
checks `project_memberships`.

This enforces access for reads and approved writes even if a browser sends a
different project ID than the visible frontend state.

### 4. Keep Findings and Issues Separate

`ai_findings` are provisional AI review inputs. They do not become issues when
a scan completes.

`model_review_issues` rows exist only after explicit user action through
`create_issue_from_finding`.

The backend stores durable lineage:

```text
ai_scan_runs.id
  -> ai_findings.scan_run_id
  -> ai_finding_decisions.finding_id
  -> model_review_issues.source_finding_id
  -> issue_status_history.issue_id
  -> review_history_events.issue_id
```

The backend must store `source_finding_id` and `source_scan_run_id`. It must
not persist the frontend `sourceIssue: ReviewIssue` embedded object as the
canonical backend issue shape.

### 5. Generate Permanent Issue IDs in the Backend

Use two identifiers:

- `model_review_issues.id`: opaque UUID primary key, generated by Postgres.
- `model_review_issues.issue_code`: user-facing display code, generated by the
  backend.

Recommended display format:

```text
MRI-{PROJECT_PREFIX}-{NNNN}
```

Project prefixes:

- `RES` for `residential-tower-a`
- `CIV` for `civic-center-east`
- `TH` for `transit-hub-02`

The sequence should be database-owned and project-scoped. Browser-local IDs
such as `MR-001` may exist only as temporary optimistic UI placeholders.

### 6. Use RPC for Cross-Table Mutations

Direct browser table SELECTs can use Supabase client queries with RLS for
project-scoped reads.

Writes that append history or update multiple tables must use RPC:

- `create_issue_from_finding`
- `record_finding_decision`
- `update_issue_status`
- `remove_issue_from_tracker`, if retained by a later frontend integration

Direct browser INSERT/UPDATE on those tables would risk missing decision,
status history, or review history rows.

### 7. Persist Stable Scan-Result Visibility Separately

The transient frontend `scanning` state is not durable. Stable Model Review
result visibility is stored per project in `model_review_scan_states` as either
`not_scanned` or `scanned_with_findings`.

The implemented boundary is:

1. `begin_model_review_scan(project_id, scan_token)` records a pending token and
   resets stable visibility to `not_scanned`.
2. `complete_model_review_scan(project_id, scan_token)` accepts only the current
   pending token, exposes the seeded findings, and appends the persisted
   `AI scan completed` review-history event in the same transaction.
3. `clear_model_review_scan_results(project_id)` hides stable result visibility
   and cancels any pending token without deleting findings, decisions, created
   issues, or review history.

The frontend also tracks the active project, scan token, and operation nonce so
late completion or clear responses from stale, cancelled, or superseded scan
attempts cannot overwrite the selected project's current state.

## Table Definitions

### `demo_users`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `auth_user_id` | `uuid` | Unique link to `auth.users.id`. |
| `email` | `text` | Demo attribution only. |
| `display_name` | `text` | Review history display. |
| `created_at` | `timestamptz` | Required. |
| `updated_at` | `timestamptz` | Required. |

### `projects`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `text` | Stable fixture ID primary key. |
| `name` | `text` | Required. |
| `model_label` | `text` | Required. |
| `owner_user_id` | `uuid` | References `demo_users.id`. |
| `created_at` | `timestamptz` | Required. |
| `updated_at` | `timestamptz` | Required. |

### `project_memberships`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `user_id` | `uuid` | References `demo_users.id`. |
| `role` | `text` | `owner` or `member`. |
| `created_at` | `timestamptz` | Required. |

Unique: `(project_id, user_id)`.

### `ai_scan_runs`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `created_by_user_id` | `uuid` | References `demo_users.id`. |
| `status` | `text` | `queued`, `running`, `completed`, `failed`, `cancelled`. |
| `source` | `text` | `seed`, `demo`, or `mock`. |
| `started_at` | `timestamptz` | Nullable. |
| `completed_at` | `timestamptz` | Nullable. |
| `finding_count` | `integer` | Non-negative. |
| `created_at` | `timestamptz` | Required. |

### `ai_findings`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `scan_run_id` | `uuid` | References `ai_scan_runs.id`. |
| `fixture_finding_id` | `text` | Seed alignment reference. |
| `code` | `text` | Required. |
| `title` | `text` | Required. |
| `finding_type` | `text` | `coordination`, `clearance`, `fire-safety`, `annotation`. |
| `suggested_priority` | `text` | `critical`, `warning`, `info`. |
| `confidence` | `numeric` | Nullable until frontend support exists. |
| `object_id` | `text` | Nullable. |
| `object_label` | `text` | Nullable. |
| `discipline` | `text` | `architecture`, `structure`, `mechanical`, `electrical`. |
| `level` | `text` | Nullable. |
| `location` | `text` | Nullable. |
| `source_payload` | `jsonb` | Source context for reconstruction. |
| `current_status` | `text` | Optional cache: `active`, `issue-created`, `dismissed`. |
| `created_at` | `timestamptz` | Required. |

`source_payload` should store only the minimal structured source context needed
to reconstruct `View in model` and the issue detail UI. It may include selected
fields from `ReviewIssue.details` / `ObjectDetails`, such as object ID, GUID,
category, level, elevation, material, fire rating, and lightweight geometry or
reference metadata when available. It must not store the full `ReviewIssue`
object, UI state, selected tab, preview state, rendered marker state, or other
frontend-only data. The exact payload schema should be finalized in the
migration/API implementation PR.

### `model_review_scan_states`

| Column | Type | Rule |
| --- | --- | --- |
| `project_id` | `text` | Primary key referencing `projects.id`. |
| `status` | `text` | Stable visibility: `not_scanned` or `scanned_with_findings`. |
| `pending_scan_token` | `uuid` | Nullable token for the currently accepted scan attempt. |
| `updated_by_user_id` | `uuid` | Nullable reference to `demo_users.id`. |
| `last_completed_at` | `timestamptz` | Nullable timestamp of the last accepted completion. |
| `created_at` | `timestamptz` | Required. |
| `updated_at` | `timestamptz` | Required. |

Authenticated project members may read the row through RLS. Direct
authenticated writes are disabled; the three scan RPCs own mutations.

### `ai_finding_decisions`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `finding_id` | `uuid` | References `ai_findings.id`. |
| `scan_run_id` | `uuid` | References `ai_scan_runs.id`. |
| `user_id` | `uuid` | References `demo_users.id`. |
| `decision_type` | `text` | `create_issue`, `dismiss`, `restore`, `remove_issue_link`. |
| `created_issue_id` | `uuid` | Nullable reference to `model_review_issues.id`. |
| `decision_note` | `text` | Nullable. |
| `idempotency_key` | `uuid` | Nullable retry key. |
| `created_at` | `timestamptz` | Required. |

Append-only. Do not overwrite previous decisions.

### `model_review_issues`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Permanent primary key. |
| `issue_code` | `text` | Backend-generated display code. |
| `project_id` | `text` | References `projects.id`. |
| `created_by_user_id` | `uuid` | References `demo_users.id`. |
| `source_finding_id` | `uuid` | References `ai_findings.id`. |
| `source_scan_run_id` | `uuid` | References `ai_scan_runs.id`. |
| `source_finding_code` | `text` | Display snapshot. |
| `title` | `text` | Required. |
| `related_object` | `text` | Nullable. |
| `related_level` | `text` | Nullable. |
| `priority` | `text` | `critical`, `warning`, `info`. |
| `status` | `text` | Current issue status. |
| `created_at` | `timestamptz` | Required. |
| `updated_at` | `timestamptz` | Required. |

Allowed statuses: `Open`, `In Review`, `Resolved`, `Blocked`, and
`Closed as not actionable`.

### `issue_status_history`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `issue_id` | `uuid` | References `model_review_issues.id`. |
| `from_status` | `text` | Nullable for initial row. |
| `to_status` | `text` | Required status. |
| `changed_by_user_id` | `uuid` | References `demo_users.id`. |
| `change_reason` | `text` | Nullable. |
| `changed_at` | `timestamptz` | Required. |

Append-only.

### `review_history_events`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `event_type` | `text` | Durable workflow event type. |
| `actor_user_id` | `uuid` | Nullable for seed/system events only. |
| `scan_run_id` | `uuid` | Nullable reference. |
| `finding_id` | `uuid` | Nullable reference. |
| `issue_id` | `uuid` | Nullable reference. |
| `decision_id` | `uuid` | Nullable reference. |
| `status_history_id` | `uuid` | Nullable reference. |
| `label` | `text` | Existing review history style label. |
| `detail` | `text` | Existing review history style detail. |
| `created_at` | `timestamptz` | Required. |

Append-only.

## Role and RLS Matrix

| Table | `anon` | `authenticated` | `service_role` |
| --- | --- | --- | --- |
| `demo_users` | No table SELECT, INSERT, or UPDATE. | SELECT own profile only. No direct INSERT or UPDATE. | SELECT, INSERT, UPDATE for seed/admin only. |
| `projects` | No table SELECT, INSERT, or UPDATE. | SELECT only where membership exists. No direct INSERT or UPDATE. | SELECT, INSERT, UPDATE for seed/admin only. |
| `project_memberships` | No table SELECT, INSERT, or UPDATE. | SELECT own membership rows only. No direct INSERT or UPDATE. | SELECT, INSERT, UPDATE for seed/admin only. |
| `ai_scan_runs` | No table SELECT, INSERT, or UPDATE. | SELECT only for member projects. No direct INSERT or UPDATE in this slice. | SELECT, INSERT, UPDATE for seed/admin only. |
| `ai_findings` | No table SELECT, INSERT, or UPDATE. | SELECT only for member projects. No direct INSERT or UPDATE. | SELECT, INSERT, UPDATE for seed/admin only. |
| `model_review_scan_states` | No table SELECT, INSERT, UPDATE, or DELETE. | SELECT only for member projects. No direct writes. | SELECT, INSERT, UPDATE, and DELETE for seed/admin only. |
| `ai_finding_decisions` | No table SELECT, INSERT, or UPDATE. | SELECT for member projects. INSERT only through RPC. No direct UPDATE. | SELECT, INSERT, UPDATE for seed/admin correction only. |
| `model_review_issues` | No table SELECT, INSERT, or UPDATE. | SELECT for member projects. INSERT and UPDATE only through RPC. | SELECT, INSERT, UPDATE for seed/admin correction only. |
| `issue_status_history` | No table SELECT, INSERT, or UPDATE. | SELECT for member projects. INSERT only through RPC. No direct UPDATE. | SELECT, INSERT, UPDATE for seed/admin correction only. |
| `review_history_events` | No table SELECT, INSERT, or UPDATE. | SELECT for member projects. INSERT only through RPC. No direct UPDATE. | SELECT, INSERT, UPDATE for seed/admin correction only. |

Policy shape:

- Profile rows use `demo_users.auth_user_id = auth.uid()`.
- Project-scoped rows use membership against `project_memberships`.
- Insert/update policies for RPC-owned writes must still validate the actor and
  project membership inside the function.
- Service-role access is not a browser policy. It is reserved for trusted
  migration, seed, and admin contexts.

## Seed Data Plan

Create seed data in this order:

1. Supabase Auth user for the demo credential.
2. `demo_users` profile linked to the Auth user.
3. `projects` rows for:
   - `residential-tower-a`
   - `civic-center-east`
   - `transit-hub-02`
4. `project_memberships` rows linking the demo user to all three projects.
5. One completed `ai_scan_runs` row per project.
6. `ai_findings` rows derived from `src/data/projects.ts`.
7. Seeded `review_history_events` for scan completion if needed for the
   existing review history surface.

Seed validation rules:

- Fail if the three backend project IDs do not match `ProjectId` in
  `src/types.ts`.
- Fail if `src/data/projects.ts` does not export those same three IDs.
- Preserve frontend finding IDs in `ai_findings.fixture_finding_id`.
- Keep `confidence` null unless a future frontend spec adds confidence support.
- Do not add public users, teams, invites, comments, assignees, notifications,
  uploads, storage buckets, real AI outputs, OCR records, or BIM parsing data.

## API and RPC Boundary

### Direct RLS Reads

Allowed through the RLS-constrained Supabase client. The scan-state read is
implemented; broader list items remain governed by their own task status:

- current `demo_users` profile
- accessible `projects`
- project `ai_scan_runs`
- project `ai_findings`
- project `model_review_scan_states`
- project `ai_finding_decisions`
- project `model_review_issues`
- project `issue_status_history`
- project `review_history_events`

### RPC Writes

Required:

- `create_issue_from_finding(finding_id, idempotency_key, optional_display_overrides)`
- `record_finding_decision(finding_id, decision_type, idempotency_key, optional_note)`
- `update_issue_status(issue_id, to_status, idempotency_key, optional_reason)`

Implemented scan-state RPCs:

- `begin_model_review_scan(project_id, scan_token)`
- `complete_model_review_scan(project_id, scan_token)`
- `clear_model_review_scan_results(project_id)`

Reserved or future:

- `remove_issue_from_tracker(...)` if the existing lifecycle keeps that action
  in a backend-backed workflow.
- Additional decision writes until a visible frontend action exists.

## Transaction Behavior

### Create Issue From Finding

Single transaction:

1. Resolve current demo user from `auth.uid()`.
2. Lock the finding row.
3. Verify project membership.
4. Verify source scan run and project lineage.
5. Check idempotency and duplicate active issue constraints.
6. Generate UUID issue ID and project-scoped `issue_code`.
7. Insert `model_review_issues`.
8. Insert `ai_finding_decisions`.
9. Insert initial `issue_status_history`.
10. Insert `review_history_events`.
11. Update `ai_findings.current_status` if that cache exists.
12. Return all committed records needed to reconcile frontend state.

Failure rule: if any step fails, the whole transaction rolls back. No partial
issue creation is considered successful.

### Finding Decisions

`record_finding_decision` appends a decision and review history event. It may
update the optional `ai_findings.current_status` cache, but decision rows remain
the historical source of truth.

### Issue Status Changes

`update_issue_status` updates the current issue status and appends both
`issue_status_history` and `review_history_events`. Direct browser UPDATE is
not allowed because it would bypass history.

### Model Review Scan State

`begin_model_review_scan` verifies authentication and project membership, then
upserts the project's pending scan token. `complete_model_review_scan` locks the
scan-state row and rejects a missing, stale, cancelled, or replaced token before
changing stable visibility. A successful completion selects the latest eligible
completed seeded or mock scan with findings, updates the scan-state row, and
inserts the `scan_completed` review-history event atomically.

`clear_model_review_scan_results` sets stable visibility to `not_scanned` and
clears the pending token. It does not append a history event or reset persisted
finding decisions and created issues.

## Optimistic UI Failure Plan

Future frontend integration should:

- create only temporary optimistic IDs before commit
- send an idempotency key for retryable mutations
- replace temporary records with backend records on success
- remove temporary records on failure
- restore finding and issue state from the last confirmed backend snapshot
- re-fetch project review state when local optimistic state is uncertain

The backend returns committed rows only. The frontend must not treat a pending
optimistic issue as durable until the RPC succeeds or a reload confirms the
commit.

## Frontend Integration Boundary

Implemented for scan-state persistence on the current branch:

- `fetchPersistedModelReviewState` loads `model_review_scan_states.status` with
  findings, issues, and review history, defaulting a missing row to
  `not_scanned`.
- `restorePersistedModelReviewState` treats the persisted stable status as the
  source of truth for scan-result visibility while preserving a matching local
  in-flight scan.
- scan begin, completion, and clear operations use the scan-state RPC boundary.
- project changes, clear actions, operation nonces, and scan tokens invalidate
  stale local attempts and ignore late backend responses.
- successful completion merges the persisted `AI scan completed` event returned
  by the backend into local review history.

Remaining future frontend integration includes the following planned
boundaries.

### Remaining Future Loads

- demo profile
- accessible projects
- scan runs
- findings
- decisions
- issues
- issue status history
- review history
- source lineage records

### Remaining Future Sends

- project/finding/issue IDs
- enabled decision types
- status transitions
- idempotency keys

### Remaining Future Receives

- permanent backend IDs
- display issue codes
- durable source lineage IDs
- appended decision/history rows
- updated current status fields

## Explicitly Out Of Scope for the Current Scan-State Branch

- add auth UI
- change renderer logic
- change Drawing Triage behavior
- change issue lifecycle runtime behavior
- add upload
- add storage
- add real AI
- add OCR
- add BIM parsing
- add realtime collaboration
- add comments
- add assignees
- add notifications
- add public signup
- add OAuth
- add magic links
- add full issue management

## Validation

The current scan-state persistence implementation is covered by tests that
verify:

- explicit persisted scan visibility and the missing-row `not_scanned`
  fallback;
- begin, complete, and clear RPC request/response parsing;
- the required completion history event and malformed-response rejection;
- migration table shape, RLS/write boundaries, pending-token locking, and
  atomic scan-history append;
- hiding scan results without resetting persisted finding decisions or issues;
- persisted scan visibility as the restore source of truth.

Validation completed on the current branch:

- targeted persistence and utility tests: 82 passed;
- full test suite: 85 passed;
- `npm run build`: passed;
- `npm run lint`: passed;
- `git diff --check`: passed.

The original documentation phase was complete when:

- `docs/11-backend-implementation-design.md` exists.
- `specs/012-backend-implementation-design/spec.md` exists.
- `specs/012-backend-implementation-design/plan.md` exists.
- `specs/012-backend-implementation-design/tasks.md` exists.
- Supabase is chosen and justified.
- Auth/session options are evaluated and one seeded demo approach is
  recommended.
- `service_role` is documented as server/admin-only.
- Schema, RLS, seed strategy, RPC boundaries, transaction behavior, optimistic
  failure behavior, and frontend integration boundaries are documented.
- Product rules from 011 remain intact.
- `npm run build` passes.
