# ModelScope BIM Workspace - Workspace Mode Navigation

## Recommendation

Introduce `Model Review` and `Drawing Triage` as primary workspace modes inside
the existing Workspace app view.

Use the center of the current topbar for desktop product navigation:

```text
Model Review    Drawing Triage
────────────
```

The active mode uses stronger text and a thin cyan/accent underline. Inactive
text remains readable and muted in the active theme. Do not place the labels
inside a bordered pill or filled segmented control.

On mobile, show one active-mode control:

```text
Model Review  v
```

It preferably opens a compact topbar-anchored dropdown or popover containing
both modes. This keeps the current mobile topbar and viewport controls from
becoming crowded without introducing a large modal action surface.

## Navigation Hierarchy

The topbar communicates three distinct questions.

### 1. Project and Status Context

**Question**: Where am I, and what is the project state?

- ModelScope
- selected project, such as `Residential Tower A`
- sync status
- unresolved issue count

This context belongs on the left and persists when workspace mode changes.

### 2. Primary Workspace Mode

**Question**: What primary review task am I doing?

- `Model Review`
- `Drawing Triage`

This belongs in the topbar's central product-navigation position. It determines
the whole left, center, and right workspace composition.

### 3. Prototype Utilities

**Question**: Which prototype surface and theme am I viewing?

- existing `Workspace / Design` switch
- theme toggle

These remain on the right. `Workspace / Design` is not a product mode. It must
remain a secondary prototype-level control and retain its existing segmented
treatment.

## Why the Modes Belong in the Existing Topbar

The current interface is a compact professional workspace with a dominant
viewport. A second navigation stripe would:

- reduce vertical space for the main workspace
- add more shell than two modes require
- compete with the viewport toolbar and AI Review card
- overstate the depth of the application hierarchy

A centered text-navigation treatment adds the missing product level without
redesigning the shell.

## Desktop Behavior

Both modes are visible on desktop. `Model Review` is active by default.

Recommended visual behavior:

| State | Treatment |
| --- | --- |
| Inactive | Muted text, transparent background |
| Hover | Foreground text, no filled capsule |
| Active | Stronger text plus thin cyan/accent underline |
| Focus | Visible focus ring independent from active state |
| Disabled | Not required for the first navigation implementation |

The navigation should feel like compact product tabs, not a second copy of the
right-side segmented utility.

## Theme-Adaptive Visual Treatment

The product mode navigation must work in both existing themes: dark mode and
light mode. The concept must use ModelScope's semantic theme values and must not
be hard-coded as dark-only.

### Dark Mode

- use the existing dark topbar and panel surfaces
- allow dark-on-dark separation through subtle borders or spacing
- keep inactive text muted but readable
- use stronger active text and a restrained cyan/accent underline
- avoid a heavy filled container around the mode group

### Light Mode

- use the corresponding existing light topbar and panel surfaces
- retain subtle borders and clear text contrast
- keep inactive text readable without making it look selected
- use the same restrained active text and underline hierarchy
- avoid adding a visually heavy navigation container

The active meaning, spacing, and interaction pattern remain consistent across
themes. Theme adaptation must not make the product mode navigation look like a
duplicate of the right-side `Workspace / Design` segmented control.

The topbar should remain one row. Its layout should reserve three regions:

```text
left project/status | centered workspace modes | right utilities
```

Long project names truncate first. Existing status badges may continue to hide
at their compact breakpoint. The mode labels and right utilities must never
overlap.

## Mode Change

Changing mode replaces the main workspace composition:

| Region | Model Review | Drawing Triage |
| --- | --- | --- |
| Left | Model Explorer | Uploaded drawings and artifact context |
| Center | Model viewport | 2D drawing preview |
| Right | Object Inspector | AI candidate review and decision details |

This is intentionally larger than a tab change. Drawing Triage must not be
implemented as:

- another Object Inspector tab
- another Model Explorer section
- an expanded AI Review card
- a replacement for `Workspace / Design`

The selected project remains the same across modes.

## Model Review Contract

`Model Review` preserves the deployed experience:

- Model Explorer on the left
- model viewport in the center
- Object Inspector on the right
- existing desktop panel collapse controls
- existing mobile Model Explorer and Inspector triggers
- existing viewport toolbar
- existing viewport state feedback
- existing AI Review card and findings interaction
- existing issue, floor, layer, and object interactions
- existing light/dark theme behavior and visual system

