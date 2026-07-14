import { useEffect, useRef, useState } from "react"
import {
  beginPersistedModelReviewScan,
  clearPersistedModelReviewScanResults,
  completePersistedModelReviewScan,
  createPersistedModelReviewIssue,
  createScanToken,
  dismissPersistedAiFinding,
  fetchPersistedModelReviewState,
  removePersistedModelReviewIssue,
  restorePersistedAiFinding,
  updatePersistedModelReviewIssueStatus,
} from "@/data/modelReviewPersistence"
import { getProject } from "@/data/projects"
import {
  applyAiFindingDecision,
  applyModelReviewIssueStatusUpdate,
  applyModelReviewIssueRemoval,
  getInitialProjectAiReviewState,
  getInitialProjectAiReviewStates,
  getModelReviewIssueFocusAfterRemoval,
  hideAiScanResults,
  mergeReviewHistory,
  restorePersistedModelReviewState,
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
  const activeAiScanAttempt = useRef<{
    projectId: ProjectId
    scanToken: string
  } | null>(null)
  const scanOperationNonce = useRef(0)
  const selectedProjectIdRef = useRef(selectedProjectId)
  const modelFocusRequestNonce = useRef(0)
  selectedProjectIdRef.current = selectedProjectId

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
  const modelReviewIssues = selectedAiReviewState.modelReviewIssues
  const focusedModelIssueId = modelFocusRequest?.modelReviewIssueId ?? null
  const reviewHistory = selectedAiReviewState.reviewHistory
  const previewIssueId = aiReviewVisualsActive
    ? selectedAiReviewState.previewIssueId
    : null
  const previewActive =
    aiReviewVisualsActive &&
    Boolean(selectedAiFindingId) &&
    previewIssueId === selectedAiFindingId

  const cancelLocalAiScanTimeout = () => {
    if (aiScanTimeout.current) {
      clearTimeout(aiScanTimeout.current)
      aiScanTimeout.current = null
    }
  }

  useEffect(
    () => () => {
      if (aiScanTimeout.current) {
        clearTimeout(aiScanTimeout.current)
      }
      activeAiScanAttempt.current = null
    },
    [],
  )

  useEffect(
    () => () => {
      cancelLocalAiScanTimeout()
      activeAiScanAttempt.current = null
      scanOperationNonce.current += 1
    },
    [selectedProjectId],
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

          const restoredState = restorePersistedModelReviewState(
            previous,
            persistedState,
          )
          const activeScanIsInFlight =
            previous.scanStatus === "scanning" &&
            activeAiScanAttempt.current?.projectId === selectedProjectId

          return {
            ...current,
            [selectedProjectId]: activeScanIsInFlight
              ? { ...restoredState, scanStatus: "scanning" }
              : restoredState,
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

  const clearModelReviewIssueFocus = (issueId: ModelReviewIssue["id"]) => {
    setFocusedIssueCardId(
      (current) =>
        getModelReviewIssueFocusAfterRemoval({
          focusedIssueCardId: current,
          modelFocusRequest: null,
          removedIssueId: issueId,
        }).focusedIssueCardId,
    )
    setModelFocusRequest(
      (current) =>
        getModelReviewIssueFocusAfterRemoval({
          focusedIssueCardId: null,
          modelFocusRequest: current,
          removedIssueId: issueId,
        }).modelFocusRequest,
    )
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

    if (!issue.backendIssueId) {
      updateSelectedProjectAiReviewState((state) => ({
        ...state,
        modelReviewIssues: state.modelReviewIssues.map((modelReviewIssue) =>
          modelReviewIssue.id === issueId
            ? { ...modelReviewIssue, status: nextStatus }
            : modelReviewIssue,
        ),
      }))
      recordHistory(historyLabel, `${issue.id} · ${issue.title}`)
      return
    }

    const projectId = selectedProjectId

    void updatePersistedModelReviewIssueStatus(issue, nextStatus, historyLabel)
      .then((statusUpdate) => {
        if (!statusUpdate.statusChanged) {
          return
        }

        updateProjectAiReviewState(projectId, (state) =>
          applyModelReviewIssueStatusUpdate(state, {
            issue: statusUpdate.issue,
            issueId,
            reviewHistoryEvent: statusUpdate.reviewHistoryEvent,
          }),
        )
      })
      .catch((error) => {
        console.error("Failed to update persisted Model Review issue", error)
      })
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

  const removeModelReviewIssue = async (issueId: ModelReviewIssue["id"]) => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.id === issueId,
    )

    if (!existingIssue) {
      return false
    }

    if (!existingIssue.backendIssueId) {
      updateSelectedProjectAiReviewState((state) =>
        applyModelReviewIssueRemoval(state, {
          findingStatus: "active",
          issueId: existingIssue.id,
          sourceFindingId: existingIssue.sourceFindingId,
        }),
      )
      clearModelReviewIssueFocus(existingIssue.id)
      recordHistory(
        "Issue removed",
        `${existingIssue.id} removed from ${existingIssue.sourceFindingCode}`,
      )
      return true
    }

    try {
      const removal = await removePersistedModelReviewIssue(existingIssue)

      updateSelectedProjectAiReviewState((state) =>
        applyModelReviewIssueRemoval(state, {
          findingStatus: removal.findingStatus,
          issueId: existingIssue.id,
          reviewHistoryEvent: removal.reviewHistoryEvent,
          sourceFindingId: existingIssue.sourceFindingId,
        }),
      )
      clearModelReviewIssueFocus(existingIssue.id)
      return true
    } catch (error) {
      console.error("Failed to remove persisted Model Review issue", error)
      return false
    }
  }

  const dropModelReviewIssue = () => {
    const existingIssue = selectedAiReviewState.modelReviewIssues.find(
      (issue) => issue.sourceFindingId === selectedIssue.id,
    )

    if (!existingIssue) {
      return
    }

    void removeModelReviewIssue(existingIssue.id).then((removed) => {
      if (removed) {
        setActiveInspectorTab("ai")
      }
    })
  }

  const dismissAiFinding = () => {
    if (selectedFindingStatus !== "active") {
      return
    }

    const projectId = selectedProjectId
    const sourceIssue = selectedIssue

    void dismissPersistedAiFinding(
      projectId,
      sourceIssue,
      selectedFindingStatus,
    )
      .then((decision) => {
        if (!decision.decisionChanged) {
          return
        }

        updateProjectAiReviewState(projectId, (state) =>
          applyAiFindingDecision(state, {
            clearPreviewIssueId: true,
            expectedCurrentStatus: selectedFindingStatus,
            findingStatus: decision.findingStatus,
            reviewHistoryEvent: decision.reviewHistoryEvent,
            sourceFindingId: sourceIssue.id,
          }),
        )
      })
      .catch((error) => {
        console.error("Failed to dismiss persisted AI finding", error)
      })
  }

  const restoreAiFinding = () => {
    if (selectedFindingStatus !== "dismissed") {
      return
    }

    const projectId = selectedProjectId
    const sourceIssue = selectedIssue

    void restorePersistedAiFinding(
      projectId,
      sourceIssue,
      selectedFindingStatus,
    )
      .then((decision) => {
        if (!decision.decisionChanged) {
          return
        }

        updateProjectAiReviewState(projectId, (state) =>
          applyAiFindingDecision(state, {
            expectedCurrentStatus: "dismissed",
            findingStatus: decision.findingStatus,
            reviewHistoryEvent: decision.reviewHistoryEvent,
            sourceFindingId: sourceIssue.id,
          }),
        )
      })
      .catch((error) => {
        console.error("Failed to restore persisted AI finding", error)
      })
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
    const projectId = selectedProjectId
    const operationNonce = (scanOperationNonce.current += 1)
    const fallbackStatus =
      aiScanStatus === "scanning" ? "not_scanned" : aiScanStatus

    cancelLocalAiScanTimeout()
    activeAiScanAttempt.current = null

    void clearPersistedModelReviewScanResults(projectId)
      .then((result) => {
        if (scanOperationNonce.current !== operationNonce) {
          return
        }

        updateProjectAiReviewState(projectId, (state) => ({
          ...hideAiScanResults(state),
          scanStatus: result.scanStatus,
        }))
        setFocusedIssueCardId(null)
        setModelFocusRequest(null)

        if (selectedProjectIdRef.current === projectId) {
          setActiveInspectorTab("ai")
        }
      })
      .catch((error) => {
        if (
          scanOperationNonce.current === operationNonce &&
          fallbackStatus === "not_scanned"
        ) {
          updateProjectAiReviewState(projectId, (state) => ({
            ...state,
            scanStatus: fallbackStatus,
          }))
        }

        console.error(
          "Failed to clear persisted Model Review scan results",
          error,
        )
      })
  }

  const prepareProjectChange = () => {
    const projectId = selectedProjectId

    cancelLocalAiScanTimeout()
    activeAiScanAttempt.current = null
    scanOperationNonce.current += 1
    updateProjectAiReviewState(projectId, (state) =>
      state.scanStatus === "scanning"
        ? { ...state, scanStatus: "not_scanned" }
        : state,
    )
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
    if (
      aiScanStatus === "scanning" ||
      activeAiScanAttempt.current?.projectId === selectedProjectId
    ) {
      openAiReview()
      return
    }

    const projectId = selectedProjectId
    const project = selectedProject
    const scanToken = createScanToken()
    const operationNonce = (scanOperationNonce.current += 1)

    cancelLocalAiScanTimeout()
    activeAiScanAttempt.current = { projectId, scanToken }
    openAiReview()

    void beginPersistedModelReviewScan(projectId, scanToken)
      .then(() => {
        if (
          scanOperationNonce.current !== operationNonce ||
          activeAiScanAttempt.current?.projectId !== projectId ||
          activeAiScanAttempt.current.scanToken !== scanToken
        ) {
          return
        }

        updateProjectAiReviewState(projectId, (state) => ({
          ...state,
          previewIssueId: null,
          scanStatus: "scanning",
          selectedFindingId: null,
        }))

        aiScanTimeout.current = setTimeout(() => {
          void completePersistedModelReviewScan(projectId, scanToken)
            .then((result) => {
              if (
                scanOperationNonce.current !== operationNonce ||
                activeAiScanAttempt.current?.projectId !== projectId ||
                activeAiScanAttempt.current.scanToken !== scanToken
              ) {
                return
              }

              updateProjectAiReviewState(projectId, (state) => ({
                ...state,
                previewIssueId: null,
                reviewHistory: result.reviewHistoryEvent
                  ? mergeReviewHistory(state.reviewHistory, [
                      result.reviewHistoryEvent,
                    ])
                  : state.reviewHistory,
                scanStatus: result.scanStatus,
                selectedFindingId: null,
              }))

              if (selectedProjectIdRef.current === projectId) {
                openAiReview()
              }

              activeAiScanAttempt.current = null
              aiScanTimeout.current = null
            })
            .catch((error) => {
              if (
                scanOperationNonce.current === operationNonce &&
                activeAiScanAttempt.current?.projectId === projectId &&
                activeAiScanAttempt.current.scanToken === scanToken
              ) {
                updateProjectAiReviewState(projectId, (state) => ({
                  ...state,
                  previewIssueId: null,
                  scanStatus: "not_scanned",
                  selectedFindingId: null,
                }))
                activeAiScanAttempt.current = null
              }

              aiScanTimeout.current = null
              console.error(
                "Failed to complete persisted Model Review scan",
                error,
              )
            })
        }, 1250)
      })
      .catch((error) => {
        if (
          scanOperationNonce.current === operationNonce &&
          activeAiScanAttempt.current?.projectId === projectId &&
          activeAiScanAttempt.current.scanToken === scanToken
        ) {
          updateProjectAiReviewState(projectId, (state) => ({
            ...state,
            previewIssueId: null,
            scanStatus: "not_scanned",
            selectedFindingId: null,
          }))
          activeAiScanAttempt.current = null
        }

        console.error(
          `Failed to begin persisted Model Review scan for ${project.name}`,
          error,
        )
      })
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
