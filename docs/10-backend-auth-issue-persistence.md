# ModelScope BIM Workspace - Backend Auth and Issue Persistence

## Purpose

This document defines a future backend persistence slice for the existing
Model Review issue and ticket workflow.

It is a specification document only. It does not add Supabase, backend code,
environment variables, authentication UI, database migrations, API clients,
runtime behavior, React changes, renderer changes, AI Review logic changes, or
Drawing Triage logic changes.

The goal is to make the current frontend workflow durable:

```text
AI scan run
-> AI finding
-> user decision
-> optional created issue
-> issue status and outcome history
-> source lineage back to the finding
```

Persistence should complete the existing UX flow. It should not turn
ModelScope into a full issue management system.

## Why Persistence Is Needed

ModelScope already demonstrates a believable local workflow:

- run a Model Review AI scan
- inspect AI findings in the AI Review Queue
- preview a proposed change in the viewport
- create an issue from a finding
- dismiss a finding
- view created issues in the Issues tab
- update issue status and outcome
- see review history entries
- return from an issue to the source finding and model context

Today these records live in browser state. That is appropriate for a frontend
prototype, but it creates product limits once the workflow is expected to
survive refreshes, device changes, or shared project review:

- created issue IDs are temporary and browser-owned
- dismissals and issue creation decisions disappear when local state resets
- review history is not attributable to a user
- a created issue cannot be reliably traced back to a durable source finding
- project ownership and access are implied rather than enforced

The future backend slice should persist only the minimum data needed to make
the current issue/ticket UX durable and auditable.

## Current Frontend Behavior

The current frontend is a local-state prototype.

Relevant current concepts:

- `ReviewIssue` represents an AI finding or review input.
- `ModelReviewIssue` represents a confirmed issue created by the user.
- `ModelReviewIssue.sourceFindingId` links the created issue back to the
  source AI finding.
- `ProjectAiReviewState.findingStatuses` tracks local AI finding workflow
  states such as `active`, `issue-created`, `dismissed`, and `follow-up`.
- `ProjectAiReviewState.modelReviewIssues` stores locally created Model Review
  issues.
- `ProjectAiReviewState.reviewHistory` stores local review history entries.
- `ProjectAiReviewState.scanStatus` stores local scan state.
- `ProjectAiReviewState.nextIssueSequence` generates local issue IDs.

This document preserves those product concepts but moves permanent identity,
decisions, ownership, and history to a future backend.

## Backend Product Boundary

The persistence layer should support a small authenticated demo workspace:

```text
demo user
-> demo project membership
-> AI scan runs
-> AI findings
-> user decisions
-> created issues
-> issue status history
-> review history events
```

The backend should not introduce a new product area. The user still experiences
Model Review through the existing AI Review Queue, finding detail, viewport
actions, Issues tab, and review history surfaces.

## Demo User and Demo Project Approach

The first backend phase should use seeded demo access rather than public
account creation.

Recommended approach:

- seed one demo organization or workspace, if needed only for ownership
  grouping
- seed one demo user for the live demo
- seed the existing demo projects as backend `projects`
- seed project memberships that allow the demo user to access those projects
- allow the app to resolve a demo session to the demo user without public
  signup, forgot password, invites, or account settings

Seeded project IDs should stay aligned with the current frontend fixture
projects:

- `residential-tower-a`
- `civic-center-east`
- `transit-hub-02`

Seeding different project IDs would break the existing frontend demo unless a
coordinated frontend change updates the fixture references at the same time.

The demo user is not a product feature. It is a controlled bridge from a
frontend-only prototype to a persistent workflow.

## Project Ownership and Membership

Projects should become durable records owned by a user or organization-like
demo owner.

Minimal project access concepts:

| Concept | Product meaning |
| --- | --- |
| `project_owner` | The user or demo owner responsible for the project record |
| `project_member` | A user allowed to view and act inside the project |
| `role` | A minimal access label such as `owner` or `member` |

The first persistence slice only needs to answer:

- Can this authenticated demo user access this project?
- Can this user run or view scan results for this project?
- Can this user create, dismiss, or update issues in this project?

It should not support enterprise permissions, custom roles, team invites,
discipline-level permissions, approval workflows, or external client access.

## AI Scan Runs

An AI scan run represents one model review scan attempt for a project.

The current browser scan animation can remain frontend-only for now, but a
future backend should persist a scan run once the workflow is durable.

Minimal scan run fields:

