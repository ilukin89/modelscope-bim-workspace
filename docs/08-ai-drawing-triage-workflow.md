# ModelScope BIM Workspace - AI Drawing Triage Workflow

## Purpose

This document defines a future product workflow for reviewing 2D plans,
sketches, screenshots, PDFs, and images with AI assistance.

It is a strategy document only. It does not implement upload, storage, backend
services, AI calls, computer vision, parsing, or UI changes.

## Product Recommendation

Add Drawing Triage as an artifact-centered review workflow inside ModelScope,
not as a static AI card and not as a substitute for clash detection.

The workflow should help a BIM coordinator answer:

- What in this drawing may deserve attention?
- What visual evidence led to that suggestion?
- What information is missing?
- What should I ask or verify next?
- Should this candidate become an issue, be dismissed, or remain a follow-up?

The system organizes uncertain evidence. The human remains responsible for the
coordination decision.

## Why It Belongs in ModelScope

Project coordination does not begin and end with a federated model. Teams
receive early plans, consultant sketches, screenshots, redlines, and PDFs that
may reveal coordination questions before structured model data is available.

ModelScope already explores issue review, object context, AI assistance, and a
viewport-first workspace. Drawing Triage extends that product story to
unstructured 2D inputs while preserving the same core principle: review context
must be visible in the primary workspace and decisions must be explicit.

## What It Is Not

Drawing Triage is not:

- geometric clash detection
- code compliance certification
- drawing approval
- a guarantee that no concerns were missed
- automatic engineering judgment
- automatic issue creation

Real clash detection has structured model geometry, coordinate systems,
tolerances, and discipline relationships. A visual artifact may be cropped,
unscaled, outdated, incomplete, or missing the information needed to prove a
conflict. Drawing Triage can suggest where a person should look; it cannot
confirm a construction conflict from pixels alone.

## Primary User Flow

1. The user enters Drawing Triage and selects a 2D plan, sketch, screenshot,
   PDF, or image.
2. A future service stores the file and creates an `uploaded_drawings` record.
3. The user sees the drawing in a primary preview workspace.
4. The user starts or accepts an AI triage review.
5. An `ai_reviews` record tracks queued, processing, completed, partial, failed,
   or cancelled state.
6. AI processing creates non-authoritative `drawing_ai_observations`.
7. Relevant observations are organized into `candidate_issues`.
8. Candidates appear in a review list, initially as `needs_review`.
9. Selecting a candidate focuses its source page or evidence region in the
   drawing preview.
10. The user reviews evidence, confidence, missing information, suggested
    question, and suggested next step.
11. The user converts the candidate to an issue, dismisses it, or marks it for
    follow-up.
12. The decision is recorded in `review_decisions`.
13. Only a successful human-confirmed conversion creates an `issues` record.

Steps involving storage, processing, and persistence describe a future system.
They are not implemented by this documentation PR.

## Product Vocabulary

### Observation

An AI-generated description of something visible or apparently missing in the
drawing. It is raw review material, not a conclusion.

Example:

> A service route appears to pass through a narrow corridor zone on page 2.

### Candidate Issue

A structured review item derived from one or more observations. It includes
uncertainty and prompts a human decision.

Example:

> Verify whether the proposed service route preserves required corridor
> clearance.

### Issue

A confirmed product record created after a user reviews and converts a
candidate. The user may revise the title, severity, description, assignment, or
other issue details during conversion.

### AI Review

One triage execution against one uploaded drawing. It records status,
provenance, and the set of observations and candidates produced.

### Review Decision

An attributable human action on a candidate: convert, dismiss, follow-up, or a
later superseding action.

## Candidate Issue Shape

| Field | Product meaning |
| --- | --- |
| `title` | Neutral description of what should be reviewed |
| `type` | Review category such as clearance, routing, access, classification, inconsistency, or missing information |
| `risk_level` | Suggested review priority, not confirmed issue severity |
| `confidence` | Confidence in the visual interpretation, not proof of a defect |
| `evidence` | Source page, region, visual cues, and supporting observations |
| `missing_information` | Scale, dimensions, discipline context, specification, model link, or other facts needed |
| `suggested_question` | A question for the responsible coordinator or discipline |
| `suggested_next_step` | A review action, not an engineering instruction |
| `status` | `needs_review`, `converted`, `dismissed`, or `follow_up` |

## Candidate State Model

```text
                    +----------------+
                    |  needs_review  |
                    +----------------+
                       |     |     |
                 convert  dismiss  follow up
                       |     |     |
                       v     v     v
                +---------+ +---------+ +-----------+
                |converted| |dismissed| | follow_up |
                +---------+ +---------+ +-----------+
```

Later workflows may allow a user to reopen or supersede a decision, but they
should append a new `review_decisions` record instead of erasing history.

Conversion must be atomic from the user's perspective: if issue creation fails,
the candidate remains reviewable and must not appear successfully converted.

## Data Relationships

```text
uploaded_drawings
  1 -> many ai_reviews

ai_reviews
  1 -> many drawing_ai_observations
  1 -> many candidate_issues

drawing_ai_observations
  many <-> many candidate_issues

candidate_issues
  1 -> many review_decisions
  0 -> 1 converted issues

issues
  retains source candidate and decision lineage
```

