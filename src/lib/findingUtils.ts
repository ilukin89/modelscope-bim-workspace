import type {
  AiFindingGroupingMode,
  AiFindingWorkflowStatus,
  ReviewIssue,
} from "@/types"

export function getFindingGroupKey(
  finding: ReviewIssue,
  mode: AiFindingGroupingMode,
  statuses: Record<ReviewIssue["id"], AiFindingWorkflowStatus>,
) {
  if (mode === "severity") return finding.severity
  if (mode === "type") return finding.findingType
  return statuses[finding.id] ?? "active"
}