| Field | Product meaning |
| --- | --- |
| `id` | Backend-generated permanent scan run ID |
| `project_id` | Project that owns the scan |
| `created_by_user_id` | User who initiated or owns the demo scan |
| `status` | `queued`, `running`, `completed`, `failed`, or `cancelled` |
| `started_at` / `completed_at` | Scan timing |
| `source` | Demo/mock source for this phase |
| `finding_count` | Number of findings produced |

The first backend phase may persist seeded/mock scan results. It must not add
real AI, BIM parsing, model upload, OCR, or queue infrastructure.

## AI Findings and Finding Statuses

An AI finding is not an issue.

An AI finding is a review input produced by an AI scan run. It may contain
source object context, suggested action, confidence, severity-like priority,
and viewport location, but it remains provisional until a user acts.

Minimal finding fields:

| Field | Product meaning |
| --- | --- |
| `id` | Backend-generated permanent finding ID |
| `scan_run_id` | Scan run that produced the finding |
| `project_id` | Project scope for access and filtering |
| `code` | Human-readable finding code |
| `title` | Finding title shown in the queue |
| `finding_type` | Current category such as coordination, clearance, fire safety, or annotation |
| `priority` | Suggested review priority, not confirmed issue severity |
| `confidence` | Confidence in the suggestion, not proof of correctness |
| `object_id` / `object_context` | Source model object reference where available |
| `location` | Human-readable model location |
| `source_payload` | Structured provenance needed to reconstruct source context |

`ReviewIssue` in the current frontend (`src/types.ts`) does not include a
`confidence` field, so backend-returned confidence values have no display
target yet. The `confidence` field in persisted `ai_findings` should be
nullable and may remain unpopulated until a future spec adds explicit frontend
support.

Finding status should reflect user decision state:

- `active`: no durable user decision yet
- `issue-created`: the user created an issue from the finding
- `dismissed`: the user dismissed the finding
- `follow-up`: the user marked it for later review

The backend may store a denormalized current finding status for efficient
queries, but the source of truth should be the latest recorded decision and any
linked issue.

## User Decisions

Every user action that changes the fate of a finding must be stored.

Decision records are required because they explain why an AI finding did or did
not become an issue.

Minimal decision types:

- `create_issue`
- `dismiss`
- `mark_follow_up`
- `restore`
- `remove_issue_link`

`mark_follow_up` is a reserved decision type. The current frontend has no
visible UI action for it, and this PR must not add one. This decision type is
reserved for a future spec that explicitly introduces the frontend action.

Minimal decision fields:

| Field | Product meaning |
| --- | --- |
| `id` | Backend-generated permanent decision ID |
| `project_id` | Project scope |
| `finding_id` | Source AI finding |
| `user_id` | Actor |
| `decision_type` | User action |
| `decision_note` | Optional short rationale in a future UI |
| `created_issue_id` | Linked issue when decision creates one |
| `created_at` | Decision time |

The current UI does not need to add a note field in this phase. The data model
can leave it nullable for a future confirmation step.

## Created Issues and Tickets

An issue exists only after explicit user action.

The backend should create a Model Review issue when the user chooses `Create
issue` from a finding. The issue receives a backend-generated permanent ID. The
browser must not remain the long-term source of issue identity.

Minimal issue fields:

| Field | Product meaning |
| --- | --- |
| `id` | Backend-generated permanent issue ID |
| `project_id` | Project that owns the issue |
| `created_by_user_id` | User who created the issue |
| `source_finding_id` | Durable source finding lineage |
| `source_scan_run_id` | Durable source scan lineage |
| `title` | User-facing issue title |
| `related_object` | Source object or model context |
| `related_level` | Source level or floor |
| `priority` | Issue priority chosen from the finding's suggested priority |
| `status` | Current lightweight lifecycle status |
| `created_at` / `updated_at` | Issue timestamps |

The issue may snapshot selected finding fields for display stability, but it
must keep `source_finding_id` and `source_scan_run_id`.

The current frontend local state embeds the full
`sourceIssue: ReviewIssue` object on `ModelReviewIssue`. Backend persistence
must not store that embedded object. It should store only durable references
such as `source_finding_id` and `source_scan_run_id`; future frontend
integration should reconstruct the view model from backend records.

Allowed first-slice issue statuses:

- `Open`
- `In Review`
- `Resolved`
- `Blocked`
- `Closed as not actionable`

