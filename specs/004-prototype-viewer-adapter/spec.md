# Spec: Prototype Viewer Adapter

## Feature Name

Prototype Viewer Adapter

## Status

Draft

## Goal

Create a prototype viewer adapter implementation for ModelScope BIM Workspace that follows the existing viewer adapter interfaces without adding real 3D rendering.

This spec introduces a safe runtime bridge between the current viewport prototype and the future viewer-adapter architecture.

## Why This Matters

The previous phase defined TypeScript-only viewer adapter interfaces.

Those interfaces are intentionally unused.

This phase should test whether the adapter contract can support the current prototype behavior without introducing a real 3D viewer, rendering library, backend, or model upload.

The goal is to move one step closer to a scalable viewer architecture while preserving current UI behavior.

## Current Context

The current viewport is still an SVG-based prototype.

`Viewport.tsx` currently owns simulated viewer behavior such as:

- hard-coded building geometry
- layer visibility feedback
- selected object highlight feedback
- floor or section markers
- orbit, pan, measure, and comment visual feedback
- issue and AI finding visual indicators

The project now has TypeScript-only viewer adapter interfaces under:

- `src/features/viewport/viewer-adapter/types.ts`
- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`

This spec defines a prototype implementation path for those interfaces.

## In Scope

This spec may introduce a prototype adapter that implements the existing viewer adapter interface.

The prototype adapter may:

- implement the `ViewerAdapter` interface
- use simple internal state
- expose no-op or simulated command methods
- support callback registration and unsubscribe behavior
- remain independent from React rendering
- avoid viewer library dependencies
- avoid replacing the current SVG prototype

The implementation should be small and safe.

## Out of Scope

This spec must not add:

- real 3D rendering
- Three.js
- xeokit
- IFC.js
- any viewer library
- model upload
- IFC/Revit parsing
- backend storage
- database logic
- authentication
- permissions
- real AI inference
- replacement of the current SVG prototype
- visual UI redesign

This spec must not turn ModelScope into a real BIM viewer.

## Product Rules

The prototype adapter must not own product meaning.

It must not decide:

- issue severity
- issue status
- whether an AI finding is valid
- AI confidence
- review workflow state
- user permissions
- project membership
- backend persistence

Issues and AI findings remain product concepts outside the adapter.

The adapter may only receive and expose neutral viewer-related commands and events.

## Frontend Rules

The first implementation should be isolated.

Preferred future location:

- `src/features/viewport/viewer-adapter/adapters/prototype/PrototypeViewerAdapter.ts`

This implementation should not be wired into `Viewport.tsx` unless a later plan explicitly approves it.

The first batch should not change visible UI behavior.

The first batch should not change current viewport rendering.

The first batch should not require new dependencies.

## Adapter Behavior Direction

The prototype adapter may implement methods such as:

- initialize
- dispose
- loadModel
- setLayerVisibility
- showFloor
- selectObject
- highlightObject
- clearSelection
- setActiveTool
- setCameraView
- startMeasurement
- placeComment
- event subscriptions

Because this is a prototype adapter, many methods may store state or emit callbacks without performing real rendering.

That is acceptable.

The goal is to validate contract shape, not rendering behavior.

## Acceptance Criteria

This spec is complete when:

1. A prototype adapter implementation path is documented.
2. The implementation remains independent from real viewer libraries.
3. No real 3D rendering is added.
4. No UI behavior is changed.
5. The current SVG prototype is not replaced.
6. Product/domain logic remains outside the adapter.
7. The adapter contract can be tested or inspected as a future integration boundary.
8. The implementation remains small and reviewable.

## Implementation Notes

The safest first implementation batch should create the prototype adapter file only.

It should not wire the adapter into the current viewport.

A later phase may decide whether and how to connect the prototype adapter to `Viewport.tsx`.

Any wiring into React should be a separate spec and PR.
