# Spec: Viewport Adapter Wiring Plan

## Feature Name

Viewport Adapter Wiring Plan

## Status

Draft

## Goal

Define how the existing React viewport UI could later be connected to the
existing `ViewerAdapter` contract and `PrototypeViewerAdapter` without changing
runtime behavior in this planning phase.

This spec is documentation-only. It describes a safe future integration path;
it does not wire the adapter into `Viewport.tsx`.

## Why This Matters

The project now has three separate pieces:

- a working React viewport with an SVG-based simulation
- a library-neutral `ViewerAdapter` interface
- an isolated `PrototypeViewerAdapter` implementation

The pieces are intentionally not connected. Wiring them without a plan could
create duplicate state, event loops, lifecycle leaks, or a large rewrite that
removes useful prototype behavior before an adapter can replace it.

The next implementation step needs a clear boundary between product/UI intent
and viewer execution state.

## Current Responsibilities

### React UI-Owned Responsibilities

The current viewport and its parent React state own:

- viewport layout and responsive panel controls
- toolbar rendering and the active tool selection
- AI findings popover state and feedback messages
- project, floor, layer, issue, and selected issue product state
- issue severity, status, labels, and inspector workflow
- selection cards, badges, status text, and accessibility labels
- mapping issue and finding data to `details.objectId`
- deciding when an interaction represents an issue or AI finding

These responsibilities should remain outside the adapter.

### Current Simulated Viewer Responsibilities

`Viewport.tsx` currently simulates viewer behavior through React and SVG:

- hard-coded building geometry
- discipline layer visibility
- floor and section-plane visualization
- issue-linked object highlighting
- pan offset feedback
- orbit gizmo feedback
- fixed measurement feedback
- fixed comment placement feedback
- fixed camera projection and angle labels

These behaviors may later move behind a viewer host and adapter, but the current
simulation must remain in place during the first wiring batch.

## Planned UI-to-Adapter Mapping

| Existing UI intent | Adapter method | Planning rule |
| --- | --- | --- |
| Orbit tool selected | `setActiveTool("orbit")` | Translate the public UI label; do not rename either type. |
| Pan tool selected | `setActiveTool("pan")` | React remains authoritative for toolbar/status state. |
| Section tool selected | `setActiveTool("section")` | `showFloor()` remains a separate synchronization command. |
| Measure tool selected | `setActiveTool("measure")` | Do not call `startMeasurement()` merely because the toolbar mode changed. |
| Comment tool selected | `setActiveTool("comment")` | Do not call `placeComment()` until a viewer interaction supplies a point. |
| Layer visibility changes | `setLayerVisibility(layerId, visible)` | Synchronize all known layers, including layers absent from `visibleLayerIds`. |
| Floor selection changes | `showFloor(floorId)` | Use the existing floor value as the neutral ID until a separate ID model exists. |
| Issue selection changes | `selectObject(objectId)` and `highlightObject(objectId, "issue")` | Resolve `objectId` from `selectedIssue.details.objectId`. |
| AI finding selected | `selectObject(objectId)` and `highlightObject(objectId, "ai-finding")` | Preserve AI finding product meaning outside the adapter. |
| Selection cleared | `clearSelection()` | Defer until the React product state supports an empty selection. |
| Project/model changes | `loadModel(modelId)` | Defer until a stable neutral model ID is passed to the viewport. |
| Camera preset selected | `setCameraView(view)` | No current UI action requires this command. |
| Measurement interaction starts | `startMeasurement()` | Requires a later viewer interaction flow, not toolbar activation alone. |
| Comment point confirmed | `placeComment(position)` | Requires a viewer-produced neutral 3D point. |

The existing `HighlightKind` values (`duct`, `door`, `damper`) describe
prototype geometry variants. They must not be cast to `ViewerHighlightKind`,
which describes intent (`selection`, `issue`, `ai-finding`, `preview`).

## Planned Adapter-to-UI Mapping

| Adapter event | UI state destination | First-batch decision |
| --- | --- | --- |
| `onObjectSelected` | Resolve a known `objectId` to product selection state | Defer until unknown and null selections have explicit product behavior. |
| `onCameraChanged` | Optional local camera/HUD display state | Defer; current labels are simulated and fixed. |
| `onModelLoaded` | Local viewer readiness state | Subscribe only when lifecycle feedback has a defined UI use. |
| `onModelLoadFailed` | Local error presentation | Defer with `loadModel()`. |
| `onMeasurementCompleted` | Transient measurement result UI | Defer until measurement rendering moves behind the adapter. |
| `onCommentPlaced` | Pending comment draft state | Defer; comments remain product workflow state. |
| `onLayerVisibilityChanged` | React layer visibility state | Defer until the viewport receives a parent update callback and loop prevention is defined. |

Adapter events must never update issue severity, issue status, AI confidence,
permissions, persistence, or review workflow state.

## Lifecycle Recommendation

A future integration should place adapter lifecycle code in a dedicated
viewport-owned bridge, hook, or viewer host rather than in `App.tsx`.

