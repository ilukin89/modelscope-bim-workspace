import {
  AlertTriangle,
  Bookmark,
  Bot,
  FileStack,
  MapPin,
  X,
} from "lucide-react"
import type { CSSProperties, MutableRefObject } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  candidateFilterTypes,
  candidateTypeCounts,
  candidates,
  getTypeAccent,
  getTypeAccentForType,
  typeVisuals,
} from "../data/drawingTriageData"
import type {
  Candidate,
  CandidateId,
  CandidateReviewState,
  CreatedIssueSummary,
  ReviewCandidateFilter,
  RightPanelView,
} from "../types"

const typeFilterOptions = Object.entries(candidateFilterTypes) as Array<
  [
    keyof typeof candidateFilterTypes,
    (typeof candidateFilterTypes)[keyof typeof candidateFilterTypes],
  ]
>
const candidateTypeFilterOptions = typeFilterOptions.map(([filter, type]) => ({
  filter,
  type,
}))

type CreatedIssueWithCandidate = {
  issue: CreatedIssueSummary
  candidate: Candidate
}

type DrawingTriageCandidatePanelProps = {
  activeRightPanelView: RightPanelView
  candidateCardRefs: MutableRefObject<
    Partial<Record<CandidateId, HTMLElement | null>>
  >
  createdIssueSummaries: CreatedIssueWithCandidate[]
  followUpCount: number
  issueCardRefs: MutableRefObject<
    Partial<Record<CandidateId, HTMLElement | null>>
  >
  remainingReviewCount: number
  reviewCandidateFilter: ReviewCandidateFilter
  reviewStates: Record<CandidateId, CandidateReviewState>
  selectedCandidateId: CandidateId
  visibleReviewCandidates: Candidate[]
  onConvertCandidateToIssue: (candidateId: CandidateId) => void
  onReviewFilterChange: (filter: ReviewCandidateFilter) => void
  onSelectCandidate: (candidateId: CandidateId) => void
  onShowCreatedIssues: () => void
  onShowReviewCandidates: () => void
  onToggleFollowUp: (candidateId: CandidateId) => void
  onViewCreatedIssue: (candidateId: CandidateId) => void
  onViewIssueOnSheet: (candidateId: CandidateId) => void
  onRequestRemoveIssue: (candidateId: CandidateId) => void
}

function getDecisionLabel(decision: CandidateReviewState["decision"]) {
  if (decision === "issue_created") return "Issue created"
  return "Needs review"
}

