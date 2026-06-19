import { useEffect, useMemo, useRef, useState } from "react"
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
  AiFindingGroupingMode,
  AiFindingWorkflowStatus,
  AppView,
  FloorName,
  HighlightKind,
  LayerId,
  LayerState,
  ModelReviewHistoryEvent,
  ModelReviewIssue,
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
const getInitialFindingStatuses = (
  project: typeof initialProject,
): Record<ReviewIssue["id"], AiFindingWorkflowStatus> =>
  Object.fromEntries(
    project.issues.map((issue) => [issue.id, issue.initialAiStatus ?? "active"]),
  )

const getAiFindingGroupKey = (
  finding: ReviewIssue,
  mode: AiFindingGroupingMode,
  statuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>,
) => {
  if (mode === "severity") {
    return finding.severity
  }

  if (mode === "type") {
    return finding.findingType
  }

  return statuses[finding.id] ?? "active"
}

const getSpatialFindingCounts = (findings: ReviewIssue[]) =>
  findings.reduce(
    (counts, finding) => ({
      ...counts,
      [finding.highlight]: counts[finding.highlight] + 1,
    }),
    { duct: 0, door: 0, damper: 0 } satisfies Record<HighlightKind, number>,
  )
type AiScanStatus =
  | "not_scanned"
  | "scanning"
  | "scanned_with_findings"
interface ProjectAiReviewState {
  findingStatuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>
  modelReviewIssues: ModelReviewIssue[]
  previewIssueId: ReviewIssue["id"] | null
  reviewHistory: ModelReviewHistoryEvent[]
  scanStatus: AiScanStatus
  selectedFindingId: ReviewIssue["id"] | null
}
const getInitialProjectAiReviewState = (
  project: typeof initialProject,
): ProjectAiReviewState => ({
  findingStatuses: getInitialFindingStatuses(project),
  modelReviewIssues: [],
  previewIssueId: null,
  reviewHistory: [],
  scanStatus: "not_scanned",
  selectedFindingId: null,
})
const getInitialProjectAiReviewStates = (): Record<
  ProjectId,
  ProjectAiReviewState
