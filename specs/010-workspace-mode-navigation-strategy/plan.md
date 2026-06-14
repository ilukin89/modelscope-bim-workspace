# Plan: Workspace Mode Navigation Strategy

## Purpose

This plan defines documentation-only product, information-architecture, and
responsive-navigation boundaries for introducing `Model Review` and
`Drawing Triage` as primary modes inside the existing Workspace app view.

No runtime behavior is implemented in this phase.

## Documents and Source Reviewed

- `README.md`
- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/08-ai-drawing-triage-workflow.md`
- `specs/009-ai-drawing-triage-workflow-strategy/spec.md`
- `src/App.tsx`
- `src/components/layout/TopBar.tsx`
- `src/features/viewport/Viewport.tsx`
- `src/features/model-explorer/ModelExplorer.tsx`
- `src/features/object-inspector/ObjectInspector.tsx`

## Summary

Keep one Workspace app view and introduce a product-level mode selector inside
its existing topbar:

```text
project/status context | primary workspace mode | prototype utilities

ModelScope + project    | Model Review           | Workspace / Design
sync + issues           | Drawing Triage         | theme
```

On desktop, use visible text navigation with a restrained active underline in
the topbar center. On mobile, show one active-mode disclosure that preferably
opens as a compact topbar-anchored dropdown or popover. Do not create a second
segmented control and do not add a heavy navigation row.

`Model Review` stays the default and retains the current workspace unchanged.
`Drawing Triage` later replaces all three workspace regions with drawing
artifact context, a 2D preview, and candidate review details.

## Current Product Context

The current topbar has two clear edge groups:

- left: ModelScope identity, project selection, sync state, unresolved issues
- right: `Workspace / Design` and theme

The current Workspace content is a responsive three-region grid:

- left: Model Explorer, hidden into a sheet below its desktop breakpoint
- center: viewport, toolbar, AI Review card, issue feedback, and mobile panel
  triggers
- right: Object Inspector, hidden into a sheet at the mobile breakpoint

The existing hierarchy is compact and viewport-first. A new persistent row
would consume vertical space and imply a heavier application shell than this
prototype needs. A second pill control would also make product modes appear
equivalent to the prototype-only `Workspace / Design` choice.

## Primary Navigation Recommendation

### Three Levels

| Level | Purpose | Placement | Treatment |
| --- | --- | --- | --- |
| Project/status context | Answers "where am I and what is its state?" | Left topbar group | Existing brand, project selector, and semantic badges |
| Workspace mode | Answers "what primary task am I doing?" | Center topbar group | Text navigation with restrained active emphasis |
| Prototype utility | Answers "which prototype surface or theme am I viewing?" | Right topbar group | Existing segmented control and theme icon |

The selected project and its status persist when the workspace mode changes.
The `Workspace / Design` choice sits outside the product-mode model and must
remain visually secondary.

### Desktop Composition

Use a single-row, three-region topbar structure:

```text
[left flexible region] [intrinsic mode navigation] [right flexible region]
```

The two outer regions should be allowed to truncate or hide existing
lower-priority status detail at their current breakpoints. The center region
must not be positioned in a way that overlaps either edge group.

Recommended mode treatment:

- visible labels: `Model Review` and `Drawing Triage`
- compact text targets with sufficient hit area
- readable, muted inactive text using existing semantic theme values
- stronger active text
- subtle cyan/accent underline or bottom indicator
- no enclosing shared pill, filled selection capsule, or duplicate segmented
  border
- visible theme-adaptive focus ring that is distinct from the active underline

The recommendation keeps the current topbar height and avoids a second
navigation stripe.

### Theme-Adaptive Styling

The product mode navigation must fit the existing ModelScope visual system in
both light and dark mode. It must use semantic theme values rather than
hard-coded dark-only surfaces or text colors.

In dark mode:

- use the existing dark topbar and panel surfaces
- allow subtle dark-on-dark separation and borders
- keep inactive text muted but readable
- use a restrained cyan/accent underline or equivalent active indicator

In light mode:

- use the corresponding existing light topbar and panel surfaces
- retain subtle borders without creating a heavy navigation container
- keep inactive text readable against the lighter surface
- use the same restrained active indication and hierarchy

The navigation's structure and meaning remain identical across themes. Neither
theme may turn it into a bordered or filled duplicate of the right-side
`Workspace / Design` segmented control.

### Responsive Collision Policy

There are two related but separate responsive decisions:

1. workspace mode navigation decides whether both mode labels remain visible or
   collapse into one active-mode selector
2. side-panel behavior decides whether panels remain retractable or open as
   mobile modal sheets/overlays

These decisions do not need to change at the same breakpoint.

The implementation should prioritize content in this order:

1. retain the active workspace mode
2. retain prototype utility access
3. retain project identity
4. retain both visible desktop modes at wide desktop sizes
5. truncate long project names
6. hide existing status badges at their current compact breakpoint

Use this initial breakpoint contract:

| Width | Mode navigation | Side-panel behavior |
| --- | --- | --- |
| `<= 680px` | Collapse to one active-mode selector | Mobile closed triggers; open overlays may use `X` |
| `681px-900px` | Keep labels if they fit; collapse before collision | Prefer retractable panels at current widths |
| `901px-1199px` | Prefer visible labels; collision-test the full topbar | Persistent or retractable panels |
| `>= 1200px` | Show both visible labels | Persistent or retractable panels |

These bands are an implementation starting contract, not a permanent design
law. Confirm the final mode-navigation collapse point in a browser with:

- the longest supported project name
- the visible `Workspace / Design` utility switch
- the theme toggle
- status badges where available
- both workspace mode labels

Collapse mode navigation before it overlaps the project/status group or the
right-side utilities. A compact tablet may therefore use the single active-mode
selector while retaining retractable side panels and current panel widths.

### Mobile Composition

Do not place two persistent mode tabs in the mobile topbar.

Use one compact control:

```text
Model Review  v
```

The preferred open behavior is a compact topbar-anchored dropdown or popover
containing both modes, with a checkmark or equivalent semantic active indicator.
It should feel like a continuation of the topbar navigation vocabulary, not a
floating pill or a separate modal action surface. The component choice should
use existing shadcn/Radix primitives and requires no new package.

Avoid a bottom sheet unless implementation constraints require it. If a sheet
is necessary, keep it visually connected to the topbar selector and lightweight
rather than presenting it as a large, heavy modal action surface.

The closed selector must remain lightweight. It must not replace:

- current topbar identity and utilities
- Model Explorer access
- Inspector access
- viewport toolbar
- AI Review card
- center viewport dominance

The selector must use theme-adaptive surfaces, borders, text, focus, and active
indicators in both light and dark mode.

This planning PR leaves existing Model Review side-panel behavior unchanged. In
a later implementation, panel content, trigger positions, and current widths
remain preserved, while open-panel affordances should follow the responsive
consistency rules below. A later Drawing Triage implementation may keep the same
trigger positions while giving them mode-appropriate accessible names and panel
content.

### Side-Panel Affordance Contract

Closed and open panel affordances have different responsibilities:

- **Closed state, all widths**: The existing side trigger or retracted
  side-panel icon remains appropriate on mobile, tablet, and desktop.
- **Open mobile state (`680px` or below)**: A panel may behave as a modal sheet
  or overlay and use an `X` close button. At this width, preserving the entire
  workspace beside the open panel is not required.
- **Open compact-tablet state (for example, iPad Mini portrait around `768px`
  CSS viewport width)**: Retractable side-panel behavior is preferred. If an
  open panel is presented as retractable, use its retract or collapse affordance
  rather than a modal `X`.
- **Open desktop and large-tablet state**: Persistent or retractable panels may
  use the existing side-panel collapse affordances.

At any shared tablet breakpoint, do not present one open panel as modal with an
`X` while presenting the other as retractable with a side-panel affordance.
Both sides should communicate the same panel model.

This strategy does not change panel dimensions. Keep the current tablet panel
widths.

## Workspace Content Contracts

### Model Review

Model Review is the baseline contract and should be wrapped, selected, or
composed without redesign:

| Region | Current content to preserve |
| --- | --- |
| Left | Model Explorer with floors, disciplines, saved views, and issues |
| Center | Model viewport, toolbar, visible selection feedback, AI Review card |
| Right | Object Inspector with properties, issues, AI Review, and history |
| Mobile | Existing explorer and inspector triggers and sheets |

No copy, layout, control, breakpoint, or interaction change is authorized for
this mode by the current planning work.

### Drawing Triage

Drawing Triage is a future content contract:

| Region | Future responsibility |
| --- | --- |
| Left | Uploaded drawing list, selected artifact identity, page/artifact context |
| Center | Dominant 2D drawing or page preview with selected evidence context |
| Right | AI candidate list/detail, evidence, uncertainty, and human decision context |
| Mobile | Same spatial hierarchy, with mode-aware side panels and dominant preview |

The Drawing Triage mode must follow the vocabulary and human-review safeguards
defined in `docs/08-ai-drawing-triage-workflow.md`. It must not present visual
AI candidates as confirmed clashes or issues.

## Mode Change Behavior

A mode change is an application workspace composition change:

```text
Model Review
  -> Model Explorer + 3D viewport + Object Inspector

