# Tasks: V2 Structure Refactor

## Purpose

This task list breaks the V2 structure refactor into small, safe implementation steps.

The goal is to improve the project structure without changing visible UI behavior.

## Preconditions

Before starting implementation, read:

- `.specify/memory/constitution.md`
- `docs/01-project-structure-inventory.md`
- `specs/001-v2-structure-refactor/spec.md`
- `specs/001-v2-structure-refactor/plan.md`

## Non-Negotiable Rules

- Do not add backend.
- Do not add real 3D rendering.
- Do not add model upload.
- Do not add authentication.
- Do not add database logic.
- Do not add real AI inference.
- Do not add new product features.
- Do not visually redesign the app.
- Do not replace official shadcn/ui components.
- Do not create fake shadcn-compatible components.
- Preserve current UI behavior.

## Phase 1: Inspect Current Project

- [ ] Inspect current `src/` structure.
- [ ] Identify app entry files.
- [ ] Identify workspace-specific components.
- [ ] Identify viewport-related components.
- [ ] Identify model explorer components.
- [ ] Identify object inspector components.
- [ ] Identify issue review components.
- [ ] Identify AI review components.
- [ ] Identify current mock data files.
- [ ] Identify current shared type files.
- [ ] Identify shared UI components.
- [ ] Identify layout-like components.

Do not move files during this phase.

## Phase 2: Create Target Folder Structure

- [ ] Create `src/app/` if needed.
- [ ] Create `src/features/workspace/`.
- [ ] Create `src/features/viewport/`.
- [ ] Create `src/features/model-explorer/`.
- [ ] Create `src/features/object-inspector/`.
- [ ] Create `src/features/issue-review/`.
- [ ] Create `src/features/ai-review/`.
- [ ] Create `src/domain/project/`.
- [ ] Create `src/domain/model/`.
- [ ] Create `src/domain/issue/`.
- [ ] Create `src/domain/ai/`.
- [ ] Create `src/domain/user/`.
- [ ] Create `src/domain/permissions/`.
- [ ] Create `src/components/layout/` if reusable layout components exist.

Keep official shadcn/ui components in:

- `src/components/ui/`

## Phase 3: Move App and Workspace Files

- [ ] Move app-level structure into `src/app/` if appropriate.
- [ ] Move workspace-level components into `src/features/workspace/`.
- [ ] Update imports after moving app/workspace files.
- [ ] Verify the app still compiles after this group.

Do not change component behavior unless required by import updates.

## Phase 4: Move Feature Components

- [ ] Move viewport components into `src/features/viewport/`.
- [ ] Move model explorer components into `src/features/model-explorer/`.
- [ ] Move object inspector components into `src/features/object-inspector/`.
- [ ] Move issue review components into `src/features/issue-review/`.
- [ ] Move AI review components into `src/features/ai-review/`.
- [ ] Update imports after each group.
- [ ] Verify that the app still compiles after each group.

Do not merge AI Review and Issue Review. They are separate product areas.

## Phase 5: Move Domain Types and Mock Data

- [ ] Move project-related types/data into `src/domain/project/`.
- [ ] Move model-related types/data into `src/domain/model/`.
- [ ] Move issue-related types/data into `src/domain/issue/`.
- [ ] Move AI finding types/data into `src/domain/ai/`.
- [ ] Move user-related types into `src/domain/user/` if applicable.
- [ ] Move permission-related types into `src/domain/permissions/` if applicable.
- [ ] Keep mock data clearly named as mock or fixture data.
- [ ] Update imports after moving domain files.

Domain data must not be owned by visual components.

## Phase 6: Preserve Shared UI Boundaries

- [ ] Confirm official shadcn/ui components remain in `src/components/ui/`.
- [ ] Move only reusable non-shadcn layout components into `src/components/layout/`.
- [ ] Do not create custom replacements for shadcn/ui components.
- [ ] Do not rename official shadcn/ui components unless required by existing project conventions.

## Phase 7: Validate Behavior

- [ ] Run the development server.
- [ ] Confirm the main workspace loads.
- [ ] Confirm the visible UI is unchanged.
- [ ] Confirm layout still works.
- [ ] Confirm responsive behavior still works.
- [ ] Confirm model explorer controls still behave as before.
- [ ] Confirm issue selection still behaves as before.
- [ ] Confirm object inspector still behaves as before.
- [ ] Confirm viewport feedback still behaves as before.
- [ ] Confirm AI review behavior still behaves as before.

## Phase 8: Build and Final Checks

- [ ] Run the available build or type-check command.
- [ ] Fix import or type errors caused by file movement.
- [ ] Do not fix unrelated issues unless they block the refactor.
- [ ] Run `git status` and review changed files.
- [ ] Confirm that no unrelated files were changed.
- [ ] Confirm that no new packages were added.
- [ ] Confirm that no future-scope features were implemented.

## Completion Criteria

The refactor is complete when:

- the app runs
- the UI looks the same
- current interactions still work
- feature folders are clearer
- domain concepts are separated from display components
- mock data is clearly located
- official shadcn/ui components remain untouched
- future backend and 3D viewer support remain documented only
- the implementation can be committed separately

## Recommended Commit Message

```txt
Refactor ModelScope source structure for V2
```
