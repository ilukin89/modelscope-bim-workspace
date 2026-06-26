# ModelScope BIM Workspace

ModelScope is a small code-first UI prototype for a professional BIM / 3D model review workspace. It is intentionally a product interface prototype, not a BIM renderer or model-processing engine.

[![Slika-zaslona-2026-06-26-u-14-37-40.png](https://i.postimg.cc/SsLyg6Dw/Slika-zaslona-2026-06-26-u-14-37-40.png)](https://postimg.cc/BL696KWg)
[![Slika-zaslona-2026-06-26-u-14-38-41.png](https://i.postimg.cc/g08d0yF6/Slika-zaslona-2026-06-26-u-14-38-41.png)](https://postimg.cc/TydB7DPR)
_Drawing Triage workspace with a sample 2D floor plan, candidate review markers, and human-in-the-loop AI observation cards._
<br>

**Live demo:** https://modelscope-bim-workspace.vercel.app/ <br><br>
**Code:** https://github.com/ilukin89/modelscope-bim-workspace
<br><br>

# ModelScope BIM Workspace

ModelScope is a **viewport-first BIM review prototype** focused on **AI-assisted review workflows** for model and drawing coordination.

It explores two connected review modes:

- **Model Review** — reviewing AI findings in a model-oriented workspace
- **Drawing Triage** — reviewing AI-generated observations on 2D drawing sheets

The core product principle is:

> **AI suggests. A human decides.**
> AI findings and candidates are never silently promoted into confirmed issues.

---

## Current Status

ModelScope is currently a **frontend-only product prototype** built with local state.

It demonstrates:

- AI-assisted review workflows
- human-in-the-loop decision-making
- issue creation from AI findings/candidates
- issue traceability
- lightweight issue outcome handling
- responsive BIM-style workspace UI
- prototype honesty around mocked capabilities

It does **not** currently include:

- real IFC upload
- real BIM parsing
- real geometry loading
- backend persistence
- real user accounts or permissions
- real AI detection
- team collaboration
- production-grade issue management

These limitations are intentional. The project is designed as a credible product prototype, not as a fake full BIM platform.

---

## Why This Project Exists

Many AI product demos make the same mistake:

- AI appears “smart”
- the UI looks polished
- but the workflow is fake

ModelScope focuses on the workflow around AI, not just the AI moment itself.

The project asks:

- What happens after AI finds something?
- Who decides whether it becomes an issue?
- How does the user trace an issue back to its source?
- What happens if an issue is blocked, not actionable, or removed?
- How does the viewport respond to user actions?

ModelScope is designed around those product questions.

---

## Core Product Idea

ModelScope is built around a simple review loop:

```txt
AI finding / candidate
→ human review
→ visible context
→ explicit decision
→ issue tracking
→ source traceability
```

AI output stays provisional until the reviewer acts.

---

## Main Workflows

### Model Review

The Model Review workflow lets the user inspect AI findings in a model-oriented workspace.

Current flow:

```txt
Select project
→ navigate model
→ inspect object
→ run AI scan
→ review AI findings
→ preview proposed change
→ create issue
→ manage issue outcome
→ return to model context
```

Implemented Model Review behaviors include:

- project-based workspace entry
- floor and layer navigation
- object inspection
- AI Review panel
- AI finding selection
- viewport markers and highlighting
- preview change flow
- issue creation from AI findings
- issue traceability through `sourceFindingId`
- issue history entries
- `View in model`
- `View issue details`
- issue lifecycle and outcome handling

---

### Drawing Triage

The Drawing Triage workflow lets the user review AI-generated observations on 2D drawings.

Current flow:

```txt
Enter Drawing Triage
→ load/select drawing
→ select sheet
→ run triage
→ review candidates
→ convert to issue / dismiss / mark follow-up
→ track created issues
→ return to source region on sheet
```

Implemented Drawing Triage behaviors include:

- supported-project entry gate
- sample drawing / mock file flow
- sheet selection
- triage scanning state
- candidate review queue
- candidate type filters:
  - Clearance
  - Annotation
  - Coordination

- candidate selection
- region/source highlighting
- convert to issue
- dismiss
- follow-up flag
- compact Created issues sub-view
- `View on sheet` source traceability

---

## UX Flow Map

```mermaid
flowchart TD

  %% =========================
  %% MODEL REVIEW
  %% =========================
  subgraph MR[Model Review]
    MR1[Workspace entry<br/>Select project · workspaceMode = model-review]
    MR2[Navigate model<br/>Floors · layers · explorer · viewport]
    MR3[Inspect object<br/>Properties · Issues · AI Review · History]
    MR4[AI scan<br/>scanning → scanned_with_findings]
    MR5[Findings + markers<br/>AI findings list · viewport markers]
    MR6[Select finding<br/>confidence · suggestion · source context]
    MR7[Preview change<br/>visible proposed change in viewport]
    MR1 --> MR2 --> MR3 --> MR4 --> MR5 --> MR6 --> MR7
  end

  %% =========================
  %% DRAWING TRIAGE
  %% =========================
  subgraph DT[Drawing Triage]
    DT1[Entry gate<br/>Mode switch · supported project guard]
    DT2[Load drawing<br/>Sample drawing or mock file]
    DT3[Select sheet<br/>Level 01 · Level 02 · Roof]
    DT4[Run triage<br/>scanning → review]
    DT5[Candidate queue<br/>Clearance · Annotation · Coordination]
    DT6[Select candidate<br/>confidence · region · review priority]
    DT7[Created issues sub-view<br/>Review candidates / Created issues]
    DT1 --> DT2 --> DT3 --> DT4 --> DT5 --> DT6 --> DT7
  end

  %% =========================
  %% HUMAN DECISION GATE
  %% =========================
  GATE[Human decision gate<br/>AI suggests → reviewer decides<br/>No silent promotion]

  MR7 --> GATE
  DT6 --> GATE

  GATE --> ACT1[Create issue]
  GATE --> ACT2[Follow-up]
  GATE --> ACT3[Dismiss]

  %% =========================
  %% MODEL REVIEW ISSUE FLOW
  %% =========================
  subgraph MRO[Model Review issue flow]
    MRO1[Issue created<br/>Appears in Issues tab]
    MRO2[Traceability<br/>sourceFindingId preserved]
    MRO3[Viewport actions<br/>View in model · Hide from model]
    MRO4[Issue details focus<br/>View issue details]
    MRO5[Lifecycle<br/>Open → In Review → Resolved]
    MRO6[Additional outcomes<br/>Blocked · Closed as not actionable]
    MRO7[Recovery actions<br/>Reopen · Return to review]
    MRO8[Remove issue<br/>Local tracker cleanup]
    MRO9[History events<br/>Key actions recorded]
    MRO1 --> MRO2 --> MRO3 --> MRO4 --> MRO5
    MRO5 --> MRO6
    MRO6 --> MRO7
    MRO7 --> MRO8
    MRO8 --> MRO9
  end

  ACT1 --> MRO1

  %% =========================
  %% DRAWING TRIAGE ISSUE FLOW
  %% =========================
  subgraph DTO[Drawing Triage issue flow]
    DTO1[Issue created<br/>Appears in Created issues sub-view]
    DTO2[Source traceability<br/>Candidate remains linked]
    DTO3[View on sheet<br/>Returns to source region]
    DTO4[Follow-up flag<br/>Lightweight review marker]
    DTO5[Local created issue tracker<br/>Compact cards]
    DTO1 --> DTO2 --> DTO3 --> DTO4 --> DTO5
  end

  ACT1 --> DTO1
  ACT2 --> DTO4
  ACT3 --> DTO5

  %% =========================
  %% ARCHITECTURE / PRODUCT CONSTRAINTS
  %% =========================
  subgraph ENG[Architecture / Product constraints]
    ENG1[ReviewIssue ≠ ModelReviewIssue<br/>Explicit promotion required]
    ENG2[State scoped per project<br/>Record<ProjectId, ProjectAiReviewState>]
    ENG3[Drawing Triage session persistence<br/>sessionStorage]
    ENG4[Viewport consequence principle<br/>User actions should produce visible feedback]
    ENG5[Prototype honesty<br/>No fake real BIM / IFC claims]
  end
```

---

## Human-in-the-Loop Review

ModelScope separates AI output from confirmed issues.

### AI output

AI findings and candidates are treated as review inputs.

They may include:

- confidence
- source context
- viewport or drawing location
- suggested action
- review priority

### Human decision

Only the reviewer can decide whether an AI output becomes an issue.

The reviewer can:

- create an issue
- dismiss the finding/candidate
- mark it for follow-up
- preview the proposed change before acting

This prevents the UI from implying that AI output is automatically true.

---

## Model Review Issue Flow

Model Review issues are created from AI findings.

Each issue preserves traceability back to the AI source finding.

```txt
AI finding
→ Create issue
→ Issues tab
→ View in model
→ Status / outcome action
→ History entry
```

### Current issue lifecycle

```txt
Open
→ In Review
→ Resolved
```

### Additional issue outcomes

ModelScope also supports lightweight issue outcomes:

```txt
Blocked
Closed as not actionable
Reopen issue
Return to review
Remove issue
```

These outcomes make the flow more realistic without turning the prototype into a full issue-management system.

---

## Drawing Triage Issue Flow

Drawing Triage issues are created from drawing candidates.

The flow is intentionally lighter than Model Review issue management.

```txt
AI candidate
→ human review
→ convert to issue / dismiss / follow-up
→ Created issues sub-view
→ View on sheet
```

Created Drawing Triage issues preserve the source candidate and allow the reviewer to return to the exact sheet context.

---

## Product Principles

### 1. AI is not the source of truth

AI findings are provisional. The reviewer decides what becomes actionable.

### 2. No silent promotion

A candidate or finding cannot become an issue automatically. Issue creation is always explicit.

### 3. Every action needs a visible consequence

If the UI offers an action, the user should see a result in the viewport, sheet, inspector, issue list, or history.

### 4. Prototype honesty matters

The project does not claim to support real IFC, real BIM parsing, or real AI detection.

Mocked interactions are allowed. Fake capability claims are not.

### 5. Lightweight issue tracking beats fake enterprise bloat

ModelScope is not trying to recreate Jira, Revizto, or a full coordination platform.

The goal is to demonstrate a believable review workflow with the right level of complexity.

---

## Architecture Notes

ModelScope uses frontend architecture boundaries to keep the prototype maintainable.

### Viewer boundary

The viewport visualizes product state, but it should not own product workflow logic.

The intended direction is:

```txt
UI state / workflow logic
→ viewer adapter boundary
→ viewport visualization
```

This keeps issue lifecycle logic separate from rendering concerns.

---

### Type separation

The project separates AI findings from confirmed issues.

```txt
ReviewIssue
≠
ModelReviewIssue
```

A `ReviewIssue` represents an AI finding or review candidate.

A `ModelReviewIssue` represents a confirmed issue created by the reviewer.

This prevents accidental silent promotion of AI output into tracked issues.

---

### State scoped per project

Model Review state is scoped per project.

```txt
Record<ProjectId, ProjectAiReviewState>
```

This allows project-specific review work to remain isolated instead of collapsing into one global state.

---

### Drawing Triage session persistence

Drawing Triage uses session persistence to preserve review progress during a browser session.

This makes the prototype feel more credible without introducing backend complexity too early.

---

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide icons

---

## Local Development

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## Project Structure

```txt
src/
  components/
  data/
  features/
    drawing-triage/
    object-inspector/
    viewport/
  hooks/
  lib/
  types.ts
```

The project is organized by product feature area instead of treating the app as a flat UI playground.

---

## What This Prototype Demonstrates

ModelScope is strongest as a portfolio project for:

- B2B SaaS UX
- AI-assisted workflow design
- human-in-the-loop product logic
- stateful interaction design
- viewport-first interface design
- issue traceability
- frontend architecture discipline
- honest prototype scoping

---

## What This Prototype Does Not Yet Solve

ModelScope does not currently solve:

- real IFC upload
- real model parsing
- real object picking from BIM data
- backend persistence
- real user accounts
- permissions / roles
- team collaboration
- real AI inference
- production-grade issue management
- notifications or workflow automation

These are future layers, not hidden assumptions.

---

## Next Likely Directions

Possible next steps:

- improve viewport visual fidelity
- add a controlled Three.js mock viewer behind a renderer mode flag
- preserve the SVG renderer as fallback
- document Three.js renderer boundaries before adding dependencies
- add lightweight backend persistence later
- keep issue management focused and avoid unnecessary enterprise bloat

---

## Portfolio Framing

ModelScope is not meant to show only polished UI screens.

It is meant to show:

- how AI-assisted review should behave in a real product
- how human judgment and traceability can be preserved
- how issue workflows can stay lightweight but credible
- how a prototype can be honest about mocked capabilities
- how product logic, UI hierarchy, and code structure can evolve together

---
