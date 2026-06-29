# Feature Specification: Backend Implementation Design

**Feature Branch**: `012-backend-implementation-design`

**Created**: 2026-06-29

**Status**: Draft

**Input**: Create a documentation-only backend implementation design spec for
ModelScope after the merged `011-backend-auth-issue-persistence` spec. Choose
Supabase and define schema, RLS policies, seed strategy, RPC/API boundaries,
transaction behavior, rollback behavior, and frontend integration boundaries
without changing runtime code.

## Product Goal

ModelScope needs a precise backend implementation design for the existing Model
Review issue workflow before any Supabase dependencies, environment variables,
migrations, seed scripts, or frontend integration code are added.

The design must preserve the merged 011 product boundary:

```text
AI scan run
-> AI finding
-> user decision
-> optional created issue
-> issue status history
-> review history event
```

An AI finding is not an issue. A scan may produce findings, but scan completion
must not create issues. A Model Review issue exists only after explicit user
action.

This is a seeded demo backend slice, not a full product backend. The existing
frontend UX remains the product surface.

## User Scenarios & Testing

### User Story 1 - Choose Backend and Auth Model (Priority: P1)

A future implementer can understand why Supabase is the selected backend and
which demo auth/session model should be implemented first.

**Why this priority**: Backend dependencies and credentials are risky to add
without a clear platform, identity, and secret handling decision.

**Independent Test**: A documentation review can verify that Supabase is chosen
with rationale, that anonymous sign-in, seeded email/password, and
`service_role` access are evaluated, and that one recommended approach is
stated.

**Acceptance Scenarios**:

1. **Given** a later implementation PR starts, **When** the backend platform is
   selected, **Then** it uses Supabase for Postgres, Auth, RLS, and RPC
   transaction support.
2. **Given** demo authentication is needed, **When** the session model is
   implemented, **Then** it uses one seeded Supabase Auth email/password demo
   user rather than public signup, OAuth, magic links, or anonymous identity.
3. **Given** app-level user data is needed, **When** `demo_users` is created,
   **Then** it is linked to `auth.users.id` and is not treated as a second
   credential system.
4. **Given** seed or admin scripts need elevated access, **When** the
   `service_role` key is used, **Then** it is held server/admin-side only and is
   never exposed to the browser.

---

### User Story 2 - Define Schema and Row Access (Priority: P1)

A future implementer can create Supabase migrations for the minimal Model
Review persistence slice without inventing new tables or access rules.

**Why this priority**: The schema and RLS rules are the foundation for safe
project-scoped persistence.

**Independent Test**: A documentation review can inspect the required tables,
columns, role permissions, and membership rule and confirm that every
project-scoped row is gated by project membership.

**Acceptance Scenarios**:

1. **Given** migrations are written later, **When** the schema is created,
   **Then** it includes `demo_users`, `projects`, `project_memberships`,
   `ai_scan_runs`, `ai_findings`, `ai_finding_decisions`,
   `model_review_issues`, `issue_status_history`, and
   `review_history_events`.
2. **Given** a browser user reads project review state, **When** RLS evaluates
   rows, **Then** rows are visible only when the authenticated demo user has a
   project membership.
3. **Given** a browser user attempts direct writes, **When** the target table is
   append-only or requires cross-table consistency, **Then** the write is
   denied unless it goes through the approved RPC function.
4. **Given** an AI finding is persisted, **When** a user has not created an
   issue, **Then** no `model_review_issues` row exists for that finding.

---

### User Story 3 - Define Seeded Demo Data (Priority: P1)

A future implementation can seed demo data that matches the current frontend
fixtures exactly and keeps source lineage intact.

**Why this priority**: The existing frontend uses fixed project IDs and mock
finding data. Backend seed drift would break the demo or require runtime code
changes outside this design phase.

**Independent Test**: A documentation review can verify the seed strategy
creates the demo user, three exact project IDs, memberships, completed scan
runs, and findings mapped from current frontend fixtures.

**Acceptance Scenarios**:

1. **Given** seed data is created, **When** project rows are inserted, **Then**
   the IDs are exactly `residential-tower-a`, `civic-center-east`, and
   `transit-hub-02`.
2. **Given** seeded findings are inserted, **When** their source data is
   checked, **Then** they map back to the current `src/data/projects.ts`
   fixture findings and preserve fixture finding IDs as seed lineage.
3. **Given** the frontend has no confidence field, **When** finding rows are
   seeded, **Then** `confidence` remains nullable.
4. **Given** `mark_follow_up` has no visible frontend action, **When** runtime
   decision writes are designed, **Then** that decision type remains reserved
   until a future spec enables it.

---

### User Story 4 - Define Atomic Mutations and Rollback (Priority: P1)

