import { candidates, cloneInitialReviewStates } from "../data/drawingTriageData"
import type {
  CandidateId,
  CreatedIssueSummary,
  DrawingSource,
  DrawingSheetId,
  ReviewCandidateFilter,
  ReviewDecision,
  RightPanelView,
  TriageSessionSnapshot,
  TriageStage,
} from "../types"

const triageSessionStorageKey = "modelscope:drawing-triage-session"

function isCandidateId(value: unknown): value is CandidateId {
  return (
    typeof value === "string" &&
    candidates.some((candidate) => candidate.id === value)
  )
}

function isDrawingSource(value: unknown): value is DrawingSource {
  return value === "Sample drawing" || value === "Mock file"
}

function isDrawingSheetId(value: unknown): value is DrawingSheetId {
  return value === "level-02" || value === "level-01" || value === "roof"
}

function isTriageStage(value: unknown): value is TriageStage {
  return (
    value === "empty" ||
    value === "selected" ||
    value === "scanning" ||
    value === "review"
  )
}

function isRightPanelView(value: unknown): value is RightPanelView {
  return value === "review_candidates" || value === "created_issues"
}

function isReviewCandidateFilter(
  value: unknown,
): value is ReviewCandidateFilter {
  return (
    value === "all" ||
    value === "clearance" ||
    value === "annotation" ||
    value === "coordination" ||
    value === "follow_up"
  )
}

function isReviewDecision(value: unknown): value is ReviewDecision {
  return value === "unreviewed" || value === "issue_created"
}

export function readTriageSessionSnapshot(): TriageSessionSnapshot | null {
  try {
    const rawSnapshot = window.sessionStorage.getItem(triageSessionStorageKey)
    if (!rawSnapshot) return null

    const parsed = JSON.parse(rawSnapshot) as Partial<TriageSessionSnapshot>
    const triageStage = isTriageStage(parsed.triageStage)
      ? parsed.triageStage
      : "empty"
    const drawingSource = isDrawingSource(parsed.drawingSource)
      ? parsed.drawingSource
      : null
    const reviewStates = cloneInitialReviewStates()

    for (const candidate of candidates) {
      const candidateState = parsed.reviewStates?.[candidate.id]
      if (
        candidateState &&
        isReviewDecision(candidateState.decision) &&
        typeof candidateState.isFollowUp === "boolean"
      ) {
        reviewStates[candidate.id] = {
          decision: candidateState.decision,
          isFollowUp: candidateState.isFollowUp,
        }
      }
    }

    const createdIssues = Array.isArray(parsed.createdIssues)
      ? parsed.createdIssues.filter(
          (issue): issue is CreatedIssueSummary =>
            typeof issue.issueId === "string" &&
            isCandidateId(issue.candidateId),
        )
      : []
    const nextIssueSequence =
      typeof parsed.nextIssueSequence === "number" &&
      parsed.nextIssueSequence > 0
        ? parsed.nextIssueSequence
        : createdIssues.length + 1

    return {
      triageStage: triageStage === "scanning" ? "selected" : triageStage,
      drawingSource,
      activeSheetId: isDrawingSheetId(parsed.activeSheetId)
        ? parsed.activeSheetId
        : "level-02",
      selectedCandidateId: isCandidateId(parsed.selectedCandidateId)
        ? parsed.selectedCandidateId
        : "door-clearance",
      reviewStates,
      activeRightPanelView: isRightPanelView(parsed.activeRightPanelView)
        ? parsed.activeRightPanelView
        : "review_candidates",
      reviewCandidateFilter: isReviewCandidateFilter(
        parsed.reviewCandidateFilter,
      )
        ? parsed.reviewCandidateFilter
        : "all",
      createdIssues,
      nextIssueSequence,
    }
  } catch {
    return null
  }
}

export function writeTriageSessionSnapshot(snapshot: TriageSessionSnapshot) {
  window.sessionStorage.setItem(
    triageSessionStorageKey,
    JSON.stringify(snapshot),
  )
}
