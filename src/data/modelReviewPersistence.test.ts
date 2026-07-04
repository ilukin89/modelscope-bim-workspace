import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ModelReviewIssue, ProjectData, ReviewIssue } from "@/types"

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}))

import {
  fetchPersistedModelReviewState,
  removePersistedModelReviewIssue,
} from "./modelReviewPersistence"

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

function createTableBuilder(rows: Array<Record<string, unknown>>) {
  let resultRows = [...rows]
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
    then: (
      resolve: (value: {
        data: Array<Record<string, unknown>>
        error: null
      }) => unknown,
    ) => Promise.resolve({ data: resultRows, error: null }).then(resolve),
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
