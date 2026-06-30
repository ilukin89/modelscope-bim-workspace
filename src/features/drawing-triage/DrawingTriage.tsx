import { useEffect, useRef, useState, type RefObject } from "react"
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
  completedSampleSheetId,
  drawingSheets,
} from "./data/drawingTriageData"
import { DrawingTriageEntryGate } from "./components/DrawingTriageEntryGate"
import { DrawingTriageCandidatePanel } from "./components/DrawingTriageCandidatePanel"
import { DrawingTriageContextPanel } from "./components/DrawingTriageContextPanel"
import { DrawingTriageDialogs } from "./components/DrawingTriageDialogs"
import {
  DrawingTriageProjectEmptyState,
  DrawingTriageSheetEmptyState,
} from "./components/DrawingTriageEmptyState"
import { useDrawingTriageWorkflow } from "./hooks/useDrawingTriageWorkflow"
import type { CandidateId, CandidateReviewState } from "./types"
import type { ProjectData, ProjectId } from "@/types"
import { DrawingTriageSamplePlan } from "./components/DrawingTriageSamplePlan"

type DrawingTriageProps = {
  selectedProject: ProjectData
  onProjectChange: (projectId: ProjectId) => void
}

export function DrawingTriage({
  selectedProject,
  onProjectChange,
}: DrawingTriageProps) {
  const selectedProjectId = selectedProject.id
  const [changeDrawingDialogOpen, setChangeDrawingDialogOpen] = useState(false)
  const [removeDrawingDialogOpen, setRemoveDrawingDialogOpen] = useState(false)
  const [issuePendingRemoval, setIssuePendingRemoval] =
    useState<CandidateId | null>(null)
  const candidateCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const issueCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const {
    state: {
      activeDrawingFileName,
      activeDrawingSource,
      activeRightPanelView,
      activeSheet,
      activeSheetId,
      createdIssueSummaries,
      drawingSource,
      followUpCount,
      isSupportedProject,
      pendingPanelFocus,
      remainingReviewCount,
      reviewCandidateFilter,
      reviewStates,
      sampleReviewAvailable,
      selectedCandidate,
      selectedCandidateId,
      selectedReviewState,
      triageStage,
      visibleReviewCandidates,
    },
    actions: {
      changeDrawing,
      clearPendingPanelFocus,
      convertCandidateToIssue,
      openLevel02Sample,
      openResidentialTowerSample,
      removeCandidateIssue,
      removeDrawing,
      runTriage,
      selectCandidate,
      selectCandidateFromDrawing,
      selectDrawingSource,
      selectSheet,
      setReviewFilter,
      showCreatedIssues,
      showReviewCandidates,
      toggleFollowUp,
      viewCreatedIssue,
      viewIssueOnSheet,
    },
  } = useDrawingTriageWorkflow({
    selectedProjectId,
    onProjectChange,
  })

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
      clearPendingPanelFocus(
        pendingPanelFocus.candidateId,
        pendingPanelFocus.view,
      )
    })
  }, [
    activeRightPanelView,
    clearPendingPanelFocus,
    createdIssueSummaries.length,
    pendingPanelFocus,
    selectedCandidateId,
  ])

  function getDecisionLabel(decision: CandidateReviewState["decision"]) {
    if (decision === "issue_created") return "Issue created"
    return "Needs review"
  }

  function requestChangeDrawing() {
    setChangeDrawingDialogOpen(true)
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
                  <span className="hidden max-[420px]:inline">A-102 · P03</span>
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
                  Active drawing metadata, drawing actions, artifact details,
                  and sheet list.
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
                  onRequestRemoveDrawing={() =>
                    setRemoveDrawingDialogOpen(true)
                  }
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
          onSelectCandidate={selectCandidate}
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