The lifecycle should be:

1. Create one adapter instance for one mounted viewer host.
2. Obtain the host `HTMLElement` through a React ref.
3. Register required event subscriptions.
4. Call `initialize(container)` after the host mounts.
5. Synchronize the initial React command state after initialization succeeds.
6. On cleanup, unsubscribe all callbacks before calling `dispose()`.
7. Ignore or cancel async completion work after cleanup.

The implementation must behave correctly under React development remounts and
must not create an adapter during render on every rerender.

## State Synchronization Rules

### React Remains Authoritative For

- active toolbar tool and status-bar label
- layer control state and visible object counts
- selected floor
- selected issue and issue metadata
- AI findings and review workflow
- responsive panels, popovers, badges, and feedback messages

### Adapter Manages

- renderer and container lifecycle
- viewer camera internals
- hit testing and viewer-originated object interactions
- rendered visibility, floor/section execution, and highlights
- in-progress measurement and comment coordinates
- viewer resources and cleanup

### State That Must Not Be Duplicated

- issue status, severity, or AI meaning must not be copied into adapter state
- camera internals must not be independently reconstructed in React
- measurement and comment coordinates must not have competing viewer and UI
  authorities
- mirrored command state inside the adapter must not become a second product
  source of truth

For React-originated commands, React state is authoritative and adapter state is
an execution mirror. For viewer-originated events, the adapter is authoritative
for the neutral payload and React decides its product meaning.

## Risks of Wiring Too Much at Once

- replacing SVG behavior before adapter parity is proven
- creating two authorities for tools, layers, floors, or selection
- command/event feedback loops
- stale adapter instances or leaked subscriptions
- initializing before the host element exists
- updating React after async initialization has been disposed
- using issue IDs where viewer object IDs are required
- treating geometry highlight variants as adapter highlight intent
- forcing model loading without a stable model ID
- expanding the PR into `App.tsx`, domain type, or viewer contract redesign

## Smallest Safe Future Implementation Batch

The first future wiring PR should:

- preserve the existing SVG viewport as the visible renderer
- add a small viewport-owned adapter lifecycle bridge
- create and initialize `PrototypeViewerAdapter` against the existing viewport
  host element
- dispose it on unmount
- synchronize `activeTool`, `selectedFloor`, `visibleLayerIds`, and the selected
  issue object/highlight as one-way React-to-adapter commands
- avoid `loadModel()` until a neutral model ID is available
- avoid adapter-to-React event updates except for subscriptions that have an
  explicit, non-duplicated state destination
- add focused tests for lifecycle cleanup, tool translation, and command
  synchronization

This batch validates wiring mechanics without changing what users see.

## Explicit Out of Scope

- modifying runtime source code in this planning PR
- wiring the adapter into `Viewport.tsx` in this planning PR
- modifying `App.tsx`
- changing visible UI behavior
- replacing or removing the simulated SVG viewport
- renaming public types or adapter methods
- changing the `ViewerAdapter` contract
- adding canvas or SVG renderer changes
- adding real 3D rendering
- adding Three.js, xeokit, IFC.js, or any viewer package
- adding model upload or IFC/Revit parsing
- adding backend services, authentication, persistence, or permissions
- adding real AI inference
- implementing measurement or comment persistence

## Acceptance Criteria for a Later Wiring PR

A later wiring PR is acceptable when:

1. The current viewport remains visually and behaviorally unchanged.
2. The adapter is created once per mounted host lifecycle, initialized after the
   host exists, and disposed during cleanup.
3. All event subscriptions added by the PR are unsubscribed during cleanup.
4. React development remount behavior does not leave a disposed or duplicated
   active adapter.
5. Every wired UI action uses an existing `ViewerAdapter` method without
   renaming the contract.
6. `ViewportTool` values are translated explicitly to `ViewerActiveTool`.
7. Issue/finding highlights use `selectedIssue.details.objectId`, not issue IDs
   or prototype geometry highlight values.
8. Layer synchronization sends both visible and hidden states.
9. React remains authoritative for product/UI state, and no feedback loop
   exists between commands and events.
10. No unsupported `loadModel`, clear-selection, measurement, comment, or
    camera workflow is invented.
11. The simulated viewport is retained until a separate replacement spec is
    approved.
12. No packages, backend work, upload, persistence, auth, AI inference, or real
    rendering are added.
13. Focused tests cover the new bridge behavior and `npm run build` succeeds.

## Planning Acceptance Criteria

This planning spec is complete when:

1. Current UI and simulated viewer responsibilities are separated.
2. Existing UI actions are mapped to existing adapter methods.
3. Existing adapter events are mapped to valid or explicitly deferred UI state.
4. Lifecycle and cleanup placement are defined.
5. State ownership and anti-duplication rules are defined.
6. Risks and the smallest safe implementation batch are documented.
7. Later wiring acceptance criteria and explicit exclusions are documented.
8. No runtime source file or visible behavior is changed.
