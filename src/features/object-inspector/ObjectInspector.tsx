import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Clock3,
} from "lucide-react"
import { SidePanelGlyph } from "@/components/layout/SidePanelGlyph"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModelReviewAiReviewPanel } from "@/features/object-inspector/components/ModelReviewAiReviewPanel"
import { ModelReviewIssuesPanel } from "@/features/object-inspector/components/ModelReviewIssuesPanel"
import type { InspectorTab } from "@/features/object-inspector/types"
import { cn } from "@/lib/utils"
import type {
  AiFindingGroupingMode,
  AiFindingWorkflowStatus,
  AiScanStatus,
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ReviewIssue,
} from "@/types"

interface ObjectInspectorProps {
  activeTab: InspectorTab
  aiFindingStatuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>
  aiFindings: ReviewIssue[]
  aiGroupingMode: AiFindingGroupingMode
  aiFindingStatus: AiFindingWorkflowStatus
  aiScanStatus: AiScanStatus
  focusedIssueCardId: ModelReviewIssue["id"] | null
  focusedModelIssueId: ModelReviewIssue["id"] | null
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
  onUpdateIssueStatus: (
    id: ModelReviewIssue["id"],
    status: ModelReviewIssueStatus,
  ) => void
  onViewFindingInModel: () => void
  onViewCreatedIssueDetails: () => void
  onViewIssueInModel: (issue: ModelReviewIssue) => void
  selectedFindingId: ReviewIssue["id"] | null
}

export function ObjectInspector({
  activeTab,
  aiFindingStatuses,
  aiFindings,
  aiGroupingMode,
  aiFindingStatus,
  aiScanStatus,
  focusedIssueCardId,
  focusedModelIssueId,
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
  onUpdateIssueStatus,
  onViewFindingInModel,
  onViewCreatedIssueDetails,
  onViewIssueInModel,
  selectedFindingId,
}: ObjectInspectorProps) {
  const [identityOpen, setIdentityOpen] = useState(true)
  const [geometryOpen, setGeometryOpen] = useState(true)
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
  const selectedDisciplineLabel =
    selectedIssue.discipline.charAt(0).toUpperCase() +
    selectedIssue.discipline.slice(1)
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
          <TabsTrigger value="issues">
            Issues {modelReviewIssues.length}
          </TabsTrigger>
          <TabsTrigger value="ai">AI Review</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent
          value="properties"
          className="scrollbar-thin overflow-y-auto"
        >
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

        <TabsContent
          value="issues"
          className="scrollbar-thin overflow-y-auto p-2"
        >
          <ModelReviewIssuesPanel
            focusedIssueCardId={focusedIssueCardId}
            focusedModelIssueId={focusedModelIssueId}
            issues={modelReviewIssues}
            selectedIssueId={selectedIssue.id}
            onHideIssueFromModel={onHideIssueFromModel}
            onUpdateIssueStatus={onUpdateIssueStatus}
            onViewIssueInModel={onViewIssueInModel}
          />
        </TabsContent>

        <TabsContent
          value="ai"
          className="min-h-0 overflow-hidden p-0"
        >
          <ModelReviewAiReviewPanel
            aiFindingStatuses={aiFindingStatuses}
            aiFindings={aiFindings}
            aiFindingStatus={aiFindingStatus}
            aiGroupingMode={aiGroupingMode}
            aiScanStatus={aiScanStatus}
            modelReviewIssues={modelReviewIssues}
            previewActive={previewActive}
            selectedFindingId={selectedFindingId}
            onClearScanResults={onClearScanResults}
            onCreateIssue={onCreateIssue}
            onDismissFinding={onDismissFinding}
            onDropIssue={onDropIssue}
            onFindingSelect={onFindingSelect}
            onGroupingModeChange={onGroupingModeChange}
            onPreviewChange={onPreviewChange}
            onRescanAi={onRescanAi}
            onRestoreFinding={onRestoreFinding}
            onViewCreatedIssueDetails={onViewCreatedIssueDetails}
            onViewFindingInModel={onViewFindingInModel}
          />
        </TabsContent>

        <TabsContent
          value="history"
          className="scrollbar-thin overflow-y-auto p-3"
        >
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
