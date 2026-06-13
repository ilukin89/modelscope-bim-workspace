# Plan: Viewport Adapter Wiring

## Purpose

This plan defines a documentation-only path for later connecting the existing
viewport UI to the existing prototype viewer adapter.

No runtime integration is implemented in this phase.

## Documents and Source Reviewed

- `README.md`
- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/04-viewer-adapter-strategy.md`
- `docs/05-viewer-adapter-contract.md`
- `specs/002-viewer-adapter-boundary/spec.md`
- `specs/003-viewer-adapter-interfaces/spec.md`
- `specs/004-prototype-viewer-adapter/spec.md`
- `src/features/viewport/Viewport.tsx`
- `src/features/viewport/ViewportToolbar.tsx`
- `src/features/viewport/types.ts`
- `src/features/viewport/viewer-adapter/ViewerAdapter.ts`
- `src/features/viewport/viewer-adapter/types.ts`
- `src/features/viewport/viewer-adapter/adapters/prototype/PrototypeViewerAdapter.ts`

## Planning Strategy

Document the current state before proposing integration:

1. Separate React UI/product responsibilities from simulated viewer behavior.
2. Map current user intent to the adapter's existing methods.
3. Map adapter events only to real React state destinations.
4. Define lifecycle placement and cleanup order.
5. Establish one authority for each category of state.
6. Limit the first future implementation to an invisible prototype bridge.

## Current Architecture Summary

`App.tsx` currently owns shared product state for tool, layers, floor, and
selected issue. `Viewport.tsx` renders both UI chrome and the complete SVG
simulation. `ViewportToolbar.tsx` emits public `ViewportTool` labels.

The prototype adapter is independent from React. It stores viewer-facing state,
implements all current adapter methods, emits neutral callbacks, and clears
state and subscriptions on disposal.

There is currently no adapter host, factory, lifecycle hook, neutral model ID
prop, generic object selection state, or layer-update callback on `Viewport`.

## Recommended Future Structure

A later implementation may add a small bridge such as:

```txt
src/features/viewport/
  Viewport.tsx
  viewer-adapter/
    ViewerAdapter.ts
    types.ts
    useViewerAdapterBridge.ts
    adapters/
      prototype/
        PrototypeViewerAdapter.ts
