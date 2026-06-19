# Design

## Design Register

ModelScope is a product UI for professional BIM model review. The interface is
calm, precise, dense, and trustworthy. Design serves the task: orient in the
model, inspect objects, review AI findings, and resolve coordination issues
without making the viewport feel secondary.

## Implementation Status

This document defines the approved AI Review target and the visual system that
future implementation must follow. It is not a claim that every rule is already
present in the current runtime. The Queue state matrix explicitly identifies
which scan states are supported today and which remain required work.

## Visual Strategy

Use a restrained product palette with semantic color. The base UI is cool
neutral; actions and states must not collapse into soft grey outlines.

- Neutrals carry structure: app shell, sidebars, list rows, and dividers.
- Primary blue carries primary actions, selected state, and model focus.
- AI teal carries AI scan entry points, AI Review Queue context, suggestions,
  and AI-specific secondary actions.
- Success green carries created issues and confirmations.
- Warning amber carries caution, clearance risk, and follow-up review.
- Destructive red carries remove, dismiss, and destructive confirmation.

Color must answer a state, priority, or action-hierarchy question. Do not use
it decoratively.

## Color Tokens

Tokens live in `src/index.css` and remain OKLCH.

### Light Mode

- `background`: cool workspace backdrop.
- `panel`: main side-panel surface.
- `panel-subtle`: secondary sidebar, toolbar, and detail-panel surface.
- `card`: compact review content only.
- `primary`: selected, focus, and primary-action blue, in the same hue family
  as dark mode primary.
- `ai`, `success`, `warning`, `destructive`: semantic workflow colors.
- `border`: neutral dividers and inactive outlines.

Use a warm off-white or very light slate instead of pure white. Start around
`oklch(0.96 0.006 220)` for the workspace background. Keep light primary in the
blue hue family around `220` so the ModelScope mark and primary actions do not
turn green between themes.

Light mode needs clear decision hierarchy without an all-over AI tint. Do not
rely on faint neutral outlines for meaningful actions, and do not make the
whole Finding Detail Panel teal.

### Dark Mode

Keep dark mode quieter than light mode. Use lower surface contrast, with text,
focus rings, and semantic state indicators doing the work. It must not feel
like a separate product.

## Type Styles

Use the existing Inter/system sans stack. These names are fixed component
styles, not size ranges. Implement them through shared utility classes or
equivalent component primitives.

| Style | Definition | Use |
| --- | --- | --- |
| `label-xs` | 10px / 14px, semibold | Panel and section labels |
| `finding-title` | 11px / 16px, semibold | Finding titles and compact decision titles |
| `meta-mono` | 9px / 14px, mono, regular | Object IDs, finding codes, levels, and timestamps |
| `body-compact` | 12px / 18px, regular | Suggestions, evidence, and explanatory copy |
| `status-xs` | 10px / 14px, semibold | Status badges; uppercase and tracking only when needed |

Avoid display-sized text inside sidebars, cards, and inspector panels. Letter
spacing stays normal outside genuinely tiny uppercase status text.

## Layout Principles

- The model viewport remains dominant. Expand the inspector only when it
  materially improves a review decision.
- Side panels are dense, predictable, and scannable.
- Use 6px radius by default. Do not introduce oversized rounded containers.
- Keep vertical rhythm compact: 8px for close relationships, 12px for section
  breaks, and 16px only for larger panel groups.
- Avoid nested cards. Detail surfaces may use a quiet fill; Queue rows are a
  list, not a card stack.

## AI Review Pattern

The local master-detail pattern is named **AI Review Queue + Finding Detail
Panel**. Do not call it mega navigation in UI or documentation.

### AI Review Queue

- The Queue is the source of truth for the complete finding list.
- Group locally by severity, type, or status using underline tabs matching the
  inspector tab vocabulary.
- Use accordion sections with counts. Category rows have a bottom separator,
  not a bordered card treatment.
- Queue rows use `divide-y` separators. The selected finding has a single
  `border-l-2` AI accent, plus a non-color selection treatment where needed.
- The Queue fills available panel height and scrolls independently.
- The selected finding remains highlighted and its accordion group remains
  open.
- Issue-created findings expose a non-color-only signal, such as a check icon,
  status badge, or issue identifier.

