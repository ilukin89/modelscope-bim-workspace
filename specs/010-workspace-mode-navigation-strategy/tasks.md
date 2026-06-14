# Tasks: Workspace Mode Navigation Strategy

## Purpose

This task list records the completed documentation work and a safe sequence for
a separate future navigation implementation PR.

The current PR is planning-only.

## Non-Negotiable Rules

- Do not modify runtime source code in this planning PR.
- Do not modify `src/App.tsx`.
- Do not modify `src/components/layout/TopBar.tsx`.
- Do not add UI implementation or routing.
- Do not add packages.
- Do not add backend, upload, storage, file handling, drawing preview, or AI
  behavior.
- Do not change existing Model Review behavior.
- Do not replace or duplicate the `Workspace / Design` utility switch.

## Phase 1: Planning Setup

- [x] T001 Read the project and constitution context listed in `specs/010-workspace-mode-navigation-strategy/plan.md`.
- [x] T002 Inspect the existing topbar and workspace composition in `src/App.tsx` and `src/components/layout/TopBar.tsx`.
- [x] T003 Inspect responsive viewport and side-panel behavior in `src/features/viewport/Viewport.tsx`, `src/features/model-explorer/ModelExplorer.tsx`, and `src/features/object-inspector/ObjectInspector.tsx`.
- [x] T004 Review Drawing Triage vocabulary and workspace direction in `docs/08-ai-drawing-triage-workflow.md` and `specs/009-ai-drawing-triage-workflow-strategy/spec.md`.

## Phase 2: Foundational Navigation Boundaries

- [x] T005 Define the three navigation levels in `specs/010-workspace-mode-navigation-strategy/spec.md`.
- [x] T006 Define the primary desktop topbar recommendation in `specs/010-workspace-mode-navigation-strategy/plan.md`.
- [x] T007 Define the compact topbar-anchored mobile mode selector in `specs/010-workspace-mode-navigation-strategy/plan.md`.
- [x] T008 Define explicit planning-only exclusions in `specs/010-workspace-mode-navigation-strategy/spec.md`.
- [x] T009 Define light/dark theme-adaptive navigation constraints in `specs/010-workspace-mode-navigation-strategy/spec.md` and `specs/010-workspace-mode-navigation-strategy/plan.md`.
- [x] T010 Define separate mode-navigation and side-panel responsive decisions, four starting breakpoint bands, and unchanged tablet panel widths in `specs/010-workspace-mode-navigation-strategy/spec.md` and `specs/010-workspace-mode-navigation-strategy/plan.md`.

## Phase 3: User Story 1 - Choose a Desktop Mode (Priority: P1)

**Goal**: Make both product modes visible and distinct from prototype utilities.

**Independent Test**: The documentation lets a future implementation place both
mode labels in the topbar center without duplicating the right segmented
control.

- [x] T011 [P] [US1] Define desktop mode placement and hierarchy in `docs/09-workspace-mode-navigation.md`.
- [x] T012 [P] [US1] Define restrained active, inactive, hover, and focus treatment in `docs/09-workspace-mode-navigation.md`.
- [x] T013 [US1] Define topbar collision priorities and responsive fallback in `specs/010-workspace-mode-navigation-strategy/plan.md`.

## Phase 4: User Story 2 - Preserve Model Review (Priority: P1)

**Goal**: Protect all existing Model Review content and interactions.

**Independent Test**: The documentation provides a complete preservation
checklist for current desktop and mobile behavior.

- [x] T014 [P] [US2] Define the Model Review left, center, and right content contract in `specs/010-workspace-mode-navigation-strategy/plan.md`.
- [x] T015 [P] [US2] Record current mobile controls that must remain intact in `docs/09-workspace-mode-navigation.md`.
- [x] T016 [US2] Define future regression acceptance criteria in `specs/010-workspace-mode-navigation-strategy/spec.md`.

## Phase 5: User Story 3 - Enter Drawing Triage (Priority: P2)

**Goal**: Define Drawing Triage as a full workspace composition, not a tab.

**Independent Test**: A future mock can replace all three regions using only the
documented content responsibilities.

- [x] T017 [P] [US3] Define drawing artifact context for the left region in `docs/09-workspace-mode-navigation.md`.
- [x] T018 [P] [US3] Define the dominant 2D preview for the center region in `docs/09-workspace-mode-navigation.md`.
- [x] T019 [P] [US3] Define AI candidate review and decision context for the right region in `docs/09-workspace-mode-navigation.md`.
- [x] T020 [US3] Connect candidate selection to visible preview evidence in `specs/010-workspace-mode-navigation-strategy/spec.md`.

## Phase 6: User Story 4 - Choose a Mobile Mode (Priority: P2)

**Goal**: Provide mode access without crowding the current mobile hierarchy.

**Independent Test**: The documentation specifies one closed active-mode control
and a preferred compact topbar-anchored dropdown or popover containing both
options.

- [x] T021 [P] [US4] Define the active-mode topbar dropdown/popover behavior in `docs/09-workspace-mode-navigation.md`.
- [x] T022 [P] [US4] Define focus, active-state, and overlay-close behavior in `specs/010-workspace-mode-navigation-strategy/plan.md`.
- [x] T023 [US4] Define mobile viewport and side-panel preservation rules in `specs/010-workspace-mode-navigation-strategy/spec.md`.

## Phase 7: Planning Validation

