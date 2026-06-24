import type {
  Candidate,
  CandidateId,
  CandidateReviewState,
  CandidateType,
} from "../types"

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
  Alignment: {
    lightAccent: "oklch(0.69 0.11 270.41)",
    darkAccent: "oklch(0.69 0.11 270)",
    ink: "oklch(0.18 0.045 270)",
  },
}

export const initialReviewStates: Record<CandidateId, CandidateReviewState> = {
  "door-clearance": { decision: "unreviewed", isFollowUp: false },
  "riser-note": { decision: "unreviewed", isFollowUp: false },
  "grid-offset": { decision: "unreviewed", isFollowUp: false },
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
    risk: "Medium review priority",
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
    risk: "Low review priority",
    region: "Grid D2 · Core",
  },
  {
    id: "grid-offset",
    marker: 3,
    type: "Alignment",
    title: "Partition alignment differs at grid line",
    summary:
      "The north partition appears offset from the adjacent structural grid reference.",
    confidence: "74% visual match",
    risk: "Medium review priority",
    region: "Grid B1 · Open office",
  },
]

export function cloneInitialReviewStates() {
  return {
    "door-clearance": { ...initialReviewStates["door-clearance"] },
    "riser-note": { ...initialReviewStates["riser-note"] },
    "grid-offset": { ...initialReviewStates["grid-offset"] },
  }
}

export function formatIssueId(sequence: number) {
  return `MS-${String(sequence).padStart(3, "0")}`
}

export function getTypeAccent(candidate: Candidate) {
  const typeVisual = typeVisuals[candidate.type]
  return `light-dark(${typeVisual.lightAccent}, ${typeVisual.darkAccent})`
}

export function getPriorityLabel(candidate: Candidate) {
  const priority = candidate.risk.split(" ")[0]
  return priority || "Medium"
}
