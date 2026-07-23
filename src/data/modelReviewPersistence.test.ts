import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  ModelReviewIssue,
  ModelReviewIssueStatus,
  ProjectData,
  ReviewIssue,
} from "@/types"

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}))

import {
  beginPersistedModelReviewScan,
  classifyModelReviewScanFailure,
  clearPersistedModelReviewScanResults,
  completePersistedModelReviewScan,
  dismissPersistedAiFinding,
  fetchPersistedModelReviewState,
  removePersistedModelReviewIssue,
  restorePersistedAiFinding,
  updatePersistedModelReviewIssueStatus,
} from "./modelReviewPersistence"

describe("Model Review scan failure classification", () => {
  it("classifies clear pre-response fetch failures as network errors", () => {
    expect(
      classifyModelReviewScanFailure(new TypeError("Failed to fetch")),
    ).toBe("network")
  })

  it("classifies confirmed authentication responses as session errors", () => {
    expect(
      classifyModelReviewScanFailure({
        code: "28000",
        message: "Authenticated user required",
      }),
    ).toBe("session")
  })

  it("classifies confirmed Supabase responses as server errors", () => {
    expect(
      classifyModelReviewScanFailure({
        code: "P0002",
        message: "Backend prerequisite missing",
      }),
    ).toBe("server")
  })

  it("uses the generic fallback when the cause is not confirmed", () => {
    expect(
      classifyModelReviewScanFailure(new Error("Something went wrong")),
    ).toBe("unknown")
  })
})

const createReviewIssue = (
  id: string,
  code: string,
  title: string,
): ReviewIssue => ({
  id,
  code,
  title,
  object: `Object ${code}`,
  location: "Level 02 - Coordination Zone",
  severity: "warning",
  status: "Open",
  findingType: "coordination",
  discipline: "mechanical",
  highlight: "duct",
  details: {
    shortCode: "MEP",
    objectId: `OBJ-${code}`,
    category: "Mechanical Duct",
    system: "Supply Air",
    type: "Rectangular duct",
    level: "Level 02",
    elevation: "+8.400 m",
    material: "Galvanized steel",
    fireRating: "Not rated",
    guid: `guid-${id}`,
    geometry: {
      width: "450 mm",
      height: "250 mm",
      length: "6.20 m",
      volume: "0.698 m3",
    },
  },
})

const createProject = (issues: ReviewIssue[]): ProjectData => ({
  id: "residential-tower-a",
  name: "Test project",
  modelLabel: "Test model",
  floors: [],
  layers: [],
  savedViews: [],
  issues,
  defaultFloor: "Level 02",
  defaultIssueId: issues[0]?.id ?? "",
})

const createModelReviewIssue = (
  issue: ReviewIssue,
  overrides: Partial<ModelReviewIssue> = {},
): ModelReviewIssue => ({
  backendIssueId: "backend-issue-1",
  id: "MRI-RES-0001",
  title: issue.title,
  relatedObject: issue.object,
  relatedLevel: issue.details.level,
  priority: issue.severity,
  status: "Open",
  sourceFindingId: issue.id,
  sourceFindingCode: issue.code,
  sourceIssue: issue,
  ...overrides,
})

const createBackendIssueRow = (
  issue: ModelReviewIssue,
  status: ModelReviewIssueStatus,
) => ({
  id: issue.backendIssueId,
  issue_code: issue.id,
  source_finding_id: "backend-finding-1",
  source_finding_code: issue.sourceFindingCode,
  title: issue.title,
  related_object: issue.relatedObject,
  related_level: issue.relatedLevel,
  priority: issue.priority,
  status,
  removed_from_tracker_at: null,
  removed_from_tracker_by_user_id: null,
})

const createBackendFindingDecisionResponse = ({
  backendFindingId = "backend-finding-1",
  decisionType,
  findingStatus,
}: {
  backendFindingId?: string
  decisionType: "dismiss" | "restore"
  findingStatus: "active" | "dismissed"
}) => ({
  decision: {
    id: "decision-1",
    finding_id: backendFindingId,
    decision_type: decisionType,
  },
  finding_status: findingStatus,
  review_history_event: {
    id: "history-1",
    label:
      decisionType === "dismiss" ? "Finding dismissed" : "Finding restored",
    detail:
      decisionType === "dismiss" ? "FND-001 dismissed" : "FND-001 restored",
    created_at: "2026-07-04T10:10:00.000Z",
  },
})

function createTableBuilder(rows: Array<Record<string, unknown>>) {
  let resultRows = [...rows]
  let singleResult = false
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: unknown) => {
      resultRows = resultRows.filter((row) => row[column] === value)
      return builder
    }),
    is: vi.fn((column: string, value: unknown) => {
      resultRows = resultRows.filter((row) => row[column] === value)
      return builder
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => {
      singleResult = true
      return builder
    }),
    then: (
      resolve: (value: {
        data: Array<Record<string, unknown>> | Record<string, unknown> | null
        error: null
      }) => unknown,
    ) =>
      Promise.resolve({
        data: singleResult ? (resultRows[0] ?? null) : resultRows,
        error: null,
      }).then(resolve),
  }

  return builder
}

