# Tasks: Viewer Adapter Interfaces

## Purpose

This task list breaks the TypeScript-only viewer adapter interface work into small, safe steps.

The goal is to define future viewer adapter contracts without adding runtime behavior.

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
- Do not change visible UI behavior.
- Do not change runtime behavior.

## Phase 1: Create Viewer Adapter Folder

- [ ] Create `src/features/viewport/viewer-adapter/`.
- [ ] Do not create adapter implementation folders yet.
- [ ] Do not create prototype or real-viewer adapter folders yet.

## Phase 2: Define Neutral Types

Create a TypeScript-only types file.

Recommended file:

- `src/features/viewport/viewer-adapter/types.ts`

Define neutral types for:

- [ ] viewer object ID
- [ ] viewer layer ID
- [ ] viewer floor ID
- [ ] viewer model ID
- [ ] viewer camera view
- [ ] viewer active tool
- [ ] viewer highlight kind
- [ ] viewer lifecycle state
- [ ] measurement result
- [ ] comment placement result
- [ ] layer visibility change payload
- [ ] object selection payload

Types must not depend on any viewer library.

## Phase 3: Define Adapter Interface

Create a TypeScript-only adapter interface file.

Recommended file:

- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`

Define method signatures for:

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

The interface must not include runtime implementation.

## Phase 4: Define Event Contracts

Define event/callback types for:

- [ ] object selected
- [ ] camera changed
- [ ] model loaded
- [ ] model load failed
- [ ] measurement completed
- [ ] comment placed
- [ ] layer visibility changed

Events must use neutral IDs and simple payloads.

Events must not expose viewer-library objects.

## Phase 5: Protect Product Boundaries

Confirm the adapter interface does not include:

- [ ] issue severity
- [ ] issue status
- [ ] AI confidence
- [ ] review approval state
- [ ] user permissions
- [ ] project membership
- [ ] backend persistence
- [ ] business rules

Issues and AI findings must remain outside the adapter and reference viewer objects through neutral IDs.

## Phase 6: Validate

After implementation:

- [ ] Run `npm run build`.
- [ ] Confirm no viewer library was installed.
- [ ] Confirm no UI behavior changed.
- [ ] Confirm no runtime viewer behavior was added.
- [ ] Confirm `Viewport.tsx` was not wired to the adapter.
- [ ] Confirm only allowed files were added/changed.

## Completion Criteria

This task is complete when:

- TypeScript-only adapter contracts exist.
- The app builds successfully.
- No runtime behavior changed.
- No viewer library was added.
- No current SVG prototype behavior was replaced.
- Future viewer integration has a clearer code-level contract.

## Recommended Commit Message

- Define viewport viewer adapter interfaces
