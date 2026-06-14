# Feature Specification: Workspace Mode Navigation Strategy

**Feature Branch**: `010-workspace-mode-navigation-strategy`

**Created**: 2026-06-14

**Status**: Draft

**Input**: Define a planning-only product and navigation strategy for making
`Model Review` and `Drawing Triage` primary workspace modes inside the existing
ModelScope Workspace view.

## Product Goal

ModelScope should present `Model Review` and `Drawing Triage` as two primary
ways to work within the same project workspace.

The navigation must make three different levels understandable:

1. project and status context: ModelScope, selected project, sync state, and
   unresolved issue count
2. primary workspace mode: `Model Review` or `Drawing Triage`
3. prototype utilities: the existing `Workspace / Design` switch and theme
   toggle

These levels must not be merged into one control. In particular, the existing
`Workspace / Design` switch remains a secondary prototype utility. It is not a
product-mode selector and must not be replaced, duplicated, or visually matched
by the new mode navigation.

`Model Review` remains the default mode. It preserves the deployed workspace
layout and behavior. `Drawing Triage` is a future artifact-centered workspace
that reuses the same left, center, and right spatial structure with different
content.

## User Scenarios & Testing

### User Story 1 - Choose a Workspace Mode on Desktop (Priority: P1)

A BIM coordinator can see both primary workspace modes in the topbar and
understand which one is active without confusing them with project context or
prototype utilities.

**Why this priority**: The product cannot support two credible workflows unless
their relationship and hierarchy are immediately legible.

**Independent Test**: In a later desktop prototype, a user can identify the
active mode, switch modes, and explain the difference between the mode
navigation and the `Workspace / Design` utility switch.

**Acceptance Scenarios**:

1. **Given** the Workspace app view opens on desktop, **When** the topbar is
   visible, **Then** both `Model Review` and `Drawing Triage` are visible in a
   central product-navigation position.
2. **Given** `Model Review` is active, **When** the user inspects the topbar,
   **Then** it has a restrained active treatment such as stronger text and a
   subtle accent underline.
3. **Given** the user selects `Drawing Triage`, **When** the mode changes,
   **Then** the main left, center, and right workspace content changes together.
4. **Given** the workspace mode navigation and `Workspace / Design` are both
   visible, **When** the user compares them, **Then** they use clearly different
   visual treatments and communicate different hierarchy levels.

---

### User Story 2 - Preserve Model Review (Priority: P1)

A user entering `Model Review` receives the same deployed model-review
workspace, controls, visual system, and responsive behavior that exist today.

**Why this priority**: Introducing navigation must not regress the product's
current portfolio experience or viewport-first interaction model.

**Independent Test**: A later implementation can compare `Model Review` before
and after the navigation change and find no intentional change to its workspace
content or interactions.

**Acceptance Scenarios**:

1. **Given** `Model Review` is active, **When** the workspace renders on desktop,
   **Then** Model Explorer remains on the left, the model viewport remains in
   the center, and Object Inspector remains on the right.
2. **Given** `Model Review` is active on a narrow screen, **When** the user opens
   either side panel, **Then** the existing Model Explorer and Inspector
   triggers and sheets remain available.
3. **Given** `Model Review` is active, **When** the user reviews the viewport,
   **Then** the existing viewport toolbar, AI Review card, issue feedback, and
   light/dark theme behavior and visual system remain unchanged.
4. **Given** a side panel is closed on mobile, tablet, or desktop, **When** its
   access control is shown, **Then** the existing side trigger or retracted
   panel icon remains an acceptable affordance.
5. **Given** a side panel opens at `900px` or below, **When** the user needs to
   dismiss it, **Then** it behaves as a modal sheet or overlay with an `X` close
   button.
6. **Given** a side panel opens at `901px` or above, **When** the user closes or
   collapses it, **Then** it uses a retract or collapse affordance rather than a
   modal `X`.

---

### User Story 3 - Enter Drawing Triage (Priority: P2)