## UI Placement in the Existing Product

### Entry Point

A future Drawing Triage entry should be discoverable from project review
workflows. It should be separate from model loading and should not imply that a
2D artifact becomes a BIM model.

### Primary Preview

The current viewport-first layout is a useful pattern. In Drawing Triage, the
primary workspace becomes a drawing preview:

- image or selected PDF page
- zoom and pan appropriate to 2D review
- selected evidence region
- page and artifact identity
- clear unavailable-preview or unavailable-region state

Candidate selection must create visible feedback here. A highlighted list row
alone is insufficient.

### AI Triage Panel

The panel should show:

- review status
- source artifact
- when the review was generated
- limitations and scope
- candidate counts by review status
- processing or failure guidance

Use "candidate observations" or "items to review," not "detected clashes."

### Candidate Review List

Each row should communicate:

- neutral title
- type
- risk level
- confidence
- status
- page or region reference
- missing-information indicator

Converted candidates may link to confirmed issues. Unconverted candidates must
not appear in the current Open Issues collection.

### Candidate Detail

The Object Inspector and AI Review tab provide useful component patterns for a
future detail panel. However, drawing candidates should not masquerade as
selected BIM objects.

The detail view should prioritize:

1. what the system observed
2. where the evidence is
3. what is uncertain or missing
4. what question could resolve the uncertainty
5. what review action is suggested
6. what decisions have already been made

### Conversion Flow

Conversion should open a deliberate issue draft or confirmation state. The user
reviews and may edit:

- issue title
- issue type
- severity or priority
- description
- responsible discipline or assignee
- due date or follow-up context
- source evidence reference

The AI candidate is provenance, not immutable issue truth.

## Empty, Loading, and Error States

### Empty

Explain that Drawing Triage helps organize possible review questions from 2D
artifacts and that results require professional review. Offer the file-selection
action in a later prototype.

### Queued

State that the review is waiting to begin. Do not show placeholder findings.

### Processing

State that the drawing is being analyzed and that candidates are not available
yet. Preserve access to the source preview where possible.

### Partial

Explain which pages or steps completed and which did not. Candidates from
completed work remain provisional.

### No Candidates

Use language such as:

> No candidate observations were generated. This does not confirm that the
> drawing is complete or free of coordination concerns.

### Unsupported or Invalid File

Explain the unsupported characteristic and offer replacement or manual review.
Do not imply the file was analyzed.

### Failed

Explain that triage did not complete and provide retry or manual-review options.
Do not preserve a stale success state.

## Future API Responsibilities

| Boundary | Responsibility |
| --- | --- |
| Upload | Validate, authorize, and accept the source artifact |
| Storage | Preserve the artifact and controlled access to it |
| Drawing record | Store metadata and storage reference |
| Triage job | Start work and expose reliable status |
| Observations | Return atomic visual evidence with provenance |
| Candidates | Return structured review items and status |
| Decisions | Record attributable human actions and rationale |
| Conversion | Create an issue and link complete lineage |
| Audit | Retrieve immutable or append-oriented review history |

The API should never expose a candidate as if it were already an issue merely
because its confidence is high.

## Safety and Honesty Checklist

- AI output is provisional.
- Candidate language is neutral and review-oriented.
- Confidence and missing information are both visible.
- "Clash" is not used without human confirmation or real clash evidence.
- Zero candidates is not a clean bill of health.
- Human confirmation is required before issue creation.
- Dismissal and follow-up remain auditable.
- Converted issues retain source evidence.
- Suggested actions are not presented as professional engineering instructions.
- The product states that BIM coordination expertise remains necessary.

## Future Implementation Sequence

1. Documentation and vocabulary only.
2. Fake upload UI with mock file state.
3. Local drawing preview prototype.
4. Mock AI review states and candidate generation.
5. Local candidate-to-issue decisions and audit history.
6. Dedicated backend, storage, permissions, privacy, and API specification.
7. Real AI evaluation and integration only after the UX proves understandable
   and useful.

This sequence deliberately validates the decision workflow before investing in
infrastructure or model capability.

## Acceptance Criteria for a Later Prototype

- A local mock drawing can be selected and previewed.
- Candidate selection visibly focuses drawing evidence.
- Observations, candidates, and issues use distinct labels and data.
- Every candidate shows evidence, uncertainty, and missing information.
- Convert, dismiss, and follow-up actions are available and distinct.
- Conversion requires human confirmation and creates only a mock issue.
- Candidates remain outside Open Issues until conversion.
- Review decisions appear in an audit history.
- Empty, queued, processing, partial, no-candidate, unsupported, and failed
  states are demonstrable.
- The interface never claims visual AI has confirmed a clash.
- Existing workspace behavior remains intact.
- No backend, storage, real AI, parsing, real clash detection, viewer-adapter
  change, or package addition is included.

## Explicit Out of Scope

- real upload and storage
- backend and database code
- AI APIs and inference
- OCR, PDF parsing, computer vision, or document conversion
- IFC/Revit processing
- real BIM clash detection
- real 3D rendering
- viewer-adapter modification
- automatic issue creation
- runtime UI changes in this planning PR

