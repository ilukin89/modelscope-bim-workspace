# Plan: V2 Structure Refactor

## Purpose

This plan defines how the V2 structure refactor should be implemented.

The goal is to reorganize the project into clearer app, feature, domain, component, and documentation areas without changing visible UI behavior.

## Documents to Read First

Before implementation, read:

- `.specify/memory/constitution.md`
- `docs/01-project-structure-inventory.md`
- `specs/001-v2-structure-refactor/spec.md`

## Implementation Strategy

This refactor must be done in small, safe steps.

The implementation should not add new product features.

The implementation should not change the visible UI.

The implementation should not add backend, real 3D rendering, model upload, authentication, database logic, or AI inference.

## Step 1: Inspect Current Structure

Review the current `src/` structure.

Identify:

- app entry files
- workspace components
- shared UI components
- current mock data
- current type definitions
- utility files
- styling files

Do not move files yet during inspection.

## Step 2: Create Target Folders

Create the target folder structure only if needed:

- `src/app/`
- `src/features/workspace/`
- `src/features/viewport/`
- `src/features/model-explorer/`
- `src/features/object-inspector/`
- `src/features/issue-review/`
- `src/features/ai-review/`
- `src/domain/project/`
- `src/domain/model/`
- `src/domain/issue/`
- `src/domain/ai/`
- `src/domain/user/`
- `src/domain/permissions/`
- `src/components/layout/`

Keep official shadcn/ui components in:

- `src/components/ui/`

## Step 3: Move Files in Small Batches

Move files gradually.

Preferred order:

1. app-level files
2. workspace layout files
3. viewport files
4. model explorer files
5. object inspector files
6. issue review files
7. AI review files
8. domain types and mock data
9. layout components if needed

After each group, update imports.

Do not rewrite components unless required by import changes.

## Step 4: Preserve Current Behavior

After the file movement, verify that:

- the app still runs
- the main layout still looks the same
- current interactions still work
- responsive behavior is preserved
- issue selection behavior is preserved
- model explorer behavior is preserved
- viewport feedback behavior is preserved
- AI review behavior is preserved

## Step 5: Keep Future Scope Documented Only

Do not implement future features during this refactor.

Future features may be represented only as documented boundaries, not working functionality.

Examples of future boundaries:

- viewer adapter boundary for future real 3D support
- backend data model boundary
- model upload boundary
- permissions boundary
- AI finding vs issue boundary

## Expected Result

The refactor is successful when the project is easier to understand and extend, while the UI behaves the same as before.

The final project should clearly separate:

- app shell
- feature modules
- domain concepts
- shared UI components
- layout components
- mock data
- future backend and 3D boundaries

## Validation

After implementation, run:

- project install/build command if needed
- development server
- TypeScript/build check if available

Then manually verify the main workspace screen.

## Commit Strategy

The implementation should be committed separately from the documentation work.

Recommended implementation commit message:

```txt
Refactor ModelScope source structure for V2
```