The later navigation PR should add the mode selector around this behavior, not
redesign the behavior itself.

## Drawing Triage Contract

`Drawing Triage` reuses the workspace grammar while changing its subject from a
3D model to a 2D artifact.

### Left: Drawing and Artifact Context

The left region may later contain:

- uploaded drawing list
- selected artifact identity and metadata
- page or sheet context
- review status and candidate counts

This is artifact navigation, not Model Explorer with renamed labels.

### Center: 2D Preview

The center remains dominant and may later contain:

- selected image or PDF page
- zoom and pan appropriate to 2D review
- selected candidate evidence region
- artifact and page identity
- purposeful empty or unavailable-preview states

Candidate selection should visibly affect this preview where evidence
coordinates are available. The central workspace remains the source of visual
truth.

### Right: Candidate Review

The right region may later contain:

- candidate list and selected candidate detail
- evidence and source references
- confidence and missing information
- suggested question and next step
- review status and decision history
- convert, dismiss, or follow-up actions

Drawing candidates remain provisional and follow
`docs/08-ai-drawing-triage-workflow.md`. They must not be presented as confirmed
clashes or issues.

This document defines future placement only. It does not authorize UI, upload,
preview, AI, file, storage, or decision implementation.

In the first navigation implementation, `Drawing Triage` must be selectable if
it appears as a workspace mode. Selecting it must replace the left, center, and
right regions with a bounded, honest placeholder or empty-state workspace. It
must not be hidden, visually disabled, inert, or presented as a finished upload
or AI workflow. The placeholder must clearly state that upload, storage, drawing
preview, and AI candidate generation are not implemented in this phase.

## Mobile Behavior

At `680px` or below, do not show two persistent workspace tabs. Use one compact
active-mode control with a chevron.

The closed control remains inside the topbar and shows the active mode, for
example `Model Review`, plus a chevron. It should feel like a continuation of
the topbar navigation vocabulary, not a floating pill.

The selector preferably opens as a compact dropdown or popover anchored to that
topbar control. It shows:

- `Model Review`
- `Drawing Triage`
- a checkmark or equivalent visible and programmatic active indicator

After selection, the overlay closes and focus returns predictably.

Avoid a large bottom sheet unless implementation constraints require one. If a
sheet is necessary, it should remain visually connected to the topbar selector
and should not behave like a heavy modal action surface.

The selector must be theme-adaptive in both light and dark mode.

The selector must not replace or obstruct:

- the current mobile topbar structure
- left-side Model Explorer access
- right-side Inspector access
- the central viewport
- viewport toolbar
- AI Review card

This planning PR does not change Model Review side-panel behavior. In a later
implementation, preserve its panel content, trigger positions, and current
widths while applying the consistent open-panel affordance rules below. For a
future Drawing Triage shell, the same spatial positions can open artifact
context and candidate-detail panels with mode-appropriate labels.

The preview or viewport remains the largest and most important region.

## Side-Panel Affordances by Width

Closed side-panel access and open-panel dismissal are separate states. The
closed trigger may keep the current retracted side-panel icon at every width.

### Mobile (`680px` or Below)

- Closed state: the existing side trigger or retracted icon is appropriate.
- Open state: the panel may behave as a modal sheet or overlay.
- An open mobile modal sheet may use an `X` close button.
- The smaller screen does not need to preserve the full workspace beside the
  open overlay.

This does not mean mobile should avoid retracted side-panel icons. The retracted
icon remains valid for opening a closed panel.

### Compact Tablet

For compact tablet layouts such as iPad Mini portrait around `768px` CSS
viewport width:

- Closed state: use the existing side trigger or retracted icon.
- Open state: retractable side-panel behavior is preferred.
- If an open panel is presented as retractable, use its retract or collapse
  affordance rather than a modal `X`.
- Do not add an `X` as a secondary or additive close affordance to a retractable
  panel. The panel uses either the mobile modal/sheet close model or the
  retractable-panel model, not both at once.
- Do not mix an open modal panel with an `X` on one side and an open retractable
  panel with a collapse affordance on the other at the same breakpoint.
- Only an explicit future specification may intentionally change the panel
  model.

### Desktop and Large Tablet

- Panels may remain persistent or retractable.
- Closed panels may use the existing retracted side-panel trigger.
- Open retractable panels should use side-panel retract or collapse
  affordances, not a modal `X`.
