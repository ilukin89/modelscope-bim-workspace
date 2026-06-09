# Plan: Viewer Adapter Boundary

## Purpose

This plan defines how to prepare the viewer-adapter boundary for ModelScope BIM Workspace.

The goal is to plan the boundary between React viewport UI and a future viewer implementation without adding real 3D rendering.

## Documents to Read First

Before any implementation, read:

- `.specify/memory/constitution.md`
- `docs/04-viewer-adapter-strategy.md`
- `specs/002-viewer-adapter-boundary/spec.md`

## Implementation Strategy

This phase should remain planning-first.

The first implementation step, if approved later, should be TypeScript-only and should not add a real rendering library.

Do not install viewer libraries.

Do not add real 3D rendering.

Do not replace the current SVG prototype.

## Step 1: Inspect Existing Viewport Responsibilities

Review:

- `src/features/viewport/Viewport.tsx`
- `src/features/viewport/ViewportToolbar.tsx`
- `src/features/viewport/types.ts`

Identify which responsibilities are:

- pure React UI
- simulated viewer behavior
- product/domain references
- future adapter commands
- future viewer events

No files should be modified during inspection.

## Step 2: Define Adapter Ownership

The adapter boundary should separate React UI ownership, viewer adapter ownership, and domain/product ownership.

### React UI Ownership

The React UI should own:

- layout
- toolbar placement
- responsive panel controls
- badges
- text feedback
- issue and AI finding presentation
- mapping user actions to adapter commands

### Viewer Adapter Ownership

The future viewer adapter should own:

- renderer lifecycle
- camera commands
- pan/orbit behavior
- layer visibility
- floor isolation or sectioning
- object selection
- object highlighting
- measurement commands
- comment placement commands
- viewer events
- cleanup/disposal

### Domain/Product Ownership

Domain and product data should own:

- project IDs
- model IDs
- object IDs
- issue IDs
- layer IDs
- floor names
- issue state
- AI finding state
- review workflow state

## Step 3: Map Current Simulated Behaviors

Document how current simulated viewport behavior maps to future adapter responsibilities.

Examples:

- SVG building geometry maps to a prototype adapter or viewer host.
- Layer visibility maps to an adapter command.
- Selected object highlight maps to an adapter command.
- Floor marker maps to an adapter command.
- Pan/orbit feedback maps to a camera command.
- Measurement marker maps to a measurement command/result.
- Comment marker maps to a comment placement command/result.

## Step 4: Define Conceptual Adapter Contract

The future adapter contract may include conceptual commands such as:

- initialize container
- dispose viewer
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

The future adapter contract may include conceptual events such as:

- object selected
- camera changed
- model loaded

These should remain conceptual unless an implementation task explicitly approves creating interface files.

## Step 5: Avoid Premature Viewer Choice

This plan must not choose or install:

- Three.js
- xeokit
- IFC.js
- any other viewer library

Viewer technology selection should happen in a later spec after the adapter boundary is clear.

## Step 6: Validate Scope

This phase is successful if the project gains a clearer future viewer boundary without changing current UI behavior.

The current SVG prototype should continue to exist unchanged unless a later task explicitly introduces adapter interfaces.

## Out of Scope

This plan does not include:

- real 3D rendering
- viewer library installation
- model upload
- IFC/Revit parsing
- backend storage
- database logic
- authentication
- permissions
- real AI inference
- replacement of the current SVG prototype

## Expected Result

The expected result of this phase is a clear, documented adapter boundary and a safe path toward future implementation.

If implementation is later approved, it should begin with TypeScript-only interfaces, not with a rendering engine.

## Recommended Commit Strategy

Planning commits should be separate from code commits.

Recommended planning commit message:

- Add viewer adapter boundary plan

Possible future implementation commit message, if approved later:

- Define viewport viewer adapter interfaces
