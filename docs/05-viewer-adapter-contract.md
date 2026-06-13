# ModelScope BIM Workspace — Viewer Adapter Contract

## Purpose

This document defines the conceptual contract between the React viewport UI and a future viewer adapter.

The goal is to describe how the UI should communicate with a future model viewer without coupling `Viewport.tsx` directly to a specific rendering library.

This is a planning document only.

It does not implement real 3D rendering, install viewer libraries, replace the current SVG prototype, or change runtime behavior.

## Contract Principle

The React UI should send neutral commands to a viewer adapter.

The viewer adapter should execute viewer-specific behavior.

Product/domain logic should remain outside the adapter.

The adapter should not decide product meaning. It should only visualize or report viewer-related state.

## Ownership Model

### React UI Owns

The React viewport UI owns:

- layout
- toolbar placement
- responsive controls
- badges and labels
- selected status text
- issue presentation
- AI finding presentation
- mapping user intent to adapter commands

### Viewer Adapter Owns

The future viewer adapter owns:

- renderer lifecycle
- model loading
- camera behavior
- orbit and pan behavior
- layer visibility commands
- floor isolation or sectioning
- object selection
- object highlighting
- measurement tool behavior
- comment placement behavior
- viewer events
- cleanup and disposal

### Product/Domain Logic Owns

Product and domain logic owns:

- project IDs
- model IDs
- object IDs
- issue IDs
- layer IDs
- floor names
- issue severity
- issue status
- AI finding confidence
- review workflow state
- whether an AI finding becomes a confirmed issue

## Neutral IDs

The viewer adapter should communicate through neutral IDs.

Examples:

- `projectId`
- `modelId`
- `objectId`
- `layerId`
- `floorId`
- `issueId`
- `findingId`

These IDs should not depend on a specific viewer library.

## UI to Adapter Commands

The UI may eventually send commands such as:

| UI action               | Future adapter command          | Notes                                                |
| ----------------------- | ------------------------------- | ---------------------------------------------------- |
| User selects object     | select object                   | Adapter selects/focuses object by neutral object ID. |
| User selects issue      | highlight object                | Product logic provides linked object ID.             |
| User selects AI finding | highlight object                | AI finding remains separate from confirmed issue.    |
| User toggles layer      | set layer visibility            | Adapter controls model visibility.                   |
| User selects floor      | show floor or isolate floor     | Exact implementation depends on future viewer.       |
| User activates orbit    | set active tool                 | Adapter updates viewer interaction mode.             |
| User activates pan      | set active tool                 | Adapter updates viewer interaction mode.             |
| User activates section  | set active tool or section mode | Future implementation detail.                        |
| User activates measure  | start measurement               | Adapter handles measurement interaction.             |
| User activates comment  | place comment                   | Adapter reports placement result.                    |
| User clears selection   | clear selection                 | Adapter removes viewer highlight/selection.          |

## Adapter to UI Events

The adapter may eventually emit events such as:

| Adapter event            | UI response                       | Notes                                               |
| ------------------------ | --------------------------------- | --------------------------------------------------- |
| object selected          | update selected object state      | Product state decides what metadata to show.        |
| camera changed           | update camera/HUD state if needed | UI may display camera orientation.                  |
| model loaded             | show ready state                  | Product state decides what project/model is active. |
| model load failed        | show error state                  | Error presentation belongs to UI.                   |
| measurement completed    | show measurement result           | Product state decides whether to save it.           |
| comment placed           | create pending comment state      | Product workflow owns confirmation.                 |
| layer visibility changed | update visible layer state        | UI reflects current visibility.                     |

## Current Prototype Mapping

| Current behavior in `Viewport.tsx` | Future contract interpretation                                  |
| ---------------------------------- | --------------------------------------------------------------- |
| SVG building drawing               | Prototype renderer or viewer host responsibility.               |
| Hard-coded geometry                | Prototype model source, later replaced by loaded model data.    |
| Layer visibility visual change     | Adapter command: set layer visibility.                          |
| Floor marker / section label       | Adapter command: show floor or section.                         |
| Selected object highlight          | Adapter command: select/highlight object.                       |
| Issue-linked highlight             | Product issue references object ID, adapter highlights it.      |
| AI finding marker                  | Product AI finding references object ID, adapter highlights it. |
| Pan visual offset                  | Adapter camera/pan command.                                     |
| Orbit gizmo                        | UI display plus adapter camera/orbit state.                     |
| Measurement marker                 | Adapter measurement command/result.                             |
| Comment marker                     | Adapter comment placement command/result.                       |

## Issue and AI Finding Boundary

Issues and AI findings must remain product concepts.

The viewer adapter must not decide:

- whether something is an issue
- whether an AI finding is correct
- issue severity
- issue status
- AI confidence
- review workflow state

Correct flow:

1. User or AI selects/references an object.
2. Product state resolves the relevant `objectId`.
3. UI sends a neutral command to the adapter.
4. Adapter visualizes the selection or highlight.

Example:

- Issue references `objectId: "beam-04"`.
- UI sends highlight command for `"beam-04"`.
- Adapter highlights the object.
- Issue status remains outside the adapter.

## What the Adapter Must Not Own

The future adapter must not own:

- issue severity
- issue status
- AI finding confidence
- user permissions
- project membership
- backend persistence
- comments workflow state
- review approval state
- business rules
- product navigation

## Future TypeScript Interface Direction

A later implementation may introduce TypeScript-only interfaces such as:

- viewer adapter commands
- viewer adapter events
- viewer object references
- viewer layer references
- viewer floor references

This should happen only in a dedicated implementation batch.

The first interface implementation must not add real rendering.

## Out of Scope

This contract does not authorize:

- installing Three.js
- installing xeokit
- installing IFC.js
- adding any viewer library
- adding WebGL rendering
- adding IFC/Revit parsing
- adding model upload
- adding backend storage
- replacing the SVG prototype
- changing current UI behavior

## Next Step

The next safe implementation step, if approved, would be a TypeScript-only adapter interface batch.

That batch should define interface files only and must not introduce a real viewer implementation.
