import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { Loader2, ScanSearch, X } from "lucide-react"
import { SidePanelGlyph } from "@/components/layout/SidePanelGlyph"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AiReviewEntryState =
  | "not_scanned"
  | "scanning"
  | "scanned_with_findings"

type AssistantPosition = {
  bottom: number
  right: number
}

type AssistantPopoverPlacement = "up" | "down"
type AssistantPopoverAlignment = "left" | "right"

type AssistantDragState = {
  boundsHeight: number
  boundsWidth: number
  bottomInset: number
  leftInset: number
  rightInset: number
  startBottom: number
  startRight: number
  startX: number
  startY: number
  topInset: number
  widgetHeight: number
  widgetWidth: number
}

const assistantMargin = 12
const assistantDesktopSafeBottom = 72
const assistantDesktopSafeTop = 112
const assistantHomeBottomRatio = 0.28
const assistantLabelTailMinSafeWidth = 260
const assistantCompactSafeBottom = 132
const assistantPopoverOffset = 8
const assistantPopoverWidth = 278
const assistantPopoverEstimatedHeight = 158
const clampAssistantAxisPosition = (
  value: number,
  minValue: number,
  maxValue: number,
) => {
  const normalizedMax = Math.max(maxValue, 0)
  const normalizedMin = Math.min(minValue, normalizedMax)

  return Math.min(Math.max(value, normalizedMin), normalizedMax)
}
const getAssistantSafeInsets = () => ({
  bottom: window.matchMedia("(max-width: 900px)").matches
    ? assistantCompactSafeBottom
    : assistantDesktopSafeBottom,
  left: assistantMargin,
  right: assistantMargin,
  top: assistantDesktopSafeTop,
})
const getAssistantSafeWidth = (boundsRect: DOMRect) => {
  const safeInsets = getAssistantSafeInsets()

  return Math.max(boundsRect.width - safeInsets.left - safeInsets.right, 0)
}
const getAssistantHomePosition = (
  widgetRect: DOMRect,
  boundsRect: DOMRect,
): AssistantPosition => {
  const safeInsets = getAssistantSafeInsets()
  const maxBottom =
    boundsRect.height - widgetRect.height - safeInsets.top
  const midLowBottom = Math.round(
    Math.max(
      safeInsets.bottom,
      boundsRect.height * assistantHomeBottomRatio,
    ),
  )

  return {
    bottom: clampAssistantAxisPosition(
      midLowBottom,
      safeInsets.bottom,
      maxBottom,
    ),
    right: clampAssistantAxisPosition(
      safeInsets.right,
      safeInsets.right,
      boundsRect.width - widgetRect.width - safeInsets.left,
    ),
  }
}
const getClampedAssistantPosition = (
  position: AssistantPosition,
  widgetRect: DOMRect,
  boundsRect: DOMRect,
): AssistantPosition => {
  const safeInsets = getAssistantSafeInsets()
  const maxBottom =
    boundsRect.height - widgetRect.height - safeInsets.top
  const homePosition = getAssistantHomePosition(widgetRect, boundsRect)
  const bottom =
    position.bottom > maxBottom || position.bottom < safeInsets.bottom
      ? homePosition.bottom
      : position.bottom

  return {
    bottom: clampAssistantAxisPosition(
      bottom,
      safeInsets.bottom,
      maxBottom,
    ),
    right: clampAssistantAxisPosition(
      position.right,
      safeInsets.right,
      boundsRect.width - widgetRect.width - safeInsets.left,
    ),
  }
}
const getAssistantPopoverAlignment = (
  widgetRect: DOMRect,
  boundsRect: DOMRect,
  popoverWidth: number,
): AssistantPopoverAlignment => {
  const rightAlignedLeft = widgetRect.right - popoverWidth
  const leftAlignedRight = widgetRect.left + popoverWidth

  if (rightAlignedLeft >= boundsRect.left + assistantMargin) return "right"
  if (leftAlignedRight <= boundsRect.right - assistantMargin) return "left"

  return widgetRect.left - boundsRect.left > boundsRect.right - widgetRect.right
    ? "right"
    : "left"
}
const getAssistantPopoverPlacement = (
  widgetRect: DOMRect,
  boundsRect: DOMRect,
  popoverHeight: number,
): AssistantPopoverPlacement => {
  const availableAbove =
    widgetRect.top -
    boundsRect.top -
    assistantMargin -
    assistantPopoverOffset
  const availableBelow =
    boundsRect.bottom -
    widgetRect.bottom -
    assistantMargin -
    assistantPopoverOffset
  const centerY = widgetRect.top + widgetRect.height / 2 - boundsRect.top
  const preferredPlacement =
    centerY < boundsRect.height / 2 ? "down" : "up"
  const preferredSpace =
    preferredPlacement === "down" ? availableBelow : availableAbove
  const alternateSpace =
    preferredPlacement === "down" ? availableAbove : availableBelow

  if (preferredSpace >= popoverHeight) return preferredPlacement
  if (alternateSpace >= popoverHeight) {
    return preferredPlacement === "down" ? "up" : "down"
  }

  return availableBelow >= availableAbove ? "down" : "up"
}

