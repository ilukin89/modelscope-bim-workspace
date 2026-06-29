# Tasks: Backend Implementation Design

## Purpose

This task list records the documentation work for a future Supabase backend
implementation design and a safe sequence for later implementation.

The current PR is planning/design-only.

## Non-Negotiable Rules

- Do not modify runtime source code.
- Do not modify React components.
- Do not modify renderer logic.
- Do not modify AI Review behavior.
- Do not modify Drawing Triage behavior.
- Do not change issue lifecycle runtime behavior.
- Do not add backend runtime code.
- Do not add auth UI.
- Do not install packages.
- Do not add a Supabase client.
- Do not add environment variables.
- Do not add migrations.
- Do not add upload, storage, real AI, OCR, BIM parsing, realtime
  collaboration, comments, assignees, notifications, public signup, OAuth,
  magic links, or a full issue management system.
- Do not collapse `ai_findings` and `model_review_issues`.
- Do not let scan completion create issues.
- Do not let the browser generate permanent issue IDs.
- Do not store the frontend `sourceIssue` embedded object as the backend issue
  shape.

## Phase 1: Documentation Setup

- [x] T001 Read `docs/10-backend-auth-issue-persistence.md`.
- [x] T002 Read `specs/011-backend-auth-issue-persistence/spec.md`.
- [x] T003 Read `specs/011-backend-auth-issue-persistence/plan.md`.
- [x] T004 Read `src/types.ts`.
- [x] T005 Inspect `specs/011-backend-auth-issue-persistence/tasks.md` for task structure.
- [x] T006 Create `specs/012-backend-implementation-design/`.
- [x] T007 Create `docs/11-backend-implementation-design.md`.
- [x] T008 Create `specs/012-backend-implementation-design/spec.md`.
- [x] T009 Create `specs/012-backend-implementation-design/plan.md`.
- [x] T010 Create `specs/012-backend-implementation-design/tasks.md`.

## Phase 2: Backend and Auth Decisions

- [x] T011 Document why Supabase is appropriate for this portfolio/demo phase in `docs/11-backend-implementation-design.md`.
- [x] T012 [US1] Evaluate Supabase anonymous sign-in in `specs/012-backend-implementation-design/spec.md`.
- [x] T013 [US1] Evaluate seeded email/password demo user auth in `specs/012-backend-implementation-design/spec.md`.
- [x] T014 [US1] Evaluate `service_role` access and document that it must never be exposed to the browser in `docs/11-backend-implementation-design.md`.
- [x] T015 [US1] Recommend seeded Supabase Auth email/password demo user in `specs/012-backend-implementation-design/plan.md`.
- [x] T016 [US1] Clarify that `demo_users` is an app-level profile linked to `auth.users.id`, not a second credential source, in `docs/11-backend-implementation-design.md`.

## Phase 3: User Story 2 - Define Schema and Row Access (Priority: P1)

**Goal**: Define the minimal Supabase table design and role access rules.

**Independent Test**: A documentation review can identify all required tables,
columns, role access expectations, and membership-based RLS boundaries.

- [x] T017 [US2] Define the `demo_users` table in `docs/11-backend-implementation-design.md`.
- [x] T018 [US2] Define the `projects` and `project_memberships` tables in `docs/11-backend-implementation-design.md`.
- [x] T019 [US2] Define the `ai_scan_runs` and `ai_findings` tables in `docs/11-backend-implementation-design.md`.
- [x] T020 [US2] Define the `ai_finding_decisions` table and append-only decision behavior in `docs/11-backend-implementation-design.md`.
- [x] T021 [US2] Define the `model_review_issues` table, backend UUID, and display `issue_code` in `docs/11-backend-implementation-design.md`.
- [x] T022 [US2] Define `issue_status_history` and `review_history_events` append-only tables in `docs/11-backend-implementation-design.md`.
- [x] T023 [US2] Define `anon`, `authenticated`, and `service_role` SELECT, INSERT, and UPDATE rules for each table in `specs/012-backend-implementation-design/plan.md`.
- [x] T024 [US2] Define project membership RLS helper behavior in `specs/012-backend-implementation-design/plan.md`.

## Phase 4: User Story 3 - Define Seeded Demo Data (Priority: P1)

**Goal**: Keep future backend seed data aligned with the current frontend
fixtures.

**Independent Test**: A documentation review can identify seed order, exact
project IDs, finding mapping, and validation rules.

- [x] T025 [US3] Document the seeded demo user, app profile, projects, and memberships in `docs/11-backend-implementation-design.md`.
- [x] T026 [US3] Document the three required project IDs exactly in `specs/012-backend-implementation-design/spec.md`.
- [x] T027 [US3] Document seeded scan runs and findings derived from `src/data/projects.ts` in `docs/11-backend-implementation-design.md`.
- [x] T028 [US3] Document seed validation against `src/types.ts` and `src/data/projects.ts` in `specs/012-backend-implementation-design/plan.md`.
- [x] T029 [US3] Document nullable `confidence` and reserved `mark_follow_up` behavior in `docs/11-backend-implementation-design.md`.

## Phase 5: User Story 4 - Define Atomic Mutations and Rollback (Priority: P1)

**Goal**: Define mutation boundaries that prevent partial issue creation and
history gaps.

**Independent Test**: A documentation review can trace issue creation from
finding through one transaction and verify rollback behavior.

