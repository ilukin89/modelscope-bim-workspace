import { useEffect, useRef, useState } from "react"
import {
  BoxSelect,
  Hand,
  Layers3,
  MessageSquarePlus,
  Orbit,
  Ruler,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AiReviewFindingsPopover } from "@/features/viewport/components/AiReviewFindingsPopover"
import { ViewportModelSvg } from "@/features/viewport/components/ViewportModelSvg"
import { ViewportSelectionCard } from "@/features/viewport/components/ViewportSelectionCard"
import { ViewportSidePanelControls } from "@/features/viewport/components/ViewportSidePanelControls"
import {
  ViewportCameraBadge,
  type ViewportFeedback,
  ViewportFeedbackToast,
  ViewportToolStatus,
} from "@/features/viewport/components/ViewportStatusOverlays"
import { ViewerInitializationErrorBanner } from "@/features/viewport/components/ViewerInitializationErrorBanner"
import { ViewportToolbar } from "@/features/viewport/ViewportToolbar"
import type { ViewportTool } from "@/features/viewport/types"
import { usePrototypeViewerAdapterLifecycle } from "@/features/viewport/viewer-adapter/usePrototypeViewerAdapterLifecycle"
import type {
  FloorName,
  FloorState,
  LayerId,
  ReviewIssue,
} from "@/types"
import { cn } from "@/lib/utils"

interface ViewportProps {
  activeTool: ViewportTool
  floors: FloorState[]
  issueCount: number
  issues: ReviewIssue[]
  onOpenAiReview: () => void
  onExpandExplorer: () => void
  onExpandInspector: () => void
  onOpenExplorer: () => void
  onOpenInspector: () => void
  onIssueSelect: (issue: ReviewIssue) => void
  onToolChange: (tool: ViewportTool) => void
  selectedFloor: FloorName
  selectedIssue: ReviewIssue
  showExplorerExpand: boolean
  showInspectorExpand: boolean
  visibleLayerIds: LayerId[]
}

