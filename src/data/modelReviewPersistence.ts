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
  AiScanStatus,
} from "@/types"

export interface DemoUserProfile {
  displayName: string
}

export interface PersistedModelReviewState {
  findingStatuses: Partial<Record<ReviewIssue["id"], AiFindingWorkflowStatus>>
  modelReviewIssues: ModelReviewIssue[]
  reviewHistory: ModelReviewHistoryEvent[]
  scanStatus: PersistedAiScanStatus
}

export type PersistedAiScanStatus = Exclude<AiScanStatus, "scanning">

export interface PersistedModelReviewScanStateUpdate {
  reviewHistoryEvent?: ModelReviewHistoryEvent | null
  scanStatus: PersistedAiScanStatus
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
  removedFromTrackerAt: string | null
  sourceFindingCode: string
  sourceFindingId: string
  status: ModelReviewIssueStatus
  title: string
}

interface BackendFindingDecisionRecord {
  decisionType: "dismiss" | "restore"
  findingId: string
  id: string
}

export interface BackendStatusHistoryRecord {
  fromStatus: ModelReviewIssueStatus | null
  id: string
  issueId: string
  toStatus: ModelReviewIssueStatus
}

export interface PersistedModelReviewIssueStatusUpdate {
  issue: ModelReviewIssue
  reviewHistoryEvent: ModelReviewHistoryEvent | null
  statusChanged: boolean
  statusHistory: BackendStatusHistoryRecord | null
}

export interface PersistedAiFindingDecisionUpdate {
  decisionChanged: boolean
  findingStatus: AiFindingWorkflowStatus
  reviewHistoryEvent: ModelReviewHistoryEvent | null
}

type PersistedAiFindingDecisionType =
  BackendFindingDecisionRecord["decisionType"]

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
] satisfies readonly AiFindingWorkflowStatus[]

const persistedAiScanStatuses = [
  "not_scanned",
  "scanned_with_findings",
] satisfies readonly PersistedAiScanStatus[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === "string" ? value : null
}

function readValidTimestamp(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return null
  }

  return value
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

function readPersistedAiScanStatus(
  value: string | null,
): PersistedAiScanStatus | null {
  return persistedAiScanStatuses.find((status) => status === value) ?? null
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
    removedFromTrackerAt: readString(value, "removed_from_tracker_at"),
    sourceFindingCode,
    sourceFindingId,
    status,
    title,
  }
}

function parseBackendFindingDecision(
  value: unknown,
): BackendFindingDecisionRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value, "id")
  const findingId = readString(value, "finding_id")
  const decisionType = readString(value, "decision_type")

  if (
    !id ||
    !findingId ||
    (decisionType !== "dismiss" && decisionType !== "restore")
  ) {
    return null
  }

  return { decisionType, findingId, id }
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

function parsePersistedModelReviewScanState(
  value: unknown,
): PersistedAiScanStatus | null {
  if (!isRecord(value)) {
    return null
  }

  return readPersistedAiScanStatus(readString(value, "status"))
}

