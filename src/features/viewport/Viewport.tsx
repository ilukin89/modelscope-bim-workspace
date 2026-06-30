import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Layers3 } from "lucide-react"
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
  import("@/features/viewport/renderers/three/ThreeViewportRenderer").then(
    (module) => ({
      default: module.ThreeViewportRenderer,
    }),
  ),
)

interface ViewportProps {
  activeTool: ViewportTool
  aiReviewEntryState: "not_scanned" | "scanning" | "scanned_with_findings"
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
  const [toolbarSafeWidth, setToolbarSafeWidth] = useState<number | null>(null)
  const viewportFrameRef = useRef<HTMLElement | null>(null)
  const viewportContextRef = useRef<HTMLDivElement | null>(null)
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

  useLayoutEffect(() => {
    const frame = viewportFrameRef.current

    if (!frame) {
      return
    }

    const updateToolbarSafeWidth = () => {
      if (window.matchMedia("(max-width: 1160px)").matches) {
        setToolbarSafeWidth(null)
        return
      }

      const frameRect = frame.getBoundingClientRect()
      const contextRect =
        viewportContextRef.current?.getBoundingClientRect() ?? null
      const centerX = frameRect.left + frameRect.width / 2
      const edgeInset = 12
      const overlayGap = 10
      const safeLeft =
        contextRect && contextRect.width > 0
          ? Math.max(frameRect.left + edgeInset, contextRect.right + overlayGap)
          : frameRect.left + edgeInset
      const safeRight = frameRect.right - edgeInset
      const centeredWidth = Math.floor(
        Math.min(centerX - safeLeft, safeRight - centerX) * 2,
      )

      setToolbarSafeWidth(Math.max(112, centeredWidth))
    }

    updateToolbarSafeWidth()

    const resizeObserver = new ResizeObserver(updateToolbarSafeWidth)
    resizeObserver.observe(frame)

    if (viewportContextRef.current) {
      resizeObserver.observe(viewportContextRef.current)
    }

    window.addEventListener("resize", updateToolbarSafeWidth)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateToolbarSafeWidth)
    }
  }, [])

  const showViewportFeedback = (message: string, type: "frame" | "ai") => {
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
        modelFocusActive && modelFocusRequestIssueId === selectedIssue.id,
      modelFocusRequest,
      previewActive: previewActive && selectedAiFindingActive,
      selectedAiFindingActive,
      selectedFloor,
      selectedIssue,
      visibleLayerIds,
    }
    const svgRenderer = <SvgViewportRenderer {...rendererProps} />

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
    <section
      ref={viewportFrameRef}
      className="viewport-grid relative min-h-0 min-w-0 overflow-hidden"
    >
      <div className="contents max-[1160px]:absolute max-[1160px]:left-1/2 max-[1160px]:top-3 max-[1160px]:z-20 max-[1160px]:flex max-[1160px]:w-max max-[1160px]:max-w-[calc(100%-24px)] max-[1160px]:-translate-x-1/2 max-[1160px]:items-center max-[1160px]:gap-2 min-[901px]:max-[1160px]:flex-row max-[900px]:bottom-3 max-[900px]:top-auto max-[900px]:w-[min(288px,calc(100%-24px))] max-[900px]:flex-col max-[900px]:items-stretch">
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-24px)] -translate-x-1/2 justify-center max-[1160px]:static max-[1160px]:translate-x-0 min-[901px]:max-[1160px]:w-[112px] max-[900px]:w-full"
          style={
            toolbarSafeWidth === null
              ? undefined
              : { width: `${toolbarSafeWidth}px` }
          }
        >
          <ViewportToolbar
            activeTool={activeTool}
            className="pointer-events-auto"
            onToolChange={onToolChange}
          />
        </div>

        {showAiReviewAction && aiReviewEntryState !== "not_scanned" && (
          <div className="hidden min-[901px]:max-[1160px]:flex min-[901px]:max-[1160px]:shrink-0">
            <ViewportAiReviewAction
              aiReviewEntryState={aiReviewEntryState}
              aiReviewFindingCount={aiReviewFindingCount}
              className="static max-w-full translate-x-0"
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
        ref={viewportContextRef}
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
          <ViewerInitializationErrorBanner onRetry={handleViewerRetry} />
        )}
        {showViewerUnavailableBanner &&
          Boolean(rendererInitializationError) &&
          !viewerInitializationError && (
            <ViewerInitializationErrorBanner onRetry={handleViewerRetry} />
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