A future implementer can create RPC functions for issue creation, finding
decisions, and status changes without partial records or history gaps.

**Why this priority**: Creating an issue from a finding touches multiple tables
and must either fully succeed or leave the finding reviewable.

**Independent Test**: A documentation review can trace `create_issue_from_finding`
and confirm that issue row, finding decision, initial status history, review
history event, and denormalized finding status are persisted in one transaction.

**Acceptance Scenarios**:

1. **Given** a user creates an issue from a finding, **When** the RPC succeeds,
   **Then** the backend returns a permanent issue UUID, display `issue_code`,
   source finding ID, source scan run ID, decision row, status history row, and
   review history event.
2. **Given** any insert in issue creation fails, **When** the transaction rolls
   back, **Then** no confirmed issue, decision, status history, review history,
   or `issue-created` finding state is visible as a committed backend result.
3. **Given** a user dismisses or restores a finding, **When** the decision is
   recorded, **Then** a new decision row and review history event are appended
   without overwriting finding history.
4. **Given** issue status changes, **When** the RPC persists the change, **Then**
   `model_review_issues.status` updates and both `issue_status_history` and
   `review_history_events` append rows.

---

### User Story 5 - Define Frontend Integration Boundary (Priority: P2)

A future frontend integration PR can know what data to load, send, receive, and
reconcile without changing runtime behavior in this design phase.

**Why this priority**: The current PR must remain documentation-only while
still giving the next PR clear integration boundaries.

**Independent Test**: A documentation review can verify that the frontend
integration boundary is described and that no runtime, package, env, component,
renderer, AI Review, Drawing Triage, upload, storage, real AI, or full issue
management behavior is introduced.

**Acceptance Scenarios**:

1. **Given** the future frontend loads backend state, **When** it hydrates Model
   Review, **Then** it loads demo profile, accessible projects, scan runs,
   findings, decisions, issues, issue status history, review history, and
   lineage data.
2. **Given** the future frontend creates optimistic UI state, **When** a backend
   mutation fails, **Then** it removes temporary records, restores the last
   confirmed backend state, and offers retry or reload behavior.
3. **Given** this documentation phase is reviewed, **When** changed files are
   inspected, **Then** only the approved docs and 012 spec files changed.

### Edge Cases

- A browser may optimistically show a temporary issue before the RPC returns;
  the temporary ID must be replaced by backend `id` and `issue_code` or removed
  on failure.
- A network timeout may happen after the transaction commits; the same
  idempotency key should allow retry or re-fetch without duplicate issues.
- A user may attempt to create an issue twice from the same finding; the RPC
  must reject duplicate active issues or return the idempotent prior result.
- A finding may be dismissed and later restored; both decisions remain in
  append-only history.
- A scan may complete with zero findings; no issue rows are created.
- A seeded fixture may contain follow-up display state, but runtime
  `mark_follow_up` writes remain reserved until a future visible action exists.
- A project may exist in fixtures but not be accessible to the authenticated
  user; RLS must deny access without relying on frontend filtering.
- The service-role key may be available to seed scripts, but it must never be
  visible to browser code.

## Requirements

### Functional Requirements

- **FR-001**: The design MUST choose Supabase as the backend platform for the
  first implementation PR.
- **FR-002**: The design MUST explain why Supabase is appropriate for this
  portfolio/demo phase.
- **FR-003**: The design MUST evaluate Supabase anonymous sign-in, a seeded
  email/password demo user, and `service_role` access.
- **FR-004**: The design MUST recommend a seeded Supabase Auth email/password
  demo user for first implementation.
- **FR-005**: The design MUST state that `service_role` is server/admin-only
  and MUST NOT be exposed to the browser under any circumstances.
- **FR-006**: The design MUST clarify that `demo_users` is an app-level profile
  table linked to `auth.users.id`, not a replacement for Supabase Auth
  credentials.
- **FR-007**: The design MUST define one source of truth for identity:
  Supabase Auth.
- **FR-008**: The design MUST define tables for `demo_users`, `projects`,
  `project_memberships`, `ai_scan_runs`, `ai_findings`,
  `ai_finding_decisions`, `model_review_issues`, `issue_status_history`, and
  `review_history_events`.
- **FR-009**: The design MUST state that AI findings and created issues remain
  separate tables and MUST NOT be collapsed.
- **FR-010**: The design MUST state that scan completion does not create
  issues.
- **FR-011**: The design MUST require created issues to store
  `source_finding_id` and `source_scan_run_id` as durable references.
- **FR-012**: The design MUST state that backend persistence does not store the
  frontend `sourceIssue` embedded object as the canonical backend shape.
- **FR-013**: The design MUST define SELECT, INSERT, and UPDATE access
  expectations for `anon`, `authenticated`, and `service_role` roles for every
  table.
