import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  candidateFilterTypes,
  candidates,
  cloneInitialReviewStates,
  completedSampleSheetId,
  drawingSheets,
  formatIssueId,
  supportedDrawingProjectId,
} from "../data/drawingTriageData"
import {
  readTriageSessionSnapshot,
  writeTriageSessionSnapshot,
} from "../lib/triageSession"
import type {
  Candidate,
  CandidateId,
  CandidateReviewState,
  CreatedIssueSummary,
  DrawingSource,
  DrawingSheetId,
  DrawingTriageSheetSummary,
  PendingPanelFocus,
  ReviewCandidateFilter,
  ReviewDecision,
  RightPanelView,
  TriageSessionSnapshot,
  TriageStage,
} from "../types"
import type { ProjectId } from "@/types"

export type CreatedIssueWithCandidate = {
  issue: CreatedIssueSummary
  candidate: Candidate
}

type SelectDrawingSourceHandler = (source: DrawingSource) => void
type SelectSheetHandler = (sheetId: DrawingSheetId) => void
type SelectCandidateHandler = (candidateId: CandidateId) => void
type SetReviewFilterHandler = (filter: ReviewCandidateFilter) => void
type CandidateActionHandler = (candidateId: CandidateId) => void
type ClearPendingPanelFocusHandler = (
  candidateId: CandidateId,
  view: RightPanelView,
) => void

export type DrawingTriageWorkflowController = {
  state: {
    activeDrawingFileName: string
    activeDrawingSource: DrawingSource
    activeRightPanelView: RightPanelView
    activeSheet: DrawingTriageSheetSummary
    activeSheetId: DrawingSheetId
    createdIssueSummaries: CreatedIssueWithCandidate[]
    drawingSource: DrawingSource | null
    followUpCount: number
    isSupportedProject: boolean
    pendingPanelFocus: PendingPanelFocus | null
    remainingReviewCount: number
    reviewCandidateFilter: ReviewCandidateFilter
    reviewStates: Record<CandidateId, CandidateReviewState>
    sampleReviewAvailable: boolean
    selectedCandidate: Candidate
    selectedCandidateId: CandidateId
    selectedReviewState: CandidateReviewState
    triageStage: TriageStage
    visibleReviewCandidates: Candidate[]
  }
  actions: {
    changeDrawing: () => void
    clearPendingPanelFocus: ClearPendingPanelFocusHandler
    convertCandidateToIssue: CandidateActionHandler
    openLevel02Sample: () => void
    openResidentialTowerSample: () => void
    removeCandidateIssue: CandidateActionHandler
    removeDrawing: () => void
    resetReviewState: () => void
    runTriage: () => void
    selectCandidate: SelectCandidateHandler
    selectCandidateFromDrawing: SelectCandidateHandler
    selectDrawingSource: SelectDrawingSourceHandler
    selectSheet: SelectSheetHandler
    setReviewFilter: SetReviewFilterHandler
    showCreatedIssues: () => void
    showReviewCandidates: () => void
    toggleFollowUp: CandidateActionHandler
    viewCreatedIssue: CandidateActionHandler
    viewIssueOnSheet: CandidateActionHandler
  }
}

type UseDrawingTriageWorkflowParams = {
  selectedProjectId: ProjectId
  onProjectChange: (projectId: ProjectId) => void
}

export function useDrawingTriageWorkflow({
  selectedProjectId,
  onProjectChange,
}: UseDrawingTriageWorkflowParams): DrawingTriageWorkflowController {
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
  const nextIssueSequence = useRef(initialSession?.nextIssueSequence ?? 1)
  const previousProjectId = useRef<ProjectId>(selectedProjectId)

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0]
  const selectedReviewState = reviewStates[selectedCandidate.id]
  const remainingReviewCount = candidates.filter(
    (candidate) => reviewStates[candidate.id].decision === "unreviewed",
  ).length
  const followUpCandidates = candidates.filter(
    (candidate) =>
      reviewStates[candidate.id].decision === "unreviewed" &&
      reviewStates[candidate.id].isFollowUp,
  )
  const followUpCount = followUpCandidates.length
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

  const visibleReviewCandidates = getReviewCandidates(reviewCandidateFilter)

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

  const setReviewFilter: SetReviewFilterHandler = (filter) => {
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

  const convertCandidateToIssue: CandidateActionHandler = (candidateId) => {
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

  const removeCandidateIssue: CandidateActionHandler = (candidateId) => {
    updateReviewDecision(candidateId, "unreviewed")
    setCreatedIssues((current) =>
      current.filter((issue) => issue.candidateId !== candidateId),
    )
    setActiveRightPanelView("review_candidates")
    setPendingPanelFocus({ candidateId, view: "review_candidates" })
  }

  const toggleFollowUp: CandidateActionHandler = (candidateId) => {
    setSelectedCandidateId(candidateId)
    setReviewStates((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        isFollowUp: !current[candidateId].isFollowUp,
      },
    }))
  }

  const selectCandidateFromDrawing: SelectCandidateHandler = (candidateId) => {
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

  const viewIssueOnSheet: CandidateActionHandler = (candidateId) => {
    setSelectedCandidateId(candidateId)
    setActiveRightPanelView("created_issues")
    setPendingPanelFocus({ candidateId, view: "created_issues" })
  }

  const viewCreatedIssue: CandidateActionHandler = (candidateId) => {
    setSelectedCandidateId(candidateId)
    setActiveRightPanelView("created_issues")
    setPendingPanelFocus({ candidateId, view: "created_issues" })
  }

  function resetReviewState() {
    setSelectedCandidateId("door-clearance")
    setReviewStates(cloneInitialReviewStates())
    setActiveRightPanelView("review_candidates")
    setReviewCandidateFilter("all")
    setCreatedIssues([])
    setPendingPanelFocus(null)
    nextIssueSequence.current = 1
  }

  const selectDrawingSource: SelectDrawingSourceHandler = (source) => {
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

  const selectSheet: SelectSheetHandler = (sheetId) => {
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

  const clearPendingPanelFocus = useCallback<ClearPendingPanelFocusHandler>(
    (candidateId, view) => {
      setPendingPanelFocus((current) =>
        current?.candidateId === candidateId && current.view === view
          ? null
          : current,
      )
    },
    [],
  )

  return {
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
      resetReviewState,
      runTriage,
      selectCandidate: setSelectedCandidateId,
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
  }
}