describe("fetchPersistedModelReviewState", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset()
    supabaseMock.rpc.mockReset()
  })

  it("hydrates only nonremoved backend issues", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const removedSourceIssue = createReviewIssue(
      "fixture-2",
      "FND-002",
      "Finding 2",
    )
    const project = createProject([sourceIssue, removedSourceIssue])
    const builders: Record<string, ReturnType<typeof createTableBuilder>> = {}

    supabaseMock.from.mockImplementation((table: string) => {
      builders[table] = createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "issue-created",
              },
              {
                id: "backend-finding-2",
                project_id: project.id,
                fixture_finding_id: removedSourceIssue.id,
                current_status: "active",
              },
            ]
          : table === "model_review_issues"
            ? [
                {
                  id: "backend-issue-1",
                  issue_code: "MRI-RES-0001",
                  project_id: project.id,
                  source_finding_id: "backend-finding-1",
                  source_finding_code: sourceIssue.code,
                  title: sourceIssue.title,
                  related_object: sourceIssue.object,
                  related_level: sourceIssue.details.level,
                  priority: sourceIssue.severity,
                  status: "Open",
                  created_at: "2026-07-04T10:00:00.000Z",
                  removed_from_tracker_at: null,
                  removed_from_tracker_by_user_id: null,
                },
                {
                  id: "backend-issue-2",
                  issue_code: "MRI-RES-0002",
                  project_id: project.id,
                  source_finding_id: "backend-finding-2",
                  source_finding_code: removedSourceIssue.code,
                  title: removedSourceIssue.title,
                  related_object: removedSourceIssue.object,
                  related_level: removedSourceIssue.details.level,
                  priority: removedSourceIssue.severity,
                  status: "Open",
                  created_at: "2026-07-04T10:05:00.000Z",
                  removed_from_tracker_at: "2026-07-04T10:10:00.000Z",
                  removed_from_tracker_by_user_id: "demo-user-1",
                },
              ]
            : [],
      )

      return builders[table]
    })

    const persistedState = await fetchPersistedModelReviewState(
      project.id,
      project.issues,
    )

    expect(builders.model_review_issues.is).toHaveBeenCalledWith(
      "removed_from_tracker_at",
      null,
    )
    expect(persistedState.modelReviewIssues).toHaveLength(1)
    expect(persistedState.modelReviewIssues[0]).toMatchObject({
      backendIssueId: "backend-issue-1",
      id: "MRI-RES-0001",
      sourceFindingId: sourceIssue.id,
    })
    expect(persistedState.scanStatus).toBe("not_scanned")
  })

  it("hydrates issues with the persisted backend status", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "issue-created",
              },
            ]
          : table === "model_review_issues"
            ? [
                {
                  id: "backend-issue-1",
                  issue_code: "MRI-RES-0001",
                  project_id: project.id,
                  source_finding_id: "backend-finding-1",
                  source_finding_code: sourceIssue.code,
                  title: sourceIssue.title,
                  related_object: sourceIssue.object,
                  related_level: sourceIssue.details.level,
                  priority: sourceIssue.severity,
                  status: "Blocked",
                  created_at: "2026-07-04T10:00:00.000Z",
                  removed_from_tracker_at: null,
                  removed_from_tracker_by_user_id: null,
                },
              ]
            : [],
      ),
    )

    const persistedState = await fetchPersistedModelReviewState(
      project.id,
      project.issues,
    )

    expect(persistedState.modelReviewIssues[0]).toMatchObject({
      backendIssueId: "backend-issue-1",
      id: "MRI-RES-0001",
      status: "Blocked",
    })
  })

  it("hydrates dismissed finding status from persisted backend state", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "dismissed",
              },
            ]
          : [],
      ),
    )

    const persistedState = await fetchPersistedModelReviewState(
      project.id,
      project.issues,
    )

    expect(persistedState.findingStatuses[sourceIssue.id]).toBe("dismissed")
  })

  it("hydrates restored active finding status from persisted backend state", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "active",
              },
            ]
          : [],
      ),
    )

    const persistedState = await fetchPersistedModelReviewState(
      project.id,
      project.issues,
    )

    expect(persistedState.findingStatuses[sourceIssue.id]).toBe("active")
  })

  it("hydrates explicit persisted scan visibility state", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "model_review_scan_states"
          ? [
              {
                project_id: project.id,
                status: "scanned_with_findings",
              },
            ]
          : [],
      ),
    )

    const persistedState = await fetchPersistedModelReviewState(
      project.id,
      project.issues,
    )

    expect(persistedState.scanStatus).toBe("scanned_with_findings")
  })

  it("falls back to not_scanned when no scan-state row exists", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation(() => createTableBuilder([]))

    const persistedState = await fetchPersistedModelReviewState(
      project.id,
      project.issues,
    )

    expect(persistedState.scanStatus).toBe("not_scanned")
  })
})

describe("persisted Model Review scan state", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset()
    supabaseMock.rpc.mockReset()
  })

  it("begins a scan with the project and token", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        scan_state: {
          project_id: "residential-tower-a",
          status: "not_scanned",
        },
        review_history_event: null,
      },
      error: null,
    })

    const result = await beginPersistedModelReviewScan(
      "residential-tower-a",
      "00000000-0000-4000-8000-000000000111",
    )

    expect(supabaseMock.rpc).toHaveBeenCalledWith("begin_model_review_scan", {
      project_id: "residential-tower-a",
      scan_token: "00000000-0000-4000-8000-000000000111",
    })
    expect(result.scanStatus).toBe("not_scanned")
  })

  it("completes a scan and requires the backend history event", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        scan_state: {
          project_id: "residential-tower-a",
          status: "scanned_with_findings",
        },
        review_history_event: {
          id: "history-1",
          label: "AI scan completed",
          detail: "18 coordination findings available",
          created_at: "2026-07-05T10:10:00.000Z",
        },
      },
      error: null,
    })

    const result = await completePersistedModelReviewScan(
      "residential-tower-a",
      "00000000-0000-4000-8000-000000000111",
    )

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "complete_model_review_scan",
      {
        project_id: "residential-tower-a",
        scan_token: "00000000-0000-4000-8000-000000000111",
      },
    )
    expect(result).toMatchObject({
      reviewHistoryEvent: {
        id: "history-1",
        label: "AI scan completed",
      },
      scanStatus: "scanned_with_findings",
    })
  })

  it("clears scan visibility without requiring history", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        scan_state: {
          project_id: "residential-tower-a",
          status: "not_scanned",
        },
        review_history_event: null,
      },
      error: null,
    })

    const result = await clearPersistedModelReviewScanResults(
      "residential-tower-a",
    )

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "clear_model_review_scan_results",
      {
        project_id: "residential-tower-a",
      },
    )
    expect(result.scanStatus).toBe("not_scanned")
  })

  it("rejects scan completion without a persisted history event", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        scan_state: {
          project_id: "residential-tower-a",
          status: "scanned_with_findings",
        },
        review_history_event: null,
      },
      error: null,
    })

    await expect(
      completePersistedModelReviewScan(
        "residential-tower-a",
        "00000000-0000-4000-8000-000000000111",
      ),
    ).rejects.toThrow(
      "complete_model_review_scan did not return a review history event.",
    )
  })
})

