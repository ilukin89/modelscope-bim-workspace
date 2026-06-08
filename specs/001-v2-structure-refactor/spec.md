# Spec: V2 Structure Refactor

## Feature Name

V2 Structure Refactor

## Status

Draft

## Goal

Reorganize the existing ModelScope BIM Workspace project into a clearer, more scalable structure without changing visible UI behavior.

This refactor prepares the project for possible future growth toward real 3D model support, backend persistence, model upload, user accounts, roles, permissions, saved views, comments, and AI-assisted review workflows.

This spec does not implement those future capabilities.

## Why This Matters

The current project works as a code-first UX Engineering prototype, but its structure is still optimized for a small UI demo.

For V2, the repository should better demonstrate that the project can scale as a serious product prototype. The structure should make product areas, feature boundaries, domain concepts, mock data, and future backend/3D boundaries easier to understand.

This is especially important because the project is intended to show AI-assisted, spec-driven development for a UX Engineer / Product Designer profile.

## Current Problem

The current structure may become difficult to scale if new scope is added directly.

Main risks:

- product logic may remain too tightly coupled to UI components
- domain concepts may stay grouped too broadly
- mock data may be confused with future backend logic
- viewport logic may become mixed with future 3D viewer implementation
- AI review and issue review may not have clear product boundaries
- shared UI components and product-specific feature components may become harder to distinguish

## In Scope

This refactor may:

- create a clearer `src/app/` area for app-level structure
- create feature folders for main product areas
- create domain folders for core product entities
- separate shared UI components from layout components
- separate mock data from display components
- prepare a future viewer adapter boundary
- preserve existing shadcn/ui usage
- preserve current visual design and current behavior
- update imports as needed after moving files
- update documentation if the final structure differs from the original plan

Target feature areas:

- workspace
- viewport
- model explorer
- object inspector
- issue review
- AI review

Target domain areas:

- project
- model
- issue
- AI finding
- user
- permissions

## Out of Scope

This refactor must not add:

- backend services
- API routes
- database logic
- authentication
- user accounts
- real permissions implementation
- model upload
- real IFC/Revit parsing
- real WebGL/3D rendering
- real AI inference
- new product features
- routing unless required only for safe app structure

This refactor must not visually redesign the app.

## Product Rules

The project remains a viewport-first BIM review workspace.

The viewport must remain the source of truth for model-related interactions.

Controls related to floors, layers, issues, AI findings, object selection, or visibility must keep their current visible feedback behavior.

AI Findings and Issues must remain conceptually separate:

- AI Finding = suggested or generated review signal
- Issue = user-confirmed review item

## UX Rules

The refactor must preserve:

- current layout
- current responsive behavior
- current visible states
- current issue selection behavior
- current object inspector behavior
- current model explorer behavior
- current AI review behavior
- current viewport feedback behavior

No fake clickable UI may be introduced.

Anything that looks interactive must either work or appear visually static.

## Frontend Rules

The project must continue to use:

- React
- TypeScript
- Vite
- Tailwind CSS
- official shadcn/ui components

Official shadcn/ui components must remain in:

- `src/components/ui/`

Do not create custom “shadcn-style” or “shadcn-compatible” replacements.

Product-specific components should move toward feature folders.

Reusable non-shadcn layout components may live in:

- `src/components/layout/`

Domain types and mock data should not be owned by visual components.

## Suggested Target Structure

The target structure may follow this direction:

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
- `src/components/ui/`
- `src/components/layout/`
- `src/lib/`
- `src/styles/`

The final structure may differ slightly if the current implementation requires it, but any difference should be intentional and easy to explain.

## Acceptance Criteria

This refactor is complete when:

1. The app still runs successfully.
2. The visible UI is unchanged.
3. Existing interactions still work.
4. Main product areas are separated into feature folders.
5. Core domain concepts are separated from display components.
6. Mock data is clearly located and not confused with backend logic.
7. Official shadcn/ui components remain in `src/components/ui/`.
8. No backend, real 3D rendering, model upload, authentication, database logic, or AI inference is added.
9. Documentation remains consistent with the implemented structure.
10. The project is easier to explain as a scalable UX Engineering prototype.

## Implementation Notes

This should be treated as a structure refactor, not a feature expansion.

The preferred implementation approach is:

1. inspect current files
2. propose a file movement plan
3. move files in small batches
4. update imports
5. run the app
6. verify visual behavior
7. commit the refactor separately from documentation work

AI tools must not start implementation before reading:

- `.specify/memory/constitution.md`
- `docs/01-project-structure-inventory.md`
- `specs/001-v2-structure-refactor/spec.md`
