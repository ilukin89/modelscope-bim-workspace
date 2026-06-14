# ModelScope BIM Workspace

ModelScope is a small code-first UI prototype for a professional BIM / 3D model review workspace. It is intentionally a product interface prototype, not a BIM renderer or model-processing engine.

[![Slika-zaslona-2026-06-14-u-23-37-56.png](https://i.postimg.cc/4N0HGKsj/Slika-zaslona-2026-06-14-u-23-37-56.png)](https://postimg.cc/N51j7jyx)

**Live demo:** https://modelscope-bim-workspace.vercel.app/
**Code:** https://github.com/ilukin89/modelscope-bim-workspace

## Why this prototype exists

This project explores how a technical B2B workspace can be designed and implemented directly in code while keeping a coherent component system. The viewport is treated as the primary workspace, with model navigation, object inspection, issue review, layer visibility, and AI-assisted coordination organized around it.

The goal was not to build real BIM functionality, but to demonstrate product UI judgment around a complex, viewport-first professional tool.

## What it demonstrates

- Code-first product design workflow
- React state for visible product interactions, not static mockups
- shadcn/ui used as a design-system foundation
- Semantic CSS variables and Tailwind theme tokens
- Viewport tool modes with visible viewport feedback
- Layer visibility affecting the viewport, not only row styling
- Floor selection with a visible section/floor marker
- Issue selection connected to viewport highlight, object label, and inspector content
- AI Review as a floating findings entry point
- Responsive Model Explorer access for narrower screens
- Light and dark themes with semantic state colors
- A practical in-product design-system reference
- Workspace mode navigation for Model Review and Drawing Triage
- Responsive side-panel behavior aligned across mobile, compact tablet, large tablet, and desktop

## V2 spec-driven architecture work

The current V2 architecture introduces a spec-driven workflow for evolving the prototype beyond a simple single-page demo.

The goal is not to claim that ModelScope is already a production BIM platform. It remains a frontend-only UX Engineering prototype. The V2 work documents and introduces the first structural boundaries needed if the project later grows toward real 3D model support, backend-backed review workflows, saved views, comments, permissions, or model upload.

This includes:

- project constitution and architecture guardrails
- project structure inventory
- feature-based source organization
- implementation logs for AI-assisted refactor batches
- domain/type inventory before splitting shared types
- viewer adapter strategy and contract planning
- TypeScript-only viewer adapter interfaces
- an isolated prototype viewer adapter implementation

The work is intentionally incremental: each architectural step is documented, reviewed in a small branch/PR, validated with `npm run build`, and kept separate from unrelated feature work.

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- lucide-react

The shadcn/ui component source in `src/components/ui/` was installed through the shadcn CLI:

```bash
npx shadcn@latest add button card badge tabs separator progress tooltip dropdown-menu
```

ModelScope extends the generated Button and Badge variants with compact product sizes and semantic BIM review states while retaining the shadcn/Radix component structure.

## Project structure

The V2 structure separates shared UI primitives, app/layout components, product feature areas, mock data, documentation, and spec-driven planning files.

```txt
```txt
src/
  App.tsx
  main.tsx
  index.css
  types.ts

  components/
    ui/
      shadcn/ui primitives and local UI variants

    layout/
      TopBar.tsx

  features/
    drawing-triage/
      DrawingTriagePlaceholder.tsx

    model-explorer/
      ModelExplorer.tsx

    object-inspector/
      ObjectInspector.tsx
      types.ts

    viewport/
      Viewport.tsx
      ViewportToolbar.tsx
      types.ts

      viewer-adapter/
        types.ts
        ViewerAdapter.ts

        adapters/
          prototype/
            PrototypeViewerAdapter.ts

    workspace/
      StatusBar.tsx

  data/
    projects.ts

  lib/
    utils.ts

docs/
  01-project-structure-inventory.md
  02-v2-implementation-log.md
  03-domain-type-inventory.md
  04-viewer-adapter-strategy.md
  05-viewer-adapter-contract.md
  09-workspace-mode-navigation.md

specs/
  001-v2-structure-refactor/
  002-viewer-adapter-boundary/
  003-viewer-adapter-interfaces/
  004-prototype-viewer-adapter/
  010-workspace-mode-navigation-strategy/
```

The current application still uses mock data and a simulated SVG viewport. The viewer adapter files prepare a future boundary for real viewer integration, but they do not add real 3D rendering.

## Design and implementation notes

### Viewport-first interaction model

The prototype treats the viewport as the source of truth. Tool changes, selected floors, issue states, and visibility controls all need visible consequences in the main workspace, not only in side panels or status labels.

Examples:

- Section mode strengthens the floor/section plane.
- Measure mode displays a measurement annotation.
- Comment mode displays a comment marker.
- Floor selection moves the visible floor marker.
- Issue selection updates the object label and model highlight.

### AI Review

AI Review is represented as a floating findings control rather than a small toolbar badge. It shows the number of findings and opens a local findings panel / AI Review state. Selecting a finding updates the selected object context and viewport highlight.

No real AI inference is implemented. The AI Review flow uses local mock data to demonstrate interaction patterns.

### Side panels on smaller screens

On compact screens up to 900px, Model Explorer and Object Inspector use sheet-style access with close affordances. At 901px and above, the workspace uses persistent or retractable side panels. This keeps the interaction model aligned with the available viewport space.

### Design system view

The Design System view documents the product-specific component language: viewport tools, semantic tokens, issue severity, AI Review states, badges, object states, and panel patterns. It is meant as a practical product-system excerpt, not a decorative style guide.

## Run locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Intentionally out of scope

- Real IFC, Revit, or point-cloud parsing
- WebGL or geometry rendering
- Model upload and persistence
- Authentication, permissions, and project administration
- Real-time collaboration
- Production issue tracking or BCF exchange
- AI inference or automated clash detection
- Mobile-first model review
- Real 2D drawing upload and storage
- AI-generated drawing triage candidates

The fake viewport maps Architecture, Structure, Mechanical, and Electrical to separate SVG groups. Electrical is hidden by default and represented only by small cable/detail lines in this prototype.

## Next possible iterations

- Wire the prototype viewer adapter into the existing viewport without changing visible behavior.
- Add a small sample 3D viewer only after the adapter boundary is validated.
- Introduce saved views, comments, and issue-status persistence as a minimal backend-backed workflow.
- Add loading, empty, error, and saving states for real project data.
- Add collapsible and resizable panels with persisted workspace preferences.
- Introduce issue creation, threaded comments, assignments, and possible BCF import/export.
- Add keyboard shortcuts and a command palette for expert workflows.
- Expand the design-system reference into a broader component and interaction catalog.
- Add visual regression tests or interaction smoke tests for viewport-related behavior.
