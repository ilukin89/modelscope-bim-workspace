# Plan: AI Drawing Triage Workflow Strategy

## Purpose

This plan defines documentation-only product and architecture boundaries for a
future AI-assisted review workflow for 2D plans, sketches, screenshots, PDFs,
and images.

No runtime behavior is implemented in this phase.

## Documents and Source Reviewed

- `README.md`
- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/06-viewport-adapter-wiring-plan.md`
- `specs/005-viewport-adapter-wiring-plan/spec.md`
- `src/App.tsx`
- `src/types.ts`
- `src/features/viewport/Viewport.tsx`
- `src/features/object-inspector/ObjectInspector.tsx`
- `src/features/model-explorer/ModelExplorer.tsx`

## Summary

Define Drawing Triage as a distinct, human-in-the-loop product workflow:

```text
uploaded drawing
  -> AI review
  -> visual observations
  -> candidate issues
  -> human review decision
  -> optional confirmed issue
```

The strategy keeps AI output provisional, separates drawing interpretation from
real model-based clash detection, and establishes a future UI, data, and API
boundary without selecting or implementing infrastructure.

## Current Product Context

ModelScope currently presents:

- a viewport-first workspace
- model navigation through Model Explorer
- selected issue context in the viewport and Object Inspector
- an AI Review tab and findings control backed by local mock issue data
- shared `ReviewIssue` records that already look confirmed

That existing mock demonstrates UI interaction, but it collapses AI suggestion,
technical finding, and issue concepts into one shape. Some current copy, such as
"Clash detected," is too authoritative for a future workflow based only on a
visual 2D artifact.

The strategy does not change that runtime behavior in this PR. It defines the
safer future model.

## Planning Decisions

### 1. Make Drawing Triage an Artifact-Centered Workflow

The drawing or PDF page is the primary review context. Selecting a candidate
must visibly connect its evidence to the preview, consistent with the
constitution's viewport-as-source-of-truth principle.

Drawing Triage should use the existing workspace grammar without pretending the
artifact is a BIM model. It may become a dedicated mode, route, or artifact
workspace in a later spec.

### 2. Separate Observations, Candidates, and Issues

- An observation describes visual evidence produced by an AI review.
- A candidate issue organizes observations into a human-reviewable prompt.
- An issue is created only after a human confirms conversion.

This separation prevents `ReviewIssue` from becoming a catch-all for uncertain
AI output.

### 3. Treat Confidence as One Review Signal

Confidence must appear alongside evidence and missing information. It must not
drive automatic conversion, imply engineering correctness, or replace a
professional risk judgment.

### 4. Preserve Human Decision Auditability

Convert, dismiss, and follow-up actions create review decisions. Decisions
should be append-oriented so later changes do not erase who made the earlier
judgment or why.

### 5. Keep Viewer and Drawing Boundaries Separate

The existing viewer adapter is for neutral 3D viewer execution. File upload,
drawing preview generation, AI triage, candidate state, and issue conversion do
not belong in that adapter.

## Future Data Concept Plan

| Concept | Responsibility | Key relationship |
| --- | --- | --- |
| `uploaded_drawings` | Source artifact metadata and future storage reference | belongs to a project; has many reviews |
| `ai_reviews` | One triage execution and its status/provenance | belongs to one drawing |
| `drawing_ai_observations` | Atomic, non-authoritative visual evidence | belongs to one review |
| `candidate_issues` | Reviewable interpretation of observations | belongs to one review and drawing |
| `review_decisions` | Human action and rationale | belongs to one candidate and actor |
| `issues` | Confirmed coordination record | optionally linked from a converted candidate |

The future model should preserve lineage:

```text
issue
  -> converted candidate
  -> source observations
  -> AI review
  -> uploaded drawing and page/region
  -> human conversion decision
