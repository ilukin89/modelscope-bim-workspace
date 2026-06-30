import { supabase } from "@/lib/supabase"
import type {
  AiFindingWorkflowStatus,
  IssueSeverity,
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ProjectData,
  ProjectId,
  ReviewIssue,
} from "@/types"

export interface DemoUserProfile {
  displayName: string
}

export interface PersistedModelReviewState {
  findingStatuses: Partial<Record<ReviewIssue["id"], AiFindingWorkflowStatus>>
  modelReviewIssues: ModelReviewIssue[]
  reviewHistory: ModelReviewHistoryEvent[]
}

interface BackendFindingRecord {
  currentStatus: AiFindingWorkflowStatus
  fixtureFindingId: string
  id: string
}

interface BackendIssueRecord {
  backendId: string
  issueCode: string
  priority: IssueSeverity
  relatedLevel: string | null
  relatedObject: string | null
  sourceFindingCode: string
  sourceFindingId: string
  status: ModelReviewIssueStatus
  title: string
}

const modelReviewIssueStatuses = [
  "Open",
  "In Review",
  "Resolved",
  "Blocked",
  "Closed as not actionable",
] satisfies readonly ModelReviewIssueStatus[]

const issueSeverities = [
  "critical",
  "warning",
  "info",
] satisfies readonly IssueSeverity[]

const aiFindingWorkflowStatuses = [
  "active",
  "issue-created",
  "dismissed",
  "follow-up",
] satisfies readonly AiFindingWorkflowStatus[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === "string" ? value : null
}

function readIssueSeverity(value: string | null): IssueSeverity | null {
  return issueSeverities.find((severity) => severity === value) ?? null
}

function readModelReviewIssueStatus(
  value: string | null,
): ModelReviewIssueStatus | null {
  return modelReviewIssueStatuses.find((status) => status === value) ?? null
}

function readAiFindingWorkflowStatus(
  value: string | null,
): AiFindingWorkflowStatus | null {
  return aiFindingWorkflowStatuses.find((status) => status === value) ?? null
}

function formatHistoryTime(createdAt: string) {
  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function parseDemoUserProfile(value: unknown): DemoUserProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const displayName = readString(value, "display_name")

  return displayName ? { displayName } : null
}

function parseBackendFinding(value: unknown): BackendFindingRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value, "id")
  const fixtureFindingId = readString(value, "fixture_finding_id")
  const currentStatus = readAiFindingWorkflowStatus(
    readString(value, "current_status"),
  )

  if (!id || !fixtureFindingId || !currentStatus) {
    return null
  }

  return { currentStatus, fixtureFindingId, id }
}

function parseBackendIssue(value: unknown): BackendIssueRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const backendId = readString(value, "id")
  const issueCode = readString(value, "issue_code")
  const priority = readIssueSeverity(readString(value, "priority"))
  const sourceFindingCode = readString(value, "source_finding_code")
  const sourceFindingId = readString(value, "source_finding_id")
  const status = readModelReviewIssueStatus(readString(value, "status"))
  const title = readString(value, "title")

  if (
    !backendId ||
    !issueCode ||
    !priority ||
    !sourceFindingCode ||
    !sourceFindingId ||
    !status ||
    !title
  ) {
    return null
  }

  return {
    backendId,
    issueCode,
    priority,
    relatedLevel: readString(value, "related_level"),
    relatedObject: readString(value, "related_object"),
    sourceFindingCode,
    sourceFindingId,
    status,
    title,
  }
}

function parseReviewHistoryEvent(
  value: unknown,
): ModelReviewHistoryEvent | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value, "id")
  const label = readString(value, "label")
  const detail = readString(value, "detail")
  const createdAt = readString(value, "created_at")

  if (!id || !label || !detail || !createdAt) {
    return null
  }

  return {
    detail,
    id,
    label,
    time: formatHistoryTime(createdAt),
  }
}

function createModelReviewIssueFromBackend(
  backendIssue: BackendIssueRecord,
  sourceIssue: ReviewIssue,
): ModelReviewIssue {
  return {
    backendIssueId: backendIssue.backendId,
    id: backendIssue.issueCode,
    priority: backendIssue.priority,
    relatedLevel: backendIssue.relatedLevel ?? sourceIssue.details.level,
    relatedObject: backendIssue.relatedObject ?? sourceIssue.object,
    sourceFindingCode: backendIssue.sourceFindingCode,
    sourceFindingId: sourceIssue.id,
    sourceIssue,
    status: backendIssue.status,
    title: backendIssue.title,
  }
}

