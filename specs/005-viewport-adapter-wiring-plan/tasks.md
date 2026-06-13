# Tasks: Viewport Adapter Wiring Plan

## Purpose

This task list records the completed planning work and the bounded tasks for a
separate future wiring PR.

The current PR is documentation-only.

## Non-Negotiable Rules

- Do not modify runtime source code in this planning phase.
- Do not wire the adapter into `Viewport.tsx`.
- Do not modify `App.tsx`.
- Do not add packages.
- Do not change visible UI behavior.
- Do not rename existing public types or adapter methods.
- Do not remove or replace the current simulated viewport.
- Do not add canvas, renderer changes, real 3D, upload, backend, auth,
  persistence, or AI inference.

## Phase 1: Current-State Inspection

- [x] T001 Read the project constitution and existing adapter strategy documents.
- [x] T002 Inspect `src/features/viewport/Viewport.tsx` UI and SVG simulation responsibilities.
- [x] T003 Inspect `src/features/viewport/ViewportToolbar.tsx` and `src/features/viewport/types.ts`.
- [x] T004 Inspect the `ViewerAdapter` interface and neutral viewer types.
- [x] T005 Inspect `PrototypeViewerAdapter` lifecycle, state, callbacks, and disposal behavior.
- [x] T006 Confirm current React ownership of tool, layers, floor, and selected issue state.

## Phase 2: Planning Artifacts

- [x] T007 Document current UI-owned responsibilities in `specs/005-viewport-adapter-wiring-plan/spec.md`.
- [x] T008 Document simulated viewer responsibilities that may later move behind the adapter.
- [x] T009 Map existing UI actions to existing `ViewerAdapter` methods.
- [x] T010 Map adapter events to valid React state destinations or explicit deferrals.
- [x] T011 Define lifecycle creation, initialization, subscription, cleanup, and disposal rules.
- [x] T012 Define state authority and anti-duplication rules.
- [x] T013 Document wiring risks and the smallest safe future batch.
- [x] T014 Add explicit exclusions and later wiring acceptance criteria.
- [x] T015 Add the implementation-oriented strategy in `docs/06-viewport-adapter-wiring-plan.md`.

## Phase 3: Planning Validation

- [x] T016 Run `npm run build`.
- [x] T017 Confirm only the four requested documentation files changed.
- [x] T018 Confirm no package or runtime source file changed.

## Separate Future PR: Lifecycle Bridge

These tasks are not authorized in this planning PR.

- [ ] F001 Add a viewport-owned host ref without changing visible markup or behavior.
- [ ] F002 Add a small lifecycle bridge for `PrototypeViewerAdapter`.
- [ ] F003 Create one adapter per mounted host lifecycle.
- [ ] F004 Register required subscriptions before initial synchronization.
- [ ] F005 Initialize only after the host element exists.
- [ ] F006 Unsubscribe callbacks and dispose the adapter on cleanup.
- [ ] F007 Guard async initialization against post-disposal work.
- [ ] F008 Verify React development remount behavior does not leak adapters.

## Separate Future PR: One-Way Command Synchronization

- [ ] F009 Add an explicit `ViewportTool` to `ViewerActiveTool` mapping.
- [ ] F010 Synchronize `activeTool` through `setActiveTool()`.
- [ ] F011 Synchronize `selectedFloor` through `showFloor()`.
- [ ] F012 Synchronize every known layer through `setLayerVisibility()`, including hidden layers.
- [ ] F013 Resolve `selectedIssue.details.objectId` before selection/highlight commands.
- [ ] F014 Synchronize selected issue intent without casting prototype `HighlightKind`.
- [ ] F015 Keep the existing SVG as the visible renderer.
- [ ] F016 Defer `loadModel()` until a stable neutral model ID exists.
- [ ] F017 Defer clear-selection, camera, measurement, and comment workflows until their UI inputs exist.

## Separate Future PR: Adapter Events

Do not start these tasks until the React state destinations and loop rules are
explicit.

- [ ] F018 Define known, unknown, and null object-selection behavior.
- [ ] F019 Add a parent-facing selection callback only if product state can represent the event.
- [ ] F020 Add layer event reconciliation only with explicit loop prevention.
- [ ] F021 Add camera HUD updates only if the fixed HUD becomes real viewer state.
- [ ] F022 Add measurement result UI without adding persistence.
- [ ] F023 Add pending comment placement UI without adding backend workflow.
- [ ] F024 Add model load readiness/error UI only with a real neutral model input.

## Separate Future PR: Tests and Validation

- [ ] F025 Test initialization and cleanup.
- [ ] F026 Test all tool translations.
- [ ] F027 Test initial and changed floor, layer, and selected object commands.
- [ ] F028 Test hidden layer synchronization.
- [ ] F029 Test rerender and development remount behavior.
- [ ] F030 Test that command/event synchronization cannot loop.
- [ ] F031 Run `npm run build`.
- [ ] F032 Confirm no visible behavior, dependencies, or renderer changed.

## Completion Criteria for This Planning PR

- the four requested documentation files exist
- all ten requested planning topics are covered
- future tasks are small, ordered, and explicitly separate from this PR
- no source or package files changed
- `npm run build` succeeds