interface ViewportSidePanelControlsProps {
  aiReviewEntryState: AiReviewEntryState
  aiReviewFindingCount: number
  compactInspectorOpen: boolean
  onExpandExplorer: () => void
  onOpenAiReview: () => void
  onOpenExplorer: () => void
  onOpenInspector: () => void
  onScanWithAi: () => void
  showExplorerExpand: boolean
  showInspectorExpand: boolean
}

export function ViewportSidePanelControls({
  aiReviewEntryState,
  aiReviewFindingCount,
  compactInspectorOpen,
  onExpandExplorer,
  onOpenAiReview,
  onOpenExplorer,
  onOpenInspector,
  onScanWithAi,
  showExplorerExpand,
  showInspectorExpand,
}: ViewportSidePanelControlsProps) {
  const scanning = aiReviewEntryState === "scanning"
  const showAiReviewAction =
    aiReviewEntryState === "not_scanned" ||
    aiReviewEntryState === "scanning" ||
    aiReviewEntryState === "scanned_with_findings"
  const openCompactInspector = () => {
    if (
      aiReviewEntryState !== "scanned_with_findings" &&
      window.matchMedia("(max-width: 680px)").matches
    ) {
      onOpenAiReview()
      return
    }

    onOpenInspector()
  }

  return (
    <>
      {showExplorerExpand && (
        <div className="absolute left-3 top-3 z-20 max-[901px]:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-panel"
                aria-label="Expand Model Explorer"
                aria-controls="desktop-model-explorer"
                aria-expanded="false"
                onClick={onExpandExplorer}
              >
                <SidePanelGlyph direction="expand" side="left" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Expand Model Explorer
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="absolute left-3 top-3 z-20 min-[901px]:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-panel"
              aria-label="Open Model Explorer"
              aria-expanded="false"
              onClick={onOpenExplorer}
            >
              <SidePanelGlyph direction="expand" side="left" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Open Model Explorer
          </TooltipContent>
        </Tooltip>
      </div>

      {showAiReviewAction && (
        <ViewportAiReviewAction
          aiReviewEntryState={aiReviewEntryState}
          aiReviewFindingCount={aiReviewFindingCount}
          className={cn(
            aiReviewEntryState !== "not_scanned" &&
              "min-[901px]:max-[1160px]:hidden",
            compactInspectorOpen && "max-[900px]:hidden",
          )}
          onOpenAiReview={onOpenAiReview}
          onScanWithAi={onScanWithAi}
          scanning={scanning}
        />
      )}

      {showInspectorExpand && (
        <RightInspectorControlGroup
          onOpenInspector={onOpenInspector}
          className="max-[901px]:hidden"
        />
      )}

      {!compactInspectorOpen && (
        <RightInspectorControlGroup
          onOpenInspector={openCompactInspector}
          className="min-[901px]:hidden"
        />
      )}
    </>
  )
}

function RightInspectorControlGroup({
  className,
  onOpenInspector,
}: {
  className?: string
  onOpenInspector: () => void
}) {
  return (
    <div
      className={`absolute right-3 top-3 z-20 flex items-center gap-2 ${className ?? ""}`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-panel"
            aria-label="Open Object Inspector"
            aria-controls="object-inspector"
            aria-expanded="false"
            onClick={onOpenInspector}
          >
            <SidePanelGlyph direction="expand" side="right" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Open Object Inspector</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function ViewportAiReviewAction({
  aiReviewEntryState,
  aiReviewFindingCount,
  className,
  onOpenAiReview,
  onScanWithAi,
  scanning,
}: {
  aiReviewEntryState: AiReviewEntryState
  aiReviewFindingCount: number
  className?: string
  onOpenAiReview: () => void
  onScanWithAi: () => void
  scanning: boolean
}) {
  const [introExpanded, setIntroExpanded] = useState(false)
  const [labelTailVisible, setLabelTailVisible] = useState(true)
  const [assistantPosition, setAssistantPosition] =
    useState<AssistantPosition | null>(null)
  const [assistantDragging, setAssistantDragging] = useState(false)
  const [popoverAlignment, setPopoverAlignment] =
    useState<AssistantPopoverAlignment>("right")
  const [popoverPlacement, setPopoverPlacement] =
    useState<AssistantPopoverPlacement>("up")
  const assistantWidgetRef = useRef<HTMLDivElement | null>(null)
  const assistantPopoverRef = useRef<HTMLElement | null>(null)
  const assistantDragState = useRef<AssistantDragState | null>(null)
  const suppressAssistantClick = useRef(false)
  const hasFindings = aiReviewEntryState === "scanned_with_findings"
  const showIntroCard = aiReviewEntryState === "not_scanned"
  const label = scanning
    ? "Scanning..."
    : hasFindings
      ? aiReviewFindingCount > 0
        ? `${aiReviewFindingCount} findings`
        : "Review findings"
      : "Scan with AI"
  const ariaLabel = scanning
    ? "AI scan in progress"
    : hasFindings
      ? "Review AI findings"
      : "Scan with AI"
  const handleClick = hasFindings ? onOpenAiReview : onScanWithAi
  const openAssistant = () => {
    const widget = assistantWidgetRef.current
    const boundsElement = widget?.offsetParent as HTMLElement | null
    if (widget && boundsElement) {
      const widgetRect = widget.getBoundingClientRect()
      const boundsRect = boundsElement.getBoundingClientRect()
      const nextPlacement = getAssistantPopoverPlacement(
        widgetRect,
        boundsRect,
        assistantPopoverEstimatedHeight,
      )
      const nextAlignment = getAssistantPopoverAlignment(
        widgetRect,
        boundsRect,
        assistantPopoverWidth,
      )
      const nextPosition = getClampedAssistantPosition(
        {
          bottom: boundsRect.bottom - widgetRect.bottom,
          right: boundsRect.right - widgetRect.right,
        },
        widgetRect,
        boundsRect,
      )

      setPopoverPlacement(nextPlacement)
      setPopoverAlignment(nextAlignment)
      setAssistantPosition(nextPosition)
    }

    setLabelTailVisible(false)
    setIntroExpanded(true)
  }
  const closeAssistant = () => setIntroExpanded(false)
  const startScan = () => {
    setIntroExpanded(false)
    setLabelTailVisible(false)
    onScanWithAi()
  }
  const startAssistantDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) return

    const widget = assistantWidgetRef.current
    const boundsElement = widget?.offsetParent as HTMLElement | null
    if (!widget || !boundsElement) return

    const widgetRect = widget.getBoundingClientRect()
    const boundsRect = boundsElement.getBoundingClientRect()
    const safeInsets = getAssistantSafeInsets()
    assistantDragState.current = {
      bottomInset: safeInsets.bottom,
      boundsHeight: boundsRect.height,
      boundsWidth: boundsRect.width,
      leftInset: safeInsets.left,
      rightInset: safeInsets.right,
      startBottom: boundsRect.bottom - widgetRect.bottom,
      startRight: boundsRect.right - widgetRect.right,
      startX: event.clientX,
      startY: event.clientY,
      topInset: safeInsets.top,
      widgetHeight: widgetRect.height,
      widgetWidth: widgetRect.width,
    }
    suppressAssistantClick.current = false
    setLabelTailVisible(false)
    setAssistantDragging(true)
  }

  useEffect(() => {
    if (!showIntroCard || !labelTailVisible) return undefined

    const hideLabelTail = window.setTimeout(() => {
      setLabelTailVisible(false)
    }, 3600)

    return () => window.clearTimeout(hideLabelTail)
  }, [labelTailVisible, showIntroCard])

  useLayoutEffect(() => {
    if (!showIntroCard || assistantDragging) return undefined

    const keepAssistantInSafeArea = () => {
      const widget = assistantWidgetRef.current
      const boundsElement = widget?.offsetParent as HTMLElement | null
      if (!widget || !boundsElement) return

      const widgetRect = widget.getBoundingClientRect()
      const boundsRect = boundsElement.getBoundingClientRect()

      if (
        labelTailVisible &&
        !introExpanded &&
        getAssistantSafeWidth(boundsRect) < assistantLabelTailMinSafeWidth
      ) {
        setLabelTailVisible(false)
        return
      }

      setAssistantPosition((current) => {
        const requestedPosition =
          current ?? getAssistantHomePosition(widgetRect, boundsRect)
        const nextPosition = getClampedAssistantPosition(
          requestedPosition,
          widgetRect,
          boundsRect,
        )

        if (
          current?.bottom === nextPosition.bottom &&
          current.right === nextPosition.right
        ) {
          return current
        }

        return nextPosition
      })
    }

    keepAssistantInSafeArea()

    const widget = assistantWidgetRef.current
    const boundsElement = widget?.offsetParent as HTMLElement | null
    const resizeObserver = new ResizeObserver(keepAssistantInSafeArea)

    if (widget) {
      resizeObserver.observe(widget)
    }
    if (boundsElement) {
      resizeObserver.observe(boundsElement)
    }

    window.addEventListener("resize", keepAssistantInSafeArea)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", keepAssistantInSafeArea)
    }
  }, [
    assistantDragging,
    introExpanded,
    labelTailVisible,
    showIntroCard,
  ])

  useEffect(() => {
    if (!introExpanded) return undefined

    const keepAssistantPopoverInBounds = () => {
      const widget = assistantWidgetRef.current
      const popover = assistantPopoverRef.current
      const boundsElement = widget?.offsetParent as HTMLElement | null
      if (!widget || !popover || !boundsElement) return

      const widgetRect = widget.getBoundingClientRect()
      const popoverRect = popover.getBoundingClientRect()
      const boundsRect = boundsElement.getBoundingClientRect()
      const nextPlacement = getAssistantPopoverPlacement(
        widgetRect,
        boundsRect,
        popoverRect.height,
      )
      const nextAlignment = getAssistantPopoverAlignment(
        widgetRect,
        boundsRect,
        popoverRect.width,
      )

      if (nextPlacement !== popoverPlacement) {
        setPopoverPlacement(nextPlacement)
        return
      }
      if (nextAlignment !== popoverAlignment) {
        setPopoverAlignment(nextAlignment)
        return
      }

      let nextBottom = boundsRect.bottom - widgetRect.bottom
      const overflowTop =
        boundsRect.top + assistantMargin - popoverRect.top
      const overflowBottom =
        popoverRect.bottom - (boundsRect.bottom - assistantMargin)

      if (overflowTop > 0) {
        nextBottom -= overflowTop
      }
      if (overflowBottom > 0) {
        nextBottom += overflowBottom
      }

      const nextPosition = getClampedAssistantPosition(
        {
          bottom: nextBottom,
          right: boundsRect.right - widgetRect.right,
        },
        widgetRect,
        boundsRect,
      )

      setAssistantPosition((current) => {
        if (
          current?.bottom === nextPosition.bottom &&
          current.right === nextPosition.right
        ) {
          return current
        }

        return nextPosition
      })
    }

    keepAssistantPopoverInBounds()
    window.addEventListener("resize", keepAssistantPopoverInBounds)

    const handlePointerDown = (event: PointerEvent) => {
      if (
        assistantWidgetRef.current &&
        !assistantWidgetRef.current.contains(event.target as Node)
      ) {
        closeAssistant()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAssistant()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("resize", keepAssistantPopoverInBounds)
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [assistantPosition, introExpanded, popoverAlignment, popoverPlacement])

  useEffect(() => {
    if (!assistantDragging) return undefined

    const handlePointerMove = (event: PointerEvent) => {
      const drag = assistantDragState.current
      if (!drag) return

      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        suppressAssistantClick.current = true
      }

      setAssistantPosition({
        bottom: clampAssistantAxisPosition(
          drag.startBottom - deltaY,
          drag.bottomInset,
          drag.boundsHeight - drag.widgetHeight - drag.topInset,
        ),
        right: clampAssistantAxisPosition(
          drag.startRight - deltaX,
          drag.rightInset,
          drag.boundsWidth - drag.widgetWidth - drag.leftInset,
        ),
      })
    }

    const handlePointerUp = () => {
      assistantDragState.current = null
      setAssistantDragging(false)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp, { once: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [assistantDragging])

  const introPopover = introExpanded ? (
    <section
      ref={assistantPopoverRef}
      id="viewport-ai-scan-nudge"
      className={cn(
        "absolute w-[min(278px,calc(100vw-24px))] rounded-md border border-primary/35 bg-panel p-2.5 text-foreground shadow-xl ring-1 ring-primary/18",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "motion-reduce:animate-none motion-reduce:transition-opacity",
        popoverAlignment === "left" ? "left-0" : "right-0",
        popoverPlacement === "up"
          ? cn(
              "bottom-[calc(100%+8px)] slide-in-from-bottom-1",
              popoverAlignment === "left"
                ? "origin-bottom-left"
                : "origin-bottom-right",
            )
          : cn(
              "top-[calc(100%+8px)] slide-in-from-top-1",
              popoverAlignment === "left"
                ? "origin-top-left"
                : "origin-top-right",
            ),
      )}
      aria-labelledby="viewport-ai-scan-intro-title"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <ScanSearch className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="viewport-ai-scan-intro-title"
            className="text-[11px] font-semibold leading-snug"
          >
            AI-assisted review
          </h2>
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
            Find possible model review findings before creating issues.
            Suggestions stay provisional.
          </p>
          <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
            Findings appear in the AI Review Queue.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 size-6 shrink-0 text-muted-foreground hover:bg-muted/35 hover:text-foreground"
          aria-label="Collapse AI review scan assistant"
          aria-controls="viewport-ai-scan-nudge"
          onClick={closeAssistant}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-2.5 h-7 w-full justify-center gap-2 border-primary/35 bg-background px-2 text-[10px] font-semibold text-primary shadow-sm ring-1 ring-primary/10 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        aria-label="Scan model"
        onClick={startScan}
      >
        <ScanSearch className="size-3.5" />
        <span className="min-w-0 truncate">Scan model</span>
      </Button>
    </section>
  ) : null

  if (showIntroCard) {
    return (
      <div
        ref={assistantWidgetRef}
        className={cn(
          "absolute z-20 max-w-[calc(100%-24px)]",
          assistantPosition
            ? ""
            : "bottom-28 right-4 max-[900px]:bottom-28 max-[760px]:bottom-32 max-[760px]:right-3",
          className,
        )}
        style={assistantPosition ?? undefined}
      >
        <div className="relative flex items-center gap-2">
          {introPopover}

          {labelTailVisible && !introExpanded && (
            <button
              type="button"
              className={cn(
                "-mr-1 h-8 rounded-l-md rounded-r-sm border border-primary/40 bg-panel px-2.5 text-[10px] font-semibold text-primary shadow-lg ring-1 ring-primary/18",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "motion-reduce:transform-none motion-reduce:transition-opacity",
              )}
              aria-label="Open AI review scan assistant"
              aria-controls="viewport-ai-scan-nudge"
              aria-expanded="false"
              onClick={openAssistant}
            >
              AI review
            </button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "relative size-[46px] touch-none rounded-full border-primary/35 bg-panel text-primary shadow-lg ring-1 ring-primary/18",
                  "cursor-grab transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
                  "motion-reduce:transform-none",
                  assistantDragging && "cursor-grabbing scale-[1.03]",
                )}
                aria-expanded={introExpanded}
                aria-label="AI review scan"
                aria-controls="viewport-ai-scan-nudge"
                onPointerDown={startAssistantDrag}
                onClick={() => {
                  if (suppressAssistantClick.current) {
                    suppressAssistantClick.current = false
                    return
                  }
                  if (introExpanded) closeAssistant()
                  else openAssistant()
                }}
              >
                <ScanSearch className="relative size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">AI review scan</TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "absolute right-16 top-3 z-20 flex max-w-[calc(100%-24px)] items-center overflow-hidden max-[900px]:left-1/2 max-[900px]:right-auto max-[900px]:max-w-[calc(100%-112px)] max-[900px]:-translate-x-1/2",
        className,
      )}
    >
      <Button
        variant="outline"
        className="h-9 max-w-full gap-2 overflow-hidden border-ai/45 bg-panel px-2.5 text-[11px] font-semibold text-ai-foreground shadow-md ring-1 ring-ai/16 hover:border-ai/55 hover:bg-ai/12 hover:text-ai-foreground disabled:opacity-80"
        aria-label={ariaLabel}
        onClick={handleClick}
        disabled={scanning}
      >
        {scanning ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ScanSearch className="size-3.5" />
        )}
        <span className="min-w-0 truncate">{label}</span>
      </Button>
    </div>
  )
}
