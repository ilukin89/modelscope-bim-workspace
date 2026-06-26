import type { ViewportTool } from "@/features/viewport/types"
import type {
  FloorName,
  FloorState,
  HighlightKind,
  LayerId,
  ReviewIssue,
} from "@/types"

export type ViewportRendererMode = "svg" | "three"

export const DEFAULT_VIEWPORT_RENDERER_MODE: ViewportRendererMode = "svg"

export interface ViewportRendererProps {
  activeTool: ViewportTool
  aiReviewFindingCount: number
  aiReviewFindingSpatialCounts: Record<HighlightKind, number>
  aiReviewVisualsActive: boolean
  floors: FloorState[]
  modelFocusActive: boolean
  modelFocusRequest: {
    issueId: ReviewIssue["id"]
    label: string
    nonce: number
  } | null
  previewActive: boolean
  selectedAiFindingActive: boolean
  selectedFloor: FloorName
  selectedIssue: ReviewIssue
  visibleLayerIds: LayerId[]
}

export function resolveViewportRendererMode(
  value: string | undefined,
): ViewportRendererMode {
  if (value === "three") {
    return "three"
  }

  if (value === "svg") {
    return "svg"
  }

  return DEFAULT_VIEWPORT_RENDERER_MODE
}
