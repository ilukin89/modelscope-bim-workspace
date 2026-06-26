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
  HighlightKind,
  LayerId,
  ReviewIssue,
} from "@/types"
import { cn } from "@/lib/utils"

interface ViewportProps {
  activeTool: ViewportTool
  aiReviewEntryState:
    | "not_scanned"
    | "scanning"
    | "scanned_with_findings"
  aiReviewFindingCount: number
  aiReviewFindingSpatialCounts: Record<HighlightKind, number>
  aiReviewVisualsActive: boolean
  compactInspectorOpen: boolean
  floors: FloorState[]
  modelFocusRequest: {
    issueId: ReviewIssue["id"]
    label: string
    nonce: number
  } | null
  onExpandExplorer: () => void
  onOpenAiReview: () => void
  onOpenExplorer: () => void
  onOpenInspector: () => void
  onScanWithAi: () => void
  onToolChange: (tool: ViewportTool) => void
  previewActive: boolean
  selectedAiFindingActive: boolean
  selectedFloor: FloorName
  selectedIssue: ReviewIssue
  showExplorerExpand: boolean
  showInspectorExpand: boolean
  visibleLayerIds: LayerId[]
}

export function Viewport({
  activeTool,
  aiReviewEntryState,
  aiReviewFindingCount,
  aiReviewFindingSpatialCounts,
  aiReviewVisualsActive,
  compactInspectorOpen,
  floors,
  modelFocusRequest,
  onExpandExplorer,
  onOpenAiReview,
  onOpenExplorer,
  onOpenInspector,
  onScanWithAi,
  onToolChange,
  previewActive,
  selectedAiFindingActive,
  selectedFloor,
  selectedIssue,
  showExplorerExpand,
  showInspectorExpand,
  visibleLayerIds,
}: ViewportProps) {
  const [viewportFeedback, setViewportFeedback] =
    useState<ViewportFeedback | null>(null)
  const [modelFocusActive, setModelFocusActive] = useState(false)
  const viewportFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const modelFocusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      if (modelFocusTimeout.current) {
        clearTimeout(modelFocusTimeout.current)
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

  useEffect(() => {
    if (!modelFocusRequest) {
      return
    }

    setModelFocusActive(true)
    showViewportFeedback(`${modelFocusRequest.label} framed in model`, "frame")

    if (modelFocusTimeout.current) {
      clearTimeout(modelFocusTimeout.current)
    }
    modelFocusTimeout.current = setTimeout(
      () => setModelFocusActive(false),
      1800,
    )
  }, [modelFocusRequest?.nonce])

  return (
    <section className="viewport-grid relative min-h-0 min-w-0 overflow-hidden">
      <div className="contents max-[1160px]:absolute max-[1160px]:left-1/2 max-[1160px]:top-3 max-[1160px]:z-20 max-[1160px]:flex max-[1160px]:w-max max-[1160px]:max-w-[calc(100%-24px)] max-[1160px]:-translate-x-1/2 max-[1160px]:flex-col max-[1160px]:items-stretch max-[1160px]:gap-2 max-[760px]:w-[min(288px,calc(100%-24px))]">
        <ViewportToolbar activeTool={activeTool} onToolChange={onToolChange} />

        <ViewportToolStatus
          activeTool={activeTool}
          Icon={ToolModeIcon}
          label={toolMode.label}
        />

        <ViewportFeedbackToast feedback={viewportFeedback} />
      </div>

      <ViewportSidePanelControls
        aiReviewEntryState={aiReviewEntryState}
        compactInspectorOpen={compactInspectorOpen}
        onExpandExplorer={onExpandExplorer}
        onOpenAiReview={onOpenAiReview}
        onOpenExplorer={onOpenExplorer}
        onOpenInspector={onOpenInspector}
        onScanWithAi={onScanWithAi}
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
          aiReviewFindingCount={aiReviewFindingCount}
          aiReviewFindingSpatialCounts={aiReviewFindingSpatialCounts}
          selectedDisciplineLabel={selectedDisciplineLabel}
          selectedFloor={selectedFloor}
          selectedFloorIndex={selectedFloorIndex}
          selectedIssueHighlight={selectedIssue.highlight}
          selectedIssueObject={selectedIssue.object}
          selectedObjectVisible={selectedObjectVisible}
          previewActive={previewActive && selectedAiFindingActive}
          modelFocusNonce={modelFocusRequest?.nonce ?? null}
          modelFocusActive={
            modelFocusActive &&
            modelFocusRequest?.issueId === selectedIssue.id
          }
          aiReviewVisualsActive={aiReviewVisualsActive}
          selectedAiFindingActive={selectedAiFindingActive}
          structureVisible={structureVisible}
        />
      </div>

      <ViewportSelectionCard
        aiReviewFindingCount={aiReviewFindingCount}
        aiReviewVisualsActive={aiReviewVisualsActive}
        previewActive={previewActive && selectedAiFindingActive}
        selectedAiFindingActive={selectedAiFindingActive}
        selectedDisciplineLabel={selectedDisciplineLabel}
        selectedIssue={selectedIssue}
        selectedObjectVisible={selectedObjectVisible}
      />

      <ViewportCameraBadge />
    </section>
  )
}
