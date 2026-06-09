import { Circle, Eye, Layers3, MousePointer2, Users } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { ViewportTool } from "@/features/viewport/types"
import type { FloorName } from "@/types"

interface StatusBarProps {
  activeTool: ViewportTool
  visibleObjects: number
  hiddenLayers: number
  selectedFloor: FloorName
}

export function StatusBar({
  activeTool,
  visibleObjects,
  hiddenLayers,
  selectedFloor,
}: StatusBarProps) {
  return (
    <footer className="flex h-6 shrink-0 items-center gap-4 border-t border-border bg-panel px-2.5 font-mono text-[9px] text-muted-foreground">
      <StatusItem icon={MousePointer2} label={activeTool} />
      <StatusItem
        icon={Layers3}
        label={selectedFloor}
        testId="status-floor"
      />
      <StatusItem
        icon={Eye}
        label={`${visibleObjects.toLocaleString()} visible`}
        testId="status-visible-objects"
      />
      <StatusItem
        icon={Layers3}
        label={`${hiddenLayers} hidden layers`}
        testId="status-hidden-layers"
      />
      <StatusItem
        icon={Users}
        label="3 online"
        className="max-[640px]:hidden"
      />
      <Separator orientation="vertical" className="ml-auto h-3" />
      <div className="flex items-center gap-1.5">
        <Circle className="size-2 fill-success text-success" />
        Prototype v0.1.0
      </div>
    </footer>
  )
}

function StatusItem({
  icon: Icon,
  label,
  className,
  testId,
}: {
  icon: typeof Eye
  label: string
  className?: string
  testId?: string
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${className ?? ""}`}
      data-testid={testId}
    >
      <Icon className="size-3" />
      <span>{label}</span>
    </div>
  )
}