- [x] T024 Run `npm run lint` from the repository root.
- [x] T025 Run `npm run build` from the repository root.
- [x] T026 Confirm the changed-file scope with `git status --short` and verify that only the four permitted documentation files were modified.

## Separate Future PR: Workspace Mode Navigation

These tasks are not authorized in this planning PR.

- [ ] T028 [US1] Add local default `Model Review` mode state in `src/App.tsx`.
- [ ] T029 [US1] Add centered desktop text navigation without changing the utility control in `src/components/layout/TopBar.tsx`.
- [ ] T030 [US4] Add one compact topbar-anchored active-mode dropdown or popover using existing UI primitives in `src/components/layout/TopBar.tsx`.
- [ ] T031 [US2] Preserve the existing Model Review render path and interactions in `src/App.tsx`.
- [ ] T032 [US3] Add a bounded Drawing Triage workspace placeholder that replaces left, center, and right content in `src/App.tsx`.
- [ ] T033 [US1] Add active, hover, focus, and keyboard semantics for workspace modes in `src/components/layout/TopBar.tsx`.
- [ ] T034 [US4] Verify mobile mode selection closes its dropdown or popover and restores focus to the trigger in `src/components/layout/TopBar.tsx`.
- [ ] T035 [US1] Validate the four starting breakpoint bands with the longest project name, visible utility switch, theme toggle, status badges, and both mode labels; collapse before topbar groups overlap in `src/components/layout/TopBar.tsx`.
- [ ] T036 [US2] Regression-test current Model Review desktop and mobile interactions against `specs/010-workspace-mode-navigation-strategy/spec.md`.
- [ ] T037 [US1] Verify theme-adaptive mode styling in light and dark mode without duplicating `Workspace / Design` in `src/components/layout/TopBar.tsx`.
- [ ] T038a [US2] Verify closed side-panel triggers remain available on mobile, compact tablet, and desktop at all supported widths in `src/App.tsx`, `src/features/model-explorer/ModelExplorer.tsx`, and `src/features/object-inspector/ObjectInspector.tsx`.
- [ ] T038b [US2] Verify open mobile modal sheets may use an `X` close button at `680px` or below in `src/App.tsx`, `src/features/model-explorer/ModelExplorer.tsx`, and `src/features/object-inspector/ObjectInspector.tsx`.
- [ ] T038c [US2] Verify open compact-tablet side panels use consistent retract or collapse affordances on both sides at the same breakpoint in `src/App.tsx`, `src/features/model-explorer/ModelExplorer.tsx`, and `src/features/object-inspector/ObjectInspector.tsx`.
- [ ] T038d [US2] Verify current tablet panel widths remain unchanged after navigation is added in `src/App.tsx`, `src/features/model-explorer/ModelExplorer.tsx`, and `src/features/object-inspector/ObjectInspector.tsx`.
- [ ] T038e [US2] Verify AI Review and future Drawing Triage viewport overlays remain inside the central safe area and do not overlap side panels, inspector regions, panel triggers, or primary content at compact desktop, tablet, and mobile widths in `src/App.tsx`, `src/features/viewport/Viewport.tsx`, and future `src/features/drawing-triage/` modules.
- [ ] T039 Run `npm run lint` and `npm run build` from the repository root.

## Separate Future PR: Drawing Triage Workspace Shell

- [ ] T040 [US3] Create a drawing/artifact context panel in a future `src/features/drawing-triage/` module.
- [ ] T041 [US3] Create a purposeful 2D preview empty state in a future `src/features/drawing-triage/` module.
- [ ] T042 [US3] Create an AI candidate review/detail panel with mock content in a future `src/features/drawing-triage/` module.
- [ ] T043 [US3] Connect mock candidate selection to visible preview evidence in a future `src/features/drawing-triage/` module.
- [ ] T044 [US4] Preserve the existing mobile panel positions with mode-appropriate labels in a future `src/features/drawing-triage/` module.

## Dependencies and Execution Order

- Current documentation phases precede validation.
- The future navigation PR may begin after this strategy is approved.
- Desktop and mobile selectors can be developed in parallel after mode state is
  defined.
- Model Review regression verification is required before merging navigation.
- The Drawing Triage shell follows navigation and remains local/mock only.
- Upload, storage, routing, backend, file handling, and AI require separate
  specifications.

## Suggested MVP

The later navigation MVP is:

1. local mode state with `Model Review` as default
2. desktop text navigation in the topbar center
3. mobile active-mode disclosure
4. unchanged Model Review composition
5. a simple three-region Drawing Triage placeholder proving the main workspace
   changes

## Completion Criteria for This Planning PR

- the four requested documentation files exist
- desktop and mobile navigation behavior is unambiguous
- workspace mode collapse and side-panel modality are separate responsive
  decisions with an explicit starting breakpoint matrix
- the mobile mode selector prefers a compact topbar-anchored dropdown or popover
- light and dark theme behavior is explicit and adaptive
- mobile, tablet, and desktop panel affordances distinguish closed triggers from
  open-panel close behavior
- current tablet panel widths are explicitly preserved
- Model Review preservation is explicit
- Drawing Triage has a left, center, and right content contract
- `Workspace / Design` remains secondary and visually distinct
- future acceptance criteria include lint and build
- `npm run lint` succeeds
- `npm run build` succeeds
- no runtime, package, route, backend, upload, storage, file, or AI change is
  included
