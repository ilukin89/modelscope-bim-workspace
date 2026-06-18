import { ChevronRight, CircleAlert, ShieldAlert, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { HighlightKind, ReviewIssue } from "@/types"
import { cn } from "@/lib/utils"

type SeveritySummaryItem = {
  count: number
  label: string
  className: string
}

interface AiReviewFindingsPopoverProps {
  issueCount: number
  issues: ReviewIssue[]
  onFindingSelect: (issue: ReviewIssue) => void
  onOpenChange: (open: boolean) => void
  onTriggerClick: () => void
  open: boolean
  selectedIssueId: ReviewIssue["id"]
  severitySummary: SeveritySummaryItem[]
}

export function AiReviewFindingsPopover({
  issueCount,
  issues,
  onFindingSelect,
  onOpenChange,
  onTriggerClick,
  open,
  selectedIssueId,
  severitySummary,
}: AiReviewFindingsPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          onClick={onTriggerClick}
          aria-label="Open AI review findings"
          aria-expanded={open}
          className={cn(
            "group h-auto min-h-[76px] w-[220px] justify-start gap-2 rounded-lg border border-ai/70 bg-[color-mix(in_oklab,var(--ai)_34%,var(--panel)_66%)] px-3 py-2 text-left shadow-[0_16px_42px_color-mix(in_oklab,var(--background)_72%,transparent)] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-ai hover:bg-[color-mix(in_oklab,var(--ai)_42%,var(--panel)_58%)] hover:shadow-[0_18px_46px_color-mix(in_oklab,var(--background)_66%,transparent)] focus-visible:ring-ai max-[1160px]:w-full",
            open &&
              "border-ai bg-[color-mix(in_oklab,var(--ai)_48%,var(--panel)_52%)] ring-2 ring-ai/35",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-tight tracking-tight text-foreground">
              AI Review
            </span>
            <span className="mt-1.5 block text-[11px] font-semibold leading-none text-ai-foreground">
              {issueCount} coordination findings
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold">
              {severitySummary.map((item, index) => (
                <span key={item.label} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="size-1 rounded-full bg-muted-foreground/70" />
                  )}
                  <span className={item.className}>
                    {item.count} {item.label}
                  </span>
                </span>
              ))}
            </span>
          </span>
          <ChevronRight
            className={cn(
              "ml-auto size-5 shrink-0 text-foreground/75 transition-transform duration-200",
              open && "rotate-90 text-ai-foreground",
            )}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(360px,calc(100vw-24px))] border-ai/30 bg-panel p-0 shadow-xl"
      >
        <div className="border-b border-border px-3 py-2.5">
          <div>
            <p className="text-[11px] font-semibold">AI findings</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">
              {issueCount} coordination items in this project
            </p>
          </div>
        </div>
        <div className="space-y-1 p-1.5">
          {issues.map((issue) => (
            <AiFindingButton
              key={issue.id}
              issue={issue}
              selected={selectedIssueId === issue.id}
              onSelect={() => onFindingSelect(issue)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const findingMeta = {
  duct: {
    label: "Clash detected",
    icon: CircleAlert,
    className: "text-destructive",
  },
  door: {
    label: "Clearance issue",
    icon: TriangleAlert,
    className: "text-warning",
  },
  damper: {
    label: "Missing classification",
    icon: ShieldAlert,
    className: "text-primary",
  },
} satisfies Record<
  HighlightKind,
  { label: string; icon: typeof CircleAlert; className: string }
>

function AiFindingButton({
  issue,
  selected,
  onSelect,
}: {
  issue: ReviewIssue
  selected: boolean
  onSelect: () => void
}) {
  const meta = findingMeta[issue.highlight]
  const Icon = meta.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "grid w-full grid-cols-[24px_minmax(0,1fr)] gap-2 rounded-sm border px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected
          ? "border-ai/35 bg-ai/10"
          : "border-transparent hover:border-border hover:bg-muted",
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-sm bg-background">
        <Icon className={cn("size-3.5", meta.className)} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-[10px] font-semibold">
            {meta.label}
          </span>
          <span className="ml-auto font-mono text-[8px] text-muted-foreground">
            {issue.code}
          </span>
        </span>
        <span className="mt-1 block truncate text-[9px] text-foreground/80">
          {issue.title}
        </span>
        <span className="mt-1 block truncate font-mono text-[8px] text-muted-foreground">
          {issue.details.objectId} · {issue.details.level}
        </span>
      </span>
    </button>
  )
}
