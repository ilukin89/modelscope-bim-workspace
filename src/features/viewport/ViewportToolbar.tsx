import {
  BoxSelect,
  ChevronDown,
  Hand,
  MessageSquarePlus,
  Orbit,
  Ruler,
} from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ViewportTool } from "@/features/viewport/types"
import { cn } from "@/lib/utils"

interface ViewportToolbarProps {
  activeTool: ViewportTool
  className?: string
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
  className,
  onToolChange,
}: ViewportToolbarProps) {
  const toolbarBoundaryRef = useRef<HTMLDivElement | null>(null)
  const fullToolbarMeasureRef = useRef<HTMLDivElement | null>(null)
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const activeToolConfig =
    tools.find((tool) => tool.label === activeTool) ?? tools[0]
  const ActiveIcon = activeToolConfig.icon
  const remainingTools = tools.filter((tool) => tool.label !== activeTool)

  useLayoutEffect(() => {
    const boundary = toolbarBoundaryRef.current
    const measuredToolbar = fullToolbarMeasureRef.current

    if (!boundary || !measuredToolbar) {
      return
    }

    const updateCompactState = () => {
      const availableWidth = boundary.getBoundingClientRect().width
      const fullToolbarWidth = measuredToolbar.scrollWidth

      setCompact(availableWidth > 0 && fullToolbarWidth + 8 > availableWidth)
    }

    updateCompactState()

    const resizeObserver = new ResizeObserver(updateCompactState)
    resizeObserver.observe(boundary)
    resizeObserver.observe(measuredToolbar)

    return () => resizeObserver.disconnect()
  }, [])

  const selectTool = (tool: ViewportTool) => {
    onToolChange(tool)
    setMenuOpen(false)
  }

  return (
    <div
      ref={toolbarBoundaryRef}
      className={cn("relative w-full min-w-0", className)}
    >
      <div
        ref={fullToolbarMeasureRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 flex w-max -translate-x-1/2 items-center rounded-md border border-transparent p-1 opacity-0"
      >
        {tools.map((tool) => {
          const Icon = tool.icon

          return (
            <span
              key={tool.label}
              className="flex h-9 min-w-10 items-center justify-center gap-1.5 rounded-sm px-2 text-[10px] font-medium"
            >
              <Icon className="size-3.5" strokeWidth={1.8} />
              <span>{tool.label}</span>
            </span>
          )
        })}
      </div>

      {compact ? (
        <div
          className="flex justify-center"
          role="toolbar"
          aria-label="Viewport tools"
        >
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Current viewport tool: ${activeTool}. Change tool`}
                className="mx-auto flex h-9 min-w-[112px] items-center justify-center gap-1.5 rounded-md border border-border bg-panel px-2.5 text-[10px] font-medium text-foreground shadow-lg shadow-background/20 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ActiveIcon
                  className="size-3.5 text-primary"
                  strokeWidth={1.8}
                />
                <span>{activeTool}</span>
                <ChevronDown
                  className={cn(
                    "ml-0.5 size-3.5 text-muted-foreground transition-transform",
                    menuOpen && "rotate-180",
                  )}
                  strokeWidth={1.8}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              side="bottom"
              sideOffset={6}
              className="w-36"
            >
              {remainingTools.map((tool) => {
                const Icon = tool.icon

                return (
                  <DropdownMenuItem
                    key={tool.label}
                    onSelect={() => selectTool(tool.label)}
                  >
                    <Icon className="size-3.5" strokeWidth={1.8} />
                    {tool.label}
                    <DropdownMenuShortcut>{tool.shortcut}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div
          className="mx-auto flex w-max max-w-full items-center overflow-hidden rounded-md border border-border bg-panel p-1 shadow-lg shadow-background/20"
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
                      "flex h-9 min-w-10 items-center justify-center gap-1.5 rounded-sm px-2 text-[10px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring max-[420px]:h-8",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.8} />
                    <span>{tool.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {tool.label} · {tool.shortcut}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}
    </div>
  )
}