- [x] T030 [US4] Define direct RLS reads and RPC-owned writes in `docs/11-backend-implementation-design.md`.
- [x] T031 [US4] Define `create_issue_from_finding` transaction steps in `specs/012-backend-implementation-design/plan.md`.
- [x] T032 [US4] Define append-only `record_finding_decision` behavior in `docs/11-backend-implementation-design.md`.
- [x] T033 [US4] Define `update_issue_status` behavior with status history and review history append in `docs/11-backend-implementation-design.md`.
- [x] T034 [US4] Define rollback behavior if any part of issue creation fails in `specs/012-backend-implementation-design/spec.md`.
- [x] T035 [US4] Define idempotency behavior for retrying optimistic or timed-out mutations in `docs/11-backend-implementation-design.md`.

## Phase 6: User Story 5 - Define Frontend Integration Boundary (Priority: P2)

**Goal**: Document what the future frontend integration will load, send,
receive, and roll back without changing runtime code now.

**Independent Test**: A documentation review can verify that integration
boundaries exist and no runtime files changed.

- [x] T036 [US5] Define future frontend loaded data in `docs/11-backend-implementation-design.md`.
- [x] T037 [US5] Define future frontend sent mutation inputs in `docs/11-backend-implementation-design.md`.
- [x] T038 [US5] Define future frontend received backend IDs, issue codes, lineage, and appended history rows in `docs/11-backend-implementation-design.md`.
- [x] T039 [US5] Define optimistic UI failure and rollback behavior in `specs/012-backend-implementation-design/plan.md`.
- [x] T040 [US5] Define explicit out-of-scope items in all 012 documentation files.

## Phase 7: Documentation Validation

- [x] T041 Confirm changed files are limited to `docs/11-backend-implementation-design.md`, `specs/012-backend-implementation-design/spec.md`, `specs/012-backend-implementation-design/plan.md`, and `specs/012-backend-implementation-design/tasks.md`.
- [x] T042 Run `npm run build` from the repository root.
- [x] T043 Confirm `npm run build` passes without requiring package installation, environment variables, migrations, or runtime changes.

## Separate Future PR: Supabase Setup and Migrations

These tasks are not authorized in this documentation PR.

- [ ] T044 Add Supabase dependencies only after the implementation PR is approved.
- [ ] T045 Add environment variables only after the implementation PR is approved.
- [ ] T046 Add Supabase client setup only after the implementation PR is approved.
- [ ] T047 Create migrations for the nine application tables.
- [ ] T048 Create RLS helper functions and policies.
- [ ] T049 Create RPC functions for issue creation, finding decisions, and status updates.
- [ ] T050 Create seed scripts for Auth demo user, profile, projects, memberships, scan runs, and findings.

## Separate Future PR: Seeded Backend Persistence

These tasks are not authorized in this documentation PR.

- [ ] T051 Seed the Supabase Auth demo user and linked `demo_users` profile.
- [ ] T052 Seed `residential-tower-a`, `civic-center-east`, and `transit-hub-02`.
- [ ] T053 Seed project memberships for the demo user.
- [ ] T054 Seed completed scan runs.
- [ ] T055 Seed findings from current frontend fixtures.
- [ ] T056 Validate seeded fixture alignment against `src/types.ts` and `src/data/projects.ts`.

## Separate Future PR: Frontend Backend Integration

These tasks are not authorized in this documentation PR.

- [ ] T057 Authenticate as the seeded demo user through the approved frontend boundary.
- [ ] T058 Load accessible projects through Supabase RLS.
- [ ] T059 Load project review state from backend rows.
- [ ] T060 Replace browser-local permanent issue IDs with backend UUID and `issue_code`.
- [ ] T061 Route issue creation through `create_issue_from_finding`.
- [ ] T062 Route finding decisions through `record_finding_decision`.
- [ ] T063 Route status changes through `update_issue_status`.
- [ ] T064 Implement optimistic rollback and idempotent retry behavior.
- [ ] T065 Regression-test Model Review, Drawing Triage, and renderer behavior.

## Dependencies and Execution Order

- This design phase must complete before Supabase setup.
- Supabase setup and migrations must complete before seeded backend
  persistence.
- Seeded backend persistence must complete before frontend integration depends
  on backend records.
- Frontend integration must preserve the existing Model Review UX and remain
  scoped to the current issue/ticket workflow.

## Suggested MVP

The later backend MVP is:

1. seeded Supabase Auth demo user
2. `demo_users` app profile linked to `auth.users.id`
3. exact seeded project IDs and memberships
4. seeded scan runs and findings
5. RLS membership enforcement
6. atomic issue creation from finding
7. append-only finding decisions, issue status history, and review history
8. backend UUIDs and display issue codes
9. frontend optimistic rollback plan

## Completion Criteria for This Documentation Phase

- Supabase is chosen and justified.
- Auth/session options are evaluated.
- Seeded email/password demo user is recommended.
- `service_role` is documented as server/admin-only and never browser-safe.
- `demo_users` is documented as an app profile linked to Supabase Auth.
- All nine tables are defined.
- Role access and RLS membership enforcement are documented for all tables.
- Seed strategy covers demo user, exact project IDs, memberships, scan runs,
  and seeded findings.
- Backend-generated issue ID and display issue code behavior is documented.
- `create_issue_from_finding` is defined as an atomic operation.
- Finding decisions, issue status history, and review history are append-only.
- Direct RLS reads and RPC-owned writes are separated.
- Optimistic frontend failure behavior is documented.
- Frontend load/send/receive boundaries are documented.
- Product rules from 011 are preserved.
- Explicit out-of-scope items are listed.
- Only approved documentation/specification paths are changed.
- `npm run build` passes.
