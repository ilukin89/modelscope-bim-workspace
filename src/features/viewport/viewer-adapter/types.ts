export type ViewerObjectId = string

export type ViewerLayerId = string

export type ViewerFloorId = string

export type ViewerModelId = string

export interface ViewerPoint3D {
  x: number
  y: number
  z: number
}

export type ViewerCameraProjection = "perspective" | "orthographic"

export interface ViewerCameraView {
  position: ViewerPoint3D
  target: ViewerPoint3D
  up: ViewerPoint3D
  projection: ViewerCameraProjection
}

export type ViewerActiveTool =
  "select" | "orbit" | "pan" | "section" | "measure" | "comment"

export type ViewerHighlightKind =
  "selection" | "issue" | "ai-finding" | "preview"

export type ViewerLifecycleState =
  "uninitialized" | "initializing" | "loading" | "ready" | "error" | "disposed"

export type ViewerMeasurementUnit =
  "millimeter" | "centimeter" | "meter" | "inch" | "foot"

export interface ViewerMeasurementResult {
  start: ViewerPoint3D
  end: ViewerPoint3D
  distance: number
  unit: ViewerMeasurementUnit
}

export interface ViewerCommentPlacementResult {
  position: ViewerPoint3D
  objectId?: ViewerObjectId
}

export interface ViewerLayerVisibilityChangePayload {
  layerId: ViewerLayerId
  visible: boolean
}

export interface ViewerObjectSelectionPayload {
  objectId: ViewerObjectId | null
}

export interface ViewerModelLoadedPayload {
  modelId: ViewerModelId
}

export interface ViewerModelLoadFailedPayload {
  modelId: ViewerModelId
  message: string
}

export type ViewerObjectSelectedCallback = (
  payload: ViewerObjectSelectionPayload,
) => void

export type ViewerCameraChangedCallback = (view: ViewerCameraView) => void

export type ViewerModelLoadedCallback = (
  payload: ViewerModelLoadedPayload,
) => void

export type ViewerModelLoadFailedCallback = (
  payload: ViewerModelLoadFailedPayload,
) => void

export type ViewerMeasurementCompletedCallback = (
  result: ViewerMeasurementResult,
) => void

export type ViewerCommentPlacedCallback = (
  result: ViewerCommentPlacementResult,
) => void

export type ViewerLayerVisibilityChangedCallback = (
  payload: ViewerLayerVisibilityChangePayload,
) => void

export type ViewerAdapterUnsubscribe = () => void
