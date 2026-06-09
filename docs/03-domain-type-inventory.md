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