A BIM coordinator can switch to a future `Drawing Triage` workspace and
understand that the whole workspace now centers on a 2D artifact rather than a
3D model.

**Why this priority**: Drawing Triage must feel like a primary workflow, not an
extra sidebar tab inside Model Review.

**Independent Test**: A later mock implementation can replace all three
workspace regions with drawing-oriented content without adding backend, upload,
AI, storage, or routing behavior.

**Acceptance Scenarios**:

1. **Given** the user selects `Drawing Triage`, **When** the workspace changes,
   **Then** the left region presents uploaded-drawing or artifact context, the
   center presents a 2D drawing preview, and the right region presents AI
   candidate review and decision details.
2. **Given** a drawing candidate is selected in a future prototype, **When** its
   detail is shown, **Then** the center preview provides corresponding visible
   evidence context where available.
3. **Given** the Drawing Triage direction is documented in this phase, **When**
   repository changes are reviewed, **Then** no Drawing Triage runtime UI,
   upload behavior, file handling, storage, backend, or AI behavior exists.
4. **Given** `Drawing Triage` appears as a selectable mode in the first
   navigation implementation, **When** the user selects it, **Then** a bounded,
   honest placeholder or empty-state workspace replaces the left, center, and
   right regions.
5. **Given** the Drawing Triage placeholder is shown, **When** the user reviews
   it, **Then** it clearly states that upload, storage, drawing preview, and AI
   candidate generation are not implemented, and it is not hidden, disabled,
   inert, or presented as a finished workflow.

---

### User Story 4 - Choose a Workspace Mode on Mobile (Priority: P2)

A mobile user can see the active workspace mode and change it without adding two
persistent tabs to the constrained topbar or reducing the viewport's dominance.

**Why this priority**: The current mobile hierarchy already balances topbar
utilities, viewport controls, side-panel triggers, and the central workspace.

**Independent Test**: In a later mobile prototype, a user can open one compact
active-mode control, choose either mode, and return to the workspace without
losing access to existing viewport controls.

**Acceptance Scenarios**:

1. **Given** the app is shown at `900px` or below, **When** the topbar renders,
   **Then** it shows one active-mode control with a disclosure cue rather than
   two persistent mode tabs.
2. **Given** the user opens the mobile mode selector, **When** the preferred
   topbar-anchored dropdown or popover appears, **Then** both `Model Review` and
   `Drawing Triage` are available and the active mode is identified with a
   checkmark or equivalent semantic indicator.
3. **Given** `Model Review` remains active on mobile, **When** the selector is
   closed, **Then** the existing topbar, left and right panel triggers, viewport
   toolbar, AI Review card, and central viewport hierarchy remain intact.
4. **Given** the app is shown at a compact-tablet width, **When** responsive
   navigation is applied, **Then** the workspace mode control and both side
   panels use the compact interaction model through `900px`.

### Edge Cases

- Long project names must truncate without displacing the primary mode
  navigation or right-side utilities.
- Status badges may hide at existing compact breakpoints, but their absence must
  not make the workspace mode look like project status.
- At the boundary between wide and mobile layouts, the mode control must not
  overlap the brand group, project selector, utility switch, or theme toggle.
- At compact-tablet widths such as an iPad Mini portrait viewport around
  `768px`, open left and right panels must use modal sheets with `X` close
  buttons.
- The `900/901px` implementation threshold aligns compact workspace navigation
  with compact side-panel presentation so visual affordances match the actual
  spatial interaction model.
- The mobile selector must close after a mode is chosen and return focus to its
  trigger.
- Keyboard users must be able to identify, focus, and activate both desktop
  modes in a predictable order.
- If a future Drawing Triage mode has no artifact, its center remains the
  primary workspace and shows a purposeful empty state rather than reverting to
  Model Review content.
- Mode changes must not be represented as changes to the current Object
  Inspector tab, Model Explorer section, or AI Review panel alone.
- At compact desktop, tablet, and mobile widths, floating viewport overlays
  must remain inside the central workspace safe area and must not overlap side
  panels, inspector regions, panel triggers, mode navigation, or primary model
  or preview content.

