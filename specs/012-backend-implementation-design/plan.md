# Plan: Backend Implementation Design

## Purpose

This plan defines the documentation-only implementation design for a future
Supabase backend slice that persists the existing Model Review issue workflow.

No runtime behavior is implemented in this phase.

## Documents and Source Reviewed

- `docs/10-backend-auth-issue-persistence.md`
- `specs/011-backend-auth-issue-persistence/spec.md`
- `specs/011-backend-auth-issue-persistence/plan.md`
- `specs/011-backend-auth-issue-persistence/tasks.md`
- `.specify/memory/constitution.md`
- `src/types.ts`
- `src/data/projects.ts`

## Summary

Use Supabase for the first backend implementation phase:

```text
Supabase Auth seeded demo user
  -> demo_users profile
  -> project_memberships RLS
  -> projects
  -> ai_scan_runs
  -> ai_findings
  -> ai_finding_decisions
  -> model_review_issues
  -> issue_status_history
  -> review_history_events
```

The design is intentionally narrow. It documents Supabase Auth, app profile
identity, table shapes, role permissions, RLS, seed data, RPC functions,
transaction behavior, optimistic failure behavior, and frontend integration
boundaries.

It does not install packages, add a Supabase client, add environment variables,
add migrations, add auth UI, add runtime backend code, change React components,
change renderer logic, change AI Review behavior, change Drawing Triage
behavior, or change issue lifecycle runtime behavior.

## Technical Context

| Area | Decision |
| --- | --- |
| Backend platform | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth seeded email/password demo user |
| Browser database access | Supabase client in a later PR, constrained by RLS |
| Elevated access | `service_role` for migrations/seeds/admin only; never browser |
| Multi-table writes | Supabase RPC/Postgres functions |
| Runtime code in this phase | None |
| Project IDs | Existing fixture IDs exactly |
| Permanent issue identity | Backend UUID plus backend-generated display `issue_code` |

## Constitution Check

- **Spec-driven development**: Pass. This is a documentation/design phase before
  any backend implementation.
- **Viewport as source of truth**: Pass. Source lineage remains tied to model
  context through findings, issues, and scan runs; no viewport behavior changes.
- **Prototype honesty**: Pass. The design documents future Supabase behavior but
  does not add backend services, auth UI, storage, upload, parsing, real AI, or
  runtime persistence.
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
| `current_status` | `text` | Optional cache: `active`, `issue-created`, `dismissed`, `follow-up`. |
| `created_at` | `timestamptz` | Required. |

`source_payload` should store only the minimal structured source context needed
to reconstruct `View in model` and the issue detail UI. It may include selected
fields from `ReviewIssue.details` / `ObjectDetails`, such as object ID, GUID,
category, level, elevation, material, fire rating, and lightweight geometry or
reference metadata when available. It must not store the full `ReviewIssue`
object, UI state, selected tab, preview state, rendered marker state, or other
frontend-only data. The exact payload schema should be finalized in the
migration/API implementation PR.

### `ai_finding_decisions`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `project_id` | `text` | References `projects.id`. |
| `finding_id` | `uuid` | References `ai_findings.id`. |
| `scan_run_id` | `uuid` | References `ai_scan_runs.id`. |
| `user_id` | `uuid` | References `demo_users.id`. |
| `decision_type` | `text` | `create_issue`, `dismiss`, `mark_follow_up`, `restore`, `remove_issue_link`. |
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

Allowed through Supabase client in a later integration PR:

- current `demo_users` profile
- accessible `projects`
- project `ai_scan_runs`
- project `ai_findings`
- project `ai_finding_decisions`
- project `model_review_issues`
- project `issue_status_history`
- project `review_history_events`

### RPC Writes

Required:

- `create_issue_from_finding(finding_id, idempotency_key, optional_display_overrides)`
- `record_finding_decision(finding_id, decision_type, idempotency_key, optional_note)`
- `update_issue_status(issue_id, to_status, idempotency_key, optional_reason)`

Reserved or future:

- `remove_issue_from_tracker(...)` if the existing lifecycle keeps that action
  in a backend-backed workflow.
- `mark_follow_up` writes until a visible frontend action exists.

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

Future frontend loads:

- demo profile
- accessible projects
- scan runs
- findings
- decisions
- issues
- issue status history
- review history
- source lineage records

Future frontend sends:

- project/finding/issue IDs
- enabled decision types
- status transitions
- idempotency keys

Future frontend receives:

- permanent backend IDs
- display issue codes
- durable source lineage IDs
- appended decision/history rows
- updated current status fields

No runtime code is changed in this design phase.

## Explicitly Out Of Scope

- install packages
- add Supabase client
- add environment variables
- add migrations
- add auth UI
- add runtime backend code
- change React components
- change renderer logic
- change AI Review behavior
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

This documentation phase is complete when:

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
- No runtime, package, env, or migration files are changed.
- `npm run build` passes.
