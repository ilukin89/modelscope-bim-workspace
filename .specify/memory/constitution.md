# ModelScope BIM Workspace Constitution

## Core Principles

### I. Spec-Driven Development First

All meaningful work on this project must start from documented intent before implementation.

Before a new feature, refactor, or architectural change is implemented, the project must define:

- product goal
- user problem
- UX flow or interaction rule
- frontend constraints
- data model or mock data boundary
- backend scope or explicit backend exclusion
- acceptance criteria

Implementation must not introduce speculative features that are not described in the active spec.

### II. Viewport as Source of Truth

ModelScope is a viewport-first BIM review workspace.

Any user action related to floors, layers, issues, AI findings, object selection, visibility, or saved views must have a visible consequence in the main workspace or clearly explain why no visual change is available in the current prototype.

Sidebar controls, filters, cards, badges, and panels must not behave as decorative UI only. If something looks interactive, it must either work or appear visually static.

### III. Prototype Honesty and Scope Boundaries

The project may grow toward real 3D model support, backend persistence, model upload, authentication, permissions, comments, and AI-assisted review workflows, but each capability must be introduced through a separate documented spec.

The current V2 direction is a scalable UX Engineering prototype, not a production BIM platform.

Unless explicitly specified, the project must not add:

- real IFC/Revit parsing
- real model upload
- backend services
- authentication
- persistent database logic
- real-time collaboration
- BCF exchange
- AI inference
- enterprise permission systems

Future capabilities may be documented as planned scope, but not silently implemented.

### IV. Clear Product, UX, Frontend, and Backend Separation

The project must separate four perspectives:

- Product Owner: product goal, user value, MVP boundaries, priority, out-of-scope decisions
- UX Designer: information architecture, user flows, interaction states, responsive behavior, accessibility
- Frontend: component architecture, state handling, official UI library usage, routing, implementation constraints
- Backend: future data model, persistence boundaries, API assumptions, authentication and permission strategy

The repository should make these perspectives visible through documentation and code structure.

UI components should not own domain definitions. Domain concepts such as Project, Model, Model Version, Floor, Layer, Object, Issue, AI Finding, Saved View, User, Role, and Permission should be documented and separated from display-only components.

### V. Controlled AI-Assisted Implementation

AI coding tools may be used for planning, refactoring, implementation, and review, but they must operate under documented constraints.

AI agents must:

- read the active spec before changing code
- follow acceptance criteria
- avoid broad unsolicited rewrites
- avoid adding packages unless explicitly requested
- preserve existing UI behavior unless the spec says otherwise
- avoid fake shadcn-style or shadcn-compatible components
- use official shadcn/ui components from `src/components/ui/...`
- keep mock data clearly separated from future backend assumptions

Broad prompts such as “improve this project” are not acceptable for implementation work.

## Additional Project Constraints

### Technology Constraints

The current project uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- official shadcn/ui components

These choices should remain stable unless a future spec explicitly documents a change.

### UI and Interaction Constraints

- No fake clickable UI.
- No visual control should exist without a clear purpose.
- Responsive behavior must preserve access to the main workspace.
- Mobile and tablet overlays must not block the viewport when viewport feedback is essential.
- Empty states must explain the next useful action.
- Selection states must be visible in the primary workspace, not only in sidebar styling.

### Data and Backend Constraints

Mock data is allowed in the prototype, but it must be clearly identified as mock data.

Future backend work must first define:

- data entities
- API boundaries
- persistence rules
- authentication assumptions
- permission rules
- file storage assumptions
- what remains out of scope

Backend logic must not be introduced casually inside frontend components.

## Development Workflow

Each major change should follow this order:

1. Update or create the relevant spec.
2. Define acceptance criteria.
3. Clarify out-of-scope items.
4. Plan implementation.
5. Implement the smallest safe change.
6. Review against acceptance criteria.
7. Document important decisions or trade-offs.

The preferred first V2 milestone is not a new feature. The preferred first V2 milestone is a structure and documentation refactor that makes the project easier to scale later.

## Governance

This constitution supersedes ad hoc implementation decisions.

If a future spec conflicts with this constitution, the constitution must be updated first, with a clear explanation of why the change is needed.

All future work should protect the main portfolio message:

ModelScope is a code-first UX Engineering prototype for complex BIM review workflows. It demonstrates how product thinking, UX structure, frontend implementation, future backend boundaries, and AI-assisted development can be organized through a spec-driven workflow.

## TypeScript and React implementation rules

- Use standard TypeScript conventions for unused parameters.
  Prefix unused interface implementation parameters with `_`, for example `_container: HTMLElement`.
  Do not use `void paramName` as a workaround for unused parameters.

- Do not add public class getters, methods, or properties unless they are required by an interface or used by the application.

- Before declaring a new constant, helper, or utility, check whether the same concept already exists in the feature data file, shared types file, or nearby module.
  Prefer importing an existing source of truth over redeclaring a duplicate.

- Do not parse semantic values from display strings.
  If the UI needs priority, status, type, severity, or decision state, model it as an explicit typed field or union.

- Avoid broad `string` fields for controlled domain values.
  Use literal unions for stable categories such as status, priority, severity, review decision, candidate type, or workflow stage.

- When a spec introduces new data entities or mock data,
  define and lock the types file first.
  Data files and components must not be written before the types they depend on are reviewed.

- Inline prop types are allowed only for very small components.
  If a component has more than two props, define a named props type above the component.

- Keep React components focused.
  If a component grows because of large render-only JSX blocks, extract presentational subcomponents instead of adding more inline markup.

- A main workspace component may orchestrate state and compose child components, but it should not contain large SVGs, long card lists, dialog markup, and panel markup in the same file.

- Build passing is necessary but not sufficient.
  Refactor PRs must also check for duplicated constants, stale helpers, dead public API, and AI workaround patterns.

- If a function or component exceeds roughly 150 lines, check whether it mixes state, rendering, data mapping, and side effects. Extract render-only sections before adding more logic.

## Implementation Quality Checklist

Run before finishing:

```bash
grep -rnE '^\s*void [A-Za-z_][A-Za-z0-9_]*;?\s*$' src/ --include="*.ts" --include="*.tsx"
```

→ must return empty

This check catches standalone `void paramName` statements used to silence unused parameters.
Valid async fire-and-forget calls such as `void initializeAdapter()` inside React effects are allowed when intentional.

```bash
grep -rhoE '^export (const|function) [A-Za-z_][A-Za-z0-9_]+' src/features/ --include="*.ts" --include="*.tsx" \
  | sed -E 's/^export (const|function) //' \
  | sort \
  | uniq -d
```

→ must return empty

```bash
npm run build
```

→ must pass

Then confirm:

- no new broad `string` fields for controlled domain values
- no new public class getters/methods unless required by interface or used by the app
- no large inline JSX blocks added to workspace/orchestrator components
- no parsing semantic values from display copy
- no standalone `void paramName` statements used to silence unused parameters
- unused parameters use the `_paramName` convention
- intentional async fire-and-forget calls such as `void initializeAdapter()` are allowed in React effects
- no inline prop types for components with more than two props
- no UI behavior or visual changes hidden inside refactor-only work

**Version**: 1.0.0 | **Ratified**: 2026-06-08 | **Last Amended**: 2026-06-25