describe("persisted AI finding decisions", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset()
    supabaseMock.rpc.mockReset()
    vi.stubGlobal("crypto", {
      randomUUID: () => "00000000-0000-4000-8000-000000000007",
    })
  })

  it("persists active to dismissed through record_finding_decision", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "active",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: createBackendFindingDecisionResponse({
        decisionType: "dismiss",
        findingStatus: "dismissed",
      }),
      error: null,
    })

    const result = await dismissPersistedAiFinding(
      project.id,
      sourceIssue,
      "active",
    )

    expect(supabaseMock.rpc).toHaveBeenCalledWith("record_finding_decision", {
      decision_type: "dismiss",
      finding_id: "backend-finding-1",
      idempotency_key: "00000000-0000-4000-8000-000000000007",
      note: null,
    })
    expect(supabaseMock.rpc).not.toHaveBeenCalledWith(
      "record_finding_decision",
      expect.objectContaining({ finding_id: sourceIssue.id }),
    )
    expect(result).toMatchObject({
      decisionChanged: true,
      findingStatus: "dismissed",
      reviewHistoryEvent: {
        id: "history-1",
        label: "Finding dismissed",
      },
    })
  })

  it("persists dismissed to active through record_finding_decision", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "dismissed",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: createBackendFindingDecisionResponse({
        decisionType: "restore",
        findingStatus: "active",
      }),
      error: null,
    })

    const result = await restorePersistedAiFinding(
      project.id,
      sourceIssue,
      "dismissed",
    )

    expect(supabaseMock.rpc).toHaveBeenCalledWith("record_finding_decision", {
      decision_type: "restore",
      finding_id: "backend-finding-1",
      idempotency_key: "00000000-0000-4000-8000-000000000007",
      note: null,
    })
    expect(result).toMatchObject({
      decisionChanged: true,
      findingStatus: "active",
      reviewHistoryEvent: {
        id: "history-1",
        label: "Finding restored",
      },
    })
  })

  it("propagates dismiss RPC errors without returning a local update", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "active",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: "Project membership required" },
    })

    await expect(
      dismissPersistedAiFinding(project.id, sourceIssue, "active"),
    ).rejects.toThrow("Project membership required")
  })

  it("propagates restore RPC errors without returning a local update", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "dismissed",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: "Project membership required" },
    })

    await expect(
      restorePersistedAiFinding(project.id, sourceIssue, "dismissed"),
    ).rejects.toThrow("Project membership required")
  })

  it("does not call the RPC when dismissing an already dismissed finding", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    const result = await dismissPersistedAiFinding(
      project.id,
      sourceIssue,
      "dismissed",
    )

    expect(supabaseMock.rpc).not.toHaveBeenCalled()
    expect(result).toEqual({
      decisionChanged: false,
      findingStatus: "dismissed",
      reviewHistoryEvent: null,
    })
  })

  it("does not call the RPC when restoring an already active finding", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    const result = await restorePersistedAiFinding(
      project.id,
      sourceIssue,
      "active",
    )

    expect(supabaseMock.rpc).not.toHaveBeenCalled()
    expect(result).toEqual({
      decisionChanged: false,
      findingStatus: "active",
      reviewHistoryEvent: null,
    })
  })

  it("does not call the RPC for issue-created findings", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    await expect(
      dismissPersistedAiFinding(project.id, sourceIssue, "issue-created"),
    ).resolves.toMatchObject({
      decisionChanged: false,
      findingStatus: "issue-created",
    })
    await expect(
      restorePersistedAiFinding(project.id, sourceIssue, "issue-created"),
    ).resolves.toMatchObject({
      decisionChanged: false,
      findingStatus: "issue-created",
    })
    expect(supabaseMock.rpc).not.toHaveBeenCalled()
  })

  it("rejects malformed record_finding_decision responses", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "active",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: {
        decision: null,
        finding_status: "dismissed",
        review_history_event: {
          id: "history-1",
          label: "Finding dismissed",
          detail: "FND-001 dismissed",
          created_at: "2026-07-04T10:10:00.000Z",
        },
      },
      error: null,
    })

    await expect(
      dismissPersistedAiFinding(project.id, sourceIssue, "active"),
    ).rejects.toThrow("record_finding_decision did not return a decision row.")
  })

  it("rejects contradictory returned finding status", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "active",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: createBackendFindingDecisionResponse({
        decisionType: "dismiss",
        findingStatus: "active",
      }),
      error: null,
    })

    await expect(
      dismissPersistedAiFinding(project.id, sourceIssue, "active"),
    ).rejects.toThrow(
      "record_finding_decision returned a different finding status.",
    )
  })

  it("rejects responses without a persisted review history event", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    supabaseMock.from.mockImplementation((table: string) =>
      createTableBuilder(
        table === "ai_findings"
          ? [
              {
                id: "backend-finding-1",
                project_id: project.id,
                fixture_finding_id: sourceIssue.id,
                current_status: "active",
              },
            ]
          : [],
      ),
    )
    supabaseMock.rpc.mockResolvedValue({
      data: {
        ...createBackendFindingDecisionResponse({
          decisionType: "dismiss",
          findingStatus: "dismissed",
        }),
        review_history_event: null,
      },
      error: null,
    })

    await expect(
      dismissPersistedAiFinding(project.id, sourceIssue, "active"),
    ).rejects.toThrow(
      "record_finding_decision did not return a review history event.",
    )
  })
})

