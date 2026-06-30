import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Info,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { getAiReviewContent } from "@/features/object-inspector/data/aiReviewContent"
import { getFindingGroupKey } from "@/lib/findingUtils"
import { cn } from "@/lib/utils"
import type {
  AiFindingGroupingMode,
  AiFindingType,
  AiFindingWorkflowStatus,
  AiScanStatus,
  ModelReviewIssue,
  ReviewIssue,
} from "@/types"

interface ModelReviewAiReviewPanelProps {
  aiFindingStatuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>
  aiFindings: ReviewIssue[]
  aiFindingStatus: AiFindingWorkflowStatus
  aiGroupingMode: AiFindingGroupingMode
  aiScanStatus: AiScanStatus
  modelReviewIssues: ModelReviewIssue[]
  previewActive: boolean
  selectedFindingId: ReviewIssue["id"] | null
  onClearScanResults: () => void
  onCreateIssue: () => void
  onDismissFinding: () => void
  onDropIssue: () => void
  onFindingSelect: (issue: ReviewIssue) => void
  onGroupingModeChange: (mode: AiFindingGroupingMode) => void
  onPreviewChange: () => void
  onRescanAi: () => void
  onRestoreFinding: () => void
  onViewCreatedIssueDetails: () => void
  onViewFindingInModel: () => void
}

const findingSeverityMeta = {
  critical: {
    icon: CircleAlert,
    className: "text-destructive bg-destructive/12",
  },
  warning: {
    icon: TriangleAlert,
    className: "text-warning-foreground bg-warning/12",
  },
  info: { icon: ShieldAlert, className: "text-primary bg-primary/12" },
} satisfies Record<
  ReviewIssue["severity"],
  { icon: typeof CircleAlert; className: string }
>

const groupingModes = [
  { id: "severity", label: "By severity" },
  { id: "type", label: "By type" },
  { id: "status", label: "By status" },
] satisfies { id: AiFindingGroupingMode; label: string }[]

const severityGroups = [
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warnings" },
  { id: "info", label: "Informational" },
] satisfies { id: ReviewIssue["severity"]; label: string }[]

const typeGroups = [
  { id: "coordination", label: "Coordination" },
  { id: "clearance", label: "Clearance" },
  { id: "fire-safety", label: "Fire safety" },
  { id: "annotation", label: "Annotation" },
] satisfies { id: AiFindingType; label: string }[]

const statusGroups = [
  { id: "active", label: "Needs review" },
  { id: "issue-created", label: "Issue created" },
  { id: "dismissed", label: "Dismissed" },
  { id: "follow-up", label: "Follow-up" },
] satisfies { id: AiFindingWorkflowStatus; label: string }[]

const defaultOpenFindingGroups: Record<
  AiFindingGroupingMode,
  Record<string, boolean>
> = {
  severity: { critical: true, warning: true, info: false },
  type: {
    coordination: true,
    clearance: true,
    "fire-safety": true,
    annotation: false,
  },
  status: {
    active: true,
    "issue-created": true,
    dismissed: false,
    "follow-up": true,
  },
}

const statusLabel: Record<AiFindingWorkflowStatus, string> = {
  active: "Needs review",
  "issue-created": "Issue created",
  dismissed: "Dismissed",
  "follow-up": "Follow-up",
}

function getConfidenceMeta(confidence: number) {
  if (confidence >= 85) {
    return {
      className:
        "border-success/25 bg-success/8 text-success-foreground dark:border-success/35 dark:bg-success/10",
      guidance: "Strong signal. Review evidence before creating an issue.",
      label: "High",
      progressClassName: "bg-success/20 [&>div]:bg-success",
      variant: "success",
    } as const
  }

  if (confidence >= 70) {
    return {
      className:
        "border-warning/30 bg-warning/10 text-warning-foreground dark:border-warning/40 dark:bg-warning/12",
      guidance:
        "Inspect highlighted object and evidence checks before creating an issue.",
      label: "Medium",
      progressClassName: "bg-warning/20 [&>div]:bg-warning",
      variant: "warning",
    } as const
  }

  return {
    className:
      "border-border/35 bg-muted/14 text-foreground dark:border-border dark:bg-muted/25",
    guidance: "Treat this as a lead. Verify manually before creating an issue.",
    label: "Low",
    progressClassName: "bg-muted [&>div]:bg-muted-foreground",
    variant: "outline",
  } as const
}

function getGroupingConfig(mode: AiFindingGroupingMode) {
  if (mode === "severity") return severityGroups
  if (mode === "type") return typeGroups
  return statusGroups
}