> =>
  Object.fromEntries(
    projects.map((project) => [
      project.id,
      getInitialProjectAiReviewState(project),
    ]),
  ) as Record<ProjectId, ProjectAiReviewState>

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
  const [aiFindingGroupingMode, setAiFindingGroupingMode] =
    useState<AiFindingGroupingMode>("severity")
  const [layers, setLayers] = useState<LayerState[]>(
    cloneLayers(initialProject.layers),
  )
  const [selectedFloor, setSelectedFloor] = useState<FloorName>(
    initialProject.defaultFloor,
  )
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue>(
    getDefaultIssue(initialProject),
  )
  const [projectAiReviewStates, setProjectAiReviewStates] = useState<
    Record<ProjectId, ProjectAiReviewState>
  >(getInitialProjectAiReviewStates)
  const [modelFocusRequest, setModelFocusRequest] = useState<{
    issueId: ReviewIssue["id"]
    label: string
    nonce: number
  } | null>(null)
  const aiScanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedProject = getProject(selectedProjectId)
  const selectedAiReviewState =
    projectAiReviewStates[selectedProjectId] ??
    getInitialProjectAiReviewState(selectedProject)
  const aiScanStatus = selectedAiReviewState.scanStatus
  const aiReviewVisualsActive = aiScanStatus === "scanned_with_findings"
  const aiReviewFindings =
    aiReviewVisualsActive ? selectedProject.issues : []
  const aiFindingStatuses = selectedAiReviewState.findingStatuses
  const selectedAiFindingId = aiReviewVisualsActive
    ? selectedAiReviewState.selectedFindingId
    : null
  const selectedAiFinding =
    aiReviewFindings.find((finding) => finding.id === selectedAiFindingId) ??
    null
  const selectedFindingStatus =
    aiReviewVisualsActive && selectedAiFindingId
      ? (aiFindingStatuses[selectedAiFindingId] ?? "active")
      : "active"
  const modelReviewIssues = aiReviewVisualsActive
    ? selectedAiReviewState.modelReviewIssues
    : []
  const focusedModelIssueId = modelFocusRequest
    ? (modelReviewIssues.find(
        (issue) => issue.sourceFindingId === modelFocusRequest.issueId,
      )?.id ?? null)
    : null
  const reviewHistory = aiReviewVisualsActive
    ? selectedAiReviewState.reviewHistory
    : []
  const previewIssueId = aiReviewVisualsActive
    ? selectedAiReviewState.previewIssueId
    : null
  const previewActive =
    aiReviewVisualsActive &&
    Boolean(selectedAiFindingId) &&
    previewIssueId === selectedAiFindingId
  const aiInspectorReviewWide =
    activeInspectorTab === "ai" &&
    aiReviewFindings.length >= 10 &&
    !inspectorCollapsed
  const activeAiFindingGroupKey = selectedAiFinding
    ? getAiFindingGroupKey(
        selectedAiFinding,
        aiFindingGroupingMode,
        aiFindingStatuses,
      )
    : null
  const viewportAiFindingContext = aiReviewVisualsActive
    ? selectedAiFinding && activeAiFindingGroupKey
      ? aiReviewFindings.filter(
          (finding) =>
            getAiFindingGroupKey(
              finding,
              aiFindingGroupingMode,
              aiFindingStatuses,
            ) === activeAiFindingGroupKey,
        )
      : aiReviewFindings
    : []
  const viewportAiFindingCounts = getSpatialFindingCounts(
    viewportAiFindingContext,
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(
    () => () => {
      if (aiScanTimeout.current) {
        clearTimeout(aiScanTimeout.current)
      }
    },
    [],
  )

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

  const updateProjectAiReviewState = (
    projectId: ProjectId,
    updater: (state: ProjectAiReviewState) => ProjectAiReviewState,
  ) => {
    setProjectAiReviewStates((current) => {
      const project = getProject(projectId)
      const previous =
        current[projectId] ?? getInitialProjectAiReviewState(project)

      return {
        ...current,
        [projectId]: updater(previous),
      }
    })
  }

  const updateSelectedProjectAiReviewState = (
    updater: (state: ProjectAiReviewState) => ProjectAiReviewState,
  ) => updateProjectAiReviewState(selectedProjectId, updater)

  const toggleLayer = (layerId: LayerId) => {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer,
      ),
    )
  }

  const recordHistory = (label: string, detail: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      reviewHistory: [
        {
          id: `${Date.now()}-${state.reviewHistory.length}`,
          label,
          detail,
          time,
        },
        ...state.reviewHistory,
      ].slice(0, 8),
    }))
  }

  const selectIssue = (issue: ReviewIssue) => {
    setSelectedIssue(issue)
    setSelectedFloor(issue.details.level)
  }

  const selectAiFinding = (issue: ReviewIssue) => {
    selectIssue(issue)
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      selectedFindingId: issue.id,
    }))
    recordHistory(
      "AI finding selected",
      `${issue.code} · ${issue.details.objectId} on ${issue.details.level}`,
    )
  }

  const togglePreviewChange = () => {
    if (previewActive) {
      updateSelectedProjectAiReviewState((state) => ({
        ...state,
        previewIssueId: null,
      }))
      recordHistory("Preview exited", selectedIssue.code)
      return
    }

    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      previewIssueId: selectedIssue.id,
      selectedFindingId: selectedIssue.id,
    }))
    recordHistory(
      "Preview opened",
      `${selectedIssue.code} · ${selectedIssue.details.objectId}`,
    )
  }

  const createModelReviewIssue = () => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.sourceFindingId === selectedIssue.id,
    )

    if (existingIssue) {
      return
    }

    const issueNumber = selectedAiReviewState.modelReviewIssues.length + 1
    const issueId = `MR-${String(issueNumber).padStart(3, "0")}`
    const nextIssue: ModelReviewIssue = {
      id: issueId,
      title: selectedIssue.title,
      relatedObject: selectedIssue.object,
      relatedLevel: selectedIssue.details.level,
      priority: selectedIssue.severity,
      status: "Open",
      sourceFindingId: selectedIssue.id,
      sourceFindingCode: selectedIssue.code,
      sourceIssue: selectedIssue,
    }

    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      findingStatuses: {
        ...state.findingStatuses,
        [selectedIssue.id]: "issue-created",
      },
      modelReviewIssues: [...state.modelReviewIssues, nextIssue],
    }))
    recordHistory(
      "Issue created",
      `${issueId} from ${selectedIssue.code} · ${selectedIssue.details.objectId}`,
    )
  }

  const viewCreatedIssueDetails = () => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.sourceFindingId === selectedIssue.id,
    )

    if (!existingIssue) {
      return
    }

    setActiveInspectorTab("issues")
    recordHistory(
      "Issue details opened",
      `${existingIssue.id} from ${selectedIssue.code}`,
    )
  }

  const dropModelReviewIssue = () => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.sourceFindingId === selectedIssue.id,
    )

    if (!existingIssue) {
      return
    }

    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      findingStatuses: {
        ...state.findingStatuses,
        [selectedIssue.id]: "active",
      },
      modelReviewIssues: state.modelReviewIssues.filter(
        (issue) => issue.id !== existingIssue.id,
      ),
    }))
    setActiveInspectorTab("ai")
    recordHistory(
      "Issue dropped",
      `${existingIssue.id} removed from ${selectedIssue.code}`,
    )
  }

  const dismissAiFinding = () => {
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      findingStatuses: {
        ...state.findingStatuses,
        [selectedIssue.id]: "dismissed",
      },
      previewIssueId:
        state.previewIssueId === selectedIssue.id ? null : state.previewIssueId,
    }))
    recordHistory(
      "Finding dismissed",
      `${selectedIssue.code} · ${selectedIssue.details.objectId}`,
    )
  }

  const restoreAiFinding = () => {
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      findingStatuses: {
        ...state.findingStatuses,
        [selectedIssue.id]: "active",
      },
    }))
    recordHistory(
      "Finding restored",
      `${selectedIssue.code} · ${selectedIssue.details.objectId}`,
    )
  }

  const viewModelReviewIssue = (issue: ModelReviewIssue) => {
    selectIssue(issue.sourceIssue)
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      previewIssueId: null,
    }))
    setModelFocusRequest({
      issueId: issue.sourceFindingId,
      label: issue.id,
      nonce: Date.now(),
    })
    if (window.matchMedia("(max-width: 900px)").matches) {
      setInspectorOpen(false)
    }
    recordHistory(
      "Issue viewed in model",
      `${issue.id} returned to ${issue.sourceFindingCode}`,
    )
  }

  const hideModelReviewIssue = (issue: ModelReviewIssue) => {
    setModelFocusRequest((current) =>
      current?.issueId === issue.sourceFindingId ? null : current,
    )
    recordHistory(
      "Issue hidden from model",
      `${issue.id} hidden from ${issue.sourceFindingCode}`,
    )
  }

  const clearAiScanResults = () => {
    if (aiScanTimeout.current) {
      clearTimeout(aiScanTimeout.current)
      aiScanTimeout.current = null
    }

    updateSelectedProjectAiReviewState(() =>
      getInitialProjectAiReviewState(selectedProject),
    )
    setModelFocusRequest(null)
    setActiveInspectorTab("ai")
  }

  const selectProject = (projectId: ProjectId) => {
    const nextProject = getProject(projectId)
    if (aiScanTimeout.current) {
      clearTimeout(aiScanTimeout.current)
      aiScanTimeout.current = null
      updateSelectedProjectAiReviewState((state) =>
        state.scanStatus === "scanning"
          ? { ...state, scanStatus: "not_scanned" }
          : state,
      )
    }
    setSelectedProjectId(nextProject.id)
    setLayers(cloneLayers(nextProject.layers))
    setSelectedFloor(nextProject.defaultFloor)
    setSelectedIssue(getDefaultIssue(nextProject))
    setModelFocusRequest(null)
  }

  const viewAiFindingInModel = () => {
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      selectedFindingId: selectedIssue.id,
    }))
    setModelFocusRequest({
      issueId: selectedIssue.id,
      label: selectedIssue.code,
      nonce: Date.now(),
    })
    if (window.matchMedia("(max-width: 900px)").matches) {
      setInspectorOpen(false)
    }
    recordHistory(
      "Finding viewed in model",
      `${selectedIssue.code} · ${selectedIssue.details.objectId}`,
    )
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

  const openInspector = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setExplorerOpen(false)
      setInspectorOpen(true)
    } else {
      setInspectorCollapsed(false)
    }
  }

  const scanWithAi = () => {
    if (aiScanStatus === "scanning") {
      openAiReview()
      return
    }

    if (aiScanTimeout.current) {
      clearTimeout(aiScanTimeout.current)
    }

    openAiReview()
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      previewIssueId: null,
      scanStatus: "scanning",
    }))

    aiScanTimeout.current = setTimeout(() => {
      updateProjectAiReviewState(selectedProject.id, (state) => {
        const nextFindingStatuses = getInitialFindingStatuses(selectedProject)
        state.modelReviewIssues.forEach((issue) => {
          nextFindingStatuses[issue.sourceFindingId] = "issue-created"
        })

        return {
          ...state,
          findingStatuses: nextFindingStatuses,
          previewIssueId: null,
          scanStatus: "scanned_with_findings",
          selectedFindingId: null,
        }
      })
      openAiReview()
      recordHistory(
        "AI scan completed",
        `${selectedProject.issues.length} coordination findings available`,
      )
      aiScanTimeout.current = null
    }, 1250)
  }

  const openExplorer = () => {
    setInspectorOpen(false)
    setExplorerOpen(true)
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
              onFloorSelect={setSelectedFloor}
              onLayerToggle={toggleLayer}
              savedViews={selectedProject.savedViews}
              selectedFloor={selectedFloor}
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
              aiFindingStatuses={aiFindingStatuses}
              aiFindings={aiReviewFindings}
              aiGroupingMode={aiFindingGroupingMode}
              aiFindingStatus={selectedFindingStatus}
              aiScanStatus={aiScanStatus}
              focusedModelIssueId={focusedModelIssueId}
              issueCount={modelReviewIssues.length}
              modelReviewIssues={modelReviewIssues}
              onCreateIssue={createModelReviewIssue}
              onClearScanResults={clearAiScanResults}
              onCollapse={() => setInspectorOpen(false)}
              onDismissFinding={dismissAiFinding}
              onDropIssue={dropModelReviewIssue}
              onFindingSelect={selectAiFinding}
              onGroupingModeChange={setAiFindingGroupingMode}
              onHideIssueFromModel={hideModelReviewIssue}
              onPreviewChange={togglePreviewChange}
              onRescanAi={scanWithAi}
              onRestoreFinding={restoreAiFinding}
              onTabChange={setActiveInspectorTab}
              onViewFindingInModel={viewAiFindingInModel}
              onViewCreatedIssueDetails={viewCreatedIssueDetails}
              onViewIssueInModel={viewModelReviewIssue}
              previewActive={previewActive}
              presentation="sheet"
              reviewHistory={reviewHistory}
              selectedFindingId={selectedAiFindingId}
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
                  ? aiInspectorReviewWide
                    ? "grid-cols-[minmax(0,1fr)_640px] max-[1420px]:grid-cols-[minmax(0,1fr)_460px] max-[1160px]:grid-cols-[minmax(0,1fr)_340px] max-[901px]:grid-cols-1"
                    : "grid-cols-[minmax(0,1fr)_316px] max-[1160px]:grid-cols-[minmax(0,1fr)_280px] max-[901px]:grid-cols-1"
                  : inspectorCollapsed
                    ? "grid-cols-[248px_minmax(0,1fr)] max-[1160px]:grid-cols-[220px_minmax(0,1fr)] max-[901px]:grid-cols-1"
                    : aiInspectorReviewWide
                      ? "grid-cols-[248px_minmax(0,1fr)_640px] max-[1420px]:grid-cols-[220px_minmax(0,1fr)_460px] max-[1160px]:grid-cols-[220px_minmax(0,1fr)_340px] max-[901px]:grid-cols-1"
                      : "grid-cols-[248px_minmax(0,1fr)_316px] max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[901px]:grid-cols-1",
            )}
          >
            {!explorerCollapsed && (
              <ModelExplorer
                floors={selectedProject.floors}
                modelLabel={selectedProject.modelLabel}
                layers={layers}
                onFloorSelect={setSelectedFloor}
                onLayerToggle={toggleLayer}
                onCollapse={() => setExplorerCollapsed(true)}
                savedViews={selectedProject.savedViews}
                selectedFloor={selectedFloor}
              />
            )}
            <Viewport
              activeTool={activeTool}
              aiReviewEntryState={aiScanStatus}
              aiReviewFindingCount={aiReviewFindings.length}
              aiReviewFindingSpatialCounts={viewportAiFindingCounts}
              aiReviewVisualsActive={aiReviewVisualsActive}
              compactInspectorOpen={inspectorOpen}
              floors={selectedProject.floors}
              modelFocusRequest={modelFocusRequest}
              onExpandExplorer={() => setExplorerCollapsed(false)}
              onOpenAiReview={openAiReview}
              onOpenExplorer={openExplorer}
              onOpenInspector={openInspector}
              onScanWithAi={scanWithAi}
              onToolChange={setActiveTool}
              previewActive={previewActive}
              selectedAiFindingActive={Boolean(selectedAiFinding)}
              selectedFloor={selectedFloor}
              selectedIssue={selectedIssue}
              showExplorerExpand={explorerCollapsed}
              showInspectorExpand={inspectorCollapsed}
              visibleLayerIds={visibleLayerIds}
            />
            {!inspectorCollapsed && (
              <ObjectInspector
                activeTab={activeInspectorTab}
                aiFindingStatuses={aiFindingStatuses}
                aiFindings={aiReviewFindings}
                aiGroupingMode={aiFindingGroupingMode}
                aiFindingStatus={selectedFindingStatus}
                aiScanStatus={aiScanStatus}
                focusedModelIssueId={focusedModelIssueId}
                issueCount={modelReviewIssues.length}
                modelReviewIssues={modelReviewIssues}
                onCreateIssue={createModelReviewIssue}
                onClearScanResults={clearAiScanResults}
                onCollapse={() => setInspectorCollapsed(true)}
                onDismissFinding={dismissAiFinding}
                onDropIssue={dropModelReviewIssue}
                onFindingSelect={selectAiFinding}
                onGroupingModeChange={setAiFindingGroupingMode}
                onHideIssueFromModel={hideModelReviewIssue}
                onPreviewChange={togglePreviewChange}
                onRescanAi={scanWithAi}
                onRestoreFinding={restoreAiFinding}
                onTabChange={setActiveInspectorTab}
                onViewFindingInModel={viewAiFindingInModel}
                onViewCreatedIssueDetails={viewCreatedIssueDetails}
                onViewIssueInModel={viewModelReviewIssue}
                previewActive={previewActive}
                reviewHistory={reviewHistory}
                selectedFindingId={selectedAiFindingId}
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
