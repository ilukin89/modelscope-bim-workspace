import {
  Box,
  Check,
  ChevronDown,
  Cloud,
  Moon,
  PanelLeft,
  Sun,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AppView, ProjectData, ProjectId } from "@/types"
import type { WorkspaceMode } from "@/types"
import { cn } from "@/lib/utils"

const workspaceModes: Array<{ id: WorkspaceMode; label: string }> = [
  { id: "model-review", label: "Model Review" },
  { id: "drawing-triage", label: "Drawing Triage" },
]

interface TopBarProps {
  view: AppView
  onViewChange: (view: AppView) => void
  workspaceMode: WorkspaceMode
  onWorkspaceModeChange: (mode: WorkspaceMode) => void
  projects: ProjectData[]
  selectedProject: ProjectData
  onProjectChange: (projectId: ProjectId) => void
  unresolvedIssues: number
  darkMode: boolean
  onDarkModeChange: (enabled: boolean) => void
  showExplorerTrigger: boolean
}

export function TopBar({
  view,
  onViewChange,
  workspaceMode,
  onWorkspaceModeChange,
  projects,
  selectedProject,
  onProjectChange,
  unresolvedIssues,
  darkMode,
  onDarkModeChange,
  showExplorerTrigger,
}: TopBarProps) {
  const activeWorkspaceMode =
    workspaceModes.find((mode) => mode.id === workspaceMode) ??
    workspaceModes[0]

  return (
    <header className="z-30 grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-border bg-panel px-2.5 max-[680px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[380px]:px-1.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Box className="size-4" strokeWidth={2.2} />
          </div>
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-sm font-semibold tracking-tight max-[520px]:hidden">
              ModelScope
            </span>
            <Separator
              orientation="vertical"
              className="h-4 shrink-0 max-[680px]:hidden"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-testid="project-trigger"
                  className="flex min-w-0 items-center gap-1 overflow-hidden text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring max-[680px]:hidden"
                >
                  <span className="truncate">{selectedProject.name}</span>
                  <ChevronDown className="size-3 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  Recent projects
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    className="text-xs"
                    data-project={project.id}
                    onSelect={() => onProjectChange(project.id)}
                  >
                    {project.name}
                    {selectedProject.id === project.id && (
                      <Check
                        className="ml-auto size-3.5"
                        data-selected-project-check={project.id}
                      />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="ml-1 flex shrink-0 items-center gap-2 max-[1199px]:hidden">
          <Badge
            variant="success"
            className="!border-0 normal-case tracking-normal dark:!border dark:!border-success/25"
          >
            <Cloud className="size-3" />
            Synced
            <Check className="size-2.5" />
          </Badge>
          <Badge
            variant="warning"
            className="!border-0 normal-case tracking-normal dark:!border dark:!border-warning/25"
          >
            <TriangleAlert className="size-3" />
            {unresolvedIssues} unresolved
          </Badge>
        </div>
      </div>

      {view === "workspace" ? (
        <>
          <nav
            className="hidden h-full items-center min-[901px]:flex"
            aria-label="Workspace mode"
            role="tablist"
          >
            {workspaceModes.map((mode) => {
              const active = mode.id === workspaceMode

              return (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="workspace-content"
                  onClick={() => onWorkspaceModeChange(mode.id)}
                  className={cn(
                    "relative flex h-full items-center px-3 text-[11px] font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    active
                      ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {mode.label}
                </button>
              )
            })}
          </nav>

          <div className="flex min-w-0 justify-center min-[901px]:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Workspace mode: ${activeWorkspaceMode.label}`}
                  className="flex h-8 min-w-0 max-w-[132px] items-center gap-1.5 px-2 text-[11px] font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring max-[420px]:max-w-[112px] max-[360px]:max-w-[96px] max-[360px]:px-1.5"
                >
                  <span className="truncate">{activeWorkspaceMode.label}</span>
                  <ChevronDown className="size-3 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-44">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  Workspace mode
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaceModes.map((mode) => {
                  const active = mode.id === workspaceMode

                  return (
                    <DropdownMenuItem
                      key={mode.id}
                      aria-current={active ? "page" : undefined}
                      className="text-xs"
                      onSelect={() => onWorkspaceModeChange(mode.id)}
                    >
                      {mode.label}
                      {active && <Check className="ml-auto size-3.5" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <div aria-hidden="true" />
      )}

      <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 max-[380px]:gap-0.5">
        {showExplorerTrigger && (
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="min-[941px]:hidden"
              aria-label="Open Model Explorer"
            >
              <PanelLeft />
            </Button>
          </SheetTrigger>
        )}
        <div
          className="flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border border-border bg-background p-0.5 max-[380px]:h-7"
          role="group"
          aria-label="Application view"
        >
          <button
            type="button"
            onClick={() => onViewChange("workspace")}
            className={cn(
              "h-6 whitespace-nowrap rounded-sm px-2.5 text-[11px] font-medium transition-colors max-[380px]:h-5 max-[380px]:px-2 max-[380px]:text-[10px]",
              view === "workspace"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="max-[520px]:hidden">Workspace</span>
            <span className="hidden max-[520px]:inline">Work</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange("design-system")}
            className={cn(
              "h-6 whitespace-nowrap rounded-sm px-2.5 text-[11px] font-medium transition-colors max-[380px]:h-5 max-[380px]:px-2 max-[380px]:text-[10px]",
              view === "design-system"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Design
          </button>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="max-[380px]:size-7"
              aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
              onClick={() => onDarkModeChange(!darkMode)}
            >
              {darkMode ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {darkMode ? "Use light theme" : "Use dark theme"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
