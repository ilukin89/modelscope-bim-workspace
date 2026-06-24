export type CandidateId = "door-clearance" | "riser-note" | "grid-offset"

export type CandidateType = "Clearance" | "Annotation" | "Alignment"

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

export type ReviewCandidateFilter = "all" | "follow_up"

export type TriageStage = "empty" | "selected" | "scanning" | "review"

export type DrawingSource = "Sample drawing" | "Mock file"

export type PendingPanelFocus = {
  candidateId: CandidateId
  view: RightPanelView
}

export type TriageSessionSnapshot = {
  triageStage: TriageStage
  drawingSource: DrawingSource | null
  selectedCandidateId: CandidateId
  reviewStates: Record<CandidateId, CandidateReviewState>
  activeRightPanelView: RightPanelView
  reviewCandidateFilter: ReviewCandidateFilter
  createdIssues: CreatedIssueSummary[]
  nextIssueSequence: number
}
