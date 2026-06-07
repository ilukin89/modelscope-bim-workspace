# ModelScope BIM Workspace

ModelScope is a small code-first UI prototype for a professional BIM and 3D model review workspace. It is intentionally a product interface demonstration, not a BIM renderer or model-processing engine.

## Why it exists

The prototype explores how a technical B2B workspace can be designed and implemented directly in code while retaining a coherent design system. The viewport remains the primary surface, with model navigation, object inspection, issue review, and AI-assisted coordination organized around it.

## What it demonstrates

- A code-first product design workflow
- shadcn/ui patterns used as a design-system foundation
- Semantic CSS variables and Tailwind theme tokens
- Responsive professional-tool layout without horizontal page overflow
- Interactive model layer visibility, viewport tools, issue selection, and view switching
- Light and dark themes with semantic state colors
- Reusable components for model exploration, viewport controls, inspection, and status
- A practical in-product design-system reference

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components installed through the shadcn CLI
- Radix UI
- lucide-react

The component source in `src/components/ui/` was installed with:

```bash
npx shadcn@latest add button card badge tabs separator progress tooltip dropdown-menu
```

ModelScope extends the generated Button and Badge variants with compact product
sizes and semantic BIM review states while retaining the shadcn/Radix component
structure.

## Run locally

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
```

## Project structure

```text
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

## Intentionally out of scope

- Real IFC, Revit, or point-cloud parsing
- WebGL or geometry rendering
- Model upload and persistence
- Authentication, permissions, and project administration
- Real-time collaboration
- Production issue tracking or BCF exchange
- AI inference or automated clash detection
- Mobile-first model review

The fake viewport maps Architecture, Structure, Mechanical, and Electrical to
separate SVG groups. Electrical is hidden by default and is represented only by
small cable/detail lines in this prototype.

## Next possible iterations

1. Replace the illustrative viewport with a Three.js scene and real selection states.
2. Add collapsible and resizable panels with persisted workspace preferences.
3. Introduce issue creation, threaded comments, assignments, and BCF import/export.
4. Add keyboard shortcuts and a command palette for expert workflows.
5. Connect design tokens to a broader component catalog and visual regression tests.
6. Prototype loading, empty, error, and permission states for real project data.