Drawing Triage
  -> Artifact context + 2D preview + Candidate review
```

It is not:

- an Object Inspector tab change
- a Model Explorer section change
- an AI Review card state
- a replacement for `Workspace / Design`
- a route change in the first implementation

The first implementation should use local UI state unless a separate routing
spec authorizes URLs, deep links, or persistence.

## Accessibility and Interaction Rules

- Desktop mode options must be reachable in logical topbar tab order.
- Active state must be communicated programmatically and not by color alone.
- Focus indication must remain visible against both light and dark topbar
  surfaces.
- After a desktop mode selection, focus should remain on or return to the mode
  control rather than automatically moving into the changed workspace.
- The mobile disclosure must expose its expanded state and active mode.
- Selecting a mobile mode must close the dropdown or popover and return focus to
  the trigger control.
- The preferred mode-selector overlay is anchored to its topbar trigger and
  remains compact.
- The active mode must have a checkmark or equivalent semantic indicator.
- Avoid a large bottom sheet and floating-pill treatment for mode selection.
- Closed side-panel triggers may keep their existing retracted icons at every
  supported width.
- An open mobile modal sheet may use an `X` close button.
- An open retractable side panel at tablet or desktop widths should use a
  retract or collapse affordance instead of a modal `X`.
- Left and right open-panel affordances should remain consistent at the same
  compact-tablet breakpoint.
- Mode labels should remain full words; avoid unexplained icon-only navigation.
- Reduced motion is sufficient; no decorative transition is needed.
- The changed workspace must expose a clear heading, landmark, or programmatic
  active-state update so keyboard and screen-reader users can identify that the
  workspace content changed without relying on the topbar alone.

## Constitution Check

- **Spec-driven development**: Pass. Product goal, UX hierarchy, responsive
  behavior, exclusions, and future acceptance criteria are documented first.
- **Viewport as source of truth**: Pass. Mode changes replace the main workspace,
  and future Drawing Triage selection must affect the central preview.
- **Prototype honesty**: Pass. No drawing preview, upload, storage, backend, AI,
  routing, or file behavior is implemented or implied as complete.
- **Separation of concerns**: Pass. Project context, product mode, prototype
  utility, content responsibilities, and future service work are separated.
- **Controlled AI assistance**: Pass. Drawing Triage inherits the provisional,
  human-in-the-loop rules from the preceding strategy.

No constitution exception is required.

## Future Implementation Sequence

### Phase 0: Navigation Documentation

Deliver this specification, plan, task sequence, and product recommendation.

### Phase 1: Workspace Mode Navigation with Mock Content

Add local workspace mode state, the desktop text navigation, and the mobile
active-mode selector. Preserve Model Review exactly. Use bounded placeholder
content for Drawing Triage sufficient to prove that the full workspace changes.

This phase must not add routes, packages, backend, upload, storage, file
handling, drawing rendering, or AI behavior.

### Phase 2: Drawing Triage Workspace Shell

Implement mode-specific left, center, and right shells with purposeful mock
empty states and responsive panel behavior. Continue using local fixtures only.

### Phase 3: Local Drawing Triage Prototype

Follow the separately specified phases in
`docs/08-ai-drawing-triage-workflow.md` for local preview, mock candidates, and
human decisions.

### Phase 4: Service Boundaries

Specify routing, persistence, upload, storage, permissions, and AI integrations
in separate future work before implementation.

## Validation Strategy for a Later Navigation PR

- compare Model Review before and after at desktop and mobile widths
- review navigation styling in both light and dark themes
- test the four starting breakpoint bands separately for mode-navigation and
  side-panel behavior
- test the longest project name with `Workspace / Design`, theme toggle, status
  badges, and both mode labels visible
- confirm mode navigation collapses before either edge group is overlapped
- confirm compact-tablet mode collapse does not force mobile panel modality
- confirm the mobile selector is a compact topbar-anchored dropdown or popover
  unless a documented constraint requires a connected lightweight sheet
- verify mobile closed triggers and open-sheet `X` behavior remain valid
- verify compact-tablet open panels use consistent retract/collapse affordances
- verify current tablet panel widths are unchanged
- confirm both mode labels are visible on desktop
- confirm one active-mode control is visible on mobile
- verify the new control is not visually confused with `Workspace / Design`
- verify neither theme makes the product modes resemble the segmented utility
- verify mode changes replace left, center, and right content
- test long project names and compact topbar widths for collisions
- test keyboard order, focus, active semantics, and overlay focus return
- verify no route, network, upload, file, storage, AI, or package change exists
- run `npm run lint`
- run `npm run build`

## Files in This Planning Phase

Create only:

- `specs/010-workspace-mode-navigation-strategy/spec.md`
- `specs/010-workspace-mode-navigation-strategy/plan.md`
- `specs/010-workspace-mode-navigation-strategy/tasks.md`
- `docs/09-workspace-mode-navigation.md`

## Explicit Out of Scope

- runtime implementation
- `src/App.tsx` changes
- `src/components/layout/TopBar.tsx` changes
- UI implementation
- route changes
- backend services
- upload behavior
- storage
- real file handling
- drawing preview implementation
- AI API calls
- changes to existing Model Review behavior
- packages

## Expected Result

The repository gains an implementation-ready navigation strategy that makes
Drawing Triage a credible primary workflow while keeping Model Review stable,
the viewport dominant, and prototype utilities clearly secondary.

## Recommended Commit Message

```text
Add workspace mode navigation strategy
```
