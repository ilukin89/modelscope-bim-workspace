import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { MapPin, ScanSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  candidates,
  cloneInitialReviewStates,
  formatIssueId,
} from "./data/drawingTriageData"
import { DrawingTriageEntryGate } from "./components/DrawingTriageEntryGate"
import { DrawingTriageCandidatePanel } from "./components/DrawingTriageCandidatePanel"
import { DrawingTriageContextPanel } from "./components/DrawingTriageContextPanel"
import { DrawingTriageDialogs } from "./components/DrawingTriageDialogs"
import {
  DrawingTriageProjectEmptyState,
  DrawingTriageSheetEmptyState,
  type DrawingTriageSheetSummary,
} from "./components/DrawingTriageEmptyState"
import {
  readTriageSessionSnapshot,
  writeTriageSessionSnapshot,
} from "./lib/triageSession"
import type {
  Candidate,
  CandidateId,
  CandidateType,
  CreatedIssueSummary,
  DrawingSheetId,
  DrawingSource,
  PendingPanelFocus,
  ReviewCandidateFilter,
  ReviewDecision,
  RightPanelView,
  TriageSessionSnapshot,
  TriageStage,
} from "./types"
import type { ProjectData, ProjectId } from "@/types"
import { DrawingTriageSamplePlan } from "./components/DrawingTriageSamplePlan"

const supportedDrawingProjectId = "residential-tower-a" satisfies ProjectId

const drawingSheets: DrawingTriageSheetSummary[] = [
  {
    id: "level-02",
    name: "Level 02 floor plan",
    shortName: "Level 02",
    code: "A-102",
    marker: "02",
    status: "completed",
  },
  {
    id: "level-01",
    name: "Level 01 floor plan",
    shortName: "Level 01",
    code: "A-101",
    marker: "01",
    status: "not-scanned",
  },
  {
    id: "roof",
    name: "Roof plan",
    shortName: "Roof",
    code: "A-301",
    marker: "R",
    status: "not-scanned",
  },
]

const completedSampleSheetId: DrawingSheetId = "level-02"

const candidateFilterTypes: Record<
  Exclude<ReviewCandidateFilter, "all" | "follow_up">,
  CandidateType
> = {
  clearance: "Clearance",
  annotation: "Annotation",
  coordination: "Coordination",
}

type DrawingTriageProps = {
  selectedProject: ProjectData
  onProjectChange: (projectId: ProjectId) => void
}