## Requirements

### Functional Requirements

- **FR-001**: The product MUST distinguish project/status context, primary
  workspace mode, and prototype utilities as three separate navigation levels.
- **FR-002**: Project/status context MUST continue to include ModelScope,
  selected project name, sync status, and unresolved issue count.
- **FR-003**: Primary workspace modes MUST be named `Model Review` and
  `Drawing Triage`.
- **FR-004**: `Model Review` MUST be the default active workspace mode.
- **FR-005**: The existing `Workspace / Design` switch MUST remain a secondary
  prototype utility and MUST NOT be replaced by workspace mode navigation.
- **FR-006**: The workspace mode navigation MUST NOT duplicate the bordered,
  filled segmented-control treatment of `Workspace / Design`.
- **FR-007**: On desktop, both modes MUST be visible in a central topbar
  product-navigation position.
- **FR-008**: The desktop active mode MUST use restrained emphasis, such as
  stronger text and a subtle cyan/accent underline.
- **FR-009**: The desktop mode navigation MUST not add a heavy second navigation
  stripe unless a later spec provides a documented need.
- **FR-010**: The topbar layout MUST protect the left project/status group and
  the right prototype utility group from overlap or competition.
- **FR-011**: Switching workspace mode MUST change the main workspace content,
  not only a sidebar section, inspector tab, or floating panel.
- **FR-012**: `Model Review` MUST preserve the current Model Explorer, model
  viewport, Object Inspector, mobile side-panel triggers, viewport toolbar, AI
  Review card, and light/dark theme behavior and visual system.
- **FR-013**: The future `Drawing Triage` workspace MUST use the left region for
  drawing/artifact context, the center for a 2D preview, and the right region
  for AI candidate review and decision details.
- **FR-014**: Drawing Triage candidate selection SHOULD produce visible evidence
  context in the center preview, consistent with the viewport-as-source-of-truth
  principle.
- **FR-015**: At compact widths of `900px` or below, mode navigation MUST
  collapse into one active-mode control with a disclosure cue.
- **FR-016**: The mobile mode selector MUST expose both modes through a compact
  topbar-anchored dropdown or popover as the preferred behavior.
- **FR-017**: The mobile mode selector MUST NOT replace or break the existing
  topbar structure, Model Explorer trigger, Inspector trigger, viewport toolbar,
  AI Review card, or viewport-dominant hierarchy.
- **FR-018**: The later navigation implementation MUST use clear accessible
  names, visible focus states, active-state semantics, and keyboard operation.
- **FR-019**: This planning PR MUST NOT modify runtime source code, routing,
  backend behavior, upload, storage, file handling, drawing preview behavior,
  AI calls, existing Model Review behavior, or packages.
- **FR-020**: Product mode navigation MUST work in both existing themes: dark
  mode and light mode.
- **FR-021**: The navigation concept MUST use theme-adaptive semantic styling
  and MUST NOT be hard-coded as dark-only.
- **FR-022**: In dark mode, navigation MAY use dark-on-dark surfaces, subtle
  borders, muted inactive text, and a restrained cyan/accent active indicator.
- **FR-023**: In light mode, navigation MUST use corresponding light-theme
  surfaces, subtle borders, readable inactive text, and the same restrained
  active indication without becoming visually heavy.
- **FR-024**: Theme adaptation MUST NOT make the product mode navigation look
  like a duplicate of the right-side `Workspace / Design` segmented control.
- **FR-025**: Closed side-panel triggers MAY continue to use the existing
  retracted side-panel icons on mobile, tablet, and desktop.
- **FR-026**: At widths of `900px` or below, both side panels MUST open as modal
  sheets or overlays with `X` close buttons.
- **FR-027**: At widths of `901px` or above, open side panels MUST use persistent
  or retractable behavior with retract or collapse affordances rather than a
  modal `X` close button.
