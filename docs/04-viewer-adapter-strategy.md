# ModelScope BIM Workspace — Viewer Adapter Strategy

## Purpose

This document defines the future viewer-adapter boundary for ModelScope BIM Workspace.

The goal is to prepare the project for possible future real 3D model support without coupling the current React UI directly to a rendering library.

This is a planning document only.

No real 3D rendering, model upload, IFC/Revit parsing, WebGL lifecycle, or viewer library integration is implemented in this step.

## Current State

`Viewport.tsx` currently owns several responsibilities at once:

- viewport layout
- responsive panel controls
- viewport toolbar feedback
- AI findings presentation
- selected object and issue feedback
- SVG-based model visualization
- hard-coded building geometry
- simulated layer visibility
- simulated floor/section marker
- simulated object highlight behavior
- simulated pan/orbit/measurement/comment feedback

This is acceptable for a code-first UX prototype.

However, this structure should not become the basis for a real 3D viewer implementation.

## Main Risk

If real 3D rendering is added directly into `Viewport.tsx`, the component would mix:

- React UI rendering
- model rendering lifecycle
- camera controls
- input/event handling
- object selection
- layer visibility
- measurement tools
- comment placement
- GPU/resource cleanup
- future model loading
- issue and AI finding presentation

This would make the component hard to maintain, test, replace, and extend.

The main goal of a viewer adapter is to prevent this coupling.

## Viewer Adapter Principle

The viewport UI should communicate with a viewer through a neutral adapter contract.

The UI should not know whether the viewer is:

- the current SVG prototype
- a mock viewer
- a Three.js-based viewer
- an IFC viewer
- xeokit
- another future BIM viewer implementation

The viewer implementation may change, but the UI contract should remain stable.

## Proposed Future Structure

Future viewer work may use a structure similar to:

```txt
src/features/viewport/
  Viewport.tsx
  ViewportToolbar.tsx
  types.ts
  viewer-adapter/
    ViewerAdapter.ts
    types.ts
    ViewerHost.tsx
    createViewerAdapter.ts
    adapters/
      prototype/
      real-viewer/
```

This structure is a planning direction, not an implementation requirement.

## Ownership Boundaries

### Viewport UI Should Own

The React viewport UI should own:

- layout
- toolbar placement
- responsive controls
- panel buttons
- UI badges
- selected status text
- visible feedback messages
- issue and AI finding presentation
- mapping UI state to adapter commands

### Viewer Adapter Should Own

A future viewer adapter should own:

- renderer lifecycle
- model loading
- camera commands
- pan/orbit behavior
- layer visibility commands
- floor isolation or sectioning commands
- object selection
- object highlighting
- measurement command handling
- comment placement command handling
- projection/camera state
- viewer events
- cleanup and disposal

### Domain Data Should Own

Domain/model data should own:

- model IDs
- object IDs
- issue IDs
- layer IDs
- floor names
- selected object references
- issue-to-object references

The adapter should receive neutral IDs and commands. It should not own product meaning.

## Existing Simulated Behaviors and Future Adapter Mapping

| Current simulated behavior in `Viewport.tsx` | Future adapter responsibility                        |
| -------------------------------------------- | ---------------------------------------------------- |
| hard-coded building geometry                 | model loading / prototype geometry adapter           |
| SVG model rendering                          | viewer host / renderer implementation                |
| layer visibility display                     | `setLayerVisibility()` or equivalent adapter command |
| selected object highlight                    | `highlightObject(objectId)`                          |
| floor/section marker                         | `showFloor(floorId)` or `setSectionPlane()`          |
| pan translation                              | camera/pan command                                   |
| orbit gizmo                                  | camera/orbit state                                   |
| fixed measurement marker                     | measurement tool command/result                      |
| comment marker                               | comment placement command/result                     |
| camera labels / HUD                          | UI may own labels; adapter may expose camera state   |
| visibility-derived feedback                  | UI owns message; adapter exposes visibility state    |

## Suggested Adapter Contract Concepts

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

These are conceptual commands only. They should not be implemented until a dedicated viewer-adapter spec exists.

## AI and Issue Review Boundary

AI findings and review issues should remain outside the viewer adapter.

The viewer adapter should not decide:

- whether something is an issue
- whether an AI finding is valid
- issue severity
- issue status
- review workflow state
- AI confidence or reasoning

Instead, AI findings and issues should reference viewer objects through neutral IDs.

Example:

```txt
AI Finding → objectId → viewer highlights object
Issue → linkedObjectId → viewer selects/highlights object
```

The product logic stays in the app/domain layer. The adapter only visualizes commands.

## What Must Not Be Implemented Yet

This strategy does not authorize:

- installing Three.js
- installing xeokit
- installing IFC.js
- adding WebGL rendering
- adding real IFC/Revit parsing
- adding model upload
- adding backend storage
- adding object metadata extraction
- replacing the current SVG prototype
- changing viewport UI behavior

## Recommended Next Step

The safest next step is to create a dedicated future spec:

```txt
specs/002-viewer-adapter-boundary/
  spec.md
  plan.md
  tasks.md
```

That spec should define only the adapter boundary, not real 3D rendering.

A real viewer implementation should be a later, separate spec.

## Portfolio Value

This strategy shows that ModelScope is not just a visual prototype.

It documents how a code-first UX prototype can be prepared for future technical growth without prematurely coupling the UI to backend, model upload, or real 3D rendering concerns.

This supports the project goal of demonstrating AI-assisted UX Engineering, product architecture thinking, and scalable frontend planning.
