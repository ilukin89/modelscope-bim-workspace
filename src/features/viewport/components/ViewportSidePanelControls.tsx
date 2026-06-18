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
  const showScanAction =
    aiReviewEntryState === "not_scanned" || aiReviewEntryState === "scanning"
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

      {showInspectorExpand && (
        <RightInspectorControlGroup
          onOpenInspector={onOpenInspector}
          onScanWithAi={onScanWithAi}
          scanning={scanning}
          showScanAction={showScanAction}
          className="max-[901px]:hidden"
        />
      )}

      {!compactInspectorOpen && (
        <RightInspectorControlGroup
          onOpenInspector={openCompactInspector}
          onScanWithAi={onScanWithAi}
          hideScanOnMobile
          scanning={scanning}
          showScanAction={showScanAction}
          className="min-[901px]:hidden"
        />
      )}
    </>
  )
}

function RightInspectorControlGroup({
  className,
  onOpenInspector,
  onScanWithAi,
  hideScanOnMobile = false,
  scanning,
  showScanAction,
}: {
  className?: string
  hideScanOnMobile?: boolean
  onOpenInspector: () => void
  onScanWithAi: () => void
  scanning: boolean
  showScanAction: boolean
}) {
  return (
    <div
      className={`absolute right-3 top-3 z-20 flex items-center gap-2 ${className ?? ""}`}
    >
      {showScanAction && (
        <ScanActionButton
          className={hideScanOnMobile ? "max-[680px]:hidden" : undefined}
          onScanWithAi={onScanWithAi}
          scanning={scanning}
        />
      )}
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

function ScanActionButton({
  className,
  onScanWithAi,
  scanning,
}: {
  className?: string
  onScanWithAi: () => void
  scanning: boolean
}) {
  return (
    <Button
      variant="outline"
      className={`h-9 gap-2 border-ai/35 bg-ai/10 px-2.5 text-[11px] font-semibold text-ai-foreground hover:border-ai/45 hover:bg-ai/16 hover:text-ai-foreground ${className ?? ""}`}
      aria-label={scanning ? "AI scan in progress" : "Scan with AI"}
      onClick={onScanWithAi}
      disabled={scanning}
    >
      {scanning ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ScanSearch className="size-3.5" />
      )}
      <span>{scanning ? "Scanning..." : "Scan with AI"}</span>
    </Button>
  )
}