function ConfidenceScalePopover() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm opacity-75 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Suggestion confidence scale"
          aria-expanded={open}
          onClick={(event) => {
            event.preventDefault()
            setOpen((current) => !current)
          }}
        >
          <Info className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(18rem,calc(100vw-24px))] border-border/60 bg-popover p-2.5 text-popover-foreground shadow-md ring-1 ring-warning/10"
      >
        <div className="space-y-2 text-[10px] leading-snug">
          <p className="font-semibold text-foreground">
            Suggestion confidence scale
          </p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-success" />
              <p>
                <span className="font-semibold">High 85-100</span>
                <span className="text-muted-foreground">
                  {" "}
                  · Strong signal, review evidence.
                </span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />
              <p>
                <span className="font-semibold">Medium 70-84</span>
                <span className="text-muted-foreground">
                  {" "}
                  · Inspect evidence before creating issue.
                </span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <p>
                <span className="font-semibold">Low below 70</span>
                <span className="text-muted-foreground">
                  {" "}
                  · Verify manually.
                </span>
              </p>
            </div>
          </div>
          <p className="border-t border-border/50 pt-1.5 text-muted-foreground">
            Use this as review guidance, not an automatic decision.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type InspectorAiFindingButtonProps = {
  finding: ReviewIssue
  issueId?: ModelReviewIssue["id"]
  selected: boolean
  status: AiFindingWorkflowStatus
  onSelect: () => void
}

type ReviewCheckProps = {
  label: string
  detail: string
  warning?: boolean
}

