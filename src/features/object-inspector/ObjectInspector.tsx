import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { SidePanelGlyph } from "@/components/layout/SidePanelGlyph"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InspectorTab } from "@/features/object-inspector/types"
import { cn } from "@/lib/utils"
import type {
  AiFindingGroupingMode,
  AiFindingType,
  AiFindingWorkflowStatus,
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  ReviewIssue,
} from "@/types"

interface ObjectInspectorProps {
  activeTab: InspectorTab
  aiFindingStatuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>
  aiFindings: ReviewIssue[]
  aiGroupingMode: AiFindingGroupingMode
  aiFindingStatus: AiFindingWorkflowStatus
  aiScanStatus:
    | "not_scanned"
    | "scanning"
    | "scanned_with_findings"
  focusedModelIssueId: ModelReviewIssue["id"] | null
  issueCount: number
  modelReviewIssues: ModelReviewIssue[]
  onCreateIssue: () => void
  onClearScanResults: () => void
  presentation?: "sidebar" | "sheet"
  previewActive: boolean
  reviewHistory: ModelReviewHistoryEvent[]
  selectedIssue: ReviewIssue
  selectedObjectVisible: boolean
  onCollapse: () => void
  onDismissFinding: () => void
  onDropIssue: () => void
  onFindingSelect: (issue: ReviewIssue) => void
  onGroupingModeChange: (mode: AiFindingGroupingMode) => void
  onHideIssueFromModel: (issue: ModelReviewIssue) => void
  onPreviewChange: () => void
  onRescanAi: () => void
  onRestoreFinding: () => void
  onTabChange: (tab: InspectorTab) => void
  onViewFindingInModel: () => void
  onViewCreatedIssueDetails: () => void
  onViewIssueInModel: (issue: ModelReviewIssue) => void
  selectedFindingId: ReviewIssue["id"] | null
}

