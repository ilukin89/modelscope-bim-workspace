import {
  Bookmark,
  Box,
  ChevronRight,
  CircleDot,
  Eye,
  EyeOff,
  Layers3,
} from "lucide-react"
import { SidePanelGlyph } from "@/components/layout/SidePanelGlyph"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  FloorState,
  FloorName,
  LayerId,
  LayerState,
} from "@/types"
import { cn } from "@/lib/utils"

interface ModelExplorerProps {
  presentation?: "sidebar" | "sheet"
  modelLabel: string
  floors: FloorState[]
  layers: LayerState[]
  onLayerToggle: (id: LayerId) => void
  selectedFloor: FloorName
  onFloorSelect: (floor: FloorName) => void
  onCollapse?: () => void
  savedViews: string[]
}

const layerMarks: Record<LayerId, string> = {
  architecture: "bg-primary",
  structure: "bg-muted-foreground",
  mechanical: "bg-ai",
  electrical: "bg-warning",
}

export function ModelExplorer({
  presentation = "sidebar",
  modelLabel,
  floors,
  layers,
  onLayerToggle,
  selectedFloor,
  onFloorSelect,
  onCollapse,
  savedViews,
}: ModelExplorerProps) {
  const modelObjectCount = layers.reduce((sum, layer) => sum + layer.count, 0)
  const selectedFloorData = floors.find(
    (floor) => floor.label === selectedFloor,
  )
  const currentViewLabel = `Coordination · ${
    selectedFloorData?.viewCode ?? selectedFloor
  }`

  return (
    <aside
      id={presentation === "sidebar" ? "desktop-model-explorer" : undefined}
      className={cn(
        "scrollbar-thin min-h-0 overflow-y-auto bg-panel",
        presentation === "sidebar"
          ? "border-r border-border max-[901px]:hidden"
          : "h-full w-full",
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-10 border-b border-border bg-panel p-2.5",
          presentation === "sheet" && "pr-12",
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Model Explorer
          </span>
          {presentation === "sidebar" && onCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Collapse Model Explorer"
                  aria-controls="desktop-model-explorer"
                  aria-expanded="true"
                  onClick={onCollapse}
                >
                  <SidePanelGlyph direction="collapse" side="left" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Collapse Model Explorer
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] text-muted-foreground">
          <Box className="size-3.5" />
          <span className="truncate" data-testid="model-label">
            {modelLabel}
          </span>
          <span
            className="ml-auto font-mono text-[10px]"
            data-testid="model-object-count"
          >
            {modelObjectCount.toLocaleString()}
          </span>
        </div>
      </div>

      <ExplorerSection
        icon={Layers3}
        title="Floors"
        count={String(floors.length)}
      >
        <div className="space-y-0.5">
          {floors.map((floor) => (
            <button
              type="button"
              key={floor.label}
              data-floor={floor.label}
              onClick={() => onFloorSelect(floor.label)}
              aria-pressed={selectedFloor === floor.label}
              className={cn(
                "flex h-7 w-full items-center gap-2 rounded-sm px-2 text-left text-[11px] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                selectedFloor === floor.label &&
                  "bg-accent text-accent-foreground",
              )}
            >
              <ChevronRight className="size-3 text-muted-foreground" />
              <span className="truncate">{floor.label}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {floor.count}
              </span>
            </button>
          ))}
        </div>
      </ExplorerSection>

      <ExplorerSection icon={Layers3} title="Disciplines" count="4">
        <div className="space-y-0.5">
          {layers.map((layer) => (
            <button
              type="button"
              key={layer.id}
              onClick={() => onLayerToggle(layer.id)}
              aria-pressed={layer.visible}
              className="group flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[11px] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  layer.visible ? layerMarks[layer.id] : "bg-border",
                )}
              />
              <span
                className={cn(
                  "truncate",
                  !layer.visible && "text-muted-foreground line-through",
                )}
              >
                {layer.label}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {layer.count.toLocaleString()}
              </span>
              {layer.visible ? (
                <Eye className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              ) : (
                <EyeOff className="size-3.5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </ExplorerSection>

      <ExplorerSection
        icon={Bookmark}
        title="Saved Views"
        count={String(savedViews.length + 1)}
      >
        {[currentViewLabel, ...savedViews].map(
          (view, index) => (
            <div
              key={view}
              data-saved-view={index === 0 ? "current" : undefined}
              className="flex h-7 w-full items-center gap-2 px-2 text-left text-[11px] text-muted-foreground"
            >
              <CircleDot className="size-3" />
              <span className="truncate">{view}</span>
              {index === 0 && (
                <span className="ml-auto text-[9px] uppercase tracking-wide text-primary">
                  Current
                </span>
              )}
            </div>
          ),
        )}
      </ExplorerSection>
    </aside>
  )
}

interface ExplorerSectionProps {
  icon: typeof Layers3
  title: string
  count: string
  children: React.ReactNode
}

function ExplorerSection({
  icon: Icon,
  title,
  count,
  children,
}: ExplorerSectionProps) {
  return (
    <section className="border-b border-border p-2.5">
      <div className="mb-1.5 flex h-6 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="size-3" />
        <span>{title}</span>
        <span className="ml-auto font-mono font-normal">{count}</span>
      </div>
      {children}
    </section>
  )
}