describe("updatePersistedModelReviewIssueStatus", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset()
    supabaseMock.rpc.mockReset()
    vi.stubGlobal("crypto", {
      randomUUID: () => "00000000-0000-4000-8000-000000000009",
    })
  })

  it.each([
    ["Open", "In Review"],
    ["In Review", "Blocked"],
    ["Blocked", "Resolved"],
    ["Open", "Closed as not actionable"],
  ] satisfies Array<[ModelReviewIssueStatus, ModelReviewIssueStatus]>)(
    "persists %s to %s through the status RPC",
    async (fromStatus, toStatus) => {
      const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
      const issue = createModelReviewIssue(sourceIssue, {
        status: fromStatus,
      })

      supabaseMock.rpc.mockResolvedValue({
        data: {
          issue: createBackendIssueRow(issue, toStatus),
          review_history_event: {
            id: "history-1",
            label: "Issue status changed",
            detail: `${issue.id} moved from ${fromStatus} to ${toStatus}`,
            created_at: "2026-07-04T10:10:00.000Z",
          },
          status_history: {
            id: "status-history-1",
            issue_id: issue.backendIssueId,
            from_status: fromStatus,
            to_status: toStatus,
          },
        },
        error: null,
      })

      const result = await updatePersistedModelReviewIssueStatus(
        issue,
        toStatus,
        "Issue status changed",
      )

      expect(supabaseMock.rpc).toHaveBeenCalledWith("update_issue_status", {
        idempotency_key: "00000000-0000-4000-8000-000000000009",
        issue_id: issue.backendIssueId,
        reason: "Issue status changed",
        to_status: toStatus,
      })
      expect(result.statusChanged).toBe(true)
      expect(result.issue).toMatchObject({
        backendIssueId: issue.backendIssueId,
        id: issue.id,
        sourceFindingId: sourceIssue.id,
        status: toStatus,
      })
      expect(result.statusHistory).toMatchObject({
        fromStatus,
        issueId: issue.backendIssueId,
        toStatus,
      })
      expect(result.reviewHistoryEvent).toMatchObject({
        id: "history-1",
        label: "Issue status changed",
      })
    },
  )

  it("does not call the RPC or append history when selecting the current status", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue, {
      status: "Blocked",
    })

    const result = await updatePersistedModelReviewIssueStatus(issue, "Blocked")

    expect(supabaseMock.rpc).not.toHaveBeenCalled()
    expect(result).toEqual({
      issue,
      reviewHistoryEvent: null,
      statusChanged: false,
      statusHistory: null,
    })
  })

  it("propagates RPC errors without returning a local status update", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue, {
      status: "In Review",
    })

    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: "Project membership required" },
    })

    await expect(
      updatePersistedModelReviewIssueStatus(issue, "Blocked"),
    ).rejects.toThrow("Project membership required")
    expect(issue.status).toBe("In Review")
  })

  it("rejects a response without status history", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        issue: createBackendIssueRow(issue, "In Review"),
        review_history_event: {
          id: "history-1",
          label: "Issue status changed",
          detail: "MRI-RES-0001 moved from Open to In Review",
          created_at: "2026-07-04T10:10:00.000Z",
        },
        status_history: null,
      },
      error: null,
    })

    await expect(
      updatePersistedModelReviewIssueStatus(issue, "In Review"),
    ).rejects.toThrow("update_issue_status did not return status history.")
  })
})

describe("removePersistedModelReviewIssue", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset()
    supabaseMock.rpc.mockReset()
    vi.stubGlobal("crypto", {
      randomUUID: () => "00000000-0000-4000-8000-000000000001",
    })
  })

  it("calls remove_issue_from_tracker and parses the committed removal", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        finding_status: "active",
        issue: {
          id: issue.backendIssueId,
          issue_code: issue.id,
          source_finding_id: "backend-finding-1",
          source_finding_code: issue.sourceFindingCode,
          title: issue.title,
          related_object: issue.relatedObject,
          related_level: issue.relatedLevel,
          priority: issue.priority,
          status: issue.status,
          removed_from_tracker_at: "2026-07-04T10:10:00.000Z",
          removed_from_tracker_by_user_id: "demo-user-1",
        },
        review_history_event: {
          id: "history-1",
          label: "Issue removed",
          detail: "MRI-RES-0001 removed from FND-001",
          created_at: "2026-07-04T10:10:00.000Z",
        },
      },
      error: null,
    })

    const result = await removePersistedModelReviewIssue(issue)

    expect(supabaseMock.rpc).toHaveBeenCalledWith("remove_issue_from_tracker", {
      idempotency_key: "00000000-0000-4000-8000-000000000001",
      issue_id: issue.backendIssueId,
    })
    expect(result.findingStatus).toBe("active")
    expect(result.issue).toMatchObject({
      backendIssueId: issue.backendIssueId,
      id: issue.id,
      sourceFindingId: sourceIssue.id,
    })
    expect(result.reviewHistoryEvent).toMatchObject({
      id: "history-1",
      label: "Issue removed",
    })
  })

  it("propagates RPC errors", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: "Project membership required" },
    })

    await expect(removePersistedModelReviewIssue(issue)).rejects.toThrow(
      "Project membership required",
    )
  })

  it("rejects a removal response without a removal timestamp", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        finding_status: "active",
        issue: {
          id: issue.backendIssueId,
          issue_code: issue.id,
          source_finding_id: "backend-finding-1",
          source_finding_code: issue.sourceFindingCode,
          title: issue.title,
          related_object: issue.relatedObject,
          related_level: issue.relatedLevel,
          priority: issue.priority,
          status: issue.status,
          removed_from_tracker_at: null,
        },
        review_history_event: {
          id: "history-1",
          label: "Issue removed",
          detail: "MRI-RES-0001 removed from FND-001",
          created_at: "2026-07-04T10:10:00.000Z",
        },
      },
      error: null,
    })

    await expect(removePersistedModelReviewIssue(issue)).rejects.toThrow(
      "remove_issue_from_tracker did not return a removed issue row.",
    )
  })

  it("rejects a removal response without a valid finding status", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        finding_status: "unknown",
        issue: {
          id: issue.backendIssueId,
          issue_code: issue.id,
          source_finding_id: "backend-finding-1",
          source_finding_code: issue.sourceFindingCode,
          title: issue.title,
          related_object: issue.relatedObject,
          related_level: issue.relatedLevel,
          priority: issue.priority,
          status: issue.status,
          removed_from_tracker_at: "2026-07-04T10:10:00.000Z",
        },
        review_history_event: {
          id: "history-1",
          label: "Issue removed",
          detail: "MRI-RES-0001 removed from FND-001",
          created_at: "2026-07-04T10:10:00.000Z",
        },
      },
      error: null,
    })

    await expect(removePersistedModelReviewIssue(issue)).rejects.toThrow(
      "remove_issue_from_tracker did not return a valid finding status.",
    )
  })

  it("rejects a removal response with a missing finding status", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        issue: {
          id: issue.backendIssueId,
          issue_code: issue.id,
          source_finding_id: "backend-finding-1",
          source_finding_code: issue.sourceFindingCode,
          title: issue.title,
          related_object: issue.relatedObject,
          related_level: issue.relatedLevel,
          priority: issue.priority,
          status: issue.status,
          removed_from_tracker_at: "2026-07-04T10:10:00.000Z",
        },
        review_history_event: {
          id: "history-1",
          label: "Issue removed",
          detail: "MRI-RES-0001 removed from FND-001",
          created_at: "2026-07-04T10:10:00.000Z",
        },
      },
      error: null,
    })

    await expect(removePersistedModelReviewIssue(issue)).rejects.toThrow(
      "remove_issue_from_tracker did not return a valid finding status.",
    )
  })

  it("rejects a removal response for a different backend issue", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        finding_status: "active",
        issue: {
          id: "backend-issue-2",
          issue_code: "MRI-RES-0002",
          source_finding_id: "backend-finding-1",
          source_finding_code: issue.sourceFindingCode,
          title: issue.title,
          related_object: issue.relatedObject,
          related_level: issue.relatedLevel,
          priority: issue.priority,
          status: issue.status,
          removed_from_tracker_at: "2026-07-04T10:10:00.000Z",
        },
        review_history_event: {
          id: "history-1",
          label: "Issue removed",
          detail: "MRI-RES-0001 removed from FND-001",
          created_at: "2026-07-04T10:10:00.000Z",
        },
      },
      error: null,
    })

    await expect(removePersistedModelReviewIssue(issue)).rejects.toThrow(
      "remove_issue_from_tracker returned a different issue row.",
    )
  })

  it("rejects a removal response without a persisted review history event", async () => {
    const sourceIssue = createReviewIssue("fixture-1", "FND-001", "Finding 1")
    const issue = createModelReviewIssue(sourceIssue)

    supabaseMock.rpc.mockResolvedValue({
      data: {
        finding_status: "active",
        issue: {
          id: issue.backendIssueId,
          issue_code: issue.id,
          source_finding_id: "backend-finding-1",
          source_finding_code: issue.sourceFindingCode,
          title: issue.title,
          related_object: issue.relatedObject,
          related_level: issue.relatedLevel,
          priority: issue.priority,
          status: issue.status,
          removed_from_tracker_at: "2026-07-04T10:10:00.000Z",
        },
        review_history_event: null,
      },
      error: null,
    })

    await expect(removePersistedModelReviewIssue(issue)).rejects.toThrow(
      "remove_issue_from_tracker did not return a review history event.",
    )
  })
})