export function ModelReviewAiReviewPanel({
  aiFindingStatuses,
  aiFindings,
  aiFindingStatus,
  aiGroupingMode,
  aiScanStatus,
  modelReviewIssues,
  previewActive,
  selectedFindingId,
  onClearScanResults,
  onCreateIssue,
  onDismissFinding,
  onDropIssue,
  onFindingSelect,
  onGroupingModeChange,
  onPreviewChange,
  onRescanAi,
  onRestoreFinding,
  onViewCreatedIssueDetails,
  onViewFindingInModel,
}: ModelReviewAiReviewPanelProps) {
  const [compactDetailOpen, setCompactDetailOpen] = useState(false)
  const [openFindingGroups, setOpenFindingGroups] = useState(
    defaultOpenFindingGroups,
  )
  const [clearAiFindingsDialogOpen, setClearAiFindingsDialogOpen] =
    useState(false)
  const [removeIssueDialogOpen, setRemoveIssueDialogOpen] = useState(false)
  const selectedFinding =
    aiFindings.find((finding) => finding.id === selectedFindingId) ?? null
  const activeReview = selectedFinding
    ? getAiReviewContent(selectedFinding)
    : null
  const activeConfidence = activeReview
    ? getConfidenceMeta(activeReview.confidence)
    : null
  const existingIssue = modelReviewIssues.find(
    (issue) => issue.sourceFindingId === selectedFinding?.id,
  )
  const hasAiFindings = aiFindings.length > 0
  const aiScanning = aiScanStatus === "scanning"
  const findingDismissed = aiFindingStatus === "dismissed"
  const issueCreated = aiFindingStatus === "issue-created"
  const findingNeedsReview = !findingDismissed && !issueCreated
  const findingGroups = useMemo(
    () =>
      getGroupingConfig(aiGroupingMode).map((group) => ({
        ...group,
        findings: aiFindings.filter(
          (finding) =>
            getFindingGroupKey(finding, aiGroupingMode, aiFindingStatuses) ===
            group.id,
        ),
      })),
    [aiFindingStatuses, aiFindings, aiGroupingMode],
  )
  const selectedGroupKey = selectedFinding
    ? getFindingGroupKey(selectedFinding, aiGroupingMode, aiFindingStatuses)
    : null

  useEffect(() => {
    if (!selectedGroupKey) return
    setOpenFindingGroups((current) => ({
      ...current,
      [aiGroupingMode]: {
        ...current[aiGroupingMode],
        [selectedGroupKey]: true,
      },
    }))
  }, [aiGroupingMode, selectedGroupKey])

  useEffect(() => {
    if (selectedFindingId) setCompactDetailOpen(true)
  }, [selectedFindingId])

  const toggleFindingGroup = (groupId: string) => {
    setOpenFindingGroups((current) => ({
      ...current,
      [aiGroupingMode]: {
        ...current[aiGroupingMode],
        [groupId]: !current[aiGroupingMode][groupId],
      },
    }))
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {hasAiFindings ? (
        <>
          <div className="shrink-0 border-b border-border/25 p-2.5 dark:border-border">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold">AI Review Queue</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  {aiFindings.length} findings
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  className="h-6 px-1.5 text-[9px] text-muted-foreground hover:bg-muted/25 hover:text-foreground dark:hover:bg-muted/50"
                  onClick={() => setClearAiFindingsDialogOpen(true)}
                  disabled={aiScanning}
                >
                  Clear AI findings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  className="h-6 border-ai/35 bg-ai/10 px-1.5 text-[9px] text-ai-foreground hover:border-ai/45 hover:bg-ai/16 hover:text-ai-foreground"
                  onClick={onRescanAi}
                  disabled={aiScanning}
                >
                  {aiScanning ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  Rescan
                </Button>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden min-[1421px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <section
              className={cn(
                "min-h-0 flex-col overflow-hidden border-border/25 dark:border-border min-[1421px]:flex min-[1421px]:border-r",
                selectedFinding && compactDetailOpen ? "hidden" : "flex",
              )}
              aria-label="AI Review Queue"
            >
              <div className="shrink-0 border-b border-border/20 px-2 dark:border-border">
                <div
                  className="grid h-8 grid-cols-3 text-muted-foreground"
                  role="group"
                  aria-label="Group AI findings"
                >
                  {groupingModes.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      className={cn(
                        "relative h-full px-1 text-[9px] font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        aiGroupingMode === mode.id
                          ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-primary"
                          : "text-muted-foreground",
                      )}
                      aria-pressed={aiGroupingMode === mode.id}
                      onClick={() => onGroupingModeChange(mode.id)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
                <div className="space-y-1.5">
                  {findingGroups.map((group) => {
                    const open =
                      openFindingGroups[aiGroupingMode][group.id] ?? false
                    const selectedInGroup = selectedGroupKey === group.id
                    const Icon = open ? ChevronDown : ChevronRight
                    return (
                      <section key={group.id} className="bg-transparent">
                        <button
                          type="button"
                          className="flex min-h-8 w-full items-center gap-2 border-b border-border/20 px-2 text-left outline-none hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:border-border dark:hover:bg-muted/50"
                          aria-expanded={open}
                          onClick={() => toggleFindingGroup(group.id)}
                        >
                          <Icon className="size-3 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {group.label}
                          </span>
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground">
                            {group.findings.length}
                          </span>
                        </button>
                        {open && (
                          <div className="divide-y divide-border/18 px-1.5 py-1 dark:divide-border">
                            {group.findings.length > 0 ? (
                              group.findings.map((finding) => (
                                <InspectorAiFindingButton
                                  key={finding.id}
                                  finding={finding}
                                  issueId={
                                    modelReviewIssues.find(
                                      (issue) =>
                                        issue.sourceFindingId === finding.id,
                                    )?.id
                                  }
                                  selected={finding.id === selectedFindingId}
                                  status={
                                    aiFindingStatuses[finding.id] ?? "active"
                                  }
                                  onSelect={() => onFindingSelect(finding)}
                                />
                              ))
                            ) : (
                              <p className="px-2 py-1 text-[9px] text-muted-foreground">
                                No findings in this group.
                              </p>
                            )}
                          </div>
                        )}
                        {!open && selectedInGroup && (
                          <p className="sr-only">
                            Selected finding is in this group.
                          </p>
                        )}
                      </section>
                    )
                  })}
                </div>
              </div>
            </section>

            <section
              className={cn(
                "min-h-0 flex-col overflow-hidden min-[1421px]:flex",
                selectedFinding && compactDetailOpen ? "flex" : "hidden",
              )}
              aria-label="Finding Detail Panel"
            >
              {selectedFinding && activeReview ? (
                <>
                  <div className="flex shrink-0 items-center gap-2 border-b border-border/25 p-2.5 dark:border-border min-[1421px]:hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      size="compact"
                      className="h-7 px-1.5"
                      onClick={() => setCompactDetailOpen(false)}
                    >
                      <ArrowLeft className="size-3" />
                      Back to queue
                    </Button>
                  </div>
                  <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
                    <Card
                      className={cn(
                        "rounded-md border-0 bg-panel-subtle shadow-none dark:bg-panel/45",
                        findingDismissed &&
                          "bg-muted/16 opacity-80 dark:bg-muted/45",
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="mt-1 text-[10px] font-semibold leading-snug">
                              {selectedFinding.title}
                            </p>
                            <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">
                              {selectedFinding.code} ·{" "}
                              {selectedFinding.details.objectId} ·{" "}
                              {selectedFinding.location}
                            </p>
                          </div>
                          <Badge
                            variant={
                              findingDismissed
                                ? "outline"
                                : issueCreated
                                  ? "success"
                                  : aiFindingStatus === "follow-up"
                                    ? "warning"
                                    : "ai"
                            }
                            className={cn(
                              "shrink-0 px-1.5 py-0 text-[8px] uppercase",
                              !findingDismissed &&
                                !issueCreated &&
                                aiFindingStatus !== "follow-up" &&
                                "bg-ai/8",
                            )}
                          >
                            {statusLabel[aiFindingStatus]}
                          </Badge>
                        </div>
                        {existingIssue && (
                          <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                            Linked issue {existingIssue.id} · source{" "}
                            {selectedFinding.code}
                          </p>
                        )}
                        {existingIssue && issueCreated && (
                          <div className="mt-3 rounded-md border border-success/30 bg-success/8 px-2.5 py-2 text-success-foreground ring-1 ring-success/10 dark:border-success/40 dark:bg-success/10">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
                              <div className="min-w-0">
                                <p className="text-[10px] leading-snug">
                                  {selectedFinding.title} (
                                  {selectedFinding.code}) has been added to the
                                  issues list.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-ai-foreground">
                          <span className="text-[10px] font-semibold">
                            AI suggestion
                          </span>
                          {!findingDismissed && <Sparkles className="size-3" />}
                        </div>
                        <p className="mt-2 text-[10px] leading-relaxed text-foreground/85">
                          {activeReview.suggestion}
                        </p>
                        {activeConfidence && (
                          <div
                            className={cn(
                              "mt-3 rounded-md border px-2.5 py-2",
                              activeConfidence.className,
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                <span className="text-[9px] font-semibold">
                                  Suggestion confidence
                                </span>
                                <ConfidenceScalePopover />
                              </div>
                              <Badge
                                variant={activeConfidence.variant}
                                className="shrink-0 px-1.5 py-0 text-[8px]"
                              >
                                <span>{activeConfidence.label}</span>
                                <span className="font-mono">
                                  {activeReview.confidence}%
                                </span>
                              </Badge>
                            </div>
                            <Progress
                              value={activeReview.confidence}
                              aria-label={`${activeConfidence.label} suggestion confidence`}
                              className={cn(
                                "mt-2 h-1.5",
                                activeConfidence.progressClassName,
                              )}
                            />
                            <p className="mt-1.5 text-[9px] font-medium leading-relaxed">
                              {activeConfidence.guidance}
                            </p>
                          </div>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {findingNeedsReview && (
                            <>
                              <Button
                                size="compact"
                                variant={
                                  previewActive ? "secondary" : "default"
                                }
                                className="col-span-2 w-full"
                                onClick={onPreviewChange}
                              >
                                {previewActive
                                  ? "Exit preview"
                                  : "Preview change"}
                              </Button>
                              <Button
                                variant="outline"
                                size="compact"
                                className="col-span-2 w-full justify-center border-ai/30 bg-card px-2 text-[10px] text-ai-foreground shadow-none hover:border-ai/40 hover:bg-ai/5 hover:text-ai-foreground dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground"
                                onClick={onCreateIssue}
                              >
                                Create issue
                              </Button>
                              <Button
                                variant="ghost"
                                size="compact"
                                className="col-span-2 mx-auto h-auto w-auto px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                                onClick={onDismissFinding}
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          {issueCreated && (
                            <>
                              <Button
                                size="compact"
                                className="col-span-2 w-full"
                                onClick={onViewCreatedIssueDetails}
                              >
                                View issue details
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="compact"
                                className="col-span-2 w-full justify-center border-primary/35 bg-background px-2 text-[10px] text-primary shadow-none ring-1 ring-primary/8 hover:border-primary/45 hover:bg-primary/8 hover:text-primary hover:ring-primary/14 dark:border-primary/45 dark:ring-primary/10"
                                onClick={onViewFindingInModel}
                              >
                                View in model
                              </Button>
                              <Button
                                variant="ghost"
                                size="compact"
                                className="col-span-2 w-full text-destructive hover:bg-destructive/8 hover:text-destructive dark:hover:bg-destructive/10"
                                onClick={() => setRemoveIssueDialogOpen(true)}
                              >
                                Remove issue
                              </Button>
                            </>
                          )}
                          {findingDismissed && (
                            <>
                              <Button
                                size="compact"
                                className="col-span-2 w-full"
                                onClick={onRestoreFinding}
                              >
                                Restore finding
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="compact"
                                className="col-span-2 w-full justify-center border-primary/35 bg-background px-2 text-[10px] text-primary shadow-none ring-1 ring-primary/8 hover:border-primary/45 hover:bg-primary/8 hover:text-primary hover:ring-primary/14 dark:border-primary/45 dark:ring-primary/10"
                                onClick={onViewFindingInModel}
                              >
                                View in model
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <div className="mt-3 space-y-2">
                      {activeReview.checks.map(([label, detail, warning]) => (
                        <ReviewCheck
                          key={label}
                          label={label}
                          detail={detail}
                          warning={warning}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="hidden h-full min-h-0 items-center justify-center p-3 min-[1421px]:flex">
                  <div className="rounded-md border border-dashed border-border/22 bg-muted/8 p-3 text-[10px] text-muted-foreground dark:border-border dark:bg-transparent">
                    Select a finding from the AI Review Queue to review
                    evidence, preview a change, create an issue, or dismiss the
                    suggestion.
                  </div>
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="p-3">
          <div className="rounded-md border border-dashed border-border/18 bg-muted/8 p-3 dark:border-border dark:bg-transparent">
            <div
              className="flex items-start"
              aria-live={aiScanning ? "polite" : undefined}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium">
                  {aiScanning
                    ? "Scanning model..."
                    : "No AI scan has been run for this project yet."}
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
                  AI findings, issue actions, and review history appear after
                  the mock scan completes.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  className="mt-2 w-full justify-center border-ai/35 bg-ai/10 text-ai-foreground hover:border-ai/45 hover:bg-ai/16 hover:text-ai-foreground"
                  onClick={onRescanAi}
                  disabled={aiScanning}
                >
                  {aiScanning ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ScanSearch className="size-3" />
                  )}
                  {aiScanning ? "Scanning..." : "Scan with AI"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AlertDialog
        open={clearAiFindingsDialogOpen}
        onOpenChange={setClearAiFindingsDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear AI findings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the current AI Review findings, created issues and
              review history for this project. This cannot be undone in this
              prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--destructive-action)] text-[var(--destructive-action-foreground)] hover:bg-[var(--destructive-action-hover)]"
              onClick={onClearScanResults}
            >
              Clear findings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={removeIssueDialogOpen}
        onOpenChange={setRemoveIssueDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the created issue from the Model Review issue
              list. The original AI finding will remain available in AI Review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--destructive-action)] text-[var(--destructive-action-foreground)] hover:bg-[var(--destructive-action-hover)]"
              onClick={onDropIssue}
            >
              Remove issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InspectorAiFindingButton({
  finding,
  issueId,
  selected,
  status,
  onSelect,
}: InspectorAiFindingButtonProps) {
  const dismissed = status === "dismissed"
  const issueCreated = status === "issue-created"
  const severityMeta = findingSeverityMeta[finding.severity]
  const SeverityIcon = severityMeta.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full border-l-2 border-l-transparent px-2 py-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        dismissed && "opacity-60",
        selected
          ? "border-l-ai bg-ai/6 dark:bg-ai/10"
          : "hover:bg-muted/20 dark:hover:bg-muted/50",
        issueCreated && !selected && "bg-success/4 dark:bg-success/8",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-sm",
            severityMeta.className,
          )}
        >
          <SeverityIcon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[10px] font-semibold">
              {finding.title}
            </span>
            <span className="ml-auto font-mono text-[8px] text-muted-foreground">
              {finding.code}
            </span>
          </span>
          <span className="mt-0.5 block truncate font-mono text-[8px] text-muted-foreground">
            {finding.details.objectId} · {finding.location}
          </span>
        </span>
        {status !== "active" && (
          <span
            className={cn(
              "shrink-0 rounded-sm border px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wide",
              status === "issue-created"
                ? "inline-flex items-center gap-1 border-success/35 bg-success/8 text-success-foreground dark:bg-success/10"
                : "border-border/25 text-muted-foreground dark:border-border",
            )}
          >
            {status === "issue-created" ? (
              <>
                <CheckCircle2 className="size-2.5" />
                {issueId ?? "Issue"}
              </>
            ) : (
              statusLabel[status]
            )}
          </span>
        )}
      </span>
    </button>
  )
}

function ReviewCheck({ label, detail, warning = false }: ReviewCheckProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border/25 pb-2 dark:border-border">
      {warning ? (
        <AlertTriangle className="size-3.5 text-warning" />
      ) : (
        <CheckCircle2 className="size-3.5 text-success" />
      )}
      <div>
        <p className="text-[10px] font-medium">{label}</p>
        <p className="text-[9px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}
