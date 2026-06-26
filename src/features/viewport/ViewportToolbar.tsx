import {
  BoxSelect,
  Hand,
  MessageSquarePlus,
  Orbit,
  Ruler,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ViewportTool } from "@/features/viewport/types"
import { cn } from "@/lib/utils"

interface ViewportToolbarProps {
  activeTool: ViewportTool
  onToolChange: (tool: ViewportTool) => void
}

const tools = [
  { label: "Orbit", icon: Orbit, shortcut: "1" },
  { label: "Pan", icon: Hand, shortcut: "2" },
  { label: "Section", icon: BoxSelect, shortcut: "3" },
  { label: "Measure", icon: Ruler, shortcut: "4" },
  { label: "Comment", icon: MessageSquarePlus, shortcut: "5" },
] satisfies Array<{
  label: ViewportTool
  icon: typeof Orbit
  shortcut: string
}>

export function ViewportToolbar({
  activeTool,
  onToolChange,
}: ViewportToolbarProps) {
  return (
    <div
      className="absolute left-1/2 top-3 z-20 flex max-w-full -translate-x-1/2 items-center overflow-hidden rounded-md border border-border bg-panel p-1 shadow-lg shadow-background/20 max-[1160px]:static max-[1160px]:translate-x-0 max-[900px]:w-full"
      role="toolbar"
      aria-label="Viewport tools"
    >
      {tools.map((tool) => {
        const Icon = tool.icon
        const active = activeTool === tool.label
        return (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToolChange(tool.label)}
                aria-label={`${tool.label} tool`}
                aria-pressed={active}
                className={cn(
                  "flex h-9 min-w-10 items-center justify-center gap-1.5 rounded-sm px-2 text-[10px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring max-[900px]:min-w-0 max-[900px]:flex-1 max-[900px]:px-1 max-[420px]:h-8",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.8} />
                <span className="max-[900px]:hidden">{tool.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {tool.label} · {tool.shortcut}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