```

The exact filename is not required. The requirement is that lifecycle and
synchronization logic remain viewport-owned and isolated from layout markup and
product state.

Do not add a generalized factory or provider unless the first implementation
has a real need for it.

## Future Implementation Steps

### Step 1: Add a Stable Host Boundary

- Reuse or mark the existing viewport model host with an `HTMLElement` ref.
- Do not replace, restyle, or remove the current SVG.
- Keep the host owned by the viewport feature, not `App.tsx`.

### Step 2: Add Adapter Lifecycle

- Create one `PrototypeViewerAdapter` for the mounted host lifecycle.
- Register only required event subscriptions.
- Call `initialize(container)` from an effect after the ref is available.
- Track async cancellation so initialization completion cannot update a disposed
  bridge.
- On cleanup, unsubscribe first and dispose second.
- Verify behavior under React development remounts.

### Step 3: Translate UI Tool Intent

Use an explicit mapping:

| `ViewportTool` | `ViewerActiveTool` |
| --- | --- |
| `Orbit` | `orbit` |
| `Pan` | `pan` |
| `Section` | `section` |
| `Measure` | `measure` |
| `Comment` | `comment` |

Do not rename either public type. Do not infer the mapping with lowercase string
casts.

Tool activation should call `setActiveTool()` only. `startMeasurement()` and
`placeComment()` require later pointer-driven interaction flows.

### Step 4: Synchronize Existing Props

After successful initialization and whenever relevant props change:

- call `setActiveTool()` for `activeTool`
- call `showFloor()` for `selectedFloor`
- call `setLayerVisibility()` for every known layer with an explicit boolean
- call `selectObject(selectedIssue.details.objectId)`
- call `highlightObject(selectedIssue.details.objectId, "issue")` for the
  general selected issue path

The AI findings popover may send `"ai-finding"` intent at its direct selection
boundary, but the implementation must avoid an immediate general issue effect
overwriting that intent. If the selection origin cannot be represented without
new product state, defer that distinction.

### Step 5: Defer Unsupported Commands

Do not call:

- `loadModel()` until a stable neutral model ID is provided
- `clearSelection()` until React supports an empty selection
- `setCameraView()` until a camera preset action exists
- `startMeasurement()` until an actual measurement interaction starts
- `placeComment()` until a neutral 3D position exists

Method presence is not a reason to invent a UI workflow.

### Step 6: Add Events Incrementally

For each adapter event, identify:

- the authoritative source
- the exact React state destination
- null and unknown-ID behavior
- feedback-loop prevention
- cleanup ownership

Do not subscribe merely to mirror adapter state back into React.

The first batch may have no adapter-to-React event synchronization. A later
batch can add object selection or layer changes once the parent API supports
them without ambiguous state.

### Step 7: Test the Bridge

Focused tests should verify:

- initialization occurs after a host element exists
- disposal occurs on cleanup
- subscriptions are removed
- each `ViewportTool` maps correctly
- initial and changed floor/layer/selection commands are sent
- hidden layers are sent as `false`
- rerenders do not recreate active adapters
- development remounts do not leak an instance
- no adapter event creates a command/event loop

### Step 8: Validate Scope

Run:

```bash
npm run build
```

Confirm the future implementation does not change visible UI behavior and does
not add dependencies or real rendering.

## State Ownership Decision

| State | Authority | Synchronization rule |
| --- | --- | --- |
| Active toolbar tool | React | Send translated command to adapter. |
| Layer control visibility | React | Send complete explicit visibility state. |
| Selected floor | React | Send `showFloor()` command. |
| Selected issue/finding | React product state | Resolve neutral object ID before sending viewer commands. |
| Issue severity/status/AI meaning | React/domain | Never copy into adapter. |
| Camera internals | Adapter | Expose neutral events only when UI needs them. |
| Rendered geometry and resources | Adapter/viewer | Never duplicate in React after renderer replacement. |
| Measurement points in progress | Adapter | Emit a neutral result; React owns any saved product record. |
| Comment placement point | Adapter | Emit a neutral result; React owns draft and persistence workflow. |
| Responsive panels and viewport chrome | React | Never move behind adapter. |

## Risk Controls

- Keep the SVG visible during the bridge phase.
- Use explicit value translations and neutral IDs.
- Synchronize from effects, not during render.
- Separate command effects by concern so dependency changes are reviewable.
- Make cleanup idempotent.
- Avoid subscribing to events without a consumer.
- Do not broaden the adapter contract during wiring.
- Stop the PR if it requires product state redesign, model loading, or renderer
  replacement; those need separate specs.

## Smallest Safe Batch

The recommended first implementation batch is lifecycle plus one-way command
synchronization to `PrototypeViewerAdapter`, with no visible renderer change and
no model loading.

This proves:

- the adapter can be hosted safely by React
- existing UI values can be translated to the neutral contract
- cleanup works
- future event wiring can be added without moving product state into the
  adapter

## Files in This Planning Phase

Create only:

- `specs/005-viewport-adapter-wiring-plan/spec.md`
- `specs/005-viewport-adapter-wiring-plan/plan.md`
- `specs/005-viewport-adapter-wiring-plan/tasks.md`
- `docs/06-viewport-adapter-wiring-plan.md`

## Out of Scope

- all runtime source changes
- changes to `Viewport.tsx`, `ViewportToolbar.tsx`, or `App.tsx`
- package changes
- renderer changes
- removal of the current simulation
- changes to public types or adapter methods
- real 3D, upload, backend, auth, persistence, or AI inference

## Expected Result

The repository gains an implementation-ready wiring plan while the application
continues to build and behave exactly as before.

## Recommended Commit Message

- Add viewport adapter wiring plan