const reviewContent = {
  duct: {
    suggestion:
      "Shift this duct 180 mm south and lower it by 60 mm. The proposed route preserves the required beam clearance and avoids the cable tray in Zone C.",
    confidence: 86,
    checks: [
      ["Clash detection", "1 hard clash found", true],
      ["Access clearance", "600 mm maintained", false],
      ["System continuity", "No breaks detected", false],
    ] as const,
  },
  door: {
    suggestion:
      "Reverse the door swing and move the frame 120 mm east. This restores the required 900 mm clear opening without changing the corridor wall.",
    confidence: 79,
    checks: [
      ["Clear opening", "842 mm available", true],
      ["Swing conflict", "Furniture zone detected", true],
      ["Fire compartment", "EI30 requirement maintained", false],
    ] as const,
  },
  damper: {
    suggestion:
      "Assign the FD-300 fire-damper type and link it to the Level 07 smoke extract system before the next coordination issue.",
    confidence: 91,
    checks: [
      ["Classification", "Fire rating is missing", true],
      ["System continuity", "Smoke extract connected", false],
      ["Access clearance", "Inspection zone maintained", false],
    ] as const,
  },
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
  info: {
    icon: ShieldAlert,
    className: "text-primary bg-primary/12",
  },
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
  severity: {
    critical: true,
    warning: true,
    info: false,
  },
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

function getFindingGroupKey(
  finding: ReviewIssue,
  mode: AiFindingGroupingMode,
  statuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>,
) {
  if (mode === "severity") {
    return finding.severity
  }

  if (mode === "type") {
    return finding.findingType
  }

  return statuses[finding.id] ?? "active"
}

function getGroupingConfig(mode: AiFindingGroupingMode) {
  if (mode === "severity") {
    return severityGroups
  }

  if (mode === "type") {
    return typeGroups
  }

  return statusGroups
}

export function ObjectInspector({
  activeTab,
  aiFindingStatuses,
  aiFindings,
  aiGroupingMode,
  aiFindingStatus,
  aiScanStatus,
  focusedModelIssueId,
  issueCount,
  modelReviewIssues,
  onCreateIssue,
  onClearScanResults,
  presentation = "sidebar",
  previewActive,
  reviewHistory,
  selectedIssue,
  selectedObjectVisible,
  onCollapse,
  onDismissFinding,
  onDropIssue,
  onFindingSelect,
  onGroupingModeChange,
  onHideIssueFromModel,
  onPreviewChange,
  onRescanAi,
  onRestoreFinding,
  onTabChange,
  onViewFindingInModel,
  onViewCreatedIssueDetails,
  onViewIssueInModel,
  selectedFindingId,
}: ObjectInspectorProps) {
  const [identityOpen, setIdentityOpen] = useState(true)
  const [geometryOpen, setGeometryOpen] = useState(true)
  const [compactDetailOpen, setCompactDetailOpen] = useState(false)
  const [openFindingGroups, setOpenFindingGroups] = useState(
    defaultOpenFindingGroups,
  )
  const details = selectedIssue.details
  const properties = [
    ["Category", details.category],
    ["System", details.system],
    ["Type", details.type],
    ["Level", details.level],
    ["Elevation", details.elevation],
    ["Material", details.material],
    ["Fire Rating", details.fireRating],
    ["IFC GUID", details.guid],
  ]
  const geometry = [
    ["Width", details.geometry.width],
    ["Height", details.geometry.height],
    ["Length", details.geometry.length],
    ["Volume", details.geometry.volume],
  ]
  const selectedFinding =
    aiFindings.find((finding) => finding.id === selectedFindingId) ?? null
  const activeReview = selectedFinding
    ? reviewContent[selectedFinding.highlight]
    : null
  const selectedDisciplineLabel =
    selectedIssue.discipline.charAt(0).toUpperCase() +
    selectedIssue.discipline.slice(1)
  const existingIssue = modelReviewIssues.find(
    (issue) => issue.sourceFindingId === selectedFinding?.id,
  )
  const hasAiFindings = aiFindings.length > 0
  const aiScanning = aiScanStatus === "scanning"
  const findingDismissed = aiFindingStatus === "dismissed"
  const issueCreated = aiFindingStatus === "issue-created"
  const findingNeedsReview = !findingDismissed && !issueCreated
  const findingGroups = useMemo(() => {
    const config = getGroupingConfig(aiGroupingMode)

    return config.map((group) => ({
      ...group,
      findings: aiFindings.filter(
        (finding) =>
          getFindingGroupKey(finding, aiGroupingMode, aiFindingStatuses) ===
          group.id,
      ),
    }))
  }, [aiFindingStatuses, aiFindings, aiGroupingMode])
  const selectedGroupKey = selectedFinding
    ? getFindingGroupKey(selectedFinding, aiGroupingMode, aiFindingStatuses)
    : null

  useEffect(() => {
    if (!selectedGroupKey) {
      return
    }

    setOpenFindingGroups((current) => ({
      ...current,
      [aiGroupingMode]: {
        ...current[aiGroupingMode],
        [selectedGroupKey]: true,
      },
    }))
  }, [aiGroupingMode, selectedGroupKey])

  useEffect(() => {
    if (selectedFindingId) {
      setCompactDetailOpen(true)
    }
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
    <aside
      id={presentation === "sidebar" ? "object-inspector" : undefined}
      className={cn(
        "relative min-h-0 overflow-hidden bg-panel",
        presentation === "sidebar"
          ? "border-l border-border/65 max-[901px]:hidden dark:border-border"
          : "h-full w-full",
      )}
    >
      <div className="border-b border-border/35 p-3 dark:border-border">
        <div className="flex items-start gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <span className="font-mono text-[10px] font-bold">
              {details.shortCode}
            </span>
          </div>
          <div
            className={cn("min-w-0", !selectedObjectVisible && "opacity-55")}
            data-testid="inspector-selection"
          >
            <p className="truncate text-xs font-semibold">
              {selectedIssue.object}
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
              {selectedObjectVisible
                ? `Object · ${details.objectId}`
                : `Hidden by ${selectedDisciplineLabel} layer`}
            </p>
          </div>
          {presentation === "sidebar" && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-7"
              aria-label="Collapse Object Inspector"
              aria-controls="object-inspector"
              aria-expanded="true"
              onClick={onCollapse}
            >
              <SidePanelGlyph direction="collapse" side="right" />
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as InspectorTab)}
        className="h-[calc(100%-65px)]"
      >
        <TabsList className="grid grid-cols-4 border-border/30 bg-panel/95 dark:border-border dark:bg-panel">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="issues">Issues {issueCount}</TabsTrigger>
          <TabsTrigger value="ai">AI Review</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="scrollbar-thin overflow-y-auto">
          <InspectorHeading
            open={identityOpen}
            title="Identity data"
            onToggle={() => setIdentityOpen((open) => !open)}
          />
          {identityOpen && (
            <dl className="px-3 pb-3">
              {properties.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-b border-border/25 py-2 text-[10px] dark:border-border/70"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd
                    className="min-w-0 truncate text-right font-medium"
                    data-property={label}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <InspectorHeading
            open={geometryOpen}
            title="Geometry"
            onToggle={() => setGeometryOpen((open) => !open)}
          />
          {geometryOpen && (
            <div className="grid grid-cols-2 gap-px border-y border-border/25 bg-border/22 dark:border-border dark:bg-border">
              {geometry.map(([label, value]) => (
                <div key={label} className="bg-panel/95 p-3 dark:bg-panel">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="issues" className="scrollbar-thin overflow-y-auto p-2">
          {modelReviewIssues.length > 0 ? (
            <div className="space-y-1.5">
              {modelReviewIssues.map((issue) => (
                <ModelReviewIssueCard
                  key={issue.id}
                  issue={issue}
                  focusedInModel={focusedModelIssueId === issue.id}
                  selected={issue.sourceFindingId === selectedIssue.id}
                  onHideFromModel={() => onHideIssueFromModel(issue)}
                  onViewInModel={() => onViewIssueInModel(issue)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/18 bg-muted/8 p-3 text-[10px] text-muted-foreground dark:border-border dark:bg-transparent">
              Created Model Review issues will appear here.
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="min-h-0 overflow-hidden p-0">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {hasAiFindings ? (
              <>
                <div className="shrink-0 border-b border-border/25 p-2.5 dark:border-border">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold">
                        AI Review Queue
                      </p>
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
                        onClick={onClearScanResults}
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
                      selectedFinding && compactDetailOpen
                        ? "hidden"
                        : "flex",
                    )}
                    aria-label="AI Review Queue"
                  >
                    <div className="shrink-0 border-b border-border/20 px-2 dark:border-border">
                      <div
                        className="grid h-8 grid-cols-3 text-muted-foreground"
                        role="tablist"
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
                            role="tab"
                            aria-selected={aiGroupingMode === mode.id}
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
                            openFindingGroups[aiGroupingMode][group.id] ??
                            false
                          const selectedInGroup =
                            selectedGroupKey === group.id
                          const Icon = open ? ChevronDown : ChevronRight

                          return (
                            <section
                              key={group.id}
                              className="bg-transparent"
                            >
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
                                              issue.sourceFindingId ===
                                              finding.id,
                                          )?.id
                                        }
                                        selected={
                                          finding.id === selectedFindingId
                                        }
                                        status={
                                          aiFindingStatuses[finding.id] ??
                                          "active"
                                        }
                                        onSelect={() =>
                                          onFindingSelect(finding)
                                        }
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
                      selectedFinding && compactDetailOpen
                        ? "flex"
                        : "hidden",
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
                                  <p className="text-[11px] font-semibold text-foreground">
                                    Finding Detail Panel
                                  </p>
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
                                        {selectedFinding.code}) has been added
                                        to the issues list.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 flex items-center gap-2 text-ai-foreground">
                                <span className="text-[10px] font-semibold">
                                  AI suggestion
                                </span>
                                {!findingDismissed && (
                                  <Sparkles className="size-3" />
                                )}
                              </div>
                              <p className="mt-2 text-[10px] leading-relaxed text-foreground/85">
                                {activeReview.suggestion}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-[9px] text-muted-foreground">
                                  Confidence
                                </span>
                                <Progress
                                  value={activeReview.confidence}
                                  aria-label="AI suggestion confidence"
                                  className="h-1.5 bg-ai/20"
                                />
                                <span className="font-mono text-[9px] text-ai-foreground">
                                  {activeReview.confidence}%
                                </span>
                              </div>
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
                                      onClick={onDropIssue}
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
                            {activeReview.checks.map(
                              ([label, detail, warning]) => (
                                <ReviewCheck
                                  key={label}
                                  label={label}
                                  detail={detail}
                                  warning={warning}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="hidden h-full min-h-0 items-center justify-center p-3 min-[1421px]:flex">
                        <div className="rounded-md border border-dashed border-border/22 bg-muted/8 p-3 text-[10px] text-muted-foreground dark:border-border dark:bg-transparent">
                          Select a finding from the AI Review Queue to review
                          evidence, preview a change, create an issue, or
                          dismiss the suggestion.
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
                        AI findings, issue actions, and review history appear
                        after the mock scan completes.
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
          </div>
        </TabsContent>

        <TabsContent value="history" className="scrollbar-thin overflow-y-auto p-3">
          {reviewHistory.length > 0 ? (
            <div className="space-y-4">
              {reviewHistory.map((event) => (
                <div key={event.id} className="flex gap-2.5">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock3 className="size-3" />
                </div>
                <div>
                  <p className="text-[10px] font-medium">{event.label}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {event.detail}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                    {event.time}
                  </p>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/18 bg-muted/8 p-3 text-[10px] text-muted-foreground dark:border-border dark:bg-transparent">
              Review actions will appear here during this session.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function InspectorHeading({
  open,
  title,
  onToggle,
}: {
  open: boolean
  title: string
  onToggle: () => void
}) {
  const Icon = open ? ChevronDown : ChevronRight

  return (
    <button
      type="button"
      className="flex h-8 w-full items-center gap-1 border-b border-border/25 px-3 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground outline-none hover:bg-muted/25 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:border-border dark:hover:bg-muted/60"
      aria-expanded={open}
      onClick={onToggle}
    >
      <Icon className="size-3" />
      {title}
    </button>
  )
}

function ModelReviewIssueCard({
  focusedInModel,
  issue,
  selected,
  onHideFromModel,
  onViewInModel,
}: {
  focusedInModel: boolean
  issue: ModelReviewIssue
  selected: boolean
  onHideFromModel: () => void
  onViewInModel: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2.5 shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)]",
        focusedInModel
          ? "border-primary/34 bg-primary/12 dark:border-primary/50 dark:bg-primary/16"
          : selected
            ? "border-primary/28 bg-accent/52 dark:border-primary/45 dark:bg-accent"
            : "border-border/22 bg-panel/95 dark:border-border dark:bg-panel",
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
        <span className="ml-auto text-[9px] text-muted-foreground">
          {focusedInModel ? "Shown in model" : issue.status}
        </span>
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
      </div>
    </div>
  )
}

function InspectorAiFindingButton({
  finding,
  issueId,
  selected,
  status,
  onSelect,
}: {
  finding: ReviewIssue
  issueId?: ModelReviewIssue["id"]
  selected: boolean
  status: AiFindingWorkflowStatus
  onSelect: () => void
}) {
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

function ReviewCheck({
  label,
  detail,
  warning = false,
}: {
  label: string
  detail: string
  warning?: boolean
}) {
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
