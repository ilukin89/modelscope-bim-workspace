import { useEffect, useRef, useState } from "react"
import { getProject, projects } from "@/data/projects"
import type {
  AiFindingWorkflowStatus,
  AiScanStatus,
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ProjectAiReviewState,
  ProjectData,
  ProjectId,
  ReviewIssue,
} from "@/types"

const initialAiScanStatus: AiScanStatus = "not_scanned"

const modelReviewIssueStatusTransitionLabels: Partial<
  Record<
    ModelReviewIssueStatus,
    Partial<Record<ModelReviewIssueStatus, string>>
  >
> = {
  Open: {
    "In Review": "Issue sent for review",
    Blocked: "Issue blocked",
    "Closed as not actionable": "Issue closed as not actionable",
  },
  "In Review": {
    Open: "Issue returned",
    Resolved: "Issue resolved",
    Blocked: "Issue blocked",
    "Closed as not actionable": "Issue closed as not actionable",
  },
  Resolved: { Open: "Issue reopened" },
  Blocked: { Open: "Issue returned", "In Review": "Issue returned" },
  "Closed as not actionable": { Open: "Issue reopened" },
}

const getInitialFindingStatuses = (
  project: ProjectData,
): Record<ReviewIssue["id"], AiFindingWorkflowStatus> =>
  Object.fromEntries(
    project.issues.map((issue) => [
      issue.id,
      issue.initialAiStatus ?? "active",
    ]),
  )

