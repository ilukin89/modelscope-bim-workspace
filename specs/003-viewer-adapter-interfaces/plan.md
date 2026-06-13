# Plan: Viewer Adapter Interfaces

## Purpose

This plan defines how to add TypeScript-only viewer adapter interfaces for ModelScope BIM Workspace.

The goal is to create a small, safe contract layer for future viewer integration without adding real rendering or changing runtime behavior.

## Documents to Read First

Before implementation, read:

- `.specify/memory/constitution.md`
- `docs/04-viewer-adapter-strategy.md`
- `docs/05-viewer-adapter-contract.md`
- `specs/002-viewer-adapter-boundary/spec.md`
- `specs/002-viewer-adapter-boundary/plan.md`
- `specs/002-viewer-adapter-boundary/tasks.md`
- `specs/003-viewer-adapter-interfaces/spec.md`

## Implementation Strategy

This implementation must be TypeScript-only.

It should add interface/type files only.

It must not wire the adapter into `Viewport.tsx`.

It must not change UI behavior.

It must not add runtime viewer behavior.

It must not install packages.

## Target Files

The implementation may add:

- `src/features/viewport/viewer-adapter/types.ts`
- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`

No other source files should be changed unless needed for export organization and explicitly approved.

## Step 1: Define Neutral Viewer Types

Define neutral types for future viewer communication.

Possible type categories:

- viewer object reference
- viewer layer reference
- viewer floor reference
- viewer model reference
- viewer camera view
- viewer tool
- viewer highlight kind
- measurement result
- comment placement result
- viewer lifecycle state

These types should not depend on any viewer library.

## Step 2: Define Adapter Command Interface

Define a viewer adapter interface with conceptual command methods.

Possible command methods:

- initialize
- dispose
- load model
- set layer visibility
- show floor
- select object
- highlight object
- clear selection
- set active tool
- set camera view
- start measurement
- place comment

Method names may be adjusted for TypeScript clarity.

## Step 3: Define Adapter Event Types

Define event callback types for future viewer events.

Possible events:

- object selected
- camera changed
- model loaded
- model load failed
- measurement completed
- comment placed
- layer visibility changed

Events should report neutral IDs and simple payloads.

They should not report library-specific objects.

## Step 4: Keep Product Logic Outside Adapter

The adapter interface must not include product workflow concepts such as:

- issue severity
- issue status
- AI confidence
- review approval state
- user permissions
- project membership
- backend persistence

Issues and AI findings should reference viewer objects through neutral IDs outside the adapter.

## Step 5: Validate Scope

After implementation:

- run `npm run build`
- confirm no UI behavior changed
- confirm no viewer library was added
- confirm no runtime integration was added
- confirm no files outside the allowed scope changed unexpectedly

## Out of Scope

This plan does not include:

- real 3D rendering
- viewer library installation
- model upload
- backend storage
- database logic
- authentication
- permissions
- real AI inference
- replacing the SVG prototype
- wiring the adapter into `Viewport.tsx`

## Expected Result

The expected result is a small set of TypeScript-only interface files that document the future viewer adapter contract in code.

The current application should behave exactly as before.

## Recommended Commit Message

- Define viewport viewer adapter interfaces