This status set mirrors the current lightweight issue lifecycle and should not
grow into assignees, comments, notifications, due dates, labels, attachments,
or cross-project boards.

## Issue Status History

Issue status changes should be append-only.

Minimal status history fields:

| Field | Product meaning |
| --- | --- |
| `id` | Backend-generated permanent event ID |
| `issue_id` | Issue being changed |
| `project_id` | Project scope |
| `from_status` | Previous status, nullable for initial creation |
| `to_status` | New status |
| `changed_by_user_id` | Actor |
| `changed_at` | Event time |

The current issue can store its latest status for display, but history should
explain how it got there.

## Review History Events

Review history is the user-facing audit trail for the workflow. It may include
events that are broader than issue status changes.

Recommended persisted event types:

- `scan_started`
- `scan_completed`
- `finding_selected`, only if future product value requires it
- `finding_dismissed`
- `finding_restored`
- `finding_marked_follow_up`
- `issue_created`
- `issue_status_changed`
- `issue_removed_from_tracker`
- `source_viewed`

The first persistence slice should prioritize durable workflow-changing events:

- scan completion
- finding decisions
- issue creation
- issue status or outcome changes
- issue removal or restore actions

The current frontend limits displayed review history to a small number of
recent entries. Backend persistence must store the full append-only history
without that display limit. Pagination or a "load more" affordance is a future
frontend integration concern, not a backend persistence constraint.

Transient UI actions such as hovering, opening panels, grouping findings,
preview toggles, or selected tabs should remain frontend-only.

## Source Lineage

The backend must preserve lineage from AI finding to user decision to created
issue.

Required chain:

```text
ai_scan_run
  -> ai_finding
  -> ai_finding_decision
  -> model_review_issue
  -> issue_status_history
  -> review_history_event
```

The created issue must retain:

- `source_finding_id`
- `source_scan_run_id`
- source finding code or display snapshot
- user decision that created it
- user and time of creation

This supports the existing `View in model`, `View issue details`, and source
finding link behavior without relying on browser-local records.

## Minimal API Boundary

A later backend implementation may expose operations equivalent to:

| Operation | Purpose |
| --- | --- |
| Resolve demo session | Identify the demo user |
| List accessible projects | Load projects available to the user |
| Read project review state | Load scan runs, findings, decisions, issues, and history for a project |
| Start or seed AI scan run | Create a scan run record for the current mock scan flow |
| List scan findings | Populate the AI Review Queue |
| Record finding decision | Persist dismiss, follow-up, restore, or create issue intent |
| Create issue from finding | Atomically create issue, decision, issue history, and review history |
| Update issue status | Persist status change and append history |
| Remove issue from tracker | Record a reversible or auditable removal outcome |

Important transaction rule:

When a user creates an issue from a finding, the backend must persist the issue,
the finding decision, the issue status history entry, and the review history
event together. If any part fails, the finding must not appear as
`issue-created`.

## What Remains Frontend-Only For Now

The following should remain local or UI-only until a later implementation spec
explicitly changes them:

- React component structure
- renderer and viewport drawing logic
- AI Review Queue layout and grouping controls
- selected finding ID
- selected issue detail focus
- viewport preview-change toggle
- panel open and closed state
- theme and prototype `Workspace / Design` utility state
- scan animation timing
- mock AI result generation
- Drawing Triage UI state and session persistence
- browser-local optimistic UI before backend confirmation

Frontend state may temporarily hold backend IDs after load, but it should not
invent permanent issue IDs once backend persistence exists.

## Explicitly Out Of Scope

This persistence slice does not include:

- public signup
- forgot password
- team invites
- comments
- assignees
- notifications
- file upload
- storage
- real AI
- OCR
- BIM parsing
- realtime collaboration
- enterprise permissions
- full issue management system
- Supabase client setup
- environment variable setup
- database migrations
- runtime app behavior changes
- React component changes
- renderer changes
- AI Review logic changes
- Drawing Triage logic changes

## Acceptance for Future Backend Work

A later implementation is acceptable only if:

- AI findings remain separate from issues.
- An issue is created only after explicit user action.
- Every user decision is stored.
- Created issues preserve `sourceFindingId` or its backend equivalent.
- Browser-generated issue IDs are replaced by backend-generated permanent IDs.
- Review history survives refreshes and is attributable to a user.
- Project access is checked through demo user membership.
- The existing Model Review UX remains the entry point.
- No full issue management system is introduced.
