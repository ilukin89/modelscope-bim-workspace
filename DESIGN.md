# Design

## Design Register

ModelScope is a product UI for professional BIM model review. The interface should feel calm, precise, dense, and trustworthy. Design serves the task: orient in the model, inspect objects, review AI findings, and resolve coordination issues without making the viewport feel secondary.

## Visual Strategy

Use a restrained product palette with semantic color. The base UI is cool neutral, but actions and states must not collapse into soft grey outlines.

- Neutrals carry structure: app shell, sidebars, cards, table-like lists, dividers.
- Primary blue carries primary actions, selected state, and model focus.
- AI teal carries AI scan entry points, AI Review Queue context, AI suggestion surfaces, and AI-specific secondary actions.
- Success green carries created issues and confirmation states.
- Warning amber carries caution, clearance risk, and non-blocking review concern.
- Destructive red carries drop, remove, dismiss risk, and destructive confirmation.

Avoid decorative color. Color should always answer a state, priority, or action hierarchy question.

## Color Tokens

Current tokens live in `src/index.css` and should remain OKLCH.

### Light Mode

- `background`: cool workspace backdrop.
- `panel`: main side panel surface.
- `panel-subtle`: secondary sidebar and toolbar surface.
- `card`: content cards and compact review blocks.
- `primary`: selected/focus/action blue, using the same hue family as dark mode primary.
- `ai`: AI review teal.
- `success`: issue-created green.
- `warning`: caution amber.
- `destructive`: destructive red.
- `border`: neutral dividers and inactive outlines.

Light mode should use a warm off-white or very light slate surface instead of pure white. Start around `oklch(0.96 0.006 220)` for the workspace background, with panels and cards close enough to feel quiet but distinct from a white page. The light primary action should stay in the same blue hue family as dark mode primary, around hue `220`, so brand elements such as the ModelScope logo do not shift green between themes.

Light mode needs clear decision hierarchy inside review surfaces, but not a full AI-tinted wash. Do not rely on `border-border/20` or `border-border/22` for important actions, and do not make the whole Finding Detail Panel teal.

### Dark Mode

Dark mode should stay quieter than light mode. Use lower background contrast and let text, focus rings, and semantic borders do the work. Avoid making dark mode look like a separate product.

## Typography

Use the existing Inter/system sans stack. Keep type compact and task-focused.

- Panel labels: 9-11px, semibold, short.
- Queue/finding titles: 10-11px, semibold, line-clamped where needed.
- Metadata and object IDs: mono, 8-9px.
- Body explanation text: 10-11px with relaxed leading.
- Avoid display-sized text inside sidebars, cards, or inspector panels.

Letter spacing should stay normal unless a tiny uppercase status label genuinely needs tracking.

## Layout Principles

- The model viewport remains dominant. Inspector expansion is allowed only when it materially improves review decisions.
- Side panels should be dense, predictable, and scannable.
- Avoid nested cards. Use cards for repeated queue items and primary detail blocks only.
- Use 6px radius by default. Do not introduce oversized rounded containers.
- Keep vertical rhythm compact: 8px for close relationships, 12px for section breaks, 16px only for larger panel groups.

## AI Review Pattern

The review pattern is named:

AI Review Queue + Finding Detail Panel

Do not call this mega navigation in UI or documentation. It is a local master-detail review pattern, not global navigation.

### AI Review Queue

- The queue is the source of truth for the full findings list.
- Group findings locally by severity, type, or status.
- Use underline-style local tabs for grouping controls, matching the inspector tab vocabulary.
- Use accordion sections with counts.
- Accordion category rows should not look like nested cards. Use a bottom separator line, not a full border box.
- Finding rows should not be outline cards. Use `divide-y` separators between rows and a single `border-l-2` accent only for the selected finding.
- The queue fills available panel height and scrolls independently.
- The selected finding remains visibly highlighted.
- Issue-created findings need a clear non-color-only signal such as a success badge, outline, or check icon.

### Finding Detail Panel

- The panel contains the selected finding's decision content.
- Show a clear empty state when no finding is selected.
- Do not render the detail panel below a long queue in scaled review states.
- On wide desktop, show the detail panel beside the queue inside the AI Review area.
- On narrower layouts, use a sheet or replace-the-queue detail view with a back action.

## Finding Detail Panel, Light Mode

The light-mode Finding Detail Panel should be more decisive than the surrounding inspector. It is where the user decides, not merely reads.

Recommended hierarchy:

1. `Preview change`: primary button.
2. `View in model`: primary-tinted outline or quiet blue action.
3. `Create issue`: AI-tinted action while active, destructive-tinted `Drop issue` after creation.
4. `Dismiss`: quiet ghost/text action unless it is the only available next step.

Do not make every button a neutral grey outline. At least the primary action and the main AI action should carry semantic color in light mode.

Recommended light-mode classes for the active detail card:

```tsx
"rounded-md border-0 bg-panel-subtle shadow-none dark:bg-panel/45"
```

Recommended light-mode classes for `Create issue`:

```tsx
"border-ai/30 bg-card text-ai-foreground shadow-none hover:border-ai/40 hover:bg-ai/5 hover:text-ai-foreground"
```

Recommended light-mode classes for `Dismiss`:

```tsx
"h-auto w-auto px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/45 hover:text-foreground"
```

Status badge mapping:

- Needs review: `ai`
- Issue created: `success`
- Dismissed: `outline`
- Follow-up: `warning`

## Viewport AI Markers

The viewport shows spatial context, not the whole findings list.

- Default overview: clustered count markers.
- Active group: filtered markers for the current grouping context when helpful.
- Selected finding: one strong highlighted marker.
- Contextual markers: optional and dimmed.

Do not render all AI findings as individual text labels inside the SVG viewport. If many findings share an area, cluster them with count badges.

Preview change applies only to the selected finding.

## Component Vocabulary

### Buttons

- Primary command: filled primary.
- AI command: AI-tinted outline or filled primary only when it is the main call to action.
- Destructive command: destructive-tinted for reversible local actions, filled destructive only for heavier destructive operations.
- Quiet command: ghost or link, not another grey outline.

Buttons must keep text inside their container at narrow inspector widths. Prefer shorter labels before removing useful semantic color.

### Badges

Badges should be semantic, compact, and non-decorative.

- `ai`: AI review and active AI finding state.
- `success`: issue-created and completed confirmation.
- `warning`: follow-up and review caution.
- `destructive`: critical destructive or severe state.
- `outline`: dismissed, inactive, or neutral metadata.

### Cards

Cards should be flat or nearly flat. Use shadows sparingly. Queue cards may use border, tint, and subtle ring to communicate selected and issue-created states.

## Accessibility

- Maintain WCAG 2.1 AA contrast in both themes.
- Never use color as the only state indicator.
- Keep focus rings visible.
- Buttons and icon controls need accessible labels or readable text.
- Avoid horizontal overflow in sidebars and sheets.
- Use reduced motion-friendly transitions, 150-250 ms.

## Anti-Patterns

- Purple gradients, glass effects, decorative blobs, and marketing-style hero treatment.
- Treating the viewport as secondary content.
- Long AI finding lists that push decisions below the fold.
- Every action as a soft grey outline.
- Rendering many overlapping SVG labels for AI findings.
- Nested card stacks inside inspector panels.