export function DrawingTriage({
  selectedProject,
  onProjectChange,
}: DrawingTriageProps) {
  const selectedProjectId = selectedProject.id
  const isSupportedProject = selectedProjectId === supportedDrawingProjectId
  const initialSessionRef = useRef<TriageSessionSnapshot | null | undefined>(
    undefined,
  )
  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = readTriageSessionSnapshot()
  }
  const initialSession = initialSessionRef.current
  const [triageStage, setTriageStage] = useState<TriageStage>(
    initialSession?.triageStage ?? "empty",
  )
  const [drawingSource, setDrawingSource] = useState<DrawingSource | null>(
    initialSession?.drawingSource ?? null,
  )
  const [activeSheetId, setActiveSheetId] = useState<DrawingSheetId>(
    initialSession?.activeSheetId ?? completedSampleSheetId,
  )
  const [selectedCandidateId, setSelectedCandidateId] =
    useState<CandidateId>(
      initialSession?.selectedCandidateId ?? "door-clearance",
    )
  const [reviewStates, setReviewStates] = useState(
    initialSession?.reviewStates ?? cloneInitialReviewStates(),
  )
  const [activeRightPanelView, setActiveRightPanelView] =
    useState<RightPanelView>(
      initialSession?.activeRightPanelView ?? "review_candidates",
    )
  const [reviewCandidateFilter, setReviewCandidateFilter] =
    useState<ReviewCandidateFilter>(
      initialSession?.reviewCandidateFilter ?? "all",
    )
  const [createdIssues, setCreatedIssues] = useState<CreatedIssueSummary[]>(
    initialSession?.createdIssues ?? [],
  )
  const [pendingPanelFocus, setPendingPanelFocus] =
    useState<PendingPanelFocus | null>(null)
  const [changeDrawingDialogOpen, setChangeDrawingDialogOpen] = useState(false)
  const [removeDrawingDialogOpen, setRemoveDrawingDialogOpen] = useState(false)
  const [issuePendingRemoval, setIssuePendingRemoval] =
    useState<CandidateId | null>(null)
  const nextIssueSequence = useRef(initialSession?.nextIssueSequence ?? 1)
  const candidateCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const issueCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const previousProjectId = useRef<ProjectId>(selectedProjectId)
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0]
  const selectedReviewState = reviewStates[selectedCandidate.id]
  const remainingReviewCount = candidates.filter(
    (candidate) => reviewStates[candidate.id].decision === "unreviewed",
  ).length
  const createdIssueSummaries = useMemo(
    () =>
      createdIssues
        .map((issue) => ({
          issue,
          candidate: candidates.find(
            (candidate) => candidate.id === issue.candidateId,
          ),
        }))
        .filter(
          (
            summary,
          ): summary is {
            issue: CreatedIssueSummary
            candidate: Candidate
          } =>
            Boolean(summary.candidate) &&
            reviewStates[summary.issue.candidateId].decision ===
              "issue_created",
        ),
    [createdIssues, reviewStates],
  )
  const followUpCandidates = candidates.filter(
    (candidate) =>
      reviewStates[candidate.id].decision === "unreviewed" &&
      reviewStates[candidate.id].isFollowUp,
  )
  const followUpCount = followUpCandidates.length
  const visibleReviewCandidates = getReviewCandidates(reviewCandidateFilter)
  const activeDrawingSource = drawingSource ?? "Sample drawing"
  const activeDrawingFileName =
    activeDrawingSource === "Mock file"
      ? "mock-a102-level-02.pdf"
      : "MS_A102_review.pdf"
  const activeSheet =
    drawingSheets.find((sheet) => sheet.id === activeSheetId) ??
    drawingSheets[0]
  const isCompletedSampleSheet = activeSheetId === completedSampleSheetId
  const sampleReviewAvailable =
    isSupportedProject && isCompletedSampleSheet && triageStage === "review"

  function candidateHasCreatedIssue(candidateId: CandidateId) {
    return (
      reviewStates[candidateId].decision === "issue_created" &&
      createdIssues.some((issue) => issue.candidateId === candidateId)
    )
  }

  function getReviewCandidates(filter: ReviewCandidateFilter) {
    if (filter === "all") return candidates
    if (filter === "follow_up") return followUpCandidates

    return candidates.filter(
      (candidate) => candidate.type === candidateFilterTypes[filter],
    )
  }

  function setReviewFilter(filter: ReviewCandidateFilter) {
    const filteredCandidates = getReviewCandidates(filter)

    if (
      filteredCandidates.length > 0 &&
      !filteredCandidates.some(
        (candidate) => candidate.id === selectedCandidateId,
      )
    ) {
      setSelectedCandidateId(filteredCandidates[0].id)
    }

    setReviewCandidateFilter(filter)
  }

  function scrollPanelItemIntoView(
    refs: RefObject<Partial<Record<CandidateId, HTMLElement | null>>>,
    candidateId: CandidateId,
  ) {
    const element = refs.current[candidateId]
    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
    element?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!pendingPanelFocus || pendingPanelFocus.view !== activeRightPanelView) {
      return
    }

    const refs =
      pendingPanelFocus.view === "created_issues"
        ? issueCardRefs
        : candidateCardRefs

    window.requestAnimationFrame(() => {
      scrollPanelItemIntoView(refs, pendingPanelFocus.candidateId)
      setPendingPanelFocus((current) =>
        current?.candidateId === pendingPanelFocus.candidateId &&
        current.view === pendingPanelFocus.view
          ? null
          : current,
      )
    })
  }, [
    activeRightPanelView,
    createdIssueSummaries.length,
    pendingPanelFocus,
    selectedCandidateId,
  ])

  useEffect(() => {
    if (triageStage !== "scanning") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTriageStage("review")
    }, 850)

    return () => window.clearTimeout(timeoutId)
  }, [triageStage])

  useEffect(() => {
    const previous = previousProjectId.current
    previousProjectId.current = selectedProjectId

    if (
      selectedProjectId === supportedDrawingProjectId &&
      previous !== supportedDrawingProjectId
    ) {
      setActiveSheetId(completedSampleSheetId)
      setDrawingSource((current) => current ?? "Sample drawing")
      setTriageStage("review")
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (!isSupportedProject) {
      return
    }

    writeTriageSessionSnapshot({
      triageStage,
      drawingSource,
      activeSheetId,
      selectedCandidateId,
      reviewStates,
      activeRightPanelView,
      reviewCandidateFilter,
      createdIssues,
      nextIssueSequence: nextIssueSequence.current,
    })
  }, [
    activeRightPanelView,
    activeSheetId,
    createdIssues,
    drawingSource,
    isSupportedProject,
    reviewCandidateFilter,
    reviewStates,
    selectedCandidateId,
    triageStage,
  ])

  function updateReviewDecision(
    candidateId: CandidateId,
    decision: ReviewDecision,
  ) {
    setSelectedCandidateId(candidateId)
    setReviewStates((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        decision,
        isFollowUp:
          decision === "issue_created" ? false : current[candidateId].isFollowUp,
      },
    }))
  }

  function convertCandidateToIssue(candidateId: CandidateId) {
    const issueId = formatIssueId(nextIssueSequence.current)
    nextIssueSequence.current += 1

    updateReviewDecision(candidateId, "issue_created")
    setCreatedIssues((current) => {
      if (current.some((issue) => issue.candidateId === candidateId)) {
        return current
      }

      return [...current, { issueId, candidateId }]
    })
  }

  function removeCandidateIssue(candidateId: CandidateId) {
    updateReviewDecision(candidateId, "unreviewed")
    setCreatedIssues((current) =>
      current.filter((issue) => issue.candidateId !== candidateId),
    )
    setActiveRightPanelView("review_candidates")
    setPendingPanelFocus({ candidateId, view: "review_candidates" })
  }

  function toggleFollowUp(candidateId: CandidateId) {
    setSelectedCandidateId(candidateId)
    setReviewStates((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        isFollowUp: !current[candidateId].isFollowUp,
      },
    }))
  }

  function selectCandidateFromDrawing(candidateId: CandidateId) {
    const targetView =
      activeRightPanelView === "created_issues" &&
      candidateHasCreatedIssue(candidateId)
        ? "created_issues"
        : "review_candidates"

    if (
      targetView === "review_candidates" &&
      !getReviewCandidates(reviewCandidateFilter).some(
        (candidate) => candidate.id === candidateId,
      )
    ) {
      setReviewFilter("all")
    }

    setSelectedCandidateId(candidateId)
    setActiveRightPanelView(targetView)
    setPendingPanelFocus({ candidateId, view: targetView })
  }

  function showReviewCandidates() {
    if (
      !getReviewCandidates(reviewCandidateFilter).some(
        (candidate) => candidate.id === selectedCandidateId,
      )
    ) {
      setReviewFilter("all")
    }

    setActiveRightPanelView("review_candidates")
    setPendingPanelFocus({
      candidateId: selectedCandidateId,
      view: "review_candidates",
    })
  }

  function showCreatedIssues() {
    const selectedIssueCandidateId = candidateHasCreatedIssue(selectedCandidateId)
      ? selectedCandidateId
      : createdIssueSummaries[0]?.issue.candidateId

    if (selectedIssueCandidateId) {
      setSelectedCandidateId(selectedIssueCandidateId)
      setPendingPanelFocus({
        candidateId: selectedIssueCandidateId,
        view: "created_issues",
      })
    }

    setActiveRightPanelView("created_issues")
  }

  function viewIssueOnSheet(candidateId: CandidateId) {
    setSelectedCandidateId(candidateId)
    setActiveRightPanelView("created_issues")
    setPendingPanelFocus({ candidateId, view: "created_issues" })
  }

  function viewCreatedIssue(candidateId: CandidateId) {
    setSelectedCandidateId(candidateId)
    setActiveRightPanelView("created_issues")
    setPendingPanelFocus({ candidateId, view: "created_issues" })
  }

  function getDecisionLabel(decision: ReviewDecision) {
    if (decision === "issue_created") return "Issue created"
    return "Needs review"
  }

  function resetReviewState() {
    setSelectedCandidateId("door-clearance")
    setReviewStates(cloneInitialReviewStates())
    setActiveRightPanelView("review_candidates")
    setReviewCandidateFilter("all")
    setCreatedIssues([])
    setPendingPanelFocus(null)
    candidateCardRefs.current = {}
    issueCardRefs.current = {}
    nextIssueSequence.current = 1
  }

  function selectDrawingSource(source: DrawingSource) {
    resetReviewState()
    setActiveSheetId(completedSampleSheetId)
    setDrawingSource(source)
    setTriageStage("selected")
  }

  function changeDrawing() {
    resetReviewState()
    setActiveSheetId(completedSampleSheetId)
    setDrawingSource(null)
    setTriageStage("empty")
  }

  function requestChangeDrawing() {
    setChangeDrawingDialogOpen(true)
  }

  function removeDrawing() {
    resetReviewState()
    setActiveSheetId(completedSampleSheetId)
    setDrawingSource(null)
    setTriageStage("empty")
  }

  function runTriage() {
    setTriageStage("scanning")
  }

  function openLevel02Sample() {
    setActiveSheetId(completedSampleSheetId)
    setDrawingSource("Sample drawing")
    setTriageStage("review")
  }

  function openResidentialTowerSample() {
    if (selectedProjectId !== supportedDrawingProjectId) {
      onProjectChange(supportedDrawingProjectId)
    }

    openLevel02Sample()
  }

  function selectSheet(sheetId: DrawingSheetId) {
    setActiveSheetId(sheetId)

    if (sheetId === completedSampleSheetId) {
      setDrawingSource((current) => current ?? "Sample drawing")
      setTriageStage("review")
      return
    }

    setActiveRightPanelView("review_candidates")
    setReviewCandidateFilter("all")
    setPendingPanelFocus(null)
    setTriageStage("review")
  }

  if (!isSupportedProject) {
    return (
      <DrawingTriageProjectEmptyState
        projectName={selectedProject.name}
        onOpenResidentialTowerSample={openResidentialTowerSample}
      />
    )
  }

  if (triageStage !== "review") {
    return (
      <DrawingTriageEntryGate
        stage={triageStage}
        drawingSource={drawingSource}
        onUseSampleDrawing={selectDrawingSource}
        onSelectMockFile={selectDrawingSource}
        onRunTriage={runTriage}
        onChangeDrawing={requestChangeDrawing}
      />
    )
  }

  if (!sampleReviewAvailable) {
    return (
      <DrawingTriageSheetEmptyState
        activeDrawingSource={activeDrawingSource}
        activeSheet={activeSheet}
        activeSheetId={activeSheetId}
        drawingSheets={drawingSheets}
        remainingReviewCount={remainingReviewCount}
        onOpenLevel02Sample={openLevel02Sample}
        onSelectSheet={selectSheet}
      />
    )
  }

  return (
    <>
      <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto max-[900px]:overflow-x-hidden"
    >
      <aside className="scrollbar-thin order-3 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:hidden min-[901px]:order-1 min-[901px]:border-r">
        <DrawingTriageContextPanel
          activeDrawingFileName={activeDrawingFileName}
          activeDrawingSource={activeDrawingSource}
          activeSheet={activeSheet}
          activeSheetId={activeSheetId}
          completedSampleSheetId={completedSampleSheetId}
          contextId="desktop-context"
          drawingSheets={drawingSheets}
          remainingReviewCount={remainingReviewCount}
          onRequestChangeDrawing={requestChangeDrawing}
          onRequestRemoveDrawing={() => setRemoveDrawingDialogOpen(true)}
          onSelectSheet={selectSheet}
        />
      </aside>

      <section className="order-1 flex min-h-[440px] min-w-0 flex-col bg-canvas max-[900px]:min-h-[360px] max-[560px]:min-h-[300px] min-[901px]:order-2">
        <header className="flex min-h-12 items-center gap-3 border-b border-border bg-panel/90 px-4 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ScanSearch className="size-4 shrink-0 text-primary" />
              <h1
                id="drawing-triage-heading"
                className="truncate text-sm font-semibold tracking-tight"
              >
                Drawing Triage
              </h1>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              A-102 · Level 02 floor plan · Review overlay
            </p>
          </div>
        </header>

        <Sheet>
          <div className="border-b border-border bg-panel/95 px-3 py-1.5 min-[901px]:hidden">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                <span className="max-[420px]:hidden">
                  A-102 · Rev P03 · {activeDrawingSource}
                </span>
                <span className="hidden max-[420px]:inline">
                  A-102 · P03
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="h-7 rounded-md px-2 text-[10px] shadow-none"
                  >
                    Context
                  </Button>
                </SheetTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  className="h-7 rounded-md px-1.5 text-[10px] shadow-none"
                  onClick={requestChangeDrawing}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  className="h-7 rounded-md px-1.5 text-[10px] text-destructive/75 shadow-none hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRemoveDrawingDialogOpen(true)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <SheetContent
            side="right"
            overlayClassName="bg-background/10"
            className="w-[min(92vw,380px)] max-w-none overflow-hidden border-border bg-panel p-0 max-[560px]:w-full [&>button]:right-3 [&>button]:top-3"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Drawing context</SheetTitle>
              <SheetDescription>
                Active drawing metadata, drawing actions, artifact details, and
                sheet list.
              </SheetDescription>
            </SheetHeader>
            <div className="scrollbar-thin h-full overflow-y-auto pt-7">
              <DrawingTriageContextPanel
                activeDrawingFileName={activeDrawingFileName}
                activeDrawingSource={activeDrawingSource}
                activeSheet={activeSheet}
                activeSheetId={activeSheetId}
                completedSampleSheetId={completedSampleSheetId}
                contextId="mobile-context"
                drawingSheets={drawingSheets}
                remainingReviewCount={remainingReviewCount}
                onRequestChangeDrawing={requestChangeDrawing}
                onRequestRemoveDrawing={() => setRemoveDrawingDialogOpen(true)}
                onSelectSheet={selectSheet}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
          <div className="absolute left-3 top-3 z-10 hidden max-w-[calc(100%-1.5rem)] items-center gap-2 border border-border bg-panel px-2.5 py-1.5 text-[10px] shadow-sm min-[901px]:left-4 min-[901px]:top-4 min-[901px]:flex min-[901px]:max-w-[42vw]">
            <MapPin className="size-3.5 text-primary" />
            <span className="min-w-0 truncate">
              Candidate {selectedCandidate.marker} · Decision:{" "}
              {getDecisionLabel(selectedReviewState.decision)}
              {selectedReviewState.isFollowUp ? " · Follow-up" : ""}:{" "}
              {selectedCandidate.region}
            </span>
          </div>

          <DrawingTriageSamplePlan
            candidates={candidates}
            reviewStates={reviewStates}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={selectCandidateFromDrawing}
          />
        </div>
      </section>

      <DrawingTriageCandidatePanel
        activeRightPanelView={activeRightPanelView}
        candidateCardRefs={candidateCardRefs}
        createdIssueSummaries={createdIssueSummaries}
        followUpCount={followUpCount}
        issueCardRefs={issueCardRefs}
        remainingReviewCount={remainingReviewCount}
        reviewCandidateFilter={reviewCandidateFilter}
        reviewStates={reviewStates}
        selectedCandidateId={selectedCandidateId}
        visibleReviewCandidates={visibleReviewCandidates}
        onConvertCandidateToIssue={convertCandidateToIssue}
        onReviewFilterChange={setReviewFilter}
        onSelectCandidate={setSelectedCandidateId}
        onShowCreatedIssues={showCreatedIssues}
        onShowReviewCandidates={showReviewCandidates}
        onToggleFollowUp={toggleFollowUp}
        onViewCreatedIssue={viewCreatedIssue}
        onViewIssueOnSheet={viewIssueOnSheet}
        onRequestRemoveIssue={setIssuePendingRemoval}
      />

      </main>
      <DrawingTriageDialogs
        changeDrawingDialogOpen={changeDrawingDialogOpen}
        issuePendingRemoval={issuePendingRemoval}
        removeDrawingDialogOpen={removeDrawingDialogOpen}
        onChangeDrawing={changeDrawing}
        onChangeDrawingDialogOpenChange={setChangeDrawingDialogOpen}
        onIssuePendingRemovalChange={setIssuePendingRemoval}
        onRemoveCandidateIssue={removeCandidateIssue}
        onRemoveDrawing={removeDrawing}
        onRemoveDrawingDialogOpenChange={setRemoveDrawingDialogOpen}
      />
    </>
  )
}
