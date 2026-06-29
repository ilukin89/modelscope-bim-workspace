# Tasks: Backend Auth and Issue Persistence

## Purpose

This task list records the documentation work for a future backend/auth/issue
persistence slice and a safe sequence for later implementation phases.

The current PR is planning-only.

## Non-Negotiable Rules

- Do not modify runtime source code.
- Do not modify React components.
- Do not modify renderer logic.
- Do not modify AI Review logic.
- Do not modify Drawing Triage logic.
- Do not add real backend code.
- Do not add real auth UI.
- Do not install packages.
- Do not add a Supabase client.
- Do not add environment variables.
- Do not add database migrations.
- Do not add upload, storage, real AI, OCR, BIM parsing, realtime
  collaboration, enterprise permissions, or a full issue management system.

## Phase 1: Documentation Setup

- [x] T001 Read the current plan context and nearby Spec Kit feature documents.
- [x] T002 Inspect existing Model Review issue and finding vocabulary in `README.md` and `src/types.ts`.
- [x] T003 Confirm `docs/09-workspace-mode-navigation.md` and `specs/010-workspace-mode-navigation-strategy/` already occupy the suggested numbering.
- [x] T004 Create `docs/10-backend-auth-issue-persistence.md` rather than overwriting the existing `docs/09-workspace-mode-navigation.md`.
- [x] T005 Create `specs/011-backend-auth-issue-persistence/` rather than overwriting the existing `specs/010-workspace-mode-navigation-strategy/`.

## Phase 2: Foundational Persistence Boundaries

- [x] T006 Define why persistence is needed for the existing Model Review issue/ticket UX in `docs/10-backend-auth-issue-persistence.md`.
- [x] T007 Separate current frontend behavior from future backend behavior in `docs/10-backend-auth-issue-persistence.md`.
- [x] T008 Define the minimal future persistence slice in `specs/011-backend-auth-issue-persistence/spec.md`.
- [x] T009 Document that AI findings are not issues in `docs/10-backend-auth-issue-persistence.md`, `specs/011-backend-auth-issue-persistence/spec.md`, and `specs/011-backend-auth-issue-persistence/plan.md`.
- [x] T010 Document that issues exist only after explicit user action in `docs/10-backend-auth-issue-persistence.md`, `specs/011-backend-auth-issue-persistence/spec.md`, and `specs/011-backend-auth-issue-persistence/plan.md`.

## Phase 3: User Story 1 - Establish Demo Project Access (Priority: P1)

**Goal**: Define the smallest authenticated demo context needed to attribute
future issue workflow records.

**Independent Test**: A documentation review can identify demo user, project,
ownership, and membership records without finding public signup, invites, or
enterprise permissions.

- [x] T011 [US1] Define the seeded demo user and demo project approach in `docs/10-backend-auth-issue-persistence.md`.
- [x] T012 [US1] Define project ownership and membership boundaries in `docs/10-backend-auth-issue-persistence.md`.
- [x] T013 [US1] Define demo access requirements and acceptance scenarios in `specs/011-backend-auth-issue-persistence/spec.md`.
- [x] T014 [US1] Define minimal `demo_users`, `projects`, and `project_memberships` entity notes in `specs/011-backend-auth-issue-persistence/plan.md`.

## Phase 4: User Story 2 - Persist Scan Findings and Decisions (Priority: P1)

**Goal**: Persist AI scan runs, AI findings, and user decisions while preserving
the provisional nature of AI output.

**Independent Test**: A documentation review can trace scan runs to findings to
decisions and confirm that scan completion alone never creates issues.

- [x] T015 [US2] Define AI scan run persistence in `docs/10-backend-auth-issue-persistence.md`.
- [x] T016 [US2] Define AI finding fields and finding statuses in `docs/10-backend-auth-issue-persistence.md`.
- [x] T017 [US2] Define decision records and allowed decision types in `docs/10-backend-auth-issue-persistence.md`.
- [x] T018 [US2] Define `ai_scan_runs`, `ai_findings`, and `ai_finding_decisions` entity notes in `specs/011-backend-auth-issue-persistence/plan.md`.
- [x] T019 [US2] Define decision persistence requirements in `specs/011-backend-auth-issue-persistence/spec.md`.

## Phase 5: User Story 3 - Persist Created Issues and Lineage (Priority: P1)

**Goal**: Persist created issues, issue status history, review history, and
lineage back to the source AI finding.

**Independent Test**: A documentation review can verify that issue creation is
atomic and stores source finding ID, source scan run ID, user decision, initial
status history, and review history together.

