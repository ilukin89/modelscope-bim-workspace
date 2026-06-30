import { Canvas } from "@react-three/fiber"
import { ProceduralBimScene } from "@/features/viewport/renderers/three/components/ProceduralBimScene"
import { useViewportTheme } from "@/features/viewport/renderers/three/utils/useViewportTheme"
import type { ViewportRendererProps } from "@/features/viewport/renderers/types"

let cachedWebGlAvailabilityError: Error | null | undefined

function assertWebGlAvailable() {
  if (typeof document === "undefined") {
    return
  }

  if (cachedWebGlAvailabilityError !== undefined) {
    if (cachedWebGlAvailabilityError) {
      throw cachedWebGlAvailabilityError
    }

    return
  }

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl")

  cachedWebGlAvailabilityError = context
    ? null
    : new Error("Three viewport renderer requires WebGL support.")

  if (cachedWebGlAvailabilityError) {
    throw cachedWebGlAvailabilityError
  }
}

export function ThreeViewportRenderer(props: ViewportRendererProps) {
  assertWebGlAvailable()

  const viewportTheme = useViewportTheme()
  const { aiReviewFindingCount, modelFocusRequest, selectedIssue } = props
  const focusLabel = modelFocusRequest?.label ?? selectedIssue.object
  const ariaLabel = `Procedural Three.js viewport showing conceptual BIM massing for ${selectedIssue.object}; ${aiReviewFindingCount} AI findings represented when active; focus target ${focusLabel}`

  return (
    <div
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
      data-renderer="three"
    >
      <Canvas
        camera={{ fov: 39, position: [4.9, 3.5, 5.5] }}
        dpr={[1, 1.75]}
        gl={{ alpha: false, antialias: true }}
      >
        <ProceduralBimScene {...props} theme={viewportTheme} />
      </Canvas>
    </div>
  )
}
