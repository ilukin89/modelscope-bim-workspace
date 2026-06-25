export type CandidateId =
  | "door-clearance"
  | "riser-note"
  | "grid-offset"
  | "furniture-access"
  | "room-label"
  | "service-door"
  | "revision-note"
  | "door-furniture-conflict"
  | "corridor-boundary"

export type CandidateType = "Clearance" | "Annotation" | "Coordination"

export type Candidate = {
  id: CandidateId
  marker: number
  type: CandidateType
  title: string
  summary: string
  confidence: string
  risk: string
  region: string
}

export type ReviewDecision = "unreviewed" | "issue_created"

export type CandidateReviewState = {
  decision: ReviewDecision
  isFollowUp: boolean
}

export type CreatedIssueSummary = {
  issueId: string
  candidateId: CandidateId
}

export type RightPanelView = "review_candidates" | "created_issues"

export type ReviewCandidateFilter =
  | "all"
  | "clearance"
  | "annotation"
  | "coordination"
  | "follow_up"

export type TriageStage = "empty" | "selected" | "scanning" | "review"

export type DrawingSource = "Sample drawing" | "Mock file"

export type DrawingSheetId = "level-02" | "level-01" | "roof"

export type DrawingTriageSheetSummary = {
  id: DrawingSheetId
  name: string
  shortName: string
  code: string
  marker: string
  status: "completed" | "not-scanned"
}

export type PendingPanelFocus = {
  candidateId: CandidateId
  view: RightPanelView
}

export type TriageSessionSnapshot = {
  triageStage: TriageStage
  drawingSource: DrawingSource | null
  activeSheetId?: DrawingSheetId
  selectedCandidateId: CandidateId
  reviewStates: Record<CandidateId, CandidateReviewState>
  activeRightPanelView: RightPanelView
  reviewCandidateFilter: ReviewCandidateFilter
  createdIssues: CreatedIssueSummary[]
  nextIssueSequence: number
}
