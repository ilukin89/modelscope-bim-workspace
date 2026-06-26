import type { AiFindingType, ReviewIssue } from "@/types"

type AiReviewCheck = readonly [label: string, detail: string, warning: boolean]

type AiReviewContent = {
  suggestion: string
  confidence: number
  checks: readonly AiReviewCheck[]
}

const aiReviewContentByFindingId: Record<ReviewIssue["id"], AiReviewContent> = {
  "res-issue-1": {
    suggestion:
      "Reroute the supply duct 180 mm south and lower it by 60 mm through Zone C. This clears the structural beam while preserving the supply-air path.",
    confidence: 86,
    checks: [
      ["Beam clearance", "Hard clash at gridline C", true],
      ["Duct route", "South offset keeps service zone", false],
      ["System continuity", "Supply air path remains connected", false],
    ],
  },
  "res-issue-6": {
    suggestion:
      "Raise the balcony guardrail to the required height or switch to a compliant railing type. Keep the correction local to the east balcony edge.",
    confidence: 84,
    checks: [
      ["Guard height", "980 mm modeled below requirement", true],
      ["Balcony edge", "Condition isolated to east balcony", false],
      ["Railing type", "Glass railing 1050 needs review", true],
    ],
  },
  "res-issue-8": {
    suggestion:
      "Move the pipe sleeve away from the shear wall edge and recheck the sleeve opening before issuing coordination comments to structure.",
    confidence: 82,
    checks: [
      ["Sleeve location", "Overlaps shear wall edge zone", true],
      ["Wall coordination", "Structural review required", true],
      ["Fire stopping", "Sleeve remains fire-stopped", false],
    ],
  },
  "res-issue-12": {
    suggestion:
      "Clear the smoke shaft obstruction at the transfer beam and confirm the shaft free area before the fire-safety review is closed.",
    confidence: 88,
    checks: [
      ["Smoke shaft", "Obstruction detected at transfer beam", true],
      ["Free area", "Smoke extract path needs review", true],
      ["Fire rating", "EI120 shaft enclosure retained", false],
    ],
  },
}

const fallbackContentByFindingType = {
  coordination: {
    confidence: 80,
    suggestion: (finding) =>
      `Coordinate ${finding.object} at ${finding.location} with the adjacent model elements before creating an issue. The preview keeps the affected object and system context in focus.`,
    checks: (finding) => [
      ["Coordination target", finding.details.category, true],
      ["System context", finding.details.system, false],
      ["Object reference", finding.details.objectId, false],
    ],
  },
  clearance: {
    confidence: 78,
    suggestion: (finding) =>
      `Review the clearance condition for ${finding.object} at ${finding.location}. Adjust the local element or document the accepted tolerance before promoting this finding.`,
    checks: (finding) => [
      ["Clearance item", finding.details.category, true],
      ["Modeled type", finding.details.type, false],
      ["Level", finding.details.level, false],
    ],
  },
  "fire-safety": {
    confidence: 87,
    suggestion: (finding) =>
      `Verify the fire-safety condition for ${finding.object} and update the linked rating, access, or smoke-control requirement before closing review.`,
    checks: (finding) => [
      ["Fire context", finding.details.fireRating, true],
      ["System", finding.details.system, false],
      ["Review location", finding.location, false],
    ],
  },
  annotation: {
    confidence: 75,
    suggestion: (finding) =>
      `Add or correct the missing documentation reference for ${finding.object}. Keep the annotation tied to ${finding.details.objectId} so the issue remains traceable.`,
    checks: (finding) => [
      ["Annotation target", finding.details.category, true],
      ["Object reference", finding.details.objectId, false],
      ["Level", finding.details.level, false],
    ],
  },
} satisfies Record<
  AiFindingType,
  {
    confidence: number
    suggestion: (finding: ReviewIssue) => string
    checks: (finding: ReviewIssue) => readonly AiReviewCheck[]
  }
>

export function getAiReviewContent(finding: ReviewIssue): AiReviewContent {
  const findingContent = aiReviewContentByFindingId[finding.id]

  if (findingContent) {
    return findingContent
  }

  const fallbackContent = fallbackContentByFindingType[finding.findingType]

  return {
    suggestion: fallbackContent.suggestion(finding),
    confidence: fallbackContent.confidence,
    checks: fallbackContent.checks(finding),
  }
}