function createIdempotencyKey() {
  const randomUUID = globalThis.crypto?.randomUUID

  if (typeof randomUUID !== "function") {
    throw new Error("Browser UUID generation is unavailable.")
  }

  return randomUUID.call(globalThis.crypto)
}

async function fetchBackendFindings(projectId: ProjectId) {
  const { data, error } = await supabase
    .from("ai_findings")
    .select("id, fixture_finding_id, current_status")
    .eq("project_id", projectId)

  if (error) {
    throw new Error(error.message)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.flatMap((row) => {
    const finding = parseBackendFinding(row)
    return finding ? [finding] : []
  })
}

async function fetchBackendIssues(projectId: ProjectId) {
  const { data, error } = await supabase
    .from("model_review_issues")
    .select(
      "id, issue_code, source_finding_id, source_finding_code, title, related_object, related_level, priority, status, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.flatMap((row) => {
    const issue = parseBackendIssue(row)
    return issue ? [issue] : []
  })
}

export async function fetchDemoUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("demo_users")
    .select("display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return parseDemoUserProfile(data)
}

export async function fetchReviewHistoryEvents(projectId: ProjectId) {
  const { data, error } = await supabase
    .from("review_history_events")
    .select("id, label, detail, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) {
    throw new Error(error.message)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.flatMap((row) => {
    const event = parseReviewHistoryEvent(row)
    return event ? [event] : []
  })
}

export async function fetchPersistedModelReviewState(
  projectId: ProjectId,
  projectIssues: ProjectData["issues"],
): Promise<PersistedModelReviewState> {
  const [backendFindings, backendIssues, reviewHistory] = await Promise.all([
    fetchBackendFindings(projectId),
    fetchBackendIssues(projectId),
    fetchReviewHistoryEvents(projectId),
  ])
  const sourceIssueByFixtureId = new Map(
    projectIssues.map((issue) => [issue.id, issue]),
  )
  const fixtureFindingIdByBackendId = new Map(
    backendFindings.map((finding) => [finding.id, finding.fixtureFindingId]),
  )
  const findingStatuses = Object.fromEntries(
    backendFindings.flatMap((finding) =>
      sourceIssueByFixtureId.has(finding.fixtureFindingId)
        ? [[finding.fixtureFindingId, finding.currentStatus]]
        : [],
    ),
  )
  const modelReviewIssues = backendIssues.flatMap((backendIssue) => {
    const fixtureFindingId = fixtureFindingIdByBackendId.get(
      backendIssue.sourceFindingId,
    )
    const sourceIssue = fixtureFindingId
      ? sourceIssueByFixtureId.get(fixtureFindingId)
      : null

    return sourceIssue
      ? [createModelReviewIssueFromBackend(backendIssue, sourceIssue)]
      : []
  })

  return {
    findingStatuses,
    modelReviewIssues,
    reviewHistory,
  }
}

export async function createPersistedModelReviewIssue(
  projectId: ProjectId,
  sourceIssue: ReviewIssue,
) {
  const backendFindings = await fetchBackendFindings(projectId)
  const backendFinding = backendFindings.find(
    (finding) => finding.fixtureFindingId === sourceIssue.id,
  )

  if (!backendFinding) {
    throw new Error(`Persisted finding not found for ${sourceIssue.id}.`)
  }

  const idempotencyKey = createIdempotencyKey()
  const { data, error } = await supabase.rpc("create_issue_from_finding", {
    display_overrides: {
      priority: sourceIssue.severity,
      related_level: sourceIssue.details.level,
      related_object: sourceIssue.object,
      title: sourceIssue.title,
    },
    finding_id: backendFinding.id,
    idempotency_key: idempotencyKey,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!isRecord(data)) {
    throw new Error("Unexpected create_issue_from_finding response.")
  }

  const backendIssue = parseBackendIssue(data.issue)

  if (!backendIssue) {
    throw new Error("create_issue_from_finding did not return an issue row.")
  }

  return {
    findingStatus:
      readAiFindingWorkflowStatus(readString(data, "finding_status")) ??
      "issue-created",
    issue: createModelReviewIssueFromBackend(backendIssue, sourceIssue),
    reviewHistoryEvent: parseReviewHistoryEvent(data.review_history_event),
  }
}
