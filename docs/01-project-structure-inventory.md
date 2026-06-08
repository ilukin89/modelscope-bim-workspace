# ModelScope BIM Workspace — Project Structure Inventory

## Purpose

This document defines the main product and code areas of ModelScope BIM Workspace before the project is reorganized for V2.

The goal is to identify the existing parts of the project, clarify their responsibilities, and prepare a scalable structure for future growth.

This document must be reviewed before any AI-assisted refactor.

## Current Project Type

ModelScope BIM Workspace is currently a code-first UX Engineering prototype for a BIM model review workspace.

It demonstrates:

- viewport-first review workflow
- model explorer behavior
- layer and floor visibility controls
- issue review
- object inspection
- AI review states
- responsive workspace behavior
- shadcn/ui-based interface implementation

The current project is not a production BIM platform.

## V2 Direction

V2 should make the project more scalable and easier to grow later.

V2 should prepare the project for possible future support of:

- real 3D model viewer
- backend persistence
- model upload
- user accounts
- roles and permissions
- comments
- saved views
- AI-assisted review workflows

These future capabilities must be documented, but not implemented unless a dedicated spec explicitly includes them.

## Main Product Areas

### 1. App Shell

Responsible for:

- application frame
- global layout
- top-level routing if added later
- global providers if added later

This should not contain detailed workspace logic.

### 2. Workspace

Responsible for:

- main BIM review workspace layout
- coordination between viewport, model explorer, object inspector, issue review, and AI review
- high-level workspace state

The workspace is the central product screen.

### 3. Viewport

Responsible for:

- model display area
- visual feedback for selected issue, object, layer, or floor
- viewport toolbar
- future 3D viewer adapter boundary

The viewport must remain the source of truth for model-related interaction.

Future real 3D rendering should be introduced through a viewer adapter, not directly mixed into UI components.

### 4. Model Explorer

Responsible for:

- floor selection
- layer visibility
- discipline/model tree concept
- future model hierarchy display

Model Explorer controls must visibly affect the workspace or viewport.

### 5. Object Inspector

Responsible for:

- selected object metadata
- object properties
- linked issue context
- future object history or comments if added later

Object Inspector should display domain data, not define domain data.

### 6. Issue Review

Responsible for:

- issue list or issue cards
- selected issue state
- severity
- status
- linked object reference
- issue review workflow

Issues are user-confirmed review items.

### 7. AI Review

Responsible for:

- AI-generated or AI-suggested findings
- confidence/severity indicators
- suggested object or issue context
- future conversion from AI Finding to Issue

AI Findings are not the same as Issues.

An AI Finding may suggest a potential issue, but a user-confirmed Issue should remain a separate product entity.

### 8. Design System and Shared UI

Responsible for:

- official shadcn/ui components
- reusable layout components
- visual tokens
- badges, cards, buttons, panels, sheets, dialogs

The project must use official shadcn/ui components from `src/components/ui/...`.

Custom "shadcn-style" or "shadcn-compatible" components should not be created unless explicitly specified.

### 9. Domain Data

Responsible for:

- Project
- Model
- Model Version
- Floor
- Layer
- Object
- Issue
- AI Finding
- Saved View
- User
- Role
- Permission

Domain concepts should be separated from display components.

Mock data should be clearly separated from future backend assumptions.

## Current Structural Risks

The current project structure is acceptable for a small UI prototype, but it may become difficult to scale if future scope is added without reorganization.

Main risks:

- too much product logic in UI components
- domain types grouped too broadly
- mock data treated like real backend logic
- future 3D viewer logic mixed directly into React components
- AI review logic not separated from issue review logic
- unclear boundary between shared UI components and product-specific features
- difficult future migration to backend/API-driven data

## Target V2 Structure Direction

The target V2 structure should separate:

- app shell
- feature modules
- domain entities
- shared UI components
- layout components
- mock data / fixtures
- future viewer adapter boundary
- future backend contracts

Suggested direction:

- src/app/
- src/features/workspace/
- src/features/viewport/
- src/features/model-explorer/
- src/features/object-inspector/
- src/features/issue-review/
- src/features/ai-review/
- src/domain/project/
- src/domain/model/
- src/domain/issue/
- src/domain/ai/
- src/domain/user/
- src/domain/permissions/
- src/components/ui/
- src/components/layout/
- src/lib/
- src/styles/

## What Must Not Change During First V2 Refactor

The first V2 refactor must not change visible UI behavior.

It must not add:

- backend
- real 3D rendering
- model upload
- authentication
- database logic
- real AI inference
- new product features

The first V2 refactor should only improve structure, documentation, and future scalability.

## Acceptance Direction for First V2 Refactor

A first structure refactor is successful when:

- the existing UI still works
- the visible design is preserved
- current user interactions still behave the same
- feature areas are easier to identify
- domain concepts are separated from UI components
- mock data is clearly located
- future backend and 3D viewer boundaries are documented but not implemented