describe("remove_issue_from_tracker migration", () => {
  const createTablesMigration = readFileSync(
    resolve("supabase/migrations/20260629000001_create_tables.sql"),
    "utf8",
  )
  const removeIssueMigration = readFileSync(
    resolve("supabase/migrations/20260704000001_remove_issue_from_tracker.sql"),
    "utf8",
  )

  it("keeps created_issue_id reusable for create and removal decisions", () => {
    expect(createTablesMigration).toContain(
      "foreign key (created_issue_id, project_id) references public.model_review_issues(id, project_id)",
    )
    expect(createTablesMigration).toContain(
      "create unique index ai_finding_decisions_idempotency_key_idx",
    )
    expect(createTablesMigration).not.toMatch(
      /unique[^\n;]*created_issue_id|created_issue_id[^\n;]*unique/i,
    )
  })

  it("returns an existing committed removal for already removed issues without inserting duplicates", () => {
    expect(removeIssueMigration).toContain(
      "if issue_row.removed_from_tracker_at is not null then",
    )
    expect(removeIssueMigration).toContain(
      "where d.created_issue_id = issue_row.id",
    )
    expect(removeIssueMigration).toContain(
      "and d.decision_type = 'remove_issue_link'",
    )
    expect(removeIssueMigration).toContain(
      "where rhe.decision_id = decision_row.id",
    )
    expect(removeIssueMigration).toContain(
      "raise exception 'Removed issue is missing its removal decision",
    )
    expect(removeIssueMigration).toContain(
      "raise exception 'Removed issue is missing its removal history event",
    )
  })
})

describe("model_review_scan_states migration", () => {
  const scanStateMigration = readFileSync(
    resolve("supabase/migrations/20260705000003_model_review_scan_state.sql"),
    "utf8",
  )

  it("creates an explicit stable scan-state table initialized to not_scanned", () => {
    expect(scanStateMigration).toContain(
      "create table public.model_review_scan_states",
    )
    expect(scanStateMigration).toContain(
      "status text not null check (status in ('not_scanned', 'scanned_with_findings'))",
    )
    expect(scanStateMigration).toContain("select p.id, 'not_scanned'")
    expect(scanStateMigration).not.toContain("alter table public.ai_scan_runs")
  })

  it("keeps direct authenticated writes disabled and exposes authenticated RPCs", () => {
    expect(scanStateMigration).toContain(
      "grant select on table public.model_review_scan_states to authenticated;",
    )
    expect(scanStateMigration).not.toContain(
      "grant select, insert, update on table public.model_review_scan_states to authenticated;",
    )
    expect(scanStateMigration).toContain(
      "grant execute on function public.begin_model_review_scan(text, uuid) to authenticated;",
    )
    expect(scanStateMigration).toContain(
      "grant execute on function public.complete_model_review_scan(text, uuid) to authenticated;",
    )
    expect(scanStateMigration).toContain(
      "grant execute on function public.clear_model_review_scan_results(text) to authenticated;",
    )
  })

  it("locks scan-state completion by pending token and appends scan history atomically", () => {
    const tokenCheckIndex = scanStateMigration.indexOf(
      "scan_state_row.pending_scan_token <> $2",
    )
    const scanRunLookupIndex = scanStateMigration.indexOf(
      "from public.ai_scan_runs sr",
    )
    const stateUpdateIndex = scanStateMigration.indexOf(
      "set status = 'scanned_with_findings'",
    )
    const historyInsertIndex = scanStateMigration.indexOf(
      "insert into public.review_history_events",
    )

    expect(scanStateMigration).toMatch(
      /create or replace function public\.complete_model_review_scan[\s\S]*security definer/i,
    )
    expect(scanStateMigration).toContain("for update;")
    expect(tokenCheckIndex).toBeGreaterThan(-1)
    expect(scanRunLookupIndex).toBeGreaterThan(tokenCheckIndex)
    expect(stateUpdateIndex).toBeGreaterThan(scanRunLookupIndex)
    expect(historyInsertIndex).toBeGreaterThan(stateUpdateIndex)
    expect(scanStateMigration).toContain("'scan_completed'")
  })
})