```

## Future UI Structure

### Upload Entry Point

- Introduce a clear Drawing Triage action in a future implementation.
- Explain supported prototype formats and limitations.
- Do not reuse model upload language or imply IFC/Revit processing.

### Drawing Preview Workspace

- Keep the drawing or selected PDF page in the primary workspace.
- Show candidate evidence regions when coordinates are available.
- Provide page navigation for future multi-page artifacts.
- Explain when no reliable evidence region exists.

### AI Triage Panel

- Show queued, processing, completed, partial, failed, or cancelled state.
- State that results are candidates for human review.
- Show limitations before and after processing.

### Candidate Review List

- Separate `needs_review`, `follow_up`, `converted`, and `dismissed`.
- Show risk and confidence without conflating either with confirmed severity.
- Keep converted items traceable to their issues.

### Candidate Detail and Decision Area

The existing Object Inspector or AI Review area provides useful layout patterns,
but a future implementation must avoid showing drawing-only data as BIM object
properties. Candidate detail should include:

- evidence
- missing information
- suggested question
- suggested next step
- source page/region
- review history
- convert, dismiss, and follow-up actions

### Issue Conversion

- Require explicit confirmation.
- Allow title, type, priority/severity, description, and ownership fields to be
  reviewed before issue creation.
- Preserve candidate wording as provenance, not unquestioned issue truth.
- Keep the candidate and decision history after conversion.

## Future Backend and API Boundary

The later system boundary may expose operations for:

1. authorizing and uploading a file
2. creating an uploaded drawing record
3. obtaining a drawing/page preview
4. starting a triage review
5. reading triage job status
6. reading observations and candidates
7. submitting a review decision
8. converting a candidate into an issue
9. reading audit history

Important transaction rule: a candidate should become `converted` only when the
issue record and conversion decision have been successfully recorded together.

This plan does not choose REST, GraphQL, storage, database, queue, OCR, computer
vision, document conversion, or AI technologies.

## Safety Review

Every later implementation phase must verify:

- AI output is called an observation or candidate.
- "Clash" is reserved for human-confirmed classification or real clash data.
- Confidence is visible but not treated as a decision.
- Missing information is explicit.
- No automatic issue creation exists.
- Human decisions are attributable and auditable.
- Zero candidates does not mean zero problems.
- Suggested next steps do not read as engineering instructions.

## Constitution Check

- **Spec-driven development**: Pass. Product goal, workflow, domain concepts,
  exclusions, and later acceptance criteria are documented before implementation.
- **Viewport as source of truth**: Pass. Candidate selection must affect the
  primary drawing preview rather than only a side-panel row.
- **Prototype honesty**: Pass. No upload, storage, backend, parsing, inference,
  or clash detection is implemented or implied.
- **Separation of concerns**: Pass. Product, UX, frontend, backend, AI, issue,
  and viewer responsibilities are separated.
- **Controlled AI assistance**: Pass. Human review is mandatory and AI output is
  explicitly provisional.

No constitution exception is required.

## Future Implementation Phases

### Phase 0: Documentation and Specification

Deliver this strategy, vocabulary, workflow, safety rules, entities, boundaries,
and later implementation criteria.

### Phase 1: Fake Upload UI with Mock File State

Add an intentionally fake/local file-selection experience and mock uploaded
drawing metadata. Do not upload, store, or process files.

### Phase 2: Local Drawing Preview Prototype

Preview a local image or browser-supported PDF approach within a bounded
prototype. Validate navigation, evidence focus, responsive behavior, and
accessibility before introducing services.

### Phase 3: Mock AI Candidate Generation

Use clearly labeled fixtures to simulate queued, processing, completed,
no-candidate, and failed triage outcomes. Validate language and candidate
comprehension.

### Phase 4: Candidate-to-Issue Interaction

Add local convert, dismiss, follow-up, and audit-history interactions. Require a
confirmation/edit step before mock issue creation.

### Phase 5: Backend and Storage Boundary

Specify authentication, authorization, retention, file constraints, storage,
job status, persistence, API contracts, transaction rules, and audit behavior.
This phase should remain provider-neutral until requirements justify choices.

### Phase 6: Real AI Triage Integration

Consider real AI only after usability testing validates the workflow and users
understand candidates correctly. Begin with controlled evaluation, known test
artifacts, quality measurement, privacy review, failure controls, and no
automatic issue creation.

## Validation Strategy for Later UI Work

A later implementation PR should be evaluated by:

- terminology review for unsafe or overstated claims
- user-flow testing from artifact selection to review decision
- state coverage for empty, loading, success, no-candidate, and failure cases
- visible preview response when candidate selection changes
- verification that candidates do not enter Open Issues before conversion
- audit-lineage checks for converted mock issues
- responsive and keyboard-access review
- lint and production build

## Files in This Planning Phase

Create only:

- `specs/009-ai-drawing-triage-workflow-strategy/spec.md`
- `specs/009-ai-drawing-triage-workflow-strategy/plan.md`
- `specs/009-ai-drawing-triage-workflow-strategy/tasks.md`
- `docs/08-ai-drawing-triage-workflow.md`

## Explicit Out of Scope

- runtime source changes
- `App.tsx` changes
- visible UI behavior changes
- upload or file storage
- backend, database, or API implementation
- AI API calls or real inference
- OCR, computer vision, PDF parsing, or page conversion
- IFC/Revit parsing
- real BIM clash detection
- real 3D rendering
- viewer-adapter changes
- packages

## Expected Result

The repository gains an implementation-ready product strategy that makes
Drawing Triage more credible than a static AI mock while keeping every AI output
subject to professional human review.

## Recommended Commit Message

```text
Add AI drawing triage workflow strategy
```

