import type { ViewerAdapter } from "../../ViewerAdapter"
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
} from "../../types"

export class PrototypeViewerAdapter implements ViewerAdapter {
  private state: ViewerLifecycleState = "uninitialized"
  private currentModelId: ViewerModelId | null = null
  private activeTool: ViewerActiveTool = "select"
  private cameraView: ViewerCameraView | null = null
  private selectedObjectId: ViewerObjectId | null = null
  private readonly highlightedObjects = new Map<
    ViewerObjectId,
    ViewerHighlightKind
  >()
  private readonly layerVisibility = new Map<ViewerLayerId, boolean>()
  private currentFloorId: ViewerFloorId | null = null

  private readonly objectSelectedCallbacks =
    new Set<ViewerObjectSelectedCallback>()
  private readonly cameraChangedCallbacks =
    new Set<ViewerCameraChangedCallback>()
  private readonly modelLoadedCallbacks = new Set<ViewerModelLoadedCallback>()
  private readonly modelLoadFailedCallbacks =
    new Set<ViewerModelLoadFailedCallback>()
  private readonly measurementCompletedCallbacks =
    new Set<ViewerMeasurementCompletedCallback>()
  private readonly commentPlacedCallbacks =
    new Set<ViewerCommentPlacedCallback>()
  private readonly layerVisibilityChangedCallbacks =
    new Set<ViewerLayerVisibilityChangedCallback>()

  get lifecycleState(): ViewerLifecycleState {
    return this.state
  }

  get modelId(): ViewerModelId | null {
    return this.currentModelId
  }

  get selectedTool(): ViewerActiveTool {
    return this.activeTool
  }

  get currentCameraView(): ViewerCameraView | null {
    return this.cameraView === null
      ? null
      : this.cloneCameraView(this.cameraView)
  }

  get floorId(): ViewerFloorId | null {
    return this.currentFloorId
  }

  async initialize(container: HTMLElement): Promise<void> {
    void container
    this.state = "initializing"
    this.state = "ready"
  }

  dispose(): void {
    this.currentModelId = null
    this.activeTool = "select"
    this.cameraView = null
    this.selectedObjectId = null
    this.highlightedObjects.clear()
    this.layerVisibility.clear()
    this.currentFloorId = null
    this.clearCallbacks()
    this.state = "disposed"
  }

  async loadModel(modelId: ViewerModelId): Promise<void> {
    this.state = "loading"
    this.currentModelId = modelId
    this.state = "ready"
    this.emit(this.modelLoadedCallbacks, { modelId })
  }

  setLayerVisibility(layerId: ViewerLayerId, visible: boolean): void {
    this.layerVisibility.set(layerId, visible)
    this.emit(this.layerVisibilityChangedCallbacks, { layerId, visible })
  }

  showFloor(floorId: ViewerFloorId): void {
    this.currentFloorId = floorId
  }

  selectObject(objectId: ViewerObjectId): void {
    this.selectedObjectId = objectId
    this.emit(this.objectSelectedCallbacks, { objectId })
  }

  highlightObject(
    objectId: ViewerObjectId,
    kind: ViewerHighlightKind,
  ): void {
    this.highlightedObjects.set(objectId, kind)
  }

  clearSelection(): void {
    this.selectedObjectId = null
    this.highlightedObjects.clear()
    this.emit(this.objectSelectedCallbacks, { objectId: null })
  }

  setActiveTool(tool: ViewerActiveTool): void {
    this.activeTool = tool
  }

  setCameraView(view: ViewerCameraView): void {
    this.cameraView = this.cloneCameraView(view)
    this.emit(this.cameraChangedCallbacks, this.cloneCameraView(view))
  }

  startMeasurement(): void {
    const origin = { x: 0, y: 0, z: 0 }

    this.emit(this.measurementCompletedCallbacks, {
      start: { ...origin },
      end: { ...origin },
      distance: 0,
      unit: "meter",
    })
  }

  placeComment(position: ViewerPoint3D): void {
    this.emit(this.commentPlacedCallbacks, {
      position: { ...position },
      ...(this.selectedObjectId === null
        ? {}
        : { objectId: this.selectedObjectId }),
    })
  }

  onObjectSelected(
    callback: ViewerObjectSelectedCallback,
  ): ViewerAdapterUnsubscribe {
    return this.subscribe(this.objectSelectedCallbacks, callback)
  }

  onCameraChanged(
    callback: ViewerCameraChangedCallback,
  ): ViewerAdapterUnsubscribe {
    return this.subscribe(this.cameraChangedCallbacks, callback)
  }

  onModelLoaded(callback: ViewerModelLoadedCallback): ViewerAdapterUnsubscribe {
    return this.subscribe(this.modelLoadedCallbacks, callback)
  }

  onModelLoadFailed(
    callback: ViewerModelLoadFailedCallback,
  ): ViewerAdapterUnsubscribe {
    return this.subscribe(this.modelLoadFailedCallbacks, callback)
  }

  onMeasurementCompleted(
    callback: ViewerMeasurementCompletedCallback,
  ): ViewerAdapterUnsubscribe {
    return this.subscribe(this.measurementCompletedCallbacks, callback)
  }

  onCommentPlaced(
    callback: ViewerCommentPlacedCallback,
  ): ViewerAdapterUnsubscribe {
    return this.subscribe(this.commentPlacedCallbacks, callback)
  }

  onLayerVisibilityChanged(
    callback: ViewerLayerVisibilityChangedCallback,
  ): ViewerAdapterUnsubscribe {
    return this.subscribe(this.layerVisibilityChangedCallbacks, callback)
  }

  private subscribe<T>(callbacks: Set<T>, callback: T): ViewerAdapterUnsubscribe {
    callbacks.add(callback)

    return () => {
      callbacks.delete(callback)
    }
  }

  private emit<T>(callbacks: Set<(payload: T) => void>, payload: T): void {
    callbacks.forEach((callback) => callback(payload))
  }

  private cloneCameraView(view: ViewerCameraView): ViewerCameraView {
    return {
      position: { ...view.position },
      target: { ...view.target },
      up: { ...view.up },
      projection: view.projection,
    }
  }

  private clearCallbacks(): void {
    this.objectSelectedCallbacks.clear()
    this.cameraChangedCallbacks.clear()
    this.modelLoadedCallbacks.clear()
    this.modelLoadFailedCallbacks.clear()
    this.measurementCompletedCallbacks.clear()
    this.commentPlacedCallbacks.clear()
    this.layerVisibilityChangedCallbacks.clear()
  }
}