describe("model review scan RPC ambiguity fix migration", () => {
  const ambiguityFixMigration = readFileSync(
    resolve(
      "supabase/migrations/20260722000001_fix_model_review_scan_rpc_ambiguity.sql",
    ),
    "utf8",
  )

  it("replaces all three functions without changing their public RPC arguments", () => {
    expect(ambiguityFixMigration).toMatch(
      /create or replace function public\.begin_model_review_scan\(\s*project_id text,\s*scan_token uuid\s*\)/i,
    )
    expect(ambiguityFixMigration).toMatch(
      /create or replace function public\.complete_model_review_scan\(\s*project_id text,\s*scan_token uuid\s*\)/i,
    )
    expect(ambiguityFixMigration).toMatch(
      /create or replace function public\.clear_model_review_scan_results\(\s*project_id text\s*\)/i,
    )
    expect(
      ambiguityFixMigration.match(/#variable_conflict error/g),
    ).toHaveLength(3)
    expect(ambiguityFixMigration).toContain("p_project_id alias for $1;")
    expect(ambiguityFixMigration).toContain("p_scan_token alias for $2;")
  })

  it("qualifies project columns and removes ambiguous conflict and where clauses", () => {
    expect(ambiguityFixMigration).toContain(
      "on conflict on constraint model_review_scan_states_pkey do update",
    )
    expect(ambiguityFixMigration).toContain(
      "where scan_states.project_id = p_project_id",
    )
    expect(ambiguityFixMigration).toContain(
      "where scan_runs.project_id = p_project_id",
    )
    expect(ambiguityFixMigration).toContain(
      "where findings.project_id = scan_runs.project_id",
    )
    expect(ambiguityFixMigration).not.toMatch(/on conflict \(project_id\)/i)
    expect(ambiguityFixMigration).not.toMatch(/where project_id\s*=/i)
  })

  it("preserves security settings and authenticated execution permissions", () => {
    expect(ambiguityFixMigration.match(/security definer/g)).toHaveLength(3)
    expect(
      ambiguityFixMigration.match(/set search_path = public, auth, pg_temp/g),
    ).toHaveLength(3)
    expect(ambiguityFixMigration).toContain(
      "revoke all on function public.begin_model_review_scan(text, uuid) from public, anon;",
    )
    expect(ambiguityFixMigration).toContain(
      "grant execute on function public.begin_model_review_scan(text, uuid) to authenticated;",
    )
    expect(ambiguityFixMigration).toContain(
      "grant execute on function public.complete_model_review_scan(text, uuid) to authenticated;",
    )
    expect(ambiguityFixMigration).toContain(
      "grant execute on function public.clear_model_review_scan_results(text) to authenticated;",
    )
  })
})

describe("update_issue_status migration", () => {
  const rlsPoliciesMigration = readFileSync(
    resolve("supabase/migrations/20260629000003_rls_policies.sql"),
    "utf8",
  )
  const rpcFunctionsMigration = readFileSync(
    resolve("supabase/migrations/20260629000004_rpc_functions.sql"),
    "utf8",
  )

  it("uses a SECURITY DEFINER RPC for the atomic issue status and history update", () => {
    expect(rpcFunctionsMigration).toContain(
      "create or replace function public.update_issue_status",
    )
    expect(rpcFunctionsMigration).toMatch(
      /create or replace function public\.update_issue_status[\s\S]*security definer/i,
    )
    expect(rpcFunctionsMigration).toMatch(
      /update public\.model_review_issues[\s\S]*insert into public\.issue_status_history[\s\S]*insert into public\.review_history_events/i,
    )
  })

  it("checks project membership and keeps direct authenticated writes disabled", () => {
    expect(rpcFunctionsMigration).toContain(
      "if not public.app_is_project_member(issue_row.project_id) then",
    )
    expect(rpcFunctionsMigration).toMatch(
      /grant execute on function public\.update_issue_status\(uuid, text, uuid, text\) to authenticated\b/,
    )
    expect(rlsPoliciesMigration).toContain(
      "grant select on table public.model_review_issues to authenticated;",
    )
    expect(rlsPoliciesMigration).not.toContain(
      "grant select, insert, update on table public.model_review_issues to authenticated;",
    )
  })
})

describe("record_finding_decision migration", () => {
  const rlsPoliciesMigration = readFileSync(
    resolve("supabase/migrations/20260629000003_rls_policies.sql"),
    "utf8",
  )
  const rpcFunctionsMigration = readFileSync(
    resolve("supabase/migrations/20260629000004_rpc_functions.sql"),
    "utf8",
  )
  const hardenedFindingDecisionMigration = readFileSync(
    resolve(
      "supabase/migrations/20260705000002_harden_record_finding_decision_transitions.sql",
    ),
    "utf8",
  )

  it("uses a SECURITY DEFINER RPC for atomic decisions, history, and finding status", () => {
    expect(rpcFunctionsMigration).toContain(
      "create or replace function public.record_finding_decision",
    )
    expect(rpcFunctionsMigration).toMatch(
      /create or replace function public\.record_finding_decision[\s\S]*security definer/i,
    )
    expect(rpcFunctionsMigration).toMatch(
      /insert into public\.ai_finding_decisions[\s\S]*update public\.ai_findings[\s\S]*insert into public\.review_history_events/i,
    )
  })

  it("keeps project membership and idempotency protections in place", () => {
    expect(rpcFunctionsMigration).toContain(
      "if not public.app_is_project_member(finding_row.project_id) then",
    )
    expect(rpcFunctionsMigration).toContain("if decision_row.finding_id <> $1")
    expect(rpcFunctionsMigration).toContain(
      "or decision_row.decision_type <> $2 then",
    )
    expect(rpcFunctionsMigration).toMatch(
      /grant execute on function public\.record_finding_decision\(uuid, text, uuid, text\) to authenticated\b/,
    )
    expect(rlsPoliciesMigration).toContain(
      "grant select on table public.ai_finding_decisions to authenticated;",
    )
    expect(rlsPoliciesMigration).not.toContain(
      "grant select, insert, update on table public.ai_finding_decisions to authenticated;",
    )
  })

  it("serializes finding decisions and rejects duplicate dismiss before appending decisions or history", () => {
    const lockIndex = hardenedFindingDecisionMigration.indexOf("for update")
    const dismissGuardIndex = hardenedFindingDecisionMigration.indexOf(
      "if $2 = 'dismiss' and finding_row.current_status <> 'active' then",
    )
    const decisionInsertIndex = hardenedFindingDecisionMigration.indexOf(
      "insert into public.ai_finding_decisions",
    )
    const historyInsertIndex = hardenedFindingDecisionMigration.indexOf(
      "insert into public.review_history_events",
    )

    expect(lockIndex).toBeGreaterThan(-1)
    expect(dismissGuardIndex).toBeGreaterThan(lockIndex)
    expect(decisionInsertIndex).toBeGreaterThan(dismissGuardIndex)
    expect(historyInsertIndex).toBeGreaterThan(dismissGuardIndex)
    expect(hardenedFindingDecisionMigration).toContain(
      "raise exception 'Cannot dismiss finding with status: %'",
    )
  })

  it("rejects restore from active and dismiss from dismissed without appending history", () => {
    const restoreGuardIndex = hardenedFindingDecisionMigration.indexOf(
      "if $2 = 'restore' and finding_row.current_status <> 'dismissed' then",
    )
    const dismissGuardIndex = hardenedFindingDecisionMigration.indexOf(
      "if $2 = 'dismiss' and finding_row.current_status <> 'active' then",
    )
    const historyInsertIndex = hardenedFindingDecisionMigration.indexOf(
      "insert into public.review_history_events",
    )

    expect(dismissGuardIndex).toBeGreaterThan(-1)
    expect(restoreGuardIndex).toBeGreaterThan(-1)
    expect(historyInsertIndex).toBeGreaterThan(dismissGuardIndex)
    expect(historyInsertIndex).toBeGreaterThan(restoreGuardIndex)
    expect(hardenedFindingDecisionMigration).toContain(
      "raise exception 'Cannot restore finding with status: %'",
    )
  })

  it("prevents dismiss or restore from overwriting issue-created findings", () => {
    expect(hardenedFindingDecisionMigration).toContain(
      "if $2 = 'dismiss' and finding_row.current_status <> 'active' then",
    )
    expect(hardenedFindingDecisionMigration).toContain(
      "if $2 = 'restore' and finding_row.current_status <> 'dismissed' then",
    )
    expect(hardenedFindingDecisionMigration).not.toMatch(
      /when 'dismiss'[\s\S]*current_status = 'issue-created'|when 'restore'[\s\S]*current_status = 'issue-created'/i,
    )
  })

  it("redirects direct remove_issue_link decisions before appending decisions or history", () => {
    const redirectIndex = hardenedFindingDecisionMigration.indexOf(
      "if $2 = 'remove_issue_link' then",
    )
    const lockIndex = hardenedFindingDecisionMigration.indexOf("for update")
    const decisionInsertIndex = hardenedFindingDecisionMigration.indexOf(
      "insert into public.ai_finding_decisions",
    )
    const historyInsertIndex = hardenedFindingDecisionMigration.indexOf(
      "insert into public.review_history_events",
    )

    expect(redirectIndex).toBeGreaterThan(-1)
    expect(lockIndex).toBeGreaterThan(redirectIndex)
    expect(decisionInsertIndex).toBeGreaterThan(redirectIndex)
    expect(historyInsertIndex).toBeGreaterThan(redirectIndex)
    expect(hardenedFindingDecisionMigration).toContain(
      "raise exception 'Use remove_issue_from_tracker for remove_issue_link decisions'",
    )
    expect(hardenedFindingDecisionMigration).not.toContain(
      "when 'remove_issue_link' then",
    )
  })

  it("keeps remove_issue_from_tracker as the valid remove_issue_link writer", () => {
    const removeIssueMigration = readFileSync(
      resolve(
        "supabase/migrations/20260704000001_remove_issue_from_tracker.sql",
      ),
      "utf8",
    )

    expect(removeIssueMigration).toContain(
      "create or replace function public.remove_issue_from_tracker",
    )
    expect(removeIssueMigration).toContain("'remove_issue_link'")
    expect(removeIssueMigration).toMatch(
      /grant execute on function public\.remove_issue_from_tracker\(uuid, uuid\) to authenticated\b/,
    )
  })
})

describe("SECURITY DEFINER execute privilege hardening migration", () => {
  const hardeningMigration = readFileSync(
    resolve(
      "supabase/migrations/20260714000001_harden_security_definer_execute_privileges.sql",
    ),
    "utf8",
  )
  const rlsHelpersMigration = readFileSync(
    resolve("supabase/migrations/20260629000002_rls_helpers.sql"),
    "utf8",
  )
  const rlsPoliciesMigration = readFileSync(
    resolve("supabase/migrations/20260629000003_rls_policies.sql"),
    "utf8",
  )
  const rpcFunctionsMigration = readFileSync(
    resolve("supabase/migrations/20260629000004_rpc_functions.sql"),
    "utf8",
  )
  const removeIssueMigration = readFileSync(
    resolve("supabase/migrations/20260704000001_remove_issue_from_tracker.sql"),
    "utf8",
  )
  const scanStateMigration = readFileSync(
    resolve("supabase/migrations/20260705000003_model_review_scan_state.sql"),
    "utf8",
  )

  it("conditionally hardens the remote-only RLS event-trigger helper", () => {
    expect(hardeningMigration).toContain("do $$")
    expect(hardeningMigration).toContain(
      "if to_regprocedure('public.rls_auto_enable()') is not null then",
    )
    expect(hardeningMigration).toContain(
      "execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';",
    )
    expect(hardeningMigration).not.toMatch(
      /create or replace function public\.rls_auto_enable|drop function public\.rls_auto_enable|(?:create|alter|drop) event trigger/i,
    )
  })

  it("removes explicit service-role execution from audited application functions", () => {
    const signatures = [
      "public.app_current_demo_user_id()",
      "public.app_is_project_member(text)",
      "public.app_next_issue_code(text)",
      "public.create_issue_from_finding(uuid, uuid, jsonb)",
      "public.record_finding_decision(uuid, text, uuid, text)",
      "public.update_issue_status(uuid, text, uuid, text)",
      "public.remove_issue_from_tracker(uuid, uuid)",
    ]

    for (const signature of signatures) {
      expect(hardeningMigration).toContain(
        `revoke execute on function ${signature} from service_role;`,
      )
    }

    expect(hardeningMigration).not.toContain("grant execute")
  })

  it("preserves authenticated helper and frontend RPC execution", () => {
    expect(rlsPoliciesMigration).toMatch(
      /grant execute on function public\.app_current_demo_user_id\(\) to authenticated\b/,
    )
    expect(rlsPoliciesMigration).toMatch(
      /grant execute on function public\.app_is_project_member\(text\) to authenticated\b/,
    )
    expect(rpcFunctionsMigration).toMatch(
      /grant execute on function public\.create_issue_from_finding\(uuid, uuid, jsonb\) to authenticated\b/,
    )
    expect(rpcFunctionsMigration).toMatch(
      /grant execute on function public\.record_finding_decision\(uuid, text, uuid, text\) to authenticated\b/,
    )
    expect(rpcFunctionsMigration).toMatch(
      /grant execute on function public\.update_issue_status\(uuid, text, uuid, text\) to authenticated\b/,
    )
    expect(removeIssueMigration).toMatch(
      /grant execute on function public\.remove_issue_from_tracker\(uuid, uuid\) to authenticated\b/,
    )

    for (const signature of [
      "public.app_current_demo_user_id()",
      "public.app_is_project_member(text)",
      "public.create_issue_from_finding(uuid, uuid, jsonb)",
      "public.record_finding_decision(uuid, text, uuid, text)",
      "public.update_issue_status(uuid, text, uuid, text)",
      "public.remove_issue_from_tracker(uuid, uuid)",
    ]) {
      expect(hardeningMigration).not.toContain(
        `revoke execute on function ${signature} from authenticated;`,
      )
    }
  })

  it("keeps app_next_issue_code owner-only after the migration chain", () => {
    expect(rlsHelpersMigration).toContain(
      "revoke all on function public.app_next_issue_code(text) from public, anon, authenticated;",
    )
    expect(rlsPoliciesMigration).toContain(
      "grant execute on function public.app_next_issue_code(text) to service_role;",
    )
    expect(hardeningMigration).toContain(
      "revoke execute on function public.app_next_issue_code(text) from service_role;",
    )
  })

  it("preserves existing PUBLIC and anonymous revocations", () => {
    for (const revoke of [
      "revoke all on function public.app_current_demo_user_id() from public, anon;",
      "revoke all on function public.app_is_project_member(text) from public, anon;",
    ]) {
      expect(rlsHelpersMigration).toContain(revoke)
    }

    for (const revoke of [
      "revoke all on function public.create_issue_from_finding(uuid, uuid, jsonb) from public, anon;",
      "revoke all on function public.record_finding_decision(uuid, text, uuid, text) from public, anon;",
      "revoke all on function public.update_issue_status(uuid, text, uuid, text) from public, anon;",
    ]) {
      expect(rpcFunctionsMigration).toContain(revoke)
    }

    expect(removeIssueMigration).toContain(
      "revoke all on function public.remove_issue_from_tracker(uuid, uuid) from public, anon;",
    )
  })

  it("leaves scan-state RPC ACLs unchanged", () => {
    for (const grant of [
      "grant execute on function public.begin_model_review_scan(text, uuid) to authenticated;",
      "grant execute on function public.complete_model_review_scan(text, uuid) to authenticated;",
      "grant execute on function public.clear_model_review_scan_results(text) to authenticated;",
    ]) {
      expect(scanStateMigration).toContain(grant)
    }

    expect(hardeningMigration).not.toMatch(
      /(?:begin_model_review_scan|complete_model_review_scan|clear_model_review_scan_results)/,
    )
  })
})

describe("ai_findings status migration", () => {
  const removeFollowUpStatusMigration = readFileSync(
    resolve(
      "supabase/migrations/20260705000001_remove_ai_finding_follow_up_status.sql",
    ),
    "utf8",
  )

  it("maps legacy follow-up finding statuses to active and removes the status from the constraint", () => {
    expect(removeFollowUpStatusMigration).toMatch(
      /update public\.ai_findings[\s\S]*set current_status = 'active'[\s\S]*where current_status = 'follow-up'/i,
    )
    expect(removeFollowUpStatusMigration).toContain(
      "check (current_status in ('active', 'issue-created', 'dismissed'))",
    )
    expect(removeFollowUpStatusMigration).not.toContain(
      "current_status in ('active', 'issue-created', 'dismissed', 'follow-up')",
    )
    expect(removeFollowUpStatusMigration).toContain(
      "check (decision_type in ('create_issue', 'dismiss', 'restore', 'remove_issue_link'))",
    )
    expect(removeFollowUpStatusMigration).not.toContain("mark_follow_up")
  })
})
