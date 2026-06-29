# Feature Specification: Backend Auth and Issue Persistence

**Feature Branch**: `011-backend-auth-issue-persistence`

**Created**: 2026-06-29

**Status**: Draft

**Input**: Define a documentation-only backend, auth, and issue persistence
specification for persisting the existing Model Review AI finding to issue
workflow in a future backend phase.

## Product Goal

ModelScope should be able to persist the existing Model Review issue/ticket
workflow without expanding into a full issue management product.

The current frontend already demonstrates a coherent local flow:

```text
Model Review AI scan entry
-> AI Review Queue
-> AI findings
-> preview change
-> create issue or dismiss
-> Issues tab
-> issue status and outcome actions
-> review history
-> source finding links
```

The future backend must make that flow durable, attributable, and traceable. It
must preserve the product rule that an AI finding is not an issue. A created
issue exists only after explicit user action, and the resulting issue must keep
source lineage back to the AI finding and scan run.

This is a documentation/specification phase only. It does not implement
Supabase, backend code, auth UI, API clients, database migrations, environment
variables, runtime behavior, React component changes, renderer logic, AI Review
logic, or Drawing Triage logic.

## User Scenarios & Testing

### User Story 1 - Establish Demo Project Access (Priority: P1)

A future backend phase can identify a demo user, load the demo projects that
user is allowed to access, and scope Model Review persistence to those projects.

**Why this priority**: Durable issue records require an actor and a project
boundary. Without minimal ownership and membership, created issues and review
decisions cannot be attributed or access-controlled.

**Independent Test**: A documentation review can verify that the spec defines a
demo user, demo project records, project ownership, and membership without
public signup, team invites, forgot password, or enterprise permissions.

**Acceptance Scenarios**:

1. **Given** a future backend phase begins, **When** demo access is defined,
   **Then** the phase uses a seeded demo user and seeded demo projects rather
   than public account creation.
2. **Given** a user requests project review state, **When** the backend checks
   access, **Then** it scopes the request through project membership.
3. **Given** a user creates, dismisses, or updates an issue, **When** the action
   is persisted, **Then** the record identifies the acting user and project.

---

### User Story 2 - Persist Scan Findings and Decisions (Priority: P1)

A BIM coordinator can run or load an AI scan, review findings, and have each
human decision persist separately from the finding itself.

**Why this priority**: The safest workflow boundary is the distinction between
AI output and human decision. Persistence must record what the AI suggested and
what the user decided without silently promoting findings into issues.

**Independent Test**: A documentation review can trace the future data path from
`ai_scan_runs` to `ai_findings` to finding decisions and confirm that no issue
record is created by scan completion alone.

**Acceptance Scenarios**:

1. **Given** an AI scan completes, **When** findings are stored, **Then** each
   finding remains a provisional review input and not an issue.
2. **Given** a finding is dismissed, **When** the decision is persisted, **Then**
   the finding status changes through a stored user decision rather than by
   deleting the finding.
3. **Given** a finding is marked for follow-up or restored, **When** the action
   is persisted, **Then** a new decision record preserves the actor, action,
   and time.
4. **Given** a finding is still active, **When** project review state is loaded,
   **Then** the finding appears in the AI Review Queue without appearing in the
   Issues tab.

---

### User Story 3 - Persist Created Issues and Lineage (Priority: P1)

A BIM coordinator can create an issue from an AI finding and later return to the
source finding, model context, status history, and review history after refresh
or device change.

**Why this priority**: The existing UX depends on created issues being linked
to source findings. Backend persistence is useful only if it preserves that
lineage and replaces browser-generated temporary IDs with durable IDs.

**Independent Test**: A documentation review can verify that issue creation is
atomic and stores the created issue, source finding ID, user decision, initial
status history, and review history event together.

**Acceptance Scenarios**:

1. **Given** a user selects `Create issue` on an AI finding, **When** the future
   backend persists the action, **Then** it creates a durable issue record with
   `source_finding_id` and `source_scan_run_id`.
