import { Loader2, ScanSearch } from "lucide-react"
import { SidePanelGlyph } from "@/components/layout/SidePanelGlyph"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type AiReviewEntryState =
  | "not_scanned"
  | "scanning"
  | "scanned_with_findings"

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
          className="min-[901px]:max-[1160px]:hidden"
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
  const hasFindings = aiReviewEntryState === "scanned_with_findings"
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

  return (
    <div
      className={`absolute right-16 top-3 z-20 flex max-w-[calc(100%-24px)] items-center overflow-hidden max-[900px]:left-1/2 max-[900px]:right-auto max-[900px]:max-w-[calc(100%-112px)] max-[900px]:-translate-x-1/2 ${className ?? ""}`}
    >
      <Button
        variant="outline"
        className="h-9 max-w-full gap-2 overflow-hidden border-ai/40 bg-panel/95 px-2.5 text-[11px] font-semibold text-ai-foreground shadow-sm ring-1 ring-ai/10 hover:border-ai/50 hover:bg-ai/12 hover:text-ai-foreground disabled:opacity-80 dark:bg-panel/90"
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
