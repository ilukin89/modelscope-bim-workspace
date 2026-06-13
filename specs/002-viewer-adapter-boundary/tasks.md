# Tasks: Viewer Adapter Boundary

## Purpose

This task list breaks the viewer-adapter boundary work into safe planning and implementation steps.

The goal is to define a future adapter boundary without adding real 3D rendering.

## Preconditions

Before starting any work, read:

- `.specify/memory/constitution.md`
- `docs/04-viewer-adapter-strategy.md`
- `specs/002-viewer-adapter-boundary/spec.md`
- `specs/002-viewer-adapter-boundary/plan.md`

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
- Do not change visible UI behavior.

## Phase 1: Inspect Current Viewport

- [ ] Inspect `src/features/viewport/Viewport.tsx`.
- [ ] Inspect `src/features/viewport/ViewportToolbar.tsx`.
- [ ] Inspect `src/features/viewport/types.ts`.
- [ ] Identify pure React UI responsibilities.
- [ ] Identify simulated viewer behavior.
- [ ] Identify product/domain references.
- [ ] Identify possible future adapter commands.
- [ ] Identify possible future viewer events.

No files should be changed during this phase.

## Phase 2: Document Current Responsibility Mapping

- [ ] Map hard-coded geometry to future model loading or prototype adapter responsibility.
- [ ] Map SVG rendering to future viewer host or renderer responsibility.
- [ ] Map layer visibility to future adapter command responsibility.
- [ ] Map floor/section behavior to future adapter command responsibility.
- [ ] Map object selection to future adapter command/event responsibility.
- [ ] Map object highlighting to future adapter command responsibility.
- [ ] Map measurement feedback to future measurement command/result responsibility.
- [ ] Map comment marker behavior to future comment placement command/result responsibility.
- [ ] Map camera labels or HUD to UI ownership or adapter state exposure.

## Phase 3: Define Boundary Concepts

- [ ] Define what the React viewport UI should own.
- [ ] Define what the future viewer adapter should own.
- [ ] Define what domain/product data should own.
- [ ] Define how issues reference viewer objects.
- [ ] Define how AI findings reference viewer objects.
- [ ] Confirm that issue and AI finding logic remains outside the viewer adapter.

## Phase 4: Define Conceptual Adapter Contract

- [ ] List conceptual adapter commands.
- [ ] List conceptual adapter events.
- [ ] Identify required neutral IDs, such as object ID, layer ID, floor ID, issue ID, and model ID.
- [ ] Identify what should not be part of the adapter contract.
- [ ] Confirm that no viewer library is selected at this stage.

## Phase 5: Optional TypeScript-Only Interface Planning

This phase is optional and should only happen if explicitly approved later.

- [ ] Decide whether TypeScript-only adapter interfaces should be created.
- [ ] Decide where interface files should live.
- [ ] Confirm that creating interface files will not change runtime behavior.
- [ ] Confirm that creating interface files will not introduce empty or misleading architecture.

No implementation should happen unless separately approved.

## Phase 6: Validation

If this remains documentation-only:

- [ ] Confirm only documentation/spec files changed.
- [ ] Confirm no source code changed.
- [ ] Confirm no dependencies changed.
- [ ] Confirm no viewer libraries were installed.

If a future TypeScript-only interface batch is approved:

- [ ] Run `npm run build`.
- [ ] Confirm no visible UI behavior changed.
- [ ] Confirm no rendering implementation was added.
- [ ] Confirm no packages were installed.

## Completion Criteria

This work is complete when:

- the adapter boundary is documented
- the viewer UI/adapter/domain responsibilities are separated conceptually
- future adapter commands and events are listed conceptually
- real 3D rendering remains out of scope
- no viewer technology is selected prematurely
- the next implementation step can be planned safely

## Recommended Commit Messages

Planning commit:

- Add viewer adapter boundary tasks

Possible future implementation commit, if explicitly approved:

- Define viewport viewer adapter interfaces