const getInitialProjectAiReviewState = (
  project: ProjectData,
): ProjectAiReviewState => ({
  findingStatuses: getInitialFindingStatuses(project),
  modelReviewIssues: [],
  nextIssueSequence: 1,
  previewIssueId: null,
  reviewHistory: [],
  scanStatus: initialAiScanStatus,
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

interface UseAiReviewStateOptions {
  selectedProject: ProjectData
  selectedProjectId: ProjectId
  selectedIssue: ReviewIssue
  onIssueSelect: (issue: ReviewIssue) => void
  setActiveInspectorTab: (tab: "ai" | "issues") => void
  setExplorerOpen: (open: boolean) => void
  setInspectorCollapsed: (collapsed: boolean) => void
  setInspectorOpen: (open: boolean) => void
}

export function useAiReviewState({
  selectedProject,
  selectedProjectId,
  selectedIssue,
  onIssueSelect,
  setActiveInspectorTab,
  setExplorerOpen,
  setInspectorCollapsed,
  setInspectorOpen,
}: UseAiReviewStateOptions) {
  const [projectAiReviewStates, setProjectAiReviewStates] = useState<
    Record<ProjectId, ProjectAiReviewState>
  >(getInitialProjectAiReviewStates)
  const [modelFocusRequest, setModelFocusRequest] = useState<{
    issueId: ReviewIssue["id"]
    label: string
    modelReviewIssueId?: ModelReviewIssue["id"]
    nonce: number
  } | null>(null)
  const [focusedIssueCardId, setFocusedIssueCardId] = useState<
    ModelReviewIssue["id"] | null
  >(null)
  const aiScanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modelFocusRequestNonce = useRef(0)

  const selectedAiReviewState =
    projectAiReviewStates[selectedProjectId] ??
    getInitialProjectAiReviewState(selectedProject)
  const aiScanStatus = selectedAiReviewState.scanStatus
  const aiReviewVisualsActive = aiScanStatus === "scanned_with_findings"
  const aiReviewFindings = aiReviewVisualsActive ? selectedProject.issues : []
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
  const focusedModelIssueId = modelFocusRequest?.modelReviewIssueId ?? null
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

  useEffect(
    () => () => {
      if (aiScanTimeout.current) {
        clearTimeout(aiScanTimeout.current)
      }
    },
    [],
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

  const selectAiFinding = (issue: ReviewIssue) => {
    onIssueSelect(issue)
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

    const issueNumber = selectedAiReviewState.nextIssueSequence
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
      nextIssueSequence: state.nextIssueSequence + 1,
    }))
    recordHistory(
      "Issue created",
      `${issueId} from ${selectedIssue.code} · ${selectedIssue.details.objectId}`,
    )
  }

  const updateModelReviewIssueStatus = (
    issueId: ModelReviewIssue["id"],
    nextStatus: ModelReviewIssueStatus,
  ) => {
    const issue = selectedAiReviewState.modelReviewIssues.find(
      (modelReviewIssue) => modelReviewIssue.id === issueId,
    )

    if (!issue || issue.status === nextStatus) {
      return
    }

    const historyLabel =
      modelReviewIssueStatusTransitionLabels[issue.status]?.[nextStatus] ?? null

    if (!historyLabel) {
      return
    }

    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      modelReviewIssues: state.modelReviewIssues.map((modelReviewIssue) =>
        modelReviewIssue.id === issueId
          ? { ...modelReviewIssue, status: nextStatus }
          : modelReviewIssue,
      ),
    }))
    recordHistory(historyLabel, `${issue.id} · ${issue.title}`)
  }

  const viewCreatedIssueDetails = () => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.sourceFindingId === selectedIssue.id,
    )

    if (!existingIssue) {
      return
    }

    setActiveInspectorTab("issues")
    setFocusedIssueCardId(existingIssue.id)
    recordHistory(
      "Issue details opened",
      `${existingIssue.id} from ${selectedIssue.code}`,
    )
  }

  const removeModelReviewIssue = (issueId: ModelReviewIssue["id"]) => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.id === issueId,
    )

    if (!existingIssue) {
      return
    }

    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      findingStatuses: {
        ...state.findingStatuses,
        [existingIssue.sourceFindingId]: "active",
      },
      modelReviewIssues: state.modelReviewIssues.filter(
        (issue) => issue.id !== existingIssue.id,
      ),
    }))
    setFocusedIssueCardId((current) =>
      current === existingIssue.id ? null : current,
    )
    setModelFocusRequest((current) =>
      current?.modelReviewIssueId === existingIssue.id ? null : current,
    )
    recordHistory(
      "Issue removed",
      `${existingIssue.id} removed from ${existingIssue.sourceFindingCode}`,
    )
  }

  const dropModelReviewIssue = () => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.sourceFindingId === selectedIssue.id,
    )

    if (!existingIssue) {
      return
    }

    removeModelReviewIssue(existingIssue.id)
    setActiveInspectorTab("ai")
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

  const closeInspectorOnCompact = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setInspectorOpen(false)
    }
  }

  const viewModelReviewIssue = (issue: ModelReviewIssue) => {
    onIssueSelect(issue.sourceIssue)
    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      previewIssueId: null,
    }))
    setModelFocusRequest({
      issueId: issue.sourceFindingId,
      label: issue.id,
      modelReviewIssueId: issue.id,
      nonce: (modelFocusRequestNonce.current += 1),
    })
    closeInspectorOnCompact()
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
    setFocusedIssueCardId(null)
    setModelFocusRequest(null)
    setActiveInspectorTab("ai")
  }

  const prepareProjectChange = () => {
    if (aiScanTimeout.current) {
      clearTimeout(aiScanTimeout.current)
      aiScanTimeout.current = null
      updateSelectedProjectAiReviewState((state) =>
        state.scanStatus === "scanning"
          ? { ...state, scanStatus: "not_scanned" }
          : state,
      )
    }
    setFocusedIssueCardId(null)
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
      nonce: (modelFocusRequestNonce.current += 1),
    })
    closeInspectorOnCompact()
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

  return {
    aiFindingStatuses,
    aiReviewFindings,
    aiReviewVisualsActive,
    aiScanStatus,
    clearAiScanResults,
    createModelReviewIssue,
    dismissAiFinding,
    focusedIssueCardId,
    focusedModelIssueId,
    hideModelReviewIssue,
    modelFocusRequest,
    modelReviewIssues,
    openAiReview,
    prepareProjectChange,
    previewActive,
    reviewHistory,
    scanWithAi,
    selectAiFinding,
    selectedAiFinding,
    selectedAiFindingId,
    selectedFindingStatus,
    togglePreviewChange,
    updateModelReviewIssueStatus,
    viewAiFindingInModel,
    viewCreatedIssueDetails,
    viewModelReviewIssue,
    dropModelReviewIssue,
    restoreAiFinding,
    removeModelReviewIssue,
  }
}
