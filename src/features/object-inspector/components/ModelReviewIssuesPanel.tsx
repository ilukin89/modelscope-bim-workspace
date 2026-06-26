import { useEffect, useMemo, useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ReviewIssue,
} from "@/types"

interface ModelReviewIssuesPanelProps {
  focusedIssueCardId: ModelReviewIssue["id"] | null
  focusedModelIssueId: ModelReviewIssue["id"] | null
  issues: ModelReviewIssue[]
  selectedIssueId: ReviewIssue["id"]
  onHideIssueFromModel: (issue: ModelReviewIssue) => void
  onUpdateIssueStatus: (
    id: ModelReviewIssue["id"],
    status: ModelReviewIssueStatus,
  ) => void
  onViewIssueInModel: (issue: ModelReviewIssue) => void
}

const modelReviewIssueStatuses = [
  "Open",
  "In Review",
  "Resolved",
] as const satisfies readonly ModelReviewIssueStatus[]

type ModelReviewIssueFilter = "All" | ModelReviewIssueStatus
type ModelReviewIssueSort =
  | "status-priority"
  | "newest-first"
  | "source-id"

const modelReviewIssueStatusPriority: Record<ModelReviewIssueStatus, number> =
  {
    Open: 0,
    "In Review": 1,
    Resolved: 2,
  }

const issueFilterOptions = [
  { value: "All", label: "All" },
  ...modelReviewIssueStatuses.map((status) => ({ value: status, label: status })),
] satisfies { value: ModelReviewIssueFilter; label: string }[]