- **FR-027A**: An `X` close button belongs only to the compact modal sheet or
  overlay model. It MUST NOT be added as a secondary close affordance to a
  retractable large-tablet or desktop panel.
- **FR-028**: At widths of `900px` or below, the two side panels MUST NOT mix
  modal and retractable close models, and only one side sheet needs to be open
  at a time.
- **FR-029**: This strategy MUST preserve the current tablet panel widths and
  MUST NOT recommend panel-width changes.
- **FR-030**: Workspace mode navigation and side-panel presentation remain
  separate concepts, but their implementation thresholds MUST align at
  `900/901px`.
- **FR-031**: Responsive guidance MUST use `900px` and below for compact mode
  navigation and modal side sheets, and `901px` and above for visible mode tabs
  and persistent or retractable side panels.
- **FR-032**: The `900/901px` threshold MUST keep the visual affordance
  consistent with the actual overlay or grid interaction model.
- **FR-033**: The shared `900/901px` threshold MUST be verified in a browser
  using the longest supported project name, visible `Workspace / Design`, theme
  toggle, available status badges, and both workspace mode labels.
- **FR-034**: At `901px` and above, visible workspace mode tabs MUST NOT overlap
  the project/status group or right-side utility controls.
- **FR-035**: Compact-tablet mode navigation MUST use the single active-mode
  selector while side panels use modal sheet behavior and current widths.
- **FR-036**: The mobile selector's closed control MUST remain in the topbar,
  show the active mode and chevron, and feel continuous with the topbar
  navigation vocabulary rather than like a floating pill.
- **FR-037**: A bottom sheet SHOULD NOT be used for workspace mode selection
  unless implementation constraints require it; if used, it MUST remain
  visually connected to the topbar selector and avoid a heavy modal-action
  treatment.
- **FR-038**: The mode selector MUST identify the active option with a checkmark
  or equivalent semantic active indicator and remain theme-adaptive in light
  and dark mode.
- **FR-039**: Floating viewport overlays, including the AI Review card,
  tooltips, labels, selected-object callouts, and future Drawing Triage
  candidate evidence or review overlays, MUST remain inside the available
  central workspace or 2D preview safe area. Persistent side panels, Model
  Explorer, Object Inspector, and mode navigation controls have layout priority.
  On compact desktop or large tablet, overlays MUST clamp or reposition to a
  safer location such as below or near the viewport toolbar. On tablet or
  mobile, they MAY become more compact or stack, but MUST NOT obscure panel
  triggers, open panels, or primary model/preview content.

### Responsive Contract

Workspace mode navigation and side-panel affordances align at the `900/901px`
implementation threshold:

| Width | Workspace mode navigation | Side-panel behavior |
| --- | --- | --- |
| `<= 900px` | Single active-mode selector | Closed triggers; open modal sheets/overlays use `X` |
| `901px-1199px` | Prefer both labels; confirm with collision testing | Persistent or retractable panels |
| `>= 1200px` | Show both labels | Persistent or retractable panels |

This threshold intentionally aligns navigation density with side-panel
presentation so the controls communicate the spatial behavior users receive.

### Visual Design Constraints

- Use the existing ModelScope semantic theme system in both light and dark mode.
- Do not describe or implement the product navigation as a dark-only pattern.
- Preserve the same hierarchy and interaction meaning across themes.
- Keep inactive labels readable without giving them active emphasis.
- Use restrained active text and an underline or equivalent low-noise indicator
  in both themes.
- Allow theme surfaces and border values to adapt while keeping the product-mode
  treatment visually distinct from the utility segmented control.

### Navigation Concepts

- **Project Context**: The active project identity and operational state. It
  persists across workspace modes.
- **Workspace Mode**: The primary task context that determines the complete
  left, center, and right workspace composition.
- **Prototype View**: The existing choice between the product `Workspace` and
  the `Design` reference surface.
- **Mode Selector**: The responsive control that exposes workspace modes as
  visible text navigation on desktop and one active-mode disclosure on mobile.

## Out of Scope