### Queue Operational States

The Queue keeps its allocated height in every state. A state change must not
push the Finding Detail Panel below the fold.

| State | Required experience | Current runtime support |
| --- | --- | --- |
| `not-scanned` | Explain that no scan exists and offer `Scan with AI`. Do not show empty accordion groups. | Supported |
| `scanning` | Preserve Queue height, announce progress, disable duplicate scan actions, and show 2-3 neutral skeleton group/row shapes without invented counts. | Scan status exists; skeleton treatment remains required |
| `completed-with-findings` | Show grouped findings, counts, Queue controls, and the selected detail. | Basic scan results are supported; the refactored Queue experience remains required |
| `completed-empty` | Show a calm success state: `No findings in this scan`, scope summary, and `Rescan`. This is not an error and must not imply the model has no risks. | Required, not yet modeled |
| `group-empty` | Within an open grouping, say `No findings in this group` without making the full scan appear empty. | Required, not present in the current runtime |
| `partial` | Retain usable results, identify the incomplete scope locally, and offer `Rescan`. | Required, not yet modeled |
| `failed` | Keep the error local to AI Review, state that no result was produced, and offer a retry. Do not block the viewport or unrelated inspector tabs. | Required, not yet modeled |

Use a skeleton rather than a centered spinner for Queue loading. Loading is a
content state, not a reason to collapse the review workspace.

### Finding Detail Panel

- The panel contains the selected finding's suggestion, confidence, evidence,
  checklist, and decision actions.
- Show a clear empty state when no finding is selected.
- Do not place the panel below a long Queue in scaled review states.
- On wide desktop, show it beside the Queue inside AI Review.
- On narrower layouts, replace the Queue with the detail view and provide a
  `Back to queue` action, or use a sheet.
- In light mode, use `bg-panel-subtle` or no fill with no outer border. The
  panel position already provides separation.

### Decision Actions

Action hierarchy is derived from finding state. Never show more than one
primary CTA.

| Finding state | Primary | Secondary | Tertiary |
| --- | --- | --- | --- |
| `needs-review` | Preview change | Create issue | Dismiss |
| `issue-created` | View issue details | View in model | Remove issue |
| `dismissed` | Restore finding | View in model | None |

`Create issue` is AI-tinted while a finding is active. `Remove issue` is a
subtle destructive action. `Dismiss` is a quiet text or ghost action. Preview
applies only to the selected finding.

## Viewport AI Markers

The viewport provides spatial context, not a second Queue.

- Default overview: clustered count markers.
- Active group: filtered markers only when they help orientation.
- Selected finding: one strong highlighted marker.
- Contextual markers: optional and dimmed.

Do not render all findings as labels inside the SVG. When several findings
occupy one area, use a cluster badge such as `8 findings`.

## Component Vocabulary

### Buttons

- Primary command: filled `primary`.
- AI command: AI-tinted outline, or filled primary only when it is the one
  primary action.
- Destructive command: destructive-tinted for reversible local actions; filled
  destructive only for heavier operations.
- Quiet command: ghost or link, not another grey outline.

Buttons must retain readable labels at narrow inspector widths. Prefer a
shorter label over removing useful semantic color.

### Badges

- `ai`: active AI review and needs-review state.
- `success`: issue-created and completed confirmation.
- `warning`: follow-up and review caution.
- `destructive`: severe or destructive state.
- `outline`: dismissed, inactive, and neutral metadata.

## Accessibility

- Maintain WCAG 2.1 AA contrast in both themes.
- Never use color as the only state indicator.
- Keep focus rings visible and preserve keyboard access to Queue rows,
  grouping tabs, accordions, and actions.
- Buttons and icon controls need accessible labels or readable text.
- Avoid horizontal overflow in sidebars and sheets.
- Use reduced-motion-friendly transitions of 150-250ms.

## Anti-Patterns

- Purple gradients, glass effects, decorative blobs, and marketing-style hero
  treatment.
- Treating the viewport as secondary content.
- Long AI finding lists that push decisions below the fold.
- Every action as a soft grey outline.
- Rendering overlapping SVG labels for individual AI findings.
- Nested card stacks inside the inspector.
