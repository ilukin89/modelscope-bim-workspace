import { PanelLeftOpen, PanelRightOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ViewportSidePanelControlsProps {
  onExpandExplorer: () => void
  onExpandInspector: () => void
  onOpenExplorer: () => void
  onOpenInspector: () => void
  showExplorerExpand: boolean
  showInspectorExpand: boolean
}

export function ViewportSidePanelControls({
  onExpandExplorer,
  onExpandInspector,
  onOpenExplorer,
  onOpenInspector,
  showExplorerExpand,
  showInspectorExpand,
}: ViewportSidePanelControlsProps) {
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
                <PanelLeftOpen />
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
              <PanelLeftOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Open Model Explorer
          </TooltipContent>
        </Tooltip>
      </div>

      {showInspectorExpand && (
        <div className="absolute right-3 top-3 z-20 max-[901px]:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-panel"
                aria-label="Expand Object Inspector"
                aria-controls="object-inspector"
                aria-expanded="false"
                onClick={onExpandInspector}
              >
                <PanelRightOpen />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Expand Object Inspector
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="absolute right-3 top-3 z-20 min-[901px]:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-panel"
              aria-label="Open Object Inspector"
              aria-expanded="false"
              onClick={onOpenInspector}
            >
              <PanelRightOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Open Object Inspector
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  )
}
