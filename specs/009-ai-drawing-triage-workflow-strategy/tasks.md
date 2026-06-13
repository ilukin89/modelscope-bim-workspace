# Tasks: AI Drawing Triage Workflow Strategy

## Purpose

This task list records the completed documentation work and a safe,
dependency-ordered sequence for separate future implementation PRs.

The current PR is planning-only.

## Non-Negotiable Rules

- Do not modify runtime source code in this planning PR.
- Do not modify `src/App.tsx`.
- Do not change visible UI behavior.
- Do not add packages.
- Do not implement upload, storage, backend, database, AI, parsing, or rendering.
- Do not modify the viewer adapter.
- Do not treat AI observations as confirmed issues.
- Do not create issues without human confirmation.

## Phase 1: Planning Setup

- [x] T001 Read the project and constitution context listed in `specs/009-ai-drawing-triage-workflow-strategy/plan.md`.
- [x] T002 Inspect current issue, AI Review, viewport, inspector, and explorer boundaries in `src/App.tsx`, `src/types.ts`, and `src/features/`.
- [x] T003 Confirm the branch and documentation-only scope in `specs/009-ai-drawing-triage-workflow-strategy/plan.md`.

## Phase 2: Foundational Product Boundaries

- [x] T004 Define observation, candidate issue, confirmed issue, AI review, and review decision vocabulary in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.
- [x] T005 Define safety and honesty rules in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.
- [x] T006 Define future data concepts and lineage in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.
- [x] T007 Define future backend and API boundaries without implementation in `specs/009-ai-drawing-triage-workflow-strategy/plan.md`.

## Phase 3: User Story 1 - Review Candidate Observations (Priority: P1)

**Goal**: Define how users inspect provisional AI observations against a source
drawing.

**Independent Test**: The documentation makes it possible to prototype a source
preview and candidate detail without treating the candidate as an issue.

- [x] T008 [P] [US1] Define the primary upload-to-candidate flow in `docs/08-ai-drawing-triage-workflow.md`.
- [x] T009 [P] [US1] Define the candidate issue shape in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.
- [x] T010 [P] [US1] Define drawing preview, AI triage panel, candidate list, and evidence behavior in `docs/08-ai-drawing-triage-workflow.md`.
- [x] T011 [US1] Define honest empty, processing, no-candidate, unsupported, and error states in `docs/08-ai-drawing-triage-workflow.md`.

## Phase 4: User Story 2 - Record a Human Decision (Priority: P2)

**Goal**: Define deliberate convert, dismiss, and follow-up decisions with
auditability.

**Independent Test**: The documentation distinguishes all three decisions and
specifies that only conversion creates an issue.

- [x] T012 [P] [US2] Define candidate state transitions in `docs/08-ai-drawing-triage-workflow.md`.
- [x] T013 [P] [US2] Define review decision audit requirements in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.
- [x] T014 [US2] Define the candidate-to-issue confirmation flow in `docs/08-ai-drawing-triage-workflow.md`.

## Phase 5: User Story 3 - Understand Processing and Failure States (Priority: P3)

**Goal**: Define honest asynchronous and failure-state communication.

**Independent Test**: Each planned state explains what happened and the next
useful action without fabricating results.

- [x] T015 [P] [US3] Define future AI review job states in `docs/08-ai-drawing-triage-workflow.md`.
- [x] T016 [P] [US3] Define zero-candidate and partial-result safety language in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.
- [x] T017 [US3] Define later UI acceptance criteria for state coverage in `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.

## Phase 6: Planning Validation

- [x] T018 Run `npm run lint`.
- [x] T019 Run `npm run build`.
- [x] T020 Confirm only the four requested documentation files changed with `git status --short`.
- [x] T021 Confirm no package or runtime source file changed with `git diff --name-only`.

## Separate Future PR: Fake Upload UI

These tasks are not authorized in this planning PR.

- [ ] T022 [US1] Create a fake/local drawing selection state in a future drawing-triage feature module.
- [ ] T023 [US1] Show mock `uploaded_drawings` metadata without network or storage behavior.
- [ ] T024 [US1] Add a purposeful empty state that explains drawing triage and its limitations.
- [ ] T025 [US1] Keep model loading and the viewer adapter unchanged.

## Separate Future PR: Local Drawing Preview

- [ ] T026 [US1] Render a local prototype image or supported document preview in the primary workspace.
- [ ] T027 [US1] Add page or image navigation appropriate to the selected mock artifact.
- [ ] T028 [US1] Add candidate evidence-region focus with an explicit unavailable-evidence state.
- [ ] T029 [US1] Validate keyboard access, responsive behavior, and preview readability.

## Separate Future PR: Mock AI Candidate Generation

- [ ] T030 [US3] Add clearly labeled mock `ai_reviews` states without AI calls.
- [ ] T031 [US1] Add fixture `drawing_ai_observations` and `candidate_issues`.
- [ ] T032 [US1] Display candidate risk, confidence, evidence, missing information, question, next step, and status.
- [ ] T033 [US3] Add queued, processing, completed, partial, no-candidate, unsupported, and failed states.
- [ ] T034 [US3] Verify no state claims confirmed clash detection or drawing completeness.

## Separate Future PR: Candidate Decisions

- [ ] T035 [US2] Add local convert, dismiss, and follow-up actions for mock candidates.
- [ ] T036 [US2] Add an editable confirmation step before mock issue conversion.
- [ ] T037 [US2] Prevent candidates from appearing in Open Issues before conversion.
- [ ] T038 [US2] Add mock `review_decisions` history with actor, time, action, and rationale.
- [ ] T039 [US2] Preserve source lineage after mock issue conversion.

## Separate Future PR: Backend and Storage Boundary

- [ ] T040 Define upload validation, authorization, and storage requirements in a dedicated future spec.
- [ ] T041 Define persistence and lifecycle rules for all six planned entities in a dedicated future spec.
- [ ] T042 Define job status, retry, idempotency, and failure contracts in a dedicated future spec.
- [ ] T043 Define transactional candidate-to-issue conversion in a dedicated future spec.
- [ ] T044 Define authentication, permissions, retention, privacy, and audit policies in a dedicated future spec.

## Separate Future PR: Real AI Evaluation

- [ ] T045 Define a controlled evaluation dataset and expert review protocol before provider selection.
- [ ] T046 Measure candidate usefulness, false-positive burden, missed concerns, and terminology comprehension.
- [ ] T047 Complete privacy, security, retention, and model-risk review.
- [ ] T048 Integrate real triage only after UX validation and with mandatory human review.
- [ ] T049 Preserve a kill switch and prevent automatic issue creation.

## Dependencies and Execution Order

- Current planning phases are complete before validation.
- Future fake upload UI precedes local preview integration.
- Local preview and evidence focus precede candidate usability validation.
- Mock candidate generation precedes candidate decision interactions.
- Candidate decision UX must be validated before backend contracts are finalized.
- Backend and storage boundaries must be approved before real AI integration.
- Real AI evaluation is last; it is not required to prove the product workflow.

## Implementation Strategy

The recommended MVP is not real AI. It is:

1. fake/local file state
2. local drawing preview
3. mock candidate fixtures
4. human convert, dismiss, and follow-up interactions
5. clear audit lineage

This sequence tests whether the workflow improves coordination decisions before
the project accepts the cost and risk of storage, document processing, or AI
integration.

## Completion Criteria for This Planning PR

- the four requested documentation files exist
- the ten requested planning topics are covered
- AI output is consistently framed as provisional
- future phases are ordered and independently bounded
- `npm run lint` succeeds
- `npm run build` succeeds
- no runtime, package, or visible UI change is included
