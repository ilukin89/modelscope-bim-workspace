export type AppView = "workspace" | "design-system"

export type ProjectId = "residential-tower-a" | "civic-center-east" | "transit-hub-02"

export type FloorName = string

export type LayerId =
  | "architecture"
  | "structure"
  | "mechanical"
  | "electrical"

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
  discipline: LayerId
  highlight: HighlightKind
  details: ObjectDetails
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
