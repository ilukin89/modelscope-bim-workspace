# Plan: Prototype Viewer Adapter

## Purpose

This plan defines how to introduce a prototype viewer adapter implementation without adding real 3D rendering.

The goal is to validate the viewer adapter contract with a small runtime implementation that remains isolated from the current viewport UI.

## Documents to Read First

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

## Implementation Strategy

This implementation must remain small and isolated.

The prototype adapter should implement the existing `ViewerAdapter` interface, but it should not be connected to `Viewport.tsx` yet.

The goal is to test the contract shape, not to change the app behavior.

## Target File

The implementation may add:

- `src/features/viewport/viewer-adapter/adapters/prototype/PrototypeViewerAdapter.ts`

No existing runtime files should be changed in the first batch.

## Step 1: Inspect Existing Interfaces

Review:

- `src/features/viewport/viewer-adapter/types.ts`
- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`

Confirm the required method signatures and callback types.

## Step 2: Create Prototype Adapter

Create a prototype adapter class or factory that implements `ViewerAdapter`.

The adapter may:

- track lifecycle state internally
- support initialize and dispose
- accept a model ID in loadModel
- store active tool state
- store camera view state
- store selected object state
- store layer visibility state
- emit callbacks when relevant commands are called
- return unsubscribe functions for event subscriptions

## Step 3: Keep Runtime Isolated

The prototype adapter must not be wired into:

- `Viewport.tsx`
- `ViewportToolbar.tsx`
- `App.tsx`
- current SVG rendering logic

No current UI behavior should change.

## Step 4: Avoid Real Viewer Behavior

The prototype adapter must not:

- render anything
- use WebGL
- use canvas
- use SVG directly
- load real model files
- install or import viewer libraries
- perform real measurements
- place real comments in UI
- replace current prototype behavior

It may simulate state and callbacks only.

## Step 5: Validate

After implementation:

- run `npm run build`
- confirm only the allowed adapter implementation file was added
- confirm no dependencies were installed
- confirm no existing UI/runtime files were changed
- confirm the current app behavior is unchanged

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
- wiring the adapter into React

## Expected Result

The expected result is a small prototype adapter implementation that satisfies the existing viewer adapter interface.

The adapter should be available for future testing or wiring, but unused by the app for now.

## Recommended Commit Message

- Add prototype viewer adapter implementation
