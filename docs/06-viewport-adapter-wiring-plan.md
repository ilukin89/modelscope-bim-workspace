# ModelScope BIM Workspace - Viewport Adapter Wiring Plan

## Purpose

This document explains how the existing viewport UI could later be wired to the
existing `PrototypeViewerAdapter`.

It is an architecture and implementation plan only. The current SVG viewport
remains active and no runtime code changes are included.

## Current Boundary

The current viewport combines two categories of work:

1. React product UI and workflow presentation.
2. SVG-based simulation of viewer behavior.

The adapter contract and prototype adapter already exist, but they are isolated
from React. The wiring goal is to connect UI intent to the adapter without
moving product meaning into the viewer or replacing the simulation too early.

## Responsibility Inventory

### UI and Product Responsibilities

React currently owns:

- viewport layout and responsive controls
- explorer and inspector open/collapse actions
- toolbar selection and tool feedback labels
- AI findings popover and local feedback timing
- project, layer, floor, selected issue, and inspector state
- issue severity, status, object labels, and AI review meaning
- visibility counts and hidden-object messaging
- badges, cards, HUD text, accessibility text, and status-bar presentation

These remain UI/product responsibilities after adapter wiring.

### Simulated Viewer Responsibilities

The current SVG simulation owns or represents:

- building geometry
- architecture, structure, mechanical, and electrical rendering
- visible/hidden discipline effects
- selected object geometry highlights
- floor/section plane placement
- pan grid offset
- orbit gizmo emphasis
- fixed measurement annotation
- fixed comment marker
- fixed camera projection and angle display

A future viewer may own these execution details. The first wiring batch should
leave them untouched and use the adapter in parallel as an invisible contract
validation layer.

## Command Mapping

### Tool Selection

`ViewportToolbar` emits the existing public `ViewportTool` values. The bridge
should translate them explicitly:

| UI value | Adapter value |
| --- | --- |
| `Orbit` | `orbit` |
| `Pan` | `pan` |
| `Section` | `section` |
| `Measure` | `measure` |
| `Comment` | `comment` |

Each change calls `setActiveTool()`.

Selecting Measure does not by itself start a measurement. Selecting Comment
does not provide a placement point. `startMeasurement()` and `placeComment()`
belong to later viewer interaction flows.

### Layer Visibility

`visibleLayerIds` is a derived list of visible product layers. The bridge must
send an explicit command for every known layer:

```txt
architecture -> true or false
structure    -> true or false
mechanical   -> true or false
electrical   -> true or false
```

Sending only visible layers would leave stale adapter visibility for layers
that were turned off.

React remains authoritative because the Model Explorer, status bar, object
counts, and hidden-object messaging all depend on the same product state.

### Floor Selection

When `selectedFloor` changes, call:

```txt
showFloor(selectedFloor)
```

The current floor label may serve as the neutral floor ID for the prototype.
Introducing a separate floor ID model is outside the first wiring batch.

### Issue and AI Finding Selection

The neutral viewer object ID is:

```txt
selectedIssue.details.objectId
```

It is not `selectedIssue.id`, `selectedIssue.code`, or
`selectedIssue.highlight`.

General issue selection maps to:

```txt
selectObject(objectId)
highlightObject(objectId, "issue")
```

AI finding selection may map to:

```txt
selectObject(objectId)
highlightObject(objectId, "ai-finding")
```

The existing `HighlightKind` values (`duct`, `door`, `damper`) select SVG
geometry variants. They do not represent adapter highlight intent and must not
be cast to `ViewerHighlightKind`.

The current selected issue prop does not preserve whether selection originated
from the AI popover, explorer, or inspector. If `"ai-finding"` intent cannot be
preserved without adding product state, the first batch should use the general
`"issue"` mapping and defer origin-specific highlights.

### Commands Not Ready for Wiring

`loadModel(modelId)` is not ready because `Viewport` does not receive a stable
neutral model ID.

`clearSelection()` is not ready because current product state always has a
selected issue.

`setCameraView()` is not ready because there is no current camera preset action.

`startMeasurement()` and `placeComment()` are not ready because toolbar
selection alone does not provide the required viewer interaction or point.

## Event Mapping

### Object Selected

`onObjectSelected` emits an object ID or `null`. A future UI handler must define:

- how a known object ID resolves to domain data
- what happens for an object with no linked issue
- what `null` means when current product state requires a selected issue
- whether selecting an object changes the selected floor

Until those rules exist, do not wire this event to `onIssueSelect`.

### Camera Changed

`onCameraChanged` may eventually update a local camera HUD. Camera state should
remain adapter-owned, with React storing only the neutral display state it
actually renders.

The current fixed `Perspective` and `42.0 degrees` labels should not become
dynamic in the first batch because that would change visible behavior.