export function ModelReviewIssuesPanel({
  focusedIssueCardId,
  focusedModelIssueId,
  issues,
  selectedIssueId,
  onHideIssueFromModel,
  onUpdateIssueStatus,
  onViewIssueInModel,
}: ModelReviewIssuesPanelProps) {
  const [issueStatusFilter, setIssueStatusFilter] =
    useState<ModelReviewIssueFilter>("All")
  const [issueSort, setIssueSort] =
    useState<ModelReviewIssueSort>("status-priority")
  const issueCounts = useMemo(
    () => ({
      All: issues.length,
      Open: issues.filter((issue) => issue.status === "Open").length,
      "In Review": issues.filter((issue) => issue.status === "In Review")
        .length,
      Resolved: issues.filter((issue) => issue.status === "Resolved").length,
    }),
    [issues],
  )
  const filteredModelReviewIssues = useMemo(() => {
    const filteredIssues = issues.filter(
      (issue) => issueStatusFilter === "All" || issue.status === issueStatusFilter,
    )

    return [...filteredIssues].sort((firstIssue, secondIssue) => {
      if (issueSort === "status-priority") {
        return (
          modelReviewIssueStatusPriority[firstIssue.status] -
          modelReviewIssueStatusPriority[secondIssue.status]
        )
      }

      if (issueSort === "newest-first") {
        const firstIssueNumber = Number(firstIssue.id.match(/\d+$/)?.[0])
        const secondIssueNumber = Number(secondIssue.id.match(/\d+$/)?.[0])

        if (Number.isFinite(firstIssueNumber) && Number.isFinite(secondIssueNumber)) {
          return secondIssueNumber - firstIssueNumber
        }

        return secondIssue.id.localeCompare(firstIssue.id)
      }

      const firstSourceId =
        firstIssue.sourceFindingCode || firstIssue.sourceFindingId
      const secondSourceId =
        secondIssue.sourceFindingCode || secondIssue.sourceFindingId

      if (!firstSourceId || !secondSourceId) {
        return 0
      }

      return firstSourceId.localeCompare(secondSourceId)
    })
  }, [issueSort, issueStatusFilter, issues])
  const filteredIssueEmptyMessage =
    issueStatusFilter === "Open"
      ? "No open issues."
      : issueStatusFilter === "In Review"
        ? "No issues in review."
        : "No resolved issues."

  useEffect(() => {
    if (!focusedIssueCardId || issueStatusFilter === "All") {
      return
    }

    const focusedIssue = issues.find((issue) => issue.id === focusedIssueCardId)
    if (focusedIssue && focusedIssue.status !== issueStatusFilter) {
      setIssueStatusFilter("All")
    }
  }, [focusedIssueCardId, issueStatusFilter, issues])

  return issues.length > 0 ? (
    <>
      <div className="mb-2 space-y-1.5 px-0.5">
        <div className="flex flex-wrap gap-1" aria-label="Filter issues by status">
          {issueFilterOptions.map((filter) => {
            const active = issueStatusFilter === filter.value

            return (
              <Button
                key={filter.value}
                type="button"
                size="compact"
                variant={active ? "outline" : "ghost"}
                aria-pressed={active}
                className={cn(
                  "h-6 rounded-sm px-1.5 text-[9px]",
                  active
                    ? "border-primary/35 bg-primary/8 text-primary shadow-none hover:border-primary/45 hover:bg-primary/12 hover:text-primary dark:border-primary/45 dark:bg-primary/14"
                    : "text-muted-foreground hover:bg-muted/45 hover:text-foreground",
                )}
                onClick={() => setIssueStatusFilter(filter.value)}
              >
                <span>{filter.label}</span>
                <span className="font-mono text-[8px] opacity-80">
                  {issueCounts[filter.value]}
                </span>
              </Button>
            )
          })}
        </div>
        <label className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <span>Sort</span>
          <select
            value={issueSort}
            onChange={(event) =>
              setIssueSort(event.target.value as ModelReviewIssueSort)
            }
            className="h-6 min-w-0 rounded-sm border border-border/30 bg-background px-1.5 text-[9px] text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-panel"
            aria-label="Sort model review issues"
          >
            <option value="status-priority">Status priority</option>
            <option value="newest-first">Newest first</option>
            <option value="source-id">Source ID</option>
          </select>
        </label>
      </div>
      {filteredModelReviewIssues.length > 0 ? (
        <div className="space-y-1.5">
          {filteredModelReviewIssues.map((issue) => (
            <ModelReviewIssueCard
              key={issue.id}
              issue={issue}
              focusedForDetails={focusedIssueCardId === issue.id}
              focusedInModel={focusedModelIssueId === issue.id}
              selected={issue.sourceFindingId === selectedIssueId}
              onHideFromModel={() => onHideIssueFromModel(issue)}
              onUpdateIssueStatus={onUpdateIssueStatus}
              onViewInModel={() => onViewIssueInModel(issue)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border/18 bg-muted/8 p-3 text-[10px] text-muted-foreground dark:border-border dark:bg-transparent">
          {filteredIssueEmptyMessage}
        </div>
      )}
    </>
  ) : (
    <div className="rounded-md border border-dashed border-border/18 bg-muted/8 p-3 text-[10px] text-muted-foreground dark:border-border dark:bg-transparent">
      Created Model Review issues will appear here.
    </div>
  )
}

function ModelReviewIssueCard({
  focusedForDetails,
  focusedInModel,
  issue,
  selected,
  onHideFromModel,
  onUpdateIssueStatus,
  onViewInModel,
}: {
  focusedForDetails: boolean
  focusedInModel: boolean
  issue: ModelReviewIssue
  selected: boolean
  onHideFromModel: () => void
  onUpdateIssueStatus: (
    id: ModelReviewIssue["id"],
    status: ModelReviewIssueStatus,
  ) => void
  onViewInModel: () => void
}) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const lifecycleAction =
    issue.status === "Open"
      ? { label: "Send for Review", nextStatus: "In Review" as const }
      : issue.status === "In Review"
        ? { label: "Mark Resolved", nextStatus: "Resolved" as const }
        : { label: "Reopen", nextStatus: "Open" as const }

  useEffect(() => {
    if (!focusedForDetails) {
      return
    }

    cardRef.current?.scrollIntoView({ block: "nearest" })
    cardRef.current?.focus({ preventScroll: true })
  }, [focusedForDetails, issue.id])

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      className={cn(
        "rounded-md border p-2.5 shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
        focusedForDetails
          ? "border-primary/45 bg-primary/10 ring-2 ring-primary/24 hover:border-primary/55 hover:bg-primary/14 dark:border-primary/55 dark:bg-primary/16 dark:ring-primary/30 dark:hover:bg-primary/20"
          : focusedInModel
          ? "border-primary/34 bg-primary/12 hover:border-primary/50 hover:bg-primary/16 dark:border-primary/50 dark:bg-primary/16 dark:hover:border-primary/60 dark:hover:bg-primary/22"
          : selected
            ? "border-primary/28 bg-accent/52 hover:border-primary/36 hover:bg-primary/8 dark:border-primary/45 dark:bg-accent dark:hover:border-primary/55 dark:hover:bg-primary/12"
            : "border-border/22 bg-panel/95 hover:border-primary/32 hover:bg-primary/[0.035] dark:border-border dark:bg-panel dark:hover:border-primary/45 dark:hover:bg-primary/8",
      )}
    >
      <div className="flex items-center gap-2">
        <Badge
          variant={
            issue.priority === "critical"
              ? "destructive"
              : issue.priority === "warning"
                ? "warning"
                : "outline"
          }
        >
          {issue.id}
        </Badge>
        <Badge
          variant={
            issue.status === "Open"
              ? "warning"
              : issue.status === "In Review"
                ? "default"
                : "success"
          }
          className="text-[8px]"
        >
          {issue.status}
        </Badge>
        {(focusedForDetails || focusedInModel) && (
          <span className="ml-auto text-[9px] text-muted-foreground">
            {focusedForDetails ? "Issue details" : "Shown in model"}
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] font-medium">{issue.title}</p>
      <dl className="mt-2 grid grid-cols-[74px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[9px]">
        <dt className="text-muted-foreground">Object</dt>
        <dd className="truncate text-right">{issue.relatedObject}</dd>
        <dt className="text-muted-foreground">Level</dt>
        <dd className="truncate text-right">{issue.relatedLevel}</dd>
        <dt className="text-muted-foreground">Source</dt>
        <dd className="truncate text-right">{issue.sourceFindingCode}</dd>
      </dl>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="compact"
          variant="outline"
          className={cn(
            "w-full justify-center border-primary/35 bg-background text-primary shadow-none ring-1 ring-primary/8 hover:border-primary/45 hover:bg-primary/8 hover:text-primary hover:ring-primary/14 dark:border-primary/45 dark:shadow-sm dark:ring-primary/10 dark:hover:border-primary/55 dark:hover:bg-primary/10",
            focusedInModel &&
              "border-primary/45 bg-primary/14 text-primary ring-primary/18 hover:bg-primary/18 dark:border-primary/55 dark:bg-primary/22 dark:ring-primary/30 dark:hover:bg-primary/28",
          )}
          onClick={onViewInModel}
        >
          <Eye className="size-3" />
          View in model
        </Button>
        <Button
          type="button"
          size="compact"
          variant="outline"
          className="w-full justify-center border-border/22 shadow-none disabled:border-transparent disabled:bg-transparent disabled:text-muted-foreground/70 disabled:shadow-none disabled:ring-0 dark:border-border dark:shadow-sm dark:disabled:border-border dark:disabled:bg-background"
          onClick={onHideFromModel}
          disabled={!focusedInModel}
        >
          <EyeOff className="size-3" />
          Hide from model
        </Button>
        <Button
          type="button"
          size="compact"
          variant={issue.status === "Resolved" ? "outline" : "default"}
          className="col-span-2 w-full justify-center"
          onClick={() =>
            onUpdateIssueStatus(issue.id, lifecycleAction.nextStatus)
          }
        >
          {lifecycleAction.label}
        </Button>
      </div>
    </div>
  )
}