- [x] T020 [US3] Define created issue fields and lightweight status values in `docs/10-backend-auth-issue-persistence.md`.
- [x] T021 [US3] Define issue status history in `docs/10-backend-auth-issue-persistence.md`.
- [x] T022 [US3] Define review history event persistence in `docs/10-backend-auth-issue-persistence.md`.
- [x] T023 [US3] Define source lineage from AI finding to user decision to created issue in `docs/10-backend-auth-issue-persistence.md`.
- [x] T024 [US3] Define atomic issue creation rules in `specs/011-backend-auth-issue-persistence/plan.md`.
- [x] T025 [US3] Define `model_review_issues`, `issue_status_history`, and `review_history_events` entity notes in `specs/011-backend-auth-issue-persistence/plan.md`.

## Phase 6: User Story 4 - Preserve Frontend Scope Boundaries (Priority: P2)

**Goal**: Make it clear what remains frontend-only and what is explicitly out
of scope.

**Independent Test**: A documentation review can verify that no runtime files
are changed and no future backend implementation work is accidentally included.

- [x] T026 [US4] Define frontend-only state in `docs/10-backend-auth-issue-persistence.md` and `specs/011-backend-auth-issue-persistence/plan.md`.
- [x] T027 [US4] Define explicit out-of-scope items in `docs/10-backend-auth-issue-persistence.md`, `specs/011-backend-auth-issue-persistence/spec.md`, and `specs/011-backend-auth-issue-persistence/plan.md`.
- [x] T028 [US4] Define no-runtime-change acceptance requirements in `specs/011-backend-auth-issue-persistence/spec.md`.

## Phase 7: Documentation Validation

- [x] T029 Run `git status --short` and confirm only documentation/specification files were added.
- [x] T030 Run `npm run build` from the repository root.
- [x] T031 Confirm `npm run build` passes without requiring package installation, environment variables, or runtime changes.

## Separate Future PR: Backend Design, No Frontend Runtime Integration

These tasks are not authorized in this documentation PR.

- [ ] T032 Choose the backend platform and auth/session model in a future backend design spec.
- [ ] T033 Define database schema or migration plan for demo users, projects, memberships, scan runs, findings, decisions, issues, status history, and review history.
- [ ] T034 Define API contracts for demo session, project review state, finding decisions, issue creation, issue status updates, and lineage reads.
- [ ] T035 Define transaction behavior for creating an issue from a finding.
- [ ] T036 Define access checks for project membership.
- [ ] T037 Define seed data strategy for demo user, demo projects, memberships, scan runs, and findings.

## Separate Future PR: Seeded Backend Persistence

These tasks are not authorized in this documentation PR.

- [ ] T038 Add backend project structure only after a backend implementation spec approves it.
- [ ] T039 Add backend dependencies only after package additions are explicitly approved.
- [ ] T040 Add environment configuration only after environment variables are explicitly approved.
- [ ] T041 Seed demo user and project data.
- [ ] T042 Persist AI scan runs and findings.
- [ ] T043 Persist finding decisions.
- [ ] T044 Persist created issues with backend-generated IDs and source lineage.
- [ ] T045 Persist issue status history and review history events.

## Separate Future PR: Frontend Backend Integration

These tasks are not authorized in this documentation PR.

- [ ] T046 Add a backend client only after the backend API contract exists.
- [ ] T047 Load persisted project review state into the existing Model Review UX.
- [ ] T048 Replace browser-local permanent issue IDs with backend-generated IDs.
- [ ] T049 Handle optimistic issue creation and rollback on backend failure.
- [ ] T050 Preserve existing AI Review Queue, issue tab, viewport, review history, and source finding interactions.
- [ ] T051 Regression-test Model Review, Drawing Triage, and renderer behavior.

## Dependencies and Execution Order

- This documentation phase must complete before backend implementation.
- Backend design must complete before dependencies, environment variables, or
  migrations are added.
- Seeded backend persistence must complete before frontend integration depends
  on durable records.
- Frontend integration must preserve the existing Model Review UX and remain
  scoped to the current issue/ticket workflow.

## Suggested MVP

The later backend MVP is:

1. seeded demo user
2. seeded projects and memberships
3. persisted AI scan runs and findings
4. persisted finding decisions
5. atomic issue creation from finding
6. persisted issue status history and review history
7. source lineage from issue back to finding and scan run

## Completion Criteria for This Documentation Phase

- documentation explains why persistence is needed for the existing issue/ticket UX flow
- current frontend behavior is separated from future backend behavior
- a minimal persistence slice is defined before any Supabase implementation
- AI finding is explicitly not an issue
- issue creation requires explicit user action
- user decision persistence is required
- created issue source lineage is required
- browser-local permanent issue IDs are rejected for future backend use
- frontend-only behavior is listed
- out-of-scope items are explicit
- no runtime files are changed
- `npm run build` passes if run
