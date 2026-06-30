import type {
  Candidate,
  CandidateId,
  CandidateReviewState,
  CandidateType,
  DrawingSheetId,
  DrawingTriageSheetSummary,
  ReviewCandidateFilter,
} from "../types"
import type { ProjectId } from "@/types"

export const supportedDrawingProjectId =
  "residential-tower-a" satisfies ProjectId

export const drawingSheets: DrawingTriageSheetSummary[] = [
  {
    id: "level-02",
    name: "Level 02 floor plan",
    shortName: "Level 02",
    code: "A-102",
    marker: "02",
    status: "completed",
  },
  {
    id: "level-01",
    name: "Level 01 floor plan",
    shortName: "Level 01",
    code: "A-101",
    marker: "01",
    status: "not-scanned",
  },
  {
    id: "roof",
    name: "Roof plan",
    shortName: "Roof",
    code: "A-301",
    marker: "R",
    status: "not-scanned",
  },
]

export const completedSampleSheetId: DrawingSheetId = "level-02"

export const candidateFilterTypes = {
  clearance: "Clearance",
  annotation: "Annotation",
  coordination: "Coordination",
} as const satisfies Record<
  Exclude<ReviewCandidateFilter, "all" | "follow_up">,
  CandidateType
>

export const typeVisuals: Record<
  CandidateType,
  {
    lightAccent: string
    darkAccent: string
    ink: string
  }
> = {
  Clearance: {
    lightAccent: "oklch(0.82 0.1 74.86)",
    darkAccent: "oklch(0.65 0.1 74.1)",
    ink: "oklch(0.18 0.05 72)",
  },
  Annotation: {
    lightAccent: "oklch(0.67 0.07 205)",
    darkAccent: "oklch(0.64 0.07 205)",
    ink: "oklch(0.16 0.035 205)",
  },
  Coordination: {
    lightAccent: "oklch(0.69 0.11 270.41)",
    darkAccent: "oklch(0.69 0.11 270)",
    ink: "oklch(0.18 0.045 270)",
  },
}

export const candidates: Candidate[] = [
  {
    id: "door-clearance",
    marker: 1,
    type: "Clearance",
    title: "Door swing near circulation path",
    summary:
      "The meeting-room door arc appears close to the main corridor clearance zone.",
    confidence: "82% visual match",
    reviewPriority: "Medium",
    region: "Grid C4 · Meeting 02",
  },
  {
    id: "riser-note",
    marker: 2,
    type: "Annotation",
    title: "Riser annotation may be incomplete",
    summary:
      "A service riser is drawn without a matching keynote on this sheet excerpt.",
    confidence: "68% visual match",
    reviewPriority: "Low",
    region: "Grid D2 · Core",
  },
  {
    id: "grid-offset",
    marker: 3,
    type: "Coordination",
    title: "Partition alignment differs at grid line",
    summary:
      "The north partition appears offset from the adjacent structural grid reference.",
    confidence: "74% visual match",
    reviewPriority: "Medium",
    region: "Grid B1 · Open office",
  },
  {
    id: "furniture-access",
    marker: 4,
    type: "Clearance",
    title: "Furniture overlaps required access zone",
    summary:
      "A workstation cluster appears to extend into the indicated access zone beside Focus 01.",
    confidence: "77% visual match",
    reviewPriority: "Medium",
    region: "Grid C3 · Focus 01",
  },
  {
    id: "room-label",
    marker: 5,
    type: "Annotation",
    title: "Room label missing near enclosed area",
    summary:
      "The small enclosed room at the south edge has no clearly associated room label in this excerpt.",
    confidence: "71% visual match",
    reviewPriority: "Low",
    region: "Grid B5 · Open office south",
  },
  {
    id: "service-door",
    marker: 6,
    type: "Clearance",
    title: "Service door clearance appears constrained",
    summary:
      "The service door swing near Meeting 03 appears close to adjacent furniture and circulation space.",
    confidence: "79% visual match",
    reviewPriority: "Medium",
    region: "Grid E3 · Meeting 03",
  },
  {
    id: "revision-note",
    marker: 7,
    type: "Annotation",
    title: "Revision note does not clarify changed zone",
    summary:
      "The revision callout identifies a change but does not clearly connect it to a specific plan area.",
    confidence: "65% visual match",
    reviewPriority: "Low",
    region: "Grid D1 · North partition",
  },
  {
    id: "door-furniture-conflict",
    marker: 8,
    type: "Coordination",
    title: "Door location conflicts with furniture layout",
    summary:
      "The shown door location may conflict with the furniture arrangement at the Focus 02 threshold.",
    confidence: "76% visual match",
    reviewPriority: "Medium",
    region: "Grid D5 · Focus 02",
  },
  {
    id: "corridor-boundary",
    marker: 9,
    type: "Coordination",
    title: "Room boundary appears inconsistent across corridor line",
    summary:
      "The room boundary line at the main corridor appears inconsistent with the adjoining room extents.",
    confidence: "72% visual match",
    reviewPriority: "Medium",
    region: "Grid D3 · Main corridor",
  },
]

export const candidateTypeCounts = candidates.reduce<
  Record<CandidateType, number>
>(
  (counts, candidate) => ({
    ...counts,
    [candidate.type]: counts[candidate.type] + 1,
  }),
  { Clearance: 0, Annotation: 0, Coordination: 0 },
)

export const initialReviewStates: Record<CandidateId, CandidateReviewState> =
  Object.fromEntries(
    candidates.map((candidate) => [
      candidate.id,
      { decision: "unreviewed", isFollowUp: false },
    ]),
  ) as Record<CandidateId, CandidateReviewState>

export function cloneInitialReviewStates() {
  return Object.fromEntries(
    candidates.map((candidate) => [
      candidate.id,
      { ...initialReviewStates[candidate.id] },
    ]),
  ) as Record<CandidateId, CandidateReviewState>
}

export function formatIssueId(sequence: number) {
  return `MS-${String(sequence).padStart(3, "0")}`
}

export function getTypeAccent(candidate: Candidate) {
  return getTypeAccentForType(candidate.type)
}

export function getTypeAccentForType(type: CandidateType) {
  const typeVisual = typeVisuals[type]
  return `light-dark(${typeVisual.lightAccent}, ${typeVisual.darkAccent})`
}
