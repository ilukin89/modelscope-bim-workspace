# Feature Specification: AI Drawing Triage Workflow Strategy

**Feature Branch**: `009-ai-drawing-triage-workflow-strategy`

**Created**: 2026-06-13

**Status**: Draft

**Input**: Define a planning-only product strategy for AI-assisted triage of
uploaded 2D plans, sketches, screenshots, PDFs, and images.

## Product Goal

ModelScope should help BIM coordination teams review incomplete or
non-model-based project information without pretending that a visual AI review
has the authority or geometric evidence of BIM clash detection.

AI Drawing Triage belongs in ModelScope because coordination inputs often arrive
before, outside, or alongside a federated model. Plans, sketches, markups,
screenshots, and PDFs can contain useful signals about possible access,
clearance, routing, classification, or information gaps. ModelScope can organize
those signals into a structured human review workflow that connects naturally
to its existing issue-review product direction.

Drawing triage differs from real clash detection:

- real clash detection compares spatially reliable model geometry and rules
- drawing triage interprets visual evidence that may be partial, ambiguous,
  unscaled, outdated, or missing discipline context
- drawing triage produces candidate review items, not confirmed technical issues
- only a human review decision can convert a candidate into an issue

This workflow is stronger than a static AI Review mock because it defines an
end-to-end decision process: source artifact, AI review run, observations,
candidate review items, human decisions, issue conversion, and audit history.
The value is not the appearance of intelligence; it is a reviewable and honest
path from uncertain evidence to accountable coordination action.

## User Scenarios & Testing

### User Story 1 - Review Candidate Observations (Priority: P1)

A BIM coordinator uploads a 2D project artifact and receives a structured list
of candidate observations that clearly communicate uncertainty, evidence,
missing information, and suggested questions.

**Why this priority**: The product has no value unless AI output is framed as
review material rather than accepted as a technical conclusion.

**Independent Test**: Using a prototype with a mock uploaded drawing and mock
triage result, a user can inspect the source preview and understand why every
candidate needs human review.

**Acceptance Scenarios**:

1. **Given** an uploaded drawing record with a completed triage review, **When**
   the user opens a candidate, **Then** the product shows its title, type, risk
   level, confidence, evidence, missing information, suggested question,
   suggested next step, and `needs_review` status.
2. **Given** an AI observation based only on visual evidence, **When** it is
   presented to the user, **Then** it is labeled as a candidate or observation
   and is not described as a confirmed issue or clash.
3. **Given** a candidate with limited evidence, **When** the user reviews it,
   **Then** the missing information is visible alongside confidence rather than
   hidden behind a single score.

---

### User Story 2 - Record a Human Review Decision (Priority: P2)

A BIM coordinator reviews a candidate and converts it to an issue, dismisses it,
or marks it for follow-up.

**Why this priority**: Human decision-making is the control that separates a
useful coordination aid from unsafe automated issue creation.

**Independent Test**: Using mock candidates, a user can choose each allowed
decision and see a distinct resulting status and decision record.

**Acceptance Scenarios**:

1. **Given** a candidate in `needs_review`, **When** the user converts it,
   **Then** an issue is created through a deliberate confirmation step and the
   candidate becomes `converted`.
2. **Given** a candidate in `needs_review`, **When** the user dismisses it,
   **Then** the candidate becomes `dismissed` and the decision remains
   auditable.
3. **Given** a candidate that cannot yet be resolved, **When** the user marks it
   for follow-up, **Then** the candidate becomes `follow_up` without becoming an
   issue.
4. **Given** any candidate decision, **When** the review history is inspected,
   **Then** the system identifies the decision, actor, time, and relationship to
   the original AI review.

---

### User Story 3 - Understand Processing and Failure States (Priority: P3)

A user can understand whether a drawing is waiting, processing, complete,
unsupported, or failed, and knows the next useful action.

**Why this priority**: Upload and AI processing are asynchronous future
boundaries. Honest states prevent users from mistaking missing results for a
successful review.

**Independent Test**: A prototype can display each state with clear language and
without fabricating observations.

**Acceptance Scenarios**:

1. **Given** no drawing has been added, **When** the user opens Drawing Triage,
   **Then** the empty state explains supported future artifact types and the
   purpose of triage.
2. **Given** a drawing is queued or processing, **When** the user views it,
   **Then** progress language does not imply that findings already exist.
3. **Given** triage fails or the file is unsupported, **When** the state is
   shown, **Then** the user receives a clear explanation and a retry, replace,
   or manual-review path.
4. **Given** triage completes with no candidates, **When** results are shown,
   **Then** the product states that no candidates were generated and does not
   claim that the drawing has no technical problems.

### Edge Cases

- A low-resolution, rotated, cropped, password-protected, or visually ambiguous
  artifact may not contain enough evidence for useful triage.
