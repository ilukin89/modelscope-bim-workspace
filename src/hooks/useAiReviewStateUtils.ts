import { projects } from "@/data/projects"
import type {
  AiFindingWorkflowStatus,
  AiScanStatus,
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ProjectAiReviewState,
  ProjectData,
  ProjectId,
  ReviewIssue,
} from "@/types"

export const initialAiScanStatus: AiScanStatus = "not_scanned"

export const modelReviewIssueStatusTransitionLabels: Partial<
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

export const getInitialFindingStatuses = (
  project: ProjectData,
): Record<ReviewIssue["id"], AiFindingWorkflowStatus> =>
  Object.fromEntries(
    project.issues.map((issue) => [
      issue.id,
      issue.initialAiStatus ?? "active",
    ]),
  )

export const getInitialProjectAiReviewState = (
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

export const getInitialProjectAiReviewStates = (): Record<
  ProjectId,
  ProjectAiReviewState
> =>
  Object.fromEntries(
    projects.map((project) => [
      project.id,
      getInitialProjectAiReviewState(project),
    ]),
  ) as Record<ProjectId, ProjectAiReviewState>

export const mergeModelReviewIssues = (
  existingIssues: ModelReviewIssue[],
  incomingIssues: ModelReviewIssue[],
) => {
  const issuesBySourceFinding = new Map(
    incomingIssues.map((issue) => [issue.sourceFindingId, issue]),
  )

  existingIssues.forEach((issue) => {
    if (!issuesBySourceFinding.has(issue.sourceFindingId)) {
      issuesBySourceFinding.set(issue.sourceFindingId, issue)
    }
  })

  return Array.from(issuesBySourceFinding.values())
}

export const mergeReviewHistory = (
  existingEvents: ModelReviewHistoryEvent[],
  incomingEvents: ModelReviewHistoryEvent[],
) => {
  const eventsById = new Map(incomingEvents.map((event) => [event.id, event]))

  existingEvents.forEach((event) => {
    if (!eventsById.has(event.id)) {
      eventsById.set(event.id, event)
    }
  })

  return Array.from(eventsById.values()).slice(0, 8)
}

export const getNextIssueSequenceFromIssues = (issues: ModelReviewIssue[]) =>
  issues.reduce((nextSequence, issue) => {
    const issueNumber = Number(issue.id.match(/^MR-(\d{3})$/)?.[1])

    return Number.isFinite(issueNumber)
      ? Math.max(nextSequence, issueNumber + 1)
      : nextSequence
  }, 1)

export const hasPersistedModelReviewActivity = (
  persistedState: {
    findingStatuses: Partial<Record<ReviewIssue["id"], AiFindingWorkflowStatus>>
    modelReviewIssues: ModelReviewIssue[]
    reviewHistory: ModelReviewHistoryEvent[]
  },
  project: ProjectData,
) => {
  if (
    persistedState.modelReviewIssues.length > 0 ||
    persistedState.reviewHistory.length > 0
  ) {
    return true
  }

  const initialStatuses = getInitialFindingStatuses(project)

  return Object.entries(persistedState.findingStatuses).some(
    ([findingId, status]) => status !== initialStatuses[findingId],
  )
}