export function Viewport({
  activeTool,
  floors,
  issueCount,
  issues,
  onOpenAiReview,
  onExpandExplorer,
  onExpandInspector,
  onOpenExplorer,
  onOpenInspector,
  onIssueSelect,
  onToolChange,
  selectedFloor,
  selectedIssue,
  showExplorerExpand,
  showInspectorExpand,
  visibleLayerIds,
}: ViewportProps) {
  const [aiFindingsOpen, setAiFindingsOpen] = useState(false)
  const [viewportFeedback, setViewportFeedback] =
    useState<ViewportFeedback | null>(null)
  const viewportFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const selectedObjectId = selectedIssue.details.objectId
  const {
    hostRef: viewportHostRef,
    initializationError: viewerInitializationError,
    retryInitialization: retryViewerInitialization,
  } = usePrototypeViewerAdapterLifecycle({
    activeTool,
    selectedFloor,
    selectedObjectId,
    visibleLayerIds,
  })
  const architectureVisible = visibleLayerIds.includes("architecture")
  const mechanicalVisible = visibleLayerIds.includes("mechanical")
  const structureVisible = visibleLayerIds.includes("structure")
  const electricalVisible = visibleLayerIds.includes("electrical")
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )
  const severityCounts = {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length,
  }
  const severitySummary = [
    {
      count: severityCounts.critical,
      label: "critical",
      className: "text-destructive",
    },
    {
      count: severityCounts.warning,
      label: severityCounts.warning === 1 ? "warning" : "warnings",
      className: "text-warning-foreground",
    },
    {
      count: severityCounts.info,
      label: "info",
      className: "text-primary",
    },
  ].filter((item) => item.count > 0)
  const selectedDisciplineLabel =
    selectedIssue.discipline.charAt(0).toUpperCase() +
    selectedIssue.discipline.slice(1)
  const selectedFloorIndex = Math.max(
    floors.findIndex((floor) => floor.label === selectedFloor),
    0,
  )
  const floorMarkerY =
    floors.length > 1
      ? 195 + (selectedFloorIndex / (floors.length - 1)) * 220
      : 305
  const sectionActive = activeTool === "Section"
  const toolMode = {
    Orbit: { label: "Orbit mode", icon: Orbit },
    Pan: { label: "Pan mode", icon: Hand },
    Section: { label: "Section plane active", icon: BoxSelect },
    Measure: { label: "Measure mode", icon: Ruler },
    Comment: { label: "Comment mode", icon: MessageSquarePlus },
  }[activeTool]
  const ToolModeIcon = toolMode.icon

  useEffect(
    () => () => {
      if (viewportFeedbackTimeout.current) {
        clearTimeout(viewportFeedbackTimeout.current)
      }
    },
    [],
  )

  const showViewportFeedback = (
    message: string,
    type: "frame" | "ai",
  ) => {
    setViewportFeedback({ message, type })
    if (viewportFeedbackTimeout.current) {
      clearTimeout(viewportFeedbackTimeout.current)
    }
    viewportFeedbackTimeout.current = setTimeout(
      () => setViewportFeedback(null),
      4000,
    )
  }



  const openAiReview = () => {
    showViewportFeedback(
      `AI Review opened · ${issueCount} findings`,
      "ai",
    )
  }

  const selectAiFinding = (issue: ReviewIssue) => {
    onIssueSelect(issue)
    onOpenAiReview()
    setAiFindingsOpen(false)
  }

  return (
    <section className="viewport-grid relative min-h-0 min-w-0 overflow-hidden">
      <div className="contents max-[1160px]:absolute max-[1160px]:left-1/2 max-[1160px]:top-3 max-[1160px]:z-20 max-[1160px]:flex max-[1160px]:w-max max-[1160px]:max-w-[calc(100%-24px)] max-[1160px]:-translate-x-1/2 max-[1160px]:flex-col max-[1160px]:items-stretch max-[1160px]:gap-2 max-[760px]:w-[min(288px,calc(100%-24px))]">
        <ViewportToolbar activeTool={activeTool} onToolChange={onToolChange} />

        <div
          className={cn(
            "absolute right-3 top-3 z-20 max-[1160px]:static max-[1160px]:w-0 max-[1160px]:min-w-full",
            showInspectorExpand && "min-[1161px]:right-14",
          )}
        >
          <AiReviewFindingsPopover
            issueCount={issueCount}
            issues={issues}
            onFindingSelect={selectAiFinding}
            onOpenChange={setAiFindingsOpen}
            onTriggerClick={openAiReview}
            open={aiFindingsOpen}
            selectedIssueId={selectedIssue.id}
            severitySummary={severitySummary}
          />
        </div>

        <ViewportToolStatus
          activeTool={activeTool}
          Icon={ToolModeIcon}
          label={toolMode.label}
        />

        <ViewportFeedbackToast feedback={viewportFeedback} />
      </div>

      <ViewportSidePanelControls
        onExpandExplorer={onExpandExplorer}
        onExpandInspector={onExpandInspector}
        onOpenExplorer={onOpenExplorer}
        onOpenInspector={onOpenInspector}
        showExplorerExpand={showExplorerExpand}
        showInspectorExpand={showInspectorExpand}
      />

      <div
        className={cn(
          "absolute top-3 z-10 max-[1160px]:hidden",
          showExplorerExpand ? "left-14" : "left-3",
        )}
      >
        <Badge
          variant="outline"
          className="bg-panel/95 normal-case tracking-normal"
          data-testid="viewport-context"
        >
          <Layers3 className="size-3" />
          Coordination · {selectedFloor}
        </Badge>
      </div>

      <div
        ref={viewportHostRef}
        className="absolute inset-0 z-[1] flex items-center justify-center p-10 max-[680px]:p-4"
      >
        {Boolean(viewerInitializationError) && (
          <ViewerInitializationErrorBanner
            onRetry={retryViewerInitialization}
          />
        )}
        <ViewportModelSvg
          activeTool={activeTool}
          architectureVisible={architectureVisible}
          electricalVisible={electricalVisible}
          floorMarkerY={floorMarkerY}
          mechanicalVisible={mechanicalVisible}
          sectionActive={sectionActive}
          selectedDisciplineLabel={selectedDisciplineLabel}
          selectedFloor={selectedFloor}
          selectedFloorIndex={selectedFloorIndex}
          selectedIssueHighlight={selectedIssue.highlight}
          selectedIssueObject={selectedIssue.object}
          selectedObjectVisible={selectedObjectVisible}
          structureVisible={structureVisible}
        />
      </div>

      <ViewportSelectionCard
        selectedDisciplineLabel={selectedDisciplineLabel}
        selectedIssue={selectedIssue}
        selectedObjectVisible={selectedObjectVisible}
      />

      <ViewportCameraBadge />
    </section>
  )
}
