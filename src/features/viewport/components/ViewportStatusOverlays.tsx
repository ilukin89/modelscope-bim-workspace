import { Box, type LucideIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { ViewportTool } from "@/features/viewport/types"
import { cn } from "@/lib/utils"

export type ViewportFeedback = {
  message: string
  type: "frame" | "ai"
}

interface ViewportToolStatusProps {
  activeTool: ViewportTool
  className?: string
  Icon: LucideIcon
  label: string
}

export function ViewportToolStatus({
  activeTool,
  className,
  Icon,
  label,
}: ViewportToolStatusProps) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-md border border-border bg-panel/95 px-2.5 py-1.5 text-[10px] font-medium text-foreground shadow-md max-[1160px]:static max-[1160px]:self-center max-[1160px]:translate-x-0 max-[901px]:hidden",
        className,
      )}
      role="status"
      data-testid="viewport-tool-feedback"
      data-active-tool={activeTool}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary" />
        {label}
      </span>
    </div>
  )
}

export function ViewportFeedbackToast({
  feedback,
}: {
  feedback: ViewportFeedback | null
}) {
  if (!feedback) {
    return null
  }

  return (
    <div
      className="absolute right-3 top-[108px] z-30 rounded-md border border-primary/30 bg-panel px-2.5 py-1.5 text-[10px] font-medium text-foreground shadow-md max-[1160px]:static max-[1160px]:self-center"
      role="status"
      aria-live="polite"
      data-testid={`${feedback.type}-viewport-feedback`}
    >
      {feedback.message}
    </div>
  )
}

export function ViewportCameraBadge() {
  return (
    <div className="absolute bottom-3 right-3 z-20 flex max-w-[calc(100%-24px)] items-center gap-2 overflow-hidden rounded-md border border-border bg-panel px-2.5 py-1.5 text-[9px] text-muted-foreground shadow-md max-[900px]:bottom-16 max-[420px]:gap-1.5 max-[420px]:px-2">
      <Box className="size-3" />
      <span className="min-w-0 truncate font-mono">Perspective</span>
      <Separator orientation="vertical" className="h-3" />
      <span className="shrink-0 font-mono">42.0°</span>
    </div>
  )
}
