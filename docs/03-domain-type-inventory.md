# ModelScope BIM Workspace — Domain Type Inventory

## Purpose

This document prepares the project for a future domain/type refactor.

The goal is to understand what currently lives inside `src/types.ts` before moving or splitting any type definitions.

This document must be completed before any AI-assisted modification of `src/types.ts`.

## Why This Exists

`src/types.ts` is a central file. It likely contains multiple kinds of types mixed together:

- app-level state types
- UI state types
- viewport interaction types
- project/model/domain types
- object metadata types
- issue/review types
- AI review related types

Because many components may depend on this file, splitting it too early could create unnecessary TypeScript and import regressions.

The first step is inventory, not refactor.

## Current File Under Review

- `src/types.ts`

## Current Risk

The current `types.ts` file may be doing too many jobs at once.

Potential risks:

- domain types and UI types are mixed together
- app state types and product data types are not separated
- AI review and issue review types may not have clear boundaries
- future backend/API contracts may be harder to introduce
- future 3D viewer data structures may become mixed with UI display logic

## Target Future Direction

In a future refactor, types may be separated into areas such as:

- `src/app/types.ts`
- `src/features/viewport/types.ts`
- `src/features/model-explorer/types.ts`
- `src/features/object-inspector/types.ts`
- `src/domain/project/types.ts`
- `src/domain/model/types.ts`
- `src/domain/issue/types.ts`
- `src/domain/ai/types.ts`

This document does not require all of these files to be created.

Empty folders or empty type files should not be created just to satisfy an ideal structure.

## Inventory Table

Fill this table after inspecting `src/types.ts`.

| Current Type | Current Responsibility | Suggested Future Location | Move Now? | Notes             |
| ------------ | ---------------------- | ------------------------- | --------- | ----------------- |
| TBD          | TBD                    | TBD                       | No        | Inventory pending |

## Classification Rules

Use these rules when classifying types.

### App-Level Types

Types that describe app-level navigation, current view, selected panels, or global UI mode may belong in:

- `src/app/types.ts`

### Feature-Level Types

Types that only exist to support a specific UI feature may belong near that feature.

Examples:

- viewport tool state
- inspector tab state
- explorer filter state

Possible future locations:

- `src/features/viewport/types.ts`
- `src/features/object-inspector/types.ts`
- `src/features/model-explorer/types.ts`

### Domain Types

Types that describe product entities should not be owned by visual components.

Examples:

- Project
- Model
- ModelVersion
- Floor
- Layer
- Object
- Issue
- AI Finding
- Saved View
- User
- Role
- Permission

Possible future locations:

- `src/domain/project/types.ts`
- `src/domain/model/types.ts`
- `src/domain/issue/types.ts`
- `src/domain/ai/types.ts`
- `src/domain/user/types.ts`
- `src/domain/permissions/types.ts`

### Backend/Future API Types

Do not introduce backend/API types yet.

If a type looks like a future backend contract, document it as future scope only.

## What Must Not Happen Yet

This inventory step must not:

- modify `src/types.ts`
- split `src/types.ts`
- create domain folders
- update imports
- change app behavior
- add backend contracts
- add API schemas
- add new product features

## Recommended Next Step

After this document is created, use an inspection-only AI prompt to analyze `src/types.ts`.

The AI task should return:

1. list of all exported types
2. responsibility of each type
3. suggested future location
4. whether it should move now or later
5. risks of splitting the file
6. safest first type-refactor batch

The AI must not modify files during that inspection.

## Inspection Result: `src/types.ts`

### Exported Types

Current exported types in `src/types.ts`:

- `AppView`
- `InspectorTab`
- `ProjectId`
- `FloorName`
- `ViewportTool`
- `LayerId`
- `LayerState`
- `FloorState`
- `IssueSeverity`
- `HighlightKind`
- `ObjectGeometry`
- `ObjectDetails`
- `ReviewIssue`
- `ProjectData`

### Recommended Type Ownership

| Type             | Suggested Future Location                                     | Move Timing  | Reason                                                                        |
| ---------------- | ------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `AppView`        | `src/app/types.ts`                                            | Later        | App-level structure is not being refactored yet.                              |
| `InspectorTab`   | `src/features/object-inspector/types.ts`                      | Move now     | Dependency-free and clearly owned by Object Inspector.                        |
| `ProjectId`      | `src/domain/project/types.ts`                                 | Later        | Coupled to current mock-project fixtures.                                     |
| `FloorName`      | `src/domain/model/types.ts`                                   | Later        | Shared by multiple model/object structures.                                   |
| `ViewportTool`   | `src/features/viewport/types.ts`                              | Move now     | Dependency-free and clearly owned by Viewport.                                |
| `LayerId`        | `src/domain/model/types.ts`                                   | Later        | Shared by explorer and issue data.                                            |
| `LayerState`     | `src/features/model-explorer/types.ts`                        | Later        | Still embedded in `ProjectData`; mixes display and interaction state.         |
| `FloorState`     | `src/features/model-explorer/types.ts`                        | Later        | Still embedded in `ProjectData`.                                              |
| `IssueSeverity`  | `src/domain/issue/types.ts`                                   | Later        | Should move with a future issue-domain batch.                                 |
| `HighlightKind`  | `src/features/viewport/types.ts`                              | Later        | Currently embedded in `ReviewIssue`, creating cross-feature dependency.       |
| `ObjectGeometry` | `src/features/object-inspector/types.ts`                      | Later        | Should move together with `ObjectDetails`.                                    |
| `ObjectDetails`  | `src/features/object-inspector/types.ts`                      | Later        | Currently embedded directly in `ReviewIssue`.                                 |
| `ReviewIssue`    | `src/domain/issue/types.ts`                                   | Later        | Couples issue, model, viewport, and inspector concerns.                       |
| `ProjectData`    | `src/features/workspace/types.ts` or remain in `src/types.ts` | Stay for now | It is an aggregate mock workspace shape, not a clean backend/domain contract. |

### Main Risks

Splitting `src/types.ts` too early could create:

- circular dependencies between issue, viewport, inspector, model-explorer, and workspace types
- misleading domain ownership for display-state types
- a fake backend/API contract around `ProjectData`
- unnecessary import churn
- regressions in TypeScript types
- weaker separation between current `ReviewIssue` and future AI Finding concepts

### Safest First Type Batch

Move only:

- `ViewportTool` → `src/features/viewport/types.ts`
- `InspectorTab` → `src/features/object-inspector/types.ts`

Both are dependency-free UI-state unions and have clear feature ownership.

All interconnected domain, mock-data, object, issue, floor, and layer types should remain in `src/types.ts` for now.
