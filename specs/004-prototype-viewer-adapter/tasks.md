# Tasks: Prototype Viewer Adapter

## Purpose

This task list breaks the prototype viewer adapter implementation into small, safe steps.

The goal is to implement a prototype adapter that satisfies the existing viewer adapter interface without changing current UI behavior.

## Preconditions

Before implementation, read:

- `.specify/memory/constitution.md`
- `docs/04-viewer-adapter-strategy.md`
- `docs/05-viewer-adapter-contract.md`
- `specs/002-viewer-adapter-boundary/spec.md`
- `specs/002-viewer-adapter-boundary/plan.md`
- `specs/002-viewer-adapter-boundary/tasks.md`
- `specs/003-viewer-adapter-interfaces/spec.md`
- `specs/003-viewer-adapter-interfaces/plan.md`
- `specs/003-viewer-adapter-interfaces/tasks.md`
- `specs/004-prototype-viewer-adapter/spec.md`
- `specs/004-prototype-viewer-adapter/plan.md`

## Non-Negotiable Rules

- Do not add real 3D rendering.
- Do not install Three.js.
- Do not install xeokit.
- Do not install IFC.js.
- Do not install any viewer library.
- Do not add model upload.
- Do not add backend logic.
- Do not add database logic.
- Do not add authentication.
- Do not add permissions.
- Do not add real AI inference.
- Do not replace the current SVG prototype.
- Do not wire the adapter into `Viewport.tsx`.
- Do not modify `Viewport.tsx`.
- Do not modify `ViewportToolbar.tsx`.
- Do not modify `App.tsx`.
- Do not change visible UI behavior.
- Do not change current runtime behavior.

## Phase 1: Inspect Existing Adapter Interfaces

- [ ] Inspect `src/features/viewport/viewer-adapter/types.ts`.
- [ ] Inspect `src/features/viewport/viewer-adapter/ViewerAdapter.ts`.
- [ ] Confirm required methods from `ViewerAdapter`.
- [ ] Confirm required callback types.
- [ ] Confirm neutral ID types.

No files should be changed during inspection.

## Phase 2: Create Prototype Adapter File

Create only this implementation file:

- `src/features/viewport/viewer-adapter/adapters/prototype/PrototypeViewerAdapter.ts`

Do not create real-viewer folders yet.

Do not create renderer folders yet.

Do not create test files unless explicitly requested.

## Phase 3: Implement Prototype Adapter State

The prototype adapter may store internal state for:

- [ ] lifecycle state
- [ ] current model ID
- [ ] active tool
- [ ] camera view
- [ ] selected object ID
- [ ] highlighted object IDs
- [ ] layer visibility
- [ ] current floor ID

The adapter should not own product state such as issue status, issue severity, AI confidence, or review workflow state.

## Phase 4: Implement Adapter Methods

Implement the required `ViewerAdapter` methods with simulated/no-op behavior.

Methods may update internal state and notify registered callbacks.

Required methods include:

- [ ] initialize
- [ ] dispose
- [ ] load model
- [ ] set layer visibility
- [ ] show floor
- [ ] select object
- [ ] highlight object
- [ ] clear selection
- [ ] set active tool
- [ ] set camera view
- [ ] start measurement
- [ ] place comment

No method should render anything.

No method should use DOM, canvas, SVG, WebGL, or external viewer libraries.

## Phase 5: Implement Callback Subscriptions

Implement callback registration and unsubscribe behavior for:

- [ ] object selected
- [ ] camera changed
- [ ] model loaded
- [ ] model load failed
- [ ] measurement completed
- [ ] comment placed
- [ ] layer visibility changed

Callbacks should use existing neutral payload types.

## Phase 6: Validate Isolation

Confirm that the adapter is not imported by:

- [ ] `Viewport.tsx`
- [ ] `ViewportToolbar.tsx`
- [ ] `App.tsx`
- [ ] any existing runtime UI file

The prototype adapter should remain unused for now.

## Phase 7: Build Validation

After implementation:

- [ ] Run `npm run build`.
- [ ] Confirm no dependencies were added.
- [ ] Confirm no UI files were changed.
- [ ] Confirm no runtime behavior changed.
- [ ] Confirm only the allowed adapter implementation file was added.

## Completion Criteria

This task is complete when:

- a prototype adapter implementation exists
- it implements the `ViewerAdapter` interface
- it uses only internal state and callbacks
- it does not render anything
- it is not wired into the current UI
- the app builds successfully
- no dependencies were added
- current UI behavior is unchanged

## Recommended Commit Message

- Add prototype viewer adapter implementation
