# ModelScope BIM Workspace — V2 Implementation Log

## Purpose

This document records implementation steps for the V2 structure refactor.

The goal is to make the AI-assisted development process visible and reviewable, not hidden inside one large code change.

## Current Branch

`v2-spec-kit-setup`

## Batch 1: Feature Component Folder Refactor

### Date

2026-06-08

### Goal

Move the clearest product-specific workspace components into feature folders without changing visible UI behavior.

### Documents Used

Before implementation, the following documents were created and used as guardrails:

- `.specify/memory/constitution.md`
- `docs/01-project-structure-inventory.md`
- `specs/001-v2-structure-refactor/spec.md`
- `specs/001-v2-structure-refactor/plan.md`
- `specs/001-v2-structure-refactor/tasks.md`

### Files Moved

- `src/components/workspace/ModelExplorer.tsx` → `src/features/model-explorer/ModelExplorer.tsx`
- `src/components/workspace/ObjectInspector.tsx` → `src/features/object-inspector/ObjectInspector.tsx`
- `src/components/workspace/Viewport.tsx` → `src/features/viewport/Viewport.tsx`
- `src/components/workspace/ViewportToolbar.tsx` → `src/features/viewport/ViewportToolbar.tsx`

### Files Updated

- `src/App.tsx`

Only import paths were updated in `src/App.tsx`.

### Validation

- `npm run build` passed.
- TypeScript build passed.
- Vite production build passed.

### What Was Not Changed

This batch did not:

- move `App.tsx`
- move `TopBar.tsx`
- move `StatusBar.tsx`
- move `DesignSystemPanel.tsx`
- split `types.ts`
- split `data/projects.ts`
- create domain folders
- create backend logic
- add real 3D rendering
- add model upload
- add authentication
- add database logic
- add AI inference
- change visible UI behavior

### Reasoning

The first implementation batch intentionally moved only clear feature components.

More complex files such as `App.tsx`, `types.ts`, and `data/projects.ts` were left untouched because they require a separate refactor plan. Moving or splitting them too early would increase regression risk.

This keeps the V2 refactor incremental, reviewable, and aligned with the spec-driven workflow.

## Follow-Up Candidates

Possible future batches:

1. Move layout components such as `TopBar` and `StatusBar` into a layout area if they remain reusable and app-level.
2. Decide whether `DesignSystemPanel` should stay as a workspace reference component or move into a dedicated design-system feature.
3. Split domain types from `src/types.ts` only after a separate type/domain refactor spec.
4. Split mock project data from `src/data/projects.ts` only after a separate data/domain refactor spec.
5. Introduce a documented viewport adapter boundary before adding any real 3D viewer.