- runtime implementation
- changes to `src/App.tsx`
- changes to `src/components/layout/TopBar.tsx`
- route changes
- backend services or database work
- upload behavior
- file storage
- real file handling
- drawing preview implementation
- AI API calls or inference
- modification of existing Model Review behavior
- package additions

## Success Criteria

### Measurable Outcomes

- **SC-001 (Future Usability Validation Target)**: In a later usability review,
  at least 90% of target users should correctly distinguish workspace modes from
  the Workspace / Design prototype utility. This target is not checkable in
  the current planning phase and will be validated after implementation.
- **SC-002**: On desktop, 100% of reviewed target layouts show both workspace
  mode labels without overlap with the left or right topbar groups.
- **SC-003**: On mobile, the closed topbar uses exactly one workspace-mode
  control and preserves access to all current Model Review controls.
- **SC-004**: In regression review, all existing Model Review interaction
  scenarios remain available and visually unchanged apart from the addition of
  the mode selector.
- **SC-005**: A mode switch changes all three main workspace regions in the
  future prototype, making the active task context identifiable without relying
  on the topbar label alone.
- **SC-006**: Keyboard review confirms that every mode option has a visible
  focus state, an accessible name, and a programmatically identifiable active
  state.
- **SC-007**: Visual review confirms that the mode navigation remains readable,
  restrained, and clearly active in both existing themes without resembling the
  `Workspace / Design` segmented control.
- **SC-008**: Responsive review confirms modal sheet behavior with `X` at
  compact-tablet widths and retractable behavior at large-tablet and desktop
  widths while preserving current panel widths.
- **SC-009**: Collision testing confirms that workspace mode navigation
  collapses before overlapping either topbar edge group at the shared
  `900/901px` breakpoint.
- **SC-010**: On mobile, the selector opens as a compact topbar-anchored
  dropdown or popover unless a documented implementation constraint requires a
  connected lightweight sheet.

## Assumptions

- The first implementation uses project-scoped local UI state for workspace
  mode. Routing, URL persistence, browser back-button behavior, shareable links,
  and session persistence are deferred to a future routing and persistence
  specification. This keeps the first navigation implementation small and
  avoids implying backend or route behavior that has not been specified.
- The existing `Workspace / Design` switch remains available in both workspace
  modes because it controls the prototype surface, not product workflow.
- The `900/901px` implementation threshold aligns the existing workspace mode
  navigation change with side-panel presentation.
- Current tablet panel widths are retained; this strategy changes affordance
  guidance, not panel dimensions.
- The topbar remains one row and approximately its current height.
- Drawing Triage content will be specified and implemented separately with mock
  or local prototype state before any service integration.

## Acceptance Criteria for a Later Navigation Implementation PR

1. `Model Review` is the default mode.
2. Existing deployed Model Review UI and behavior remain unchanged.
3. Desktop shows both workspace modes visibly in the topbar.
4. Desktop mode navigation uses restrained text or tab styling, not a duplicate
   of the `Workspace / Design` segmented control.
5. Desktop and mobile mode navigation works in both existing light and dark
   themes using theme-adaptive semantic styling.
6. Mobile collapses mode selection into one active-mode control without
   crowding the topbar.
7. The mobile selector preferably opens as a compact topbar-anchored dropdown or
   popover containing both modes and an active checkmark or equivalent.
8. `Workspace / Design` remains visually and semantically secondary.
9. Switching to `Drawing Triage` changes the main left, center, and right
   workspace content.
10. Closed side-panel triggers may retain their retracted icons at all widths.
11. At `900px` or below, both side panels open as modal sheets with `X`.
12. At `901px` or above, side panels use persistent or retractable behavior with
    collapse affordances.
13. Current tablet panel widths remain unchanged.
14. The implementation adds no backend, upload, storage, AI, file handling, or
   routing unless separately specified.
15. No packages are added.
16. `npm run lint` and `npm run build` pass.
17. AI Review and future Drawing Triage viewport overlays do not overlap side
    panels or inspector regions at compact desktop, tablet, or mobile widths.