export function DrawingTriageCandidatePanel({
  activeRightPanelView,
  candidateCardRefs,
  createdIssueSummaries,
  followUpCount,
  issueCardRefs,
  remainingReviewCount,
  reviewCandidateFilter,
  reviewStates,
  selectedCandidateId,
  visibleReviewCandidates,
  onConvertCandidateToIssue,
  onReviewFilterChange,
  onSelectCandidate,
  onShowCreatedIssues,
  onShowReviewCandidates,
  onToggleFollowUp,
  onViewCreatedIssue,
  onViewIssueOnSheet,
  onRequestRemoveIssue,
}: DrawingTriageCandidatePanelProps) {
  return (
    <aside className="scrollbar-thin order-2 min-h-[180px] min-w-0 overflow-y-auto border-border bg-panel max-[900px]:w-full max-[900px]:border-t min-[901px]:order-3 min-[901px]:border-l">
      <div className="border-b border-border p-4">
        <div className="max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Candidate review
            </span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                {candidates.length} candidate observations
              </h2>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                Human review required before creating issues.
              </p>
            </div>
            <span className="whitespace-nowrap rounded-sm bg-ai/15 px-2 py-1 text-[10px] font-semibold leading-none text-ai-foreground">
              AI
            </span>
          </div>
          <div
            className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-muted-foreground"
            aria-live="polite"
          >
            <span>{remainingReviewCount} remaining</span>
            <span>{followUpCount} follow-up</span>
            <span>{createdIssueSummaries.length} issues created</span>
          </div>
          <p className="mt-2 text-[9px] font-medium text-muted-foreground">
            {candidateTypeCounts.Clearance} Clearance ·{" "}
            {candidateTypeCounts.Annotation} Annotation ·{" "}
            {candidateTypeCounts.Coordination} Coordination
          </p>
          <div
            className="mt-3 grid grid-cols-2 rounded-md border border-border bg-panel-subtle/55 p-0.5"
            role="group"
            aria-label="Drawing triage right panel view"
          >
            <button
              type="button"
              aria-pressed={activeRightPanelView === "review_candidates"}
              className={cn(
                "min-h-8 rounded-[5px] px-2 py-1 text-[10px] font-semibold text-muted-foreground outline-none ring-ring transition-colors focus-visible:ring-2",
                activeRightPanelView === "review_candidates" &&
                  "bg-card text-foreground shadow-sm",
              )}
              onClick={onShowReviewCandidates}
            >
              Review candidates
            </button>
            <button
              type="button"
              aria-pressed={activeRightPanelView === "created_issues"}
              className={cn(
                "flex min-h-8 items-center justify-center gap-1.5 rounded-[5px] px-2 py-1 text-[10px] font-semibold text-muted-foreground outline-none ring-ring transition-colors focus-visible:ring-2",
                activeRightPanelView === "created_issues" &&
                  "bg-card text-foreground shadow-sm",
              )}
              onClick={onShowCreatedIssues}
            >
              <span>Created issues </span>
              <span className="rounded-sm border border-border bg-panel px-1.5 py-0.5 text-[9px] leading-none">
                {createdIssueSummaries.length}
              </span>
            </button>
          </div>
          {activeRightPanelView === "review_candidates" && (
            <div
              className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9px]"
              aria-label="Review candidate filter"
            >
              <span className="font-medium text-muted-foreground">
                Showing:
              </span>
              <button
                type="button"
                aria-pressed={reviewCandidateFilter === "all"}
                className={cn(
                  "rounded-sm px-1 py-0.5 font-semibold text-muted-foreground outline-none ring-ring transition-colors hover:text-foreground focus-visible:ring-2",
                  reviewCandidateFilter === "all" &&
                    "text-foreground underline decoration-border underline-offset-4",
                )}
                onClick={() => onReviewFilterChange("all")}
              >
                All {candidates.length}
              </button>
              {candidateTypeFilterOptions.map(({ filter, type }) => {
                const active = reviewCandidateFilter === filter
                const typeAccent = getTypeAccentForType(type)

                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={active}
                    className={cn(
                      "rounded-sm border px-1.5 py-0.5 font-semibold outline-none ring-ring transition-colors hover:brightness-95 focus-visible:ring-2",
                    )}
                    style={{
                      borderColor: active
                        ? typeAccent
                        : `color-mix(in oklab, ${typeAccent} 42%, var(--border))`,
                      background: active
                        ? `color-mix(in oklab, ${typeAccent} 14%, var(--card))`
                        : `color-mix(in oklab, ${typeAccent} 7%, var(--card))`,
                      color: `color-mix(in oklab, ${typeAccent} 72%, var(--foreground))`,
                    }}
                    onClick={() => onReviewFilterChange(filter)}
                  >
                    {type} {candidateTypeCounts[type]}
                  </button>
                )
              })}
              <button
                type="button"
                aria-pressed={reviewCandidateFilter === "follow_up"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-1 py-0.5 font-semibold text-muted-foreground outline-none ring-ring transition-colors hover:text-foreground focus-visible:ring-2",
                  followUpCount === 0 &&
                    reviewCandidateFilter !== "follow_up" &&
                    "text-muted-foreground/55 hover:text-muted-foreground",
                  reviewCandidateFilter === "follow_up" &&
                    "text-foreground underline decoration-border underline-offset-4",
                )}
                onClick={() => onReviewFilterChange("follow_up")}
              >
                <Bookmark className="size-3" />
                Follow-up only {followUpCount}
              </button>
            </div>
          )}
        </div>
      </div>

      {activeRightPanelView === "review_candidates" ? (
        <div className="space-y-2 p-3 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[560px]">
          {visibleReviewCandidates.length === 0 ? (
            <div className="border border-dashed border-border bg-panel-subtle/45 p-3 text-[10px] leading-relaxed text-muted-foreground">
              {reviewCandidateFilter === "follow_up"
                ? "No candidates are marked for follow-up."
                : reviewCandidateFilter === "all"
                  ? "No candidate observations in this review."
                  : `No ${candidateFilterTypes[reviewCandidateFilter]} candidates in this review.`}
            </div>
          ) : (
            visibleReviewCandidates.map((candidate) => {
              const selected = candidate.id === selectedCandidateId
              const { decision, isFollowUp } = reviewStates[candidate.id]
              const decisionLabel = getDecisionLabel(decision)
              const typeVisual = typeVisuals[candidate.type]
              const typeAccent = getTypeAccent(candidate)
              const candidateStyle = {
                borderColor: "var(--border)",
                borderLeftColor: typeAccent,
                borderLeftWidth: "3px",
                background: selected
                  ? `color-mix(in oklab, ${typeAccent} 7%, var(--card))`
                  : "var(--card)",
                boxShadow: selected
                  ? `0 0 0 1px color-mix(in oklab, ${typeAccent} 32%, transparent)`
                  : undefined,
              } as CSSProperties
              const decisionIsIssue = decision === "issue_created"
              const issueActionStyle = {
                borderColor: decisionIsIssue
                  ? `color-mix(in oklab, ${typeAccent} 22%, var(--border))`
                  : typeAccent,
                background: decisionIsIssue ? "var(--card)" : typeAccent,
                color: decisionIsIssue
                  ? `light-dark(var(--foreground), color-mix(in oklab, var(--foreground) 88%, ${typeAccent}))`
                  : typeVisual.ink,
                boxShadow: undefined,
              } as CSSProperties
              const followUpActionStyle = {
                borderColor: isFollowUp
                  ? `color-mix(in oklab, ${typeAccent} 42%, var(--border))`
                  : `color-mix(in oklab, ${typeAccent} 92%, var(--border))`,
                background: isFollowUp
                  ? `color-mix(in oklab, ${typeAccent} 5%, var(--card))`
                  : `color-mix(in oklab, ${typeAccent} 24%, var(--card))`,
                color: isFollowUp
                  ? `color-mix(in oklab, ${typeAccent} 64%, var(--foreground))`
                  : `light-dark(color-mix(in oklab, ${typeVisual.lightAccent} 40%, var(--foreground)), color-mix(in oklab, ${typeVisual.darkAccent} 82%, var(--foreground)))`,
                boxShadow: isFollowUp
                  ? `inset 0 0 0 1px color-mix(in oklab, ${typeAccent} 18%, transparent)`
                  : `inset 0 0 0 1px color-mix(in oklab, ${typeAccent} 16%, transparent)`,
              } as CSSProperties
              const followUpDisabled = decisionIsIssue

              return (
                <article
                  key={candidate.id}
                  ref={(node) => {
                    candidateCardRefs.current[candidate.id] = node
                  }}
                  tabIndex={-1}
                  data-review-state={decision}
                  data-follow-up={isFollowUp}
                  className={cn(
                    "relative w-full rounded-sm border bg-card outline-none ring-ring transition-[border-color,background-color,box-shadow] duration-150 focus-visible:ring-2",
                  )}
                  style={candidateStyle}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectCandidate(candidate.id)}
                    className="w-full p-4 text-left outline-none ring-ring transition-colors duration-150 hover:bg-panel-subtle/35 focus-visible:ring-2"
                  >
                    <span className="block">
                      <span className="flex items-start gap-3">
                        <span
                          className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: typeAccent,
                            color: typeVisual.ink,
                          }}
                        >
                          {candidate.marker}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "flex flex-wrap items-center gap-2",
                              isFollowUp && "pr-8",
                            )}
                          >
                            <span
                              className="rounded-[5px] px-2 py-1 text-[10px] font-bold leading-none"
                              style={{
                                background: typeAccent,
                                color: typeVisual.ink,
                              }}
                            >
                              Type: {candidate.type}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10px] font-semibold leading-none"
                              style={{
                                background: decisionIsIssue
                                  ? typeAccent
                                  : `color-mix(in oklab, ${typeAccent} 13%, var(--card))`,
                                color: decisionIsIssue
                                  ? typeVisual.ink
                                  : `color-mix(in oklab, ${typeAccent} 58%, var(--foreground))`,
                              }}
                            >
                              {decisionIsIssue && (
                                <AlertTriangle className="size-3" />
                              )}
                              {decisionLabel}
                            </span>
                          </span>
                        </span>
                      </span>
                      <span className="mt-4 block text-[13px] font-semibold leading-snug text-foreground">
                        {candidate.title}
                      </span>
                      <span className="mt-2 block text-[11px] leading-relaxed text-muted-foreground">
                        {candidate.summary}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-muted-foreground">
                        <span>{candidate.confidence}</span>
                        <span aria-hidden="true">·</span>
                        <span>{candidate.reviewPriority} review priority</span>
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
                        <MapPin
                          className="size-3"
                          style={{ color: typeAccent }}
                        />
                        {candidate.region}
                      </span>
                    </span>
                  </button>

                  {isFollowUp && (
                    <span
                      aria-label="Follow-up flag active"
                      title="Follow-up flag active"
                      className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md border bg-card"
                      style={{
                        borderColor: `color-mix(in oklab, ${typeAccent} 60%, var(--border))`,
                        background: `color-mix(in oklab, ${typeAccent} 9%, var(--card))`,
                        color: `color-mix(in oklab, ${typeAccent} 68%, var(--foreground))`,
                      }}
                    >
                      <Bookmark className="size-4 fill-current" />
                    </span>
                  )}

                  {decisionIsIssue && (
                    <div
                      className="mx-4 flex items-start gap-1.5 border-t border-border/70 py-2.5 text-[9px] font-medium leading-relaxed"
                      style={{
                        color: `color-mix(in oklab, ${typeAccent} 68%, var(--foreground))`,
                      }}
                      role="status"
                    >
                      <AlertTriangle className="mt-px size-3 shrink-0" />
                      <span>
                        Issue created by user (username) on DD/MM/YY, hh:mm
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2 border-t border-border/60 p-4 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                      style={issueActionStyle}
                      aria-pressed={decisionIsIssue}
                      onClick={() =>
                        decisionIsIssue
                          ? onViewCreatedIssue(candidate.id)
                          : onConvertCandidateToIssue(candidate.id)
                      }
                    >
                      {decisionIsIssue ? (
                        <FileStack className="size-4" />
                      ) : (
                        <AlertTriangle className="size-4" />
                      )}
                      {decisionIsIssue ? "View issue" : "Convert to issue"}
                    </Button>
                    {!followUpDisabled && (
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                        style={followUpActionStyle}
                        aria-pressed={isFollowUp}
                        onClick={() => onToggleFollowUp(candidate.id)}
                      >
                        <Bookmark
                          className={cn("size-4", isFollowUp && "fill-current")}
                        />
                        {isFollowUp
                          ? "Remove from follow-up"
                          : "Keep for follow-up"}
                      </Button>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      ) : (
        <div className="space-y-2 p-3 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[560px]">
          {createdIssueSummaries.length === 0 ? (
            <div className="border border-dashed border-border bg-panel-subtle/45 p-3 text-[10px] leading-relaxed text-muted-foreground">
              Converted candidates will appear here as compact local issue
              summaries.
            </div>
          ) : (
            createdIssueSummaries.map(({ issue, candidate }) => {
              const typeVisual = typeVisuals[candidate.type]
              const typeAccent = getTypeAccent(candidate)
              const selected = candidate.id === selectedCandidateId
              const cardStyle = {
                borderColor: selected
                  ? `color-mix(in oklab, ${typeAccent} 42%, var(--border))`
                  : "var(--border)",
                background: selected
                  ? `color-mix(in oklab, ${typeAccent} 6%, var(--card))`
                  : "var(--card)",
                boxShadow: selected
                  ? `0 0 0 1px color-mix(in oklab, ${typeAccent} 22%, transparent)`
                  : undefined,
              } as CSSProperties
              const viewActionStyle = {
                borderColor: typeAccent,
                background: typeAccent,
                color: typeVisual.ink,
              } as CSSProperties
              const removeActionStyle = {
                borderColor: `color-mix(in oklab, ${typeAccent} 24%, var(--border))`,
                background: "var(--card)",
                color: `light-dark(var(--foreground), color-mix(in oklab, var(--foreground) 88%, ${typeAccent}))`,
              } as CSSProperties

              return (
                <article
                  key={issue.issueId}
                  ref={(node) => {
                    issueCardRefs.current[issue.candidateId] = node
                  }}
                  tabIndex={-1}
                  className="rounded-sm border p-3 outline-none ring-ring transition-[border-color,background-color,box-shadow] duration-150 focus-visible:ring-2"
                  style={cardStyle}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-[5px] border border-border bg-panel px-2 py-1 text-[10px] font-bold leading-none text-foreground">
                      {issue.issueId}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-[5px] border px-2 py-1 text-[10px] font-semibold leading-none"
                      style={{
                        borderColor: `color-mix(in oklab, ${typeAccent} 34%, var(--border))`,
                        background: `color-mix(in oklab, ${typeAccent} 10%, var(--card))`,
                        color: `color-mix(in oklab, ${typeAccent} 68%, var(--foreground))`,
                      }}
                    >
                      <AlertTriangle className="size-3" />
                      Issue created
                    </span>
                  </div>
                  <h3 className="mt-3 text-[13px] font-semibold leading-snug text-foreground">
                    {candidate.title}
                  </h3>
                  <div className="mt-2 space-y-1 text-[10px] leading-snug text-muted-foreground">
                    <p>
                      Type:{" "}
                      <span className="font-semibold text-foreground">
                        {candidate.type}
                      </span>
                    </p>
                    <p>
                      Priority:{" "}
                      <span className="font-semibold text-foreground">
                        {candidate.reviewPriority}
                      </span>
                    </p>
                    <p>
                      Source:{" "}
                      <span className="font-semibold text-foreground">
                        Candidate {candidate.marker}
                      </span>
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="h-8 w-full justify-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                      style={viewActionStyle}
                      onClick={() => onViewIssueOnSheet(issue.candidateId)}
                    >
                      <MapPin className="size-3.5" />
                      Locate on sheet
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="h-8 w-full justify-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                      style={removeActionStyle}
                      onClick={() => onRequestRemoveIssue(issue.candidateId)}
                    >
                      <X className="size-3.5" />
                      Remove issue
                    </Button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      )}

      <div className="mx-3 mb-3 flex gap-2 border border-border bg-panel-subtle/55 p-3 text-[10px] leading-relaxed text-muted-foreground max-[900px]:mx-auto max-[900px]:w-[calc(100%-1.5rem)] max-[900px]:max-w-[696px]">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
        <p>
          Confidence and priority are review-support metadata. Verify against
          the full drawing set and project requirements before acting.
        </p>
      </div>
    </aside>
  )
}
