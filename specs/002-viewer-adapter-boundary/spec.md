# Spec: Viewer Adapter Boundary

## Feature Name

Viewer Adapter Boundary

## Status

Draft

## Goal

Define a neutral viewer-adapter boundary for ModelScope BIM Workspace before any real 3D viewer implementation is introduced.

This spec prepares the viewport architecture for future growth toward real 3D model support, but it does not implement real 3D rendering.

## Why This Matters

The current `Viewport.tsx` works as a code-first UX prototype. It uses SVG-based simulated model visualization to demonstrate BIM review interactions such as layer visibility, floor context, object selection, issue feedback, measurement, comments, and AI finding indicators.

This is acceptable for the current prototype.

However, if real 3D rendering is added directly into `Viewport.tsx`, the component would become responsible for too many concerns:

- React UI layout
- rendering lifecycle
- camera controls
- object selection
- layer visibility
- model loading
- measurement tools
- comment placement
- issue highlighting
- AI finding visualization
- cleanup of viewer resources

That would make the project harder to scale and harder to replace with a real viewer later.

The viewer adapter boundary prevents the UI from becoming tightly coupled to one rendering technology.

## Current Problem

`Viewport.tsx` currently owns:

- viewport layout
- responsive viewport controls
- toolbar feedback
- selected object feedback
- AI findings UI
- selection status
- SVG model visualization
- hard-coded building geometry
- simulated layer visibility
- simulated floor/section marker
- simulated pan/orbit/measurement/comment feedback

These responsibilities should eventually be separated before real 3D rendering is introduced.

## In Scope

This spec defines:

- what the viewer adapter should own in the future
- what the React viewport UI should continue to own
- what domain/product data should own
- conceptual adapter commands and events
- mapping between current simulated behavior and future adapter responsibility
- boundaries between issues, AI findings, and viewer object highlighting

This spec may introduce documentation and planning files.

This spec may later introduce adapter interface files only if implementation is explicitly approved in a future plan.

## Out of Scope

This spec must not implement:

- real 3D rendering
- Three.js
- xeokit
- IFC.js
- Revit parsing
- IFC parsing
- model upload
- backend storage
- object metadata extraction
- database logic
- authentication
- permissions
- real AI inference
- replacement of the current SVG prototype

No viewer library should be installed under this spec.

## Product Rules

ModelScope remains a viewport-first BIM review workspace.

The viewport is the source of truth for model-related interaction feedback.

Issue and AI finding logic must remain outside the viewer adapter.

The viewer adapter should visualize product commands, not decide product meaning.

Examples:

- Issue selects or highlights linked object through `objectId`.
- AI Finding may highlight a referenced object through `objectId`.
- The adapter should not decide issue severity, issue status, AI confidence, or review workflow state.

## UX Rules

The future adapter must preserve the UX principle that model-related controls have visible consequences.

Examples:

- selecting a layer should visibly affect model visibility
- selecting a floor should visibly affect model context
- selecting an issue should visibly highlight or focus the related object
- selecting an AI finding should show related visual feedback without turning it into a confirmed issue automatically

No fake clickable UI should be introduced.

## Frontend Rules

The React viewport UI should remain responsible for:

- layout
- toolbar placement
- responsive controls
- UI badges
- selected status text
- issue and AI finding presentation
- mapping UI state to adapter commands

A future viewer adapter should be responsible for:

- renderer lifecycle
- model loading
- camera commands
- pan/orbit behavior
- layer visibility commands
- floor isolation or sectioning
- object selection
- object highlighting
- measurement command handling
- comment placement command handling
- viewer events
- cleanup and disposal

## Suggested Future Structure

A future implementation may use a structure like:

- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`
- `src/features/viewport/viewer-adapter/types.ts`
- `src/features/viewport/viewer-adapter/ViewerHost.tsx`
- `src/features/viewport/viewer-adapter/createViewerAdapter.ts`
- `src/features/viewport/viewer-adapter/adapters/prototype/`
- `src/features/viewport/viewer-adapter/adapters/real-viewer/`

This structure is only a planning direction.

No empty folders should be created unless a future implementation task needs them.

## Conceptual Adapter Commands

A future adapter may expose commands such as:

- `initialize(container)`
- `dispose()`
- `loadModel(modelSource)`
- `setLayerVisibility(layerId, visible)`
- `showFloor(floorId)`
- `selectObject(objectId)`
- `highlightObject(objectId, kind)`
- `clearSelection()`
- `setTool(tool)`
- `setCameraView(view)`
- `startMeasurement()`
- `placeComment(position)`
- `onObjectSelected(callback)`
- `onCameraChanged(callback)`
- `onModelLoaded(callback)`

These commands are conceptual only.

They should not be implemented until a dedicated implementation plan exists.

## Acceptance Criteria

This spec is complete when:

1. The viewer adapter boundary is clearly documented.
2. The distinction between React UI, viewer adapter, and domain/product data is clear.
3. Current simulated viewport behavior is mapped to future adapter responsibilities.
4. The spec explicitly prevents real 3D implementation in this phase.
5. The spec avoids committing to a specific viewer library too early.
6. The next implementation step can be planned without touching real 3D rendering.

## Implementation Notes

The safest next step after this spec is a planning document or `plan.md`.

The first implementation batch, if approved later, should not add a real viewer.

A safe future implementation batch could define TypeScript-only adapter interfaces, but only after a separate plan and task list are created.

AI agents must not install packages or implement rendering under this spec.
