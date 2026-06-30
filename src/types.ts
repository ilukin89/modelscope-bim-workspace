export type AppView = "workspace" | "design-system"

export type WorkspaceMode = "model-review" | "drawing-triage"

export type ProjectId =
  "residential-tower-a" | "civic-center-east" | "transit-hub-02"

export type FloorName = string

export type LayerId = "architecture" | "structure" | "mechanical" | "electrical"

export interface LayerState {
  id: LayerId
  label: string
  count: number
  visible: boolean
}

export interface FloorState {
  label: FloorName
  count: number
  viewCode: string
}

export type IssueSeverity = "critical" | "warning" | "info"

export type HighlightKind = "duct" | "door" | "damper"

export type AiFindingType =
  "coordination" | "clearance" | "fire-safety" | "annotation"

export type AiFindingGroupingMode = "severity" | "type" | "status"

export interface ObjectGeometry {
  width: string
  height: string
  length: string
  volume: string
}

export interface ObjectDetails {
  shortCode: string
  objectId: string
  category: string
  system: string
  type: string
  level: FloorName
  elevation: string
  material: string
  fireRating: string
  guid: string
  geometry: ObjectGeometry
}

export interface ReviewIssue {
  id: string
  code: string
  title: string
  object: string
  location: string
  severity: IssueSeverity
  status: string
  findingType: AiFindingType
  initialAiStatus?: AiFindingWorkflowStatus
  discipline: LayerId
  highlight: HighlightKind
  details: ObjectDetails
}

export type AiFindingWorkflowStatus =
  "active" | "issue-created" | "dismissed" | "follow-up"

export type AiScanStatus = "not_scanned" | "scanning" | "scanned_with_findings"

export type ModelReviewIssueStatus =
  "Open" | "In Review" | "Resolved" | "Blocked" | "Closed as not actionable"

export interface ModelReviewIssue {
  backendIssueId?: string
  id: string
  title: string
  relatedObject: string
  relatedLevel: FloorName
  priority: IssueSeverity
  status: ModelReviewIssueStatus
  sourceFindingId: ReviewIssue["id"]
  sourceFindingCode: ReviewIssue["code"]
  sourceIssue: ReviewIssue
}

export interface ModelReviewHistoryEvent {
  id: string
  label: string
  detail: string
  time: string
}

export interface ProjectAiReviewState {
  findingStatuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>
  modelReviewIssues: ModelReviewIssue[]
  nextIssueSequence: number
  previewIssueId: ReviewIssue["id"] | null
  reviewHistory: ModelReviewHistoryEvent[]
  scanStatus: AiScanStatus
  selectedFindingId: ReviewIssue["id"] | null
}

export interface ProjectData {
  id: ProjectId
  name: string
  modelLabel: string
  floors: FloorState[]
  layers: LayerState[]
  savedViews: string[]
  issues: ReviewIssue[]
  defaultFloor: FloorName
  defaultIssueId: string
}
