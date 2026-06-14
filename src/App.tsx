import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { TopBar } from "@/components/layout/TopBar"
import { DesignSystemPanel } from "@/components/workspace/DesignSystemPanel"
import { DrawingTriagePlaceholder } from "@/features/drawing-triage/DrawingTriagePlaceholder"
import { ModelExplorer } from "@/features/model-explorer/ModelExplorer"
import { ObjectInspector } from "@/features/object-inspector/ObjectInspector"
import { StatusBar } from "@/features/workspace/StatusBar"
import { Viewport } from "@/features/viewport/Viewport"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getProject, projects } from "@/data/projects"
import type { InspectorTab } from "@/features/object-inspector/types"
import type { ViewportTool } from "@/features/viewport/types"
import { cn } from "@/lib/utils"
import type {
  AppView,
  FloorName,
  LayerId,
  LayerState,
  ProjectId,
  ReviewIssue,
  WorkspaceMode,
} from "@/types"

const initialProject = projects[0]
const cloneLayers = (layers: LayerState[]) =>
  layers.map((layer) => ({ ...layer }))
const getDefaultIssue = (project: typeof initialProject) =>
  project.issues.find((issue) => issue.id === project.defaultIssueId) ??
  project.issues[0]

function App() {
  const [view, setView] = useState<AppView>("workspace")
  const [workspaceMode, setWorkspaceMode] =
    useState<WorkspaceMode>("model-review")
  const [darkMode, setDarkMode] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId>(
    initialProject.id,
  )
  const [activeTool, setActiveTool] = useState<ViewportTool>("Orbit")
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [explorerCollapsed, setExplorerCollapsed] = useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)
  const [activeInspectorTab, setActiveInspectorTab] =
    useState<InspectorTab>("properties")
  const [layers, setLayers] = useState<LayerState[]>(
    cloneLayers(initialProject.layers),
  )
  const [selectedFloor, setSelectedFloor] = useState<FloorName>(
    initialProject.defaultFloor,
  )
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue>(
    getDefaultIssue(initialProject),
  )
  const selectedProject = getProject(selectedProjectId)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(() => {
    const largeLayout = window.matchMedia("(min-width: 901px)")
    const closeCompactSheets = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setExplorerOpen(false)
        setInspectorOpen(false)
      }
    }

    largeLayout.addEventListener("change", closeCompactSheets)
    return () => largeLayout.removeEventListener("change", closeCompactSheets)
  }, [])

  const visibleObjects = useMemo(
    () =>
      layers
        .filter((layer) => layer.visible)
        .reduce((sum, layer) => sum + layer.count, 0),
    [layers],
  )
  const visibleLayerIds = useMemo(
    () =>
      layers
        .filter((layer) => layer.visible)
        .map((layer) => layer.id),
    [layers],
  )
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )

  const toggleLayer = (layerId: LayerId) => {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer,
      ),
    )
  }

  const selectIssue = (issue: ReviewIssue) => {
    setSelectedIssue(issue)
    setSelectedFloor(issue.details.level)
  }

  const selectProject = (projectId: ProjectId) => {
    const nextProject = getProject(projectId)
    setSelectedProjectId(nextProject.id)
    setLayers(cloneLayers(nextProject.layers))
    setSelectedFloor(nextProject.defaultFloor)
    setSelectedIssue(getDefaultIssue(nextProject))
  }

  const openAiReview = () => {
    setActiveInspectorTab("ai")
    if (window.matchMedia("(max-width: 900px)").matches) {
      setExplorerOpen(false)
      setInspectorOpen(true)
    } else {
      setInspectorCollapsed(false)
    }
  }

  const openExplorer = () => {
    setInspectorOpen(false)
    setExplorerOpen(true)
  }

  const openInspector = () => {
    setExplorerOpen(false)
    setInspectorOpen(true)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh min-h-[560px] w-full flex-col overflow-hidden bg-background text-foreground">
        <Sheet open={explorerOpen} onOpenChange={setExplorerOpen}>
          <TopBar
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            onProjectChange={selectProject}
            onViewChange={setView}
            onWorkspaceModeChange={setWorkspaceMode}
            projects={projects}
            selectedProject={selectedProject}
            showExplorerTrigger={false}
            unresolvedIssues={selectedProject.issues.length}
            view={view}
            workspaceMode={workspaceMode}
          />
          <SheetContent
            side="left"
            overlayClassName="bg-transparent"
            className="w-[min(86vw,320px)] gap-0 overflow-hidden border-border bg-panel p-0 min-[901px]:hidden sm:max-w-[320px] [&>button]:hidden"
          >
            <div className="absolute right-3 top-3 z-20">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Close Model Explorer"
                  onClick={() => setExplorerOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>
            <SheetHeader className="sr-only">
              <SheetTitle>Model Explorer</SheetTitle>
              <SheetDescription>
                Browse floors, disciplines, saved views, and open issues.
              </SheetDescription>
            </SheetHeader>
            <ModelExplorer
              presentation="sheet"
              floors={selectedProject.floors}
              modelLabel={selectedProject.modelLabel}
              layers={layers}
              issues={selectedProject.issues}
              onFloorSelect={setSelectedFloor}
              onIssueSelect={selectIssue}
              onLayerToggle={toggleLayer}
              savedViews={selectedProject.savedViews}
              selectedFloor={selectedFloor}
              selectedIssue={selectedIssue}
            />
          </SheetContent>
        </Sheet>

        <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
          <SheetContent
            side="right"
            overlayClassName="bg-transparent"
            className="w-[min(90vw,340px)] gap-0 overflow-hidden border-border bg-panel p-0 min-[901px]:hidden sm:max-w-[340px] [&>button]:hidden"
          >
            <div className="absolute right-3 top-3 z-20">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Close Object Inspector"
                  onClick={() => setInspectorOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>
            <SheetHeader className="sr-only">
              <SheetTitle>Object Inspector</SheetTitle>
              <SheetDescription>
                Review object properties, issues, AI suggestions, and history.
              </SheetDescription>
            </SheetHeader>
            <ObjectInspector
              activeTab={activeInspectorTab}
              issues={selectedProject.issues}
              onCollapse={() => setInspectorOpen(false)}
              onTabChange={setActiveInspectorTab}
              onIssueSelect={selectIssue}
              presentation="sheet"
              selectedObjectVisible={selectedObjectVisible}
              selectedIssue={selectedIssue}
            />
          </SheetContent>
        </Sheet>

        {view === "workspace" && workspaceMode === "model-review" ? (
          <main
            id="workspace-content"
            aria-label="Model Review workspace"
            className={cn(
              "grid min-h-0 flex-1 overflow-hidden max-[901px]:grid-cols-1",
              explorerCollapsed && inspectorCollapsed
                ? "grid-cols-1"
                : explorerCollapsed
                  ? "grid-cols-[minmax(0,1fr)_316px] max-[1160px]:grid-cols-[minmax(0,1fr)_280px] max-[901px]:grid-cols-1"
                  : inspectorCollapsed
                    ? "grid-cols-[248px_minmax(0,1fr)] max-[1160px]:grid-cols-[220px_minmax(0,1fr)] max-[901px]:grid-cols-1"
                    : "grid-cols-[248px_minmax(0,1fr)_316px] max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[901px]:grid-cols-1",
            )}
          >
            {!explorerCollapsed && (
              <ModelExplorer
                floors={selectedProject.floors}
                modelLabel={selectedProject.modelLabel}
                layers={layers}
                issues={selectedProject.issues}
                onFloorSelect={setSelectedFloor}
                onIssueSelect={selectIssue}
                onLayerToggle={toggleLayer}
                onCollapse={() => setExplorerCollapsed(true)}
                savedViews={selectedProject.savedViews}
                selectedFloor={selectedFloor}
                selectedIssue={selectedIssue}
              />
            )}
            <Viewport
              activeTool={activeTool}
              floors={selectedProject.floors}
              issueCount={selectedProject.issues.length}
              issues={selectedProject.issues}
              onOpenAiReview={openAiReview}
              onExpandExplorer={() => setExplorerCollapsed(false)}
              onExpandInspector={() => setInspectorCollapsed(false)}
              onOpenExplorer={openExplorer}
              onOpenInspector={openInspector}
              onIssueSelect={selectIssue}
              onToolChange={setActiveTool}
              selectedFloor={selectedFloor}
              selectedIssue={selectedIssue}
              showExplorerExpand={explorerCollapsed}
              showInspectorExpand={inspectorCollapsed}
              visibleLayerIds={visibleLayerIds}
            />
            {!inspectorCollapsed && (
              <ObjectInspector
                activeTab={activeInspectorTab}
                issues={selectedProject.issues}
                onCollapse={() => setInspectorCollapsed(true)}
                onTabChange={setActiveInspectorTab}
                onIssueSelect={selectIssue}
                selectedObjectVisible={selectedObjectVisible}
                selectedIssue={selectedIssue}
              />
            )}
          </main>
        ) : view === "workspace" ? (
          <DrawingTriagePlaceholder />
        ) : (
          <DesignSystemPanel />
        )}

        <StatusBar
          activeTool={activeTool}
          hiddenLayers={layers.filter((layer) => !layer.visible).length}
          selectedFloor={selectedFloor}
          visibleObjects={visibleObjects}
        />
      </div>
    </TooltipProvider>
  )
}

export default App
