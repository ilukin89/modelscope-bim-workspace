import { useCallback, useEffect, useRef, useState } from "react"
import type { ViewportTool } from "@/features/viewport/types"
import type { FloorName, LayerId } from "@/types"
import { PrototypeViewerAdapter } from "./adapters/prototype/PrototypeViewerAdapter"
import type { ViewerActiveTool } from "./types"

interface PrototypeViewerAdapterCommandState {
  activeTool: ViewportTool
  selectedFloor: FloorName
  selectedObjectId: string
  visibleLayerIds: readonly LayerId[]
}

const viewerToolByViewportTool: Record<ViewportTool, ViewerActiveTool> = {
  Orbit: "orbit",
  Pan: "pan",
  Section: "section",
  Measure: "measure",
  Comment: "comment",
}

const knownLayerIds: readonly LayerId[] = [
  "architecture",
  "structure",
  "mechanical",
  "electrical",
]

const synchronizeCommands = (
  adapter: PrototypeViewerAdapter,
  commandState: PrototypeViewerAdapterCommandState,
) => {
  adapter.setActiveTool(viewerToolByViewportTool[commandState.activeTool])
  adapter.showFloor(commandState.selectedFloor)

  const visibleLayerIds = new Set(commandState.visibleLayerIds)
  knownLayerIds.forEach((layerId) => {
    adapter.setLayerVisibility(layerId, visibleLayerIds.has(layerId))
  })

  adapter.selectObject(commandState.selectedObjectId)
  adapter.highlightObject(commandState.selectedObjectId, "issue")
}

export function usePrototypeViewerAdapterLifecycle(
  commandState: PrototypeViewerAdapterCommandState,
) {
  const { activeTool, selectedFloor, selectedObjectId, visibleLayerIds } =
    commandState
  const hostRef = useRef<HTMLDivElement>(null)
  const latestCommandStateRef = useRef(commandState)
  const readyAdapterRef = useRef<PrototypeViewerAdapter | null>(null)
  const [initializationError, setInitializationError] = useState<unknown>(null)
  const [initializationAttempt, setInitializationAttempt] = useState(0)

  latestCommandStateRef.current = commandState

  const retryInitialization = useCallback(() => {
    setInitializationError(null)
    setInitializationAttempt((attempt) => attempt + 1)
  }, [])

  useEffect(() => {
    const hostElement = hostRef.current

    if (!hostElement) {
      return
    }

    const adapter = new PrototypeViewerAdapter()
    let isActive = true

    const initializeAdapter = async () => {
      try {
        await adapter.initialize(hostElement)

        if (!isActive) {
          return
        }

        readyAdapterRef.current = adapter
        synchronizeCommands(adapter, latestCommandStateRef.current)
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error("Failed to initialize prototype viewer adapter", error)
        setInitializationError(error)
      }
    }

    void initializeAdapter()

    return () => {
      isActive = false
      if (readyAdapterRef.current === adapter) {
        readyAdapterRef.current = null
      }
      adapter.dispose()
    }
  }, [initializationAttempt])

  useEffect(() => {
    const adapter = readyAdapterRef.current

    if (!adapter) {
      return
    }

    synchronizeCommands(adapter, latestCommandStateRef.current)
  }, [activeTool, selectedFloor, selectedObjectId, visibleLayerIds])

  return { hostRef, initializationError, retryInitialization }
}
