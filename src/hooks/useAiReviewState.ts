import { useEffect, useRef, useState } from "react"
import {
  createPersistedModelReviewIssue,
  fetchPersistedModelReviewState,
} from "@/data/modelReviewPersistence"
import { getProject } from "@/data/projects"
import {
  getInitialFindingStatuses,
  getInitialProjectAiReviewState,
  getInitialProjectAiReviewStates,
  getNextIssueSequenceFromIssues,
  mergeModelReviewIssues,
  mergeReviewHistory,
  modelReviewIssueStatusTransitionLabels,
} from "@/hooks/useAiReviewStateUtils"
import type {
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ProjectAiReviewState,
  ProjectData,
  ProjectId,
  ReviewIssue,
} from "@/types"

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

  useEffect(() => {
    let active = true

    fetchPersistedModelReviewState(selectedProjectId, selectedProject.issues)
      .then((persistedState) => {
        if (!active) {
          return
        }

        setProjectAiReviewStates((current) => {
          const previous =
            current[selectedProjectId] ??
            getInitialProjectAiReviewState(selectedProject)
          const modelReviewIssues = mergeModelReviewIssues(
            previous.modelReviewIssues,
            persistedState.modelReviewIssues,
          )

          return {
            ...current,
            [selectedProjectId]: {
              ...previous,
              findingStatuses: {
                ...previous.findingStatuses,
                ...persistedState.findingStatuses,
              },
              modelReviewIssues,
              nextIssueSequence: Math.max(
                previous.nextIssueSequence,
                getNextIssueSequenceFromIssues(modelReviewIssues),
              ),
              reviewHistory: mergeReviewHistory(
                previous.reviewHistory,
                persistedState.reviewHistory,
              ),
            },
          }
        })
      })
      .catch(() => {
        // Local demo state remains available when Supabase persistence is absent.
      })

    return () => {
      active = false
    }
  }, [selectedProject, selectedProjectId])

  const recordProjectHistory = (
    projectId: ProjectId,
    label: string,
    detail: string,
    eventId = `${Date.now()}-${label}`,
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    updateProjectAiReviewState(projectId, (state) => ({
      ...state,
      reviewHistory: [
        {
          id: eventId,
          label,
          detail,
          time,
        },
        ...state.reviewHistory,
      ].slice(0, 8),
    }))
    return eventId
  }

  const recordHistory = (label: string, detail: string) => {
    recordProjectHistory(selectedProjectId, label, detail)
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

    const projectId = selectedProjectId
    const sourceIssue = selectedIssue
    const issueNumber = selectedAiReviewState.nextIssueSequence
    const issueId = `MR-${String(issueNumber).padStart(3, "0")}`
    const nextIssue: ModelReviewIssue = {
      id: issueId,
      title: sourceIssue.title,
      relatedObject: sourceIssue.object,
      relatedLevel: sourceIssue.details.level,
      priority: sourceIssue.severity,
      status: "Open",
      sourceFindingId: sourceIssue.id,
      sourceFindingCode: sourceIssue.code,
      sourceIssue,
    }

    updateSelectedProjectAiReviewState((state) => ({
      ...state,
      findingStatuses: {
        ...state.findingStatuses,
        [sourceIssue.id]: "issue-created",
      },
      modelReviewIssues: [...state.modelReviewIssues, nextIssue],
      nextIssueSequence: state.nextIssueSequence + 1,
    }))
    const localHistoryId = recordProjectHistory(
      projectId,
      "Issue created",
      `${issueId} from ${sourceIssue.code} · ${sourceIssue.details.objectId}`,
    )

    createPersistedModelReviewIssue(projectId, sourceIssue)
      .then((persistedIssue) => {
        updateProjectAiReviewState(projectId, (state) => ({
          ...state,
          findingStatuses: {
            ...state.findingStatuses,
            [sourceIssue.id]: persistedIssue.findingStatus,
          },
          modelReviewIssues: [
            ...state.modelReviewIssues.filter(
              (issue) =>
                issue.id !== nextIssue.id &&
                issue.sourceFindingId !== persistedIssue.issue.sourceFindingId,
            ),
            persistedIssue.issue,
          ],
          reviewHistory: mergeReviewHistory(
            state.reviewHistory.filter((event) => event.id !== localHistoryId),
            persistedIssue.reviewHistoryEvent
              ? [persistedIssue.reviewHistoryEvent]
              : [],
          ),
        }))
      })
      .catch(() => {
        // Keep the local issue path working when Supabase persistence is absent.
      })
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