- A multi-page PDF may produce observations tied to different pages and regions.
- The same visual concern may be reported more than once; future behavior should
  support review without silently merging evidence.
- A candidate may have high confidence but still lack scale, model context,
  specification data, or confirmation from another discipline.
- A user may dismiss a candidate and later need to reopen or supersede the
  decision; audit history must remain intact.
- Issue conversion may fail after a review decision is initiated; the candidate
  must not appear converted until issue creation succeeds.
- A completed review with zero candidates must not be presented as a certified
  or conflict-free drawing.

## Requirements

### Functional Requirements

- **FR-001**: The future workflow MUST accept a user-selected 2D plan, sketch,
  screenshot, PDF, or image as the source for a drawing triage review.
- **FR-002**: The future workflow MUST create an `uploaded_drawings` record
  before triage results are associated with the artifact.
- **FR-003**: The future workflow MUST represent each triage attempt as an
  `ai_reviews` record with an explicit processing status.
- **FR-004**: The future workflow MUST store AI-generated visual observations
  separately from confirmed product issues.
- **FR-005**: The future workflow MUST present actionable AI output as
  `candidate_issues` requiring human review.
- **FR-006**: Every candidate MUST include a title, type, risk level,
  confidence, evidence, missing information, suggested question, suggested next
  step, and review status.
- **FR-007**: Candidate status MUST use one of `needs_review`, `converted`,
  `dismissed`, or `follow_up`.
- **FR-008**: The workflow MUST allow a human user to convert, dismiss, or mark a
  candidate for follow-up.
- **FR-009**: Automatic issue creation without human confirmation MUST NOT be
  allowed.
- **FR-010**: Conversion MUST create or link an `issues` record and preserve the
  relationship to the originating candidate, observation, review, and drawing.
- **FR-011**: Every user action on a candidate MUST create a
  `review_decisions` record suitable for an audit trail.
- **FR-012**: AI-generated content MUST be labeled as an observation,
  suggestion, or candidate rather than a confirmed technical issue.
- **FR-013**: The term "clash" MUST NOT be used for a drawing candidate unless a
  human has confirmed that classification.
- **FR-014**: Confidence and missing information MUST be presented together so
  confidence is not mistaken for completeness or correctness.
- **FR-015**: The workflow MUST preserve access to the source drawing, page, and
  evidence region relevant to the selected candidate where available.
- **FR-016**: Empty, loading, queued, processing, no-candidate, unsupported-file,
  and failure states MUST explain the state and the next useful action.
- **FR-017**: A zero-candidate result MUST NOT claim that the drawing is free of
  coordination or construction issues.
- **FR-018**: Drawing triage MUST remain distinct from real model-based clash
  detection and from viewer-adapter responsibilities.
- **FR-019**: A future UI implementation MUST preserve ModelScope's
  viewport-first principle by giving a selected candidate visible context in
  the primary drawing preview workspace.
- **FR-020**: This planning PR MUST NOT modify runtime code, visible behavior,
  dependencies, upload behavior, storage, backend services, AI calls, parsing,
  or rendering.

### Candidate Issue Shape

A future candidate review item should contain:

- `id`
- `uploaded_drawing_id`
- `ai_review_id`
- related `drawing_ai_observation_ids`
- `title`
- `type`
- `risk_level`
- `confidence`
- `evidence`, including page/region references when available
- `missing_information`
- `suggested_question`
- `suggested_next_step`
- `status`: `needs_review`, `converted`, `dismissed`, or `follow_up`
- optional `converted_issue_id`
- created and updated timestamps

Risk level communicates review priority, not proven severity. Confidence
communicates the system's certainty about its interpretation, not the
probability that a technical defect exists.

### Key Entities

- **`uploaded_drawings`**: The user-provided source artifact and its descriptive
  metadata. It references storage in a future system but does not embed a
  storage implementation in this plan.
- **`ai_reviews`**: A triage run for one uploaded drawing, including queued,
  processing, completed, failed, and cancelled status plus review provenance.
- **`drawing_ai_observations`**: Atomic AI-produced descriptions of visual
  evidence. Observations remain non-authoritative and may support zero, one, or
  multiple candidates.
- **`candidate_issues`**: Human-reviewable interpretations assembled from one or
  more observations. Candidates are not issues.
- **`issues`**: Confirmed product records created only after a human conversion
  decision. Existing ModelScope issue concepts are the future destination, not
  the source of AI authority.
- **`review_decisions`**: Append-oriented records of convert, dismiss,
  follow-up, reopen, or superseding decisions, including actor, time, rationale,
  and links to the affected candidate and resulting issue when applicable.

## UI Implications

- **Upload entry point**: A clear Drawing Triage entry near project review
  workflows, separate from model loading and the viewer adapter.