- **FR-014**: The design MUST explain how project membership enforces access at
  the row level through RLS.
- **FR-015**: The design MUST define seeded demo data for one demo user, the
  three exact project IDs, memberships, completed scan runs, and seeded
  findings.
- **FR-016**: The design MUST explain how the seed script stays aligned with
  `src/types.ts` and `src/data/projects.ts` fixture data.
- **FR-017**: The design MUST define backend-generated permanent issue IDs and
  a user-facing issue code format that replaces browser-local `MR-001` style
  permanent IDs.
- **FR-018**: The design MUST define `create_issue_from_finding` as a single
  atomic operation using Supabase RPC/Postgres transaction behavior.
- **FR-019**: The design MUST specify rollback behavior if any part of issue
  creation fails.
- **FR-020**: The design MUST state that finding decisions are appended without
  overwriting finding history.
- **FR-021**: The design MUST state that issue status history and review
  history events are appended on every relevant workflow action.
- **FR-022**: The design MUST identify which reads and writes can use the
  Supabase client directly with RLS and which writes must go through RPC.
- **FR-023**: The design MUST define failure and rollback behavior for
  optimistic frontend issue creation and other pending mutations.
- **FR-024**: The design MUST define frontend load, send, and receive
  boundaries without adding runtime code.
- **FR-025**: The design MUST explicitly keep `mark_follow_up` reserved until a
  visible frontend action exists.
- **FR-026**: The design MUST keep `confidence` nullable until frontend support
  exists.
- **FR-027**: The design MUST preserve full lineage:
  scan run -> finding -> decision -> issue -> status history -> review history.
- **FR-028**: The design MUST state that this is a seeded demo slice, not a full
  product backend.
- **FR-029**: This phase MUST NOT install packages, add Supabase client code,
  add environment variables, add migrations, add auth UI, add runtime backend
  code, change React components, change renderer logic, change AI Review
  behavior, change Drawing Triage behavior, or change issue lifecycle runtime
  behavior.
- **FR-030**: This phase MUST NOT add upload, storage, real AI, OCR, BIM
  parsing, realtime collaboration, comments, assignees, notifications, public
  signup, OAuth, magic links, or full issue management.

### Key Entities

- **`demo_users`**: App-level profile rows linked to Supabase Auth users for
  demo attribution and memberships.
- **`projects`**: Durable project records using current fixture IDs.
- **`project_memberships`**: Minimal user-to-project access rows used by RLS.
- **`ai_scan_runs`**: Seeded or future mock scan attempts for a project.
- **`ai_findings`**: Provisional AI review inputs produced by a scan run.
- **`ai_finding_decisions`**: Append-only user decisions on findings.
- **`model_review_issues`**: Durable issues created only after explicit user
  action.
- **`issue_status_history`**: Append-only issue status and outcome changes.
- **`review_history_events`**: Append-only user-facing workflow audit history.

### Product Rules

- AI finding is not an issue.
- Do not collapse `ai_findings` and `model_review_issues`.
- Scan completion must not create issues.
- Browser must not generate permanent issue IDs.
- Do not store frontend `sourceIssue` embedded object as backend shape.
- Preserve full source lineage from scan run to review history.
- This is a seeded demo slice, not a full product backend.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A future implementer can create Supabase migrations from the
  design without asking which tables are required.
- **SC-002**: A reviewer can identify the recommended auth/session model and
  explain why anonymous sign-in and browser `service_role` access were not
  chosen.
- **SC-003**: A reviewer can identify the RLS membership rule and role access
  expectations for all nine application tables.
- **SC-004**: A reviewer can trace issue creation from finding through one
  atomic RPC transaction and describe rollback behavior.
- **SC-005**: A reviewer can identify exactly how backend issue IDs and display
  issue codes replace browser-local permanent IDs.
- **SC-006**: A reviewer can confirm the seed strategy preserves the three
  current project IDs exactly.
- **SC-007**: Changed files are limited to `docs/11-backend-implementation-design.md`,
  `specs/012-backend-implementation-design/spec.md`,
  `specs/012-backend-implementation-design/plan.md`, and
  `specs/012-backend-implementation-design/tasks.md`.
- **SC-008**: `npm run build` remains able to pass because no runtime source,
  package, environment, or migration files changed.

## Assumptions

- Supabase implementation is a later PR.
- The first backend user is one seeded demo user, not public signup.
- The frontend may continue to use current local fixtures until a separate
  integration spec changes runtime behavior.
- The issue UUID is the permanent primary key; `issue_code` is the
  user-facing display identifier.
- RLS policies and RPC functions will be implemented in SQL migrations later,
  not in this documentation phase.
- Existing frontend UX remains the product surface.