2. **Given** issue creation succeeds, **When** project review state reloads,
   **Then** the finding appears as `issue-created` and the issue appears in the
   Issues tab with source lineage intact.
3. **Given** issue creation fails, **When** project review state reloads,
   **Then** the finding does not appear as `issue-created` and no partial issue
   is shown.
4. **Given** an issue status changes, **When** the change is persisted, **Then**
   status history and review history identify the old status, new status,
   actor, and time.

---

### User Story 4 - Preserve Frontend Scope Boundaries (Priority: P2)

A future implementer can tell which existing behavior remains frontend-only and
which data becomes persistent before any backend implementation begins.

**Why this priority**: The project is intentionally a frontend prototype today.
The backend plan must avoid accidental runtime changes, product expansion, or
new implementation commitments.

**Independent Test**: A documentation review can verify that this feature
specifies no package install, Supabase client, environment variables, runtime
behavior, React component changes, renderer changes, AI Review logic changes,
Drawing Triage logic changes, or real backend code.

**Acceptance Scenarios**:

1. **Given** a future implementation team reads this spec, **When** they define
   the first backend slice, **Then** they can identify the minimal persistence
   records needed for the existing UX.
2. **Given** the current documentation phase is reviewed, **When** changed
   files are inspected, **Then** no runtime files, package files, components,
   renderer files, or app behavior are changed.
3. **Given** the product scope is evaluated, **When** out-of-scope items are
   checked, **Then** signup, invites, comments, assignees, notifications,
   upload, storage, real AI, OCR, BIM parsing, realtime collaboration,
   enterprise permissions, and full issue management are excluded.

### Edge Cases

- A user may dismiss a finding and later restore it; both actions must remain
  visible in decision history.
- A user may remove a locally created issue from the tracker; the backend must
  record the outcome without erasing source finding lineage.
- A scan may complete with zero findings; this must not create any issue
  records.
- Issue creation may fail after the frontend starts an optimistic action; the
  finding must remain reviewable and must not become `issue-created`.
- A backend-generated issue ID may differ from the previous browser-local ID;
  source finding lineage must remain stable through backend IDs.
- A project may be visible in the frontend demo list but inaccessible to the
  authenticated user; backend reads and writes must be scoped by membership.
- Two scan runs may produce similar findings; lineage must point to the exact
  scan run and finding that produced the issue.
- Review history may include transient UI events today, but the first backend
  slice should persist only durable workflow-changing events.

## Requirements

### Functional Requirements

- **FR-001**: The future backend persistence slice MUST use a seeded demo user
  and seeded demo projects for initial authenticated access.
- **FR-002**: The persistence model MUST represent project ownership and
  membership before allowing project review state reads or writes.
- **FR-003**: The backend MUST scope AI scan runs, AI findings, created issues,
  status history, and review history to a project.
- **FR-004**: The backend MUST persist AI scan runs separately from AI findings.
- **FR-005**: The backend MUST persist AI findings as provisional review inputs
  and MUST NOT treat scan findings as issues.
- **FR-006**: The backend MUST persist user decisions on findings, including at
  minimum create issue, dismiss, follow-up, restore, and issue-removal outcomes.
  The `mark_follow_up` decision type is reserved; the current frontend has no
  visible UI action for it, and this documentation-only phase MUST NOT add one.
  A future spec must explicitly introduce the frontend action before users can
  produce this decision type.
- **FR-007**: The current finding status MUST be derivable from durable decision
  and issue records, even if a denormalized status is also stored.
- **FR-008**: An issue MUST exist only after explicit user action.
- **FR-009**: Issue creation from a finding MUST preserve
  `source_finding_id`, `source_scan_run_id`, acting user, project, and creation
  time.
  The current frontend embeds `sourceIssue: ReviewIssue` on
  `ModelReviewIssue`, but backend persistence MUST store durable references
  rather than the embedded source object.