- Do not add an `X` as a secondary or additive close affordance to a retractable
  panel. An `X` belongs only to the mobile modal sheet or overlay model.
- Only an explicit future specification may intentionally change the panel
  model.

Keep the current tablet panel widths. This navigation strategy does not
recommend changing side-panel dimensions.

## Separate Responsive Decisions

Two related responsive decisions must be evaluated independently:

1. **Workspace mode navigation**: when both labels are visible and when they
   collapse into one active-mode selector.
2. **Side-panel affordance**: when panels remain retractable and when open panels
   become mobile modal sheets or overlays with `X` close buttons.

The mode selector may collapse on compact tablet while side panels remain
retractable. The two changes do not have to occur at the same breakpoint.

## Breakpoint Starting Contract

| Width | Workspace mode navigation | Side-panel behavior |
| --- | --- | --- |
| `<= 680px` | Single active-mode selector | Closed triggers; open modal sheets/overlays may use `X` |
| `681px-900px` | Keep both labels if they fit; otherwise collapse before collision | Prefer retractable side panels and current widths |
| `901px-1199px` | Prefer both labels and perform collision testing | Persistent or retractable side panels |
| `>= 1200px` | Show both labels | Persistent or retractable side panels |

These values are an implementation starting contract, not a permanent design
law.

Confirm the final mode-navigation collapse point through browser testing with:

- the longest supported project name
- visible `Workspace / Design`
- theme toggle
- status badges where available
- both workspace mode labels

Collapse the mode navigation before it overlaps either the project/status group
or the right-side utility controls.

## Responsive Rules

- Compact-tablet mode navigation may collapse before side panels adopt mobile
  modal behavior.
- Compact-tablet side panels should prefer retractable affordances and current
  widths unless the viewport becomes too constrained.
- Do not allow wrapping into a second topbar row.
- Do not shorten mode labels to unclear abbreviations.
- Do not solve collisions by hiding `Workspace / Design`; its secondary status
  should be communicated visually, not by making it inaccessible.

The exact collapse threshold is determined by the collision rule, using the
breakpoint bands above as the initial implementation contract.

## Accessibility

- Use real buttons or an established tabs/menu pattern.
- Expose the active mode programmatically.
- Keep a visible keyboard focus indicator.
- Do not rely on underline color alone; pair it with text weight or active
  semantics.
- Give the mobile trigger an accessible name that includes the active mode.
- Expose expanded/collapsed state for the mobile selector.
- After selecting a mode on desktop, keep focus on or return it to the mode
  control rather than automatically moving focus into the new workspace.
- On mobile, close the dropdown or popover after selection and return focus to
  the trigger control.
- Ensure the changed workspace exposes a clear heading, landmark, or
  programmatic active-state update so keyboard and screen-reader users can
  identify the content change without relying on the topbar alone.

## Future Navigation Acceptance Criteria

1. `Model Review` is the default.
2. Existing Model Review UI remains unchanged.
3. Desktop visibly shows both modes.
4. Mobile shows one active-mode selector and keeps the topbar uncrowded.
5. The selector opens as a compact topbar-anchored dropdown or popover unless a
   documented constraint requires a connected lightweight sheet.
6. Workspace mode navigation is visually distinct from `Workspace / Design`.
7. `Workspace / Design` remains secondary and available.
8. Workspace mode navigation is readable and restrained in both existing light
   and dark themes.
9. Switching to Drawing Triage changes left, center, and right workspace
   content.
10. Closed side-panel triggers may retain the current retracted icon on mobile,
   tablet, and desktop.
11. Open mobile modal sheets may use an `X` close button.
12. Open retractable panels at tablet and desktop widths use retract or collapse
    affordances consistently.
13. Mode-navigation collapse and side-panel modality may occur at different
    breakpoints.
14. Current tablet panel widths remain unchanged.
15. The navigation PR adds no routes, backend, upload, storage, file handling, AI
   calls, drawing preview implementation, or packages.
16. `npm run lint` passes.
17. `npm run build` passes.

## Explicit Out of Scope

- runtime implementation in this planning PR
- changes to `App.tsx`
- changes to `TopBar.tsx`
- routing
- backend
- upload
- storage
- real file handling
- drawing preview implementation
- AI API calls
- modification of existing Model Review behavior
- packages
