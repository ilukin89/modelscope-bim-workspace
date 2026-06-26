import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  BoxSelect,
  Hand,
  Layers3,
  MessageSquarePlus,
  Orbit,
  Ruler,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ViewportSelectionCard } from "@/features/viewport/components/ViewportSelectionCard"
import {
  ViewportAiReviewAction,
  ViewportSidePanelControls,
} from "@/features/viewport/components/ViewportSidePanelControls"
import {
  ViewportCameraBadge,
  type ViewportFeedback,
  ViewportFeedbackToast,
  ViewportToolStatus,
} from "@/features/viewport/components/ViewportStatusOverlays"
import { ViewerInitializationErrorBanner } from "@/features/viewport/components/ViewerInitializationErrorBanner"
import { ViewportRendererFallbackBoundary } from "@/features/viewport/renderers/ViewportRendererFallbackBoundary"
import { SvgViewportRenderer } from "@/features/viewport/renderers/svg/SvgViewportRenderer"
import {
  resolveViewportRendererMode,
  type ViewportRendererMode,
} from "@/features/viewport/renderers/types"
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

const ThreeViewportRenderer = lazy(() =>
  import(
    "@/features/viewport/renderers/three/ThreeViewportRenderer"
  ).then((module) => ({
    default: module.ThreeViewportRenderer,
  })),
)

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
  const [rendererInitializationError, setRendererInitializationError] =
    useState<Error | null>(null)
  const [rendererRetryAttempt, setRendererRetryAttempt] = useState(0)
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
  const viewportRendererMode = resolveViewportRendererMode(
    import.meta.env.VITE_VIEWPORT_RENDERER,
  )
  const showViewerUnavailableBanner = viewportRendererMode === "three"
  const rendererFallbackResetKey = `${viewportRendererMode}:${rendererRetryAttempt}`
  const modelFocusRequestIssueId = modelFocusRequest?.issueId ?? null
  const modelFocusRequestLabel = modelFocusRequest?.label ?? null
  const modelFocusRequestNonce = modelFocusRequest?.nonce ?? null
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )
  const selectedDisciplineLabel =
    selectedIssue.discipline.charAt(0).toUpperCase() +
    selectedIssue.discipline.slice(1)
  const toolMode = {
    Orbit: { label: "Orbit mode", icon: Orbit },
    Pan: { label: "Pan mode", icon: Hand },
    Section: { label: "Section plane active", icon: BoxSelect },
    Measure: { label: "Measure mode", icon: Ruler },
    Comment: { label: "Comment mode", icon: MessageSquarePlus },
  }[activeTool]
  const ToolModeIcon = toolMode.icon
  const aiReviewScanning = aiReviewEntryState === "scanning"
  const showAiReviewAction =
    aiReviewEntryState === "not_scanned" ||
    aiReviewEntryState === "scanning" ||
    aiReviewEntryState === "scanned_with_findings"

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

  const handleViewerRetry = useCallback(() => {
    setRendererInitializationError(null)
    setRendererRetryAttempt((attempt) => attempt + 1)
    retryViewerInitialization()
  }, [retryViewerInitialization])

  const renderViewportRenderer = (rendererMode: ViewportRendererMode) => {
    const rendererProps = {
      activeTool,
      aiReviewFindingCount,
      aiReviewFindingSpatialCounts,
      aiReviewVisualsActive,
      floors,
      modelFocusActive:
        modelFocusActive &&
        modelFocusRequestIssueId === selectedIssue.id,
      modelFocusRequest,
      previewActive: previewActive && selectedAiFindingActive,
      selectedAiFindingActive,
      selectedFloor,
      selectedIssue,
      visibleLayerIds,
    }
    const svgRenderer = (
      <SvgViewportRenderer {...rendererProps} />
    )

    if (rendererMode === "three") {
      return (
        <ViewportRendererFallbackBoundary
          fallback={svgRenderer}
          onError={setRendererInitializationError}
          resetKey={rendererFallbackResetKey}
        >
          <Suspense
            fallback={
              <div
                className="h-full w-full"
                aria-hidden="true"
                data-renderer-loading="three"
              />
            }
          >
            <ThreeViewportRenderer {...rendererProps} />
          </Suspense>
        </ViewportRendererFallbackBoundary>
      )
    }

    return svgRenderer
  }

  useEffect(() => {
    if (modelFocusRequestLabel === null || modelFocusRequestNonce === null) {
      return
    }

    setModelFocusActive(true)
    showViewportFeedback(`${modelFocusRequestLabel} framed in model`, "frame")

    if (modelFocusTimeout.current) {
      clearTimeout(modelFocusTimeout.current)
    }
    modelFocusTimeout.current = setTimeout(
      () => setModelFocusActive(false),
      1800,
    )
  }, [modelFocusRequestLabel, modelFocusRequestNonce])

  return (
    <section className="viewport-grid relative min-h-0 min-w-0 overflow-hidden">
      <div className="contents max-[1160px]:absolute max-[1160px]:left-1/2 max-[1160px]:top-3 max-[1160px]:z-20 max-[1160px]:flex max-[1160px]:w-max max-[1160px]:max-w-[calc(100%-24px)] max-[1160px]:-translate-x-1/2 max-[1160px]:flex-col max-[1160px]:items-stretch max-[1160px]:gap-2 max-[900px]:bottom-3 max-[900px]:top-auto max-[900px]:w-[min(288px,calc(100%-24px))]">
        <ViewportToolbar activeTool={activeTool} onToolChange={onToolChange} />

        <ViewportToolStatus
          activeTool={activeTool}
          className="min-[901px]:max-[1160px]:hidden"
          Icon={ToolModeIcon}
          label={toolMode.label}
        />

        {showAiReviewAction && (
          <div className="hidden min-[901px]:max-[1160px]:flex min-[901px]:max-[1160px]:justify-center">
            <ViewportAiReviewAction
              aiReviewEntryState={aiReviewEntryState}
              aiReviewFindingCount={aiReviewFindingCount}
              className="static max-w-full translate-x-0 self-center"
              onOpenAiReview={onOpenAiReview}
              onScanWithAi={onScanWithAi}
              scanning={aiReviewScanning}
            />
          </div>
        )}

        <ViewportFeedbackToast feedback={viewportFeedback} />
      </div>

      <ViewportSidePanelControls
        aiReviewEntryState={aiReviewEntryState}
        aiReviewFindingCount={aiReviewFindingCount}
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
        {showViewerUnavailableBanner && Boolean(viewerInitializationError) && (
          <ViewerInitializationErrorBanner
            onRetry={handleViewerRetry}
          />
        )}
        {showViewerUnavailableBanner &&
          Boolean(rendererInitializationError) &&
          !viewerInitializationError && (
            <ViewerInitializationErrorBanner
              onRetry={handleViewerRetry}
            />
          )}
        {renderViewportRenderer(viewportRendererMode)}
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