- **Drawing preview area**: The primary workspace for the selected page or
  image, with visible evidence-region context when a candidate is selected.
- **AI triage panel**: Review status, scope, limitations, and processing state;
  it must not use language that implies confirmed detection.
- **Candidate review list**: Filterable review items with status, risk,
  confidence, and concise missing-information cues.
- **Issue conversion flow**: A deliberate confirmation step where the user can
  edit issue details before creation.
- **Object Inspector or AI Review area**: A possible home for selected candidate
  details and decision actions, provided drawing candidates remain distinct from
  model object properties and existing issues.
- **States**: Purposeful empty, loading, queued, processing, no-candidate,
  partial-result, unsupported, and error presentations.

The recommended information architecture is a dedicated Drawing Triage mode or
artifact context that reuses ModelScope's workspace pattern. It should not
silently mix drawing candidates into the current Open Issues list before human
conversion.

## Backend and API Boundary

A later implementation will need explicit boundaries for:

- file upload authorization, validation, and storage
- uploaded drawing record creation and metadata
- drawing preview or page representation
- AI triage job creation and status retrieval
- observation and candidate generation
- candidate list and detail retrieval
- user review decision submission
- candidate-to-issue conversion
- audit history retrieval

These are planning boundaries only. This feature does not select a storage
provider, database, AI provider, API style, queue technology, or document
processing implementation.

## Safety and Honesty Rules

- Do not claim that AI detected a confirmed construction conflict from a visual
  drawing alone.
- Do not call candidates "clashes" unless a human confirms that classification.
- Show confidence, evidence, and missing information together.
- Keep human review mandatory before issue creation.
- Preserve the source artifact and decision lineage for auditability.
- Explain that visual triage may miss concerns and may generate irrelevant or
  duplicate candidates.
- Present suggested questions and next steps as prompts for professional review,
  not engineering instructions.
- State that ModelScope supports decision-making and does not replace BIM
  coordination expertise.

## Out of Scope

- real upload behavior
- file storage
- backend or database implementation
- AI API calls or provider integration
- real computer vision or inference
- model parsing, IFC processing, or Revit processing
- PDF parsing or production document conversion
- real BIM clash detection
- viewer-adapter changes
- real 3D rendering
- automatic issue creation without human confirmation
- changes to `App.tsx` or visible UI behavior
- packages or runtime source changes

## Success Criteria

### Measurable Outcomes

- **SC-001**: In usability testing of a later prototype, at least 90% of target
  users correctly identify that an AI candidate is not a confirmed issue.
- **SC-002**: At least 90% of target users can complete one of the three primary
  review decisions without assistance.
- **SC-003**: Every converted issue can be traced to one candidate, its source
  observations, its AI review, its uploaded drawing, and its human decision.
- **SC-004**: Every candidate detail view exposes confidence and missing
  information without requiring a secondary hidden interaction.
- **SC-005**: No issue is created from AI triage without an attributable human
  confirmation action.
- **SC-006**: Empty, processing, no-candidate, and failure states each provide a
  clear next action in a later UI review.

## Assumptions

- The primary user is a BIM coordinator or project reviewer with authority to
  decide whether a candidate should enter the issue workflow.
- Authentication, permissions, retention, and storage policies will be defined
  before backend implementation.
- A later prototype may use local mock files and mock candidates before any real
  upload or AI boundary exists.
- Drawing candidates may eventually coexist with model-linked issues, but they
  remain separate records until conversion.
- The current `ReviewIssue` type is not automatically suitable for candidates;
  future domain design should avoid forcing uncertain observations into a
  confirmed-issue shape.

## Acceptance Criteria for a Later UI Implementation PR

1. The implementation uses mock or explicitly local prototype state only.
2. A user can select a mock drawing and see it in a primary preview area.
3. The UI distinguishes observations, candidate issues, and confirmed issues.
4. Every candidate displays risk, confidence, evidence, missing information,
   suggested question, suggested next step, and status.
5. Candidate selection visibly changes the drawing preview context.
6. Convert, dismiss, and follow-up are distinct human actions.
7. Conversion requires confirmation and allows issue details to be reviewed
   before a mock issue is created.
8. No candidate enters Open Issues before conversion.
9. Decision history identifies the action and actor in mock audit data.
10. Empty, processing, no-candidate, unsupported, and error states are present.
11. No-copy language claims confirmed clash detection or guaranteed drawing
    completeness.
12. The UI explicitly states that triage supports, rather than replaces, BIM
    coordination judgment.
13. Existing model workspace behavior remains unchanged unless a separate
    implementation spec authorizes integration changes.
14. No backend, storage, AI inference, parsing, viewer-adapter change, or package
    addition is included.
15. Lint and build validation pass.

