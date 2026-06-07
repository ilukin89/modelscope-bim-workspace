# ModelScope BIM Workspace

ModelScope is a small code-first UI prototype for a professional BIM / 3D model review workspace. It is intentionally a product interface prototype, not a BIM renderer or model-processing engine.

**Live demo:** coming soon
**Code:** https://github.com/ilukin89/modelscope-bim-workspace

## Why this prototype exists

This project explores how a technical B2B workspace can be designed and implemented directly in code while keeping a coherent component system. The viewport is treated as the primary workspace, with model navigation, object inspection, issue review, layer visibility, and AI-assisted coordination organized around it.

The goal was not to build real BIM functionality, but to demonstrate product UI judgment around a complex, viewport-first professional tool.

## What it demonstrates

* Code-first product design workflow
* React state for visible product interactions, not static mockups
* shadcn/ui used as a design-system foundation
* Semantic CSS variables and Tailwind theme tokens
* Viewport tool modes with visible viewport feedback
* Layer visibility affecting the viewport, not only row styling
* Floor selection with a visible section/floor marker
* Issue selection connected to viewport highlight, object label, and inspector content
* AI Review as a floating findings entry point
* Responsive Model Explorer access for narrower screens
* Light and dark themes with semantic state colors
* A practical in-product design-system reference

## Tech stack

* Vite
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI
* lucide-react

The shadcn/ui component source in `src/components/ui/` was installed through the shadcn CLI:

```bash
npx shadcn@latest add button card badge tabs separator progress tooltip dropdown-menu
```

ModelScope extends the generated Button and Badge variants with compact product sizes and semantic BIM review states while retaining the shadcn/Radix component structure.

## Project structure

```txt
src/
  App.tsx
  components/
    ui/
    workspace/
      TopBar.tsx
      ModelExplorer.tsx
      Viewport.tsx
      ViewportToolbar.tsx
      ObjectInspector.tsx
      StatusBar.tsx
      DesignSystemPanel.tsx
```

## Design and implementation notes

### Viewport-first interaction model

The prototype treats the viewport as the source of truth. Tool changes, selected floors, issue states, and visibility controls all need visible consequences in the main workspace, not only in side panels or status labels.

Examples:

* Section mode strengthens the floor/section plane.
* Measure mode displays a measurement annotation.
* Comment mode displays a comment marker.
* Floor selection moves the visible floor marker.
* Issue selection updates the object label and model highlight.

### AI Review

AI Review is represented as a floating findings control rather than a small toolbar badge. It shows the number of findings and opens a local findings panel / AI Review state. Selecting a finding updates the selected object context and viewport highlight.

No real AI inference is implemented. The AI Review flow uses local mock data to demonstrate interaction patterns.

### Model Explorer on smaller screens

On desktop, the Model Explorer is shown as a left sidebar. On tablet and mobile widths, it is accessible through a responsive Sheet/Drawer so floors, disciplines, saved views, and open issues remain reachable.

The Sheet overlay was adjusted for this product context: the viewport remains visible while the Model Explorer is open, because users need to see model changes after selecting floors, layers, issues, or AI findings.

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

* Real IFC, Revit, or point-cloud parsing
* WebGL or geometry rendering
* Model upload and persistence
* Authentication, permissions, and project administration
* Real-time collaboration
* Production issue tracking or BCF exchange
* AI inference or automated clash detection
* Mobile-first model review

The fake viewport maps Architecture, Structure, Mechanical, and Electrical to separate SVG groups. Electrical is hidden by default and represented only by small cable/detail lines in this prototype.

## Next possible iterations

* Replace the illustrative viewport with a Three.js scene and real selection states.
* Add collapsible and resizable panels with persisted workspace preferences.
* Introduce issue creation, threaded comments, assignments, and BCF import/export.
* Add keyboard shortcuts and a command palette for expert workflows.
* Connect design tokens to a broader component catalog and visual regression tests.
* Prototype loading, empty, error, and permission states for real project data.