- **FR-010**: Browser-local issue ID generation MUST NOT be the long-term
  source of permanent issue IDs once backend persistence exists.
- **FR-011**: Issue creation MUST be atomic from the user's perspective: issue
  record, creating decision, initial status history, and review history event
  either all persist or none are presented as successful.
- **FR-012**: Created issues MUST use the current lightweight status set:
  `Open`, `In Review`, `Resolved`, `Blocked`, and
  `Closed as not actionable`.
- **FR-013**: Every issue status or outcome change MUST append an issue status
  history record with actor and time.
- **FR-014**: Review history MUST persist durable workflow events such as scan
  completion, finding decisions, issue creation, issue status changes, and
  issue removal or restoration.
- **FR-015**: Source lineage MUST support returning from a created issue to its
  source AI finding and model context.
  Future frontend integration MUST reconstruct that view model from backend
  issue, finding, and scan-run records rather than relying on the embedded
  `sourceIssue` object.
- **FR-016**: Transient UI state such as selected tabs, panel open state,
  grouping controls, hover state, viewport preview toggles, and scan animation
  timing MUST remain frontend-only in this persistence slice.
- **FR-017**: The documentation MUST define a minimal API boundary before any
  Supabase or backend implementation is introduced.
- **FR-018**: This documentation phase MUST NOT install packages, add Supabase
  client code, add environment variables, modify runtime app behavior, modify
  React components, modify renderer logic, modify AI Review logic, modify
  Drawing Triage logic, add backend code, or add auth UI.
- **FR-019**: The persistence slice MUST NOT add public signup, forgot password,
  team invites, comments, assignees, notifications, file upload, storage, real
  AI, OCR, BIM parsing, realtime collaboration, enterprise permissions, or a
  full issue management system.

### Key Entities

- **`demo_users`**: Seeded users for controlled demo access. Initial scope only
  needs one demo user.
- **`projects`**: Durable project records corresponding to the existing demo
  projects.
- **`project_memberships`**: Minimal user-to-project access records, with
  roles such as `owner` or `member`.
- **`ai_scan_runs`**: One Model Review scan attempt for a project, with status
  and provenance.
- **`ai_findings`**: Provisional AI review inputs produced by a scan run.
- **`ai_finding_decisions`**: Append-oriented user decisions on a finding.
- **`model_review_issues`**: Durable issues created only after explicit user
  action.
- **`issue_status_history`**: Append-oriented issue status and outcome changes.
- **`review_history_events`**: User-facing audit trail events for the existing
  review workflow.

### Minimal Persistence Slice

The first future backend slice should persist:

1. demo user identity
2. demo project records
3. project memberships
4. AI scan runs
5. AI findings
6. finding decisions and current finding status
7. issues created from findings
8. issue status history
9. review history events
10. source lineage from finding to decision to issue

It should not persist or implement storage, file uploads, real model parsing,
real AI inference, Drawing Triage files, comments, assignments, notifications,
or collaboration.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer can read the documentation and identify every durable
  record needed to reload the existing Model Review issue flow after refresh.
- **SC-002**: The documentation states at least three times through
  requirements, entity definitions, and lineage rules that an AI finding is not
  an issue.
- **SC-003**: The documentation defines a complete persisted chain from AI scan
  run to AI finding to user decision to created issue to status and review
  history.
- **SC-004**: The documentation separates frontend-only state from future
  backend-persisted state.
- **SC-005**: The changed-file set contains only documentation/specification
  files.
- **SC-006**: `npm run build` remains able to pass because no runtime source,
  dependencies, or environment requirements changed.

## Assumptions

- The first backend implementation will be a later phase; this phase is
  documentation-only.
- A seeded demo user is sufficient for the first persistence slice.
- The existing frontend Model Review UX remains the product surface for this
  workflow.
- Permanent IDs should be backend-generated once persistence exists.
- Existing mock project and finding vocabulary can be mapped to durable backend
  records without changing current UI behavior in this documentation phase.