function parseBackendStatusHistory(
  value: unknown,
): BackendStatusHistoryRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value, "id")
  const issueId = readString(value, "issue_id")
  const fromStatus = readModelReviewIssueStatus(
    readString(value, "from_status"),
  )
  const rawFromStatus = readString(value, "from_status")
  const toStatus = readModelReviewIssueStatus(readString(value, "to_status"))

  if (!id || !issueId || !toStatus || (rawFromStatus && !fromStatus)) {
    return null
  }

  return {
    fromStatus,
    id,
    issueId,
    toStatus,
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

export function createScanToken() {
  return createIdempotencyKey()
}

function parseRequiredStatusHistory(
  value: unknown,
  requestedBackendIssueId: string,
  requestedStatus: ModelReviewIssueStatus,
) {
  const statusHistory = parseBackendStatusHistory(value)

  if (!statusHistory) {
    throw new Error("update_issue_status did not return status history.")
  }

  if (statusHistory.issueId !== requestedBackendIssueId) {
    throw new Error("update_issue_status returned history for another issue.")
  }

  if (statusHistory.toStatus !== requestedStatus) {
    throw new Error("update_issue_status returned a different target status.")
  }

  return statusHistory
}

function parseUpdatedBackendIssue(
  value: unknown,
  requestedBackendIssueId: string,
  requestedStatus: ModelReviewIssueStatus,
) {
  const backendIssue = parseBackendIssue(value)

  if (!backendIssue) {
    throw new Error("update_issue_status did not return an issue row.")
  }

  if (backendIssue.backendId !== requestedBackendIssueId) {
    throw new Error("update_issue_status returned a different issue row.")
  }

  if (backendIssue.status !== requestedStatus) {
    throw new Error("update_issue_status returned a different issue status.")
  }

  return backendIssue
}

function parseRemovedBackendIssue(
  value: unknown,
  requestedBackendIssueId: string,
) {
  const backendIssue = parseBackendIssue(value)

  if (!backendIssue) {
    throw new Error("remove_issue_from_tracker did not return an issue row.")
  }

  if (backendIssue.backendId !== requestedBackendIssueId) {
    throw new Error("remove_issue_from_tracker returned a different issue row.")
  }

  if (!readValidTimestamp(backendIssue.removedFromTrackerAt)) {
    throw new Error(
      "remove_issue_from_tracker did not return a removed issue row.",
    )
  }

  return backendIssue
}

function parseRequiredFindingStatus(value: unknown) {
  const findingStatus = typeof value === "string" ? value : null
  const parsedFindingStatus = readAiFindingWorkflowStatus(findingStatus)

  if (!parsedFindingStatus) {
    throw new Error(
      "remove_issue_from_tracker did not return a valid finding status.",
    )
  }

  return parsedFindingStatus
}

function parseRequiredReviewHistoryEvent(
  value: unknown,
  operationName: string,
) {
  const reviewHistoryEvent = parseReviewHistoryEvent(value)

  if (!reviewHistoryEvent) {
    throw new Error(`${operationName} did not return a review history event.`)
  }

  return reviewHistoryEvent
}

function parseRequiredFindingDecision(
  value: unknown,
  requestedBackendFindingId: string,
  requestedDecisionType: PersistedAiFindingDecisionType,
) {
  const decision = parseBackendFindingDecision(value)

  if (!decision) {
    throw new Error("record_finding_decision did not return a decision row.")
  }

  if (decision.findingId !== requestedBackendFindingId) {
    throw new Error(
      "record_finding_decision returned a decision for another finding.",
    )
  }

  if (decision.decisionType !== requestedDecisionType) {
    throw new Error(
      "record_finding_decision returned a different decision type.",
    )
  }

  return decision
}

function parseRequiredDecisionFindingStatus(
  value: unknown,
  expectedStatus: AiFindingWorkflowStatus,
) {
  const findingStatus = typeof value === "string" ? value : null
  const parsedFindingStatus = readAiFindingWorkflowStatus(findingStatus)

  if (!parsedFindingStatus) {
    throw new Error(
      "record_finding_decision did not return a valid finding status.",
    )
  }

  if (parsedFindingStatus !== expectedStatus) {
    throw new Error(
      "record_finding_decision returned a different finding status.",
    )
  }

  return parsedFindingStatus
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
      "id, issue_code, source_finding_id, source_finding_code, title, related_object, related_level, priority, status, created_at, removed_from_tracker_at, removed_from_tracker_by_user_id",
    )
    .eq("project_id", projectId)
    .is("removed_from_tracker_at", null)
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

async function fetchPersistedModelReviewScanStatus(
  projectId: ProjectId,
): Promise<PersistedAiScanStatus> {
  const { data, error } = await supabase
    .from("model_review_scan_states")
    .select("status")
    .eq("project_id", projectId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return parsePersistedModelReviewScanState(data) ?? "not_scanned"
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
  const [backendFindings, backendIssues, reviewHistory, scanStatus] =
    await Promise.all([
      fetchBackendFindings(projectId),
      fetchBackendIssues(projectId),
      fetchReviewHistoryEvents(projectId),
      fetchPersistedModelReviewScanStatus(projectId),
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
    scanStatus,
  }
}

function parseModelReviewScanStateRpcResponse(
  value: unknown,
  operationName: string,
  expectedStatus: PersistedAiScanStatus,
): PersistedModelReviewScanStateUpdate {
  if (!isRecord(value)) {
    throw new Error(`Unexpected ${operationName} response.`)
  }

  const scanStatus = parsePersistedModelReviewScanState(value.scan_state)

  if (!scanStatus) {
    throw new Error(`${operationName} did not return a scan state.`)
  }

  if (scanStatus !== expectedStatus) {
    throw new Error(`${operationName} returned a different scan status.`)
  }

  return {
    reviewHistoryEvent: parseReviewHistoryEvent(value.review_history_event),
    scanStatus,
  }
}

export async function beginPersistedModelReviewScan(
  projectId: ProjectId,
  scanToken: string,
): Promise<PersistedModelReviewScanStateUpdate> {
  const { data, error } = await supabase.rpc("begin_model_review_scan", {
    project_id: projectId,
    scan_token: scanToken,
  })

  if (error) {
    throw new Error(error.message)
  }

  return parseModelReviewScanStateRpcResponse(
    data,
    "begin_model_review_scan",
    "not_scanned",
  )
}

export async function completePersistedModelReviewScan(
  projectId: ProjectId,
  scanToken: string,
): Promise<PersistedModelReviewScanStateUpdate> {
  const { data, error } = await supabase.rpc("complete_model_review_scan", {
    project_id: projectId,
    scan_token: scanToken,
  })

  if (error) {
    throw new Error(error.message)
  }

  const result = parseModelReviewScanStateRpcResponse(
    data,
    "complete_model_review_scan",
    "scanned_with_findings",
  )

  if (!result.reviewHistoryEvent) {
    throw new Error(
      "complete_model_review_scan did not return a review history event.",
    )
  }

  return result
}

export async function clearPersistedModelReviewScanResults(
  projectId: ProjectId,
): Promise<PersistedModelReviewScanStateUpdate> {
  const { data, error } = await supabase.rpc(
    "clear_model_review_scan_results",
    {
      project_id: projectId,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return parseModelReviewScanStateRpcResponse(
    data,
    "clear_model_review_scan_results",
    "not_scanned",
  )
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

async function findBackendFinding(
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

  return backendFinding
}

async function recordPersistedAiFindingDecision(
  projectId: ProjectId,
  sourceIssue: ReviewIssue,
  currentStatus: AiFindingWorkflowStatus,
  decisionType: PersistedAiFindingDecisionType,
): Promise<PersistedAiFindingDecisionUpdate> {
  const expectedFindingStatus =
    decisionType === "dismiss" ? "dismissed" : "active"
  const decisionAllowed =
    decisionType === "dismiss"
      ? currentStatus === "active"
      : currentStatus === "dismissed"

  if (!decisionAllowed) {
    return {
      decisionChanged: false,
      findingStatus: currentStatus,
      reviewHistoryEvent: null,
    }
  }

  const backendFinding = await findBackendFinding(projectId, sourceIssue)
  const idempotencyKey = createIdempotencyKey()
  const { data, error } = await supabase.rpc("record_finding_decision", {
    decision_type: decisionType,
    finding_id: backendFinding.id,
    idempotency_key: idempotencyKey,
    note: null,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!isRecord(data)) {
    throw new Error("Unexpected record_finding_decision response.")
  }

  parseRequiredFindingDecision(data.decision, backendFinding.id, decisionType)

  return {
    decisionChanged: true,
    findingStatus: parseRequiredDecisionFindingStatus(
      data.finding_status,
      expectedFindingStatus,
    ),
    reviewHistoryEvent: parseRequiredReviewHistoryEvent(
      data.review_history_event,
      "record_finding_decision",
    ),
  }
}

export async function dismissPersistedAiFinding(
  projectId: ProjectId,
  sourceIssue: ReviewIssue,
  currentStatus: AiFindingWorkflowStatus,
) {
  return recordPersistedAiFindingDecision(
    projectId,
    sourceIssue,
    currentStatus,
    "dismiss",
  )
}

export async function restorePersistedAiFinding(
  projectId: ProjectId,
  sourceIssue: ReviewIssue,
  currentStatus: AiFindingWorkflowStatus,
) {
  return recordPersistedAiFindingDecision(
    projectId,
    sourceIssue,
    currentStatus,
    "restore",
  )
}

export async function removePersistedModelReviewIssue(issue: ModelReviewIssue) {
  if (!issue.backendIssueId) {
    throw new Error(`Persisted issue ID not found for ${issue.id}.`)
  }

  const idempotencyKey = createIdempotencyKey()
  const { data, error } = await supabase.rpc("remove_issue_from_tracker", {
    idempotency_key: idempotencyKey,
    issue_id: issue.backendIssueId,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!isRecord(data)) {
    throw new Error("Unexpected remove_issue_from_tracker response.")
  }

  const backendIssue = parseRemovedBackendIssue(
    data.issue,
    issue.backendIssueId,
  )

  return {
    findingStatus: parseRequiredFindingStatus(data.finding_status),
    issue: createModelReviewIssueFromBackend(backendIssue, issue.sourceIssue),
    reviewHistoryEvent: parseRequiredReviewHistoryEvent(
      data.review_history_event,
      "remove_issue_from_tracker",
    ),
  }
}

export async function updatePersistedModelReviewIssueStatus(
  issue: ModelReviewIssue,
  nextStatus: ModelReviewIssueStatus,
  reason?: string,
): Promise<PersistedModelReviewIssueStatusUpdate> {
  if (issue.status === nextStatus) {
    return {
      issue,
      reviewHistoryEvent: null,
      statusChanged: false,
      statusHistory: null,
    }
  }

  if (!issue.backendIssueId) {
    throw new Error(`Persisted issue ID not found for ${issue.id}.`)
  }

  const idempotencyKey = createIdempotencyKey()
  const { data, error } = await supabase.rpc("update_issue_status", {
    idempotency_key: idempotencyKey,
    issue_id: issue.backendIssueId,
    reason: reason ?? null,
    to_status: nextStatus,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!isRecord(data)) {
    throw new Error("Unexpected update_issue_status response.")
  }

  const backendIssue = parseUpdatedBackendIssue(
    data.issue,
    issue.backendIssueId,
    nextStatus,
  )
  const statusHistory = parseRequiredStatusHistory(
    data.status_history,
    issue.backendIssueId,
    nextStatus,
  )

  return {
    issue: createModelReviewIssueFromBackend(backendIssue, issue.sourceIssue),
    reviewHistoryEvent: parseRequiredReviewHistoryEvent(
      data.review_history_event,
      "update_issue_status",
    ),
    statusChanged: true,
    statusHistory,
  }
}
