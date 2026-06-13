import { useEffect, useRef } from "react"
import { PrototypeViewerAdapter } from "./adapters/prototype/PrototypeViewerAdapter"

export function usePrototypeViewerAdapterLifecycle() {
  const hostRef = useRef<HTMLDivElement>(null)

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
      } catch {
        if (!isActive) {
          return
        }
      }
    }

    void initializeAdapter()

    return () => {
      isActive = false
      adapter.dispose()
    }
  }, [])

  return hostRef
}
