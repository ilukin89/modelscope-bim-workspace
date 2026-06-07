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
import { cn } from "@/lib/utils"

interface TopBarProps {
  view: AppView
  onViewChange: (view: AppView) => void
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
  projects,
  selectedProject,
  onProjectChange,
  unresolvedIssues,
  darkMode,
  onDarkModeChange,
  showExplorerTrigger,
}: TopBarProps) {
  return (
    <header className="z-30 flex h-12 shrink-0 items-center border-b border-border bg-panel px-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Box className="size-4" strokeWidth={2.2} />
        </div>
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight">
            ModelScope
          </span>
          <Separator
            orientation="vertical"
            className="h-4 max-[680px]:hidden"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="project-trigger"
                className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring max-[680px]:hidden"
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

      <div className="ml-4 flex items-center gap-2 max-[860px]:hidden">
        <Badge variant="success" className="normal-case tracking-normal">
          <Cloud className="size-3" />
          Synced
          <Check className="size-2.5" />
        </Badge>
        <Badge variant="warning" className="normal-case tracking-normal">
          <TriangleAlert className="size-3" />
          {unresolvedIssues} unresolved
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {showExplorerTrigger && (
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="min-[681px]:hidden"
              aria-label="Open Model Explorer"
            >
              <PanelLeft />
            </Button>
          </SheetTrigger>
        )}
        <div
          className="flex h-8 items-center rounded-md border border-border bg-background p-0.5"
          role="group"
          aria-label="Application view"
        >
          <button
            type="button"
            onClick={() => onViewChange("workspace")}
            className={cn(
              "h-6 rounded-sm px-2.5 text-[11px] font-medium transition-colors",
              view === "workspace"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => onViewChange("design-system")}
            className={cn(
              "h-6 rounded-sm px-2.5 text-[11px] font-medium transition-colors max-[520px]:hidden",
              view === "design-system"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Design System
          </button>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
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
