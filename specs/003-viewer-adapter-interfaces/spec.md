# Spec: Viewer Adapter Interfaces

## Feature Name

Viewer Adapter Interfaces

## Status

Draft

## Goal

Define TypeScript-only viewer adapter interfaces for ModelScope BIM Workspace.

This spec creates the first implementation-level boundary between the React viewport UI and a future viewer engine.

This work must not add real 3D rendering.

## Why This Matters

The previous viewer-adapter planning documents defined why a neutral adapter boundary is needed.

This spec turns that planning into lightweight TypeScript contracts.

The goal is to make future viewer integration safer by defining:

- adapter commands
- adapter events
- neutral viewer IDs
- viewer lifecycle methods
- object selection and highlight boundaries
- layer and floor visibility boundaries
- measurement and comment interaction boundaries

This should happen before choosing or installing any viewer library.

## Current Context

The current viewport is still an SVG-based prototype.

`Viewport.tsx` currently owns both React UI and simulated viewer behavior.

The project should not add a real viewer directly into `Viewport.tsx`.

A TypeScript-only adapter interface allows the project to define future integration boundaries without changing runtime behavior.

## In Scope

This spec may add TypeScript-only interface files under a future viewer-adapter folder.

Possible files:

- `src/features/viewport/viewer-adapter/types.ts`
- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`

The implementation may define:

- neutral ID types
- viewer adapter command methods
- viewer adapter event callback types
- lifecycle methods such as initialize and dispose
- selection/highlight method signatures
- layer/floor visibility method signatures
- measurement/comment method signatures

This spec may add comments explaining that the interfaces are future-facing and currently unused.

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
- runtime viewer implementation
- replacement of the current SVG prototype

This spec must not change visible UI behavior.

## Product Rules

The viewer adapter must not own product meaning.

The adapter should receive neutral commands from UI/product state and execute viewer behavior.

The adapter must not decide:

- whether something is an issue
- issue severity
- issue status
- whether an AI finding is valid
- AI confidence
- review workflow state
- user permissions
- project membership

Product/domain logic remains outside the viewer adapter.

## Frontend Rules

The adapter interfaces should be TypeScript-only.

They should not introduce runtime behavior.

They should not be wired into `Viewport.tsx` yet unless a later task explicitly allows it.

No package should be installed.

No current component should be visually changed.

No current SVG prototype behavior should be replaced.

## Suggested Interface Concepts

The interface may include lifecycle methods such as:

- initialize
- dispose
- load model

The interface may include viewer commands such as:

- set layer visibility
- show floor
- select object
- highlight object
- clear selection
- set active tool
- set camera view
- start measurement
- place comment

The interface may include event hooks such as:

- object selected
- camera changed
- model loaded
- model load failed
- measurement completed
- comment placed
- layer visibility changed

## Acceptance Criteria

This spec is complete when:

1. TypeScript-only viewer adapter interfaces are defined.
2. No real rendering implementation is added.
3. No viewer library is installed.
4. No runtime behavior changes.
5. No UI behavior changes.
6. Product/domain ownership remains outside the adapter.
7. The interfaces can support a future prototype adapter or real viewer adapter.
8. The implementation remains small and reviewable.

## Implementation Notes

The first implementation should be limited to interface/type files only.

The implementation should not wire the adapter into `Viewport.tsx`.

If a future PR wires a prototype adapter into the viewport, that should be a separate spec and PR.

This spec should remain focused on defining the contract, not using it.
