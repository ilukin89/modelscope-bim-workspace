import type {
  ViewerActiveTool,
  ViewerAdapterUnsubscribe,
  ViewerCameraChangedCallback,
  ViewerCameraView,
  ViewerCommentPlacedCallback,
  ViewerFloorId,
  ViewerHighlightKind,
  ViewerLayerId,
  ViewerLayerVisibilityChangedCallback,
  ViewerLifecycleState,
  ViewerMeasurementCompletedCallback,
  ViewerModelId,
  ViewerModelLoadFailedCallback,
  ViewerModelLoadedCallback,
  ViewerObjectId,
  ViewerObjectSelectedCallback,
  ViewerPoint3D,
} from "./types"

/**
 * Library-neutral contract between viewport UI state and a future viewer.
 * Product concepts such as issues and AI findings remain outside this boundary.
 */
export interface ViewerAdapter {
  readonly lifecycleState: ViewerLifecycleState

  initialize(container: HTMLElement): Promise<void>
  dispose(): void
  loadModel(modelId: ViewerModelId): Promise<void>

  setLayerVisibility(layerId: ViewerLayerId, visible: boolean): void
  showFloor(floorId: ViewerFloorId): void
  selectObject(objectId: ViewerObjectId): void
  highlightObject(objectId: ViewerObjectId, kind: ViewerHighlightKind): void
  clearSelection(): void

  setActiveTool(tool: ViewerActiveTool): void
  setCameraView(view: ViewerCameraView): void
  startMeasurement(): void
  placeComment(position: ViewerPoint3D): void

  onObjectSelected(
    callback: ViewerObjectSelectedCallback,
  ): ViewerAdapterUnsubscribe
  onCameraChanged(
    callback: ViewerCameraChangedCallback,
  ): ViewerAdapterUnsubscribe
  onModelLoaded(callback: ViewerModelLoadedCallback): ViewerAdapterUnsubscribe
  onModelLoadFailed(
    callback: ViewerModelLoadFailedCallback,
  ): ViewerAdapterUnsubscribe
  onMeasurementCompleted(
    callback: ViewerMeasurementCompletedCallback,
  ): ViewerAdapterUnsubscribe
  onCommentPlaced(
    callback: ViewerCommentPlacedCallback,
  ): ViewerAdapterUnsubscribe
  onLayerVisibilityChanged(
    callback: ViewerLayerVisibilityChangedCallback,
  ): ViewerAdapterUnsubscribe
}