### Model Loaded and Model Load Failed

These events can drive local ready/error UI only after model loading is
introduced through a stable neutral model ID. Error presentation belongs to
React; model loading mechanics belong to the adapter.

### Measurement Completed

`onMeasurementCompleted` can provide neutral points, distance, and unit for
transient UI. React may later own whether a result is displayed or saved.
Persistence is not an adapter responsibility.

### Comment Placed

`onCommentPlaced` can create a pending UI draft linked to a neutral position and
optional object ID. Comment text, confirmation, authoring, and persistence
remain product concerns.

### Layer Visibility Changed

This event should be wired only if the viewer can initiate visibility changes.
The viewport currently has no parent callback that sets a layer to an explicit
boolean. Adding one requires a separate state API decision.

When implemented, the event handler must compare the payload with current React
state before updating it so the resulting command effect does not loop.

## Lifecycle Placement

Lifecycle belongs inside the viewport feature because the host DOM node belongs
there. `App.tsx` should continue to own product state, not viewer resources.

A dedicated hook or small bridge should:

1. Receive the host element and adapter factory/instance.
2. Create one adapter for one mounted host lifecycle.
3. Subscribe to only the events that have defined consumers.
4. Initialize after the host ref is populated.
5. Synchronize initial commands after initialization succeeds.
6. Ignore async completion after cleanup.
7. Unsubscribe callbacks.
8. Dispose the adapter.

Cleanup should be idempotent. The bridge must tolerate React development
remounts without duplicate subscriptions or a surviving disposed instance.

The adapter must not be recreated on every render.

## Synchronization Model

### React-to-Adapter Commands

React is authoritative for active tool, layer visibility, selected floor, and
selected issue. Effects send those values to the adapter.

The adapter may store them internally to execute viewer behavior, but that
internal storage is a mirror, not a second product source of truth.

### Adapter-to-React Events

The adapter is authoritative for neutral viewer-originated facts such as camera
changes, hit-test selection, measurement coordinates, and comment positions.

React interprets those facts in product context. The adapter never decides
issue severity, AI validity, review status, or persistence.

### Avoiding Feedback Loops

For bidirectional values:

1. Compare incoming event payloads with current React state.
2. Skip no-op state updates.
3. Let React issue a command only after an actual product state change.
4. Do not emit synthetic UI events merely because React sent a command unless
   the event represents confirmed viewer state.

One-way synchronization is preferred until a real viewer-originated action
requires two-way state.

## Smallest Safe Future Batch

The first wiring PR should contain only:

- a viewport-owned host ref
- a small adapter lifecycle bridge
- `PrototypeViewerAdapter` creation, initialization, and disposal
- explicit tool translation
- one-way synchronization for tool, floor, all layer visibility states, and
  selected issue object/highlight
- focused lifecycle and synchronization tests

It should not contain:

- visible renderer changes
- model loading
- bidirectional object or layer events
- camera HUD changes
- real measurement or comment interaction
- product state redesign

This batch proves the boundary without asking the adapter to replace the SVG.

## Main Risks

- A large PR could hide whether failures come from lifecycle, state mapping, or
  renderer replacement.
- Tool and layer state could gain two competing authorities.
- Adapter callbacks could trigger React updates that send the same command back
  indefinitely.
- Async initialization could complete after disposal.
- React development remounts could expose stale instances or duplicate
  subscriptions.
- Issue IDs, object IDs, geometry highlight variants, and highlight intent could
  be confused because they are all strings or string unions.
- Calling `loadModel()` without a stable model ID would create a false contract.

## Later Wiring PR Acceptance Checklist

- The SVG viewport is still present and visually unchanged.
- The adapter initializes only after its host exists.
- One adapter instance corresponds to one active mounted host lifecycle.
- Cleanup unsubscribes every callback and disposes the adapter.
- Development remounts do not leak or duplicate adapter activity.
- Tool mapping is explicit and type-safe.
- Every known layer receives an explicit visibility boolean.
- Floor selection uses `showFloor()`.
- Selection uses `details.objectId`.
- Adapter highlight intent is not derived by casting `duct`, `door`, or
  `damper`.
- No command is called without an existing UI intent and required input.
- No event is wired without a defined state destination and loop rule.
- React remains authoritative for product/UI state.
- The adapter remains free of issue, AI, permission, backend, and persistence
  decisions.
- Focused tests and `npm run build` pass.
- No packages or real rendering technology are added.

## Explicit Out of Scope

- runtime wiring in this documentation PR
- `App.tsx` changes
- public type or adapter method renames
- removal of the current simulation
- canvas or SVG renderer changes
- Three.js, xeokit, IFC.js, WebGL, or real 3D
- IFC/Revit parsing or upload
- backend, authentication, permissions, or persistence
- real AI inference
- comment or measurement persistence
